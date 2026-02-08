# Math7 → Questerix: Complete Transformation Plan

**Document Version:** 2.0  
**Created:** 2026-02-03  
**Status:** Planning Phase (No Code Changes Yet)  
**GitHub Repositories:**
- Main: https://github.com/rmg007/Questerix
- Docs Backup: Questerix-Docs-Backup (to be updated or archived)

---

## Executive Summary

This is a **comprehensive transformation plan** covering:
1. ✅ Code renaming (Math7 → Questerix)
2. ✅ Database migration (math7 → questerix)
3. ✅ Domain transition (math7.app → Farida.Questerix.com)
4. ✅ Documentation consolidation (single source of truth)
5. ✅ Repository cleanup

**Principle:** One source of truth. Remove duplicates. Everything lives in GitHub.
**CRITICAL PROTOCOL:** ZERO DATA LOSS. Changes must preserve 100% of user data (offline & online).

---

## Part 1: Current State Audit

### Repositories

| Repository | Location | Purpose | Action Needed |
|------------|----------|---------|---------------|
| **Questerix** (main) | `C:\...\Questerix` | Main codebase | Update references |
| **Questerix-Docs-Backup** | `C:\...\Questerix-Docs-Backup` | Doc archive | Update or Archive |

### Questerix-Docs-Backup Contents
```
Questerix-Docs-Backup/
├── README.md                    # Still references "Math7"
├── admin-panel/
│   └── architecture.md          # 4KB
├── student-app/
│   └── architecture.md          # 10KB
├── infrastructure/
│   └── deployment-pipeline.md   # 10KB
├── security/
│   ├── rls-policies.md          # 3KB
│   └── secrets-management.md    # 3KB
├── prompts/
│   ├── antigravity-rules.md     # 3KB
│   └── doc-update-protocol.md   # 3KB
├── meta/
│   └── maintenance-guide.md     # 2KB
└── reports/                     # Empty
```

**Decision Needed:** Archive this repo entirely, or merge valuable content into main repo?

### Main Repo Documentation Audit

**Root Level (39 .md files at depth ≤2):**
| Category | Files | Action |
|----------|-------|--------|
| Active docs | `AGENTS.md`, `ROADMAP.md`, `README.md` | Keep, update |
| Session artifacts | `SESSION_*.md`, `*_SUMMARY.md` | Archive or delete |
| Reports | `*_REPORT.md` | Archive |
| Transformation | `QUESTERIX_TRANSFORMATION_PLAN.md` | Keep as historical record |

**`docs/` Directory:**
| File | Size | Contains Math7? | Action |
|------|------|-----------------|--------|
| `DEPLOYMENT_PIPELINE.md` | 12KB | Maybe | Check & update |
| `DEVELOPMENT.md` | 7KB | Maybe | Check & update |
| `CI_CONTRACT.md` | 2KB | No | Keep |
| `MCP_SETUP_GUIDE.md` | 3KB | No | Keep |
| `SHADCN_GUIDE.md` | 2KB | No | Keep |
| `VALIDATION.md` | 3KB | No | Keep |
| Various session files | ~20KB | No | Archive |

**`docs/archive/` (10 files, 71KB):**
Already archived - these are stale. Consider deletion.

---

## Part 2: Domain Transition

### Old Domain Structure
```
math7.app                    # Main app domain
├── / (landing page)
├── /app (Flutter student app)
└── /admin (Admin panel - maybe separate)
```

### New Domain Structure
```
Questerix.com                # Root hub (future multi-tenant)
├── Farida.Questerix.com     # First tenant (formerly Math7)
│   ├── / (landing page)
│   ├── /app (Flutter student app)
│   └── Related subdomains
├── [Future].Questerix.com   # Future tenants
└── admin.questerix.com      # Admin panel (or admin.farida.questerix.com)
```

### Domain Changes Required

| Component | Old URL | New URL | Config Location |
|-----------|---------|---------|-----------------|
| Student App | math7.app | Farida.Questerix.com | `master-config.json` |
| Landing Page | math7.app | Farida.Questerix.com | `landing-pages/index.html` |
| Admin Panel | ? | admin.questerix.com | `master-config.json` |
| API | api.questerix.com | api.questerix.com | `master-config.json` |
| Supabase | qvslbiceoonrgjzkotb.supabase.co | Same | N/A |

