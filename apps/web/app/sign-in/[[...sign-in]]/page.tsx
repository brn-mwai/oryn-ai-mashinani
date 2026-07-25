import { SignIn } from "@clerk/nextjs";
import { AuthLayout } from "@/components/auth-layout";

export default function SignInPage() {
  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue collecting payments with Oryn."
      heroTitle="Stop Chasing. Start Collecting."
      heroSubtitle="AI-powered payment collection"
    >
      <SignIn
        appearance={{
          elements: {
            rootBox: "w-full",
            card: "w-full bg-transparent px-3 pt-0 pb-3 shadow-none border-0",
            headerTitle: "hidden",
            headerSubtitle: "hidden",
            main: "gap-4",
            socialButtonsBlockButton:
              "h-11 border border-[#e2e8f0] dark:border-[#3a4f58] bg-white dark:bg-[#243840] hover:bg-gray-50 dark:hover:bg-[#2e454e] text-[#1A2B32] dark:text-white transition-colors",
            socialButtonsBlockButtonText: "font-medium",
            dividerRow: "my-0",
            dividerLine: "bg-[#e2e8f0] dark:bg-[#3a4f58]",
            dividerText: "text-[#5a7a88] dark:text-gray-400",
            form: "gap-4",
            formFieldRow: "gap-1",
            formFieldLabel: "text-[#1A2B32] dark:text-white font-medium text-sm",
            formFieldInput:
              "h-11 border border-[#e2e8f0] dark:border-[#3a4f58] bg-white dark:bg-[#243840] text-[#1A2B32] dark:text-white placeholder:text-[#5a7a88] dark:placeholder:text-gray-400 focus:border-[#D2B4FA] focus:ring-1 focus:ring-[#D2B4FA] transition-colors",
            formButtonPrimary:
              "h-11 bg-[#D2B4FA] hover:bg-[#c9a5f7] text-[#1A2B32] font-medium transition-colors",
            footerActionLink:
              "text-[#D2B4FA] hover:text-[#c9a5f7] font-medium",
            identityPreviewEditButton: "text-[#D2B4FA] hover:text-[#c9a5f7]",
            formFieldAction: "text-[#D2B4FA] hover:text-[#c9a5f7]",
            alertText: "text-[#1A2B32] dark:text-white",
            footer: "hidden",
          },
          layout: {
            socialButtonsPlacement: "top",
            socialButtonsVariant: "blockButton",
          },
        }}
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        forceRedirectUrl="/dashboard"
      />

      {/* Custom footer */}
      <p className="text-center text-sm text-muted-foreground mt-6">
        Don't have an account?{" "}
        <a
          href="/sign-up"
          className="font-medium text-accent hover:opacity-80 transition-opacity"
        >
          Sign up
        </a>
      </p>
    </AuthLayout>
  );
}
