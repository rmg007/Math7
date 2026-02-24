# Questerix QA Engine — Architecture

> **Inspiration**: Oracle Intelligence + Loki-Mode Quality Gates
> **Goal**: An autonomous QA application that maps the codebase, generates test cases, runs the verification suite, and outputs a premium health report for human review.

## 1. Core Modules

### 🔍 1.1 The Scanner (`/scanner`)

- **Input**: `admin-panel/src`
- **Logic**: Uses AST (Abstract Syntax Tree) parsing or recursive directory walks to identify:
  - **Pages**: Routes, forms, and primary user interactions.
  - **Hooks**: Business logic, Supabase mutations, and data fetching.
  - **Services**: External API calls, normalization, and validation logic.
- **Output**: `SURFACE_MAP.json` — A machine-readable map of the entire application surface.

### 🏭 1.2 The Factory (`/factory`)

- **Input**: `SURFACE_MAP.json`
- **Logic**: Compares the Surface Map against existing tests (`**/*.test.tsx`, `**/*.spec.ts`).
- **Discovery**: Identifies "Test Gaps" (e.g., "Page X has no E2E coverage", "Hook Y has no unit tests").
- **Generation**: Creates BDD-style Test Cases (e.g., `TC-001: Create Domain with duplicate slug`) in a `TEST_PLAN.md`.

### 🏃 1.3 The Runner (`/reporter`)

- **Execution**: Orchestrates the existing testing tools:
  - `vitest` (Unit/Logic)
  - `playwright` (E2E/UI)
  - `supabase rls audit` (Security)
  - `eslint` (Compliance)
- **Aggregator**: Collects results into a unified data structure.

### 📊 1.4 The Reporter (`/reporter`)

- **Output**: `HEALTH_REPORT.md`
- **Premium Aesthetics**: Uses Markdown tables, status icons (✅, ❌, ⚠️), and "Heat Maps" of coverage.
- **Actionable Failures**: Lists exactly WHICH file and line failed, with links to the code for the AI Agent to fix.

## 2. Usage Workflow

1. **User Action**: Runs `npm run qa-health` from the root.
2. **Scan**: The engine maps the project and checks for orphaned components.
3. **Execution**: All tests run in optimized parallel batches.
4. **Delivery**: The user opens `HEALTH_REPORT.md`.
5. **Delegated Task**: User gives the report to the AI Agent: _"Fix the the failures in Section 2.2 of the report."_

## 3. Technology Stack

- **Runtime**: Node.js / TypeScript
- **Scanning**: `ts-morph` or `glob` + custom regex (inspired by forensic audit patterns)
- **Formatting**: GitHub-flavored Markdown
