# MoodSync

Multi-tenant mood tracking SaaS for institutions (schools, healthcare facilities). Built with TanStack Start, Convex, Better Auth, and Neon Postgres.

## Architecture

**Frontend:** TanStack Start (React 18) with file-based routing, deployed to AWS Lambda via SST v3.

**Dual backend:**

- **Neon Postgres** (via Drizzle ORM) -- auth/identity data managed by Better Auth (users, sessions, organizations, members, invitations)
- **Convex** -- application data (moods, groups, insights) and org-specific settings (branding, feature flags)

**Auth:** Better Auth with email/password, cross-subdomain cookie sharing, and the organization plugin for multi-tenancy.

**Multi-tenancy:** Subdomain-based (`{org}.moodsync.com`). Tenant identification happens via subdomain extraction in the root route loader -- no org ID in URL paths.

## Prerequisites

- Node.js 20+
- [Portless](https://github.com/vercel-labs/portless) installed globally (`npm install -g portless`)
- A Convex project
- A Neon Postgres database

## Environment Variables

Copy `.env.local` and fill in:

```
# Convex
CONVEX_DEPLOYMENT=dev:your-deployment
VITE_CONVEX_URL=https://your-deployment.convex.cloud

# Domain (controls subdomain detection, auth cookies, etc.)
APP_DOMAIN=moodsync.localhost          # dev
VITE_APP_DOMAIN=moodsync.localhost     # client-side

# Auth & services
DATABASE_URL=postgresql://...          # Neon Postgres connection string
POLAR_ACCESS_TOKEN=...
POLAR_WEBHOOK_SECRET=...
RESEND_API_KEY=...
ANTHROPIC_API_KEY=...
```

For production, set `APP_DOMAIN=moodsync.com` and `VITE_APP_DOMAIN=moodsync.com`.

## Local Development

### 1. Start the Portless proxy (one-time)

```bash
portless proxy start --https --wildcard
```

This runs a local reverse proxy on port 1355 that:
- Gives you stable `*.moodsync.localhost` URLs instead of `localhost:PORT`
- Provides local HTTPS (auto-generates and trusts certs on first run)
- `--wildcard` routes any subdomain (e.g. `acme.moodsync.localhost`) to your app

### 2. Start the dev server

```bash
bun run dev
```

This runs Convex dev + Vinxi through Portless. Your app is available at:

| URL | What it serves |
|-----|----------------|
| `https://moodsync.localhost` | Marketing site (landing, join/signup) |
| `https://acme.moodsync.localhost` | Tenant app for org with subdomain "acme" |
| `https://other.moodsync.localhost` | Tenant app for org with subdomain "other" |

### How subdomain detection works

The root route (`__root.tsx`) calls `getSubdomainAction()` on every request. Given `APP_DOMAIN=moodsync.localhost`:

- `moodsync.localhost` -- no subdomain, serves the `_marketing` layout
- `acme.moodsync.localhost` -- subdomain is `"acme"`, serves the `_tenant` layout

This value is injected into TanStack Router's route context and available to all child routes.

## Auth & Cookies

Better Auth is configured for cross-subdomain cookie sharing:

- **Cookie domain:** `.moodsync.localhost` (dev) / `.moodsync.com` (prod) -- the leading dot means cookies are shared across all subdomains
- **`sameSite: 'lax'`** -- works for same-site subdomains
- **`secure: true`** when HTTPS is active (Portless provides this in dev)
- **Trusted origins** are resolved dynamically -- any `*.moodsync.localhost` or `*.moodsync.com` origin is trusted automatically

The auth client (`auth-client.ts`) points its `baseURL` at the root domain so auth API calls work from any tenant subdomain.

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start Convex + Vinxi dev server through Portless |
| `bun run build` | Production build |
| `bun run start` | Start production server |
| `bun run type-check` | Run TypeScript type checking |
| `bun run lint` | Lint with Biome |
| `bun run format` | Format with Biome |

## Tech Stack

- **Framework:** [TanStack Start](https://tanstack.com/start) + [Vinxi](https://vinxi.vercel.app)
- **Realtime DB:** [Convex](https://convex.dev)
- **SQL DB:** [Neon Postgres](https://neon.tech) via [Drizzle ORM](https://orm.drizzle.team)
- **Auth:** [Better Auth](https://better-auth.com) (email/password, organization plugin)
- **Payments:** [Polar](https://polar.sh)
- **AI:** [Anthropic Claude](https://anthropic.com) for mood insights
- **Email:** [Resend](https://resend.com)
- **UI:** [shadcn/ui](https://ui.shadcn.com) (Radix + Tailwind CSS v4)
- **Deploy:** [SST v3](https://sst.dev) on AWS Lambda
- **Dev Proxy:** [Portless](https://github.com/vercel-labs/portless) for local subdomain routing + HTTPS
