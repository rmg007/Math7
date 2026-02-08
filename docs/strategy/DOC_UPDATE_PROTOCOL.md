---
title: "Documentation Update Protocol"
app_scope: meta
doc_type: protocol
complexity: high
priority: high
status: active
summary: "Step-by-step workflow for updating documentation in the Knowledge Base."
tags:
  - workflow
  - documentation
  - maintenance
last_validated_by: antigravity-agent-v1
last_validated_at: 2026-02-03
version: "1.0"
---

# Documentation Update Protocol

> This protocol defines how AI agents and humans should update documentation in the Questerix Knowledge Base.

---

## When to Update Documentation

- **After implementing a feature**: Update relevant architecture/instruction docs
- **After fixing a bug**: Add to troubleshooting or update affected docs
- **After architectural decisions**: Create or update ADR (decision) documents
- **After discovering gotchas**: Document in relevant instruction files

---

## Standard Update Workflow

### 1. Identify the Document

```
1. Read llms.txt to find existing documentation
2. Check if document exists for your topic
3. If not, determine correct directory and doc_type
```

### 2. Create or Edit

**For New Documents:**
```
1. Copy structure from FRONTMATTER_TEMPLATE.md
2. Fill in required fields: title, app_scope, doc_type, complexity
3. Add optional fields as relevant
4. Write content following existing document patterns
```

**For Existing Documents:**
```
1. Update content as needed
2. Update last_validated_by and last_validated_at
3. Increment version if making significant changes
4. Set breaking_changes: true if behavior/API changed
```

### 3. Validate

```powershell
# Run from repository root
.\scripts\validate-frontmatter.ps1
```

### 4. Regenerate Index

```powershell
# Run from repository root
.\scripts\generate-llms-txt.ps1
```

### 5. Commit

**For Normal Documents:**
```bash
git add .
git commit -m "docs(<scope>): <description>"
git push
```

**For Critical Documents:**
```bash
git checkout -b ai-proposal/update-<doc-name>
git add .
git commit -m "docs(<scope>): <description>"
git push -u origin ai-proposal/update-<doc-name>
# Create PR and wait for human approval
```

---

## Commit Message Format

Follow conventional commits:

```
docs(<scope>): <description>

Scope: admin-panel, student-app, infrastructure, security, meta
Examples:
  docs(admin-panel): Add bulk import instruction
  docs(security): Update RLS policy documentation
  docs(meta): Add new frontmatter field to schema
```

---

## Document Lifecycle

| Status | Meaning | Action |
|--------|---------|--------|
| `active` | Current and maintained | Normal updates allowed |
| `draft` | Work in progress | Complete before using |
| `needs-review` | Flagged for attention | Human should review |
| `deprecated` | Superseded | Reference only, update to point to replacement |
| `archived` | Historical | Do not update, keep for reference |

---

## Quality Checklist

Before committing any documentation update:

- [ ] Frontmatter is valid (run validate-frontmatter.ps1)
- [ ] Title is clear and descriptive
- [ ] Summary is under 300 characters
- [ ] Tags are lowercase and hyphenated
- [ ] Related files exist (if specified)
- [ ] Code examples are tested
- [ ] Links are valid
