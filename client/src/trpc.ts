import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../../server/router';

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    if (window.location.hostname !== 'localhost') return '';
    return 'http://localhost:3000';
  }
  return '';
};

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: `${getBaseUrl()}/trpc`,
    }),
  ],
});
