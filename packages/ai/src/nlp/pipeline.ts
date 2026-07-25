import type { NLPIntent, NLPEntities, NLPAction, NLPCommandStatus } from "@oryn/types";
import {
  classifyIntent,
  needsClarification,
  isHighRiskIntent,
  type ClassificationResult,
} from "./classifier";
import {
  extractEntities,
  resolveEntities,
  hasRequiredEntities,
  type ExtractedEntities,
  type ResolutionResult,
} from "./resolver";
import {
  generateActionPlan,
  validateAgainstLimits,
  type ActionPlan,
  type ExecutionContext,
} from "./executor";

/**
 * Full NLP pipeline result
 */
export interface NLPPipelineResult {
  // Input
  rawInput: string;

  // Classification
  intent: NLPIntent;
  confidence: number;

  // Entities
  extractedEntities: ExtractedEntities;
  resolvedEntities: NLPEntities;

  // Resolution info
  resolutionResult?: ResolutionResult;

  // Action plan
  actionPlan: ActionPlan;

  // Status
  status: NLPCommandStatus;
  requiresConfirmation: boolean;
  confirmationMessage?: string;

  // Clarification (if needed)
  clarificationNeeded: boolean;
  clarificationQuestions?: string[];

  // Metrics
  tokensUsed: number;
  durationMs: number;
  model: string;
}

/**
 * Database context for entity resolution
 */
export interface DatabaseContext {
  clients: Array<{ id: string; name: string; email?: string }>;
  claims: Array<{ id: string; title: string; amount: number; clientId: string }>;
}

/**
 * Process a natural language command through the full NLP pipeline
 *
 * Pipeline Steps:
 * 1. Intent Classification - Determine what the user wants to do
 * 2. Entity Extraction - Pull out relevant entities (names, amounts, etc.)
 * 3. Entity Resolution - Match entities to database records
 * 4. Action Planning - Generate a plan of actions to execute
 * 5. Validation - Check limits and permissions
 */
export async function processNLPCommand(
  input: string,
  context: ExecutionContext,
  database?: DatabaseContext
): Promise<NLPPipelineResult> {
  const startTime = Date.now();
  let totalTokens = 0;

  // Step 1: Classify intent
  const classification = await classifyIntent(input);
  totalTokens += classification.tokensUsed;

  // Step 2: Extract entities
  const extraction = await extractEntities(input);
  totalTokens += extraction.tokensUsed;

  // Step 3: Resolve entities (if database context provided)
  let resolutionResult: ResolutionResult | undefined;
  let resolvedEntities: NLPEntities = {
    ...extraction.entities,
    clientName: extraction.entities.clientName,
    amount: extraction.entities.amount,
    channel: extraction.entities.channel,
    dueDate: extraction.entities.dueDate
      ? new Date(extraction.entities.dueDate).getTime()
      : undefined,
  };

  if (database) {
    resolutionResult = resolveEntities(
      extraction.entities,
      database.clients,
      database.claims
    );
    resolvedEntities = {
      ...resolvedEntities,
      ...resolutionResult.entities,
    };
  }

  // Step 4: Check if we have all required entities
  const entityCheck = hasRequiredEntities(classification.intent, resolvedEntities);
  const clarificationNeeded =
    needsClarification(classification.confidence) || !entityCheck.complete;

  // Generate clarification questions if needed
  const clarificationQuestions = clarificationNeeded
    ? generateClarificationQuestions(classification, entityCheck.missing, resolutionResult)
    : undefined;

  // Step 5: Generate action plan
  const actionPlan = generateActionPlan(
    classification.intent,
    resolvedEntities,
    context
  );

  // Step 6: Validate against limits
  const limitValidation = validateAgainstLimits(actionPlan, context);
  if (!limitValidation.valid) {
    actionPlan.requiresConfirmation = true;
    actionPlan.confirmationMessage = limitValidation.error;
  }

  // Determine final status
  let status: NLPCommandStatus = "processing";
  if (clarificationNeeded) {
    status = "awaiting_confirmation";
  } else if (actionPlan.requiresConfirmation || isHighRiskIntent(classification.intent)) {
    status = "awaiting_confirmation";
  }

  const durationMs = Date.now() - startTime;

  return {
    rawInput: input,
    intent: classification.intent,
    confidence: classification.confidence,
    extractedEntities: extraction.entities,
    resolvedEntities,
    resolutionResult,
    actionPlan,
    status,
    requiresConfirmation: actionPlan.requiresConfirmation || clarificationNeeded,
    confirmationMessage: actionPlan.confirmationMessage,
    clarificationNeeded,
    clarificationQuestions,
    tokensUsed: totalTokens,
    durationMs,
    model: "gemini-2.0-flash",
  };
}

