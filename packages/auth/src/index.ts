// Re-export Clerk components and utilities
export {
  ClerkProvider,
  SignIn,
  SignUp,
  SignedIn,
  SignedOut,
  UserButton as ClerkUserButton,
  UserProfile,
  OrganizationSwitcher,
  Protect,
  RedirectToSignIn,
  RedirectToSignUp,
} from "@clerk/nextjs";

export { dark } from "@clerk/themes";

// Re-export custom styled components
export {
  SignInPage,
  SignUpPage,
  SignInCompact,
  SignUpCompact,
  UserButton,
  ProfilePage,
  Protected,
  AdminOnly,
  RequireAuth,
} from "./components";

// Re-export custom hooks
export * from "./hooks";

// Re-export middleware
export { authMiddleware, createAuthMiddleware, config } from "./middleware";

// Re-export server utilities
export * from "./server";

// Re-export webhook utilities
export * from "./webhook";

// Types
export type { User as ClerkUser, WebhookEvent } from "@clerk/nextjs/server";
export type { UserRole } from "./server";
export type { ClerkWebhookEventType, ClerkWebhookHandler } from "./webhook";
