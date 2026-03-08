# Questerix Testing Strategy

## Overview

This document outlines the testing architecture and procedures for the Questerix platform, with a primary focus on the Admin Panel's E2E test suite built with Playwright.

## Test Coverage

The Admin Panel suite includes 42+ comprehensive tests covering:

- **Authentication**: Login, session verification, RBAC gates.
- **Curriculum Management**: CRUD for Domains, Subjects, Skills, and Questions.
- **Publishing Workflow**: Verification of draft-to-live transitions.
- **Platform Management**: Tenant (App) management and Landing Page editing.
- **Account Settings**: User profile and security settings.
- **Admin Tools**: Invitation codes and user administration.

## Prerequisites & Environment

### 1. Test Users

Tests require pre-seeded users in Supabase. Use `admin-panel/tests/setup-test-users.js` to automate this.

- Roles required: `super_admin`, `admin`, `mentor`.

### 2. Secrets Management

Credentials must NOT be hardcoded. Load them via environment variables:

- `TEST_SUPER_ADMIN_EMAIL` / `PASSWORD`
- `TEST_ADMIN_EMAIL` / `PASSWORD`
- `TEST_MENTOR_EMAIL` / `PASSWORD`
- `TEST_STUDENT_EMAIL` / `PASSWORD`

Refer to the root `.secrets` file for authoritative test credentials.

## Running Tests

Tests live in `admin-panel/tests/` and are executed via Playwright.

### Commands

```bash
# Run all tests (headless)
npm run test:e2e

# Interactive UI Mode
npx playwright test --ui

# specific suite
npx playwright test --grep "Authentication"
```

## Test Patterns & Best Practices

### 1. Page Object Model (POM)

Encapsulate page interactions in classes within `admin-panel/tests/pages/`.

### 2. Custom Fixtures

Use `admin-panel/tests/fixtures/` to share setup logic (e.g., pre-authenticated pages).

### 3. Stability Guardrails

- **Data-TestIDs**: Always use `data-testid` attributes for selection.
- **Keyboard Navigation**: For complex Radix/Shadcn UI (like Select), use keyboard events (`ArrowDown`, `Enter`) over mouse clicks.
- **Tombstone Sync**: Verify that deletions propagate correctly via `deleted_at` timestamps.

## Visual Documentation & Troubleshooting

Refer to the `VISUAL_GUIDE.md` (now in `docs/quality/`) for flow diagrams and execution metrics.
To debug, use `npx playwright test --debug` or review logs in `questerix-cortex/outputs/logs/`.

---

_Last updated: March 2026_
