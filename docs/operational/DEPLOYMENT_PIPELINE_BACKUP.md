---
title: "Questerix Deployment Pipeline"
app_scope: infrastructure
doc_type: protocol
complexity: high
priority: high
status: active
summary: "Unified deployment orchestration system for all three Questerix applications using Cloudflare Pages."
tags:
  - deployment
  - cloudflare
  - ci-cd
  - orchestrator
  - powershell
related_files:
  - "infrastructure/environment-configuration.md"
  - "security/secrets-management.md"
last_validated_by: antigravity-agent-v1
last_validated_at: 2026-02-03
version: "1.0"
---

# Questerix Deployment Pipeline

> **Version:** 1.0.0  
> **Last Updated:** 2026-02-03  
> **Status:** Production Ready

## Overview

This document describes the unified deployment orchestration system for the Questerix platform. The system enables single-command deployment of all three applications with synchronized configuration.

### Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DEPLOYMENT PIPELINE                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐  │
│  │  master-config   │──────│   orchestrator   │──────│   Cloudflare     │  │
│  │     .json        │      │      .ps1        │      │     Pages        │  │
│  └──────────────────┘      └──────────────────┘      └──────────────────┘  │
│           │                         │                                        │
│           ▼                         ▼                                        │
│  ┌──────────────────┐      ┌──────────────────┐                             │
│  │    .secrets      │      │  generate-env    │                             │
│  │  (git-ignored)   │      │     .ps1         │                             │
│  └──────────────────┘      └──────────────────┘                             │
│                                     │                                        │
│           ┌─────────────────────────┼─────────────────────────┐             │
│           ▼                         ▼                         ▼             │
│  ┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐  │
│  │  Landing Pages   │      │   Admin Panel    │      │   Student App    │  │
│  │  (Static HTML)   │      │  (React+Vite)    │      │  (Flutter Web)   │  │
│  └──────────────────┘      └──────────────────┘      └──────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. First-Time Setup

```powershell
# 1. Copy the secrets template
Copy-Item .secrets.template .secrets

# 2. Fill in your credentials (edit .secrets)
notepad .secrets

# 3. Update master-config.json with your Supabase URL
notepad master-config.json

# 4. Validate the configuration
./scripts/deploy/validate-config.ps1 -ConfigFile master-config.json
```

### 2. Deploy

```powershell
# Full deployment (all apps)
./orchestrator.ps1

# Staging deployment
./orchestrator.ps1 -Env staging

# Dry run (validate without deploying)
./orchestrator.ps1 -DryRun

# Skip build (redeploy existing builds)
./orchestrator.ps1 -SkipBuild
```

## File Structure

```
questerix/
├── master-config.json          # Single source of truth (production)
├── master-config.staging.json  # Staging environment variant
├── .secrets.template           # Template for secrets file
├── .secrets                    # YOUR secrets (git-ignored)
├── .gitignore                  # Updated with security entries
├── orchestrator.ps1            # Main deployment script
│
├── scripts/deploy/
│   ├── validate-config.ps1     # Pre-flight checks
│   ├── generate-env.ps1        # Environment file generator
│   ├── build-admin.ps1         # React build wrapper
│   ├── build-student.ps1       # Flutter build wrapper
│   ├── deploy-all.ps1          # Parallel Cloudflare upload
│   └── sync-secrets.ps1        # Worker secret rotation
│
├── admin-panel/
│   ├── src/config/env.ts       # Environment accessor (React)
│   └── src/vite-env.d.ts       # TypeScript definitions
│
└── student-app/
    └── lib/src/core/config/
        └── env.dart            # Environment accessor (Flutter)
```

## Configuration

### master-config.json

The master configuration file is the **single source of truth** for all environment variables across the entire platform.

