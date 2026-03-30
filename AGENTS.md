<!-- convex-ai-start -->
This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read `convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running `npx convex ai-files install`.
<!-- convex-ai-end -->

---

# Sentio - Agent Guide

## Architecture Overview

Sentio is a multi-tenant mood-tracking SaaS using **path-based tenancy** (e.g. `sentio.sh/org/acme`). It uses the following stack:

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **App database** | Convex | Moods, groups, insights, org settings (real-time) |
| **Auth** | Clerk | Authentication, user management, organizations (fully managed) |
| **Frontend** | TanStack Start (React 19 + Vite) | File-based routing, SSR, server functions |
| **Payments** | Polar (env-driven: sandbox/production) | Checkout sessions, subscriptions, customer portal |
| **AI** | Anthropic Claude | Mood pattern analysis, triggers, suggestions |
| **Deployment** | Vercel | Hosting, preview deploys, feature flags |

## Service Inventory

| Service | CLI | Env Vars | Skill |
|---------|-----|----------|-------|
| Convex | `npx convex` | `CONVEX_DEPLOYMENT`, `VITE_CONVEX_URL`, `VITE_CONVEX_SITE_URL` | `convex-ops` + 5 specialized skills |
| Clerk | Clerk Dashboard | `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `VITE_CLERK_PUBLISHABLE_KEY`, `CLERK_FRONTEND_API_URL` | -- |
| Vercel | `vercel` | `VERCEL_TOKEN` | `vercel-deploy`, `vercel-flags` |
| Polar | curl (REST API) | `POLAR_ACCESS_TOKEN`, `POLAR_WEBHOOK_SECRET`, `POLAR_SERVER`, `POLAR_PRO_MONTHLY_ID`, `POLAR_PRO_ANNUAL_ID`, `POLAR_TEAM_MONTHLY_ID`, `POLAR_TEAM_ANNUAL_ID`, `POLAR_ENTERPRISE_MONTHLY_ID`, `POLAR_ENTERPRISE_ANNUAL_ID` | `polar-api` |
| Anthropic | SDK only | `ANTHROPIC_API_KEY` | -- |

## Database Schemas

### Convex Tables (App Data)

See `convex/schema.ts` for full definitions.

| Table | Key Fields | Indexes | Purpose |
|-------|-----------|---------|---------|
| `orgSettings` | `clerkOrgId`, `slug`, `plan?`, `polarSubscriptionId?`, `polarCustomerId?`, `seatCount?`, `isPersonal?`, `branding?`, `featureFlags?` | `by_slug`, `by_clerk_org_id` | Per-org config + subscription |
| `users` | `clerkUserId`, `displayName`, `plan?`, `polarSubscriptionId?`, `polarCustomerId?`, `image?` | `by_clerk_user_id` | App user profiles + individual plan |
| `groups` | `name`, `isPrivate`, `creator`, `organizationId?` | `by_organization` | Mood-sharing groups |
| `groupMemberInfo` | `userId`, `groupId`, `role`, `status` | `by_user_id_and_group_id` | Group membership |
| `moods` | `mood` (9 values), `note?`, `tags?`, `userId?`, `organizationId?` | `by_user_id`, `by_org_and_user` | Mood entries |
| `patterns` | `insight`, `userId?` | `by_user_id` | AI pattern insights |
| `triggers` | `insight`, `userId?` | `by_user_id` | AI trigger insights |
| `suggestions` | `insight`, `userId?` | `by_user_id` | AI suggestion insights |

Mood values: `happy`, `excited`, `calm`, `neutral`, `tired`, `stressed`, `sad`, `angry`, `anxious`

Plan values: `free`, `pro`, `team`, `enterprise`

Feature flags on `orgSettings.featureFlags`: `groupsEnabled`, `globalTrendsEnabled`, `publicMoodsEnabled`, `aiInsightsEnabled`, `adminDashboardEnabled`, `dataExportEnabled`, `customBrandingEnabled`

### Cross-Database Links

Auth data (users, sessions, organizations, memberships) is managed by Clerk and not stored in the app database.

- `users.clerkUserId` (Convex) <-> Clerk user ID -- user identity bridge
- `orgSettings.clerkOrgId` (Convex) <-> Clerk organization ID -- org config bridge
- `moods.organizationId` / `groups.organizationId` (Convex) <-> Clerk organization ID -- tenant scoping

## Convex Functions

