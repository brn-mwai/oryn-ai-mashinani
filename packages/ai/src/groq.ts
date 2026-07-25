import Groq from "groq-sdk";

const apiKey = process.env.GROQ_API_KEY;

export const groq = apiKey ? new Groq({ apiKey }) : null;

// ===========================================
// Groq Model Definitions
// ===========================================

export const GROQ_MODELS = {
  // ===== TOP TIER - Best for complex reasoning =====
  "llama-3.3-70b-versatile": {
    id: "llama-3.3-70b-versatile",
    name: "Llama 3.3 70B Versatile",
    provider: "Meta",
    contextWindow: 128000,
    maxOutput: 32768,
    bestFor: ["reasoning", "coding", "analysis", "general"],
    speed: "medium",
    tier: 1,
  },
  "openai/gpt-oss-120b": {
    id: "openai/gpt-oss-120b",
    name: "GPT OSS 120B",
    provider: "OpenAI",
    contextWindow: 128000,
    maxOutput: 16384,
    bestFor: ["reasoning", "complex-tasks", "coding"],
    speed: "slow",
    tier: 1,
  },
  "qwen/qwen3-32b": {
    id: "qwen/qwen3-32b",
    name: "Qwen 3 32B",
    provider: "Alibaba Cloud",
    contextWindow: 128000,
    maxOutput: 8192,
    bestFor: ["multilingual", "reasoning", "coding"],
    speed: "medium",
    tier: 1,
  },

  // ===== LLAMA 4 - Latest generation =====
  "meta-llama/llama-4-maverick-17b-128e-instruct": {
    id: "meta-llama/llama-4-maverick-17b-128e-instruct",
    name: "Llama 4 Maverick 17B",
    provider: "Meta",
    contextWindow: 128000,
    maxOutput: 8192,
    bestFor: ["instruction-following", "creative", "reasoning"],
    speed: "fast",
    tier: 1,
  },
  "meta-llama/llama-4-scout-17b-16e-instruct": {
    id: "meta-llama/llama-4-scout-17b-16e-instruct",
    name: "Llama 4 Scout 17B",
    provider: "Meta",
    contextWindow: 128000,
    maxOutput: 8192,
    bestFor: ["fast-reasoning", "coding", "analysis"],
    speed: "fast",
    tier: 1,
  },

  // ===== COMPOUND AI - Groq's multi-model system =====
  "groq/compound": {
    id: "groq/compound",
    name: "Groq Compound",
    provider: "Groq",
    contextWindow: 128000,
    maxOutput: 32768,
    bestFor: ["complex-reasoning", "multi-step", "tool-use"],
    speed: "medium",
    tier: 1,
  },
  "groq/compound-mini": {
    id: "groq/compound-mini",
    name: "Groq Compound Mini",
    provider: "Groq",
    contextWindow: 64000,
    maxOutput: 8192,
    bestFor: ["quick-tasks", "simple-reasoning"],
    speed: "fast",
    tier: 2,
  },

  // ===== FAST TIER - Quick responses =====
  "llama-3.1-8b-instant": {
    id: "llama-3.1-8b-instant",
    name: "Llama 3.1 8B Instant",
    provider: "Meta",
    contextWindow: 128000,
    maxOutput: 8192,
    bestFor: ["quick-tasks", "simple-generation", "low-latency"],
    speed: "instant",
    tier: 2,
  },
  "openai/gpt-oss-20b": {
    id: "openai/gpt-oss-20b",
    name: "GPT OSS 20B",
    provider: "OpenAI",
    contextWindow: 128000,
    maxOutput: 8192,
    bestFor: ["quick-reasoning", "general"],
    speed: "fast",
    tier: 2,
  },

  // ===== SAFETY & GUARDRAILS =====
  "meta-llama/llama-guard-4-12b": {
    id: "meta-llama/llama-guard-4-12b",
    name: "Llama Guard 4 12B",
    provider: "Meta",
    contextWindow: 8192,
    maxOutput: 1024,
    bestFor: ["content-moderation", "safety-check"],
    speed: "fast",
    tier: 3,
  },
  "meta-llama/llama-prompt-guard-2-22m": {
    id: "meta-llama/llama-prompt-guard-2-22m",
    name: "Llama Prompt Guard 22M",
    provider: "Meta",
    contextWindow: 4096,
    maxOutput: 512,
    bestFor: ["prompt-injection-detection", "security"],
    speed: "instant",
    tier: 3,
  },
  "meta-llama/llama-prompt-guard-2-86m": {
    id: "meta-llama/llama-prompt-guard-2-86m",
    name: "Llama Prompt Guard 86M",
    provider: "Meta",
    contextWindow: 4096,
    maxOutput: 512,
    bestFor: ["prompt-injection-detection", "security"],
    speed: "instant",
    tier: 3,
  },
  "openai/gpt-oss-safeguard-20b": {
    id: "openai/gpt-oss-safeguard-20b",
    name: "GPT OSS Safeguard 20B",
    provider: "OpenAI",
    contextWindow: 128000,
    maxOutput: 8192,
    bestFor: ["safe-generation", "content-filtering"],
    speed: "fast",
    tier: 2,
  },

  // ===== AUDIO - Whisper models =====
  "whisper-large-v3": {
    id: "whisper-large-v3",
    name: "Whisper Large V3",
    provider: "OpenAI",
    contextWindow: 0, // Audio model
    maxOutput: 0,
    bestFor: ["transcription", "audio-to-text"],
    speed: "medium",
    tier: 2,
  },
  "whisper-large-v3-turbo": {
    id: "whisper-large-v3-turbo",
    name: "Whisper Large V3 Turbo",
    provider: "OpenAI",
    contextWindow: 0, // Audio model
    maxOutput: 0,
    bestFor: ["fast-transcription", "audio-to-text"],
    speed: "fast",
    tier: 2,
  },

  // ===== SPECIALTY - Language specific =====
  "canopylabs/orpheus-v1-english": {
    id: "canopylabs/orpheus-v1-english",
    name: "Orpheus V1 English",
    provider: "Canopy Labs",
    contextWindow: 32000,
    maxOutput: 4096,
    bestFor: ["text-to-speech", "english"],
    speed: "fast",
    tier: 3,
  },
  "canopylabs/orpheus-arabic-saudi": {
    id: "canopylabs/orpheus-arabic-saudi",
    name: "Orpheus Arabic Saudi",
    provider: "Canopy Labs",
    contextWindow: 32000,
    maxOutput: 4096,
    bestFor: ["text-to-speech", "arabic"],
    speed: "fast",
    tier: 3,
  },
  "moonshotai/kimi-k2-instruct-0905": {
    id: "moonshotai/kimi-k2-instruct-0905",
    name: "Kimi K2 Instruct",
    provider: "Moonshot AI",
    contextWindow: 128000,
    maxOutput: 8192,
    bestFor: ["multilingual", "reasoning"],
    speed: "medium",
    tier: 2,
  },
} as const;

