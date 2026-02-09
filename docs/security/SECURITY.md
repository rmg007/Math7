# Security

> Security context for AI agents and code reviewers.

## 🛡️ Security Model

Questerix uses **RLS-First** security. All authorization is enforced at the database layer via PostgreSQL Row-Level Security policies. Client-side checks are for UX only—never trust them for actual security.

## 📂 Key Security Resources

| Resource | Purpose |
|----------|---------|
| [Vulnerability Taxonomy](knowledge/questerix_governance/artifacts/security/vulnerability_taxonomy.md) | Known architectural vulnerability patterns with detection methods |
| [Ironclad Principles](knowledge/questerix_governance/artifacts/security/ironclad.md) | Core security constraints |
| [External Agent Interface](knowledge/questerix_governance/artifacts/security/external_agent_interface.md) | Quick reference for AI reviewers |

## 🚦 Critical Constraints by Sector

| Sector | Fatal Error | Why It's Critical |
|--------|-------------|-------------------|
| `student-app/` | Direct Supabase `.insert()`, `.update()` | Breaks offline-first integrity; must use `SyncService` |
| `admin-panel/` | Missing `.eq('app_id', ...)` in queries | Multi-tenant data leakage |
| `supabase/` | Missing `ENABLE ROW LEVEL SECURITY` | Total security failure |
| `content-engine/` | Unvalidated AI output insertion | Prompt injection risk |

## 🎯 Top 5 Vulnerability Patterns to Check

1. **VUL-002: Subject Leakage** - Mentors seeing student data across all subjects (missing `domain_id` filter)
2. **VUL-003: SQLite Integrity** - Server trusting client-submitted `is_correct` values
3. **VUL-007: Join Code Brute-Force** - 6-char codes without rate limiting
4. **VUL-001: Orphaned Students** - Anonymous auth without recovery mechanism
5. **VUL-004: Zombie Curriculum** - Hard deletes breaking referential integrity

## 🔍 How to Audit

1. **Read the Vulnerability Taxonomy** - Contains detection methods for each pattern
2. **Check Introduction Triggers** - See if your changes match any vulnerability's triggers
3. **Run Detection Commands** - Each pattern has grep/search commands to verify
4. **Report New Patterns** - Found something new? Append to taxonomy using the template

## 🔗 Related Workflows

- [`/audit`](.agent/workflows/audit.md) - Full codebase security scan
- [`/certify`](.agent/workflows/certify.md) - Post-implementation verification
- [`/process`](.agent/workflows/process.md) - Includes threat modeling in Phase 1
