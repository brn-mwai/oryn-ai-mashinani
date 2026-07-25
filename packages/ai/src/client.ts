import { parseDocument, generateMessage, analyzeEscalation, generateEmbedding } from "./gemini";
import { generateMessageWithGroq, generateEmbeddingWithGroq } from "./groq";
import { parseDocumentWithOpenAI, generateMessageWithOpenAI, generateEmbeddingWithOpenAI, isOpenAIConfigured } from "./openai";
import { parseDocumentWithClaude, generateMessageWithClaude, isAnthropicConfigured } from "./anthropic";

export type AIModel =
  | "gemini-2.0-flash"
  | "gemini-1.5-pro"
  | "gpt-4o"
  | "gpt-4o-mini"
  | "claude-sonnet-4-20250514"
  | "claude-haiku"
  | "llama-3.3-70b"
  | "ocr-groq";

export class AIClient {
  private useGemini: boolean;
  private useGroq: boolean;
  private useOpenAI: boolean;
  private useAnthropic: boolean;

  constructor() {
    this.useGemini = !!process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    this.useGroq = !!process.env.GROQ_API_KEY;
    this.useOpenAI = isOpenAIConfigured();
    this.useAnthropic = isAnthropicConfigured();
  }

  async parseDocument(
    fileUrl: string,
    mimeType: string,
    extractFields?: string[]
  ): Promise<{
    content: string;
    extractedData: Record<string, unknown>;
    tokensUsed: number;
    model: AIModel;
    fallbackUsed: boolean;
  }> {
    const errors: string[] = [];

    // Try Gemini first (primary)
    if (this.useGemini) {
      try {
        const result = await parseDocument(fileUrl, mimeType, extractFields);
        return { ...result, model: "gemini-2.0-flash", fallbackUsed: false };
      } catch (error) {
        errors.push(`Gemini: ${error instanceof Error ? error.message : "Unknown error"}`);
        console.warn("Gemini parsing failed, trying Claude:", error);
      }
    }

    // Try Claude (first fallback)
    if (this.useAnthropic) {
      try {
        const result = await parseDocumentWithClaude(fileUrl, mimeType, extractFields);
        return { ...result, model: "claude-sonnet-4-20250514", fallbackUsed: true };
      } catch (error) {
        errors.push(`Claude: ${error instanceof Error ? error.message : "Unknown error"}`);
        console.warn("Claude parsing failed, trying OpenAI:", error);
      }
    }

    // Try OpenAI (second fallback - optional)
    if (this.useOpenAI) {
      try {
        const result = await parseDocumentWithOpenAI(fileUrl, mimeType, extractFields);
        return { ...result, model: "gpt-4o", fallbackUsed: true };
      } catch (error) {
        errors.push(`OpenAI: ${error instanceof Error ? error.message : "Unknown error"}`);
        console.warn("OpenAI parsing failed:", error);
      }
    }

    // All parsers failed
    throw new Error(`Document parsing failed. Errors: ${errors.join("; ")}`);
  }

