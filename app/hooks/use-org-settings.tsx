'use client';

import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import type { Doc } from 'convex/_generated/dataModel';
import { type PlanTier, featureFlagsForPlan } from '@/lib/plan-features';

// ---------------------------------------------------------------------------
// Dev plan override store (module-level, survives re-renders)
// ---------------------------------------------------------------------------

type Listener = () => void;
const listeners = new Set<Listener>();
let currentOverride: PlanTier | null = null;

function notifyListeners() {
  for (const fn of listeners) fn();
}

function subscribe(fn: Listener) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function getSnapshot(): PlanTier | null {
  return currentOverride;
}

function getServerSnapshot(): PlanTier | null {
  return null;
}

function getStorageKey(slug: string) {
  return `dev:planOverride:${slug}`;
}

/** Read a saved override from localStorage. */
export function getSavedOverride(slug: string): PlanTier | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(getStorageKey(slug));
    if (saved && ['free', 'pro', 'team', 'enterprise'].includes(saved)) {
      return saved as PlanTier;
    }
  } catch {
    // SSR or storage disabled
  }
  return null;
}

/** Hydrate the override store from localStorage on first load. */
export function hydrateOverride(slug: string) {
  const saved = getSavedOverride(slug);
  if (saved && currentOverride !== saved) {
    currentOverride = saved;
    notifyListeners();
  }
}

/** Set (or clear) the dev plan override. Notifies all subscribers. */
export function setDevPlanOverride(slug: string, tier: PlanTier | null) {
  currentOverride = tier;
  if (typeof window !== 'undefined') {
    try {
      if (tier) {
        localStorage.setItem(getStorageKey(slug), tier);
      } else {
        localStorage.removeItem(getStorageKey(slug));
      }
    } catch {
      // ignore
    }
  }
  notifyListeners();
}

/** Hook to read the current dev plan override reactively. */
export function useDevPlanOverride(): PlanTier | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

// ---------------------------------------------------------------------------
// Dev role override store (module-level, survives re-renders)
// ---------------------------------------------------------------------------

export type OrgRole = 'owner' | 'member';

const roleListeners = new Set<Listener>();
let currentRoleOverride: OrgRole | null = null;

function notifyRoleListeners() {
  for (const fn of roleListeners) fn();
}

function subscribeRole(fn: Listener) {
  roleListeners.add(fn);
  return () => {
    roleListeners.delete(fn);
  };
}

function getRoleSnapshot(): OrgRole | null {
  return currentRoleOverride;
}

function getRoleServerSnapshot(): OrgRole | null {
  return null;
}

function getRoleStorageKey(slug: string) {
  return `dev:roleOverride:${slug}`;
}

/** Read a saved role override from localStorage. */
export function getSavedRoleOverride(slug: string): OrgRole | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(getRoleStorageKey(slug));
    if (saved && ['owner', 'member'].includes(saved)) {
      return saved as OrgRole;
    }
  } catch {
    // SSR or storage disabled
  }
  return null;
}

/** Hydrate the role override store from localStorage on first load. */
export function hydrateRoleOverride(slug: string) {
  const saved = getSavedRoleOverride(slug);
  if (saved && currentRoleOverride !== saved) {
    currentRoleOverride = saved;
    notifyRoleListeners();
  }
}

/** Set (or clear) the dev role override. Notifies all subscribers. */
export function setDevRoleOverride(slug: string, role: OrgRole | null) {
  currentRoleOverride = role;
  if (typeof window !== 'undefined') {
    try {
      if (role) {
        localStorage.setItem(getRoleStorageKey(slug), role);
      } else {
        localStorage.removeItem(getRoleStorageKey(slug));
      }
    } catch {
      // ignore
    }
  }
  notifyRoleListeners();
}

/** Hook to read the current dev role override reactively. */
export function useDevRoleOverride(): OrgRole | null {
  return useSyncExternalStore(
    subscribeRole,
    getRoleSnapshot,
    getRoleServerSnapshot
  );
}

// ---------------------------------------------------------------------------
// React Context
// ---------------------------------------------------------------------------

const OrgSettingsContext = createContext<Doc<'orgSettings'> | null>(null);

interface OrgSettingsProviderProps {
  orgSettings: Doc<'orgSettings'>;
  slug: string;
  children: ReactNode;
}

/**
 * Provides org settings to the tree, with dev plan override support.
 * Mount this in the `/org/$slug` layout route.
 */
export function OrgSettingsProvider({
  orgSettings,
  slug,
  children,
}: OrgSettingsProviderProps) {
  const override = useDevPlanOverride();

  // Hydrate from localStorage on first render (safe in useMemo initializer)
  useMemo(() => hydrateOverride(slug), [slug]);
  useMemo(() => hydrateRoleOverride(slug), [slug]);

  const value = useMemo(() => {
    if (!override) return orgSettings;
    return {
      ...orgSettings,
      plan: override,
      featureFlags: featureFlagsForPlan(override),
    };
  }, [orgSettings, override]);

  return (
    <OrgSettingsContext.Provider value={value}>
      {children}
    </OrgSettingsContext.Provider>
  );
}

/**
 * Read org settings from context. Must be called inside an `<OrgSettingsProvider>`.
 * Returns `{ orgSettings }` to match the shape consumers previously got from
 * `useLoaderData({ from: '/org/$slug' })`.
 */
export function useOrgSettings() {
  const orgSettings = useContext(OrgSettingsContext);
  if (!orgSettings) {
    throw new Error(
      'useOrgSettings must be used within an OrgSettingsProvider (inside /org/$slug route)'
    );
  }
  return { orgSettings };
}
