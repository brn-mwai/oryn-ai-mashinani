"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { OnboardingLayout } from "@/components/onboarding/onboarding-layout";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { IconArrowRight, IconCheck } from "@tabler/icons-react";

const userTypes = [
  {
    id: "freelancer",
    name: "Freelancers",
    description: "Independent professionals collecting payments from clients",
    image: "/images/users/Freelancers.png",
  },
  {
    id: "creator",
    name: "Creators",
    description: "Content creators managing subscriptions and sponsorships",
    image: "/images/users/Creators.png",
  },
  {
    id: "consultant",
    name: "Consultants",
    description: "Professional services with retainers and project fees",
    image: "/images/users/Consultants.png",
  },
  {
    id: "saas",
    name: "SaaS Companies",
    description: "Software companies collecting subscription payments",
    image: "/images/users/SaaS Companies.png",
  },
  {
    id: "agency",
    name: "Agencies",
    description: "Teams managing multiple clients and larger collections",
    image: "/images/users/Agencies.png",
  },
];

export default function OnboardingUserTypePage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load saved selection on mount
  useEffect(() => {
    const saved = localStorage.getItem("onboarding_userType");
    if (saved) {
      setSelectedType(saved);
    }
  }, []);

  const handleContinue = async () => {
    if (!selectedType) return;

    setIsLoading(true);
    // TODO: Save to Convex
    // For now, store in localStorage temporarily
    localStorage.setItem("onboarding_userType", selectedType);
    router.push("/onboarding/personal");
  };

  return (
    <OnboardingLayout
      currentStep={1}
      title="What best describes you?"
      description="This helps us personalize your experience and show relevant features."
    >
      {/* Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {userTypes.map((type) => {
          const isSelected = selectedType === type.id;

          return (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={cn(
                "relative group flex flex-col overflow-hidden border text-left transition-all duration-200",
                isSelected
                  ? "border-accent ring-1 ring-accent/20"
                  : "border-border hover:border-muted-foreground/40 hover:shadow-lg"
              )}
            >
              {/* Image Container */}
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                <Image
                  src={type.image}
                  alt={type.name}
                  fill
                  className={cn(
                    "object-cover transition-transform duration-300",
                    "group-hover:scale-105"
                  )}
                />
                {/* Selection Indicator */}
                {isSelected && (
                  <div className="absolute top-3 right-3 flex items-center justify-center w-6 h-6 rounded-full bg-accent text-accent-foreground shadow-lg">
                    <IconCheck size={14} stroke={3} />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4 bg-card">
                <h3 className={cn(
                  "font-semibold text-foreground transition-colors",
                  isSelected && "text-accent"
                )}>
                  {type.name}
                </h3>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {type.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Continue Button */}
      <div className="mt-8 flex justify-end">
        <Button
          onClick={handleContinue}
          disabled={!selectedType || isLoading}
          className="bg-accent hover:bg-accent/90 text-accent-foreground"
        >
          {isLoading ? "Saving..." : "Continue"}
          <IconArrowRight size={16} stroke={2} className="ml-2" />
        </Button>
      </div>
    </OnboardingLayout>
  );
}
