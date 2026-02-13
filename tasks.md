# Questerix Development Tasks

## 🚨 IMMEDIATE ACTION REQUIRED - Deployment Blocked

**Status**: Deployment is blocked by 7 lint errors + 1 warning  
**Priority**: P0 - Must fix before deployment  
**Estimated Time**: 15-30 minutes

### Current Blocker: Lint Errors

The deployment pipeline (`orchestrator.ps1`) runs preflight checks that include linting. Currently failing with:

```
✗ 7 errors (explicit 'any' types)
✗ 1 warning (non-null assertion)
```

**Files to Fix:**

1. **`admin-panel/src/features/curriculum/components/domain-form.tsx`**
   - Line 115: Replace `any` with proper type from `database.types.ts`

2. **`admin-panel/src/features/curriculum/components/question-form.tsx`**
   - Line 240: Replace `any` with proper type

3. **`admin-panel/src/features/mentorship/pages/GroupDetailPage.tsx`**
   - Lines 444, 445, 456 (×2), 457: Replace `any` types (5 total)

4. **`admin-panel/src/features/platform/pages/LandingsPage.tsx`**
   - Line 87: Fix non-null assertion warning

**How to Fix:**

```bash
# 1. Check the specific errors
cd admin-panel
npm run lint

# 2. For each 'any' type, replace with the correct type from database.types.ts
# Example: any → Database['public']['Tables']['domains']['Row']

# 3. Verify fix
npm run lint

# 4. Run full preflight
cd ..
./scripts/preflight.ps1

# 5. Deploy
./orchestrator.ps1
```

---

## 🎯 CURRENT PRIORITIES

### P0: Super Admin Capabilities

- [ ] **Super Admin must see everything** — Implement comprehensive visibility for super_admin role
  - [ ] Dashboard: Show aggregated stats across ALL apps (not just current app)
  - [ ] User Management: View all users across all tenants
  - [ ] Error Logs: View errors from all apps
  - [ ] Platform-wide analytics and monitoring
  - [ ] Cross-tenant search and filtering capabilities

**Implementation Notes:**

- Check user role in `AppContext` or create `SuperAdminContext`
- Modify queries to remove `app_id` filter when `role === 'super_admin'`
- Add toggle UI to switch between "Current App" and "All Apps" view
- Update RLS policies to allow super_admin cross-tenant reads

---

## ✅ COMPLETED TODAY (2026-02-14)

### Accessibility Fixes ✅

- [x] **WCAG 2 AA Compliance Achieved**
  - Fixed all `button-name` violations (added aria-labels)
  - Fixed all `color-contrast` violations (gray-400 → gray-600)
  - **Test Results**: 5/5 passing (was 1/5)
  - Pages tested: Login, Dashboard, Domains, Questions, Bulk Import

**Files Modified:**

1. `admin-panel/src/components/layout/sidebar.tsx` - Added aria-labels to icon buttons
2. `admin-panel/src/features/curriculum/components/domain-list.tsx` - Fixed contrast
3. `admin-panel/src/features/auth/components/super-admin-guard.tsx` - Fixed contrast
4. `admin-panel/src/features/ai-content/pages/BulkImportPage.tsx` - Fixed contrast + aria-labels
5. `admin-panel/src/App.tsx` - Fixed loading page contrast

**Testing:**

```bash
cd admin-panel
npx playwright test tests/accessibility.spec.ts --project=chromium
npx playwright show-report  # View detailed results
```

### Git Commits ✅

- [x] Committed accessibility fixes
- [x] Restored `database.types.ts` (was accidentally emptied)
- [x] Fixed `package.json` dependency cruiser (removed deleted landing-pages)
- [x] All changes pushed to GitHub

---

## 📚 DOCUMENTATION GUIDE

### Where to Document What

**1. Session Work (`/.agent/` directory)**

- **Purpose**: Track work done in each AI agent session
- **Files**:
  - `ui-improvements-feb-13.md` - UI/UX changes
  - `SESSION_SUMMARY.md` - Current session summary
  - `logs/` - Test outputs, preflight results

**2. Project Documentation (`/docs/` directory)**

- **Purpose**: Long-term project knowledge
- **Files**:
  - `LEARNING_LOG.md` - Lessons learned, patterns, gotchas
  - `reports/TEST_COVERAGE.md` - Coverage metrics
  - `architecture/` - System design docs

