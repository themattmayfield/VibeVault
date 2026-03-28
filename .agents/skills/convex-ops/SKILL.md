---
name: convex-ops
description: >
  General-purpose Convex CLI operations for querying data, running functions, managing
  environment variables, inspecting tables, importing/exporting data, tailing logs, and
  deploying. Use this skill when the user asks to query Convex, run a Convex function,
  check table data, manage Convex env vars, view Convex logs, check deployment health
  via insights, import or export data, or deploy to production. Do NOT use this skill
  for schema migrations (use convex-migration-helper), auth setup (use convex-setup-auth),
  performance auditing (use convex-performance-audit), or component creation
  (use convex-create-component).
---

# Convex Operations

Run Convex CLI commands for day-to-day operations: execute functions, inspect data, manage env vars, tail logs, and deploy.

## When to Use

- Running a Convex query or mutation from the CLI
- Inspecting table contents or row counts
- Managing environment variables on a Convex deployment
- Importing or exporting data (JSON, JSONL, ZIP)
- Tailing deployment logs for debugging
- Checking deployment health with `npx convex insights`
- Deploying to production or creating preview deployments
- Regenerating types with `npx convex codegen`

## When Not to Use

- Schema changes or data migrations -- use `convex-migration-helper`
- Adding authentication -- use `convex-setup-auth`
- Performance debugging (OCC conflicts, read amplification) -- use `convex-performance-audit`
- Creating isolated components -- use `convex-create-component`
- Initial project setup -- use `convex-quickstart`

## Prerequisites

The `convex` package must be installed (it is a dependency of this project). Verify:

```bash
npx convex --version
```

The `CONVEX_DEPLOYMENT` env var in `.env.local` determines which deployment commands target. For production operations, use the `--prod` flag or set `CONVEX_DEPLOY_KEY`.

## Command Reference

### Run a function (query, mutation, or action)

```bash
# Run a query (userId is a Convex document ID, e.g. "j57b3...")
npx convex run mood:getUserMoods '{"userId": "j57b3..."}'

# Run a mutation
npx convex run mood:createMood '{"mood": "happy", "note": "Great day!"}'

# Run against production
npx convex run mood:getUserMoods '{"userId": "j57b3..."}' --prod
```

**Arguments are JSON strings.** Convex document IDs look like `"j57b3..."`. Reference IDs use the table name prefix: `{"userId": "j57b3..."}`.

**To look up a user by their Neon (Better Auth) ID first:**

```bash
npx convex run user:getUserFromNeonUserId '{"neonUserId": "user_abc123"}'
# Returns the Convex user doc with _id you can use in other queries
```

**Common functions in this project:**

| Function | Type | Args | Purpose |
|----------|------|------|---------|
| `mood:getUserMoods` | query | `{userId}` (Convex ID) | All moods for a user |
| `mood:getMoodToday` | query | `{userId}` (Convex ID) | Today's mood |
| `mood:getUserLast30DaysMoods` | query | `{userId}` (Convex ID) | 30-day history |
| `mood:getMoodTrends` | query | `{userId, usersTimeZone}` | 14-day trends |
| `mood:createMood` | mutation | `{mood, note?, tags?, userId?, organizationId?}` | Log a mood |
| `groups:getUsersGroups` | query | `{userId}` (Convex ID) | User's groups |
| `groups:createGroup` | mutation | `{name, isPrivate, userId, description?, image?, organizationId?}` | Create group |
| `user:getUserFromNeonUserId` | query | `{neonUserId}` | Lookup user by Neon ID |
| `organization:getOrgSettingsBySlug` | query | `{slug}` | Org config by URL slug |
| `insights:getTodaysInsight` | query | `{table, userId}` | Daily insight (`table`: "patterns", "triggers", or "suggestions") |

### Inspect table data

```bash
# List all tables and document counts
npx convex data

# Show documents in a specific table (paginated)
npx convex data moods
npx convex data users
npx convex data orgSettings

# Production tables
npx convex data moods --prod
```

### Manage environment variables

```bash
# List all env vars
npx convex env list

# Get a specific var
npx convex env get ANTHROPIC_API_KEY

# Set a var
npx convex env set MY_VAR "my-value"

# Remove a var
npx convex env remove MY_VAR

# Production env vars
npx convex env list --prod
npx convex env set MY_VAR "prod-value" --prod
```

### Import and export data

```bash
# Export all tables to a ZIP
npx convex export --path backup.zip

# Export production
npx convex export --path prod-backup.zip --prod

# Import a JSONL file into a table
npx convex import --table moods moods-data.jsonl

# Import replacing existing data
npx convex import --table moods moods-data.jsonl --replace

# Import a full backup ZIP
npx convex import backup.zip
```

### Tail logs

```bash
# Tail dev deployment logs (streams continuously)
npx convex logs

# Tail production logs
npx convex logs --prod

# Filter by success/failure
npx convex logs --success
npx convex logs --failure
```

**Note:** `npx convex logs` is a streaming command. It will run until interrupted. When using it for debugging, set a timeout or run briefly to capture recent output.

### Check deployment health

```bash
# View insights (OCC conflicts, function usage, limits)
npx convex insights
```

### Deploy

```bash
# Deploy to production (requires CONVEX_DEPLOY_KEY or login)
npx convex deploy

# Create a preview deployment
npx convex deploy --preview-name my-feature

# Deploy with a specific preview create command
npx convex deploy --preview-create "preview-branch"
```

### Regenerate types

```bash
# Regenerate _generated/ directory (api.ts, dataModel.d.ts, etc.)
npx convex codegen
```

### Open dashboard

```bash
# Open the Convex dashboard in browser
npx convex dashboard
```

## Workflow: Debug a Production Issue

1. Tail production logs to identify the error:
   ```bash
   npx convex logs --prod --failure
   ```
2. Check the affected table's data:
   ```bash
   npx convex data moods --prod
   ```
3. Run the query directly to reproduce:
   ```bash
   npx convex run mood:getUserMoods '{"userId": "j57b3..."}' --prod
   ```
4. Check insights for systemic issues:
   ```bash
   npx convex insights
   ```

## Workflow: Seed or Restore Data

1. Export current data as backup:
   ```bash
   npx convex export --path backup-$(date +%Y%m%d).zip
   ```
2. Import seed data:
   ```bash
   npx convex import --table moods seed-moods.jsonl
   ```

## Checklist

- [ ] Verified `npx convex --version` works
- [ ] Used correct function name format: `module:functionName`
- [ ] Passed args as valid JSON string
- [ ] Used `--prod` flag when targeting production
- [ ] Did NOT use `npx convex dev` (long-running, not agent-friendly)
