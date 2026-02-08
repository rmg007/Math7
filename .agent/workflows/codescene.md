---
description: Run continuous CodeScene Code Health analysis on the codebase
---

# /codescene - Continuous Code Health Analysis

This workflow runs CodeScene MCP to analyze code health across the Questerix codebase.

## Prerequisites
- CodeScene MCP server installed: `C:\Users\mhali\AppData\Local\Programs\cs-mcp\cs-mcp.exe`
- `.mcp_config.json` configured with `CS_ACCESS_TOKEN`
- IDE restarted to load the MCP server

## Workflow Steps

// turbo-all

### Phase 1: Full Codebase Scan

1. **Analyze admin-panel core modules**
   - Run `code_health_review` on `admin-panel/src/features/`
   - Run `code_health_review` on `admin-panel/src/services/`
   - Run `code_health_review` on `admin-panel/src/hooks/`
   - Run `code_health_score` to get overall project score

2. **Analyze student-app core modules**
   - Run `code_health_review` on `student-app/lib/src/core/`
   - Run `code_health_review` on `student-app/lib/src/features/`
   - Focus especially on sync and database layers

3. **Analyze content-engine**
   - Run `code_health_review` on `content-engine/src/`

### Phase 2: Priority Hotspots

Focus on files most likely to have issues:
- Files > 300 lines
- Files with nested callbacks
- Files with complex conditional logic
- Files modified frequently (high churn)

### Phase 3: Report Generation

1. Create summary report in `docs/reports/codescene-analysis-YYYY-MM-DD.md`
2. Extract:
   - Files with Code Health < 7 (needs attention)
   - Files with Code Health < 5 (critical)
   - Top 10 hotspots
   - Recommended refactoring priorities

### Phase 4: Document Learnings

1. Add any new bug patterns discovered to `QODO_GUIDE.md`
2. Update `docs/LEARNING_LOG.md` with analysis findings
3. Create issues for critical hotspots

## Usage

After IDE restart, ask the AI agent:
```
Run /codescene workflow - analyze the full codebase and generate a code health report
```

## MCP Tools Available

Once loaded, the CodeScene MCP provides:
- `code_health_score` - Get code health scores for files or projects
- `code_health_review` - Get detailed code health analysis with recommendations

## Expected Output

A markdown report with:
- Overall project health scores
- Per-module breakdowns
- Critical hotspots requiring attention
- Actionable refactoring recommendations
