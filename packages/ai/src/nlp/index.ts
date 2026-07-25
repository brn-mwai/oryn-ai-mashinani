// NLP Pipeline exports

// Classifier - Intent classification
export {
  classifyIntent,
  classifyIntentsBatch,
  needsClarification,
  isHighRiskIntent,
  getIntentDescription,
  INTENT_DEFINITIONS,
  CONFIDENCE_THRESHOLDS,
  type ClassificationResult,
} from "./classifier";

// Resolver - Entity extraction and resolution
export {
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
} from "./resolver";

// Executor - Action planning and execution
export {
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
} from "./executor";

// Main pipeline function
export { processNLPCommand, processClarificationResponse, type NLPPipelineResult, type DatabaseContext } from "./pipeline";
