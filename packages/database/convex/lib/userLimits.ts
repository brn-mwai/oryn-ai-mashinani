// User type limits configuration
// Defines the feature matrix for each user persona

export type UserType = "freelancer" | "creator" | "consultant" | "agency" | "saas";

export type SubscriptionTier = "starter" | "professional" | "enterprise" | "custom";

export interface UserLimits {
  monthlyClaimsLimit: number;
  monthlyCollectionLimit: number;
  aiActionsLimit: number;
  teamMembersLimit: number;
  channels: readonly string[];
  maxEscalationLevel: number;
  apiAccess: boolean;
  whiteLabel: boolean;
}

export interface UserTypeConfig extends UserLimits {
  platformFeePercent: number;
  autoEscalation: "weekly" | "configurable" | "ai_optimized" | "full_ai";
  onboardingSteps: number;
  estimatedOnboardingMinutes: number;
}

// Feature matrix by user type
export const USER_LIMITS: Record<UserType, UserTypeConfig> = {
  freelancer: {
    monthlyClaimsLimit: 20,
    monthlyCollectionLimit: 10_000,
    aiActionsLimit: 100,
    teamMembersLimit: 1,
    channels: ["email"] as const,
    maxEscalationLevel: 2,
    apiAccess: false,
    whiteLabel: false,
    platformFeePercent: 5,
    autoEscalation: "weekly",
    onboardingSteps: 5,
    estimatedOnboardingMinutes: 5,
  },
  creator: {
    monthlyClaimsLimit: 50,
    monthlyCollectionLimit: 25_000,
    aiActionsLimit: 200,
    teamMembersLimit: 3,
    channels: ["email", "whatsapp"] as const,
    maxEscalationLevel: 2,
    apiAccess: false,
    whiteLabel: false,
    platformFeePercent: 4,
    autoEscalation: "weekly",
    onboardingSteps: 4,
    estimatedOnboardingMinutes: 3,
  },
  consultant: {
    monthlyClaimsLimit: 100,
    monthlyCollectionLimit: 50_000,
    aiActionsLimit: 500,
    teamMembersLimit: 5,
    channels: ["email", "sms", "whatsapp"] as const,
    maxEscalationLevel: 3,
    apiAccess: true,
    whiteLabel: false,
    platformFeePercent: 3.5,
    autoEscalation: "configurable",
    onboardingSteps: 6,
    estimatedOnboardingMinutes: 10,
  },
  agency: {
    monthlyClaimsLimit: 200,
    monthlyCollectionLimit: 100_000,
    aiActionsLimit: 1_000,
    teamMembersLimit: 10,
    channels: ["email", "sms", "whatsapp"] as const,
    maxEscalationLevel: 4,
    apiAccess: true,
    whiteLabel: true,
    platformFeePercent: 3.5,
    autoEscalation: "ai_optimized",
    onboardingSteps: 8,
    estimatedOnboardingMinutes: 15,
  },
  saas: {
    monthlyClaimsLimit: 1_000,
    monthlyCollectionLimit: 500_000,
    aiActionsLimit: 5_000,
    teamMembersLimit: 50,
    channels: ["email", "sms", "whatsapp"] as const,
    maxEscalationLevel: 4,
    apiAccess: true,
    whiteLabel: true,
    platformFeePercent: 3, // Custom negotiable
    autoEscalation: "full_ai",
    onboardingSteps: 10,
    estimatedOnboardingMinutes: 30,
  },
} as const;

// Default limits for new users (before selecting a type)
export const DEFAULT_LIMITS: UserLimits = {
  monthlyClaimsLimit: 5,
  monthlyCollectionLimit: 1_000,
  aiActionsLimit: 20,
  teamMembersLimit: 1,
  channels: ["email"],
  maxEscalationLevel: 1,
  apiAccess: false,
  whiteLabel: false,
};

