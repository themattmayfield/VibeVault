---
name: neon-cli
description: >
  Manage Neon PostgreSQL databases using the neonctl CLI. Use this skill when the user
  asks to query the Neon database, create or manage database branches, compare schemas
  between branches, get connection strings, run SQL against Neon, list projects or
  databases, manage roles, or perform any Neon-related database operations. This project
  uses Neon as the auth database (Better Auth + Drizzle ORM) storing users, sessions,
  accounts, organizations, memberships, and invitations.
---

# Neon CLI (neonctl)

Manage Neon PostgreSQL databases: branches, schemas, connections, and queries.

## When to Use

- Listing or inspecting Neon projects, branches, or databases
- Creating a preview branch for testing schema changes
- Comparing schemas between branches (schema-diff)
- Getting a connection string for a specific branch
- Managing database roles
- Querying the Neon database directly via SQL
- Checking branch status or operations

## When Not to Use

- Writing Drizzle schema code or generating migrations -- use `drizzle-cli`
- Querying Convex tables -- use `convex-ops`
- Modifying application auth logic -- edit `auth.ts` / `auth-schema.ts` directly

## Prerequisites

`neonctl` is available via npx (no global install needed):

```bash
npx neonctl --version
```

**Authentication:** Set the `NEON_API_KEY` env var for non-interactive use:

```bash
export NEON_API_KEY="your-api-key"
```

Or pass it per-command: `npx neonctl --api-key $NEON_API_KEY <command>`.

Get an API key from: https://console.neon.tech/app/settings/api-keys

**Always use `--output json`** for structured, parseable output.

## Project Context

This project's Neon database stores **auth data only** (managed by Better Auth):

| Table | Purpose |
|-------|---------|
| `user` | Identity (id, name, email, emailVerified, image) |
| `session` | Active sessions with org context (`activeOrganizationId`) |
| `account` | Auth provider accounts (email/password credentials) |
| `verification` | Email verification tokens |
| `organization` | Tenant orgs (name, slug, logo) |
| `member` | Org membership (userId, orgId, role) |
| `invitation` | Pending org invitations (email, role, status, expiry) |

The connection string is in `DATABASE_URL` (`.env.local`). Schema is defined in `auth-schema.ts`.

## Command Reference

### Projects

```bash
# List all projects
npx neonctl projects list --output json

# Get project details
npx neonctl projects get --output json
```

### Branches

Neon branches are copy-on-write snapshots of the database. Use them for safe testing.

```bash
# List all branches
npx neonctl branches list --output json

# Create a branch from main (for testing migrations)
npx neonctl branches create --name feature/my-change --output json

# Get connection string for a specific branch
npx neonctl connection-string --branch feature/my-change

# Compare schemas between branches
npx neonctl branches schema-diff main feature/my-change

# Delete a branch when done
npx neonctl branches delete feature/my-change
```

### Connection Strings

```bash
# Get the default connection string
npx neonctl connection-string

# Get connection string for a specific branch
npx neonctl connection-string --branch dev

# Get pooled connection string (for serverless)
npx neonctl connection-string --pooled
```

### Databases

```bash
# List databases
npx neonctl databases list --output json

# Create a database
npx neonctl databases create --name test_db --output json
```

### Roles

```bash
# List roles
npx neonctl roles list --output json

# Create a role
npx neonctl roles create --name readonly_user --output json
```

### Operations

```bash
# List recent operations (migrations, branch creation, etc.)
npx neonctl operations list --output json
```

### Set Project Context

If you get tired of passing `--project-id` every time:

```bash
# Set default project context
npx neonctl set-context --project-id <project-id>
```

### Direct SQL Queries

Neonctl supports running SQL directly using the Neon SQL API:

```bash
# Run a SQL query via the Neon serverless driver
npx neonctl sql "SELECT * FROM \"user\" LIMIT 5" --output json

# Count users
npx neonctl sql "SELECT COUNT(*) FROM \"user\"" --output json

# List organizations
npx neonctl sql "SELECT id, name, slug FROM organization" --output json

# Check active sessions
npx neonctl sql "SELECT COUNT(*) FROM session WHERE expires_at > NOW()" --output json
```

**Important:** Table and column names in this project use lowercase without quotes in Drizzle, but the SQL uses the actual PostgreSQL names. The `user` table name conflicts with a PostgreSQL reserved word, so always quote it: `"user"`.

## Workflow: Preview Branch for Schema Changes

1. Create a branch from main:
   ```bash
   npx neonctl branches create --name preview/my-migration --output json
   ```
2. Get the branch connection string:
   ```bash
   npx neonctl connection-string --branch preview/my-migration
   ```
3. Test your migration against the branch (set `DATABASE_URL` temporarily)
4. Compare schemas:
   ```bash
   npx neonctl branches schema-diff main preview/my-migration
   ```
5. If satisfied, apply to main. Clean up:
   ```bash
   npx neonctl branches delete preview/my-migration
   ```

## Workflow: Inspect Auth Data

1. Count users:
   ```bash
   npx neonctl sql "SELECT COUNT(*) as total FROM \"user\"" --output json
   ```
2. List organizations:
   ```bash
   npx neonctl sql "SELECT id, name, slug FROM organization ORDER BY created_at DESC" --output json
   ```
3. Check memberships for an org:
   ```bash
   npx neonctl sql "SELECT m.role, u.name, u.email FROM member m JOIN \"user\" u ON m.user_id = u.id WHERE m.organization_id = 'org_xxx'" --output json
   ```

## Checklist

- [ ] Verified `npx neonctl --version` works
- [ ] Set `NEON_API_KEY` env var or passed `--api-key`
- [ ] Used `--output json` for parseable output
- [ ] Quoted the `"user"` table name in SQL queries
- [ ] Cleaned up preview branches after use
