---
title: "Knowledge Base Maintenance Guide"
app_scope: meta
doc_type: instruction
complexity: medium
priority: normal
status: active
summary: "How to maintain, update, and validate the Questerix Knowledge Base repository."
tags:
  - maintenance
  - documentation
  - workflow
last_validated_by: antigravity-agent-v1
last_validated_at: 2026-02-03
version: "1.0"
---

# Knowledge Base Maintenance Guide

## Overview

This repository serves as the Long-Term Memory for AI agents working on Questerix. Regular maintenance ensures documentation remains accurate and useful.

## Regular Tasks

### After Each Work Session

1. **Update relevant docs** if implementation changed
2. **Run validation** to ensure frontmatter is correct
3. **Regenerate index** to keep `llms.txt` current

```powershell
cd Questerix-Docs-Backup
.\scripts\validate-frontmatter.ps1
.\scripts\generate-llms-txt.ps1
git add .
git commit -m "docs: Update after [task description]"
git push
```

### Weekly Maintenance

1. **Review `status: needs-review`** documents
2. **Check for outdated docs** (not updated in 30+ days)
3. **Verify related_files** links are valid

### Monthly Audit

1. **Schema review** - Does `SCHEMA.yml` need new fields?
2. **Coverage check** - Are any code areas undocumented?
3. **Cleanup** - Archive deprecated documents

## Updating the Schema

If new frontmatter fields are needed:

1. Edit `SCHEMA.yml` to add the field
2. Update `FRONTMATTER_TEMPLATE.md` with examples
3. Update `validate-frontmatter.ps1` to check new field
4. Update existing docs if field is required

## Archiving Documents

To mark a document as obsolete:

```yaml
---
status: deprecated
# or
status: archived
---
```

Deprecated docs are kept for reference but excluded from active search.

## Troubleshooting

### Validation Fails

```
Error: Missing required field: app_scope
```

**Fix:** Add the missing field to the document's frontmatter.

### llms.txt Not Updating

```powershell
# Force regeneration
.\scripts\generate-llms-txt.ps1 -Force
```

### Related File Not Found

```
Warning: Related file not found: security/old-file.md
```

**Fix:** Update `related_files` in the document or create the missing file.

## Backup Strategy

The Git repository IS the backup. Additionally:

- GitHub provides redundancy
- Local clones on development machines
- Export to JSON on major milestones (optional)
