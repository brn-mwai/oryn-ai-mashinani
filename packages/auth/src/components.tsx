"use client";

import { SignIn, SignUp, UserButton as ClerkUserButton, UserProfile } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";
import { useAuth, usePermission } from "./hooks";

interface AuthPageProps {
  afterSignInUrl?: string;
  afterSignUpUrl?: string;
  signUpUrl?: string;
  signInUrl?: string;
}

// Shared appearance configuration for consistent styling
const getAppearance = (isDark: boolean) => ({
  baseTheme: isDark ? dark : undefined,
  variables: {
    // Colors - using CSS variables from your design system
    colorPrimary: "hsl(0 0% 9%)",
    colorBackground: isDark ? "hsl(0 0% 3.9%)" : "hsl(0 0% 100%)",
    colorInputBackground: isDark ? "hsl(0 0% 14.9%)" : "hsl(0 0% 100%)",
    colorInputText: isDark ? "hsl(0 0% 98%)" : "hsl(0 0% 3.9%)",
    colorText: isDark ? "hsl(0 0% 98%)" : "hsl(0 0% 3.9%)",
    colorTextSecondary: isDark ? "hsl(0 0% 63.9%)" : "hsl(0 0% 45.1%)",
    colorDanger: "hsl(0 84.2% 60.2%)",
    colorSuccess: "hsl(142.1 76.2% 36.3%)",
    colorWarning: "hsl(38 92% 50%)",

    // Border radius - matching your design system
    borderRadius: "0.5rem",

    // Typography
    fontFamily: "inherit",
    fontFamilyButtons: "inherit",
    fontSize: "0.875rem",
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },

    // Spacing
    spacingUnit: "1rem",
  },
  elements: {
    // Root container
    rootBox: "w-full",

    // Card styling - clean, modern look
    card: `
      shadow-none
      border border-border
      bg-card
      rounded-xl
      p-0
    `,
    cardBox: "shadow-none",

    // Header
    headerTitle: `
      text-2xl
      font-bold
      tracking-tight
      text-foreground
    `,
    headerSubtitle: `
      text-muted-foreground
      text-sm
      mt-1
    `,

    // Social buttons - styled like your buttons
    socialButtonsBlockButton: `
      border
      border-input
      bg-background
      hover:bg-accent
      hover:text-accent-foreground
      transition-colors
      rounded-lg
      font-medium
      text-sm
      py-2.5
    `,
    socialButtonsBlockButtonText: "font-medium",
    socialButtonsProviderIcon: "w-5 h-5",

    // Divider
    dividerLine: "bg-border",
    dividerText: "text-muted-foreground text-xs uppercase tracking-wider",

    // Form fields - matching shadcn input style
    formFieldLabel: `
      text-sm
      font-medium
      text-foreground
      mb-1.5
    `,
    formFieldInput: `
      flex
      h-10
      w-full
      rounded-md
      border
      border-input
      bg-background
      px-3
      py-2
      text-sm
      ring-offset-background
      transition-colors
      file:border-0
      file:bg-transparent
      file:text-sm
      file:font-medium
      placeholder:text-muted-foreground
      focus-visible:outline-none
      focus-visible:ring-2
      focus-visible:ring-ring
      focus-visible:ring-offset-2
      disabled:cursor-not-allowed
      disabled:opacity-50
    `,
    formFieldInputShowPasswordButton: "text-muted-foreground hover:text-foreground",
    formFieldHintText: "text-muted-foreground text-xs mt-1",
    formFieldErrorText: "text-destructive text-xs mt-1",
    formFieldSuccessText: "text-green-600 dark:text-green-400 text-xs mt-1",

    // Primary button - matching your button style
    formButtonPrimary: `
      inline-flex
      items-center
      justify-center
      whitespace-nowrap
      rounded-md
      text-sm
      font-medium
      ring-offset-background
      transition-colors
      focus-visible:outline-none
      focus-visible:ring-2
      focus-visible:ring-ring
      focus-visible:ring-offset-2
      disabled:pointer-events-none
      disabled:opacity-50
      bg-primary
      text-primary-foreground
      hover:bg-primary/90
      h-10
      px-4
      py-2
      w-full
      mt-2
    `,

    // Secondary/text buttons
    formButtonReset: `
      text-sm
      text-primary
      hover:text-primary/80
      underline-offset-4
      hover:underline
    `,

    // Links
    footerActionLink: `
      text-primary
      hover:text-primary/80
      font-medium
      underline-offset-4
      hover:underline
    `,
    footerActionText: "text-muted-foreground text-sm",

    // Identity preview (shows selected account)
    identityPreview: `
      border
      border-border
      rounded-lg
      p-3
      bg-muted/50
    `,
    identityPreviewText: "text-foreground font-medium",
    identityPreviewEditButton: "text-primary hover:text-primary/80",

    // Alert/message boxes
    alert: "rounded-lg border p-4",
    alertText: "text-sm",

    // OTP input
    otpCodeFieldInput: `
      w-10
      h-12
      text-center
      text-lg
      font-semibold
      border
      border-input
      rounded-md
      focus:ring-2
      focus:ring-ring
    `,

    // Avatar
    avatarBox: "w-10 h-10 rounded-full",
    avatarImage: "rounded-full",

    // User button menu
    userButtonPopoverCard: "rounded-xl border border-border shadow-lg",
    userButtonPopoverActionButton: "hover:bg-accent rounded-md",
    userButtonPopoverActionButtonText: "text-sm",
    userButtonPopoverFooter: "border-t border-border",

    // Scrollbar
    scrollBox: "scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent",

    // Loading states
    spinner: "text-primary",

    // Phone input
    phoneInputBox: "rounded-md border border-input",

    // Select/dropdown
    selectButton: `
      flex
      h-10
      w-full
      items-center
      justify-between
      rounded-md
      border
      border-input
      bg-background
      px-3
      py-2
      text-sm
      focus:outline-none
      focus:ring-2
      focus:ring-ring
      focus:ring-offset-2
    `,
    selectOptionsContainer: "rounded-md border border-border bg-popover shadow-md",
    selectOption: "px-3 py-2 text-sm hover:bg-accent cursor-pointer",

    // Badge
    badge: "rounded-full px-2.5 py-0.5 text-xs font-medium",

    // Modal/dialog
    modalBackdrop: "bg-black/80 backdrop-blur-sm",
    modalContent: "rounded-xl border border-border shadow-lg",
  },
  layout: {
    socialButtonsPlacement: "top" as const,
    socialButtonsVariant: "blockButton" as const,
    termsPageUrl: "/terms",
    privacyPageUrl: "/privacy",
    helpPageUrl: "/help",
    logoPlacement: "inside" as const,
    shimmer: true,
    animations: true,
  },
});

