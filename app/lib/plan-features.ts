/**
 * Plan feature definitions and gating utilities.
 *
 * Each tier defines what features are available and their limits.
 * This is the single source of truth used by both client UI and server checks.
 */

export type PlanTier = 'free' | 'pro' | 'team' | 'enterprise';

export interface PlanFeatures {
  /** Human-readable plan name */
  label: string;
  /** AI insight generation */
  aiInsights: boolean;
  /** Max AI insight generations per day (per user) */
  aiInsightsPerDay: number;
  /** Max groups a user/org can create */
  maxGroups: number;
  /** Max members per group */
  maxGroupMembers: number;
  /** Access to global trends dashboard */
  globalTrends: boolean;
  /** Access to admin dashboard */
  adminDashboard: boolean;
  /** Highest data export tier unlocked (cumulative: api > json > csv > false) */
  dataExport: false | 'csv' | 'json' | 'api';
  /** Custom branding (logo, etc.) */
  customBranding: boolean;
  /** Support level */
  support: 'community' | 'email' | 'priority' | 'dedicated';
  /** Max seats (for org plans) */
  maxSeats: number;
  /** Public mood sharing */
  publicMoods: boolean;
  /** Max journal entries a user can create */
  maxJournalEntries: number;
  /** Max active goals a user can have simultaneously */
  maxActiveGoals: number;
  /** Max check-ins per group */
  maxCheckInsPerGroup: number;
}

export const PLAN_FEATURES: Record<PlanTier, PlanFeatures> = {
  free: {
    label: 'Free',
    aiInsights: false,
    aiInsightsPerDay: 0,
    maxGroups: 1,
    maxGroupMembers: 5,
    globalTrends: false,
    adminDashboard: false,
    dataExport: false,
    customBranding: false,
    support: 'community',
    maxSeats: 1,
    publicMoods: false,
    maxJournalEntries: 5,
    maxActiveGoals: 1,
    maxCheckInsPerGroup: 1,
  },
  pro: {
    label: 'Pro',
    aiInsights: true,
    aiInsightsPerDay: 1,
    maxGroups: 5,
    maxGroupMembers: 25,
    globalTrends: false,
    adminDashboard: false,
    dataExport: 'csv',
    customBranding: false,
    support: 'email',
    maxSeats: 5,
    publicMoods: true,
    maxJournalEntries: Infinity,
    maxActiveGoals: 5,
    maxCheckInsPerGroup: 3,
  },
  team: {
    label: 'Team',
    aiInsights: true,
    aiInsightsPerDay: 3,
    maxGroups: Infinity,
    maxGroupMembers: Infinity,
    globalTrends: true,
    adminDashboard: true,
    dataExport: 'json',
    customBranding: true,
    support: 'priority',
    maxSeats: 100,
    publicMoods: true,
    maxJournalEntries: Infinity,
    maxActiveGoals: Infinity,
    maxCheckInsPerGroup: Infinity,
  },
  enterprise: {
    label: 'Enterprise',
    aiInsights: true,
    aiInsightsPerDay: Infinity,
    maxGroups: Infinity,
    maxGroupMembers: Infinity,
    globalTrends: true,
    adminDashboard: true,
    dataExport: 'api',
    customBranding: true,
    support: 'dedicated',
    maxSeats: Infinity,
    publicMoods: true,
    maxJournalEntries: Infinity,
    maxActiveGoals: Infinity,
    maxCheckInsPerGroup: Infinity,
  },
};

/** Get the features for a given plan tier. Defaults to 'free'. */
export function getPlanFeatures(plan?: PlanTier | null): PlanFeatures {
  return PLAN_FEATURES[plan ?? 'free'];
}

/** Check if a feature is available for the given plan. */
export function hasFeature(
  plan: PlanTier | undefined | null,
  feature: keyof PlanFeatures
): boolean {
  const features = getPlanFeatures(plan);
  const value = features[feature];
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value > 0;
  if (typeof value === 'string') return true;
  return false;
}

/** Check if a plan tier is at least a given minimum tier. */
export function isAtLeastTier(
  plan: PlanTier | undefined | null,
  minimumTier: PlanTier
): boolean {
  const tierOrder: PlanTier[] = ['free', 'pro', 'team', 'enterprise'];
  const currentIndex = tierOrder.indexOf(plan ?? 'free');
  const minimumIndex = tierOrder.indexOf(minimumTier);
  return currentIndex >= minimumIndex;
}

export type ExportFormat = 'csv' | 'json' | 'api';

const EXPORT_TIER_ORDER: (false | ExportFormat)[] = [
  false,
  'csv',
  'json',
  'api',
];

/**
 * Check if a plan's export capability includes a given format.
 * Export tiers are cumulative: api includes json + csv, json includes csv.
 */
export function canExportAs(
  plan: PlanTier | undefined | null,
  format: ExportFormat
): boolean {
  const features = getPlanFeatures(plan);
  const planLevel = EXPORT_TIER_ORDER.indexOf(features.dataExport);
  const requiredLevel = EXPORT_TIER_ORDER.indexOf(format);
  return planLevel >= requiredLevel;
}

/**
 * Get all export formats available for a given plan.
 */
export function getAvailableExportFormats(
  plan: PlanTier | undefined | null
): ExportFormat[] {
  const features = getPlanFeatures(plan);
  const planLevel = EXPORT_TIER_ORDER.indexOf(features.dataExport);
  return EXPORT_TIER_ORDER.filter(
    (_, i) => i > 0 && i <= planLevel
  ) as ExportFormat[];
}

/**
 * Derive the default Convex `orgSettings.featureFlags` for a given plan tier.
 * Mirrors the logic in `convex/organization.ts:featureFlagsForPlan()`.
 * Used by the dev plan switcher to compute flags when overriding the plan client-side.
 */
export function featureFlagsForPlan(plan: PlanTier) {
  const features = getPlanFeatures(plan);
  return {
    groupsEnabled: true, // all plans get groups (with different limits)
    globalTrendsEnabled: features.globalTrends,
    publicMoodsEnabled: features.publicMoods,
    aiInsightsEnabled: features.aiInsights,
    adminDashboardEnabled: features.adminDashboard,
    dataExportEnabled: features.dataExport !== false,
    customBrandingEnabled: features.customBranding,
  };
}

/** Plan pricing information for display purposes. */
export const PLAN_PRICING = {
  free: { monthly: 0, annual: 0 },
  pro: { monthly: 800, annual: 7200 }, // cents
  team: { monthly: 2900, annual: 26400 }, // cents, per seat
  enterprise: { monthly: 9900, annual: 99000 }, // cents, base
} as const;

/** Format a price in cents to a display string. */
export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}
