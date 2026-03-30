/**
 * Domain configuration helpers.
 * Client-side: reads from import.meta.env.VITE_APP_DOMAIN
 */

/** The root app domain, e.g. "sentio.sh" */
export function getAppDomain(): string {
  return import.meta.env.VITE_APP_DOMAIN || 'sentio.sh';
}
