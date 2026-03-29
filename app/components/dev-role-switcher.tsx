'use client';

import { useParams } from '@tanstack/react-router';
import {
  type OrgRole,
  useDevRoleOverride,
  setDevRoleOverride,
} from '@/hooks/use-org-settings';

const ROLES: { value: OrgRole; label: string; description: string }[] = [
  {
    value: 'owner',
    label: 'Owner',
    description: 'Full access: billing, org settings, members, all tabs',
  },
  {
    value: 'member',
    label: 'Member',
    description: 'Standard access: personal tabs only',
  },
];

const ROLE_COLORS: Record<OrgRole, string> = {
  owner: '#f59e0b',
  member: '#6b7280',
};

/**
 * Dev-only panel for switching the user's org role.
 * Rendered as a TanStack Devtools plugin tab.
 */
export function RoleSwitcherPanel() {
  const params = useParams({ strict: false }) as { slug?: string };
  const slug = params.slug;
  const override = useDevRoleOverride();

  if (!slug) {
    return (
      <div style={{ padding: 16, fontFamily: 'system-ui, sans-serif' }}>
        <p style={{ color: '#9ca3af', fontSize: 14 }}>
          Navigate to an org route (<code>/org/$slug/...</code>) to use the role
          switcher.
        </p>
      </div>
    );
  }

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
      {/* Left: Role selector */}
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
          {ROLES.map((role) => {
            const isActive = override === role.value;
            const color = ROLE_COLORS[role.value];
            return (
              <button
                key={role.value}
                type="button"
                onClick={() => setDevRoleOverride(slug, role.value)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: `2px solid ${isActive ? color : 'transparent'}`,
                  background: isActive ? `${color}20` : '#1f2937',
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
                    background: color,
                    flexShrink: 0,
                  }}
                />
                {role.label}
              </button>
            );
          })}
        </div>

        {override && (
          <button
            type="button"
            onClick={() => setDevRoleOverride(slug, null)}
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
            Reset to real role
          </button>
        )}
      </div>

      {/* Right: Role description */}
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
          {override ? (
            <>
              Viewing as{' '}
              <strong style={{ color: ROLE_COLORS[override] }}>
                {override}
              </strong>
            </>
          ) : (
            'No override (using real Clerk role)'
          )}
        </div>

        <div
          style={{
            fontSize: 12,
            lineHeight: 1.6,
            color: '#d1d5db',
          }}
        >
          {override ? (
            <>
              <p style={{ margin: '0 0 12px' }}>
                {ROLES.find((r) => r.value === override)?.description}
              </p>
              <div
                style={{
                  background: '#1f2937',
                  borderRadius: 6,
                  padding: 12,
                  fontSize: 11,
                  color: '#9ca3af',
                }}
              >
                <strong style={{ color: '#e5e7eb' }}>Note:</strong> This
                override only affects client-side UI rendering (e.g. which
                settings tabs are visible). Server-side authorization checks
                still use the real Clerk role.
              </div>
            </>
          ) : (
            <p style={{ margin: 0, color: '#6b7280' }}>
              Select a role above to override the current user's org role for
              this session. Useful for testing role-gated UI without changing
              Clerk memberships.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
