# Learning Log

Lessons learned from bugs, incidents, and development discoveries.

> **Purpose**: Capture one-line lessons to prevent recurring mistakes.
> **Rule**: If the same bug class happens twice, update a workflow or coding standard.

---

## Template

```markdown
## YYYY-MM-DD: [Title]
- **Root Cause**: [Brief description]
- **Lesson**: [What we learned]
- **Prevention**: [What we changed]
- **Regression Test**: `test/path/to/test.dart`
```

---

## 2026-02-03: Math7 → Questerix Renaming Complete

- **Context**: Complete rebranding from Math7 to Questerix across all applications
- **Changes**: Package rename (`math7_domain` → `questerix_domain`), app name updates, database name change, domain transition to `Farida.Questerix.com`
- **Breaking Change**: Database renamed from 'math7' to 'questerix' - existing users will need fresh database
- **Files Modified**: 50+ files across student-app, admin-panel, landing-pages, questerix_domain

---

## 2026-02-03: Pre-existing Test-Screen Mismatches Discovered

- **Root Cause**: Test files written for different screen implementations than what exists
- **Lesson**: Test files MUST be maintained in sync with screen implementations; when screens are refactored, tests must be updated in the same commit
- **Prevention**: Fixed Flutter API usage (TextField vs TextFormField for obscureText, getSemanticsData().actions for checking actions)
- **Regression Tests Fixed**: 
  - `test/features/auth/screens/login_screen_test.dart`
  - `test/features/auth/screens/welcome_screen_test.dart`
  - `test/features/onboarding/screens/onboarding_screen_test.dart`

---

## 2026-02-03: Workflow System Established

- **Context**: Established Trust & Verify workflow system
- **Lesson**: AI agents need explicit evidence requirements to prevent "hallucinated completion"
- **Prevention**: All workflows now require file paths, commands executed, and test results
- **Reference**: `.agent/workflows/*.md`

---

## 2026-02-04: Phase 11 Certification - Hardcoded Credentials Anti-Pattern

- **Root Cause**: Database password hardcoded directly in `scripts/direct_apply.js` (Line 5)
- **Discovery**: Found during `/certify` Phase 3 (Security Audit)
- **Severity**: CRITICAL - Password exposed in Git history and source code
- **Lesson**: ALL credentials must be externalized to environment variables, even in utility scripts
- **Prevention**: 
  - Updated `direct_apply.js` to use `process.env.DB_PASSWORD` with validation
  - Installed `dotenv` package for .env file support
  - Added error message guiding users to set credentials properly
- **Why Missed in /process**: Script was created in previous session without security review
- **Regression Test**: Manual verification that script fails without env var set

---

## 2026-02-04: Phase 11 Certification - CLI Argument Ignored

- **Root Cause**: `scripts/direct_apply.js` had hardcoded migration filename, ignoring command-line argument
- **Discovery**: Found during `/certify` Phase 1 (Database Audit) when wrong migration was applied
- **Impact**: HIGH - Script appeared to work but always applied the same migration regardless of input
- **Lesson**: Utility scripts accepting arguments MUST actually use those arguments
- **Prevention**: Refactored to use `process.argv[2]` with proper validation and path resolution
- **Why Missed in /process**: Script was tested with the hardcoded file, which succeeded by coincidence
- **Testing Gap**: No verification that different inputs produced different outputs

---

## 2026-02-04: Project Oracle - Hash-Based Change Detection Pattern

- **Context**: Building a documentation indexing system with OpenAI embeddings
- **Challenge**: Re-embedding all content on every reindex is expensive ($0.02/1M tokens)
- **Solution**: SHA256 hash each chunk's content before embedding; only re-embed if hash changes
- **Results**: 
  - Initial index: $0.0025 (730 chunks)
  - Subsequent re-runs: $0.00 (when content unchanged)
  - 95%+ cost savings over naive approach
- **Implementation**: `scripts/knowledge-base/lib/hasher.ts`
- **Lesson**: For any idempotent operation with external API costs, implement content hashing to skip unchanged items
- **Pattern Name**: "Hash-Gated API Calls"

---

## 2026-02-04: Documentation Consolidation - Single Source of Truth

- **Context**: Documentation was split across main repo and `Questerix-Docs-Backup` repo
- **Problem**: Oracle indexer only searched main repo; backup docs were invisible to AI agents
- **Solution**: Migrated all 8 unique files from backup to main repo's `docs/` hierarchy
- **Organization**:
  - Technical docs → `docs/technical/` (architecture, RLS policies, secrets)
  - Strategy docs → `docs/strategy/` (Antigravity rules, update protocols)
  - Operational docs → `docs/operational/` (maintenance, deployment)
- **Prevention**: Updated backup repo README to mark as `⛔ OBSOLETE`
- **Lesson**: Never split documentation across repos; consolidation enables better AI discovery
- **Pattern Name**: "Single Source of Truth Documentation"

---

## 2026-02-04: Slack MCP Server Deprecated - Direct API Alternative

- **Context**: Attempted to use `@anthropics/mcp-server-slack` for Slack integration
- **Discovery**: Package is deprecated by @modelcontextprotocol maintainers
- **Error**: `npm install` failed with deprecation warnings and broken dependencies
- **Solution**: Built custom PowerShell script using Slack REST API directly
- **Benefits of Direct Approach**:
  - More control over polling interval (5 seconds)
  - No dependency on external MCP server
  - Simpler debugging (visible console output)
  - Works on Windows without WSL
