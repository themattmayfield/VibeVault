---
name: vercel-deploy
description: >
  Manage Vercel deployments, environment variables, domains, logs, and rollbacks using
  the Vercel CLI. Use this skill when the user asks to deploy the app, create a preview
  deployment, deploy to production, manage Vercel environment variables, check deployment
  logs, rollback a deployment, inspect a deployment, manage domains, or perform any
  Vercel hosting operations. Do NOT use this skill for feature flags -- use vercel-flags instead.
---

# Vercel Deploy

Manage the full Vercel deployment lifecycle: preview deploys, production deploys, environment variables, domains, logs, and rollbacks.

## When to Use

- Deploying the app (preview or production)
- Managing Vercel environment variables
- Checking deployment status or logs
- Rolling back a production deployment
- Managing domains and DNS
- Inspecting deployment details
- Linking the project to a Vercel team/project

## When Not to Use

- Managing feature flags -- use `vercel-flags`
- Convex deployments -- use `convex-ops` (`npx convex deploy`)
- Database operations -- use `convex-ops`

## Prerequisites

The Vercel CLI is available via npx:

```bash
npx vercel --version
```

**Authentication:** Set the `VERCEL_TOKEN` env var for non-interactive use:

```bash
export VERCEL_TOKEN="your-personal-access-token"
```

Get a token from: https://vercel.com/account/tokens

**All commands should include `--token $VERCEL_TOKEN --yes`** to skip interactive prompts.

## Project Context

This is a **TanStack Start** app (React 19 + Vite SSR). When deploying to Vercel:
- Framework: Vite (auto-detected)
- Build command: `vite build && tsc --noEmit`
- Output: `.output/` directory
- The app requires env vars from multiple services (Convex, Clerk, Polar, Anthropic)

### Required Vercel Environment Variables

All of these must be set in Vercel for the app to function:

| Variable | Required | Notes |
|----------|----------|-------|
| `CONVEX_DEPLOYMENT` | Yes | Convex deployment name |
| `VITE_CONVEX_URL` | Yes | Convex cloud URL (exposed to client) |
| `VITE_CONVEX_SITE_URL` | Yes | Convex site URL (exposed to client) |
| `CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key |
| `CLERK_SECRET_KEY` | Yes | Clerk secret key |
| `VITE_CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key (exposed to client) |
| `CLERK_FRONTEND_API_URL` | Yes | Clerk Frontend API URL (for Convex JWT) |
| `POLAR_ACCESS_TOKEN` | Yes | Polar API token |
| `POLAR_WEBHOOK_SECRET` | Yes | Polar webhook secret |
| `POLAR_SERVER` | Yes | `"sandbox"` (preview) or `"production"` (prod) |
| `POLAR_PRO_MONTHLY_ID` | Yes | Polar product ID for Pro Monthly |
| `POLAR_PRO_ANNUAL_ID` | Yes | Polar product ID for Pro Annual |
| `POLAR_TEAM_MONTHLY_ID` | Yes | Polar product ID for Team Monthly |
| `POLAR_TEAM_ANNUAL_ID` | Yes | Polar product ID for Team Annual |
| `POLAR_ENTERPRISE_MONTHLY_ID` | Yes | Polar product ID for Enterprise Monthly |
| `POLAR_ENTERPRISE_ANNUAL_ID` | Yes | Polar product ID for Enterprise Annual |
| `ANTHROPIC_API_KEY` | Yes | Claude AI API key |

| `FLAGS_SECRET` | No | Secret for Vercel feature flag endpoint verification |
| `VITE_APP_DOMAIN` | No | e.g. `sentio.sh` (client-side, used for URL display only) |

## Command Reference

### Link project (first time only)

```bash
npx vercel link --token $VERCEL_TOKEN --yes
```

### Deploy

```bash
# Preview deployment (from current state)
npx vercel deploy --token $VERCEL_TOKEN --yes

# Production deployment
npx vercel deploy --prod --token $VERCEL_TOKEN --yes

# Deploy a specific directory
npx vercel deploy ./dist --token $VERCEL_TOKEN --yes
```

