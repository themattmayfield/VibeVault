---
name: vercel-flags
description: >
  Manage Vercel Feature Flags using the Vercel CLI. Use this skill when the user asks to
  create a feature flag, list feature flags, enable or disable a flag, toggle a feature
  in a specific environment, set flag variants, inspect flag configuration, manage SDK keys,
  archive or delete flags, or perform any feature flag operations. Supports boolean, string,
  and number flag types with per-environment targeting (production, preview, development).
---

# Vercel Feature Flags

Create, manage, and toggle Vercel Feature Flags directly from the CLI.

## When to Use

- Creating a new feature flag (boolean, string, or number)
- Listing all active or archived flags
- Enabling or disabling a boolean flag in an environment
- Setting a specific variant for a string/number flag
- Inspecting flag configuration and current state
- Updating flag variants (values, labels)
- Archiving or deleting flags
- Managing SDK keys for flag evaluation

## When Not to Use

- Convex-based per-org feature flags in `orgSettings.featureFlags` -- edit via `convex-ops`
- Deployment operations -- use `vercel-deploy`
- Application code changes to consume flags -- edit source files directly

## Prerequisites

The Vercel CLI is available via npx:

```bash
npx vercel --version
```

**Authentication:** Set the `VERCEL_TOKEN` env var:

```bash
export VERCEL_TOKEN="your-personal-access-token"
```

**All commands should include `--token $VERCEL_TOKEN --yes`** for non-interactive use.

## Project Context

This project has **two layers** of feature flags:

1. **Vercel Feature Flags** (this skill) -- global app-level flags for deployment rollouts, A/B testing, and infrastructure features. Managed via `vercel flags` CLI.

2. **Convex per-org flags** -- stored in `orgSettings.featureFlags` in Convex. These are tenant-scoped (per-organization). Currently defined:
   - `groupsEnabled` (boolean)
   - `globalTrendsEnabled` (boolean)
   - `publicMoodsEnabled` (boolean)

   Manage these via `npx convex run organization:...` (see `convex-ops` skill).

## Flag Types

| Type | Values | Use Case |
|------|--------|----------|
| `boolean` | `true` / `false` (labeled On / Off) | Simple feature toggles |
| `string` | Custom string variants | Copy testing, theme variants |
| `number` | Custom number variants | Percentage rollouts, limits |

## Environments

Flags are evaluated per-environment:

| Environment | Description |
|-------------|-------------|
| `production` | Live production deployment |
| `preview` | Preview/staging deployments |
| `development` | Local development (`vercel dev`) |

New boolean flags default to: `true` in development, `false` in preview and production.

## Command Reference

### List flags

```bash
# List all active flags
npx vercel flags list --token $VERCEL_TOKEN

# List archived flags
npx vercel flags list --state archived --token $VERCEL_TOKEN
```

### Create a flag

```bash
# Create a boolean flag (default type)
npx vercel flags create my-feature --token $VERCEL_TOKEN --yes

# Create with a description
npx vercel flags create my-feature --description "Controls the new onboarding flow" --token $VERCEL_TOKEN --yes

# Create a string flag with variants
npx vercel flags create welcome-message --kind string \
  --description "Homepage welcome copy" \
  --variant control="Welcome back" \
  --variant treatment="Start for free" \
  --token $VERCEL_TOKEN --yes

# Create a number flag with variants
npx vercel flags create max-items --kind number \
  --variant low=10 \
  --variant high=50 \
  --token $VERCEL_TOKEN --yes
```

### Inspect a flag

```bash
# View flag details, variants, and per-environment state
npx vercel flags inspect my-feature --token $VERCEL_TOKEN
```

### Enable / Disable (boolean flags only)

```bash
# Enable in production
npx vercel flags enable my-feature -e production --token $VERCEL_TOKEN --yes

# Disable in production
npx vercel flags disable my-feature -e production --token $VERCEL_TOKEN --yes

# Enable in preview
npx vercel flags enable my-feature -e preview --token $VERCEL_TOKEN --yes

# Add a revision message (audit trail)
npx vercel flags enable my-feature -e production --message "Launching to all users" --token $VERCEL_TOKEN --yes
```

