import { GoogleGenerativeAI } from "@google/generative-ai";
import type { NLPIntent } from "@oryn/types";

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
const gemini = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// Intent classification result
export interface ClassificationResult {
  intent: NLPIntent;
  confidence: number;
  rawIntentString: string;
  tokensUsed: number;
  durationMs: number;
}

// All supported intents with descriptions
export const INTENT_DEFINITIONS: Record<NLPIntent, string> = {
  SEND_REMINDER: "User wants to send a payment reminder to a client",
  CREATE_CLAIM: "User wants to create a new claim/invoice for a client",
  CHECK_STATUS: "User wants to check the status of a claim or get statistics",
  ESCALATE_CLAIM: "User wants to escalate a claim to a higher urgency level",
  UPDATE_CLAIM: "User wants to update details of an existing claim",
  PAUSE_CLAIM: "User wants to pause or resume collection on a claim",
  ADD_CLIENT: "User wants to add a new client/debtor to the system",
  REQUEST_PAYMENT: "User wants to request or initiate a payment from a client",
  WITHDRAW_FUNDS: "User wants to withdraw collected funds to their bank",
  GET_STATS: "User wants to see their dashboard statistics or analytics",
  UNKNOWN: "The intent could not be determined",
};

// Confidence thresholds
export const CONFIDENCE_THRESHOLDS = {
  HIGH: 0.85,     // Execute without confirmation
  MEDIUM: 0.65,   // May need clarification
  LOW: 0.4,       // Needs clarification
} as const;

// Classification prompt
const CLASSIFICATION_PROMPT = `You are an intent classifier for a debt collection platform called Oryn.

Classify the user's input into one of these intents:
- SEND_REMINDER: User wants to send a payment reminder to a client
- CREATE_CLAIM: User wants to create a new claim/invoice for a client
- CHECK_STATUS: User wants to check the status of a claim or get statistics
- ESCALATE_CLAIM: User wants to escalate a claim to a higher urgency level
- UPDATE_CLAIM: User wants to update details of an existing claim
- PAUSE_CLAIM: User wants to pause or resume collection on a claim
- ADD_CLIENT: User wants to add a new client/debtor to the system
- REQUEST_PAYMENT: User wants to request or initiate a payment from a client
- WITHDRAW_FUNDS: User wants to withdraw collected funds to their bank
- GET_STATS: User wants to see their dashboard statistics or analytics
- UNKNOWN: The intent could not be determined

User input: "{input}"

Respond in JSON format:
{
  "intent": "INTENT_NAME",
  "confidence": 0.95,
  "reasoning": "Brief explanation"
}

IMPORTANT:
- Confidence should be between 0 and 1
- Be conservative with confidence if the input is ambiguous
- Consider common variations and typos
- SEND_REMINDER and REQUEST_PAYMENT are similar but different:
  - SEND_REMINDER: Sending a message/notification
  - REQUEST_PAYMENT: Creating a payment link or payment request`;

/**
 * Classify user input into an intent
 */
export async function classifyIntent(
  input: string
): Promise<ClassificationResult> {
  const startTime = Date.now();

  if (!gemini) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY not configured");
  }

  const model = gemini.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = CLASSIFICATION_PROMPT.replace("{input}", input);

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const usageMetadata = result.response.usageMetadata;
    const durationMs = Date.now() - startTime;

    // Parse JSON response
    let parsed: { intent: string; confidence: number; reasoning?: string };
    try {
      const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || [null, text];
      parsed = JSON.parse(jsonMatch[1] || text);
    } catch {
      // Fallback if JSON parsing fails
      parsed = {
        intent: "UNKNOWN",
        confidence: 0,
        reasoning: "Failed to parse classification response",
      };
    }

    // Validate intent
    const validIntent = validateIntent(parsed.intent);
    const confidence = Math.max(0, Math.min(1, parsed.confidence || 0));

    return {
      intent: validIntent,
      confidence,
      rawIntentString: parsed.intent,
      tokensUsed: usageMetadata?.totalTokenCount || 0,
      durationMs,
    };
  } catch (error) {
    const durationMs = Date.now() - startTime;
    console.error("Intent classification error:", error);

    return {
      intent: "UNKNOWN",
      confidence: 0,
      rawIntentString: "ERROR",
      tokensUsed: 0,
      durationMs,
    };
  }
}

/**
 * Validate that an intent string is a valid NLPIntent
 */
function validateIntent(intentString: string): NLPIntent {
  const validIntents: NLPIntent[] = [
    "SEND_REMINDER",
    "CREATE_CLAIM",
    "CHECK_STATUS",
    "ESCALATE_CLAIM",
    "UPDATE_CLAIM",
    "PAUSE_CLAIM",
    "ADD_CLIENT",
    "REQUEST_PAYMENT",
    "WITHDRAW_FUNDS",
    "GET_STATS",
    "UNKNOWN",
  ];

  const normalized = intentString?.toUpperCase().trim();

  if (validIntents.includes(normalized as NLPIntent)) {
    return normalized as NLPIntent;
  }

  return "UNKNOWN";
}

/**
 * Determine if an intent requires user confirmation based on confidence
 */
export function needsClarification(confidence: number): boolean {
  return confidence < CONFIDENCE_THRESHOLDS.MEDIUM;
}

/**
 * Determine if an intent is high risk and should always require confirmation
 */
export function isHighRiskIntent(intent: NLPIntent): boolean {
  const highRiskIntents: NLPIntent[] = [
    "ESCALATE_CLAIM",
    "WITHDRAW_FUNDS",
  ];

  return highRiskIntents.includes(intent);
}

/**
 * Get a human-readable description of an intent
 */
export function getIntentDescription(intent: NLPIntent): string {
  return INTENT_DEFINITIONS[intent] || "Unknown intent";
}

/**
 * Batch classify multiple inputs (for efficiency)
 */
export async function classifyIntentsBatch(
  inputs: string[]
): Promise<ClassificationResult[]> {
  // Process in parallel with a concurrency limit
  const results = await Promise.all(
    inputs.map((input) => classifyIntent(input))
  );

  return results;
}
