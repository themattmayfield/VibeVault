/**
 * Vercel Feature Flags - Framework-agnostic setup for TanStack Start.
 *
 * Flags are managed in the Vercel dashboard and evaluated server-side
 * via the @vercel/flags-core client. This module provides:
 *
 * 1. A singleton FlagsClient that streams flag definitions from Vercel
 * 2. Helper functions for evaluating individual flags
 * 3. A type-safe registry of all known feature flags
 *
 * Usage in server functions:
 *   import { getFlag, getAllFlags } from '@/lib/flags';
 *   const enabled = await getFlag('my-feature');
 */
import { createClient, type FlagsClient } from '@vercel/flags-core';

// ---------------------------------------------------------------------------
// Flag Registry -- add new flags here as you create them in Vercel dashboard
// ---------------------------------------------------------------------------

/** All known feature flag keys and their default (off) values. */
export const FLAG_DEFAULTS = {
  /** Example flag -- replace with real flags as needed */
  'example-flag': false,
  /**
   * Show / hide the Appearance (theme) tab on the Settings page.
   * Defaults to `true` so it's visible in local dev (where FLAGS env is unset).
   * Disabled in production & preview via the Vercel dashboard.
   */
  'settings-appearance-tab': true,
  /**
   * Show / hide the Resources card on the Help & Support settings tab.
   * Defaults to `true` so it's visible in local dev (where FLAGS env is unset).
   * Disabled in production & preview via the Vercel dashboard.
   */
  'support-resources-card': true,
} as const satisfies Record<string, boolean | string | number>;

export type FlagKey = keyof typeof FLAG_DEFAULTS;

// ---------------------------------------------------------------------------
// Client singleton
// ---------------------------------------------------------------------------

let _client: FlagsClient | null = null;
let _initPromise: Promise<void> | null = null;

function getClient(): FlagsClient {
  if (_client) return _client;

  const sdkKey = process.env.FLAGS;
  if (!sdkKey) {
    throw new Error(
      'FLAGS env var is not set. Create flags in the Vercel dashboard and pull env vars with `vercel env pull`.'
    );
  }

  _client = createClient(sdkKey);
  return _client;
}

async function ensureInitialized(): Promise<FlagsClient> {
  const client = getClient();
  if (!_initPromise) {
    _initPromise = client.initialize() as Promise<void>;
  }
  await _initPromise;
  return client;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Evaluate a single feature flag.
 * Returns the flag value, falling back to the registered default.
 */
export async function getFlag<K extends FlagKey>(
  key: K
): Promise<(typeof FLAG_DEFAULTS)[K]> {
  try {
    const client = await ensureInitialized();
    const result = await client.evaluate(key, FLAG_DEFAULTS[key]);
    return (result.value ?? FLAG_DEFAULTS[key]) as (typeof FLAG_DEFAULTS)[K];
  } catch {
    // If Vercel Flags is unavailable (e.g. local dev without FLAGS env var),
    // fall back to defaults silently.
    return FLAG_DEFAULTS[key];
  }
}

/**
 * Evaluate all registered feature flags at once.
 * Useful for passing a full flag set to the client via loader data.
 */
export async function getAllFlags(): Promise<typeof FLAG_DEFAULTS> {
  const entries = await Promise.all(
    (Object.keys(FLAG_DEFAULTS) as FlagKey[]).map(async (key) => {
      const value = await getFlag(key);
      return [key, value] as const;
    })
  );
  return Object.fromEntries(entries) as typeof FLAG_DEFAULTS;
}
