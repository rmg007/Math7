# supabase/seeds/

This directory contains declarative seed files for the Questerix database.

## Files

| File              | Purpose                                                              |
| :---------------- | :------------------------------------------------------------------- |
| `01_e2e_seed.sql` | Core E2E test data — apps, subjects, invitation codes, landing pages |

## Conventions

1. **Declarative** — Every INSERT uses `ON CONFLICT DO UPDATE` or `DO NOTHING`. Running seeds multiple times always produces the same state.
2. **Idempotent** — Never use `INSERT` without a conflict clause. Never truncate tables.
3. **UUIDs are stable** — The UUIDs used in seeds are constants, not `gen_random_uuid()`. This ensures foreign keys are portable across environments.
4. **Test accounts** — Auth users are never seeded via SQL (Supabase Auth handles that). Use `global-setup.ts` or manual Dashboard creation.

## Credential Convention

> All test accounts use `email == password` as their credentials.
> e.g., `testadmin@questerix.com` → password: `testadmin@questerix.com`

| Email                      | Role          | Purpose                  |
| :------------------------- | :------------ | :----------------------- |
| `testsuper@questerix.com`  | `super_admin` | Primary E2E super-admin  |
| `testsuper2@questerix.com` | `super_admin` | Cross-app tests          |
| `testsuper3@questerix.com` | `super_admin` | Parallel test isolation  |
| `testadmin@questerix.com`  | `admin`       | Primary E2E admin        |
| `testadmin2@questerix.com` | `admin`       | Concurrent-session tests |
| `testadmin3@questerix.com` | `admin`       | RBAC boundary tests      |
| `testmentor@questerix.com` | `mentor`      | Mentor Hub tests         |

## Running Seeds

### Local (after db reset)

```bash
supabase db reset
# seed.sql and seeds/ are applied automatically
```

### Manual (against any environment)

```bash
psql $DATABASE_URL -f supabase/seeds/01_e2e_seed.sql
```

### In E2E CI

The `admin-panel-e2e.yml` workflow runs `supabase db push` which applies migrations but not seeds. Seeds are applied via the test global-setup (see `admin-panel/tests/global-setup.ts`).