export type GroqModelId = keyof typeof GROQ_MODELS;

// ===========================================
// Model Selection Helpers
// ===========================================

// Default models for different use cases
export const GROQ_DEFAULT_MODELS = {
  // Primary model for complex tasks
  primary: "llama-3.3-70b-versatile" as GroqModelId,

  // Fast model for quick tasks
  fast: "llama-3.1-8b-instant" as GroqModelId,

  // Best for reasoning
  reasoning: "groq/compound" as GroqModelId,

  // Best for coding
  coding: "meta-llama/llama-4-maverick-17b-128e-instruct" as GroqModelId,

  // Content moderation
  safety: "meta-llama/llama-guard-4-12b" as GroqModelId,

  // Prompt injection detection
  promptGuard: "meta-llama/llama-prompt-guard-2-86m" as GroqModelId,

  // Audio transcription
  transcription: "whisper-large-v3-turbo" as GroqModelId,

  // Multilingual
  multilingual: "qwen/qwen3-32b" as GroqModelId,
};

// Get best model for a specific task
export function getBestModelForTask(
  task: "general" | "fast" | "reasoning" | "coding" | "safety" | "transcription" | "multilingual"
): GroqModelId {
  switch (task) {
    case "fast":
      return GROQ_DEFAULT_MODELS.fast;
    case "reasoning":
      return GROQ_DEFAULT_MODELS.reasoning;
    case "coding":
      return GROQ_DEFAULT_MODELS.coding;
    case "safety":
      return GROQ_DEFAULT_MODELS.safety;
    case "transcription":
      return GROQ_DEFAULT_MODELS.transcription;
    case "multilingual":
      return GROQ_DEFAULT_MODELS.multilingual;
    case "general":
    default:
      return GROQ_DEFAULT_MODELS.primary;
  }
}

// ===========================================
// Core Functions
// ===========================================

// Generate message using Groq (fallback for Gemini)
export async function generateMessageWithGroq(
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
  includePaymentLink?: string,
  model: GroqModelId = GROQ_DEFAULT_MODELS.primary
): Promise<{
  subject?: string;
  content: string;
  tokensUsed: number;
  model: string;
}> {
  if (!groq) {
    throw new Error("GROQ_API_KEY not configured");
  }

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

  const completion = await groq.chat.completions.create({
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
    model,
    temperature: 0.7,
    max_tokens: 500,
    response_format: { type: "json_object" },
  });

  const text = completion.choices[0]?.message?.content || "";
  const usage = completion.usage;

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
    model,
  };
}

