import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks/(.*)",
  "/api/public/(.*)",
]);

// Admin routes that require admin role
const isAdminRoute = createRouteMatcher([
  "/admin(.*)",
]);

// Helper to get role from session claims
function getRoleFromClaims(sessionClaims: Record<string, unknown> | null): string | undefined {
  if (!sessionClaims) return undefined;
  const metadata = sessionClaims.metadata as Record<string, unknown> | undefined;
  return metadata?.role as string | undefined;
}

// Default auth middleware
export const authMiddleware = clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();

  // Allow public routes
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // Require authentication for all other routes
  if (!userId) {
    return (await auth()).redirectToSignIn();
  }

  // Check admin routes
  if (isAdminRoute(req)) {
    const role = getRoleFromClaims(sessionClaims as Record<string, unknown> | null);
    if (role !== "admin" && role !== "super_admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
});

// Custom middleware creator for apps with different route configs
export function createAuthMiddleware(config: {
  publicRoutes?: string[];
  adminRoutes?: string[];
  afterSignInUrl?: string;
  afterSignUpUrl?: string;
}) {
  const publicMatcher = createRouteMatcher(config.publicRoutes ?? ["/"]);
  const adminMatcher = createRouteMatcher(config.adminRoutes ?? []);

  return clerkMiddleware(async (auth, req) => {
    const { userId, sessionClaims } = await auth();

    if (publicMatcher(req)) {
      return NextResponse.next();
    }

    if (!userId) {
      return (await auth()).redirectToSignIn();
    }

    if (adminMatcher(req)) {
      const role = getRoleFromClaims(sessionClaims as Record<string, unknown> | null);
      if (role !== "admin" && role !== "super_admin") {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }

    return NextResponse.next();
  });
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
