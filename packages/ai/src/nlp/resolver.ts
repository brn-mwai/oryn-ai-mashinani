import { GoogleGenerativeAI } from "@google/generative-ai";
import type { NLPIntent, NLPEntities } from "@oryn/types";

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
const gemini = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// Entity extraction result
export interface ExtractionResult {
  entities: ExtractedEntities;
  tokensUsed: number;
  durationMs: number;
}

// Raw extracted entities (before resolution)
export interface ExtractedEntities {
  clientName?: string;
  clientEmail?: string;
  amount?: number;
  currency?: string;
  dueDate?: string;
  channel?: string;
  claimTitle?: string;
  escalationLevel?: number;
  invoiceNumber?: string;
}

// Resolution result (after matching to database records)
export interface ResolutionResult {
  entities: NLPEntities;
  matchConfidence: {
    client?: number;
    claim?: number;
  };
  suggestions?: {
    clients?: ClientSuggestion[];
    claims?: ClaimSuggestion[];
  };
}

export interface ClientSuggestion {
  id: string;
  name: string;
  email?: string;
  matchScore: number;
}

export interface ClaimSuggestion {
  id: string;
  title: string;
  amount: number;
  clientName: string;
  matchScore: number;
}

// Entity extraction prompt
const EXTRACTION_PROMPT = `Extract entities from this user input for a debt collection platform.

User input: "{input}"

Extract these entities if present:
- clientName: Name of the client/debtor mentioned
- clientEmail: Email address if mentioned
- amount: Dollar/monetary amount (as number, no currency symbol)
- currency: Currency code if specified (USD, EUR, etc.)
- dueDate: Due date if mentioned (as ISO string YYYY-MM-DD)
- channel: Communication channel (email, sms, whatsapp)
- claimTitle: Title or description of the claim/invoice
- escalationLevel: Escalation level if mentioned (0-4)
- invoiceNumber: Invoice or reference number if mentioned

Respond in JSON format with only the entities that are explicitly mentioned:
{
  "clientName": "John Smith",
  "amount": 500,
  "channel": "email"
}

IMPORTANT:
- Only include entities that are explicitly or strongly implied in the input
- For amounts, parse variations like "$500", "500 dollars", "five hundred"
- For dates, convert to ISO format (YYYY-MM-DD)
- Leave out any entity that is not mentioned`;

/**
 * Extract entities from user input using AI
 */
export async function extractEntities(
  input: string
): Promise<ExtractionResult> {
  const startTime = Date.now();

  if (!gemini) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY not configured");
  }

  const model = gemini.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = EXTRACTION_PROMPT.replace("{input}", input);

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const usageMetadata = result.response.usageMetadata;
    const durationMs = Date.now() - startTime;

    // Parse JSON response
    let parsed: ExtractedEntities;
    try {
      const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || [null, text];
      parsed = JSON.parse(jsonMatch[1] || text);
    } catch {
      parsed = {};
    }

    // Clean and validate entities
    const entities = cleanExtractedEntities(parsed);

    return {
      entities,
      tokensUsed: usageMetadata?.totalTokenCount || 0,
      durationMs,
    };
  } catch (error) {
    console.error("Entity extraction error:", error);
    return {
      entities: {},
      tokensUsed: 0,
      durationMs: Date.now() - startTime,
    };
  }
}

/**
 * Clean and validate extracted entities
 */
function cleanExtractedEntities(raw: ExtractedEntities): ExtractedEntities {
  const cleaned: ExtractedEntities = {};

  if (raw.clientName && typeof raw.clientName === "string") {
    cleaned.clientName = raw.clientName.trim();
  }

  if (raw.clientEmail && typeof raw.clientEmail === "string") {
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(raw.clientEmail)) {
      cleaned.clientEmail = raw.clientEmail.toLowerCase().trim();
    }
  }

  if (raw.amount !== undefined) {
    const amount = Number(raw.amount);
    if (!isNaN(amount) && amount > 0) {
      cleaned.amount = amount;
    }
  }

  if (raw.currency && typeof raw.currency === "string") {
    const validCurrencies = ["USD", "EUR", "GBP", "CAD", "AUD", "USDC"];
    const normalized = raw.currency.toUpperCase();
    if (validCurrencies.includes(normalized)) {
      cleaned.currency = normalized;
    }
  }

  if (raw.dueDate && typeof raw.dueDate === "string") {
    // Try to parse as date
    const date = new Date(raw.dueDate);
    if (!isNaN(date.getTime())) {
      cleaned.dueDate = date.toISOString().split("T")[0];
    }
  }

  if (raw.channel && typeof raw.channel === "string") {
    const validChannels = ["email", "sms", "whatsapp"];
    const normalized = raw.channel.toLowerCase();
    if (validChannels.includes(normalized)) {
      cleaned.channel = normalized;
    }
  }

  if (raw.claimTitle && typeof raw.claimTitle === "string") {
    cleaned.claimTitle = raw.claimTitle.trim();
  }

  if (raw.escalationLevel !== undefined) {
    const level = Number(raw.escalationLevel);
    if (!isNaN(level) && level >= 0 && level <= 4) {
      cleaned.escalationLevel = Math.floor(level);
    }
  }

  if (raw.invoiceNumber && typeof raw.invoiceNumber === "string") {
    cleaned.invoiceNumber = raw.invoiceNumber.trim();
  }

  return cleaned;
}

/**
 * Calculate fuzzy match score between two strings (0-1)
 */
