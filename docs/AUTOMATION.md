# GitHub Automation Guide

> **Mission**: Maximize developer productivity by automating repetitive tasks and quality checks.

This document catalogs all automated workflows in the Questerix project. Every automation here saves time, reduces errors, and maintains quality standards **without human intervention**.

---

## 🎯 Quick Reference

| Category                 | Workflows    | Purpose                         |
| ------------------------ | ------------ | ------------------------------- |
| **Quality Assurance**    | 11 workflows | Code quality, testing, coverage |
| **Security**             | 6 workflows  | DAST, SAST, dependency scanning |
| **Developer Experience** | 8 workflows  | PRs, issues, onboarding         |
| **Operations**           | 5 workflows  | Monitoring, performance         |
| **Maintenance**          | 4 workflows  | Dependencies, cleanup           |

**Total**: 34 automated workflows running 24/7

---

## ✅ Pre-Merge Automation (PR Quality Gates)

### 1. **Auto-Format** (`.github/workflows/auto-format.yml`)

- **Trigger**: Every PR
- **What it does**: Automatically fixes code style across TypeScript, Dart, Python, and Markdown
- **Saves**: ~5 min/PR on manual formatting

### 2. **Auto-Label** (`.github/workflows/auto-label.yml`)

- **Trigger**: Every PR
- **What it does**:
  - Labels PRs by file paths (`admin-panel`, `student-app`, etc.)
  - Sizes PRs (`size/xs` to `size/xl`)
  - Detects breaking changes
- **Saves**: Manual triage time

### 3. **Commit Message Validation** (`.github/workflows/commit-lint.yml`)

- **Trigger**: Every PR
- **What it does**: Enforces Conventional Commits format
- **Saves**: Changelog generation headaches

### 4. **Cross-browser E2E Tests** (updated in `ci.yml`)

- **Trigger**: Every PR
- **What it does**: Runs Playwright tests on Chromium, Firefox, and WebKit
- **Saves**: Manual browser testing

### 5. **Visual Regression** (`.github/workflows/visual-regression.yml`)

- **Trigger**: Daily + PRs affecting UI
- **What it does**: Screenshot comparison across major pages
- **Saves**: Manual UI review

### 6. **Screenshot Diffing** (`.github/workflows/screenshot-diff.yml`)

- **Trigger**: PRs affecting `.tsx` files
- **What it does**: Generates before/after screenshots with pixel-level diffs
- **Saves**: "Did something break?" questions

### 7. **Dead Code Detection** (`dead-code.yml`)

- **Trigger**: Weekly + PRs
- **What it does**: Finds unused files, exports, and dependencies
- **Saves**: Bundle size and maintenance overhead

### 8. **Code Duplication** (`duplication.yml`)

- **Trigger**: Weekly + PRs
- **What it does**: Detects copy-paste code with `jscpd`
- **Saves**: Refactoring discovery time

### 9. **Bundle Size Monitoring** (`bundle-size.yml`)

- **Trigger**: Every PR affecting frontend
- **What it does**: Tracks `dist/` size, fails if >10% growth
- **Saves**: Performance regressions

### 10. **Coverage Tracking** (`coverage-tracking.yml`)

- **Trigger**: Every PR + main
- **What it does**: Tracks historical test coverage trends
- **Saves**: "Did we lose coverage?" questions

### 11. **Python Linting** (updated in `ci.yml`)

- **Trigger**: Every commit
- **What it does**: Runs `ruff` for Python code quality
- **Saves**: Manual code review for style issues

---

## 🔒 Security Automation

### 12. **OWASP ZAP DAST** (`dast.yml`)

- **Trigger**: Daily + manual
- **What it does**: Dynamic security scanning of production URLs
- **Saves**: Manual penetration testing time
- **Config**: `.zap/rules.tsv`

### 13. **CodeQL SAST** (existing `security.yml`)

- **Trigger**: Push to main + PRs
- **What it does**: Semantic code analysis for vulnerabilities
- **Saves**: Manual security audits

