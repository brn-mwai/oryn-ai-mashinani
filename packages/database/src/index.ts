// Re-export Convex utilities
export { ConvexProvider, ConvexReactClient } from "convex/react";
export { useQuery, useMutation, useAction } from "convex/react";

// Re-export generated API for function references
export { api, internal } from "../convex/_generated/api";

// Re-export schema for type inference
export type { DataModel } from "../convex/_generated/dataModel";
export type { Id } from "../convex/_generated/dataModel";
