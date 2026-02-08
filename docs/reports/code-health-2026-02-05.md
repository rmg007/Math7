# Code Health Analysis Report
**Date**: 2026-02-05  
**Tool**: dependency-cruiser + file analysis

---

## Executive Summary

| Metric | Value | Status |
|--------|-------|--------|
| **Modules Analyzed** | 140 | - |
| **Dependencies Tracked** | 423 | - |
| **Circular Dependencies** | 0 | ✅ Pass |
| **Architecture Violations** | 0 | ✅ Pass |
| **Orphan Modules** | 0 | ✅ Pass |

**Overall Status**: ✅ **HEALTHY** - No dependency violations detected

---

## Large Files (Potential Hotspots)

### Admin Panel (>200 lines)

| Lines | File | Priority |
|-------|------|----------|
| 1140 | `database.types.ts` | ⚪ Generated - OK |
| 845 | `question-list.tsx` | 🔴 Critical |
| 748 | `skill-list.tsx` | 🔴 Critical |
| 710 | `question-form.tsx` | 🔴 Critical |
| 679 | `domain-list.tsx` | 🟡 High |
| 558 | `GroupDetailPage.tsx` | 🟡 High |
| 456 | `ErrorLogsPage.tsx` | 🟡 High |
| 390 | `GenerationPage.tsx` | 🟠 Medium |
| 348 | `ai-generator-page.tsx` | 🟠 Medium |

### Student App (>200 lines)

| Lines | File | Priority |
|-------|------|----------|
| 7086 | `database.g.dart` | ⚪ Generated - OK |
| 1038 | `practice_screen.dart` | 🔴 Critical |
| 637 | `question_widgets.dart` | 🟡 High |
| 626 | `onboarding_screen.dart` | 🟡 High |
| 542 | `app_theme.dart` | 🟠 Medium (design tokens) |
| 504 | `settings_screen.dart` | 🟡 High |
| 383 | `progress_screen.dart` | 🟠 Medium |

---

## Architecture Health

### Rules Validated

| Rule | Status | Description |
|------|--------|-------------|
| `no-circular` | ✅ Pass | No circular dependencies |
| `no-orphans` | ✅ Pass | No unused modules |
| `not-to-test` | ✅ Pass | Production clean of test imports |
| `not-to-dev-dep` | ✅ Pass | No dev deps in production |
| `feature-isolation` | ✅ Pass | Features properly isolated |
| `no-utils-to-features` | ✅ Pass | Utils don't depend on features |
| `no-hooks-to-pages` | ✅ Pass | Hooks don't import pages |

---

## Recommendations

### 🔴 Critical (Refactor Soon)

1. **`question-list.tsx`** (845 lines)
   - Extract table logic to separate component
   - Move filtering/sorting to custom hook
   
2. **`skill-list.tsx`** (748 lines)
   - Similar pattern to question-list, needs decomposition
   
3. **`practice_screen.dart`** (1038 lines)
   - Split into smaller widgets
   - Extract quiz logic to separate service

### 🟡 High (Plan Refactoring)

4. **Form components** (`question-form`, `domain-list`, `GroupDetailPage`)
   - Consider extracting form sections into sub-components
   
5. **Settings/Onboarding screens**
   - Break into step components

### ⚪ Generated Files (Ignore)

- `database.types.ts` - Supabase generated
- `database.g.dart` - Drift generated

---

## Interactive Report

Open `dependency-report.html` in browser for visual dependency graph.

---

## Next Steps

1. Run `/process` on critical files when ready to refactor
2. Re-run `npm run deps:validate` after major changes
3. Consider adding to CI pipeline for continuous monitoring