### Critical: Legacy Domain Strategy (The "Origin-Trap" Fix)
**Problem:** Redirecting `math7.app` to `Questerix.com` creates a new Origin, causing browsers to permanently lose access to IndexedDB (offline data).
**Solution:** 
1. **Maintain `math7.app`** indefinitely for existing users. 
2. Only route **NEW** sign-ups to `Farida.Questerix.com`.
3. Legacy branding can slowly fade, but the domain must remain active to serve the existing cached app.

### Files Requiring Domain Updates

**`master-config.json`:**
```json
// CURRENT
"API_BASE_URL": "https://api.questerix.com"

// May need to add:
"STUDENT_APP_URL": "https://Farida.Questerix.com"
"ADMIN_PANEL_URL": "https://admin.questerix.com"
```

**`landing-pages/index.html`:**
```html
<!-- CURRENT (Wrong) -->
<meta property="og:url" content="https://math7.app/" />

<!-- NEW -->
<meta property="og:url" content="https://Farida.Questerix.com/" />
```

**`landing-pages/src/pages/RootPage.tsx`:**
```typescript
// CURRENT
'https://math.questerix.com'

// UPDATE TO:
'https://Farida.Questerix.com'
```

**`landing-pages/src/components/Footer.tsx`:**
```typescript
// Same pattern as above
```

**Email addresses in legal pages:**
- `privacy@questerix.com` - Keep as-is (brand level)
- `legal@questerix.com` - Keep as-is (brand level)
- `accessibility@questerix.com` - Keep as-is (brand level)

---

## Part 3: Code Renaming

### 3.1 Package Rename (`math7_domain/` → `questerix_domain/`)

| Item | Change |
|------|--------|
| Folder | `math7_domain/` → `questerix_domain/` |
| `pubspec.yaml` | `name: math7_domain` → `name: questerix_domain` |
| Export file | `lib/math7_domain.dart` → `lib/questerix_domain.dart` |
| Student app dependency | Update path reference |
| All imports (~25 files) | `package:math7_domain/...` → `package:questerix_domain/...` |

### 3.2 App Class Rename

| File | Old | New |
|------|-----|-----|
| `lib/src/app.dart` | `class Math7App` | `class QuesterixApp` |
| `lib/src/app.dart` | `_Math7AppState` | `_QuesterixAppState` |
| `lib/src/app.dart` | `title: 'Math7'` | `title: 'Questerix'` |
| `lib/main.dart` | `Math7App()` | `QuesterixApp()` |

### 3.3 Database Rename (⚠️ CRITICAL SAFETY UPDATE)

| File | Old | New |
|------|-----|-----|
| `lib/src/core/database/database.dart` | `name: 'math7'` | `name: 'questerix'` |

**Local Storage Sandbox Protocol:**
To support multi-tenancy on shared devices (e.g., proper isolation between subdomains), the database filename MUST include the `app_id` or tenant identifier.
*   **Format:** `db_{tenant}.sqlite` (e.g., `db_math7.sqlite`)

**Mandatory Migration Logic (Zero Data Loss):**
We **REJECT** the option of data loss. The app must execute a filesystem migration on startup:
```dart
// Startup Check (Pseudo-code)
final oldDb = File('math7.db');
final newDb = File('questerix.db'); // Or db_{tenant}.sqlite

if (await oldDb.exists() && !await newDb.exists()) {
  await oldDb.rename(newDb.path);
  log('✅ Migrated legacy database to new naming convention.');
}
```
**Decision:** Option 2 (Migration) is **MANDATORY**. Option 1 is **FORBIDDEN**.

### 3.4 UI Text Updates

| Screen | Strings to Update |
|--------|-------------------|
| `welcome_screen.dart` | "Welcome to Math7", "Math7 app logo", account hints |
| `onboarding_screen.dart` | "Welcome to Math7", terms text |
| `terms_of_service_screen.dart` | 6 instances of "Math7" |
| `privacy_policy_screen.dart` | 3 instances of "Math7" |
| `settings_screen.dart` | "Math7 Student" |