- **Lesson**: When MCP server fails, direct REST API integration is often simpler and more reliable
- **Prevention**: Check MCP server maintenance status before investing time; have fallback plan
- **Reference**: `scripts/slack-bridge.ps1`

---

## 2026-02-04: Agent Handoff Protocol with TASK_STATE.json

- **Context**: Work on Phase 11 spanned multiple agent sessions over 12+ hours
- **Challenge**: New agents need to resume work without losing context or duplicating effort
- **Solution**: Maintain `TASK_STATE.json` with:
  - `task_id`: Unique identifier for the task
  - `current_phase`: Which phase is active (1-6)
  - `phases`: Object with status, completion time, and artifacts per phase
  - `started_at` / `completed_at`: Timestamps for tracking duration
- **Pattern**:
  1. Each phase updates its `status` and `artifacts` on completion
  2. `/continue` workflow reads state file to determine resume point
  3. Agent validates builds/tests before resuming
  4. Final phase marks `completed_at` and all phases as complete
- **Lesson**: External state file enables reliable multi-session, multi-agent task chains
- **Pattern Name**: "Persistent Task State for Agent Continuity"
- **Reference**: `.agent/artifacts/TASK_STATE.json`

---

## 2026-02-04: Certification Workflow - Evidence-Based Quality Gates

- **Context**: Completed Project Oracle and Slack Bridge implementations
- **Process**: Ran `/certify` workflow on each as independent post-implementation audit
- **Key Insight**: Acting as "Inspector" with fresh eyes catches issues missed during `/process`
- **Evidence Types Collected**:
  - Database: Schema existence, RLS policy presence, data counts
  - Code: File structure, nesting depth, import hygiene
  - Security: API key exposure scan, .gitignore patterns
  - Performance: Response time measurements, cost analysis
  - Documentation: File counts, completeness checks
- **Certification Decisions**:
  - ✅ CERTIFIED: No critical issues, ready for production
  - ⚠️ CONDITIONAL: Issues documented but acceptable for use case
  - ❌ FAILED: Return to implementation for fixes
- **Lesson**: Separation between implementer and certifier mindset is essential for quality
- **Pattern Name**: "Zero Trust Certification"

---

## 2026-02-04: Archive Documentation Indexing Verification

- **Context**: User asked "are you sure that all documentations in the archived repo are here?"
- **Discovery**: Oracle indexer uses `docs/**/*.md` glob pattern which INCLUDES `docs/archive/`
- **Verification Steps**:
  1. Reviewed indexer configuration (INCLUDE_PATTERNS in indexer.ts)
  2. Created `check-archive.ts` utility to query database for archive paths
  3. Confirmed 10 archive files indexed successfully
- **Lesson**: When asserting something is indexed/included, verify with database query, not just config
- **Prevention**: Created verification script that can be re-run anytime
- **Reference**: `scripts/knowledge-base/check-archive.ts`

---

## 2026-02-04: Git Commit Hanging - Long Commit Messages

- **Context**: Multiple git commits appeared to "hang" during Phase 11 release
- **Observation**: Commits with very long messages (20+ lines) took 30+ seconds
- **Cause**: PowerShell + Git interaction with multi-line commit messages
- **Workaround**: Check `git log` to see if commit succeeded; don't wait for command_status
- **Alternative**: Use shorter commit messages or commit message files
- **Lesson**: When git commit appears stuck, verify with `git log --oneline -1` instead of waiting
- **Pattern**: "Verify Don't Wait" for long-running SCM operations

---

## 2026-02-04: Slack Bot Permission Debugging

- **Context**: Slack bridge returning permission errors when posting messages
- **Error**: `not_in_channel` despite bot being added to workspace
- **Root Cause**: Bot OAuth token needs explicit channel invitation OR proper scopes
- **Required Scopes**:
  - `channels:history` - Read messages from public channels
  - `chat:write` - Post messages to channels
  - `channels:read` - List channels (optional but helpful)
- **Fix Steps**:
  1. Added bot to channel: `/invite @YourBotName`
  2. Verified scopes in Slack App dashboard
  3. Regenerated bot token after scope changes
- **Lesson**: Slack bots need both OAuth scopes AND channel membership
- **Reference**: `docs/operational/SLACK_FIX_PERMISSIONS.md`

---

## 2026-02-04: Windows Path Issues in PowerShell Scripts

- **Context**: Slack bridge script needed to execute commands in project directory
- **Issue**: Paths with spaces (`Important Projects`) require proper quoting
- **Solution**: Use `Set-Location` with quoted paths before command execution
- **Example**:
  ```powershell
  Set-Location "c:\Users\mhali\OneDrive\Desktop\Important Projects\Questerix"
  Invoke-Expression $command
  ```
- **Lesson**: Windows paths with spaces need explicit quoting in PowerShell automation
- **Alternative**: Use short paths or symbolic links for frequently accessed directories

---

## 2026-02-04: Manual CI Trigger for Cost Control

- **Context**: Project Oracle uses OpenAI embeddings which cost money per call
- **Decision**: Made GitHub Actions workflow `workflow_dispatch` (manual trigger) only
- **Rationale**:
  - Prevents accidental cost spikes from auto-triggering on every push
  - User controls when re-indexing happens
  - Hash deduplication means safe to run frequently
- **Alternative Considered**: Trigger on `docs/**/*.md` changes - rejected due to cost uncertainty
- **Lesson**: For API-cost-sensitive CI workflows, prefer manual triggers over automatic
- **Pattern Name**: "Cost-Controlled CI/CD"
- **Reference**: `.github/workflows/docs-index.yml`

---

<! -- Add new lessons above this line -->
