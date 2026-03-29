---
description: Audit codebase for stale docs, naming inconsistencies, and drift
---

Run a comprehensive audit of the codebase. Check for the following categories of issues and report findings grouped by severity (CRITICAL, WARNING, INFO).

## 1. Documentation Drift

Check all documentation files for accuracy against the actual source code:

- **README.md**: Compare architecture description, tech stack, scripts table, environment variable descriptions, and development workflow against `package.json`, route files, and config files.
- **AGENTS.md**: Verify the function tables, schema descriptions, project structure, and multi-tenancy model match the actual Convex functions in `convex/`, route files in `app/routes/`, and `convex/schema.ts`.
- **Agent skill files** (`.agents/skills/*/SKILL.md`): Verify that documented function names, argument types, and CLI examples match the actual source code. Pay special attention to the `convex-ops` function table.
- **`.env.example`**: Verify every listed env var is actually consumed by source code. Flag any that are vestigial.
- **`convex/README.md`**: Check if it contains project-specific content or is just generic boilerplate.

## 2. Naming Consistency

Search the entire codebase for terminology that doesn't match the current architecture:

- Look for "subdomain" references in variable names, function names, comments, form fields, and state variables. The app uses **path-based tenancy** (`/org/$slug`), so "subdomain" terminology is outdated.
- Check that imports, exports, and function references are consistent (e.g., no imports of deprecated aliases).
- Flag any `@deprecated` markers on functions that are still being imported elsewhere.

## 3. Dead Code & Vestigial Config

- Check for env vars defined in `.env.example` that are never read by source code.
- Look for exported functions that are never imported or called anywhere.
- Check for config entries (cookie domains, trusted origins, wildcard DNS) that reference the old subdomain architecture.

## Output Format

For each finding, report:
- **Severity**: CRITICAL (will cause failures), WARNING (misleading/confusing), or INFO (cleanup opportunity)
- **File**: path and line number(s)
- **Issue**: what's wrong
- **Suggestion**: how to fix it

$ARGUMENTS
