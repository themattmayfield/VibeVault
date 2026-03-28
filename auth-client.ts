import { organizationClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

// Single-origin auth -- no cross-subdomain cookies needed.
export const authClient = createAuthClient({
  plugins: [organizationClient()],
});