  async generateMessage(
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
    tone: "friendly" | "professional" | "firm" | "urgent",
    includePaymentLink?: string,
    preferredModel?: AIModel
  ): Promise<{
    subject?: string;
    content: string;
    tokensUsed: number;
    model: AIModel;
    fallbackUsed: boolean;
  }> {
    const errors: string[] = [];

    // Try preferred model first if specified
    if (preferredModel) {
      try {
        if (preferredModel.startsWith("gemini") && this.useGemini) {
          const result = await generateMessage(context, channel, tone, includePaymentLink);
          return { ...result, model: "gemini-2.0-flash", fallbackUsed: false };
        }
        if (preferredModel.startsWith("gpt") && this.useOpenAI) {
          const result = await generateMessageWithOpenAI(context, channel, tone, includePaymentLink);
          return { ...result, model: "gpt-4o-mini", fallbackUsed: false };
        }
        if (preferredModel.startsWith("claude") && this.useAnthropic) {
          const result = await generateMessageWithClaude(context, channel, tone, includePaymentLink);
          return { ...result, model: "claude-haiku", fallbackUsed: false };
        }
        if (preferredModel.startsWith("llama") && this.useGroq) {
          const result = await generateMessageWithGroq(context, channel, tone, includePaymentLink);
          return { ...result, model: "llama-3.3-70b", fallbackUsed: false };
        }
      } catch (error) {
        errors.push(`${preferredModel}: ${error instanceof Error ? error.message : "Unknown error"}`);
        console.warn(`Preferred model ${preferredModel} failed, trying fallbacks:`, error);
      }
    }

    // Try Gemini first (primary)
    if (this.useGemini) {
      try {
        const result = await generateMessage(context, channel, tone, includePaymentLink);
        return { ...result, model: "gemini-2.0-flash", fallbackUsed: !!preferredModel };
      } catch (error) {
        errors.push(`Gemini: ${error instanceof Error ? error.message : "Unknown error"}`);
        console.warn("Gemini failed, trying Groq:", error);
      }
    }

    // Try Groq (fast, cheap)
    if (this.useGroq) {
      try {
        const result = await generateMessageWithGroq(context, channel, tone, includePaymentLink);
        return { ...result, model: "llama-3.3-70b", fallbackUsed: true };
      } catch (error) {
        errors.push(`Groq: ${error instanceof Error ? error.message : "Unknown error"}`);
        console.warn("Groq failed, trying OpenAI:", error);
      }
    }

    // Try OpenAI
    if (this.useOpenAI) {
      try {
        const result = await generateMessageWithOpenAI(context, channel, tone, includePaymentLink);
        return { ...result, model: "gpt-4o-mini", fallbackUsed: true };
      } catch (error) {
        errors.push(`OpenAI: ${error instanceof Error ? error.message : "Unknown error"}`);
        console.warn("OpenAI failed, trying Claude:", error);
      }
    }

    // Try Claude
    if (this.useAnthropic) {
      try {
        const result = await generateMessageWithClaude(context, channel, tone, includePaymentLink);
        return { ...result, model: "claude-haiku", fallbackUsed: true };
      } catch (error) {
        errors.push(`Claude: ${error instanceof Error ? error.message : "Unknown error"}`);
        console.warn("Claude failed:", error);
      }
    }

    throw new Error(`Message generation failed. Errors: ${errors.join("; ")}`);
  }

  async analyzeEscalation(context: {
    daysSinceDue: number;
    totalReminders: number;
    lastReminderDaysAgo: number;
    currentEscalationLevel: number;
    paymentHistory?: string;
    clientResponseHistory?: string;
  }) {
    if (!this.useGemini) {
      // Fallback to simple rules-based logic
      return {
        shouldEscalate:
          context.daysSinceDue > 14 &&
          context.lastReminderDaysAgo > 3 &&
          context.currentEscalationLevel < 4,
        suggestedAction: this.getSuggestedAction(context.currentEscalationLevel),
        reasoning: "Based on timing rules",
        tokensUsed: 0,
      };
    }
    return analyzeEscalation(context);
  }

  private getSuggestedAction(level: number): string {
    const actions = [
      "Send friendly reminder",
      "Send follow-up reminder",
      "Send firm reminder with consequences",
      "Send final notice",
      "Consider external collection",
    ];
    return actions[Math.min(level + 1, 4)];
  }

  async generateEmbedding(text: string): Promise<{ embedding: number[]; model: string }> {
    // Try Gemini first (native embedding support)
    if (this.useGemini) {
      try {
        const embedding = await generateEmbedding(text);
        return { embedding, model: "text-embedding-004" };
      } catch (error) {
        console.warn("Gemini embedding failed, trying OpenAI:", error);
      }
    }

    // Try OpenAI (good embeddings)
    if (this.useOpenAI) {
      try {
        const embedding = await generateEmbeddingWithOpenAI(text);
        return { embedding, model: "text-embedding-3-small" };
      } catch (error) {
        console.warn("OpenAI embedding failed, trying Groq:", error);
      }
    }

    // Groq fallback (pseudo-embedding)
    if (this.useGroq) {
      const embedding = await generateEmbeddingWithGroq(text);
      return { embedding, model: "groq-pseudo" };
    }

    throw new Error("No embedding provider configured");
  }

  isAvailable(): boolean {
    return this.useGemini || this.useGroq || this.useOpenAI || this.useAnthropic;
  }

  getAvailableModels(): AIModel[] {
    const models: AIModel[] = [];
    if (this.useGemini) {
      models.push("gemini-2.0-flash", "gemini-1.5-pro");
    }
    if (this.useOpenAI) {
      models.push("gpt-4o", "gpt-4o-mini");
    }
    if (this.useAnthropic) {
      models.push("claude-sonnet-4-20250514", "claude-haiku");
    }
    if (this.useGroq) {
      models.push("llama-3.3-70b");
    }
    return models;
  }

  getProviderStatus(): {
    gemini: boolean;
    openai: boolean;
    anthropic: boolean;
    groq: boolean;
  } {
    return {
      gemini: this.useGemini,
      openai: this.useOpenAI,
      anthropic: this.useAnthropic,
      groq: this.useGroq,
    };
  }
}

export const aiClient = new AIClient();
