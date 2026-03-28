---
name: drizzle-cli
description: >
  Manage Drizzle ORM schema and migrations using drizzle-kit. Use this skill when the user
  asks to generate a migration, push schema changes, run pending migrations, introspect
  the database, open Drizzle Studio, check migration status, export schema SQL, or perform
  any Drizzle-related database operations. This project uses Drizzle ORM with Neon PostgreSQL
  for the auth database (Better Auth tables: user, session, account, verification,
  organization, member, invitation).
---

# Drizzle CLI (drizzle-kit)

Manage database schema and migrations for the Neon PostgreSQL auth database using Drizzle Kit.

## When to Use

- Generating SQL migrations from schema changes in `auth-schema.ts`
- Running pending migrations against the database
- Pushing schema directly to dev (skipping migration files)
- Introspecting the current database to generate a Drizzle schema
- Opening Drizzle Studio to browse data visually
- Checking or validating migration state
- Exporting the current schema diff as raw SQL

## When Not to Use

- Convex schema changes -- edit `convex/schema.ts` directly, use `convex-migration-helper` for data migrations
- Neon branch management -- use `neon-cli`
- Querying data in the auth database -- use `neon-cli` with SQL

## Prerequisites

`drizzle-kit` is a devDependency of this project:

```bash
npx drizzle-kit --version
```

Configuration lives in `drizzle.config.ts` which reads `DATABASE_URL` from the environment.

## Project Context

### Schema Location

The Drizzle schema is defined in `auth-schema.ts` (project root). It defines 7 tables managed by Better Auth:

| Table | Key Columns | Purpose |
|-------|------------|---------|
| `user` | `id`, `name`, `email`, `emailVerified`, `image` | User identity |
| `session` | `id`, `token`, `expiresAt`, `userId`, `activeOrganizationId` | Active sessions |
| `account` | `id`, `accountId`, `providerId`, `userId`, `password` | Auth providers |
| `verification` | `id`, `identifier`, `value`, `expiresAt` | Email verification tokens |
| `organization` | `id`, `name`, `slug`, `logo`, `metadata` | Tenant organizations |
| `member` | `id`, `organizationId`, `userId`, `role` | Org membership |
| `invitation` | `id`, `organizationId`, `email`, `role`, `status`, `expiresAt`, `inviterId` | Pending invitations |

### Migrations Directory

Migrations are stored in `drizzle/`. Currently there is 1 migration:
- `0000_broken_nicolaos.sql` -- Initial schema with org/member/invitation tables

### Config File

`drizzle.config.ts` configures:
- **dialect:** `postgresql`
- **schema:** `./auth-schema.ts`
- **out:** `./drizzle`
- **dbCredentials.url:** reads from `DATABASE_URL`

## Command Reference

### Generate a migration

After editing `auth-schema.ts`, generate a SQL migration file:

```bash
npx drizzle-kit generate
```

This creates a new numbered `.sql` file in `drizzle/` (e.g., `0001_xyz.sql`). Review the SQL before running it.

### Run pending migrations

Apply all unapplied migrations to the database:

```bash
npx drizzle-kit migrate
```

This runs migrations in order and tracks which have been applied in a `__drizzle_migrations` table.

### Push schema directly (development only)

Push the current schema to the database without creating migration files. Useful for rapid iteration in development:

```bash
npx drizzle-kit push
```

**Warning:** This can be destructive. Only use on development databases. Never on production.

### Introspect the database

Generate a Drizzle schema from an existing database:

```bash
npx drizzle-kit introspect
```

Useful for verifying what's actually in the database vs. what's in `auth-schema.ts`.

### Open Drizzle Studio

Launch a web-based database browser:

```bash
npx drizzle-kit studio
```

**Note:** This opens a browser and is a long-running process. Not suitable for agent automation, but useful to suggest to the user for visual inspection.

### Check migration state

Validate that migrations are consistent:

```bash
npx drizzle-kit check
```

### Drop a migration

Remove the last generated migration (if not yet applied):

```bash
npx drizzle-kit drop
```

### Export schema as SQL

Generate the SQL diff between the current schema and an empty database:

```bash
npx drizzle-kit export
```

Useful for reviewing the full DDL.

## Workflow: Add a Column to an Auth Table

1. Edit `auth-schema.ts` to add the column:
   ```typescript
   // Example: add a 'phone' column to the user table
   phone: text('phone'),
   ```

2. Generate the migration:
   ```bash
   npx drizzle-kit generate
   ```

3. Review the generated SQL in `drizzle/`:
   ```bash
   cat drizzle/0001_*.sql
   ```

4. (Optional) Test on a Neon preview branch first:
   ```bash
   npx neonctl branches create --name preview/add-phone
   DATABASE_URL=$(npx neonctl connection-string --branch preview/add-phone) npx drizzle-kit migrate
   ```

5. Apply to the main database:
   ```bash
   npx drizzle-kit migrate
   ```

## Workflow: Verify Database Matches Schema

1. Export the expected schema:
   ```bash
   npx drizzle-kit export
   ```

2. Introspect the actual database:
   ```bash
   npx drizzle-kit introspect
   ```

3. Compare the outputs to identify drift.

## Important Notes

- **Better Auth manages these tables.** Adding columns is fine, but removing or renaming columns used by Better Auth will break authentication. Always check `auth.ts` to understand which columns Better Auth depends on.
- **The `user` table** is the identity bridge to Convex. The `user.id` maps to `users.neonUserId` in Convex. Don't change the `id` column format.
- **The `organization` table** bridges to Convex via `orgSettings.betterAuthOrgId`. The `organization.id` maps to `organizationId` fields in Convex moods and groups.

## Checklist

- [ ] Verified `npx drizzle-kit` is available
- [ ] Edited `auth-schema.ts` (not a random schema file)
- [ ] Generated migration with `npx drizzle-kit generate`
- [ ] Reviewed generated SQL before applying
- [ ] Tested on a preview branch if the change is risky
- [ ] Applied with `npx drizzle-kit migrate`
- [ ] Verified Better Auth still works after schema changes
