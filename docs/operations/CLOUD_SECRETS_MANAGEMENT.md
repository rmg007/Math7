# Cloud Secrets Management System

## Overview

This document describes the comprehensive cloud-based secrets management system for Questerix, providing secure storage, rotation, and access control for all environment variables and credentials.

## Architecture

### Security Layers
1. **Cloudflare Secrets** - Primary encrypted storage
2. **Local Cache** - Temporary `.secrets` file (git-ignored)
3. **Runtime Access** - Environment variables with validation
4. **Application Layer** - Secure access with audit logging

### Environment Isolation
- **Production**: Full secrets, strict validation, complete audit trail
- **Staging**: Isolated secrets, limited scope, automated rotation
- **Development**: Mock secrets, safe defaults, no production data

## Scripts Usage

### 1. Upload Secrets
Uploads your local `.secrets` file to Cloudflare.
```powershell
.\scripts\secrets\Upload-Secrets.ps1 -Environment production
```

### 2. Download Secrets (Verification Only)
**Note**: Cloudflare secrets are write-only. This script validates that the secrets exist in the cloud but cannot retrieve their values. You must maintain a secure local backup (e.g., 1Password).
```powershell
.\scripts\secrets\Download-Secrets.ps1 -Environment production
```

### 3. Switch Environment
Configures your local environment by generating `.env` files from `master-config.json` and your local `.secrets`.
```powershell
.\scripts\secrets\Switch-Environment.ps1 -TargetEnvironment staging
```

### 4. Backup Secrets
Creates a local backup of your `.secrets` file.
```powershell
.\scripts\secrets\Backup-Secrets.ps1
```

### 5. Audit Log
View the local audit log of secret operations.
```powershell
.\scripts\secrets\Get-AuditLog.ps1 -Summary
```

## Configuration Files

- **`.secrets`**: Your local key-value store. NEVER COMMIT THIS.
- **`master-config.json`**: Template for environment configuration. Uses `${global.VAR}` placeholders.
- **`wrangler.toml`**: Cloudflare configuration with environment definitions.

## Workflow

1.  **Init**: Copy `.secrets.template` to `.secrets` and fill in values.
2.  **Upload**: Run `Upload-Secrets.ps1` to sync to Cloudflare.
3.  **Dev**: Run `Switch-Environment.ps1` to set up your local apps.
4.  **Rotate**: Update `.secrets`, run `Upload-Secrets.ps1` again.