### 3.5 Test File Updates

| Test File | Changes |
|-----------|---------|
| `app_flow_test.dart` | Import, widget, assertion |
| `welcome_screen_test.dart` | Import, assertion |
| `domains_screen_test.dart` | Import |
| `skills_screen_test.dart` | Import |
| `practice_screen_test.dart` | Import |
| `mappers_test.dart` | Import |

---

## Part 4: Landing Pages Transformation

### SEO Updates (`landing-pages/index.html`)

| Meta Tag | Current Value | New Value |
|----------|---------------|-----------|
| `<title>` | Math7 - Accessible Math... | Questerix - Accessible Learning... |
| `name="title"` | Math7 - ... | Questerix - ... |
| `name="description"` | Math7 is a fully accessible... | Questerix is a fully accessible... |
| `og:url` | https://math7.app/ | https://Farida.Questerix.com/ |
| `og:title` | Math7 - ... | Questerix - ... |
| `twitter:title` | Math7 - ... | Questerix - ... |
| Schema.org `name` | Math7 | Questerix |

### Component Updates

| File | Change |
|------|--------|
| `src/pages/RootPage.tsx` | Update domain links |
| `src/components/Footer.tsx` | Update domain links |
| Contact emails | Keep as @questerix.com |

---

## Part 5: Documentation Consolidation

### Single Source of Truth Strategy

**Principle:** All documentation lives in the main `Questerix` repository. The `Questerix-Docs-Backup` repo becomes either:
- A) **Archived** (read-only, no updates)
- B) **Deleted** (if content is redundant)

### Main Repo Documentation Structure (Proposed)

```
Questerix/
├── README.md                 # Quick start, links to docs
├── AGENTS.md                 # AI agent instructions (keep)
├── ROADMAP.md                # Project roadmap (keep)
│
├── docs/                     # All documentation
│   ├── README.md             # Docs index
│   ├── architecture/         # Technical architecture
│   │   ├── admin-panel.md
│   │   ├── student-app.md
│   │   └── database.md
│   ├── guides/               # How-to guides
│   │   ├── development.md
│   │   ├── deployment.md
│   │   └── mcp-setup.md
│   ├── security/             # Security docs
│   │   ├── rls-policies.md
│   │   └── secrets.md
│   └── api/                  # API documentation
│       └── rpc-docs.md
│
├── .agent/                   # Agent-specific files
│   ├── workflows/            # Workflow definitions
│   └── artifacts/            # Session artifacts (ephemeral)
│
└── [app directories]         # Source code
```

### Files to Archive or Delete

**From Root (move to `docs/archive/` or delete):**
- `ADMIN_PANEL_E2E_TESTS.md`
- `ADMIN_PANEL_REVIEW_SUMMARY.md`
- `PERFORMANCE_OPTIMIZATION_REPORT.md`
- `SECURITY_AUDIT_REPORT.md`
- `RUN_ECOSYSTEM.md`

**From `docs/`:**
- Session summaries (`SESSION_*.md`) → Delete
- Report files (`*_REPORT.md`) → Archive
- Old status files → Delete

**From `docs/archive/` (71KB):**
- Review for deletion (already stale)

### Questerix-Docs-Backup Repo

**Options:**
1. **Archive on GitHub** - Mark as archived, keep for reference
2. **Merge valuable content** - Copy unique docs to main repo, then archive
3. **Delete** - If all content is redundant

**Recommendation:** Option 1 (Archive) - Low effort, preserves history

**Required Updates to `Questerix-Docs-Backup/README.md`:**
```markdown
# Questerix Documentation Archive

> ⚠️ **This repository is ARCHIVED**
> All active documentation now lives in the main 
> [Questerix repository](https://github.com/rmg007/Questerix).

## Historical Reference Only
This repo contains point-in-time documentation snapshots.
Do not treat as source of truth.
```

---

## Part 6: Execution Plan

### Phase 1: Documentation Cleanup (30 min)
**No code changes, just organization**

