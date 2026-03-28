import { createServerFn } from '@tanstack/react-start';
import { getRequestHeaders } from '@tanstack/react-start/server';
import { auth } from 'auth';

export const getAuthUser = createServerFn({
  method: 'GET',
}).handler(async () => {
  const headers = getRequestHeaders();
  const session = await auth.api.getSession({
    headers: headers as unknown as Headers,
  });
  return session?.user || null;
});

/** Returns both user and session (includes activeOrganizationId) */
export const getAuthSession = createServerFn({
  method: 'GET',
}).handler(async () => {
  const headers = getRequestHeaders();
  const session = await auth.api.getSession({
    headers: headers as unknown as Headers,
  });
  if (!session) return null;
  return {
    user: session.user,
    session: session.session,
  };
});