export function fuzzyMatchScore(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 1;

  // Check if one contains the other
  if (s1.includes(s2) || s2.includes(s1)) {
    return 0.9;
  }

  // Levenshtein distance based score
  const distance = levenshteinDistance(s1, s2);
  const maxLength = Math.max(s1.length, s2.length);

  if (maxLength === 0) return 1;

  return Math.max(0, 1 - distance / maxLength);
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;

  // Create a 2D array to store distances
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  // Initialize first row and column
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  // Fill the rest of the matrix
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j],     // Deletion
          dp[i][j - 1],     // Insertion
          dp[i - 1][j - 1]  // Substitution
        );
      }
    }
  }

  return dp[m][n];
}

/**
 * Resolve extracted entities to database records
 * This function would be called with actual database records
 */
export function resolveEntities(
  extracted: ExtractedEntities,
  clients: Array<{ id: string; name: string; email?: string }>,
  claims: Array<{ id: string; title: string; amount: number; clientId: string }>
): ResolutionResult {
  const result: ResolutionResult = {
    entities: {},
    matchConfidence: {},
    suggestions: {},
  };

  // Resolve client by name or email
  if (extracted.clientName || extracted.clientEmail) {
    const clientMatches = clients
      .map((client) => {
        let score = 0;

        if (extracted.clientName) {
          score = Math.max(score, fuzzyMatchScore(client.name, extracted.clientName));
        }

        if (extracted.clientEmail && client.email) {
          score = Math.max(
            score,
            client.email.toLowerCase() === extracted.clientEmail.toLowerCase() ? 1 : 0
          );
        }

        return { ...client, matchScore: score };
      })
      .filter((m) => m.matchScore > 0.5)
      .sort((a, b) => b.matchScore - a.matchScore);

    if (clientMatches.length > 0) {
      const bestMatch = clientMatches[0];

      if (bestMatch.matchScore >= 0.8) {
        // High confidence match
        result.entities.clientId = bestMatch.id;
        result.entities.clientName = bestMatch.name;
        result.matchConfidence.client = bestMatch.matchScore;
      } else {
        // Provide suggestions
        result.suggestions!.clients = clientMatches.slice(0, 3).map((m) => ({
          id: m.id,
          name: m.name,
          email: m.email,
          matchScore: m.matchScore,
        }));
      }
    }
  }

  // Resolve claim by amount, title, or client
  if (extracted.amount || extracted.claimTitle || result.entities.clientId) {
    const claimMatches = claims
      .map((claim) => {
        let score = 0;
        let scoreCount = 0;

        // Match by amount
        if (extracted.amount && claim.amount === extracted.amount) {
          score += 0.5;
          scoreCount++;
        }

        // Match by title
        if (extracted.claimTitle) {
          const titleScore = fuzzyMatchScore(claim.title, extracted.claimTitle);
          if (titleScore > 0.5) {
            score += titleScore * 0.3;
            scoreCount++;
          }
        }

        // Match by client
        if (result.entities.clientId && claim.clientId === result.entities.clientId) {
          score += 0.4;
          scoreCount++;
        }

        // Normalize score
        const normalizedScore = scoreCount > 0 ? score / Math.min(scoreCount, 2) : 0;

        const clientName = clients.find((c) => c.id === claim.clientId)?.name || "Unknown";

        return { ...claim, clientName, matchScore: normalizedScore };
      })
      .filter((m) => m.matchScore > 0.3)
      .sort((a, b) => b.matchScore - a.matchScore);

    if (claimMatches.length > 0) {
      const bestMatch = claimMatches[0];

      if (bestMatch.matchScore >= 0.7) {
        // High confidence match
        result.entities.claimId = bestMatch.id;
        result.matchConfidence.claim = bestMatch.matchScore;
      } else {
        // Provide suggestions
        result.suggestions!.claims = claimMatches.slice(0, 3).map((m) => ({
          id: m.id,
          title: m.title,
          amount: m.amount,
          clientName: m.clientName,
          matchScore: m.matchScore,
        }));
      }
    }
  }

  // Copy over other extracted entities
  if (extracted.amount) {
    result.entities.amount = extracted.amount;
  }

  if (extracted.channel) {
    result.entities.channel = extracted.channel;
  }

  if (extracted.dueDate) {
    result.entities.dueDate = new Date(extracted.dueDate).getTime();
  }

  return result;
}

/**
 * Get context-specific extraction based on intent
 */
export function getRequiredEntitiesForIntent(intent: NLPIntent): string[] {
  const requirements: Record<NLPIntent, string[]> = {
    SEND_REMINDER: ["clientId", "claimId"],
    CREATE_CLAIM: ["clientName", "amount"],
    CHECK_STATUS: ["claimId"],
    ESCALATE_CLAIM: ["claimId"],
    UPDATE_CLAIM: ["claimId"],
    PAUSE_CLAIM: ["claimId"],
    ADD_CLIENT: ["clientName"],
    REQUEST_PAYMENT: ["clientId", "amount"],
    WITHDRAW_FUNDS: ["amount"],
    GET_STATS: [],
    UNKNOWN: [],
  };

  return requirements[intent] || [];
}

/**
 * Check if all required entities are resolved for an intent
 */
export function hasRequiredEntities(
  intent: NLPIntent,
  entities: NLPEntities
): { complete: boolean; missing: string[] } {
  const required = getRequiredEntitiesForIntent(intent);
  const missing = required.filter((key) => {
    const value = entities[key as keyof NLPEntities];
    return value === undefined || value === null;
  });

  return {
    complete: missing.length === 0,
    missing,
  };
}
