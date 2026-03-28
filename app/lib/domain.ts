/**
 * Domain configuration helpers.
 * Server-side: reads from process.env.APP_DOMAIN
 * Client-side: reads from import.meta.env.VITE_APP_DOMAIN
 */

/** The root app domain, e.g. "moodsync.localhost" or "moodsync.com" */
export function getAppDomain(): string {
  return import.meta.env.VITE_APP_DOMAIN || 'moodsync.com';
}

/** The cookie domain with leading dot, e.g. ".moodsync.localhost" */
export function getCookieDomain(): string {
  return `.${getAppDomain()}`;
}

/** Whether we're running over HTTPS (prod or portless with --https) */
export function isSecure(): boolean {
  // Client-side: check current protocol
  if (typeof window !== 'undefined') {
    return window.location.protocol === 'https:';
  }
  // Server-side: check env
  return (
    process.env.NODE_ENV === 'production' ||
    process.env.PORTLESS_HTTPS === '1' ||
    !!process.env.PORTLESS_URL?.startsWith('https')
  );
}

/** Build a full URL for a given subdomain, e.g. "acme" -> "https://acme.moodsync.localhost" */
export function buildTenantUrl(subdomain: string): string {
  const domain = getAppDomain();
  const protocol = isSecure() ? 'https' : 'http';
  return `${protocol}://${subdomain}.${domain}`;
}

/** Build the root app URL (no subdomain), e.g. "https://moodsync.localhost" */
export function buildRootUrl(): string {
  const domain = getAppDomain();
  const protocol = isSecure() ? 'https' : 'http';
  return `${protocol}://${domain}`;
}
