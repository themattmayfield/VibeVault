# MoodSync

Multi-tenant mood tracking SaaS for individuals and organizations. Built with TanStack Start, Convex, Better Auth, and Neon Postgres. Features a 4-tier pricing model (Free / Pro / Team / Enterprise) with plan-gated features like AI insights, groups, global trends, and admin dashboards.

## Architecture

**Frontend:** TanStack Start (React 19) with file-based routing, deployed to Vercel.

**Dual backend:**

- **Neon Postgres** (via Drizzle ORM) -- auth/identity data managed by Better Auth (users, sessions, organizations, members, invitations)
- **Convex** -- application data (moods, groups, insights) and org-specific settings (branding, feature flags)

**Auth:** Better Auth with email/password and the organization plugin for multi-tenancy.

**Multi-tenancy:** Path-based (`/org/{slug}`). Tenant identification happens via the `$slug` URL param in TanStack Router. The org layout route resolves the slug and loads org settings from Convex.

## Prerequisites

- Node.js 20+
- A Convex project
- A Neon Postgres database

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```
# Convex
CONVEX_DEPLOYMENT=dev:your-deployment
VITE_CONVEX_URL=https://your-deployment.convex.cloud
VITE_CONVEX_SITE_URL=https://your-deployment.convex.site

# Auth & services
DATABASE_URL=postgresql://...              # Neon Postgres connection string
POLAR_ACCESS_TOKEN=...                     # Polar API token
POLAR_WEBHOOK_SECRET=...                   # Polar webhook verification secret
POLAR_SERVER=sandbox                       # "sandbox" or "production"
POLAR_PRO_MONTHLY_ID=...                   # Polar product IDs (6 total, per tier + billing cycle)
POLAR_PRO_ANNUAL_ID=...
POLAR_TEAM_MONTHLY_ID=...
POLAR_TEAM_ANNUAL_ID=...
POLAR_ENTERPRISE_MONTHLY_ID=...
POLAR_ENTERPRISE_ANNUAL_ID=...
RESEND_API_KEY=...
ANTHROPIC_API_KEY=...

# App display
VITE_APP_DOMAIN=moodsync.com               # Used in UI for URL previews
```

## Local Development

```bash
bun run dev
```

This syncs the Convex schema, then runs the Convex file watcher and Vite dev server in parallel. Your app is available at `http://localhost:5173`.

| URL | What it serves |
|-----|----------------|
| `http://localhost:5173` | Marketing site (landing, join/signup) |
| `http://localhost:5173/org/acme/dashboard` | Tenant app for org with slug "acme" |

### How path-based tenancy works

The route tree under `app/routes/org/$slug/` uses TanStack Router's dynamic `$slug` param. The org layout route (`org/$slug.tsx`) reads the slug from URL params and fetches org settings from Convex via the `by_slug` index. All child routes inherit the org context.

## Auth

Better Auth is configured for single-origin auth (no cross-subdomain cookies needed). Sessions, users, and organizations live in Neon Postgres. The auth client (`auth-client.ts`) uses the default origin.

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start Convex watcher + Vite dev server |
| `bun run build` | Production build (`vite build && tsc --noEmit`) |
| `bun run start` | Start production server |
| `bun run type-check` | Run TypeScript type checking |
| `bun run lint` | Lint with Biome |
| `bun run format` | Format with Biome |

## Tech Stack

- **Framework:** [TanStack Start](https://tanstack.com/start) + [Vite](https://vite.dev)
- **Realtime DB:** [Convex](https://convex.dev)
- **SQL DB:** [Neon Postgres](https://neon.tech) via [Drizzle ORM](https://orm.drizzle.team)
- **Auth:** [Better Auth](https://better-auth.com) (email/password, organization plugin)
- **Payments:** [Polar](https://polar.sh) (Free / Pro / Team / Enterprise tiers)
- **AI:** [Anthropic Claude](https://anthropic.com) for mood insights
- **Email:** [Resend](https://resend.com)
- **UI:** [shadcn/ui](https://ui.shadcn.com) (Radix + Tailwind CSS v4)
- **Deploy:** [Vercel](https://vercel.com)
