"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { OnboardingLayout } from "@/components/onboarding/onboarding-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IconArrowRight, IconArrowLeft } from "@tabler/icons-react";

const businessTypes = [
  { value: "sole_proprietorship", label: "Sole Proprietorship" },
  { value: "llc", label: "LLC" },
  { value: "corporation", label: "Corporation" },
  { value: "partnership", label: "Partnership" },
  { value: "nonprofit", label: "Non-profit" },
  { value: "other", label: "Other" },
];

const countries = [
  // North America
  { value: "US", label: "United States" },
  { value: "CA", label: "Canada" },
  { value: "MX", label: "Mexico" },
  // Europe
  { value: "GB", label: "United Kingdom" },
  { value: "DE", label: "Germany" },
  { value: "FR", label: "France" },
  { value: "ES", label: "Spain" },
  { value: "IT", label: "Italy" },
  { value: "NL", label: "Netherlands" },
  { value: "BE", label: "Belgium" },
  { value: "CH", label: "Switzerland" },
  { value: "AT", label: "Austria" },
  { value: "SE", label: "Sweden" },
  { value: "NO", label: "Norway" },
  { value: "DK", label: "Denmark" },
  { value: "FI", label: "Finland" },
  { value: "IE", label: "Ireland" },
  { value: "PL", label: "Poland" },
  { value: "PT", label: "Portugal" },
  // Asia Pacific
  { value: "AU", label: "Australia" },
  { value: "NZ", label: "New Zealand" },
  { value: "JP", label: "Japan" },
  { value: "KR", label: "South Korea" },
  { value: "SG", label: "Singapore" },
  { value: "HK", label: "Hong Kong" },
  { value: "IN", label: "India" },
  { value: "PH", label: "Philippines" },
  { value: "ID", label: "Indonesia" },
  { value: "MY", label: "Malaysia" },
  { value: "TH", label: "Thailand" },
  { value: "VN", label: "Vietnam" },
  // Middle East
  { value: "AE", label: "United Arab Emirates" },
  { value: "SA", label: "Saudi Arabia" },
  { value: "IL", label: "Israel" },
  { value: "QA", label: "Qatar" },
  // Africa
  { value: "ZA", label: "South Africa" },
  { value: "NG", label: "Nigeria" },
  { value: "KE", label: "Kenya" },
  { value: "GH", label: "Ghana" },
  { value: "EG", label: "Egypt" },
  { value: "MA", label: "Morocco" },
  { value: "TZ", label: "Tanzania" },
  { value: "UG", label: "Uganda" },
  { value: "RW", label: "Rwanda" },
  // South America
  { value: "BR", label: "Brazil" },
  { value: "AR", label: "Argentina" },
  { value: "CL", label: "Chile" },
  { value: "CO", label: "Colombia" },
  { value: "PE", label: "Peru" },
  // Other
  { value: "other", label: "Other" },
];

export default function OnboardingBusinessPage() {
  const router = useRouter();
  const [userType, setUserType] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    businessName: "",
    businessType: "",
    website: "",
    country: "",
    streetAddress: "",
    city: "",
    state: "",
    zipCode: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const storedType = localStorage.getItem("onboarding_userType");
    setUserType(storedType);

    // Load saved business data
    const saved = localStorage.getItem("onboarding_business");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setFormData({
          businessName: data.businessName || "",
          businessType: data.businessType || "",
          website: data.website || "",
          country: data.country || "",
          streetAddress: data.streetAddress || "",
          city: data.city || "",
          state: data.state || "",
          zipCode: data.zipCode || "",
        });
      } catch (e) {
        console.error("Failed to load saved business data:", e);
      }
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleContinue = async () => {
    setIsLoading(true);
    localStorage.setItem("onboarding_business", JSON.stringify(formData));
    router.push("/onboarding/preferences");
  };

  const handleBack = () => {
    router.push("/onboarding/personal");
  };

  const isAgencyOrSaas = userType === "agency" || userType === "saas";

  return (
    <OnboardingLayout
      currentStep={3}
      title="Tell us about your business"
      description="This information helps us customize your collection workflows and comply with regulations."
    >
      <div className="space-y-6">
        {/* Business Name */}
        <div className="space-y-2">
          <Label htmlFor="businessName">
            {isAgencyOrSaas ? "Business name" : "Business or brand name"}
          </Label>
          <Input
            id="businessName"
            name="businessName"
            value={formData.businessName}
            onChange={handleInputChange}
            placeholder={isAgencyOrSaas ? "Acme Inc." : "Your brand name"}
            className="h-11"
          />
          <p className="text-xs text-muted-foreground">
            This will appear on payment requests sent to your clients.
          </p>
        </div>

        {/* Business Type */}
        <div className="space-y-2">
          <Label htmlFor="businessType">Business type</Label>
          <Select
            value={formData.businessType}
            onValueChange={(value) => handleSelectChange("businessType", value)}
          >
            <SelectTrigger id="businessType">
              <SelectValue placeholder="Select business type..." />
            </SelectTrigger>
            <SelectContent>
              {businessTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Website (Optional) */}
        <div className="space-y-2">
          <Label htmlFor="website">
            Website <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="website"
            name="website"
            type="url"
            value={formData.website}
            onChange={handleInputChange}
            placeholder="https://yourwebsite.com"
            className="h-11"
          />
        </div>

        {/* Divider */}
        <div className="border-t border-border pt-6">
          <h3 className="text-sm font-medium text-foreground mb-1">
            Business address
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            Required for payment processing compliance.
          </p>

          {/* Country */}
          <div className="space-y-2 mb-4">
            <Label htmlFor="country">Country</Label>
            <Select
              value={formData.country}
              onValueChange={(value) => handleSelectChange("country", value)}
            >
              <SelectTrigger id="country">
                <SelectValue placeholder="Select country..." />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country.value} value={country.value}>
                    {country.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Street Address */}
          <div className="space-y-2 mb-4">
            <Label htmlFor="streetAddress">Street address</Label>
            <Input
              id="streetAddress"
              name="streetAddress"
              value={formData.streetAddress}
              onChange={handleInputChange}
              placeholder="123 Main Street"
              className="h-11"
            />
          </div>

          {/* City, State, Zip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                placeholder="City"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State / Province</Label>
              <Input
                id="state"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                placeholder="State"
                className="h-11"
              />
            </div>
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label htmlFor="zipCode">ZIP / Postal code</Label>
              <Input
                id="zipCode"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleInputChange}
                placeholder="12345"
                className="h-11"
              />
            </div>
          </div>
        </div>

        {/* Compliance Note */}
        <p className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
          To help prevent fraud and comply with financial regulations, we collect and verify
          business information. Your data is encrypted and securely stored.
        </p>
      </div>

      {/* Navigation Buttons */}
      <div className="mt-8 flex justify-between">
        <Button variant="outline" onClick={handleBack}>
          <IconArrowLeft size={16} stroke={2} className="mr-2" />
          Back
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!formData.businessName || !formData.country || isLoading}
          className="bg-accent hover:bg-accent/90 text-accent-foreground"
        >
          {isLoading ? "Saving..." : "Continue"}
          <IconArrowRight size={16} stroke={2} className="ml-2" />
        </Button>
      </div>
    </OnboardingLayout>
  );
}
