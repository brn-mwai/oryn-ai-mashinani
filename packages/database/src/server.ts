// Server-safe exports (no React context)
export { api, internal } from "../convex/_generated/api";

// Re-export schema for type inference
export type { DataModel } from "../convex/_generated/dataModel";
export type { Id } from "../convex/_generated/dataModel";