/**
 * Generate clarification questions based on what's missing
 */
function generateClarificationQuestions(
  classification: ClassificationResult,
  missingEntities: string[],
  resolution?: ResolutionResult
): string[] {
  const questions: string[] = [];

  // Low confidence classification
  if (needsClarification(classification.confidence)) {
    questions.push(
      `I'm not entirely sure what you'd like to do. Did you mean to ${getIntentQuestion(classification.intent)}?`
    );
  }

  // Missing required entities
  for (const entity of missingEntities) {
    questions.push(getMissingEntityQuestion(entity));
  }

  // Ambiguous client resolution
  if (resolution?.suggestions?.clients && resolution.suggestions.clients.length > 1) {
    const clientNames = resolution.suggestions.clients
      .map((c) => c.name)
      .join(", ");
    questions.push(
      `Which client did you mean? I found: ${clientNames}`
    );
  }

  // Ambiguous claim resolution
  if (resolution?.suggestions?.claims && resolution.suggestions.claims.length > 1) {
    const claimDescriptions = resolution.suggestions.claims
      .map((c) => `${c.title} ($${c.amount})`)
      .join(", ");
    questions.push(
      `Which claim are you referring to? I found: ${claimDescriptions}`
    );
  }

  return questions;
}

/**
 * Get a human-readable question for an intent
 */
function getIntentQuestion(intent: NLPIntent): string {
  const questions: Record<NLPIntent, string> = {
    SEND_REMINDER: "send a payment reminder",
    CREATE_CLAIM: "create a new claim",
    CHECK_STATUS: "check the status of a claim",
    ESCALATE_CLAIM: "escalate a claim",
    UPDATE_CLAIM: "update a claim",
    PAUSE_CLAIM: "pause collection on a claim",
    ADD_CLIENT: "add a new client",
    REQUEST_PAYMENT: "request a payment",
    WITHDRAW_FUNDS: "withdraw your funds",
    GET_STATS: "view your statistics",
    UNKNOWN: "do something else",
  };

  return questions[intent] || "do something else";
}

/**
 * Get a question for a missing entity
 */
function getMissingEntityQuestion(entity: string): string {
  const questions: Record<string, string> = {
    clientId: "Which client is this for?",
    clientName: "What's the client's name?",
    claimId: "Which claim are you referring to?",
    amount: "What's the amount?",
    channel: "How would you like to send this? (email, SMS, or WhatsApp)",
    dueDate: "When is this due?",
  };

  return questions[entity] || `What's the ${entity}?`;
}

/**
 * Process user response to clarification questions
 */
export async function processClarificationResponse(
  originalResult: NLPPipelineResult,
  response: string,
  context: ExecutionContext,
  database?: DatabaseContext
): Promise<NLPPipelineResult> {
  // Extract entities from the response
  const extraction = await extractEntities(response);

  // Merge with original entities
  const mergedEntities: ExtractedEntities = {
    ...originalResult.extractedEntities,
    ...extraction.entities,
  };

  // Resolve again with merged entities
  let resolvedEntities = originalResult.resolvedEntities;
  let resolutionResult = originalResult.resolutionResult;

  if (database) {
    resolutionResult = resolveEntities(
      mergedEntities,
      database.clients,
      database.claims
    );
    resolvedEntities = {
      ...resolvedEntities,
      ...resolutionResult.entities,
    };
  }

  // Check if we now have all required entities
  const entityCheck = hasRequiredEntities(originalResult.intent, resolvedEntities);
  const clarificationNeeded = !entityCheck.complete;

  // Regenerate action plan
  const actionPlan = generateActionPlan(
    originalResult.intent,
    resolvedEntities,
    context
  );

  // Determine final status
  let status: NLPCommandStatus = "processing";
  if (clarificationNeeded) {
    status = "awaiting_confirmation";
  } else if (actionPlan.requiresConfirmation) {
    status = "awaiting_confirmation";
  }

  return {
    ...originalResult,
    extractedEntities: mergedEntities,
    resolvedEntities,
    resolutionResult,
    actionPlan,
    status,
    requiresConfirmation: actionPlan.requiresConfirmation || clarificationNeeded,
    confirmationMessage: actionPlan.confirmationMessage,
    clarificationNeeded,
    clarificationQuestions: clarificationNeeded
      ? generateClarificationQuestions(
          { intent: originalResult.intent, confidence: 1, rawIntentString: originalResult.intent, tokensUsed: 0, durationMs: 0 },
          entityCheck.missing,
          resolutionResult
        )
      : undefined,
    tokensUsed: originalResult.tokensUsed + extraction.tokensUsed,
    durationMs: originalResult.durationMs,
  };
}
