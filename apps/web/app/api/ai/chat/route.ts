import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@oryn/database/server";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Provider configurations
const PROVIDERS = {
  groq: {
    url: "https://api.groq.com/openai/v1/chat/completions",
    apiKey: process.env.GROQ_API_KEY,
  },
  gemini: {
    url: "https://generativelanguage.googleapis.com/v1beta/models",
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  },
  claude: {
    url: "https://api.anthropic.com/v1/messages",
    apiKey: process.env.ANTHROPIC_API_KEY,
  },
};

// ============================================================
// SYSTEM PROMPTS - STRICT DATA USAGE
// ============================================================

const ASK_AI_SYSTEM_PROMPT = `You are **Oryn AI**, the intelligent assistant for Oryn - an AI-powered payment collection platform.

## CRITICAL RULES - YOU MUST FOLLOW THESE:

1. **ONLY USE THE DATA PROVIDED BELOW** - Never invent, fabricate, or hallucinate any data
2. If no data exists (0 claims, 0 clients), say "You don't have any [claims/clients] yet"
3. If data is incomplete, acknowledge what's missing
4. Always reference REAL claim titles, client names, and amounts from the provided data
5. Use the exact IDs provided when suggesting actions

## YOUR REAL DATA (This is the ONLY data you can reference):

{CONTEXT}

## AVAILABLE CLAIM IDs FOR ACTIONS:
{CLAIM_IDS}

## AVAILABLE CLIENT IDs FOR ACTIONS:
{CLIENT_IDS}

## How to Respond:

### When showing claims:
- Only list claims that exist in "Recent Claims" or "Overdue Claims" above
- Use exact titles and amounts shown
- Reference the claim ID if user wants to take action

### When showing clients:
- Only list clients from "Client Portfolio" above
- Use exact names, owed amounts, and statuses shown

### When user asks about data you don't have:
- Say "Based on your current data, I can see [what you have]"
- Don't make up fake examples

### Formatting:
- Use markdown tables for comparisons
- Use bullet points for lists
- Be concise and actionable

Remember: You are showing the user THEIR REAL DATA. Every name, amount, and status must come from the context provided above.`;

const AGENT_MODE_SYSTEM_PROMPT = `You are **Oryn AI Agent**, the autonomous execution engine for Oryn. In Agent Mode, you take REAL actions using REAL data.

## CRITICAL RULES:

1. **ONLY USE THE REAL DATA PROVIDED BELOW** - Never invent claims, clients, or amounts
2. When executing actions, use the EXACT IDs provided
3. Show what you're doing step by step
4. Confirm before sending messages to clients

## YOUR REAL DATA:

{CONTEXT}

## AVAILABLE CLAIMS (Use these IDs for actions):
{CLAIM_IDS}

## AVAILABLE CLIENTS (Use these IDs for actions):
{CLIENT_IDS}

## Actions You Can Execute:

When user wants to take action, respond with an ACTION block that I will execute:

### To send a reminder:
\`\`\`action
{
  "type": "send_message",
  "claimId": "[REAL_CLAIM_ID]",
  "channel": "email",
  "autoGenerate": true
}
\`\`\`

### To create a payment link:
\`\`\`action
{
  "type": "create_payment_link",
  "claimId": "[REAL_CLAIM_ID]",
  "expiresInDays": 7
}
\`\`\`

### To escalate a claim:
\`\`\`action
{
  "type": "escalate_claim",
  "claimId": "[REAL_CLAIM_ID]"
}
\`\`\`

### To send bulk reminders:
\`\`\`action
{
  "type": "send_bulk_reminders",
  "channel": "email",
  "limit": 5
}
\`\`\`

## Response Format for Actions:

1. First, acknowledge what the user wants
2. Show which REAL claims/clients you'll act on (using data above)
3. Include the action block with REAL IDs
4. Explain what will happen

Example:
"I'll send a reminder for **[REAL Claim Title]** ($[REAL Amount]) to **[REAL Client Name]**.

\`\`\`action
{"type": "send_message", "claimId": "[REAL_ID]", "channel": "email", "autoGenerate": true}
\`\`\`

This will send a Level [X] escalation email with a payment link."

## If No Data Exists:
- Say "You don't have any claims/clients to act on yet"
- Suggest creating claims first
- Don't pretend to act on fake data`;

// ============================================================
// DATA FETCHING WITH FULL DETAILS
// ============================================================

interface ClaimData {
  _id: string;
  title: string;
  amount: number;
  amountPaid: number;
  currency: string;
  status: string;
  escalationLevel: number;
  dueDate?: number;
  clientId: string;
  clientName?: string;
}

