'use client';

import { useParams } from '@tanstack/react-router';
import { type PlanTier, PLAN_FEATURES } from '@/lib/plan-features';
import {
  useDevPlanOverride,
  setDevPlanOverride,
} from '@/hooks/use-org-settings';

const TIERS: PlanTier[] = ['free', 'pro', 'team', 'enterprise'];

const TIER_COLORS: Record<PlanTier, string> = {
  free: '#6b7280',
  pro: '#3b82f6',
  team: '#8b5cf6',
  enterprise: '#f59e0b',
};

/**
 * Dev-only panel for switching the org's plan tier.
 * Rendered as a TanStack Devtools plugin tab.
 */
export function PlanSwitcherPanel() {
  const params = useParams({ strict: false }) as { slug?: string };
  const slug = params.slug;
  const override = useDevPlanOverride();

  if (!slug) {
    return (
      <div style={{ padding: 16, fontFamily: 'system-ui, sans-serif' }}>
        <p style={{ color: '#9ca3af', fontSize: 14 }}>
          Navigate to an org route (<code>/org/$slug/...</code>) to use the plan
          switcher.
        </p>
      </div>
    );
  }

  const currentPlan = override ?? 'free';
  const features = PLAN_FEATURES[currentPlan];

  return (
    <div
      style={{
        padding: 16,
        fontFamily: 'system-ui, sans-serif',
        fontSize: 13,
        color: '#e5e7eb',
        display: 'flex',
        gap: 24,
      }}
    >
      {/* Left: Plan selector */}
      <div style={{ minWidth: 200 }}>
        <div
          style={{
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#9ca3af',
            marginBottom: 8,
          }}
        >
          Org: <strong style={{ color: '#e5e7eb' }}>{slug}</strong>
        </div>

        {override && (
          <div
            style={{
              background: '#78350f',
              color: '#fbbf24',
              padding: '4px 8px',
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 600,
              marginBottom: 8,
              display: 'inline-block',
            }}
          >
            OVERRIDE ACTIVE
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {TIERS.map((tier) => {
            const isActive = currentPlan === tier;
            return (
              <button
                key={tier}
                type="button"
                onClick={() => setDevPlanOverride(slug, tier)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: `2px solid ${isActive ? TIER_COLORS[tier] : 'transparent'}`,
                  background: isActive ? `${TIER_COLORS[tier]}20` : '#1f2937',
                  color: isActive ? '#f9fafb' : '#d1d5db',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 400,
                  transition: 'all 0.15s',
                }}
              >
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: TIER_COLORS[tier],
                    flexShrink: 0,
                  }}
                />
                {PLAN_FEATURES[tier].label}
              </button>
            );
          })}
        </div>

        {override && (
          <button
            type="button"
            onClick={() => setDevPlanOverride(slug, null)}
            style={{
              marginTop: 12,
              padding: '6px 12px',
              borderRadius: 4,
              border: '1px solid #374151',
              background: 'transparent',
              color: '#9ca3af',
              cursor: 'pointer',
              fontSize: 12,
              width: '100%',
            }}
          >
            Reset to real plan
          </button>
        )}
      </div>

      {/* Right: Feature summary for selected plan */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#9ca3af',
            marginBottom: 8,
          }}
        >
          Features for{' '}
          <strong style={{ color: TIER_COLORS[currentPlan] }}>
            {features.label}
          </strong>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '4px 16px',
            fontSize: 12,
          }}
        >
          <FeatureRow label="AI Insights" value={features.aiInsights} />
          <FeatureRow
            label="AI/day"
            value={
              features.aiInsightsPerDay === Infinity
                ? 'Unlimited'
                : String(features.aiInsightsPerDay)
            }
          />
          <FeatureRow
            label="Max Groups"
            value={
              features.maxGroups === Infinity
                ? 'Unlimited'
                : String(features.maxGroups)
            }
          />
          <FeatureRow
            label="Max Members/Group"
            value={
              features.maxGroupMembers === Infinity
                ? 'Unlimited'
                : String(features.maxGroupMembers)
            }
          />
          <FeatureRow label="Global Trends" value={features.globalTrends} />
          <FeatureRow label="Admin Dashboard" value={features.adminDashboard} />
          <FeatureRow label="Data Export" value={features.dataExport || 'No'} />
          <FeatureRow label="Custom Branding" value={features.customBranding} />
          <FeatureRow label="Public Moods" value={features.publicMoods} />
          <FeatureRow
            label="Max Seats"
            value={
              features.maxSeats === Infinity
                ? 'Unlimited'
                : String(features.maxSeats)
            }
          />
          <FeatureRow label="Support" value={features.support} />
        </div>
      </div>
    </div>
  );
}

function FeatureRow({
  label,
  value,
}: {
  label: string;
  value: boolean | string;
}) {
  const display = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value;
  const color =
    typeof value === 'boolean' ? (value ? '#34d399' : '#6b7280') : '#e5e7eb';

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '3px 0',
        borderBottom: '1px solid #1f2937',
      }}
    >
      <span style={{ color: '#9ca3af' }}>{label}</span>
      <span style={{ color, fontWeight: 500 }}>{display}</span>
    </div>
  );
}
