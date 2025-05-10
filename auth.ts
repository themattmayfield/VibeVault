import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { reactStartCookies } from 'better-auth/react-start';
import { organization } from 'better-auth/plugins';
import { db } from './drizzle';
import { schema } from './auth-schema';
import { polar } from '@polar-sh/better-auth';
import { Polar } from '@polar-sh/sdk';
import { Resend } from 'resend';

if (!process.env.POLAR_ACCESS_TOKEN) {
  throw new Error('POLAR_ACCESS_TOKEN is not set');
}

if (!process.env.POLAR_WEBHOOK_SECRET) {
  throw new Error('POLAR_WEBHOOK_SECRET is not set');
}

export const polarClient = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  // Use 'sandbox' if you're using the Polar Sandbox environment
  // Remember that access tokens, products, etc. are completely separated between environments.
  // Access tokens obtained in Production are for instance not usable in the Sandbox environment.
  server: 'sandbox',
});
const resend = new Resend(process.env.RESEND_API_KEY);

const isDev = process.env.NODE_ENV === 'development';
console.log('isDev', isDev);

export const auth = betterAuth({
  emailAndPassword: {
    requireEmailVerification: false,
    enabled: true,
    autoSignIn: true,
  },
  emailVerification: {
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      console.log('Sending verification email to', user.email);
      console.log('URL', url);
      console.log('User', user);
      const result = await resend.emails.send({
        from: 'mail@agapemedia.co', // You could add your custom domain
        to: user.email, // email of the user to want to end
        subject: 'Email Verification', // Main subject of the email
        html: `Click the link to verify your email: ${url}`, // Content of the email
        // you could also use "React:" option for sending the email template and there content to user
      });

      console.log('Result', result);
    },
  },
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: schema,
  }),

  advanced: {
    crossSubDomainCookies: {
      enabled: true,
      domain: '.localhost', // Domain with a leading period
    },
    defaultCookieAttributes: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'none', // Allows CORS-based cookie sharing across subdomains
      partitioned: true, // New browser standards will mandate this for foreign cookies
      domain:
        process.env.NODE_ENV === 'production' ? '.example.com' : undefined,
    },
  },
  trustedOrigins: [
    '*.localhost:3000',
    'https://example.com',
    'https://app1.example.com',
    'https://app2.example.com',
    'http://localhost:3000',
    'http://*.localhost:3000',
    'http://localhost',
    'http://*.localhost',
    'http://omg.localhost:3000',
    'http://trrent.localhost:3000',
    'http://omg.localhost',
    'trrent.localhost:3000',
    'omg.localhost',
    'trrent.localhost',
    'http://omg.localhost',
    'http://trrent.localhost',
  ],
  // trustedOrigins: (req) => {
  //   const origin = req.headers.get('origin');
  //   const allowedDomain = '.localhost';
  //   const isDev = process.env.NODE_ENV === 'development';

  //   // If no origin is provided, return a safe default
  //   if (!origin) {
  //     return isDev ? ['http://localhost:3000'] : ['https://example.com'];
  //   }

  //   try {
  //     const originUrl = new URL(origin);
  //     const hostname = originUrl.hostname;

  //     // Development: Allow localhost and its subdomains
  //     if (
  //       isDev &&
  //       (hostname === 'localhost' || hostname.endsWith('.localhost'))
  //     ) {
  //       console.log(`Dev: Trusted localhost origin: ${origin}`);
  //       return [origin]; // Allows http://localhost:3000, http://sub1.localhost:3000, etc.
  //     }

  //     // Production: Validate against .example.com
  //     const isValidOrigin =
  //       hostname === 'example.com' || hostname.endsWith(allowedDomain);

  //     if (isValidOrigin) {
  //       console.log(`Trusted origin: ${origin}`);
  //       return [origin];
  //     } else {
  //       console.warn(`Rejected invalid origin: ${origin}`);
  //       return [];
  //     }
  //   } catch (e) {
  //     console.error(`Malformed origin: ${origin}`, e);
  //     return [];
  //   }
  // },
  plugins: [
    organization(),
    polar({
      client: polarClient,
      createCustomerOnSignUp: true,
      enableCustomerPortal: true, // Deployed under /portal for authenticated users
      checkout: {
        enabled: true,
        products: [
          {
            productId: '07d39ccf-11d5-4993-bb36-c5892f49d252',
            slug: 'pro', // Custom slug for easy reference in Checkout URL, e.g. /checkout/pro
          },
        ],
      },
      // Incoming Webhooks handler will be installed at /polar/webhooks
      webhooks: {
        secret: process.env.POLAR_WEBHOOK_SECRET,
        onPayload: async (payload) => {
          console.log(payload);
        },
      },
    }),
    reactStartCookies(),
  ],
});