**3. User-Facing Documentation**

- `README.md` - Project overview, quick start
- `CHANGELOG.md` - Version history, breaking changes
- `CONTRIBUTING.md` - How to contribute

**4. Task Tracking**

- `tasks.md` (this file) - Current work, priorities, blockers
- GitHub Issues - User-reported bugs, feature requests
- GitHub Projects - Sprint planning, roadmap

**5. Code Documentation**

- **Inline comments**: For complex logic, gotchas, workarounds
- **JSDoc/TSDoc**: For public APIs, hooks, utilities
- **README per feature**: In `admin-panel/src/features/*/README.md`

### Documentation Best Practices

**When to Document:**

- ✅ After fixing a non-obvious bug
- ✅ After implementing a complex feature
- ✅ When you discover a gotcha or edge case
- ✅ After making architectural decisions
- ✅ When you learn something that will help future you

**What to Document:**

- **Context**: Why was this needed?
- **Decision**: What approach did you choose?
- **Alternatives**: What else did you consider?
- **Gotchas**: What surprised you?
- **Testing**: How to verify it works?

**Example Documentation Entry:**

```markdown
## Bug Fix: Domain Visibility Issue (2026-02-13)

**Problem**: Domains weren't showing in the list despite existing in database.

**Root Cause**: UUID validation regex in `isValidUUID` was too strict,
rejecting valid UUIDs with certain character patterns.

**Solution**: Relaxed regex pattern to match standard UUID format.

**Files Changed**: `admin-panel/src/lib/utils.ts`

**Testing**:

1. Create domain with UUID containing 'e' characters
2. Verify it appears in domain list
3. Run `npm test` to verify UUID validation tests pass

**Lessons Learned**: Always test UUID validation with diverse patterns,
not just the happy path.
```

---

## 🚀 GITHUB CODESPACES SETUP

### Initial Setup (First Time)

**1. Launch Codespace**

```bash
# From GitHub repo page, click "Code" → "Codespaces" → "Create codespace on main"
# Wait for container to build (2-3 minutes first time)
```

**2. Install Dependencies**

```bash
# Root workspace
npm install

# Admin Panel (React/Vite)
cd admin-panel
npm install

# Student App (Flutter)
cd ../student-app
flutter pub get

# Content Engine (Python)
cd ../content-engine
pip install -r requirements.txt

# Return to root
cd ..
```

**3. Set Environment Variables**

Create `.env.local` files with your secrets:

```bash
# admin-panel/.env.local
VITE_SUPABASE_URL=https://zrxvlcvdtfqzqvgqjjvt.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# student-app/.env (if needed for local testing)
SUPABASE_URL=https://zrxvlcvdtfqzqvgqjjvt.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
```

**⚠️ NEVER commit these files!** They're in `.gitignore`.

**4. Verify Setup**

```bash
# Check all tools are available
node --version    # Should be v18+
npm --version     # Should be v9+
flutter --version # Should be v3.16+
python --version  # Should be v3.11+

# Run preflight checks
./scripts/preflight.ps1  # PowerShell
# OR
pwsh ./scripts/preflight.ps1  # If pwsh is available
```

### Daily Workflow in Codespaces

**1. Start Your Session**

```bash
# Pull latest changes
git pull origin main

# Check for any dependency updates
npm install
cd admin-panel && npm install && cd ..
```

**2. Make Changes**

```bash
# Create a feature branch (optional but recommended)
git checkout -b fix/lint-errors

# Make your edits
# Use VS Code's built-in editor

# Run tests as you go
cd admin-panel
npm run lint        # Check linting
npm test           # Run unit tests
npx tsc --noEmit   # Type check
```

**3. Test Thoroughly**

```bash
# Run full test suite
cd ..
./scripts/run-all-tests.ps1  # All tests in parallel

# Or run individually
cd admin-panel
npm test -- --coverage              # Unit tests
npx playwright test                 # E2E tests
npx playwright test tests/accessibility.spec.ts  # A11y tests
```

**4. Commit & Push**

```bash
# Stage changes
git add .

# Commit with descriptive message
git commit -m "fix: Replace explicit any types with proper database types"

# Push to GitHub
git push origin main
# OR if on feature branch:
git push origin fix/lint-errors
```

