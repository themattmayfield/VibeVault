<!-- convex-ai-start -->
This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read `convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running `npx convex ai-files install`.
<!-- convex-ai-end -->

---

# MoodSync (VibeVault) - Agent Guide

## Architecture Overview

MoodSync is a multi-tenant mood-tracking SaaS using **subdomain-based tenancy** (e.g. `acme.moodsync.com`). It uses a dual-database architecture:

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **App database** | Convex | Moods, groups, insights, org settings (real-time) |
| **Auth database** | Neon PostgreSQL + Drizzle ORM | Users, sessions, accounts, organizations, memberships (via Better Auth) |
| **Frontend** | TanStack Start (React 19 + Vite) | File-based routing, SSR, server functions |
| **Payments** | Polar (sandbox) | Checkout sessions, subscriptions, customer portal |
| **AI** | Anthropic Claude | Mood pattern analysis, triggers, suggestions |
| **Email** | Resend | Verification emails |
| **Deployment** | Vercel | Hosting, preview deploys, feature flags |

## Service Inventory

| Service | CLI | Env Vars | Skill |
|---------|-----|----------|-------|
| Convex | `npx convex` | `CONVEX_DEPLOYMENT`, `VITE_CONVEX_URL`, `VITE_CONVEX_SITE_URL` | `convex-ops` + 5 specialized skills |
| Neon | `neonctl` | `DATABASE_URL`, `NEON_API_KEY` | `neon-cli` |
| Drizzle | `npx drizzle-kit` | uses `DATABASE_URL` | `drizzle-cli` |
| Vercel | `vercel` | `VERCEL_TOKEN` | `vercel-deploy`, `vercel-flags` |
| Polar | curl (REST API) | `POLAR_ACCESS_TOKEN`, `POLAR_WEBHOOK_SECRET` | `polar-api` |
| Anthropic | SDK only | `ANTHROPIC_API_KEY` | -- |
| Resend | SDK only | `RESEND_API_KEY` | -- |

## Database Schemas

### Convex Tables (App Data)

See `convex/schema.ts` for full definitions.

| Table | Key Fields | Indexes | Purpose |
|-------|-----------|---------|---------|
| `orgSettings` | `betterAuthOrgId`, `subdomain`, `branding?`, `featureFlags?` | `by_subdomain`, `by_better_auth_org_id` | Per-org config |
| `users` | `neonUserId`, `displayName`, `image?` | `by_neon_user_id` | App user profiles |
| `groups` | `name`, `isPrivate`, `creator`, `organizationId?` | `by_organization` | Mood-sharing groups |
| `groupMemberInfo` | `userId`, `groupId`, `role`, `status` | `by_user_id_and_group_id` | Group membership |
| `moods` | `mood` (9 values), `note?`, `tags?`, `userId?`, `organizationId?` | `by_user_id`, `by_org_and_user` | Mood entries |
| `patterns` | `insight`, `userId?` | `by_user_id` | AI pattern insights |
| `triggers` | `insight`, `userId?` | `by_user_id` | AI trigger insights |
| `suggestions` | `insight`, `userId?` | `by_user_id` | AI suggestion insights |

Mood values: `happy`, `excited`, `calm`, `neutral`, `tired`, `stressed`, `sad`, `angry`, `anxious`

### Neon/Drizzle Tables (Auth Data)

See `auth-schema.ts` for full definitions. Managed by Better Auth.

| Table | Purpose |
|-------|---------|
| `user` | Identity (id, name, email, emailVerified, image) |
| `session` | Active sessions with org context |
| `account` | Auth provider accounts (email/password) |
| `verification` | Email verification tokens |
| `organization` | Tenant orgs (name, slug, logo) |
| `member` | Org membership (userId, orgId, role) |
| `invitation` | Pending org invitations |

### Cross-Database Links

- `users.neonUserId` (Convex) <-> `user.id` (Neon) -- user identity bridge
- `orgSettings.betterAuthOrgId` (Convex) <-> `organization.id` (Neon) -- org config bridge
- `moods.organizationId` / `groups.organizationId` (Convex) <-> `organization.id` (Neon) -- tenant scoping

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
| `organization.getOrgSettingsBySubdomain` | `convex/organization.ts` | Org config lookup |
| `user.getUserFromNeonUserId` | `convex/user.ts` | User lookup by Neon ID |
| `user.getUserGroups` | `convex/user.ts` | User's group list |

### Mutations
| Function | File | Purpose |
|----------|------|---------|
| `mood.createMood` | `convex/mood.ts` | Log a mood |
| `mood.createMoodsFromLocalStorageUsingNeonUserId` | `convex/mood.ts` | Migrate anon moods |
| `groups.createGroup` | `convex/groups.ts` | Create group + owner membership |
| `insights.createInsight` | `convex/insights.ts` | Store AI insight |
| `organization.handleOrganizationOnboard` | `convex/organization.ts` | Create user + org settings |
| `user.createUser` | `convex/user.ts` | Create user profile |

## Available Agent Skills

| Skill | Location | Trigger Keywords | Purpose |
|-------|----------|-----------------|---------|
| `convex-ops` | `.agents/skills/convex-ops/` | "query convex", "run function", "check data", "convex env", "convex logs" | General Convex CLI operations (run, data, env, logs, deploy) |
| `neon-cli` | `.agents/skills/neon-cli/` | "query database", "neon branch", "schema diff", "connection string" | Neon PostgreSQL management via neonctl |
| `drizzle-cli` | `.agents/skills/drizzle-cli/` | "generate migration", "push schema", "introspect db", "drizzle studio" | Drizzle ORM migrations and schema management |
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
bun run dev          # Syncs Convex, starts Convex watcher + Vite dev server via Portless
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
npx convex run mood:getUserMoods '{"neonUserId": "user_123"}'   # Run a query
npx convex data moods                                            # Inspect table
npx convex env list                                              # List env vars
npx convex logs                                                  # Tail logs
npx convex deploy                                                # Deploy to production
```