// Get limits for a user type
export function getLimitsForUserType(userType: UserType): UserLimits {
  const config = USER_LIMITS[userType];
  return {
    monthlyClaimsLimit: config.monthlyClaimsLimit,
    monthlyCollectionLimit: config.monthlyCollectionLimit,
    aiActionsLimit: config.aiActionsLimit,
    teamMembersLimit: config.teamMembersLimit,
    channels: [...config.channels],
    maxEscalationLevel: config.maxEscalationLevel,
    apiAccess: config.apiAccess,
    whiteLabel: config.whiteLabel,
  };
}

// Check if a user can perform an action based on limits
export function canCreateClaim(
  currentUsage: { claimsCreated: number },
  limits: UserLimits
): boolean {
  return currentUsage.claimsCreated < limits.monthlyClaimsLimit;
}

export function canUseChannel(
  channel: string,
  limits: UserLimits
): boolean {
  return limits.channels.includes(channel);
}

export function canEscalateTo(
  level: number,
  limits: UserLimits
): boolean {
  return level <= limits.maxEscalationLevel;
}

export function canUseAiAction(
  currentUsage: { aiActionsUsed: number },
  limits: UserLimits
): boolean {
  return currentUsage.aiActionsUsed < limits.aiActionsLimit;
}

export function canAddTeamMember(
  currentTeamSize: number,
  limits: UserLimits
): boolean {
  return currentTeamSize < limits.teamMembersLimit;
}

// Calculate usage percentage
export function getUsagePercentage(
  used: number,
  limit: number
): number {
  if (limit === 0) return 100;
  return Math.min(100, Math.round((used / limit) * 100));
}

// Check if user is approaching limit (80%+)
export function isApproachingLimit(
  used: number,
  limit: number
): boolean {
  return getUsagePercentage(used, limit) >= 80;
}

// Get initial usage tracking object
export function getInitialUsage(): {
  claimsCreated: number;
  amountCollected: number;
  aiActionsUsed: number;
  resetDate: number;
} {
  return {
    claimsCreated: 0,
    amountCollected: 0,
    aiActionsUsed: 0,
    resetDate: getNextResetDate(),
  };
}

// Get the next monthly reset date (1st of next month)
export function getNextResetDate(): number {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return nextMonth.getTime();
}

// Check if usage should be reset
export function shouldResetUsage(resetDate: number): boolean {
  return Date.now() >= resetDate;
}

// Onboarding step definitions by user type
export const ONBOARDING_STEPS: Record<UserType, string[]> = {
  freelancer: [
    "signup", // Sign up with Clerk
    "business_type", // Business type selection
    "first_client", // Add first client
    "first_claim", // Create first claim (AI parses document)
    "payment_setup", // Connect Stripe Express
  ],
  creator: [
    "social_signin", // Social sign-in
    "creator_type", // Creator type selection
    "payment_setup", // Quick payment setup
    "first_sponsor", // Add first sponsor/brand
  ],
  consultant: [
    "signup",
    "business_type",
    "service_packages", // Service packages setup
    "import_clients", // Import clients
    "retainer_tracking", // Retainer tracking setup
    "payment_reporting", // Payment & reporting config
  ],
  agency: [
    "signup",
    "organization_setup", // Organization setup
    "team_invitation", // Team invitation
    "bulk_client_import", // Bulk client import
    "bulk_claims_import", // Bulk claims import
    "automation_rules", // Automation rules
    "payment_setup", // Payment setup (Connect + Circle)
    "branding", // Branding customization
  ],
  saas: [
    "signup",
    "organization_setup",
    "team_invitation",
    "bulk_client_import",
    "bulk_claims_import",
    "automation_rules",
    "payment_setup",
    "branding",
    "api_integration", // API integration setup
    "white_label", // White-label configuration
  ],
};

// Get initial onboarding state for a user type
export function getInitialOnboardingState(userType?: UserType): {
  completed: boolean;
  currentStep: number;
  completedAt?: number;
} {
  return {
    completed: false,
    currentStep: 0,
    completedAt: undefined,
  };
}