interface ClientData {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  totalOwed: number;
  totalPaid: number;
  status: string;
}

interface UserContextData {
  user: any;
  claimsStats: any;
  claims: ClaimData[];
  overdueClaims: ClaimData[];
  clients: ClientData[];
  wallet: any;
}

async function fetchUserContext(userId: string): Promise<{
  contextString: string;
  claimIds: string;
  clientIds: string;
  data: UserContextData | null
}> {
  try {
    const user = await convex.query(api.users.getByClerkId, { clerkId: userId });

    if (!user) {
      return {
        contextString: "No user data found. Please ensure you're logged in.",
        claimIds: "No claims available.",
        clientIds: "No clients available.",
        data: null
      };
    }

    // Fetch all data in parallel
    const [claimsStats, claimsResult, clientsResult, wallet, messagesStats] = await Promise.all([
      convex.query(api.claims.getStats, { userId: user._id }).catch(() => null),
      convex.query(api.claims.list, { userId: user._id, limit: 50 }).catch(() => ({ data: [] })),
      convex.query(api.clients.list, { userId: user._id, limit: 50 }).catch(() => ({ data: [] })),
      convex.query(api.wallets.getOverview, { userId: user._id }).catch(() => null),
      convex.query(api.messages.getStatsByUser, { userId: user._id }).catch(() => null),
    ]);

    const claims: ClaimData[] = (claimsResult?.data || []).map((c: any) => ({
      _id: c._id,
      title: c.title,
      amount: c.amount,
      amountPaid: c.amountPaid || 0,
      currency: c.currency || "USD",
      status: c.status,
      escalationLevel: c.escalationLevel || 0,
      dueDate: c.dueDate,
      clientId: c.clientId,
    }));

    const clients: ClientData[] = (clientsResult?.data || []).map((c: any) => ({
      _id: c._id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      totalOwed: c.totalOwed || 0,
      totalPaid: c.totalPaid || 0,
      status: c.status || "active",
    }));

    // Match client names to claims
    const clientMap = new Map(clients.map(c => [c._id, c.name]));
    claims.forEach(claim => {
      claim.clientName = clientMap.get(claim.clientId) || "Unknown Client";
    });

    const now = Date.now();
    const overdueClaims = claims.filter(c =>
      c.status === "active" && c.dueDate && c.dueDate < now
    );

    // Build context string with REAL data
    const userName = user.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "User";

    let contextString = `
## User: ${userName}
**Plan:** ${user.subscriptionTier || "Starter"} | **Account:** ${user.userType || "Individual"} | **Since:** ${new Date(user._creationTime).toLocaleDateString()}

## Performance Summary
| Metric | Value |
|--------|-------|
| Total Claims | ${claimsStats?.totalClaims ?? 0} |
| Active Claims | ${claimsStats?.activeClaims ?? 0} |
| Collected | ${claimsStats?.collectedClaims ?? 0} |
| Total Owed | $${(claimsStats?.totalOwed ?? 0).toLocaleString()} |
| Total Collected | $${(claimsStats?.totalCollected ?? 0).toLocaleString()} |
| Collection Rate | ${(claimsStats?.collectionRate ?? 0).toFixed(1)}% |
`;

    // Add overdue claims section
    if (overdueClaims.length > 0) {
      contextString += `\n## ⚠️ Overdue Claims (${overdueClaims.length} need attention)\n`;
      overdueClaims.forEach((c, i) => {
        const daysOverdue = Math.floor((now - (c.dueDate || now)) / (1000 * 60 * 60 * 24));
        contextString += `${i + 1}. **${c.title}** | Client: ${c.clientName} | $${c.amount.toLocaleString()} | ${daysOverdue} days overdue | Level ${c.escalationLevel}\n`;
      });
    } else {
      contextString += `\n## ✅ No Overdue Claims\n`;
    }

    // Add all claims section
    if (claims.length > 0) {
      contextString += `\n## All Claims (${claims.length} total)\n`;
      contextString += `| Title | Client | Amount | Status | Level |\n|-------|--------|--------|--------|-------|\n`;
      claims.slice(0, 15).forEach(c => {
        contextString += `| ${c.title} | ${c.clientName} | $${c.amount.toLocaleString()} | ${c.status} | ${c.escalationLevel} |\n`;
      });
    } else {
      contextString += `\n## No Claims Yet\nYou haven't created any claims. Create your first claim to start collecting!\n`;
    }

    // Add clients section
    if (clients.length > 0) {
      contextString += `\n## Clients (${clients.length} total)\n`;
      contextString += `| Name | Email | Owed | Paid | Status |\n|------|-------|------|------|--------|\n`;
      clients.slice(0, 15).forEach(c => {
        contextString += `| ${c.name} | ${c.email || "N/A"} | $${c.totalOwed.toLocaleString()} | $${c.totalPaid.toLocaleString()} | ${c.status} |\n`;
      });
    } else {
      contextString += `\n## No Clients Yet\nYou haven't added any clients. Add clients to create claims!\n`;
    }

    // Wallet info
    contextString += `\n## Wallet\n- Balance: $${(wallet?.wallet?.balance ?? 0).toLocaleString()}\n- Total Earnings: $${(wallet?.totalEarnings ?? 0).toLocaleString()}\n`;

    // Messaging stats
    contextString += `\n## Messages Sent\n- Email: ${messagesStats?.email ?? 0} | SMS: ${messagesStats?.sms ?? 0} | WhatsApp: ${messagesStats?.whatsapp ?? 0}\n`;

    // Build claim IDs reference
    let claimIds = "";
    if (claims.length > 0) {
      claimIds = claims.map(c => `- ID: \`${c._id}\` → "${c.title}" ($${c.amount}) - ${c.clientName}`).join("\n");
    } else {
      claimIds = "No claims available. User needs to create claims first.";
    }

    // Build client IDs reference
    let clientIds = "";
    if (clients.length > 0) {
      clientIds = clients.map(c => `- ID: \`${c._id}\` → "${c.name}" (${c.email || "no email"})`).join("\n");
    } else {
      clientIds = "No clients available. User needs to add clients first.";
    }

    return {
      contextString,
      claimIds,
      clientIds,
      data: {
        user,
        claimsStats,
        claims,
        overdueClaims,
        clients,
        wallet,
      }
    };
  } catch (error) {
    console.error("Error fetching user context:", error);
    return {
      contextString: `Error loading your data: ${error}. Please try again.`,
      claimIds: "Error loading claims.",
      clientIds: "Error loading clients.",
      data: null
    };
  }
}