### Set a variant (string/number flags)

```bash
# Set the served variant in an environment
npx vercel flags set welcome-message -e production --variant control --token $VERCEL_TOKEN --yes

# With a message
npx vercel flags set welcome-message -e preview --variant treatment \
  --message "Testing treatment copy in preview" --token $VERCEL_TOKEN --yes
```

### Update variants

```bash
# Change a variant's value
npx vercel flags update welcome-message --variant control --value "Welcome home" --token $VERCEL_TOKEN --yes

# Change a variant's label
npx vercel flags update welcome-message --variant control --label "Home copy" --token $VERCEL_TOKEN --yes

# Change both value and label, with a message
npx vercel flags update welcome-message --variant control \
  --value "Welcome home" --label "Home copy" \
  --message "Updated control copy" --token $VERCEL_TOKEN --yes
```

### Archive and delete

A flag must be archived before it can be deleted:

```bash
# Archive a flag (stops evaluation)
npx vercel flags archive my-feature --yes --token $VERCEL_TOKEN

# Delete an archived flag permanently
npx vercel flags rm my-feature --yes --token $VERCEL_TOKEN
```

### SDK keys

SDK keys authenticate the app when evaluating flags at runtime:

```bash
# List SDK keys
npx vercel flags sdk-keys ls --token $VERCEL_TOKEN

# Create a server SDK key for production
npx vercel flags sdk-keys add --type server -e production --token $VERCEL_TOKEN

# Create a client SDK key for production
npx vercel flags sdk-keys add --type client -e production --token $VERCEL_TOKEN

# Delete an SDK key
npx vercel flags sdk-keys rm <hash-key> --token $VERCEL_TOKEN --yes
```

**Important:** Save the SDK key when created -- it's shown only once.

### Open in dashboard

```bash
# Open the flags dashboard
npx vercel flags open --token $VERCEL_TOKEN

# Open a specific flag
npx vercel flags open my-feature --token $VERCEL_TOKEN
```

## Workflow: Create and Roll Out a New Feature

1. Create the flag (defaults to off in production):
   ```bash
   npx vercel flags create new-dashboard --description "New dashboard redesign" --token $VERCEL_TOKEN --yes
   ```

2. Enable in development for local testing:
   ```bash
   npx vercel flags enable new-dashboard -e development --token $VERCEL_TOKEN --yes
   ```

3. Enable in preview for staging testing:
   ```bash
   npx vercel flags enable new-dashboard -e preview --message "Testing in staging" --token $VERCEL_TOKEN --yes
   ```

4. Launch to production:
   ```bash
   npx vercel flags enable new-dashboard -e production --message "Launching new dashboard" --token $VERCEL_TOKEN --yes
   ```

5. After full rollout, clean up the flag:
   ```bash
   npx vercel flags archive new-dashboard --yes --token $VERCEL_TOKEN
   npx vercel flags rm new-dashboard --yes --token $VERCEL_TOKEN
   ```

## Workflow: A/B Test Copy

1. Create a string flag:
   ```bash
   npx vercel flags create cta-text --kind string \
     --variant a="Get Started" --variant b="Try Free" \
     --description "CTA button text experiment" \
     --token $VERCEL_TOKEN --yes
   ```

2. Set variant A in production:
   ```bash
   npx vercel flags set cta-text -e production --variant a --token $VERCEL_TOKEN --yes
   ```

3. Switch to variant B:
   ```bash
   npx vercel flags set cta-text -e production --variant b \
     --message "Testing variant B" --token $VERCEL_TOKEN --yes
   ```

## Checklist

- [ ] Verified `npx vercel --version` works
- [ ] Set `VERCEL_TOKEN` env var
- [ ] Used `--token $VERCEL_TOKEN --yes` on all commands
- [ ] Used `--kind` for non-boolean flags
- [ ] Specified `--variant` values for string/number flags
- [ ] Used `-e` to target the correct environment
- [ ] Added `--message` for audit trail on state changes
- [ ] Archived flags before deleting them