### 14. **Dependency Scanning** (existing `security.yml`)

- **Trigger**: Every PR
- **What it does**: Blocks high/critical CVEs, GPL licenses
- **Saves**: Supply chain risk

### 15. **Python Security** (existing `ci.yml`)

- **Trigger**: Every commit
- **What it does**: Bandit scans for Python security issues
- **Saves**: Python-specific vulnerability discovery

### 16. **License Compliance** (`license-sbom.yml`)

- **Trigger**: Weekly + dependency changes
- **What it does**: Generates license reports + SBOM
- **Saves**: Legal compliance audits

### 17. **Secret Scanning** (GitHub native)

- **Trigger**: Every commit
- **What it does**: Detects leaked API keys, tokens
- **Saves**: Security incidents

---

## 🚀 Performance & Quality

### 18. **Lighthouse CI** (`lighthouse.yml`)

- **Trigger**: Every PR + main
- **What it does**: Performance, accessibility, SEO audits
- **Saves**: Manual Lighthouse runs
- **Config**: `lighthouserc.json`

### 19. **Production Monitoring** (`production-monitoring.yml`)

- **Trigger**: Every 30 minutes
- **What it does**:
  - Broken link checking
  - Response time monitoring
  - SSL certificate expiration alerts
- **Saves**: Downtime discovery time

### 20. **Checkly Synthetic Monitoring** (existing `checkly-deploy.yml`)

- **Trigger**: Post-deploy + scheduled
- **What it does**: E2E tests against production
- **Saves**: Post-deploy validation

---

## 👥 Developer Experience

### 21. **First-time Contributor Welcome** (`developer-experience.yml`)

- **Trigger**: First PR/issue from a user
- **What it does**: Posts helpful onboarding messages
- **Saves**: Manual "Welcome!" messages

### 22. **Auto-assign Reviewers** (`developer-experience.yml`)

- **Trigger**: Every PR
- **What it does**: Assigns reviewers based on file paths
- **Saves**: Manual reviewer assignment
- **Config**: `.github/CODEOWNERS`

### 23. **PR Size Warnings** (`developer-experience.yml`)

- **Trigger**: Every PR
- **What it does**: Flags PRs >1000 lines for splitting
- **Saves**: Massive PR review pain

### 24. **Spell-checking** (`developer-experience.yml`)

- **Trigger**: Every PR affecting `.md` files
- **What it does**: CSpell on all documentation
- **Saves**: Typo embarrassment
- **Config**: `.cspell.json`

### 25. **Stale Issue/PR Cleanup** (`auto-cleanup.yml`)

- **Trigger**: Daily
- **What it does**: Auto-closes inactive issues (60d) and PRs (30d)
- **Saves**: Manual housekeeping

### 26. **Stale Branch Deletion** (`auto-cleanup.yml`)

- **Trigger**: Daily
- **What it does**: Deletes branches with no activity for 30 days
- **Saves**: Repo clutter

### 27. **Changelog Automation** (`changelog.yml`)

- **Trigger**: Merge to main
- **What it does**: Auto-updates `CHANGELOG.md` from commit messages
- **Saves**: Manual release notes
- **Config**: `.github/release-drafter.yml`

### 28. **Semantic Versioning** (`changelog.yml`)

- **Trigger**: Merge to main
- **What it does**: Auto-bumps version based on commit types
- **Saves**: Manual version management

---

## 🔄 Maintenance & Operations

### 29. **Type Generation** (`type-generation.yml`)

- **Trigger**: SQL migration changes
- **What it does**: Auto-runs `supabase gen types` and commits
- **Saves**: "I forgot to gen types" bugs

### 30. **Dependency Updates (Renovate)** (via `renovate.json`)

- **Trigger**: Weekly
- **What it does**: Auto-PRs for dependency updates, auto-merges patches
- **Saves**: Manual `npm update` drudgery
- **Config**: `renovate.json`