1. [ ] Create `docs/archive/` backup of stale files
2. [ ] Delete session summaries from `docs/`
3. [ ] Update `Questerix-Docs-Backup/README.md` with archive notice
4. [ ] Commit documentation cleanup

### Phase 2: Package Rename (45 min)
**Critical foundation work**

1. [ ] Rename `math7_domain/` → `questerix_domain/`
2. [ ] Update `questerix_domain/pubspec.yaml`
3. [ ] Rename `lib/math7_domain.dart` → `lib/questerix_domain.dart`
4. [ ] Update `student-app/pubspec.yaml` dependency path
5. [ ] Run `flutter pub get` in student-app
6. [ ] Verify: `flutter analyze`

### Phase 3: Import Updates (30 min)
**Bulk find-replace**

1. [ ] Update all `import 'package:math7_domain/...` statements
   - Student app source files (~15 files)
   - Student app test files (~6 files)
2. [ ] Verify: `flutter analyze`

### Phase 4: App Class Rename (15 min)

1. [ ] Rename `Math7App` → `QuesterixApp` in `app.dart`
2. [ ] Update references in `main.dart`
3. [ ] Update test files
4. [ ] Verify: `flutter test`

### Phase 5: Database Migration (30 min)
**MANDATORY Zero Data Loss Migration**

1. [ ] Change `name: 'math7'` → `name: 'questerix'` in `database.dart`
2. [ ] **REQUIRED:** Implement filesystem migration logic in `main.dart`:
   ```dart
   // Check if old DB exists, rename to new DB path
   final oldDb = File(join(appDocDir, 'math7.db'));
   final newDb = File(join(appDocDir, 'questerix.db'));
   if (await oldDb.exists() && !await newDb.exists()) {
     await oldDb.rename(newDb.path);
   }
   ```
3. [ ] Run code generation: `dart run build_runner build`
4. [ ] Verify: `flutter test`

### Phase 6: UI Text Updates (30 min)

1. [ ] Update `welcome_screen.dart` (5 strings)
2. [ ] Update `onboarding_screen.dart` (2 strings)
3. [ ] Update `terms_of_service_screen.dart` (6 strings)
4. [ ] Update `privacy_policy_screen.dart` (3 strings)
5. [ ] Update `settings_screen.dart` (1 string)
6. [ ] Verify: `flutter test`

### Phase 7: Landing Pages (30 min)

1. [ ] Update `index.html` SEO tags (7 items)
2. [ ] Update domain references in:
   - `RootPage.tsx`
   - `Footer.tsx`
3. [ ] Verify: `npm run build`

### Phase 8: Configuration Updates (15 min)

1. [ ] Update `master-config.json` with new domains
2. [ ] Update `master-config.staging.json`
3. [ ] Update any Cloudflare/deployment configs

### Phase 9: Final Verification (30 min)

1. [ ] Global search for "Math7" (case-insensitive) - should return 0 in code
2. [ ] Global search for "math7.app" - should return 0
3. [ ] Run all tests:
   - `flutter test` (student-app)
   - `npm run test` (admin-panel)
   - `npm run build` (landing-pages)
4. [ ] Manual smoke test in browser

### Phase 10: Git & Deployment (15 min)

1. [ ] Create comprehensive commit:
   ```
   feat: Complete Math7 → Questerix transformation
   
   - Renamed math7_domain package to questerix_domain
   - Updated all imports and class names
   - Implemented Zero Data Loss database migration
   - Updated all UI text to Questerix branding
   - Updated SEO and domain references
   - Consolidated documentation
   
   BREAKING: None. Existing user data is preserved via filesystem migration.
   ```
2. [ ] Push to GitHub
3. [ ] Update Cloudflare Pages custom domains
4. [ ] Archive `Questerix-Docs-Backup` repo on GitHub
5. [ ] Verify `math7.app` remains active for legacy users

---

## Part 7: Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| ~~Database name change = data loss~~ | ~~HIGH~~ | ~~MEDIUM~~ | **MITIGATED**: Mandatory filesystem migration implemented |
| Missed "Math7" references | MEDIUM | LOW | Comprehensive grep search |
| Import typos break build | LOW | HIGH | `flutter analyze` before commit |
| DNS propagation delays | LOW | MEDIUM | Patience, check propagation |
| SEO ranking impact | MEDIUM | MEDIUM | Submit sitemap, maintain `math7.app` for legacy |
| Origin-Storage data loss (Web) | HIGH | HIGH | **MITIGATED**: Keep `math7.app` active indefinitely |