export function SignInPage({
  afterSignInUrl = "/dashboard",
  signUpUrl = "/sign-up",
}: AuthPageProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="w-full max-w-[400px]">
        {/* Optional: Add your logo above the card */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back
          </h1>
          <p className="mt-2 text-muted-foreground">
            Sign in to your Oryn account
          </p>
        </div>

        <SignIn
          appearance={getAppearance(isDark)}
          afterSignInUrl={afterSignInUrl}
          signUpUrl={signUpUrl}
        />

        {/* Optional: Footer text */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          By signing in, you agree to our{" "}
          <a href="/terms" className="underline underline-offset-4 hover:text-primary">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="/privacy" className="underline underline-offset-4 hover:text-primary">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}

export function SignUpPage({
  afterSignUpUrl = "/onboarding",
  signInUrl = "/sign-in",
}: AuthPageProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="w-full max-w-[400px]">
        {/* Optional: Add your logo above the card */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            Create an account
          </h1>
          <p className="mt-2 text-muted-foreground">
            Get started with Oryn today
          </p>
        </div>

        <SignUp
          appearance={getAppearance(isDark)}
          afterSignUpUrl={afterSignUpUrl}
          signInUrl={signInUrl}
        />

        {/* Optional: Footer text */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          By creating an account, you agree to our{" "}
          <a href="/terms" className="underline underline-offset-4 hover:text-primary">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="/privacy" className="underline underline-offset-4 hover:text-primary">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}

export function UserButton() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <ClerkUserButton
      appearance={{
        baseTheme: isDark ? dark : undefined,
        elements: {
          avatarBox: "w-9 h-9 rounded-full ring-2 ring-border",
          userButtonPopoverCard: `
            rounded-xl
            border
            border-border
            shadow-lg
            bg-popover
            min-w-[240px]
          `,
          userButtonPopoverActionButton: `
            hover:bg-accent
            rounded-md
            transition-colors
            px-2
            py-1.5
          `,
          userButtonPopoverActionButtonText: "text-sm font-medium",
          userButtonPopoverActionButtonIcon: "w-4 h-4",
          userButtonPopoverFooter: "border-t border-border pt-2 mt-2",
          userPreviewMainIdentifier: "font-semibold",
          userPreviewSecondaryIdentifier: "text-muted-foreground text-sm",
        },
      }}
      afterSignOutUrl="/"
    />
  );
}

export function ProfilePage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <div className="w-full">
      <UserProfile
        appearance={{
          ...getAppearance(isDark),
          elements: {
            ...getAppearance(isDark).elements,
            rootBox: "w-full",
            card: "shadow-none border-none bg-transparent p-0",
            navbar: "hidden",
            navbarMobileMenuButton: "hidden",
            pageScrollBox: "p-0",
            page: "p-0",
            profilePage__security: "p-0",
            profileSection__profile: "p-6 border border-border rounded-xl bg-card",
            profileSection__emailAddresses: "p-6 border border-border rounded-xl bg-card mt-6",
            profileSection__connectedAccounts: "p-6 border border-border rounded-xl bg-card mt-6",
            profileSection__password: "p-6 border border-border rounded-xl bg-card mt-6",
            profileSection__mfa: "p-6 border border-border rounded-xl bg-card mt-6",
            profileSection__activeDevices: "p-6 border border-border rounded-xl bg-card mt-6",
            profileSectionTitle: "text-lg font-semibold",
            profileSectionTitleText: "text-foreground",
            profileSectionSubtitle: "text-muted-foreground text-sm",
            profileSectionContent: "mt-4",
          },
        }}
      />
    </div>
  );
}

