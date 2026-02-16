# Loki Mode — Learned Guardrails

> This file accumulates lessons from past RARV failures.
> It is the agent's "muscle memory" — scan it before each ACT phase.

---

## 🚫 [HARD RULE] Admin Panel Feature Freeze (2026-02-16)

**DO NOT add any new features to `admin-panel/`.** Bug fixes and maintenance only. No new pages, components, hooks, routes, or UI elements. This rule is non-negotiable.

---

## [import-path] Duplicate Import Deduplication (2026-02-16)

When adding new imports via multi_replace_file_content, always check that the existing import block doesn't already contain the same modules. Replacing a line that includes `import X from 'y'` with a block that also adds `import X from 'y'` will create duplicates. Solution: view lines 1-25 first.

## [pattern-violation] Arbitrary Tailwind Values (2026-02-16)

Never use `text-[10px]`, `text-[11px]`, or `tracking-[0.2em]` directly. Use the custom utilities `text-2xs` (10px), `text-xs` (12px standard), and `tracking-extra-wide` (0.2em) defined in `tailwind.config.js`.
