// Gemini exports
export { gemini, parseDocument, generateMessage, analyzeEscalation, generateEmbedding } from "./gemini";

// Groq exports
export { groq, generateMessageWithGroq, generateEmbeddingWithGroq } from "./groq";

// OpenAI exports
export { openai, parseDocumentWithOpenAI, generateMessageWithOpenAI, generateEmbeddingWithOpenAI, isOpenAIConfigured } from "./openai";

// Anthropic/Claude exports
export { anthropic, parseDocumentWithClaude, generateMessageWithClaude, isAnthropicConfigured } from "./anthropic";

// Unified AI client with fallbacks
export { aiClient, type AIModel } from "./client";

// NLP Pipeline exports
export {
  // Main pipeline
  processNLPCommand,
  processClarificationResponse,
  type NLPPipelineResult,
  type DatabaseContext,

  // Classifier
  classifyIntent,
  classifyIntentsBatch,
  needsClarification,
  isHighRiskIntent,
  getIntentDescription,
  INTENT_DEFINITIONS,
  CONFIDENCE_THRESHOLDS,
  type ClassificationResult,

  // Resolver
  extractEntities,
  resolveEntities,
  fuzzyMatchScore,
  getRequiredEntitiesForIntent,
  hasRequiredEntities,
  type ExtractionResult,
  type ExtractedEntities,
  type ResolutionResult,
  type ClientSuggestion,
  type ClaimSuggestion,

  // Executor
  generateActionPlan,
  updateActionStatus,
  generateResponse,
  validateAgainstLimits,
  getNextAction,
  isPlanComplete,
  hasPlanFailed,
  HIGH_RISK_THRESHOLDS,
  type ActionPlan,
  type ExecutionContext,
} from "./nlp";

// Marathon Agent exports
export {
  MarathonAgent,
  createMarathonAgent,
  runMarathonAgent,
  type ThinkingLevel,
  type AgentAction,
  type ThoughtSignature,
  type AgentConfig,
  type AgentResult,
} from "./marathon-agent";
