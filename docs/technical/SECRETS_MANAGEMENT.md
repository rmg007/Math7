---
title: "Secrets Management"
app_scope: security
doc_type: protocol
complexity: high
priority: high
status: active
summary: "Protocol for managing sensitive credentials, API keys, and preventing accidental exposure in Git."
tags:
  - secrets
  - security
  - git
  - cloudflare
related_files:
  - "infrastructure/deployment-pipeline.md"
last_validated_by: antigravity-agent-v1
last_validated_at: 2026-02-03
version: "1.0"
---

# Secrets Management

> **Rule:** Secrets are NEVER committed to Git. No exceptions.

## File Structure

```
questerix/
├── .secrets.template     # Template (committed) - placeholders only
├── .secrets              # Actual secrets (git-ignored)
└── .gitignore           # Includes all secret patterns
```

## .secrets File Format

```bash
# Cloudflare API Token (required for deployment)
CLOUDFLARE_API_TOKEN=your-token-here

# Supabase Credentials
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key  # Server-side only!

# AI Features (optional)
GEMINI_API_KEY=your-gemini-key
```

## Security Rules

### What Can Be Committed

- `.secrets.template` with placeholder values
- `master-config.json` with non-sensitive configuration
- Environment accessor code (`env.ts`, `env.dart`)
- Documentation about secrets structure

### What Must NEVER Be Committed

- `.secrets` file
- Any file containing actual API keys
- Supabase service keys
- Database passwords
- OAuth client secrets

## .gitignore Entries

The following patterns MUST be in `.gitignore`:

```gitignore
# Secrets (NEVER commit)
.secrets
*.secrets
.env.local
.env.*.local

# Service keys
**/service-key*
**/*-service-key*

# Generated environment files
.flutter-defines.tmp
admin-panel/.env.local
```

## Incident Response

If secrets are accidentally committed:

1. **Rotate immediately** - Generate new credentials
2. **Scrub history** - Use `git-filter-repo` to remove
3. **Force push** - Overwrite remote history
4. **Audit** - Check for unauthorized access

See `git-security-and-secret-management` Knowledge Item for detailed recovery procedures.

## Verification

Before any commit:

```powershell
# Check for secrets in staged files
git diff --cached --name-only | ForEach-Object {
  if (Select-String -Path $_ -Pattern "SUPABASE_SERVICE_KEY|sk_|api_key" -Quiet) {
    Write-Error "Potential secret in: $_"
    exit 1
  }
}
```

## Cloudflare Secrets Sync

For Edge Functions/Workers that need secrets:

```powershell
# Sync secrets to Cloudflare
./scripts/deploy/sync-secrets.ps1
```

This pushes secrets from `.secrets` to Cloudflare's encrypted secrets store.