### Rollback Strategy
If the deployment fails mid-way:
1. **Git Revert:** `git revert HEAD~1` to undo the transformation commit.
2. **DNS Restore:** Point custom domains back to previous deployment.
3. **Supabase:** No database schema changes are involved; no rollback needed.
4. **Communicate:** If users are affected, send notification via app update or email.

---

## Part 8: Verification Checklist

### Pre-Commit Checks

```powershell
# 1. No Math7 references in code
grep -ri "math7" student-app/lib --include="*.dart" | wc -l
# Expected: 0

# 2. No Math7 references in tests
grep -ri "math7" student-app/test --include="*.dart" | wc -l
# Expected: 0

# 3. No math7.app domain references (Exclude Legacy Configs)
grep -ri "math7.app" . --include="*.html" --include="*.tsx" --include="*.ts" | grep -v "legacy" | wc -l
# Expected: 0 (Except in legacy-support configuration files)

# 4. Flutter builds
cd student-app && flutter analyze && flutter test

# 5. Landing pages build
cd landing-pages && npm run build

# 6. Admin panel builds
cd admin-panel && npm run build
```

### Post-Deploy Checks

- [ ] Farida.Questerix.com loads correctly
- [ ] Student app shows "Questerix" branding
- [ ] Admin panel functions correctly
- [ ] Legal pages show "Questerix" throughout
- [ ] SEO meta tags are correct

---

## Part 9: Resolved Decisions

| # | Question | **Final Answer** | Rationale |
|---|----------|------------------|----------|
| 1 | **Database migration** | ✅ **B) Write migration code** | Zero Data Loss is mandatory. |
| 2 | **Docs-Backup repo** | ✅ **A) Archive on GitHub** | Low effort, preserves history. |
| 3 | **Admin panel domain** | ✅ **A) admin.questerix.com** | Simpler, brand-level domain. |
| 4 | **math7.app handling** | ✅ **C) Keep Active (No Redirect)** | Prevents Origin-Storage data loss for existing users. New users go to Questerix domain. |

---

## Appendix A: Complete File Change List

### Package Rename
| Action | Path |
|--------|------|
| RENAME FOLDER | `math7_domain/` → `questerix_domain/` |
| EDIT | `questerix_domain/pubspec.yaml` |
| RENAME FILE | `questerix_domain/lib/math7_domain.dart` → `questerix_domain/lib/questerix_domain.dart` |
| EDIT | `questerix_domain/lib/questerix_domain.dart` (internal exports) |
| EDIT | `questerix_domain/README.md` |
| EDIT | `student-app/pubspec.yaml` |

### Student App - Source Files (Imports)
| File | Line |
|------|------|
| `lib/src/app.dart` | Class rename + title |
| `lib/main.dart` | Widget reference |
| `lib/src/core/database/database.dart` | DB name |
| `lib/src/core/database/mappers.dart` | Import |
| `lib/src/core/sync/sync_service.dart` | Import |
| `lib/src/features/auth/providers/auth_providers.dart` | Import |
| `lib/src/features/auth/repositories/supabase_auth_repository.dart` | Import |
| `lib/src/features/auth/screens/welcome_screen.dart` | Import + UI text |
| `lib/src/features/auth/screens/onboarding_screen.dart` | UI text |
| `lib/src/features/auth/screens/terms_of_service_screen.dart` | UI text |
| `lib/src/features/auth/screens/privacy_policy_screen.dart` | UI text |
| `lib/src/features/settings/screens/settings_screen.dart` | UI text |
| `lib/src/features/curriculum/screens/domains_screen.dart` | Import |
| `lib/src/features/curriculum/screens/skills_screen.dart` | Import |
| `lib/src/features/curriculum/screens/practice_screen.dart` | Import |
| `lib/src/features/progress/repositories/attempt_repository.dart` | Import |
| `lib/src/features/curriculum/repositories/local/drift_domain_repository.dart` | Import |
| `lib/src/features/curriculum/repositories/local/drift_skill_repository.dart` | Import |
| `lib/src/features/curriculum/repositories/local/drift_question_repository.dart` | Import |
| `lib/src/features/curriculum/repositories/remote/supabase_domain_repository.dart` | Import |
| `lib/src/features/curriculum/repositories/remote/supabase_skill_repository.dart` | Import |
| `lib/src/features/curriculum/repositories/remote/supabase_question_repository.dart` | Import |
| `lib/src/features/curriculum/repositories/interfaces/domain_repository.dart` | Import |
| `lib/src/features/curriculum/repositories/interfaces/skill_repository.dart` | Import |
| `lib/src/features/curriculum/repositories/interfaces/question_repository.dart` | Import |

