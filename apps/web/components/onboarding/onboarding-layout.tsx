"use client";

import Link from "next/link";
import Image from "next/image";
import { useClerk } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { IconCheck, IconLogout } from "@tabler/icons-react";
import { ThemeSwitcher } from "../theme-switcher";

interface OnboardingStep {
  id: number;
  name: string;
  href: string;
}

const steps: OnboardingStep[] = [
  { id: 1, name: "User type", href: "/onboarding" },
  { id: 2, name: "Personal details", href: "/onboarding/personal" },
  { id: 3, name: "Business details", href: "/onboarding/business" },
  { id: 4, name: "Collection preferences", href: "/onboarding/preferences" },
  { id: 5, name: "Notifications", href: "/onboarding/notifications" },
  { id: 6, name: "Review & complete", href: "/onboarding/review" },
];

interface OnboardingLayoutProps {
  children: React.ReactNode;
  currentStep: number;
  title: string;
  description: string;
}

export function OnboardingLayout({
  children,
  currentStep,
  title,
  description,
}: OnboardingLayoutProps) {
  const { signOut } = useClerk();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-grow border-r border-border bg-card px-6 py-8">
          {/* Logo */}
          <div className="mb-10">
            <Link href="https://oryn.cc">
              <Image
                src="/logo-dark.svg"
                alt="Oryn"
                width={100}
                height={32}
                className="dark:hidden"
              />
              <Image
                src="/logo-light.svg"
                alt="Oryn"
                width={100}
                height={32}
                className="hidden dark:block"
              />
            </Link>
          </div>

          {/* Steps */}
          <nav className="flex-1 space-y-1">
            {steps.map((step) => {
              const isCompleted = step.id < currentStep;
              const isCurrent = step.id === currentStep;
              const isUpcoming = step.id > currentStep;

              return (
                <div
                  key={step.id}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isCurrent && "bg-accent/10 text-foreground",
                    isCompleted && "text-muted-foreground",
                    isUpcoming && "text-muted-foreground/60"
                  )}
                >
                  {/* Step indicator */}
                  <div
                    className={cn(
                      "flex items-center justify-center w-6 h-6 rounded-full border-2 text-xs font-semibold transition-colors",
                      isCurrent && "border-accent bg-accent text-accent-foreground",
                      isCompleted && "border-accent bg-accent text-accent-foreground",
                      isUpcoming && "border-muted-foreground/40 text-muted-foreground/60"
                    )}
                  >
                    {isCompleted ? (
                      <IconCheck size={14} stroke={3} />
                    ) : (
                      step.id
                    )}
                  </div>
                  <span>{step.name}</span>
                </div>
              );
            })}
          </nav>

          {/* Bottom Actions */}
          <div className="space-y-3">
            <ThemeSwitcher />
            <button
              onClick={() => signOut({ redirectUrl: "/sign-in" })}
              className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <IconLogout size={16} stroke={2} />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:pl-64">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-border">
          <Link href="https://oryn.cc">
            <Image
              src="/logo-dark.svg"
              alt="Oryn"
              width={80}
              height={26}
              className="dark:hidden"
            />
            <Image
              src="/logo-light.svg"
              alt="Oryn"
              width={80}
              height={26}
              className="hidden dark:block"
            />
          </Link>
          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            <span className="text-sm text-muted-foreground">
              {currentStep}/{steps.length}
            </span>
          </div>
        </div>

        {/* Mobile Progress Bar */}
        <div className="lg:hidden h-1 bg-muted">
          <div
            className="h-full bg-accent transition-all duration-300"
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          />
        </div>

        {/* Content Area */}
        <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
              {title}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {description}
            </p>
          </div>

          {/* Form Content */}
          {children}
        </div>
      </div>

    </div>
  );
}
