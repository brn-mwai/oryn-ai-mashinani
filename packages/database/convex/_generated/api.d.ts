/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as agentSessions from "../agentSessions.js";
import type * as aiActions from "../aiActions.js";
import type * as claims from "../claims.js";
import type * as clients from "../clients.js";
import type * as documents from "../documents.js";
import type * as lib_userLimits from "../lib/userLimits.js";
import type * as messages from "../messages.js";
import type * as nlpCommands from "../nlpCommands.js";
import type * as notifications from "../notifications.js";
import type * as organizations from "../organizations.js";
import type * as paymentLinks from "../paymentLinks.js";
import type * as payments from "../payments.js";
import type * as referrals from "../referrals.js";
import type * as search from "../search.js";
import type * as seedDemo from "../seedDemo.js";
import type * as thoughtSignatures from "../thoughtSignatures.js";
import type * as transactions from "../transactions.js";
import type * as users from "../users.js";
import type * as wallets from "../wallets.js";
import type * as webhookEvents from "../webhookEvents.js";
import type * as workflows from "../workflows.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  agentSessions: typeof agentSessions;
  aiActions: typeof aiActions;
  claims: typeof claims;
  clients: typeof clients;
  documents: typeof documents;
  "lib/userLimits": typeof lib_userLimits;
  messages: typeof messages;
  nlpCommands: typeof nlpCommands;
  notifications: typeof notifications;
  organizations: typeof organizations;
  paymentLinks: typeof paymentLinks;
  payments: typeof payments;
  referrals: typeof referrals;
  search: typeof search;
  seedDemo: typeof seedDemo;
  thoughtSignatures: typeof thoughtSignatures;
  transactions: typeof transactions;
  users: typeof users;
  wallets: typeof wallets;
  webhookEvents: typeof webhookEvents;
  workflows: typeof workflows;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
