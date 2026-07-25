import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;

export const openai = apiKey ? new OpenAI({ apiKey }) : null;

export function getOpenAI(): OpenAI {
  if (!openai) {
    throw new Error("OPENAI_API_KEY not configured");
  }
  return openai;
}

export function isOpenAIConfigured(): boolean {
  return !!openai;
}

// Parse document using GPT-4o with vision
export async function parseDocumentWithOpenAI(
  fileUrl: string,
  mimeType: string,
  extractFields?: string[]
): Promise<{
  content: string;
  extractedData: Record<string, unknown>;
  tokensUsed: number;
}> {
  const client = getOpenAI();

  // For images, we can use the URL directly
  // For PDFs, GPT-4o supports native PDF input
  const isImage = mimeType.startsWith("image/");
  const isPdf = mimeType === "application/pdf";

  if (!isImage && !isPdf) {
    throw new Error(`Unsupported mime type for OpenAI: ${mimeType}`);
  }

  const extractionPrompt = extractFields
    ? `Extract the following fields: ${extractFields.join(", ")}`
    : "Extract all relevant business information including parties, amounts, dates, and key terms";

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    {
      role: "user",
      content: [
        {
          type: "text",
          text: `Analyze this document and provide:
1. A detailed summary of the content
2. ${extractionPrompt}

Respond in JSON format with keys: "summary", "extractedData"`,
        },
        {
          type: "image_url",
          image_url: {
            url: fileUrl,
            detail: "high",
          },
        },
      ],
    },
  ];

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    messages,
    max_tokens: 4096,
    response_format: { type: "json_object" },
  });

  const text = response.choices[0]?.message?.content ?? "";
  const usage = response.usage;

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = { summary: text, extractedData: {} };
  }

  return {
    content: parsed.summary || text,
    extractedData: parsed.extractedData || {},
    tokensUsed: usage?.total_tokens || 0,
  };
}

// Generate message using GPT-4o
export async function generateMessageWithOpenAI(
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
  const client = getOpenAI();

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

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a professional debt collection assistant. Generate payment reminders.
Tone: ${toneInstructions[tone]}
Channel: ${channelInstructions[channel]}
Respond in JSON format: { "subject": "..." (email only), "content": "..." }`,
      },
      {
        role: "user",
        content: `Generate a payment reminder for:
Client: ${context.clientName}
Amount: ${context.currency} ${context.amount.toFixed(2)}
${context.dueDate ? `Due: ${context.dueDate}` : ""}
${context.description ? `For: ${context.description}` : ""}
Escalation level: ${context.escalationLevel}
${includePaymentLink ? `Payment link: ${includePaymentLink}` : ""}`,
      },
    ],
    max_tokens: 500,
    response_format: { type: "json_object" },
  });

  const text = response.choices[0]?.message?.content ?? "";
  const usage = response.usage;

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = { content: text };
  }

  return {
    subject: channel === "email" ? parsed.subject : undefined,
    content: parsed.content || text,
    tokensUsed: usage?.total_tokens || 0,
  };
}

// Generate embedding using OpenAI
export async function generateEmbeddingWithOpenAI(
  text: string
): Promise<number[]> {
  const client = getOpenAI();

  const response = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
    dimensions: 1536,
  });

  return response.data[0].embedding;
}