// ============================================================
// ACTION EXECUTION
// ============================================================

async function executeAction(
  actionData: any,
  userData: UserContextData
): Promise<{ success: boolean; message: string; data?: any }> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ""}/api/ai/actions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: actionData.type,
        params: actionData,
      }),
    });

    const result = await response.json();
    return result;
  } catch (error: any) {
    return { success: false, message: `Action failed: ${error.message}` };
  }
}

// ============================================================
// AI PROVIDER CALLS
// ============================================================

async function callGroq(
  messages: any[],
  model: string,
  stream: boolean = true
): Promise<Response> {
  const response = await fetch(PROVIDERS.groq.url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${PROVIDERS.groq.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      stream,
      temperature: 0.3, // Lower for more factual responses
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq API error: ${response.status} - ${error}`);
  }

  return response;
}

async function callGemini(
  messages: any[],
  model: string,
  stream: boolean = true,
  images?: ProcessedDocument[]
): Promise<Response> {
  const apiKey = PROVIDERS.gemini.apiKey;
  const url = `${PROVIDERS.gemini.url}/${model}:${stream ? "streamGenerateContent" : "generateContent"}?key=${apiKey}&alt=sse`;

  const contents = messages.filter(m => m.role !== "system").map((m, idx) => {
    const parts: any[] = [{ text: m.content }];

    // Add images to the last user message
    if (m.role === "user" && images && images.length > 0 && idx === messages.filter(msg => msg.role !== "system").length - 1) {
      images.forEach(img => {
        if (img.base64 && img.type === "image") {
          parts.push({
            inlineData: {
              mimeType: img.mimeType,
              data: img.base64,
            },
          });
        }
      });
    }

    return {
      role: m.role === "assistant" ? "model" : "user",
      parts,
    };
  });

  const systemInstruction = messages.find(m => m.role === "system")?.content;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents,
      systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 4096,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${error}`);
  }

  return response;
}

