import { getSubdomain } from '@/lib/getSubdomain';
import { createServerFn } from '@tanstack/react-start';
import { getWebRequest } from '@tanstack/react-start/server';

export const getSubdomainAction = createServerFn({
  method: 'GET',
}).handler(async () => {
  const request = getWebRequest();
  return getSubdomain(request);
});
