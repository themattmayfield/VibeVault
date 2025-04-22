import { createServerFn } from '@tanstack/react-start';
import { auth } from 'auth';
import { getWebRequest } from '@tanstack/react-start/server';

export const getAuthUser = createServerFn({
  method: 'GET',
}).handler(async () => {
  const request = getWebRequest();
  if (!request?.headers) {
    return null;
  }
  const session = await auth.api.getSession({
    headers: request.headers,
  });
  return session?.user || null;
});
