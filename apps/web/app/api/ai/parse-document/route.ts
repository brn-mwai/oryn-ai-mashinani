import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@oryn/database/server";
import { checkRateLimit, RATE_LIMITS, getRateLimitHeaders } from "@/lib/rate-limit";
import Anthropic from "@anthropic-ai/sdk";
import { traceDocumentParsing, logger } from "@oryn/ai";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// The extraction prompt used by all providers
const EXTRACTION_PROMPT = `You are analyzing a business document (invoice, contract, receipt, or agreement) to extract information for creating a debt claim.

Extract the following information from this document:

1. **title**: A descriptive title for the claim (e.g., "Invoice #1234 - Web Development Services")
2. **description**: A brief summary of what the payment is for
3. **amount**: The total amount owed (numeric value only, no currency symbols)
4. **currency**: The currency code (KES, USD, EUR, GBP, CAD, AUD, or USDC) - default to KES if not specified
5. **clientName**: The name of the person or company who owes the money (the debtor/client)
6. **clientEmail**: Email address of the client if visible
7. **clientPhone**: Phone number of the client if visible
8. **dueDate**: Payment due date in YYYY-MM-DD format
9. **invoiceNumber**: Invoice or reference number if available
10. **items**: Array of line items with description and amount

Important:
- For invoices: The client is the "Bill To" or "Customer" - the one who should pay
- For contracts: The client is the party receiving services who needs to pay
- Extract the TOTAL amount due, not subtotals
- If due date is "Net 30" or similar, calculate from invoice date

Respond in valid JSON format:
{
  "summary": "Brief description of the document",
  "extractedData": {
    "title": "...",
    "description": "...",
    "amount": 1234.56,
    "currency": "USD",
    "clientName": "...",
    "clientEmail": "...",
    "clientPhone": "...",
    "dueDate": "YYYY-MM-DD",
    "invoiceNumber": "...",
    "items": [{"description": "...", "amount": 123.45}]
  }
}

Only include fields where you can confidently extract data. Omit fields that are not present in the document.`;

interface ParseResult {
  content: string;
  extractedData: {
    title?: string;
    description?: string;
    amount?: number;
    currency?: string;
    clientName?: string;
    clientEmail?: string;
    clientPhone?: string;
    dueDate?: string;
    invoiceNumber?: string;
    items?: Array<{ description: string; amount: number }>;
  };
  provider: string;
}

// Parse JSON from AI response
function parseJsonResponse(text: string): { summary: string; extractedData: Record<string, any> } {
  try {
    // Try to extract JSON from markdown code block
    const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }
    // Try to parse as raw JSON
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    if (jsonStart !== -1 && jsonEnd !== -1) {
      return JSON.parse(text.slice(jsonStart, jsonEnd + 1));
    }
    return JSON.parse(text);
  } catch {
    return { summary: text, extractedData: {} };
  }
}

// Provider 1: Claude (Anthropic)
async function parseWithClaude(base64: string, mimeType: string): Promise<ParseResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY not configured");
  }

  const anthropic = new Anthropic({ apiKey });

  // Determine content type based on mime type
  const isPdf = mimeType === "application/pdf";

  // Build the content array based on document type
  const contentArray: any[] = [];

  if (isPdf) {
    // For PDFs, use document type
    contentArray.push({
      type: "document",
      source: {
        type: "base64",
        media_type: "application/pdf",
        data: base64,
      },
    });
  } else {
    // For images, use image type
    const imageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    const mediaType = imageTypes.includes(mimeType) ? mimeType : "image/jpeg";

    contentArray.push({
      type: "image",
      source: {
        type: "base64",
        media_type: mediaType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
        data: base64,
      },
    });
  }

  contentArray.push({
    type: "text",
    text: EXTRACTION_PROMPT,
  });

  const result = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: contentArray,
      },
    ],
  });

  const text = result.content[0].type === "text" ? result.content[0].text : "";
  const parsed = parseJsonResponse(text);

  return {
    content: parsed.summary || text,
    extractedData: parsed.extractedData || {},
    provider: "claude-sonnet-4-20250514",
  };
}