### Neon operations
```bash
neonctl branches list --output json                # List branches
neonctl branches schema-diff main dev              # Compare schemas
neonctl connection-string                          # Get connection string
```

### Drizzle operations
```bash
npx drizzle-kit generate                           # Generate migration from schema changes
npx drizzle-kit migrate                            # Run pending migrations
npx drizzle-kit push                               # Push schema directly (dev only)
npx drizzle-kit introspect                         # Pull schema from database
npx drizzle-kit studio                             # Open DB browser GUI
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
    __root.tsx                # Root layout (subdomain extraction)
    index.tsx                 # Marketing landing page
    join.tsx                  # Multi-step org signup
    tenant/                   # Tenant routes (behind subdomain)
      _authenticated/         # Auth-required routes
        dashboard.tsx         # Main dashboard
        log.tsx               # Log a mood
        groups/               # Group routes
        trends.tsx            # Global trends
        admin.tsx             # Admin dashboard (stub)
  components/                 # React components
  actions/                    # Server functions (auth, AI, payments)
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
drizzle/                      # Drizzle migration SQL files
auth.ts                       # Better Auth server configuration
auth-schema.ts                # Drizzle schema for auth tables
auth-client.ts                # Better Auth client
drizzle.ts                    # Drizzle client setup
drizzle.config.ts             # Drizzle Kit configuration
.agents/skills/               # Agent skills (see table above)
```

## Multi-Tenancy Model

Subdomain-based routing: `{slug}.moodsync.com` -> internally rewritten to `/tenant/*` routes. The subdomain is extracted in `__root.tsx` `beforeLoad` and used to load org settings from Convex (`orgSettings` table via `by_subdomain` index). All tenant data is scoped by `organizationId` (Better Auth org ID).

## Environment Setup

See `.env.example` for all required environment variables with descriptions.
