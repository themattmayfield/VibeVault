import { createServerFn } from '@tanstack/react-start';
import { getFlag, getAllFlags, type FlagKey } from '@/lib/flags';
import { z } from 'zod';

/**
 * Get all feature flag values at once.
 * Call this in route loaders to pass flags to the client.
 */
export const getFeatureFlags = createServerFn({ method: 'GET' }).handler(
  async () => {
    return getAllFlags();
  }
);

/**
 * Get a single feature flag value.
 */
export const getFeatureFlag = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ key: z.string() }))
  .handler(async ({ data }) => {
    return getFlag(data.key as FlagKey);
  });