// Fast completion for simple tasks
export async function quickCompletion(
  prompt: string,
  systemPrompt?: string,
  model: GroqModelId = GROQ_DEFAULT_MODELS.fast
): Promise<{
  content: string;
  tokensUsed: number;
  model: string;
}> {
  if (!groq) {
    throw new Error("GROQ_API_KEY not configured");
  }

  const messages: { role: "system" | "user"; content: string }[] = [];

  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }
  messages.push({ role: "user", content: prompt });

  const completion = await groq.chat.completions.create({
    messages,
    model,
    temperature: 0.7,
    max_tokens: 1000,
  });

  return {
    content: completion.choices[0]?.message?.content || "",
    tokensUsed: completion.usage?.total_tokens || 0,
    model,
  };
}

// Complex reasoning with compound model
export async function complexReasoning(
  prompt: string,
  systemPrompt?: string
): Promise<{
  content: string;
  tokensUsed: number;
  model: string;
}> {
  return quickCompletion(prompt, systemPrompt, GROQ_DEFAULT_MODELS.reasoning);
}

// Check content safety
export async function checkContentSafety(
  content: string
): Promise<{
  safe: boolean;
  categories: string[];
  confidence: number;
}> {
  if (!groq) {
    throw new Error("GROQ_API_KEY not configured");
  }

  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: "user",
        content: `Analyze this content for safety. Respond in JSON: { "safe": boolean, "categories": string[], "confidence": number }

Content: ${content}`,
      },
    ],
    model: GROQ_DEFAULT_MODELS.safety,
    temperature: 0,
    max_tokens: 200,
    response_format: { type: "json_object" },
  });

  try {
    return JSON.parse(completion.choices[0]?.message?.content || '{"safe": true, "categories": [], "confidence": 0.5}');
  } catch {
    return { safe: true, categories: [], confidence: 0.5 };
  }
}

// Check for prompt injection
export async function checkPromptInjection(
  prompt: string
): Promise<{
  isInjection: boolean;
  confidence: number;
  reason?: string;
}> {
  if (!groq) {
    throw new Error("GROQ_API_KEY not configured");
  }

  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    model: GROQ_DEFAULT_MODELS.promptGuard,
    temperature: 0,
    max_tokens: 100,
  });

  const response = completion.choices[0]?.message?.content?.toLowerCase() || "";

  // Llama Prompt Guard returns "safe" or "unsafe" with explanation
  const isInjection = response.includes("unsafe") || response.includes("injection");

  return {
    isInjection,
    confidence: isInjection ? 0.9 : 0.1,
    reason: isInjection ? response : undefined,
  };
}

// Transcribe audio using Whisper
export async function transcribeAudio(
  audioUrl: string,
  language?: string
): Promise<{
  text: string;
  duration?: number;
  model: string;
}> {
  if (!groq) {
    throw new Error("GROQ_API_KEY not configured");
  }

  // Fetch the audio file
  const response = await fetch(audioUrl);
  const audioBuffer = await response.arrayBuffer();
  const audioFile = new File([audioBuffer], "audio.mp3", { type: "audio/mpeg" });

  const transcription = await groq.audio.transcriptions.create({
    file: audioFile,
    model: GROQ_DEFAULT_MODELS.transcription,
    language,
  });

  return {
    text: transcription.text,
    model: GROQ_DEFAULT_MODELS.transcription,
  };
}

// Generate simple embedding using Groq (placeholder)
export async function generateEmbeddingWithGroq(text: string): Promise<number[]> {
  // Groq doesn't have native embedding support
  // This is a placeholder that returns a simple hash-based embedding
  // In production, use Gemini or OpenAI for embeddings
  const hash = text.split("").reduce((acc, char) => {
    return acc + char.charCodeAt(0);
  }, 0);

  // Generate a pseudo-embedding of 1536 dimensions
  const embedding = new Array(1536).fill(0).map((_, i) => {
    return Math.sin(hash + i) * Math.cos(i / 100);
  });

  return embedding;
}

// ===========================================
// Utility Functions
// ===========================================

export function isGroqConfigured(): boolean {
  return !!apiKey;
}

export function getAvailableModels(): typeof GROQ_MODELS {
  return GROQ_MODELS;
}

export function getModelInfo(modelId: GroqModelId) {
  return GROQ_MODELS[modelId];
}
