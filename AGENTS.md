# AGENTS.md (Root Copy)

> **IMPORTANT**: This is a convenience copy. The canonical source of truth is:
> `AppShell/docs/AGENTS.md`
>
> If this file conflicts with `AppShell/docs/AGENTS.md`, the latter takes precedence.
>
> **SYNC CHECK**: Before starting work, verify this file matches the canonical version.
> Run: `diff AGENTS.md AppShell/docs/AGENTS.md` (should show no differences)

---

See [AppShell/docs/AGENTS.md](AppShell/docs/AGENTS.md) for the full Execution Contract.

## Quick Reference

### File Authority (Read in this order)
1. `AppShell/docs/AGENTS.md` - The Law (Execution Contract) - **READ FIRST**
2. `AppShell/docs/SCHEMA.md` - The Database Truth
3. `PHASE_STATE.json` - The Progress Tracker
4. `AppShell/docs/specs/*.md` - Detailed Specifications

### Tech Stack Summary
| Component | Student App | Admin Panel |
|-----------|-------------|-------------|
| Framework | Flutter >= 3.19.0 | React 18.2 + Vite 5 |
| State | Riverpod ^2.5.0 | React Query ^5.17.0 |
| Local DB | Drift ^2.15.0 | N/A |
| Backend | supabase_flutter ^2.0.0 | @supabase/supabase-js ^2.39.0 |
| UI | Custom + Material | shadcn/ui + Tailwind |

### Execution Protocol
1. **Read Phase State**: Open `PHASE_STATE.json`
2. **Check Prerequisites**: If `blocked_on` is not null, solve that first
3. **Execute Phase**: Perform the smallest possible atomic step
4. **Validate**: Run the specific validation command
5. **Update State**: Write the result to `PHASE_STATE.json`

### Current Phases
| Phase | Description | Validation Script |
|-------|-------------|-------------------|
| -1 | Environment Validation | `scripts/validate-phase--1.ps1` |
| 0 | Project Bootstrap | `scripts/validate-phase-0.ps1` |
| 1 | Data Model + Contracts | `scripts/validate-phase-1.ps1` |
| 2 | Student App Core Loop | `scripts/validate-phase-2.ps1` |
| 3 | Admin Panel MVP | `scripts/validate-phase-3.ps1` |
| 4 | Hardening | `scripts/validate-phase-4.ps1` |

### Run and Test Commands
Use the `Makefile` for all build/test operations:
| Command | Purpose |
|---------|---------|
| `make web_dev` | Run Admin Panel (0.0.0.0:5173) |
| `make flutter_run_web` | Run Student App on web (0.0.0.0:3000) |
| `make ci` | Run all lint/test/build gates |
| `make db_verify_rls` | Verify RLS policies |
| `make validate_phase_N` | Run Phase N validation |

### No Hallucination Rule
If a requirement is not explicitly defined in `AGENTS.md` or `SCHEMA.md`:
1. Check `AppShell/docs/specs/*.md` for details
2. Check `PHASE_STATE.json` for resolved clarifications
3. If still unclear, **STOP** and ask the user
4. Do NOT infer business logic

### Key Business Rules (from PHASE_STATE.json)
- **Mastery Formula**: `(correct_attempts / total_attempts) * 100` (min 3 attempts)
- **Streak Multiplier**: 1x (1-2), 1.5x (3-4), 2x (5+), resets on incorrect
- **Question Types**: multiple_choice, mcq_multi, text_input, boolean, reorder_steps
- **Design System**: shadcn/ui for Admin Panel
- **Student Auth**: Anonymous auth (device-bound, no login UI) - see `DATA_MODEL.md` BR-008
- **RBAC**: Use `profiles.role` only (NOT a separate `user_roles` table)
- **Attempt Submission**: Students use `batch_submit_attempts` RPC only (NOT REST `/attempts`)

---

## Getting Started Checklist

Before starting any work:
- [ ] Read `AppShell/docs/AGENTS.md` completely
- [ ] Read `AppShell/docs/SCHEMA.md` completely
- [ ] Check `PHASE_STATE.json` for current phase and blockers
- [ ] Review resolved_clarifications for answered questions
- [ ] Run environment validation: `.\scripts\validate-phase--1.ps1`
