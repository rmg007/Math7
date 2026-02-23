# Environment Variables Directory

This document catalogs all environment variables used across the Questerix mono-repo.

## ⚖️ Conventions

1. **Naming**: Variables used by Vite/React must start with `VITE_`.
2. **Test Isolation**: All variables used for the Test Database/Staging environment MUST be prefixed with `TEST_` (e.g., `TEST_VITE_SUPABASE_URL`).
3. **No Mixing**: Never use production variables in test configuration files.
4. **Secrets**: Sensitive keys (Service Role, Sentry DSN, etc.) must NEVER be committed to version control. Use `.env.local` or `.env.test.local`.

---

## 🛠️ Admin Panel (React/Vite)

| Variable                    | Description                       | Default/Type |
| --------------------------- | --------------------------------- | ------------ |
| `VITE_SUPABASE_URL`         | Production Supabase project URL   | URL          |
| `VITE_SUPABASE_ANON_KEY`    | Production Supabase anonymous key | JWT          |
| `VITE_APP_NAME`             | Display name of the application   | string       |
| `VITE_APP_VERSION`          | Application version               | semver       |
| `VITE_WORKERS_URL`          | Cloudflare Workers API URL        | URL          |
| `VITE_ENABLE_DEBUG_LOGGING` | Enable verbose client-side logs   | boolean      |

### Test Overrides (`.env.test`, `.env.test.local`)

| Variable                         | Description                         | Default/Type |
| -------------------------------- | ----------------------------------- | ------------ |
| `TEST_VITE_SUPABASE_URL`         | Test Supabase project URL           | URL          |
| `TEST_SUPABASE_SERVICE_ROLE_KEY` | Service role key for test project   | JWT (Secret) |
| `TEST_ADMIN_EMAIL`               | E2E functional test admin account   | email        |
| `TEST_ADMIN_PASSWORD`            | E2E functional test admin password  | password     |
| `TEST_SUPER_ADMIN_EMAIL`         | E2E functional test super-admin     | email        |
| `TEST_SUPER_ADMIN_PASSWORD`      | E2E functional test super-admin pwd | password     |

---

## 🏗️ Supabase (Backend/Migrations)

| Variable                   | Description                             | Used In              |
| -------------------------- | --------------------------------------- | -------------------- |
| `DATABASE_URL`             | Primary production DB connection string | CI, local migrations |
| `TEST_DB_URL`              | Test database connection string         | CI regression tests  |
| `TEST_SUPABASE_PROJECT_ID` | Project reference for staging           | CI sync steps        |
| `TEST_DB_PASSWORD`         | Database password for staging           | CI sync steps        |

---

## 🤖 Content Engine (Python)

| Variable               | Description                   | Default/Type |
| ---------------------- | ----------------------------- | ------------ |
| `GEMINI_API_KEY`       | Google Gemini API key         | Secret       |
| `SUPABASE_URL`         | Supabase URL for content sync | URL          |
| `SUPABASE_SERVICE_KEY` | Service key for content sync  | Secret       |

---

## 🔑 CI/CD Secrets (GitHub)

These must be configured in repository settings.

- `TEST_VITE_SUPABASE_URL`
- `TEST_VITE_SUPABASE_ANON_KEY`
- `TEST_SUPABASE_PROJECT_ID`
- `TEST_DB_PASSWORD`
- `TEST_ADMIN_EMAIL`
- `TEST_ADMIN_PASSWORD`
- `TEST_SUPER_ADMIN_EMAIL`
- `TEST_SUPER_ADMIN_PASSWORD`
- `CODACY_PROJECT_TOKEN`
- `LHCI_GITHUB_APP_TOKEN`
- `SUPABASE_ACCESS_TOKEN`
