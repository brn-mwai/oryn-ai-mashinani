"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { OnboardingLayout } from "@/components/onboarding/onboarding-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IconArrowRight, IconArrowLeft } from "@tabler/icons-react";

export default function OnboardingPersonalPage() {
  const router = useRouter();
  const { user } = useUser();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  // Load saved data on mount, fallback to Clerk data
  useEffect(() => {
    const saved = localStorage.getItem("onboarding_personal");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setFormData({
          firstName: data.firstName || user?.firstName || "",
          lastName: data.lastName || user?.lastName || "",
          phone: data.phone || "",
        });
      } catch (e) {
        console.error("Failed to load saved personal data:", e);
        setFormData({
          firstName: user?.firstName || "",
          lastName: user?.lastName || "",
          phone: "",
        });
      }
    } else {
      // No saved data, use Clerk data
      setFormData({
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
        phone: "",
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleContinue = async () => {
    setIsLoading(true);
    // TODO: Save to Convex
    localStorage.setItem("onboarding_personal", JSON.stringify(formData));
    router.push("/onboarding/business");
  };

  const handleBack = () => {
    router.push("/onboarding");
  };

  return (
    <OnboardingLayout
      currentStep={2}
      title="Personal details"
      description="Tell us a bit about yourself so we can personalize your experience."
    >
      <div className="space-y-6">
        {/* Name Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First name</Label>
            <Input
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="Enter your first name"
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last name</Label>
            <Input
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Enter your last name"
              className="h-11"
            />
          </div>
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="phone">Phone number</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            placeholder="+1 (555) 000-0000"
            className="h-11"
          />
          <p className="text-xs text-muted-foreground">
            Used for SMS notifications and account recovery. We&apos;ll never share this.
          </p>
        </div>

        {/* Email (Read-only from Clerk) */}
        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            value={user?.primaryEmailAddress?.emailAddress || ""}
            disabled
            className="h-11 bg-muted"
          />
          <p className="text-xs text-muted-foreground">
            This is your account email from sign up.
          </p>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="mt-8 flex justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
        >
          <IconArrowLeft size={16} stroke={2} className="mr-2" />
          Back
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!formData.firstName || !formData.lastName || isLoading}
          className="bg-accent hover:bg-accent/90 text-accent-foreground"
        >
          {isLoading ? "Saving..." : "Continue"}
          <IconArrowRight size={16} stroke={2} className="ml-2" />
        </Button>
      </div>
    </OnboardingLayout>
  );
}