### Environment Variables

```bash
# List all env vars
npx vercel env ls --token $VERCEL_TOKEN

# Add an env var (all environments)
npx vercel env add MY_VAR --token $VERCEL_TOKEN
# Then pipe the value: echo "my-value" | npx vercel env add MY_VAR production --token $VERCEL_TOKEN

# Add env var for a specific environment
echo "my-value" | npx vercel env add MY_VAR production --token $VERCEL_TOKEN --yes
echo "dev-value" | npx vercel env add MY_VAR development --token $VERCEL_TOKEN --yes
echo "prev-value" | npx vercel env add MY_VAR preview --token $VERCEL_TOKEN --yes

# Remove an env var
npx vercel env rm MY_VAR production --token $VERCEL_TOKEN --yes

# Pull env vars to .env.local
npx vercel env pull --token $VERCEL_TOKEN --yes
```

### Inspect & Logs

```bash
# Inspect a deployment
npx vercel inspect <deployment-url> --token $VERCEL_TOKEN

# List recent deployments
npx vercel ls --token $VERCEL_TOKEN

# Tail deployment logs
npx vercel logs <deployment-url> --token $VERCEL_TOKEN --follow

# Get logs without streaming
npx vercel logs <deployment-url> --token $VERCEL_TOKEN
```

### Rollback

```bash
# Rollback production to previous deployment
npx vercel rollback --token $VERCEL_TOKEN --yes

# Rollback to a specific deployment
npx vercel rollback <deployment-id> --token $VERCEL_TOKEN --yes
```

### Promote

```bash
# Promote a preview deployment to production
npx vercel promote <deployment-url> --token $VERCEL_TOKEN --yes
```

### Domains

```bash
# List domains
npx vercel domains ls --token $VERCEL_TOKEN

# Add a domain
npx vercel domains add sentio.sh --token $VERCEL_TOKEN
```

### Projects

```bash
# List projects
npx vercel project ls --token $VERCEL_TOKEN

# Inspect current project
npx vercel project inspect --token $VERCEL_TOKEN
```

### Arbitrary API Calls

For anything not covered by specific commands:

```bash
# Call any Vercel REST API endpoint
npx vercel api /v6/deployments --token $VERCEL_TOKEN
```

## Workflow: Full Production Deploy

1. Ensure Convex is deployed first:
   ```bash
   npx convex deploy
   ```

2. Deploy to Vercel production:
   ```bash
   npx vercel deploy --prod --token $VERCEL_TOKEN --yes
   ```

3. Verify the deployment:
   ```bash
   npx vercel ls --token $VERCEL_TOKEN
   ```

4. Check logs for errors:
   ```bash
   npx vercel logs <deployment-url> --token $VERCEL_TOKEN
   ```

## Workflow: Sync Environment Variables

When a new service is added, sync env vars across all environments:

```bash
# Add to production
echo "value" | npx vercel env add NEW_VAR production --token $VERCEL_TOKEN --yes

# Add to preview
echo "value" | npx vercel env add NEW_VAR preview --token $VERCEL_TOKEN --yes

# Add to development
echo "dev-value" | npx vercel env add NEW_VAR development --token $VERCEL_TOKEN --yes
```

## Workflow: Emergency Rollback

```bash
# List recent deployments to find the last good one
npx vercel ls --token $VERCEL_TOKEN

# Rollback immediately
npx vercel rollback --token $VERCEL_TOKEN --yes
```

## Checklist

- [ ] Verified `npx vercel --version` works
- [ ] Set `VERCEL_TOKEN` env var
- [ ] Used `--token $VERCEL_TOKEN --yes` on all commands
- [ ] Deployed Convex before Vercel (if backend changed)
- [ ] All required env vars are set in Vercel
- [ ] Verified deployment via `npx vercel ls` after deploying
