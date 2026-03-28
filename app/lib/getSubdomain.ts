import { getAppDomain } from './domain';

/**
 * Extracts the tenant subdomain from the request hostname.
 *
 * Given APP_DOMAIN = "moodsync.localhost":
 *   - "moodsync.localhost"       -> null  (root domain, no tenant)
 *   - "acme.moodsync.localhost"  -> "acme"
 *
 * Given APP_DOMAIN = "moodsync.com":
 *   - "moodsync.com"             -> null
 *   - "acme.moodsync.com"        -> "acme"
 */
export const getSubdomain = async (
  request: Request | undefined
): Promise<string | null> => {
  // Prefer the Host header (preserves the original hostname behind proxies
  // like Portless, ALB, CloudFront). Fall back to parsing request.url.
  const hostHeader =
    request?.headers.get('x-forwarded-host') || request?.headers.get('host');
  const hostname = hostHeader
    ? hostHeader.split(':')[0] // strip port (e.g. "acme.moodsync.localhost:1355" -> "acme.moodsync.localhost")
    : new URL(request?.url || 'http://localhost').hostname;

  const appDomain = getAppDomain(); // e.g. "moodsync.localhost" or "moodsync.com"

  // Plain localhost / 127.0.0.1 with no app domain context
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return null;
  }

  // If hostname exactly matches the app domain, no subdomain
  if (hostname === appDomain) {
    return null;
  }

  // If hostname ends with ".{appDomain}", extract the subdomain prefix
  const suffix = `.${appDomain}`;
  if (hostname.endsWith(suffix)) {
    const subdomain = hostname.slice(0, -suffix.length);
    // Ensure it's a single label (no extra dots) and non-empty
    if (subdomain && !subdomain.includes('.')) {
      return subdomain;
    }
  }

  return null;
};
