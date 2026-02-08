# Supabase: Migrations and CI Verification

This document describes how database migrations and functions are validated in CI.

## Goals

- Ensure migrations are idempotent, ordered, and reversible.
- Detect schema drift early.
- Validate functions/builds and RLS policies as part of quality gates.

## CI Workflow

- database.yml spins an ephemeral DB (or uses Supabase CLI if available).
- Apply migrations using scripts/apply-migrations.*
- Run validation scripts:
  - scripts/check_db_schema.js
  - scripts/check_extensions.js
  - scripts/inspect_rpc.js (if applicable)
- Build/typecheck functions under supabase/functions/* (Node/TypeScript or Deno).
- Upload logs as artifacts.

## Local Development

- Use scripts/apply-migrations.* to apply up/down.
- Keep migrations small and reversible; prefer RLS with explicit policies.
- Run schema verification locally before pushing.

## Policies and Security

- RLS must be enabled with least privilege.
- Review policies and functions touching auth/PII.

## Troubleshooting

- Order conflicts: ensure timestamped filenames and dependency notes.
- Failing apply: check extension presence and permissions.
- Drift: regenerate types and check differences; update seed data if necessary.