### Queries
| Function | File | Purpose |
|----------|------|---------|
| `mood.getUserLast30DaysMoods` | `convex/mood.ts` | 30-day mood history |
| `mood.getUsersTotalMoodEntries` | `convex/mood.ts` | Total mood count |
| `mood.getUsersCurrentStreak` | `convex/mood.ts` | Consecutive-day streak |
| `mood.getMostCommonMoodLast30Days` | `convex/mood.ts` | Most frequent mood |
| `mood.getMoodToday` | `convex/mood.ts` | Today's latest mood |
| `mood.getLastFiveMoods` | `convex/mood.ts` | 5 most recent moods |
| `mood.getMoodTrends` | `convex/mood.ts` | 14-day trend data |
| `mood.getUserMoods` | `convex/mood.ts` | All user moods |
| `groups.getGroupQuery` | `convex/groups.ts` | Single group by ID |
| `groups.getUsersGroups` | `convex/groups.ts` | User's groups with previews |
| `groups.getGroupPageContent` | `convex/groups.ts` | Full group page data |
| `groups.getGroupMoodDistributionLast30Days` | `convex/groups.ts` | Group mood distribution |
| `groups.getGroupTimelineLast7Days` | `convex/groups.ts` | Group 7-day timeline |
| `groups.getActiveGroupMembers` | `convex/groups.ts` | Active members list |
| `insights.getTodaysInsight` | `convex/insights.ts` | Cached daily insight |
| `organization.getOrgSettingsBySlug` | `convex/organization.ts` | Org config lookup |
| `user.getUserByClerkId` | `convex/user.ts` | User lookup by Clerk ID |
| `user.getUserGroups` | `convex/user.ts` | User's group list |

### Mutations
| Function | File | Purpose |
|----------|------|---------|
| `mood.createMood` | `convex/mood.ts` | Log a mood |
| `mood.createMoodsFromLocalStorage` | `convex/mood.ts` | Migrate anon moods |
| `groups.createGroup` | `convex/groups.ts` | Create group + owner membership |
| `insights.createInsight` | `convex/insights.ts` | Store AI insight |
| `organization.handleOrganizationOnboard` | `convex/organization.ts` | Create user + org settings |
| `organization.updateOrgSettings` | `convex/organization.ts` | Update branding + feature flags |
| `organization.updateOrgPlan` | `convex/organization.ts` | Update plan + subscription + auto-derive feature flags (called by webhook) |
| `user.createUser` | `convex/user.ts` | Create user profile |

## Available Agent Skills

| Skill | Location | Trigger Keywords | Purpose |
|-------|----------|-----------------|---------|
| `convex-ops` | `.agents/skills/convex-ops/` | "query convex", "run function", "check data", "convex env", "convex logs" | General Convex CLI operations (run, data, env, logs, deploy) |
| `vercel-deploy` | `.agents/skills/vercel-deploy/` | "deploy", "preview", "rollback", "vercel env", "production" | Vercel deployment lifecycle |
| `vercel-flags` | `.agents/skills/vercel-flags/` | "feature flag", "toggle feature", "create flag", "enable flag" | Vercel Feature Flags management |
| `polar-api` | `.agents/skills/polar-api/` | "checkout", "subscription", "payment", "order", "polar" | Polar payments via REST API |
| `convex-quickstart` | `.agents/skills/convex-quickstart/` | "set up convex", "add backend" | Convex project initialization |
| `convex-setup-auth` | `.agents/skills/convex-setup-auth/` | "add auth", "login", "auth setup" | Convex auth configuration |
| `convex-migration-helper` | `.agents/skills/convex-migration-helper/` | "schema change", "migration", "backfill" | Convex data migrations (widen-migrate-narrow) |
| `convex-performance-audit` | `.agents/skills/convex-performance-audit/` | "slow", "performance", "OCC", "read amplification" | Convex performance optimization |
| `convex-create-component` | `.agents/skills/convex-create-component/` | "component", "isolated table", "defineComponent" | Convex component design |

## Common Development Workflows

### Start development
```bash
bun run dev          # Syncs Convex, starts Convex watcher + Vite dev server
```

### Build and type-check
```bash
bun run build        # vite build && tsc --noEmit
bun run type-check   # tsc --noEmit only
```

### Lint and format
```bash
bun run lint         # biome check .
bun run format       # biome format + check with auto-fix
```

### Convex operations
```bash
npx convex run mood:getUserMoods '{"clerkUserId": "user_123"}'   # Run a query
npx convex data moods                                             # Inspect table
npx convex env list                                               # List env vars
npx convex logs                                                   # Tail logs
npx convex deploy                                                 # Deploy to production
```

### Vercel deployment
```bash
vercel deploy                                      # Preview deployment
vercel deploy --prod                               # Production deployment
vercel env ls                                      # List env vars
vercel logs <url>                                  # Tail deployment logs
```

### Vercel feature flags
```bash
vercel flags list                                  # List all flags
vercel flags create my-feature                     # Create boolean flag
vercel flags enable my-feature -e production       # Enable in production
vercel flags disable my-feature -e production      # Disable in production
```

### Polar (payments)
```bash
curl -s -H "Authorization: Bearer $POLAR_ACCESS_TOKEN" \
  https://sandbox-api.polar.sh/v1/products | jq    # List products
```

## Project Structure