**5. Deploy**

```bash
# Run deployment orchestrator
./orchestrator.ps1

# This will:
# 1. Run preflight checks (lint, typecheck, deps)
# 2. Run all test suites
# 3. Build admin panel and student app
# 4. Deploy to Cloudflare Pages
```

### Common Codespaces Commands

**Development Servers:**

```bash
# Admin Panel (React dev server)
cd admin-panel
npm run dev
# Opens on port 5173 - Codespaces will forward automatically

# Student App (Flutter web)
cd student-app
flutter run -d web-server --web-port 3000
# Opens on port 3000
```

**Debugging:**

```bash
# View recent logs
cat .agent/logs/tests/admin-e2e.log
cat .agent/logs/preflight/admin-typecheck.log

# Check git status
git status
git log --oneline -10

# Check what changed
git diff
git diff --staged
```

**Cleanup:**

```bash
# Clean build artifacts
cd admin-panel
npm run clean  # If script exists
rm -rf dist/

# Clean Flutter build
cd ../student-app
flutter clean

# Reset to clean state
git reset --hard HEAD
git clean -fd  # Removes untracked files
```

### Codespaces-Specific Tips

**1. Port Forwarding**

- Codespaces automatically forwards ports
- Click "Ports" tab in VS Code to see forwarded ports
- Make ports public if you need to share preview links

**2. Extensions**

- Install recommended extensions from `.vscode/extensions.json`
- ESLint, Prettier, Flutter, Python extensions are essential

**3. Terminal**

- Use PowerShell terminal for running scripts
- Multiple terminals: Ctrl+Shift+` (backtick)
- Split terminals: Click split icon

**4. Secrets Management**

- Use GitHub Codespaces Secrets for sensitive values
- Settings → Codespaces → Secrets
- These are injected as environment variables

**5. Performance**

- Codespaces can be slower than local for large builds
- Use 4-core or 8-core machine for better performance
- Close unused terminals and editors

---

## 🛠️ QUICK REFERENCE: Common Tasks

### Fix Lint Errors

```bash
cd admin-panel
npm run lint                    # See errors
npm run lint -- --fix          # Auto-fix what's possible
# Manually fix remaining errors
npm run lint                    # Verify all fixed
```

### Regenerate Database Types

```bash
# If you have Supabase CLI
supabase gen types typescript --project-id zrxvlcvdtfqzqvgqjjvt > admin-panel/src/lib/database.types.ts

# If Supabase CLI not available, restore from git
git show HEAD:admin-panel/src/lib/database.types.ts > admin-panel/src/lib/database.types.ts
```

### Run Specific Tests

```bash
# Admin Panel
cd admin-panel
npm test                                    # All unit tests
npm test -- --coverage                      # With coverage
npx playwright test                         # All E2E tests
npx playwright test tests/accessibility.spec.ts  # Just a11y
npx playwright test --ui                    # Interactive mode

# Student App
cd student-app
flutter test                                # All tests
flutter test --coverage                     # With coverage
flutter test test/features/auth/            # Specific folder

# Content Engine
cd content-engine
pytest                                      # All tests
pytest --cov=.                             # With coverage
pytest tests/test_question_generator.py     # Specific file
```

### Deploy to Production

```bash
# Full automated deployment
./orchestrator.ps1

# Manual step-by-step
./scripts/preflight.ps1           # Verify code quality
./scripts/run-all-tests.ps1       # Run all tests
./scripts/deploy-all.ps1          # Deploy to Cloudflare

# Deploy only admin panel
cd admin-panel
npm run build
wrangler pages deploy dist --project-name=questerix-admin

