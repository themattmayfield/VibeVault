import { Suspense, useState, useEffect, useCallback } from 'react';
import { createFileRoute, useLoaderData } from '@tanstack/react-router';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AccountSettings } from '@/components/settings/account-settings';
import { AppearanceSettings } from '@/components/settings/appearance-settings';
import { NotificationSettings } from '@/components/settings/notification-settings';
import { BillingSettings } from '@/components/settings/billing-settings';
import { OrganizationSettings } from '@/components/settings/organization-settings';
import { MembersSettings } from '@/components/settings/members-settings';
import { DataPrivacySettings } from '@/components/settings/data-privacy-settings';
import { SupportSettings } from '@/components/settings/support-settings';
import { useUser } from '@clerk/tanstack-react-start';
import { getOrgMemberRole, getFullOrganization } from '@/actions/organization';
import { getFeatureFlag } from '@/actions/flags';
import { convexQuery } from '@convex-dev/react-query';
import { api } from 'convex/_generated/api';
import { useSuspenseQuery } from '@tanstack/react-query';
import {
  User,
  Palette,
  Bell,
  CreditCard,
  Building2,
  Users,
  Shield,
  LifeBuoy,
} from 'lucide-react';
import { useOrgSettings, useDevRoleOverride } from '@/hooks/use-org-settings';

export const Route = createFileRoute('/org/$slug/_authenticated/settings')({
  component: () => (
    <Suspense fallback={<SettingsSkeleton />}>
      <SettingsPage />
    </Suspense>
  ),
  loader: async () => {
    const [showAppearanceTab, showSupportResources] = await Promise.all([
      getFeatureFlag({ data: { key: 'settings-appearance-tab' } }),
      getFeatureFlag({ data: { key: 'support-resources-card' } }),
    ]);
    return {
      showAppearanceTab: Boolean(showAppearanceTab),
      showSupportResources: Boolean(showSupportResources),
    };
  },
});

function SettingsPage() {
  const user = useLoaderData({ from: '/org/$slug/_authenticated' });
  const { showAppearanceTab, showSupportResources } = useLoaderData({
    from: '/org/$slug/_authenticated/settings',
  });
  const { orgSettings } = useOrgSettings();
  const { user: clerkUser } = useUser();

  const [memberRole, setMemberRole] = useState<string | null>(null);
  const [members, setMembers] = useState<
    Array<{
      id: string;
      userId: string;
      role: string;
      user: { name: string; email: string; image?: string | null };
    }>
  >([]);
  const [orgDetails, setOrgDetails] = useState<{
    name: string;
    slug: string;
  } | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);

  // Re-fetch the user from Convex so we get the latest preferences
  const { data: convexUser } = useSuspenseQuery(
    convexQuery(api.user.getUserByClerkId, {
      clerkUserId: user.clerkUserId ?? '',
    })
  );

  const fetchOrgData = useCallback(async () => {
    if (!orgSettings?.clerkOrgId) {
      setRoleLoading(false);
      return;
    }

    try {
      const [role, fullOrg] = await Promise.all([
        getOrgMemberRole({
          data: { organizationId: orgSettings.clerkOrgId ?? '' },
        }),
        getFullOrganization({
          data: { organizationId: orgSettings.clerkOrgId ?? '' },
        }),
      ]);

      setMemberRole(role);

      if (fullOrg) {
        setMembers(
          fullOrg.members.map(
            (m: {
              id: string;
              userId: string;
              role: string;
              user: { name: string; email: string; image?: string | null };
            }) => ({
              id: m.id,
              userId: m.userId,
              role: m.role,
              user: {
                name: m.user.name,
                email: m.user.email,
                image: m.user.image,
              },
            })
          )
        );
        setOrgDetails({
          name: fullOrg.name,
          slug: fullOrg.slug,
        });
      }
    } catch {
      // User may not have org access
    } finally {
      setRoleLoading(false);
    }
  }, [orgSettings?.clerkOrgId]);

  useEffect(() => {
    fetchOrgData();
  }, [fetchOrgData]);

  const roleOverride = useDevRoleOverride();
  const effectiveRole = roleOverride ?? memberRole;
  const isOwner = effectiveRole === 'owner';
  const authEmail = clerkUser?.primaryEmailAddress?.emailAddress ?? '';
  const authName = clerkUser?.fullName ?? '';

  const personalTabs = [
    { value: 'account', label: 'Account', icon: User },
    ...(showAppearanceTab
      ? [{ value: 'appearance', label: 'Appearance', icon: Palette }]
      : []),
    { value: 'notifications', label: 'Notifications', icon: Bell },
    { value: 'data', label: 'Data & Privacy', icon: Shield },
    { value: 'support', label: 'Help & Support', icon: LifeBuoy },
  ];

  const ownerTabs = [
    { value: 'billing', label: 'Billing', icon: CreditCard },
    { value: 'organization', label: 'Organization', icon: Building2 },
    { value: 'members', label: 'Members', icon: Users },
  ];

  const visibleTabs = isOwner ? [...personalTabs, ...ownerTabs] : personalTabs;

  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-4 px-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">
            Manage your account, preferences, and organization.
          </p>
        </div>

        <Tabs defaultValue="account" className="space-y-6">
          <TabsList className="flex-wrap h-auto gap-1 p-1">
            {visibleTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="gap-1.5"
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="account">
            <AccountSettings
              user={convexUser}
              clerkUser={clerkUser ?? null}
              authName={authName}
            />
          </TabsContent>

          {showAppearanceTab && (
            <TabsContent value="appearance">
              <AppearanceSettings user={convexUser} />
            </TabsContent>
          )}

          <TabsContent value="notifications">
            <NotificationSettings user={convexUser} />
          </TabsContent>

          <TabsContent value="data">
            <DataPrivacySettings user={convexUser} />
          </TabsContent>

          <TabsContent value="support">
            <SupportSettings
              user={convexUser}
              orgSettings={orgSettings}
              orgSlug={orgDetails?.slug}
              showResources={showSupportResources}
            />
          </TabsContent>

          {isOwner && (
            <>
              <TabsContent value="billing">
                <BillingSettings
                  orgSettings={orgSettings}
                  orgSlug={orgDetails?.slug}
                  orgName={orgDetails?.name}
                  orgEmail={authEmail}
                />
              </TabsContent>

              <TabsContent value="organization">
                {orgSettings && orgDetails && (
                  <OrganizationSettings
                    orgSettings={orgSettings}
                    orgName={orgDetails.name}
                    orgSlug={orgDetails.slug}
                    clerkOrgId={orgSettings.clerkOrgId ?? ''}
                  />
                )}
              </TabsContent>

              <TabsContent value="members">
                {!roleLoading && (
                  <MembersSettings
                    members={members}
                    currentUserId={clerkUser?.id ?? ''}
                    currentUserRole={memberRole ?? 'member'}
                    organizationId={orgSettings?.clerkOrgId ?? ''}
                    slug={orgDetails?.slug ?? ''}
                    onRefresh={fetchOrgData}
                  />
                )}
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-4 px-4">
        <div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <Skeleton className="h-10 w-full max-w-lg" />
        <div className="space-y-6">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