```
app/                          # TanStack Start application
  routes/                     # File-based routing
    __root.tsx                # Root layout
    index.tsx                 # Marketing landing page
    join.tsx                  # Multi-step org signup
    api/                      # API routes
      polar/
        webhook.tsx           # Polar webhook endpoint (validates + delegates to polar-webhook.ts)
    org/$slug/                # Tenant routes (path-based: /org/{slug}/...)
      _authenticated/         # Auth-required routes
        dashboard.tsx         # Main dashboard
        log.tsx               # Log a mood
        groups/               # Group routes
        insights.tsx          # AI insights (Pro+ gated)
        trends.tsx            # Global trends (Team+ gated)
        admin.tsx             # Admin dashboard (Team+ gated)
        calendar.tsx          # Mood calendar
        settings.tsx          # Settings hub (7 tabs, role-gated)
        welcome.tsx           # Post-checkout welcome
  components/                 # React components
  actions/                    # Server functions (auth, AI, payments, flags)
  lib/                        # Shared utilities
    plan-features.ts          # Plan tier definitions + feature gating (PLAN_FEATURES, getPlanFeatures, hasFeature, isAtLeastTier)
    polar-products.ts         # Polar product ID mappings + reverse lookup (PLAN_PRODUCT_MAP, resolvePlanFromProductId)
  hooks/                      # Custom React hooks
  styles/                     # CSS/Tailwind
  constants/                  # App constants
convex/                       # Convex backend
  schema.ts                   # Schema definition
  mood.ts                     # Mood CRUD + analytics
  groups.ts                   # Group management
  insights.ts                 # AI insight storage
  organization.ts             # Org settings + onboarding
  user.ts                     # User management
  _generated/                 # Auto-generated Convex files
    ai/guidelines.md          # AI agent guidelines for Convex
  auth.config.ts              # Clerk JWT provider config
  start.ts                    # Clerk middleware for TanStack Start
.agents/skills/               # Agent skills (see table above)
```

## Multi-Tenancy Model

Path-based routing: `sentio.sh/org/{slug}/*` where `$slug` is a TanStack Router dynamic param. The org layout route (`app/routes/org/$slug.tsx`) resolves the slug from URL params and loads org settings from Convex (`orgSettings` table via `by_slug` index). All tenant data is scoped by `organizationId` (Clerk organization ID). Components access the slug via `useParams({ strict: false })`.

## Deployment Model

Two environments with continuous deployment. No promotion flow -- feature flags gate releases in production.

### Environments

| | **Production** | **Preview/Staging** |
|---|---|---|
| **Trigger** | Push to `main` | Push to any other branch / PR |
| **Convex** | `fine-lobster-719` (production) | `moonlit-fox-464` (dev) |
| **Polar** | Production org | Sandbox org |
| **Feature flags** | Vercel flags control rollout | All flags ON |

### How It Works

1. **Push to `main`** -- Vercel builds with production env vars, runs `npx convex deploy` to push Convex functions to production, builds the app pointing at production Convex/Polar.
2. **Push to any other branch / open PR** -- Vercel creates a preview deployment with staging env vars (dev Convex, sandbox Polar). Convex deploy is skipped (uses existing dev deployment).
3. **Feature gating** -- Use `npx vercel flags create/enable/disable` to control what's visible in production. Test everything in preview, then flip the flag.

### Build Pipeline

The build is handled by `scripts/vercel-build.mjs`:
- **Production** (`VERCEL_ENV=production`): `npx convex deploy --cmd 'npx vite build'` -- deploys Convex + builds app
- **Preview** (`VERCEL_ENV=preview`): `npx vite build` -- builds app only (uses dev Convex via env vars)

### Feature Flags (Two Layers)

1. **Vercel Feature Flags** (`app/lib/flags.ts`) -- global app-level flags for deployment rollouts. Managed via `npx vercel flags` CLI. Evaluated server-side via `@vercel/flags-core`.
2. **Convex per-org flags** (`orgSettings.featureFlags`) -- tenant-scoped customization per organization. Managed via Convex mutations.

### Polar Product IDs (Per-Environment)

All Polar env vars are configured in both Vercel environments. Sandbox product IDs are used for preview, production IDs for production. The 6 product env vars are:

`POLAR_PRO_MONTHLY_ID`, `POLAR_PRO_ANNUAL_ID`, `POLAR_TEAM_MONTHLY_ID`, `POLAR_TEAM_ANNUAL_ID`, `POLAR_ENTERPRISE_MONTHLY_ID`, `POLAR_ENTERPRISE_ANNUAL_ID`

Plus the shared: `POLAR_ACCESS_TOKEN`, `POLAR_WEBHOOK_SECRET`, `POLAR_SERVER`

**Webhook Integration:** Polar webhooks are received at `/api/polar/webhook` via TanStack Start API route. The endpoint validates events using `@polar-sh/sdk/webhooks` `validateEvent()`, then delegates to `app/actions/polar-webhook.ts` for processing (`subscription.created`, `subscription.active`, `subscription.updated`, `subscription.canceled`, `subscription.revoked` events).

## Environment Setup

See `.env.example` for all required environment variables with descriptions.