# Deploy only student app
cd student-app
flutter build web
wrangler pages deploy build/web --project-name=questerix-student
```

---

## 📋 TECHNICAL DEBT

### High Priority

- [ ] Copy PDF.js worker to `public/pdfjs/` in build process
- [ ] Implement full editors for `mcq_multi`, `boolean`, `reorder_steps` question types
- [ ] Implement `parse-import-prompt` Edge Function for AI import

### Medium Priority

- [ ] Form feedback: Add loading indicators to provision/update buttons
- [ ] Feature verification: Template and Upload buttons in Domain Registry
- [ ] CLI-First PRs: Transition PR lifecycle to `gh` CLI

### Low Priority

- [ ] Broader terminology pass across admin pages
- [ ] Platform Settings page (separate from Account Settings)

---

## 🔄 OBSERVABILITY & MONITORING

### Implemented ✅

- [x] Error logging to database (`error_logs` table)
- [x] Security event logging (`security_logs` table)
- [x] Promote-to-issue flow
- [x] Dashboard error widget with real-time stats
- [x] Client-side breadcrumb tracking

### Pending

- [ ] **P2: Verify 30-day auto-pruning** — Migration created, needs pg_cron schedule
- [ ] **P2: Critical alert trigger** — Migration created, needs deployment verification

---

## 🧪 TEST COVERAGE

### Current Status

- ✅ Admin panel: 70%+ coverage (CI gate active)
- ✅ Flutter student app: 60%+ coverage (CI gate active)
- ✅ Python content-engine: 80%+ coverage (CI gate active)
- ✅ Accessibility: 100% (5/5 tests passing)

### Coverage Gaps

- [ ] Multi-tenant isolation edge cases
- [ ] RLS policy bypass attempts
- [ ] Error boundary recovery flows
- [ ] Offline sync conflict resolution
- [ ] Token quota exhaustion handling
- [ ] AI question generation error paths

---

## 🚀 INFRASTRUCTURE

### Deployed ✅

- [x] Cloudflare Pages: Admin Panel (`admin.questerix.com`)
- [x] Cloudflare Pages: Student App (`app.questerix.com`)
- [x] Custom domains configured
- [x] Landing pages deleted (HARD RULE: never publish)

### CI/CD ✅

- [x] Dependabot (npm, pip, GitHub Actions, Flutter)
- [x] Auto-format workflow
- [x] Type generation workflow
- [x] Platform health report
- [x] Self-healing CI with deduplication
- [x] Make It Green button
- [x] Automated test gate in deployment pipeline

---

## �️ SECURITY & AUDIT REMEDIATION

### Critical Security Fixes ✅

- [x] Removed service role key from client bundle
- [x] Removed Gemini API key from client bundle
- [x] AuthGuard fail-closed on errors
- [x] Client-side role assignment removed
- [x] Session revocation on user deactivation
- [x] Defense-in-depth app_id scoping
- [x] Search wildcard escaping (SQL injection prevention)

### Audit Fixes ✅

- [x] Registration race condition fixed (atomic SQL function)
- [x] loadApps race condition fixed (useRef guard)
- [x] MCQ correct-answer validation
- [x] localStorage error handling
- [x] Cascade delete impact warnings
- [x] KaTeX math rendering implementation

---

## � CHANGELOG ENTRIES TO ADD

When you complete the lint fixes and deploy, add this to `CHANGELOG.md`:

```markdown
## [2.0.1] - 2026-02-14

### Fixed

- **Accessibility**: Achieved WCAG 2 AA compliance across all pages
  - Fixed color contrast violations (5 components)
  - Added aria-labels to icon-only buttons (2 components)
  - All accessibility tests now passing (5/5)
- **Build**: Fixed TypeScript compilation errors
  - Restored database.types.ts
  - Fixed dependency cruiser configuration
- **Lint**: Replaced explicit 'any' types with proper database types

### Changed

- Cleaned up tasks.md organization
- Enhanced documentation for GitHub Codespaces workflow

### Documentation

- Added comprehensive Codespaces setup guide
- Documented accessibility testing procedures
- Created documentation best practices guide
```

---

## 🎓 LEARNING RESOURCES

### Project-Specific

- **Architecture**: `docs/architecture/`
- **Testing Guide**: `docs/reports/TEST_COVERAGE.md`
- **Learning Log**: `docs/LEARNING_LOG.md`
- **API Docs**: Supabase auto-generated types in `admin-panel/src/lib/database.types.ts`

### External Resources

- **React/TypeScript**: https://react-typescript-cheatsheet.netlify.app/
- **Flutter**: https://docs.flutter.dev/
- **Supabase**: https://supabase.com/docs
- **Playwright**: https://playwright.dev/
- **WCAG Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/

---

**Last Updated**: 2026-02-14 12:54 PST  
**Status**: ⚠️ Deployment blocked by lint errors (7 errors, 1 warning)  
**Next Action**: Fix lint errors in 4 files, then deploy  
**Estimated Time to Deploy**: 15-30 minutes
