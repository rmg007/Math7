# Cortex v2 — Implementation Briefs

> These briefs are designed for a **two-agent workflow**:
>
> - **Cursor AI** reads a session brief → implements the code → commits to branch
> - **Antigravity** reads the review checklist → audits Cursor's code → files fixes

## Files

| File                   | Purpose                                                                   | Audience               |
| ---------------------- | ------------------------------------------------------------------------- | ---------------------- |
| `SESSION_1_BRIEF.md`   | Graph foundation: SQLite schema, Scanner rewrite, normalizePath           | Cursor (implementer)   |
| `SESSION_2_BRIEF.md`   | MCP server: stdio transport, cortex_impact, cortex_query, delta scan      | Cursor (implementer)   |
| `SESSION_3_BRIEF.md`   | Fragility engine: attribution, change logging, verify execution engine    | Cursor (implementer)   |
| `SESSION_4_BRIEF.md`   | Surgical architect: cortex_plan tier classification, cortex_verify wiring | Cursor (implementer)   |
| `SESSION_5_BRIEF.md`   | Integration: GEMINI.md rules, Reporter compliance, graceful degradation   | Cursor (implementer)   |
| `REVIEW_CHECKLISTS.md` | 100+ verification items across all 5 sessions                             | Antigravity (reviewer) |

## Workflow Per Session

```
1. USER gives SESSION_N_BRIEF.md to Cursor
2. Cursor implements on branch: cortex-v2/session-N
3. Cursor commits and notifies USER
4. USER opens fresh Antigravity chat
5. Antigravity reads REVIEW_CHECKLISTS.md → audits Session N
6. Antigravity files fixes → USER feeds back to Cursor
7. Repeat until review passes
8. Merge branch
```

## Session Dependencies

```
Session 1 (Graph Foundation) ──┬──▶ Session 2 (MCP Server)
                               │
                               └──▶ Session 3 (Fragility Engine)
                                        │
Session 2 + Session 3 ─────────────▶ Session 4 (Surgical Architect)
                                        │
Session 4 ─────────────────────────▶ Session 5 (Integration)
```

Sessions 2 and 3 are **independent** — they can run in parallel after Session 1.

## Source of Truth

The master plan is `plan.md` (v8) in the project root. These briefs are derived from it.
If any brief conflicts with `plan.md`, the plan wins.
