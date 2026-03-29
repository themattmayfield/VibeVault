/**
 * Polar product ID mappings.
 * Separated from app/actions/polar.ts for clean imports.
 */
import type { PlanTier } from '@/lib/plan-features';

// ---------------------------------------------------------------------------
// Product ID mapping: env var -> Polar product IDs per tier + billing cycle
// ---------------------------------------------------------------------------

export const PLAN_PRODUCT_MAP: Record<string, Record<string, string>> = {
  pro: {
    monthly: process.env.POLAR_PRO_MONTHLY_ID!,
    annual: process.env.POLAR_PRO_ANNUAL_ID!,
  },
  team: {
    monthly: process.env.POLAR_TEAM_MONTHLY_ID!,
    annual: process.env.POLAR_TEAM_ANNUAL_ID!,
  },
  enterprise: {
    monthly: process.env.POLAR_ENTERPRISE_MONTHLY_ID!,
    annual: process.env.POLAR_ENTERPRISE_ANNUAL_ID!,
  },
};

/**
 * Reverse map: given a Polar product ID, resolve the plan tier and billing cycle.
 * Used by the webhook handler to determine what plan a subscription corresponds to.
 */
function buildProductPlanMap(): Record<
  string,
  { plan: PlanTier; billingCycle: 'monthly' | 'annual' }
> {
  const map: Record<
    string,
    { plan: PlanTier; billingCycle: 'monthly' | 'annual' }
  > = {};
  for (const [plan, cycles] of Object.entries(PLAN_PRODUCT_MAP)) {
    for (const [cycle, productId] of Object.entries(cycles)) {
      if (productId) {
        map[productId] = {
          plan: plan as PlanTier,
          billingCycle: cycle as 'monthly' | 'annual',
        };
      }
    }
  }
  return map;
}

export const PRODUCT_PLAN_MAP = buildProductPlanMap();

/** Look up the plan tier for a Polar product ID. Returns null if unknown. */
export function resolvePlanFromProductId(
  productId: string
): { plan: PlanTier; billingCycle: 'monthly' | 'annual' } | null {
  return PRODUCT_PLAN_MAP[productId] ?? null;
}
