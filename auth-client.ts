import { organizationClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

const appDomain = (import.meta as any).env?.VITE_APP_DOMAIN || 'moodsync.com';

// Auth API lives on the root domain. Cross-subdomain cookies allow
// tenant subdomains (acme.moodsync.com) to share the auth session.
const protocol =
  typeof window !== 'undefined' ? window.location.protocol : 'https:';
const baseURL = `${protocol}//${appDomain}`;

export const authClient = createAuthClient({
  baseURL,
  plugins: [organizationClient()],
});
