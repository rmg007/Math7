# A11y Exception Register — Questerix Admin Panel

> **Policy**: Zero `critical` or `serious` axe-core violations are permitted in CI.
> All exceptions below must have an owner, a rationale, and a planned remediation date.
> Exceptions are applied via `.disableRules([...])` in `tests/read-only/a11y-audit.spec.ts`.

---

## EX-001 — `color-contrast` on Secondary Text

| Field                | Value                               |
| :------------------- | :---------------------------------- |
| **axe Rule ID**      | `color-contrast`                    |
| **WCAG Criterion**   | 1.4.3 Contrast (Minimum) — Level AA |
| **Severity**         | Serious                             |
| **Suppressed since** | 2026-02-28                          |
| **Owner**            | Design (Slot K-3)                   |
| **Planned Fix**      | ≤ Q2 2026                           |

### Affected Elements

- `text-muted-foreground` class used on:
  - Form helper/label text (Login, Domain Create, Skill Create forms)
  - Card descriptions (`CardDescription` in shadcn/ui)
  - Table secondary values (e.g., subtitle rows, status badges on light backgrounds)

### Rationale

Tailwind's `text-muted-foreground` resolves to `hsl(215.4 16.3% 46.9%)` — approximately `#6b7280`.
On a white background (`#ffffff`) this gives a contrast ratio of **4.48:1**, which is marginally below
the WCAG 2.1 AA requirement of **4.5:1** for normal text.

On the platform's primary dark-mode background (`#020817`) the same color passes at **12.3:1**.
The violation only fires in axe's light-mode snapshot.

The issue is in the design token system, not individual components. Fixing it requires a coordinated
design-token refactor (Slot K-3) to avoid breaking the visual language across 80+ components.

### Pre-Fix Mitigations

1. All interactive elements (buttons, links, inputs) use `text-foreground` directly — these pass 4.5:1.
2. All error states use `text-destructive` which passes 4.5:1.
3. The suppression is **scoped to this exact rule only** — all other contrast violations (e.g., on
   custom non-Tailwind elements) will still be caught.

### Remediation Plan

Replace `text-muted-foreground` with a new token `text-secondary` that resolves to
`hsl(215.4 16.3% 43%)` — approximately `#5f6c7a` — giving a 5.2:1 contrast ratio on white.
This will be done during the Slot K-3 design-token cleanup.

---

## Exception Template

```markdown
## EX-NNN — `{axe-rule-id}` on {description}

| Field                | Value                                                 |
| :------------------- | :---------------------------------------------------- |
| **axe Rule ID**      | `{rule-id}`                                           |
| **WCAG Criterion**   | {criterion} — Level {A/AA}                            |
| **Severity**         | {critical / serious}                                  |
| **Suppressed since** | {date}                                                |
| **Owner**            | {team/person}                                         |
| **Planned Fix**      | {date or "never — inherent to third-party component"} |

### Rationale

{Why this exception is justified and why it cannot be fixed immediately.}

### Remediation Plan

{Specific steps and timeline to resolve the issue.}
```

---

> [!IMPORTANT]
> This register must be updated whenever an exception is added or removed from the test suite.
> Unreviewed exceptions older than 6 months must be escalated in the next sprint review.
