import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from './app/lib/db/drizzle';
import { schema } from './app/lib/db/schema';
import { reactStartCookies } from 'better-auth/react-start';

export const auth = betterAuth({
  emailAndPassword: {
    requireEmailVerification: false,
    enabled: true,
  },
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: schema,
  }),
  plugins: [reactStartCookies()],
});
