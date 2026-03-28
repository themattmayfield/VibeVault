/**
 * Domain configuration helpers.
 * Client-side: reads from import.meta.env.VITE_APP_DOMAIN
 */

/** The root app domain, e.g. "moodsync.com" */
export function getAppDomain(): string {
  return import.meta.env.VITE_APP_DOMAIN || 'moodsync.com';
}