### 31. **Workflow Health Monitoring** (`workflow-health.yml`)

- **Trigger**: Weekly
- **What it does**: Analyzes CI performance, finds slow/failing workflows
- **Saves**: CI optimization discovery

### 32. **Dependency Graph Publishing** (existing `ci.yml`)

- **Trigger**: Every commit
- **What it does**: Generates architecture diagrams
- **Saves**: Manual architecture documentation

---

## 🎬 Post-Merge Automation

### 33. **Oracle+ Documentation Indexing** (existing `oracle-index.yml`)

- **Trigger**: Main branch updates
- **What it does**: Reindexes documentation in vector DB
- **Saves**: Manual knowledge base updates

### 34. **Database Migration Validation** (existing `database.yml`)

- **Trigger**: Migration file changes
- **What it does**: Tests migrations in isolated environment
- **Saves**: Production migration failures

---

## 📊 What We've Automated Away

### Time Savings Per Week

| Task                | Manual Time | Automated  | Savings         |
| ------------------- | ----------- | ---------- | --------------- |
| Code formatting     | 30 min      | 0 min      | 30 min          |
| PR labeling/triage  | 1 hour      | 0 min      | 1 hour          |
| Type generation     | 20 min      | 0 min      | 20 min          |
| Security scanning   | 2 hours     | 0 min      | 2 hours         |
| Performance testing | 1 hour      | 0 min      | 1 hour          |
| Dependency updates  | 1 hour      | 10 min     | 50 min          |
| Coverage tracking   | 30 min      | 0 min      | 30 min          |
| Changelog updates   | 30 min      | 0 min      | 30 min          |
| **TOTAL**           | **7 hours** | **10 min** | **6h 50m/week** |

**Annual savings**: ~355 hours (44 work days)

---

## 🔧 Configuration Files

| File                          | Purpose                     |
| ----------------------------- | --------------------------- |
| `.github/labeler.yml`         | PR auto-labeling rules      |
| `.github/CODEOWNERS`          | Auto-reviewer assignment    |
| `.github/release-drafter.yml` | Changelog generation config |
| `.zap/rules.tsv`              | OWASP ZAP security rules    |
| `lighthouserc.json`           | Performance budgets         |
| `.cspell.json`                | Spell-checking dictionary   |
| `renovate.json`               | Dependency update strategy  |

---

## 🚨 Required Secrets

These GitHub secrets must be configured:

| Secret                  | Used By               | Purpose                           |
| ----------------------- | --------------------- | --------------------------------- |
| `GITHUB_TOKEN`          | All workflows         | GitHub API access (auto-provided) |
| `SUPABASE_ACCESS_TOKEN` | Type gen, deployments | Supabase CLI auth                 |
| `SUPABASE_PROJECT_ID`   | Type gen              | Project identification            |
| `CLOUDFLARE_API_TOKEN`  | Deployments           | Cloudflare Pages deploys          |
| `CLOUDFLARE_ACCOUNT_ID` | Deployments           | Cloudflare account                |
| `CHECKLY_API_KEY`       | Monitoring            | Checkly synthetic tests           |
| `MONITOR_USER_EMAIL`    | E2E tests             | Test account credentials          |
| `MONITOR_USER_PASSWORD` | E2E tests             | Test account credentials          |

---

## 📚 Adding New Automations

1. **Identify repetitive task** → Document time spent
2. **Create workflow file** → `.github/workflows/your-workflow.yml`
3. **Test in PR** → Verify it works
4. **Update this doc** → Add to appropriate section
5. **Measure savings** → Update time savings table

---

## 🎯 Next Automation Opportunities

- [ ] Load testing with k6 on deploy
- [ ] Database query profiling from production logs
- [ ] API contract testing between frontend/backend
- [ ] CDN cache warming post-deploy
- [ ] Automated incident postmortems

---

**Last Updated**: ${new Date().toISOString().split('T')[0]}