### Student App - Test Files
| File | Changes |
|------|---------|
| `test/ui/app_flow_test.dart` | Import, widget, assertion |
| `test/features/auth/screens/welcome_screen_test.dart` | Import, assertion |
| `test/features/curriculum/screens/domains_screen_test.dart` | Import |
| `test/features/curriculum/screens/skills_screen_test.dart` | Import |
| `test/features/curriculum/screens/practice_screen_test.dart` | Import |
| `test/core/database/mappers_test.dart` | Import |

### Landing Pages
| File | Changes |
|------|---------|
| `index.html` | 7 SEO/meta tag updates |
| `src/pages/RootPage.tsx` | Domain URL |
| `src/components/Footer.tsx` | Domain URL |

### Configuration
| File | Changes |
|------|---------|
| `master-config.json` | Add/update domain URLs |
| `master-config.staging.json` | Add/update domain URLs |

### Documentation
| File | Changes |
|------|---------|
| `Questerix-Docs-Backup/README.md` | Update to archive notice |
| Various `.md` files in main repo | Remove stale references |

### Admin Panel Verification
| File | Expected State |
|------|----------------|
| `src/components/layout/sidebar.tsx` | Header shows "Questerix" (Already correct) |
| `index.html` | `<title>` contains "Questerix" |
| `package.json` | `name` field is `admin-panel` (No change needed) |

### Platform Metadata (If Applicable)
| Platform | File | Field to Update |
|----------|------|----------------|
| Android | `android/app/src/main/AndroidManifest.xml` | `android:label` |
| iOS | `ios/Runner/Info.plist` | `CFBundleDisplayName` |
| Web | `web/index.html` | `<title>` tag |

*Note: Verify if app is currently distributed via stores. If web-only, Android/iOS can be skipped.*

---

## Appendix B: Estimated Timeline

| Phase | Duration | Cumulative |
|-------|----------|------------|
| Phase 1: Doc Cleanup | 30 min | 0:30 |
| Phase 2: Package Rename | 45 min | 1:15 |
| Phase 3: Import Updates | 30 min | 1:45 |
| Phase 4: App Class Rename | 15 min | 2:00 |
| Phase 5: Database Migration | 30 min | 2:30 |
| Phase 6: UI Text Updates | 30 min | 3:00 |
| Phase 7: Landing Pages | 30 min | 3:30 |
| Phase 8: Config Updates | 15 min | 3:45 |
| Phase 9: Final Verification | 30 min | 4:15 |
| Phase 10: Git & Deploy | 15 min | 4:30 |

**Total Estimated Time: 4-5 hours**

---

**Document Status:** Ready for Review  
**Next Action:** Approve plan and answer open decisions

---

*Plan created: 2026-02-03*  
*Last updated: 2026-02-03T10:35*

---

## Appendix C: Related Documents

| Document | Purpose | Status |
|----------|---------|--------|
| `MENTOR_DASHBOARD_ARCHITECTURE.md` | Parent/Teacher feature design | Separate Scope |
| `MENTOR_FEATURE_IMPACT.md` | Impact analysis for Mentor features | Separate Scope |
| `REMEDIATION_PLAN.md` | Security & Env hardening | Completed |

*The Mentor Dashboard feature is intentionally **out of scope** for this renaming plan. It will be executed as a subsequent phase after the rebranding is complete.*