async function callClaude(
  messages: any[],
  model: string,
  stream: boolean = true,
  images?: ProcessedDocument[]
): Promise<Response> {
  const systemMessage = messages.find(m => m.role === "system")?.content || "";
  const chatMessages = messages.filter(m => m.role !== "system").map((m, idx) => {
    // Check if this is the last user message and we have images
    if (m.role === "user" && images && images.length > 0 && idx === messages.filter(msg => msg.role !== "system").length - 1) {
      const content: any[] = [];

      // Add images first
      images.forEach(img => {
        if (img.base64 && img.type === "image") {
          content.push({
            type: "image",
            source: {
              type: "base64",
              media_type: img.mimeType,
              data: img.base64,
            },
          });
        }
      });

      // Add the text message
      content.push({
        type: "text",
        text: m.content,
      });

      return {
        role: m.role,
        content,
      };
    }

    return {
      role: m.role,
      content: m.content,
    };
  });

  const response = await fetch(PROVIDERS.claude.url, {
    method: "POST",
    headers: {
      "x-api-key": PROVIDERS.claude.apiKey!,
      "Content-Type": "application/json",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      system: systemMessage,
      messages: chatMessages,
      stream,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error: ${response.status} - ${error}`);
  }

  return response;
}

// ============================================================
// DOCUMENT PROCESSING
// ============================================================

interface ProcessedDocument {
  type: "image" | "pdf" | "text" | "other";
  name: string;
  size: number;
  mimeType: string;
  base64?: string;
  textContent?: string;
  description: string;
}

async function fileToBase64(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  let binary = "";
  for (let i = 0; i < uint8Array.length; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  return btoa(binary);
}

async function extractTextFromFile(file: File): Promise<string> {
  // For text-based files, read the content
  if (
    file.type === "text/plain" ||
    file.type === "text/csv" ||
    file.name.endsWith(".txt") ||
    file.name.endsWith(".csv")
  ) {
    const text = await file.text();
    return text.slice(0, 10000); // Limit to 10K chars
  }
  return "";
}

async function processDocument(file: File): Promise<ProcessedDocument> {
  const base = {
    name: file.name,
    size: file.size,
    mimeType: file.type,
  };

  // Handle images - convert to base64 for vision models
  if (file.type.startsWith("image/")) {
    const base64 = await fileToBase64(file);
    return {
      ...base,
      type: "image",
      base64,
      description: `Image: ${file.name} (${(file.size / 1024).toFixed(1)}KB) - Ready for visual analysis`,
    };
  }

  // Handle PDFs - extract text if possible
  if (file.type === "application/pdf") {
    // For PDFs, we'll describe them and let the AI know to ask for text
    return {
      ...base,
      type: "pdf",
      description: `PDF Document: ${file.name} (${(file.size / 1024).toFixed(1)}KB) - Please analyze based on filename and context. For full content, the user should copy-paste the text.`,
    };
  }

  // Handle text files
  if (file.type.startsWith("text/") || file.name.match(/\.(txt|csv|json|md)$/i)) {
    const textContent = await extractTextFromFile(file);
    return {
      ...base,
      type: "text",
      textContent,
      description: `Text Document: ${file.name} (${(file.size / 1024).toFixed(1)}KB)`,
    };
  }

  // Handle spreadsheets
  if (file.name.match(/\.(xlsx|xls)$/i)) {
    return {
      ...base,
      type: "other",
      description: `Spreadsheet: ${file.name} (${(file.size / 1024).toFixed(1)}KB) - Please describe what you need extracted from this file.`,
    };
  }

  // Other files
  return {
    ...base,
    type: "other",
    description: `File: ${file.name} (${file.type}, ${(file.size / 1024).toFixed(1)}KB)`,
  };
}

// Document analysis prompt for invoices and contracts
const DOCUMENT_ANALYSIS_PROMPT = `
When analyzing an uploaded document (invoice, contract, receipt, etc.), extract and report:

For INVOICES:
- Invoice number
- Date (issue date and due date)
- Vendor/Sender name and contact
- Client/Recipient name
- Line items (description, quantity, unit price, total)
- Subtotal, taxes, total amount
- Payment terms and methods
- Currency

For CONTRACTS:
- Contract type (service agreement, NDA, etc.)
- Parties involved
- Effective date and term/duration
- Key obligations
- Payment terms
- Important clauses (termination, liability, etc.)
- Signatures/status

Present the extracted data in a clear, structured format that can be used to create claims or client records.
`;

// ============================================================
// MAIN API HANDLER
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const message = formData.get("message") as string;
    const model = formData.get("model") as string;
    const provider = formData.get("provider") as "groq" | "gemini" | "claude";
    const mode = formData.get("mode") as "ask" | "agent";
    const conversationHistory = JSON.parse(
      (formData.get("conversationHistory") as string) || "[]"
    );

    // Process any uploaded files
    const files: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (key.startsWith("file_") && value instanceof File) {
        files.push(value);
      }
    }

    const processedDocs: ProcessedDocument[] = [];
    let fileContext = "";
    let hasImages = false;

    if (files.length > 0) {
      const processed = await Promise.all(files.map(processDocument));
      processedDocs.push(...processed);

      // Check if we have images
      hasImages = processed.some(d => d.type === "image" && d.base64);

      // Build text context for files
      const textDescriptions = processed.map(d => {
        if (d.textContent) {
          return `**${d.name}:**\n\`\`\`\n${d.textContent.slice(0, 5000)}\n\`\`\``;
        }
        return d.description;
      });

      fileContext = "\n\n## Uploaded Documents:\n" + textDescriptions.join("\n\n");

      // Add document analysis instructions if we have images (likely invoices/contracts)
      if (hasImages) {
        fileContext += "\n\n" + DOCUMENT_ANALYSIS_PROMPT;
      }
    }

    // Validate provider API key
    const apiKey = PROVIDERS[provider]?.apiKey;
    if (!apiKey) {
      return NextResponse.json(
        { error: `${provider} API key not configured` },
        { status: 500 }
      );
    }

    // Get user context from database
    const { contextString, claimIds, clientIds, data: userData } = await fetchUserContext(userId);

    // Select appropriate system prompt
    const basePrompt = mode === "agent" ? AGENT_MODE_SYSTEM_PROMPT : ASK_AI_SYSTEM_PROMPT;

    // Build final system prompt with REAL data
    let systemPrompt = basePrompt
      .replace("{CONTEXT}", contextString + fileContext)
      .replace("{CLAIM_IDS}", claimIds)
      .replace("{CLIENT_IDS}", clientIds);

    // Build messages array
    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.slice(-10).map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
      { role: "user", content: message },
    ];

    // Create streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let response: Response;

          // Get image documents for vision-capable models
          const imageDocuments = processedDocs.filter(d => d.type === "image" && d.base64);

          switch (provider) {
            case "groq":
              // Groq doesn't support vision yet, just use text
              response = await callGroq(messages, model, true);
              break;
            case "gemini":
              // Gemini supports vision - pass images
              response = await callGemini(messages, model, true, imageDocuments.length > 0 ? imageDocuments : undefined);
              break;
            case "claude":
              // Claude supports vision - pass images
              response = await callClaude(messages, model, true, imageDocuments.length > 0 ? imageDocuments : undefined);
              break;
            default:
              throw new Error("Invalid provider");
          }

          const reader = response.body?.getReader();
          if (!reader) throw new Error("No response body");

          const decoder = new TextDecoder();
          let buffer = "";
          let fullResponse = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6).trim();
                if (data === "[DONE]" || !data) continue;

                try {
                  const parsed = JSON.parse(data);
                  let content = "";

                  if (provider === "groq") {
                    content = parsed.choices?.[0]?.delta?.content || "";
                  } else if (provider === "gemini") {
                    content = parsed.candidates?.[0]?.content?.parts?.[0]?.text || "";
                  } else if (provider === "claude") {
                    if (parsed.type === "content_block_delta") {
                      content = parsed.delta?.text || "";
                    }
                  }

                  if (content) {
                    fullResponse += content;
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
                    );
                  }
                } catch {
                  // Skip invalid JSON
                }
              }
            }
          }

          // Check for action blocks in agent mode and execute them
          if (mode === "agent" && fullResponse.includes("```action")) {
            const actionMatch = fullResponse.match(/```action\s*([\s\S]*?)```/);
            if (actionMatch && userData) {
              try {
                const actionData = JSON.parse(actionMatch[1].trim());

                // Send progress update
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({
                    content: "\n\n⏳ **Executing action...**\n",
                    isProgress: true
                  })}\n\n`)
                );

                // Execute the action
                const result = await executeAction(actionData, userData);

                // Send result
                const resultMessage = result.success
                  ? `\n✅ **Action completed:** ${result.message}`
                  : `\n❌ **Action failed:** ${result.message}`;

                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({
                    content: resultMessage,
                    actionResult: result
                  })}\n\n`)
                );
              } catch (e) {
                console.error("Action execution error:", e);
              }
            }
          }

          // Send completion signal
          const sources = [];
          if (userData) {
            sources.push({ title: "Your Oryn Database", type: "database" });
          }
          if (files.length > 0) {
            sources.push({ title: `${files.length} Document(s)`, type: "document" });
          }

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ done: true, sources })}\n\n`)
          );
          controller.close();
        } catch (error: any) {
          console.error("Streaming error:", error);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              content: `Error: ${error.message}. Please check your API keys are configured.`,
              done: true,
              error: true
            })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("AI Chat API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