```json
{
  "version": "1.0.0",
  "environment": "production",
  
  "global": {
    "SUPABASE_URL": "https://YOUR-PROJECT.supabase.co",
    "SUPABASE_ANON_KEY": "YOUR-ANON-KEY",
    "API_BASE_URL": "https://api.questerix.com"
  },
  
  "admin": {
    "VITE_APP_NAME": "Questerix Admin",
    "VITE_SUPABASE_URL": "${global.SUPABASE_URL}"
  },
  
  "student": {
    "APP_NAME": "Questerix",
    "SUPABASE_URL": "${global.SUPABASE_URL}"
  },
  
  "cloudflare": {
    "account_id": "YOUR-ACCOUNT-ID",
    "landing_project": "questerix-landing",
    "admin_project": "questerix-admin",
    "student_project": "questerix-student"
  }
}
```

### Template Variables

| Variable | Description |
|----------|-------------|
| `${version}` | Replaced with the `version` field from config |
| `${global.SUPABASE_URL}` | Replaced with `global.SUPABASE_URL` value |
| `${global.SUPABASE_ANON_KEY}` | Replaced with `global.SUPABASE_ANON_KEY` value |

### .secrets File

Contains sensitive credentials that should **NEVER** be committed to git:

```bash
# Cloudflare API Token
CLOUDFLARE_API_TOKEN=your-token-here

# Supabase (for validation)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Supabase Service Key (server-side only)
SUPABASE_SERVICE_KEY=your-service-key

# Optional: AI Features
GEMINI_API_KEY=your-gemini-key
```

## Deployment Phases

The orchestrator executes 5 phases in sequence:

### Phase 1: Validation
- Checks required tools (node, npm, flutter, wrangler)
- Validates `.secrets` file exists and is in `.gitignore`
- Loads secrets into environment (RAM only)
- Validates JSON configuration syntax

### Phase 2: Environment Generation
- Resolves template variables (`${version}`, `${global.*}`)
- Generates `admin-panel/.env.local`
- Generates `.flutter-defines.tmp`

### Phase 3: Parallel Build
- Cleans previous build artifacts
- Builds Admin Panel (`npm run build`) in parallel
- Builds Student App (`flutter build web`) in parallel
- Verifies build outputs exist

### Phase 4: Parallel Deploy
- Deploys Landing Pages to Cloudflare Pages
- Deploys Admin Panel to Cloudflare Pages
- Deploys Student App to Cloudflare Pages

### Phase 5: Cleanup & Report
- Removes generated environment files
- Displays deployment summary with live URLs
- Logs all output to `deploy-{timestamp}.log`

## Environment Accessors

### Flutter (student-app)

```dart
import 'package:student_app/src/core/config/env.dart';

// Access configuration
final version = Env.appVersion;
final url = Env.supabaseUrl;

// Validate at startup
void main() {
  Env.validate(); // Throws if required vars missing
  runApp(MyApp());
}
```

### React (admin-panel)

```typescript
import { env, validateEnv } from '@/config/env';

// Access configuration
const version = env.appVersion;
const url = env.supabaseUrl;

// Validate at startup
validateEnv(); // Throws if required vars missing
```

## Troubleshooting

| Error | Cause | Solution |
|-------|-------|----------|
| `.secrets file not found` | Missing secrets | Copy `.secrets.template` to `.secrets` |
| `CLOUDFLARE_API_TOKEN not set` | Empty token | Fill in your API token in `.secrets` |
| `Invalid JSON in master-config.json` | Syntax error | Validate JSON syntax |
| `Admin Panel build output not found` | npm build failed | Check `admin-panel/` for errors |
| `Student App build output not found` | Flutter build failed | Check `flutter build web` output |
| `wrangler: command not found` | Wrangler not installed | Run `npm install -g wrangler` |

## Security Checklist

Before first deployment, verify:

- [ ] `.secrets` is in `.gitignore`
- [ ] `.secrets` contains valid `CLOUDFLARE_API_TOKEN`
- [ ] `.secrets` contains `SUPABASE_URL` and `SUPABASE_ANON_KEY`
- [ ] `master-config.json` does NOT contain service keys
- [ ] All placeholder values in `master-config.json` are replaced
- [ ] Run `./scripts/deploy/validate-config.ps1` passes
