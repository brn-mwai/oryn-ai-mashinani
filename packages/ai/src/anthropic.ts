import Anthropic from "@anthropic-ai/sdk";

const apiKey = process.env.ANTHROPIC_API_KEY;

export const anthropic = apiKey ? new Anthropic({ apiKey }) : null;

export function getAnthropic(): Anthropic {
  if (!anthropic) {
    throw new Error("ANTHROPIC_API_KEY not configured");
  }
  return anthropic;
}

export function isAnthropicConfigured(): boolean {
  return !!anthropic;
}

// Parse document using Claude with vision
export async function parseDocumentWithClaude(
  fileUrl: string,
  mimeType: string,
  extractFields?: string[]
): Promise<{
  content: string;
  extractedData: Record<string, unknown>;
  tokensUsed: number;
}> {
  const client = getAnthropic();

  // Fetch the file and convert to base64
  const response = await fetch(fileUrl);
  const buffer = await response.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");

  // Claude vision only supports images, not PDFs directly
  // For PDFs, use Gemini instead (has native PDF support)
  if (mimeType === "application/pdf") {
    throw new Error("Claude does not support PDF parsing directly. Use Gemini for PDF documents.");
  }

  // Determine image media type
  let imageMediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
  if (mimeType === "image/jpeg" || mimeType === "image/jpg") {
    imageMediaType = "image/jpeg";
  } else if (mimeType === "image/png") {
    imageMediaType = "image/png";
  } else if (mimeType === "image/gif") {
    imageMediaType = "image/gif";
  } else if (mimeType === "image/webp") {
    imageMediaType = "image/webp";
  } else {
    throw new Error(`Unsupported mime type for Claude vision: ${mimeType}. Supported: jpeg, png, gif, webp`);
  }

  const extractionPrompt = extractFields
    ? `Extract the following fields: ${extractFields.join(", ")}`
    : "Extract all relevant business information including parties, amounts, dates, and key terms";

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: imageMediaType,
              data: base64,
            },
          },
          {
            type: "text",
            text: `Analyze this document and provide:
1. A detailed summary of the content
2. ${extractionPrompt}

Respond in JSON format with keys: "summary", "extractedData"`,
          },
        ],
      },
    ],
  });

  const textContent = message.content.find((c) => c.type === "text");
  const text = textContent?.type === "text" ? textContent.text : "";

  // Parse JSON from response
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
    tokensUsed: (message.usage.input_tokens || 0) + (message.usage.output_tokens || 0),
  };
}

// Generate message using Claude
export async function generateMessageWithClaude(
  context: {
    clientName: string;
    amount: number;
    currency: string;
    dueDate?: string;
    description?: string;
    escalationLevel: number;
  },
  channel: "email" | "sms" | "whatsapp",
  tone: "friendly" | "professional" | "firm" | "urgent",
  includePaymentLink?: string
): Promise<{
  subject?: string;
  content: string;
  tokensUsed: number;
}> {
  const client = getAnthropic();

  const toneInstructions = {
    friendly: "Be warm, understanding, and helpful.",
    professional: "Be polite and business-like.",
    firm: "Be direct and assertive.",
    urgent: "Convey urgency and importance.",
  };

  const channelInstructions = {
    email: "Write a formal email with subject line. Format: { subject, content }",
    sms: "Write a concise SMS under 160 characters.",
    whatsapp: "Write a conversational WhatsApp message.",
  };

  const message = await client.messages.create({
    model: "claude-haiku-3-5-20241022",
    max_tokens: 500,
    messages: [
      {
        role: "user",
        content: `You are a professional debt collection assistant. Generate payment reminders.
Tone: ${toneInstructions[tone]}
Channel: ${channelInstructions[channel]}

Generate a payment reminder for:
Client: ${context.clientName}
Amount: ${context.currency} ${context.amount.toFixed(2)}
${context.dueDate ? `Due: ${context.dueDate}` : ""}
${context.description ? `For: ${context.description}` : ""}
Escalation level: ${context.escalationLevel}
${includePaymentLink ? `Payment link: ${includePaymentLink}` : ""}

Respond in JSON format: { "subject": "..." (email only), "content": "..." }`,
      },
    ],
  });

  const textContent = message.content.find((c) => c.type === "text");
  const text = textContent?.type === "text" ? textContent.text : "";

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
    tokensUsed: (message.usage.input_tokens || 0) + (message.usage.output_tokens || 0),
  };
}

// Note: Claude doesn't have native embedding support
// Use Gemini or OpenAI for embeddings
