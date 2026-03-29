import { createServerFn } from '@tanstack/react-start';
import { auth } from '@clerk/tanstack-react-start/server';

export const getAuthUser = createServerFn({
  method: 'GET',
}).handler(async () => {
  const { userId } = await auth();
  if (!userId) return null;
  return { id: userId };
});

/** Returns userId and orgId from Clerk session */
export const getAuthSession = createServerFn({
  method: 'GET',
}).handler(async () => {
  const { userId, orgId } = await auth();
  if (!userId) return null;
  return {
    userId,
    orgId: orgId ?? null,
  };
});
