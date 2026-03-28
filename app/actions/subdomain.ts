import { getSubdomain } from '@/lib/getSubdomain';
import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';

export const getSubdomainAction = createServerFn({
  method: 'GET',
}).handler(async () => {
  const request = getRequest();
  return getSubdomain(request);
});
