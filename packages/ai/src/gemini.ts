import { GoogleGenerativeAI, Part } from "@google/generative-ai";

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

export const gemini = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export type MessageTone = "friendly" | "professional" | "firm" | "urgent";

// Parse document content using Gemini's multimodal capabilities
export async function parseDocument(
  fileUrl: string,
  mimeType: string,
  extractFields?: string[]
): Promise<{
  content: string;
  extractedData: Record<string, unknown>;
  tokensUsed: number;
}> {
  if (!gemini) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY not configured");
  }

  const model = gemini.getGenerativeModel({ model: "gemini-2.0-flash" });

  // Fetch the file and convert to base64
  const response = await fetch(fileUrl);
  const buffer = await response.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");

  const filePart: Part = {
    inlineData: {
      data: base64,
      mimeType,
    },
  };

  const extractionPrompt = extractFields
    ? `Extract the following fields: ${extractFields.join(", ")}`
    : "Extract all relevant business information including parties, amounts, dates, and key terms";

  const result = await model.generateContent([
    filePart,
    {
      text: `Analyze this document and provide:
1. A detailed summary of the content
2. ${extractionPrompt}

Respond in JSON format with keys: "summary", "extractedData"`,
    },
  ]);

  const text = result.response.text();
  const usageMetadata = result.response.usageMetadata;

  // Parse JSON response
  let parsed;
  try {
    // Extract JSON from potential markdown code blocks
    const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || [null, text];
    parsed = JSON.parse(jsonMatch[1] || text);
  } catch {
    parsed = { summary: text, extractedData: {} };
  }

  return {
    content: parsed.summary || text,
    extractedData: parsed.extractedData || {},
    tokensUsed: usageMetadata?.totalTokenCount || 0,
  };
}

// Generate collection message with configurable tone
export async function generateMessage(
  context: {
    clientName: string;
    amount: number;
    currency: string;
    dueDate?: string;
    description?: string;
    previousMessages?: string[];
    escalationLevel: number;
  },
  channel: "email" | "sms" | "whatsapp",
  tone: MessageTone,
  includePaymentLink?: string
): Promise<{
  subject?: string;
  content: string;
  tokensUsed: number;
}> {
  if (!gemini) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY not configured");
  }

  const model = gemini.getGenerativeModel({ model: "gemini-2.0-flash" });

  const toneInstructions = {
    friendly: "Be warm, understanding, and helpful. Focus on maintaining the relationship.",
    professional: "Be polite and business-like. Clear and concise.",
    firm: "Be direct and assertive. Emphasize the importance of payment.",
    urgent: "Convey urgency. Mention potential consequences if applicable.",
  };

  const channelInstructions = {
    email: "Write a formal email with a subject line. Use proper greeting and sign-off.",
    sms: "Write a concise SMS under 160 characters. Be direct but polite.",
    whatsapp: "Write a WhatsApp message. Can be slightly longer than SMS but keep it conversational.",
  };

  const escalationContext =
    context.escalationLevel > 0
      ? `This is escalation level ${context.escalationLevel}. Previous reminders have been sent.`
      : "This is the initial reminder.";

  const prompt = `Generate a payment reminder message.

Client: ${context.clientName}
Amount: ${context.currency} ${context.amount.toFixed(2)}
${context.dueDate ? `Due Date: ${context.dueDate}` : ""}
${context.description ? `Description: ${context.description}` : ""}
${escalationContext}

Channel: ${channel}
${channelInstructions[channel]}

Tone: ${tone}
${toneInstructions[tone]}

${includePaymentLink ? `Include this payment link: ${includePaymentLink}` : ""}

${context.previousMessages?.length ? `Previous messages sent:\n${context.previousMessages.join("\n---\n")}` : ""}

Respond in JSON format: { "subject": "..." (for email only), "content": "..." }`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const usageMetadata = result.response.usageMetadata;

  // Parse JSON response
  let parsed;
  try {
    const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || [null, text];
    parsed = JSON.parse(jsonMatch[1] || text);
  } catch {
    parsed = { content: text };
  }

  return {
    subject: channel === "email" ? parsed.subject : undefined,
    content: parsed.content || text,
    tokensUsed: usageMetadata?.totalTokenCount || 0,
  };
}

// Analyze whether to escalate a claim
export async function analyzeEscalation(
  context: {
    daysSinceDue: number;
    totalReminders: number;
    lastReminderDaysAgo: number;
    currentEscalationLevel: number;
    paymentHistory?: string;
    clientResponseHistory?: string;
  }
): Promise<{
  shouldEscalate: boolean;
  suggestedAction: string;
  reasoning: string;
  tokensUsed: number;
}> {
  if (!gemini) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY not configured");
  }

  const model = gemini.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `Analyze this debt collection situation and recommend next steps.

Days since payment was due: ${context.daysSinceDue}
Total reminders sent: ${context.totalReminders}
Days since last reminder: ${context.lastReminderDaysAgo}
Current escalation level: ${context.currentEscalationLevel} (0-4 scale)
${context.paymentHistory ? `Payment history: ${context.paymentHistory}` : ""}
${context.clientResponseHistory ? `Client response history: ${context.clientResponseHistory}` : ""}

Escalation levels:
0 - Initial friendly reminder
1 - Follow-up reminder
2 - Firm reminder with consequences mentioned
3 - Final notice before action
4 - Maximum escalation (legal/collection agency mention)

Respond in JSON format:
{
  "shouldEscalate": boolean,
  "suggestedAction": "description of recommended action",
  "reasoning": "explanation for the recommendation"
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const usageMetadata = result.response.usageMetadata;

  // Parse JSON response
  let parsed;
  try {
    const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || [null, text];
    parsed = JSON.parse(jsonMatch[1] || text);
  } catch {
    parsed = {
      shouldEscalate: context.daysSinceDue > 14 && context.lastReminderDaysAgo > 3,
      suggestedAction: "Send follow-up reminder",
      reasoning: "Based on timing analysis",
    };
  }

  return {
    shouldEscalate: parsed.shouldEscalate,
    suggestedAction: parsed.suggestedAction,
    reasoning: parsed.reasoning,
    tokensUsed: usageMetadata?.totalTokenCount || 0,
  };
}

// Generate embeddings for semantic search
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!gemini) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY not configured");
  }

  const model = gemini.getGenerativeModel({ model: "text-embedding-004" });
  const result = await model.embedContent(text);

  return result.embedding.values;
}
