import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from './src/db/drizzle';
import { schema } from './src/db/schema';
import { reactStartCookies } from 'better-auth/react-start';

export const auth = betterAuth({
  emailAndPassword: {
    // requireEmailVerification: true,
    enabled: true,
  },
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: schema,
  }),
  plugins: [reactStartCookies()],
});