// Provider 2: Groq with Llama Vision (vision-capable model)
async function parseWithGroq(base64: string, mimeType: string): Promise<ParseResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY not configured");
  }

  // Use Llama 4 Scout (multimodal) which supports images
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64}`,
              },
            },
            {
              type: "text",
              text: EXTRACTION_PROMPT,
            },
          ],
        },
      ],
      max_tokens: 4096,
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq Vision API error: ${error}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || "";
  const parsed = parseJsonResponse(text);

  return {
    content: parsed.summary || text,
    extractedData: parsed.extractedData || {},
    provider: "llama-4-scout",
  };
}


// Main parsing function with fallbacks and Opik tracing
async function parseDocumentForClaim(
  fileUrl: string,
  mimeType: string
): Promise<ParseResult> {
  // Fetch the file and convert to base64
  const response = await fetch(fileUrl);
  const buffer = await response.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");

  const providers = [
    { name: "Claude", model: "claude-sonnet-4-20250514", fn: () => parseWithClaude(base64, mimeType) },
    { name: "Groq Vision", model: "llama-4-scout", fn: () => parseWithGroq(base64, mimeType) },
  ];

  let lastError: Error | null = null;

  for (const provider of providers) {
    try {
      logger.info(`Trying ${provider.name} for document parsing`);
      // Wrap with Opik tracing for observability
      const result = await traceDocumentParsing(
        provider.model,
        mimeType,
        () => provider.fn()
      );
      logger.info(`Document parsed successfully with ${provider.name}`);
      return result;
    } catch (error: any) {
      logger.warn(`${provider.name} parsing failed`, { error: error.message });
      lastError = error;
      // Continue to next provider
    }
  }

  // All providers failed
  throw lastError || new Error("All AI providers failed");
}

// Parse a document using AI
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting
    const rateLimit = checkRateLimit(`ai:${userId}`, RATE_LIMITS.ai);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    const body = await request.json();
    const { documentId, fileUrl, mimeType } = body;

    // Support both document ID and direct file URL
    let docUrl = fileUrl;
    let docMimeType = mimeType;
    let docId = documentId;

    if (documentId) {
      // Get the Convex user
      const convexUser = await convex.query(api.users.getByClerkId, {
        clerkId: userId,
      });

      if (!convexUser) {
        return NextResponse.json(
          { error: "User not found in database" },
          { status: 404 }
        );
      }

      // Get the document
      const document = await convex.query(api.documents.get, {
        id: documentId,
      });

      if (!document) {
        return NextResponse.json(
          { error: "Document not found" },
          { status: 404 }
        );
      }

      if (document.userId !== convexUser._id) {
        return NextResponse.json(
          { error: "Unauthorized access to document" },
          { status: 403 }
        );
      }

      docUrl = document.url;
      docMimeType = document.mimeType;
    } else if (!fileUrl || !mimeType) {
      return NextResponse.json(
        { error: "Either documentId or fileUrl+mimeType required" },
        { status: 400 }
      );
    }

    // Parse the document with claim-specific extraction (with fallbacks)
    const result = await parseDocumentForClaim(docUrl, docMimeType);

    // Update document with parsed content if we have a document ID
    if (docId) {
      await convex.mutation(api.documents.updateParsedContent, {
        id: docId,
        parsedContent: result.content || "",
        extractedData: result.extractedData,
        parsingStatus: "completed",
        parsingModel: result.provider as any,
      });
    }

    return NextResponse.json({
      success: true,
      parsedContent: result.content,
      extractedData: result.extractedData,
      documentId: docId,
      provider: result.provider,
    });
  } catch (error: any) {
    logger.error("Document parsing error", { error: error.message || "unknown" });
    return NextResponse.json(
      { error: error.message || "Failed to parse document" },
      { status: 500 }
    );
  }
}