// Compact sign-in for modals/sheets
export function SignInCompact({
  afterSignInUrl = "/dashboard",
  signUpUrl = "/sign-up",
}: AuthPageProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <SignIn
      appearance={{
        ...getAppearance(isDark),
        elements: {
          ...getAppearance(isDark).elements,
          card: "shadow-none border-none bg-transparent p-0",
          headerTitle: "text-xl",
          footer: "hidden",
        },
      }}
      afterSignInUrl={afterSignInUrl}
      signUpUrl={signUpUrl}
    />
  );
}

// Compact sign-up for modals/sheets
export function SignUpCompact({
  afterSignUpUrl = "/onboarding",
  signInUrl = "/sign-in",
}: AuthPageProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <SignUp
      appearance={{
        ...getAppearance(isDark),
        elements: {
          ...getAppearance(isDark).elements,
          card: "shadow-none border-none bg-transparent p-0",
          headerTitle: "text-xl",
          footer: "hidden",
        },
      }}
      afterSignUpUrl={afterSignUpUrl}
      signInUrl={signInUrl}
    />
  );
}

// Protected wrapper component
interface ProtectedProps {
  children: React.ReactNode;
  requiredRole?: "user" | "admin" | "super_admin";
  fallback?: React.ReactNode;
  loadingFallback?: React.ReactNode;
}

export function Protected({
  children,
  requiredRole = "user",
  fallback = null,
  loadingFallback = null,
}: ProtectedProps) {
  const { hasPermission, isLoaded } = usePermission(requiredRole);

  if (!isLoaded) {
    return <>{loadingFallback}</>;
  }

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Admin only wrapper
interface AdminOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AdminOnly({ children, fallback = null }: AdminOnlyProps) {
  return (
    <Protected requiredRole="admin" fallback={fallback}>
      {children}
    </Protected>
  );
}

// Signed in check
interface RequireAuthProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RequireAuth({ children, fallback = null }: RequireAuthProps) {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return null;
  }

  if (!isSignedIn) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
