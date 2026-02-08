# 🧠 Oracle Cognition: Integrity-Driven Development Standard

> **Purpose**: This is the **complete cognitive framework** for writing production-grade code in Questerix. It defines the **Integrity-Driven Development (IDD) Protocol**—a failure-aware, test-first methodology—combined with language-specific patterns, bug libraries, and security checklists.
>
> **Audience**: All engineers and AI coding agents working on Questerix.
>
> **Authority**: This document is #3 in the Questerix authority hierarchy (after `AGENTS.md` and `kb_registry`). See `AI_CODING_INSTRUCTIONS.md` for the complete order.

---

## 🚀 The IDD Protocol (Integrity-Driven Development)

**Prime Directive**: Never ship code that has not been stress-tested against failure.

### The 5-Phase Loop

Execute these phases **in strict order** for every implementation task:

#### Phase 1: Contract Analysis
**Before writing any code:**

1. **State the PURPOSE** in one sentence
2. **List all IMPLICIT CONTRACTS**:
   - What does this code assume about its inputs?
   - What environment requirements exist (OS, network, filesystem)?
   - What dependencies does it rely on (APIs, databases, libraries)?
   - How will this be invoked by callers?
3. **Define SUCCESS CRITERIA**: What observable behavior proves this works?
4. **Identify the FAILURE BOUNDARY**: When should this code fail loudly vs. attempt recovery?

#### Phase 2: Threat Modeling
**Think like an attacker.** Identify exactly **5 failure vectors**, one from each category:

| # | Category | Question to Ask | Example Scenario |
|---|----------|----------------|------------------|
| 1 | **Input Abuse** | What happens with garbage input? | User passes  a 10MB string as 'name' parameter |
| 2 | **State Corruption** | What if the world changes mid-execution? | Concurrent write invalidates cached data |
| 3 |**Dependency Failure** | What if an external service breaks? | API returns 500, empty response, or schema drift |
| 4 | **Resource Exhaustion** | What if we run out of something? | Memory spike on large dataset, stack overflow |
| 5 | **Security Surface** | What can a malicious actor exploit? | SQL injection, XSS, auth bypass, data leakage |

For each vector, write a **concrete one-line attack scenario** specific to your feature.

#### Phase 3: Test Suite (Write Tests FIRST)
**Before implementation**, write a complete test suite covering:

| Path | Symbol | Tests For | Example |
|------|--------|-----------|---------|
| **Happy** | ✅ | Correct behavior with valid input | `calculateROI(100, 50)` → `0.5` |
| **Destructive** | 💥 | Graceful handling of invalid input | `calculateROI(null, -1)` → `throws InvalidInputError` |
| **Boundary** | ⏱️ | Edge values at limits | `calculateROI(0, 0)` → defined behavior, not `NaN` |
| **Idempotent** | 🔄 | Stability across repeated calls | `calculateROI(100, 50)` called 2x → same result |

**Test Naming Convention**:
```
test_<behavior>_when_<condition>_should_<outcome>
```

**Example**:
```dart
test('calculateROI_when_costIsZero_should_returnInfinity')
```

#### Phase 3.5: Strategy Selection (The Double-Check)
**Before coding**, generate **2 distinct implementation strategies**.

For example:
- "Recursive vs. Iterative"
- "In-memory vs. Stream"
- "Optimistic locking vs. Pessimistic locking"

For each strategy, evaluate in one sentence:
1. How well does it respect the **FAILURE BOUNDARY** from Phase 1?
2. How naturally does it handle the **top threat** from Phase 2?
3. What is its **performance/complexity tradeoff**?

**SELECT** the strategy that best serves resilience over cleverness. State your choice and the deciding reason.

#### Phase 4: Implementation
**Now you may code.**

Constraints:
- Every branch must trace back to a test case
- No silent failures—every `catch` block must log, rethrow, or return a typed error
- Defensive programming: Validate inputs at the boundary, trust nothing downstream
- Prefer explicit over clever—readability over brevity

#### Phase 5: Verification & Hardening (Self-Healing Review)
After implementation:

1. **RUN** all tests (or simulate execution trace if runtime unavailable)
2. **HUNT for silent failures**—places where the code swallows errors or returns ambiguous defaults:
   - Empty `catch` blocks
   - Functions returning `null`/`undefined` where an error is more appropriate
   - Ambiguous return values (e.g., returning `0` for both "not found" and "zero balance")
   - Missing input validation at public API boundaries
3. **For each silent failure found**:
   a. Write a new test that exposes it
   b. Fix the code
   c. Re-run all tests
4. **Confirm**: "All [N] tests pass. [M] silent failures identified and resolved."

---

### When to Scale Down the IDD Protocol

Not every change needs the full 5-phase protocol. Use this decision matrix:

| Change Type | Protocol Level | What to Skip |
|------------|---------------|--------------|
| **New feature / API endpoint** | **Full IDD** | Nothing—run all 5 phases |
| **Bug fix** | **Targeted IDD** | Skip Phase 1 if contracts are clear; write regression test first, then fix |
| **Config change / env variable** | **Lightweight** | Threat model + one boundary test |
| **Typo / comment / formatting** | **None** | Just make the change |
| **Refactor (no behavior change)** | **Test-Locked** | Run existing tests before AND after; add tests if coverage is low |

---

###Forbidden Patterns

These patterns are **NEVER** acceptable in Questerix code:

| ❌ Pattern | Why It's Forbidden | ✅ Alternative |
|-----------|-------------------|----------------|
| Empty `catch`/`except` blocks | Swallows errors silently | Log + rethrow OR return typed error |
| `console.log` as error handling | Not observable in production | Use structured logging or error tracking |
| Returning `null`/`undefined` for errors | Ambiguous failure signal | Return `Result<T, E>` or throw typed exception |
| String concatenation for SQL/HTML | Injection risk | Use parameterized queries/templates |
| Hardcoded secrets/API keys | Security violation | Use environment variables + secret management |
| Functions `>40` lines without extraction | Unmaintainable complexity | Extract helper functions |
| Untested code marked "complete" | False confidence | Write tests OR mark as draft |

---

---

## 📋 TABLE OF CONTENTS

### Part 1: The IDD Protocol (Above)
1. [The 5-Phase Loop](#the-5-phase-loop)
2. [When to Scale Down](#when-to-scale-down-the-idd-protocol)
3. [Forbidden Patterns](#forbidden-patterns)

### Part 2: Questerix Project Context
4. [Quickstart for Contributors](#-quickstart-for-contributors)
5. [Project Overview](#-project-overview)

### Part 3: Language-Specific Testing Patterns
6. [Flutter/Dart Test Generation](#-flutterdart-test-generation)
7. [TypeScript/React Test Generation](#-typescriptreact-test-generation)
8. [Playwright E2E Test Generation](#-playwright-e2e-test-generation)
9. [Python Test Generation](#-python-test-generation)

### Part 4: Quality & Security
10. [Code Review Prompts](#-code-review-prompts)
11. [Bug Pattern Library](#-bug-pattern-library-learned-from-production)
12. [Security Checklist](#-security-checklist)
13. [Database & Migration Safety](#-database--migration-safety)

### Part 5: Questerix-Specific Patterns
14. [Multi-Tenant Patterns](#-questerix-specific-patterns)
15. [Offline-First (Student App)](#-questerix-specific-patterns)
16. [RLS-First (Supabase)](#-questerix-specific-patterns)

### Part 6: Advanced Topics
17. [PR Review Automation](#-pr-review-automation)
18. [Documentation Generation](#-documentation-generation)
19. [Refactoring Assistance](#-refactoring-assistance)
20. [Project Structure Reference](#-project-structure-reference)
21. [Master Checklist](#-master-checklist)

---

## 🚀 Quickstart for Contributors

1) Clone and install
- Node: use "npm ci" at repo root and in admin-panel/ and landing-pages/
- Python: python -m venv .venv && .venv/Scripts/Activate.ps1 && pip install -r content-engine/requirements.txt
- Flutter: flutter pub get in student-app/

2) Run quality gates locally (fast path)
- Admin Panel: npm run -w admin-panel lint && npm run -w admin-panel typecheck && npm run -w admin-panel test -- --coverage
- Student App: flutter analyze && flutter test --coverage
- Content Engine: coverage run -m pytest && coverage report --fail-under=80
- Supabase (dry run): node scripts/apply-migrations.js --dry-run

3) E2E locally (optional)
- Copy admin-panel/.env.e2e.example to .env.local and fill values
- npx playwright install && npm run -w admin-panel test:e2e

## 🧭 Governance: Ownership and Change Process

- Audience: Engineers, QA, and AI assistants generating code for Questerix
- Ownership: Maintained by Questerix Dev Team; infra/security sign-off required for RLS/policy sections
- Proposing changes: Open PR labeled docs-change; CI enforces docs freshness via scripts/check-docs-freshness.sh and .github/workflows/docs-index.yml
- Source of truth: This guide + best_practices.md + SECURITY.md; configs referenced below are canonical

## ✅ World-Class Enhancements: Tasks Completed

- [Finished] IDD Protocol integration (Feb 2026)
- [Finished] Single-source coverage gates with canonical config references
- [Finished] Schema Drift SOP (Drift ↔ Supabase) with step-by-step commands
- [Finished] DLQ comprehensive Flutter test example
- [Finished] ArchUnitTS setup checklist and matcher usage
- [Finished] Playwright .env.e2e.example specification and seeding notes
- [Finished] Error/Result modeling adoption policy with UI mapping sample
- [Finished] Accessibility testing integration with @axe-core/playwright
- [Finished] Docs governance and CI freshness policy
- [Finished] Safe Supabase RPC template with hardened search_path
- [Finished] Flutter resource management checklist and test guidance
- [Finished] Monorepo toolchain versions and deterministic installs (Volta/asdf recommended)
- [Finished] Golden tests approval workflow for Flutter



---

## 📌 Project Overview

**Questerix** is a multi-tenant educational platform with:

| Component | Technology | Location |
|-----------|------------|----------|
| **Student App** | Flutter, Riverpod, Drift | `student-app/` |
| **Admin Panel** | React, TypeScript, Vite, Vitest, Playwright | `admin-panel/` |
| **Content Engine** | Python, Pydantic | `content-engine/` |
| **Backend** | Supabase (Postgres + Edge Functions + RLS) | `supabase/` |
| **Design System** | Tokens, Icons, Generators | `design-system/` |
| **Landing Pages** | React, TypeScript, Vite | `landing-pages/` |

### Architecture Principles
- **Feature-first organization** - Each feature is self-contained
- **Repository pattern** - Data access abstracted behind interfaces
- **Dependency injection** - Riverpod (Flutter), Context (React)
- **Multi-tenant isolation** - ALL data scoped by tenant/organization via RLS
- **Offline-first** - Student app works without network (SyncService + Outbox)

---

## 🧪 FLUTTER/DART TEST GENERATION

### File Locations (MANDATORY)
```
Source: student-app/lib/src/core/sync/sync_service.dart
Test:   student-app/test/core/sync/sync_service_test.dart
        ↳ Mirror the source structure exactly

Integration Tests: student-app/integration_test/
```

### Complete Test Template
```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:student_app/src/core/database/database.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:drift/drift.dart' hide isNotNull, isNull;
import 'package:drift/native.dart';

// ===== MOCKS (at top of file) =====
class MockSupabaseClient extends Mock implements SupabaseClient {}
class MockPostgrestFilterBuilder extends Mock implements PostgrestFilterBuilder {}
class MockPostgrestBuilder extends Mock implements PostgrestBuilder {}

void main() {
  // ===== LATE DECLARATIONS =====
  late AppDatabase database;
  // ignore: unused_local_variable - kept for future integration tests
  late MockSupabaseClient mockSupabase;

  // ===== SETUP =====
  setUp(() async {
    // Create in-memory database for testing
    database = AppDatabase(NativeDatabase.memory());
    mockSupabase = MockSupabaseClient();
    
    // Register fallback values for mocktail
    registerFallbackValue(Uri());
  });

  // ===== TEARDOWN =====
  tearDown(() async {
    await database.close();
  });

  // ===== TESTS GROUPED BY BEHAVIOR =====
  group('Outbox Grouping Logic', () {
    test('Groups outbox items by table and action', () async {
      // Arrange: Set up test data
      await database.into(database.outbox).insert(
        OutboxCompanion(
          id: const Value('outbox-1'),
          table: const Value('attempts'),
          action: const Value('INSERT'),
          recordId: const Value('attempt-1'),
          payload: const Value('{"id": "attempt-1"}'),
          createdAt: Value(DateTime.now()),
        ),
      );

      // Act: Execute the code under test
      final items = await database.select(database.outbox).get();
      
      // Group by table and action
      final grouped = <String, List<OutboxEntry>>{};
      for (final item in items) {
        final key = '${item.table}_${item.action}';
        grouped.putIfAbsent(key, () => []).add(item);
      }

      // Assert: Verify expectations
      expect(grouped['attempts_INSERT']?.length, 1);
    });
  });

  group('Dead Letter Queue Behavior', () {
    test('Marks items as failed after 5 retries', () async {
      // Test DLQ logic
    });
  });
}
```

#### DLQ Comprehensive Test Example
```dart
group('Dead Letter Queue Behavior', () {
  test('increments retry_count and moves to failed after 5 attempts (no deletion)', () async {
    // Arrange: seed an outbox record with 4 retries
    await database.into(database.outbox).insert(
      OutboxCompanion(
        id: const Value('out-1'),
        table: const Value('attempts'),
        action: const Value('INSERT'),
        recordId: const Value('attempt-1'),
        payload: const Value('{"id":"attempt-1"}'),
        createdAt: Value(DateTime.now()),
        retryCount: const Value(4),
        failed: const Value(false),
      ),
    );

    // Act: simulate another failed sync attempt
    // (In real code this would be pushChanges() catching a network error)
    await (database.update(database.outbox)
          ..where((o) => o.id.equals('out-1')))
        .write(const OutboxCompanion(retryCount: Value(5)));

    // Move to DLQ if threshold reached
    final item = await (database.select(database.outbox)
          ..where((o) => o.id.equals('out-1')))
        .getSingle();
    if (item.retryCount >= 5) {
      await (database.update(database.outbox)
            ..where((o) => o.id.equals('out-1')))
          .write(const OutboxCompanion(failed: Value(true)));
    }

    // Assert: item is marked failed and NOT deleted
    final after = await (database.select(database.outbox)
          ..where((o) => o.id.equals('out-1')))
        .getSingle();
    expect(after.failed, isTrue);
  });
});
```

### Drift ORM Patterns (CRITICAL)
```dart
// ❌ WRONG: batch.delete doesn't exist
await _database.batch((batch) {
  for (final id in ids) {
    batch.delete(_database.domains, (d) => d.id.equals(id)); // ERROR!
  }
});

// ✅ CORRECT: Use single DELETE with .isIn()
await (_database.delete(_database.domains)
      ..where((d) => d.id.isIn(ids)))
    .go();

// Type Naming in Drift:
// - FooEntry = The actual database row type (use for queries)
// - FooData = Companion class for inserts/updates
// - FooCompanion = Builder pattern for partial updates
```

### Mocking Rules
- **Always use `mocktail`** - Never use mockito
- **Register fallback values** for complex types
- **Use in-memory Drift database**: `NativeDatabase.memory()`
- **Suppress unused warnings** when needed: `// ignore: unused_local_variable`

### Naming Conventions
| Element | Convention | Example |
|---------|------------|---------|
| Test files | `{source}_test.dart` | `sync_service_test.dart` |
| Test descriptions | Plain English, behavior-focused | `'Groups outbox items by table and action'` |
| Group names | Feature or scenario | `'Dead Letter Queue Behavior'` |
| Variables | lowerCamelCase | `mockSupabase` |

#### Resource Management (Flutter) ��� Checklist
- Cancel StreamSubscriptions in dispose
- Close StreamControllers and TextEditingControllers
- Use Riverpod ref.onDispose for listeners started in providers
- Avoid setState after dispose; guard async callbacks with mounted
- Prefer ValueNotifier/ChangeNotifier dispose in tests

Example (Riverpod-managed listener):
```dart
final subscriptionProvider = Provider.autoDispose<StreamSubscription>((ref) {
  final stream = ref.watch(eventStreamProvider);
  final sub = stream.listen((_) {});
  ref.onDispose(() => sub.cancel());
  return sub;
});
```

Test assertion for disposal:
```dart
test('cancels stream subscription on dispose', () async {
  final container = ProviderContainer();
  addTearDown(container.dispose);
  final sub = container.read(subscriptionProvider);
  expect(sub, isA<StreamSubscription>());
  container.dispose();
  // No exception and subscription is cancelled
  expect(sub.isPaused, isTrue);
});
```

---

## 🔷 TYPESCRIPT/REACT TEST GENERATION

### File Locations (MANDATORY)
```
Source: admin-panel/src/features/curriculum/hooks/use-curriculum.ts
Test:   admin-panel/src/features/curriculum/hooks/use-curriculum.test.ts
        ↳ Co-locate tests with source files

OR for shared tests:
Test:   admin-panel/src/__tests__/architecture.test.ts
```

### Unit Test Template (Vitest)
```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/**
 * Test Suite for [Feature Name]
 */
describe('Feature Name', () => {
  
  // ===== SETUP =====
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===== TEARDOWN =====
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Behavior Group', () => {
    
    it('should describe expected behavior clearly', async () => {
      // Arrange
      const mockData = { id: '1', name: 'Test' };
      
      // Act
      const result = await functionUnderTest(mockData);
      
      // Assert
      expect(result).toEqual(expectedValue);
    });
  });
});
```

### Architecture Test Template (ArchUnitTS)
```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { projectFiles } from 'archunit';
import { extendVitestMatchers } from 'archunit/dist/src/testing/vitest/vitest-adapter';

// Extend Vitest with ArchUnit matchers
beforeAll(() => {
  extendVitestMatchers();
});

/**
 * Architecture Tests for Admin Panel
 * 
 * These tests enforce architectural boundaries to prevent coupling violations
 * and maintain clean code organization.
 */
describe('Architecture Rules', () => {
  
  describe('Layer Dependencies', () => {
    
    it('services should not depend on components (UI layer)', async () => {
      const rule = projectFiles()
        .inFolder('src/services/**')
        .shouldNot()
        .dependOnFiles()
        .inFolder('src/components/**');
      
      await expect(rule).toPassAsync();
    });

    it('lib utilities should not depend on features', async () => {
      const rule = projectFiles()
        .inFolder('src/lib/**')
        .shouldNot()
        .dependOnFiles()
        .inFolder('src/features/**');
      
      await expect(rule).toPassAsync();
    });
  });

  describe('Feature Isolation', () => {
    
    it('curriculum feature should not import from mentorship', async () => {
      const rule = projectFiles()
        .inFolder('src/features/curriculum/**')
        .shouldNot()
        .dependOnFiles()
        .inFolder('src/features/mentorship/**');
      
      await expect(rule).toPassAsync();
    });
  });

  describe('Naming Conventions', () => {
    
    it('hooks should follow use-*.ts naming pattern', async () => {
      const rule = projectFiles()
        .inFolder('src/hooks/**')
        .should()
        .haveName(/^use-.*\.(ts|tsx)$/);
      
      await expect(rule).toPassAsync();
    });
  });

  describe('Circular Dependencies', () => {
    
    it('components should be free of cycles', async () => {
      const rule = projectFiles()
        .inFolder('src/components/**')
        .should()
        .haveNoCycles();
      
      await expect(rule).toPassAsync();
    });
  });
});
```

### Vitest Configuration Requirements
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    globals: true, // REQUIRED for ArchUnit custom matchers
    environment: 'jsdom',
  },
})
```

### ArchUnitTS Setup Checklist
- Install: npm i -D archunit vitest
- Ensure globals: vitest.config.ts → test.globals = true
- Run: npm run test:arch (map this to vitest --run src/__tests__/architecture.test.ts)
- Minimal test to validate setup:
```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { projectFiles } from 'archunit';
import { extendVitestMatchers } from 'archunit/dist/src/testing/vitest/vitest-adapter';

beforeAll(() => extendVitestMatchers());

describe('Arch smoke', () => {
  it('src should have no cycles', async () => {
    const rule = projectFiles().inFolder('src/**').should().haveNoCycles();
    await expect(rule).toPassAsync();
  });
});
```

### Feature Isolation Rules
Features should NOT import from each other:
- `curriculum` ↔ `mentorship` (isolated)
- `curriculum` ↔ `auth` (isolated)
- `platform` ↔ `curriculum` (isolated)
- `ai-assistant` ↔ `mentorship` (isolated)

Allowed cross-feature imports:
- `src/lib/**` (shared utilities)
- `src/types/**` (shared types)
- `src/components/**` (shared UI)

---

## 🎭 PLAYWRIGHT E2E TEST GENERATION

### File Location
```
Tests: admin-panel/tests/*.spec.ts
Helpers: admin-panel/tests/helpers/
Utils: admin-panel/tests/test-utils.ts
```

### Complete E2E Test Template
```typescript
import { test, expect, Page } from '@playwright/test';
import { TEST_CREDENTIALS, generateTestSkill } from './test-utils';
import { SupabaseClient } from '@supabase/supabase-js';

// ===== HELPER FUNCTIONS =====
async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/');
}

// Radix Select helper (for shadcn/ui components)
async function selectOption(page: Page, triggerSelector: string, optionTextOrIndex: string | number) {
  await page.click(triggerSelector);
  if (typeof optionTextOrIndex === 'number') {
    await page.locator('[role="option"]').nth(optionTextOrIndex).click();
  } else {
    await page.getByRole('option', { name: optionTextOrIndex }).click();
  }
}

// ===== TEST SUITE =====
test.describe('Admin Panel E2E Tests', () => {
  test.describe.configure({ mode: 'serial' });

  let supabase: SupabaseClient;

  // ===== DATABASE SETUP =====
  test.beforeAll(async () => {
    // Load environment variables
    if (!process.env.VITE_SUPABASE_URL) {
      try {
        const dotenv = await import('dotenv');
        dotenv.config({ path: '.env' });
        dotenv.config({ path: '.env.local' });
      } catch (e) {
        console.warn('Could not load dotenv');
      }
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not found');
    }

    const { createClient } = await import('@supabase/supabase-js');
    const { cleanTestData, seedTestData } = await import('./helpers/seed-test-data');

    supabase = createClient(supabaseUrl, supabaseKey);

    // Clean and seed
    console.log('Seeding test data...');
    await cleanTestData(supabase);
    await seedTestData(supabase);
  });

  test.afterAll(async () => {
    if (supabase) {
      const { cleanTestData } = await import('./helpers/seed-test-data');
      await cleanTestData(supabase);
    }
  });

  // ===== AUTHENTICATION TESTS =====
  test.describe('Authentication', () => {
    test('should load login page', async ({ page }) => {
      await page.goto('/login');
      await expect(page).toHaveTitle(/Admin/);
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
    });

    test('should login with valid credentials', async ({ page }) => {
      await login(page, TEST_CREDENTIALS.email, TEST_CREDENTIALS.password);
      await expect(page.locator('text=Domains').first()).toBeVisible();
    });

    test('should show error with invalid credentials', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[type="email"]', 'wrong@example.com');
      await page.fill('input[type="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Invalid login credentials')).toBeVisible({ timeout: 10000 });
    });

    test('should redirect to login when accessing protected route', async ({ page }) => {
      await page.goto('/domains');
      await expect(page).toHaveURL(/\/login/);
    });
  });

  // ===== CRUD TESTS =====
  test.describe('Domains Management', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, TEST_CREDENTIALS.email, TEST_CREDENTIALS.password);
    });

    test('should list all domains', async ({ page }) => {
      await page.goto('/domains');
      await expect(page.locator('h2:has-text("Domains")')).toBeVisible();
      await expect(page.locator('a[href="/domains/new"]').first()).toBeVisible();
    });
  });
});
```

### E2E Best Practices
| Practice | Implementation |
|----------|----------------|
| **Serial mode** | `test.describe.configure({ mode: 'serial' })` |
| **Data isolation** | Clean/seed before tests, cleanup after |
| **Explicit waits** | Use `waitForURL`, not arbitrary `waitForTimeout` |
| **Bypass dialogs** | `page.evaluate(() => { window.confirm = () => true; })` |
| **Radix UI selects** | Use helper for `[role="option"]` clicks |

### E2E Environment Variables (.env.e2e.example)
Create admin-panel/.env.e2e.example (do not commit filled secrets):
```
# Client (safe in browser bundle)
VITE_SUPABASE_URL=https://xyzcompany.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# Server-side (Node only – Playwright fixtures)
SUPABASE_SERVICE_ROLE_KEY=sbp_...
TEST_ADMIN_EMAIL=admin@example.com
TEST_ADMIN_PASSWORD=Passw0rd!
```
Notes:
- Never expose SUPABASE_SERVICE_ROLE_KEY in front-end code; only in Node test context
- Seed/cleanup happens in Playwright beforeAll/afterAll using the service key

---

## 🐍 PYTHON TEST GENERATION

### File Locations (MANDATORY)
```
Source: content-engine/src/generators/question_generator.py
Test:   content-engine/tests/generators/test_question_generator.py
        ↳ Mirror structure with test_ prefix
```

### Test Template (Pytest)
```python
import pytest
from unittest.mock import Mock, patch
from src.generators.question_generator import QuestionGenerator

class TestQuestionGenerator:
    """Tests for QuestionGenerator class."""
    
    @pytest.fixture
    def generator(self):
        """Create a fresh generator instance."""
        return QuestionGenerator()
    
    def test_generates_valid_question(self, generator):
        """Should generate a question with all required fields."""
        # Arrange
        input_text = "Sample input"
        
        # Act
        result = generator.generate(input_text)
        
        # Assert
        assert result is not None
        assert 'question' in result
        assert 'answer' in result

    def test_handles_empty_input(self, generator):
        """Should raise ValueError for empty input."""
        with pytest.raises(ValueError):
            generator.generate("")
```

### Python Code Quality Rules
```python
# ❌ BAD: F-string without placeholders
print(f"Processing migration file...")

# ✅ GOOD: Regular string when no interpolation
print("Processing migration file...")

# ❌ BAD: Unused imports
from typing import Literal, Optional, Any  # If not used!

# ✅ GOOD: Only import what you use
from typing import Optional
```

---

## 📝 CODE REVIEW PROMPTS

### Security Review
```
Review this code for security vulnerabilities. Check for:

1. SQL injection risks (raw queries, unsanitized inputs)
2. XSS vulnerabilities (unescaped user content)
3. Hardcoded secrets or credentials (API keys, passwords)
4. Improper authentication/authorization (missing auth checks)
5. Missing input validation (boundary checks, type validation)
6. Insecure data exposure (sensitive data in logs/responses)
7. Multi-tenant data leakage (missing tenant scoping)
8. RLS policy bypasses (SECURITY DEFINER misuse)

Context: This is a multi-tenant application where data isolation is CRITICAL.
All database operations must respect RLS policies.
The Supabase `anon` key is designed to be public; security relies on RLS.
The `service_role` key MUST NEVER be exposed.
```

### Performance Review
```
Analyze this code for performance issues. Check for:

1. N+1 query problems (loops making individual queries)
2. Unnecessary re-renders (React) or rebuilds (Flutter)
3. Missing database indexes (slow queries on large tables)
4. Large payload sizes (fetching more data than needed)
5. Synchronous operations that should be async
6. Memory leaks (unclosed streams, listeners not disposed)
7. Missing pagination for large datasets
8. Unbatched operations (should use 100-item chunks)

Pattern to suggest:
- Batch operations: Group into chunks of 100
- Use .isIn() for batch deletes instead of loops
```

### Architecture Review
```
Review this code for architectural compliance. Check for:

1. Feature isolation violations (cross-feature imports)
2. Circular dependencies (A imports B imports A)
3. Layer violations (UI importing from services directly)
4. Missing abstractions (direct database access from components)
5. Naming convention violations (hooks must be use-*.ts)
6. Missing error handling (unhandled Promise rejections)
7. Improper state management (prop drilling vs. context)

Questerix Architecture Rules:
- Features: curriculum ↔ mentorship ↔ platform (isolated)
- Allowed cross-imports: lib, types, components (shared)
- Services should never import from components
```

---

## 🐛 BUG PATTERN LIBRARY (Learned from Production)

### 1. Naming Drift (Supabase ↔ Drift Mismatch)
**Problem**: Supabase schema uses `best_streak` but Drift expects `longest_streak`.

**Prevention**:
```dart
// Always verify tables.dart against baseline.sql before sync logic
// Use a shared field registry if possible
```

**Detection**: Compare column names in migrations vs. Drift models.

---

### 2. Ghost Data (Tombstone Sync Issues)
**Problem**: Deleted records reappear after sync due to missing tombstone propagation.

**Prevention**: Ensure `deleted_at` is synced, not just ignored on delete.

---

### 3. Zombie Tenant (Hardcoded UUIDs)
**Problem**: Developer hardcodes test tenant UUID for local testing; leaks to production.

**Risk**: Offline devices default to wrong school during sync failures.

**Detection**:
```bash
grep -r "51f4" student-app/lib/  # Search for known test UUIDs
```

---

### 4. Blind Fire RPC (Unscoped Admin Actions)
**Problem**: `publish_curriculum` RPC can be called without arguments in TypeScript.

**Prevention**: All dangerous RPCs should require explicit arguments.

---

### 5. RLS `WITH CHECK (true)` (Security Red Flag)
**Problem**: Overly permissive policies allow any user to insert/update.

**Good**:
```sql
WITH CHECK (user_id = auth.uid())
```

**Bad**:
```sql
WITH CHECK (true)  -- Anyone can insert!
```

**Exception**: `error_logs` INSERT is intentionally permissive for observability.

---

### 6. Supabase Type Corruption
**Problem**: Running `supabase gen types > file.ts` when auth fails empties the file.

**Prevention**:
```powershell
# Set token FIRST
$env:SUPABASE_ACCESS_TOKEN = "sbp_..."
supabase gen types typescript --project-id XXX > database.types.ts
```

**Recovery**: `git checkout admin-panel/src/types/database.types.ts`

---

### 7. React State Duplicate Properties
**Problem**: Copy-pasting state initialization creates duplicate keys.

**Bad**:
```typescript
const [formData, setFormData] = useState({
  name: '',
  slug: '',  // First occurrence
  slug: '',  // Duplicate! TypeScript error
});
```

---

### 8. Nullability Handling
**Problem**: Database fields can be `null` but state expects `string`.

**Fix**:
```typescript
grade_level: app.grade_level ?? ''  // Nullish coalescing
```

---

### 9. Windows Unicode in CLI Tools
**Problem**: Emoji characters crash PowerShell scripts.

**Fix**:
```python
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
```

---

### 10. Function Search Path Vulnerability
**Problem**: Supabase functions with mutable search_path can be hijacked.

**Fix**:
```sql
ALTER FUNCTION public.is_admin SET search_path = public;
```

---

### 11. npm Package Name Confusion
**Problem**: GitHub repo name differs from npm package name.

**Example**:
| Package | Description |
|---------|-------------|
| `arch-unit-ts` | ❌ Wrong (different library) |
| `archunit` | ✅ Correct (LukasNiessen's ArchUnitTS) |

---

### 12. Test String Exactness
**Problem**: UI test expected 'Ask a parent for help' but UI shows 'Ask a Parent for Help'.

**Prevention**: When modifying UI text, always grep for usage in `/test/`.

---

## 🔒 SECURITY CHECKLIST

```
All new code must pass:

□ RLS policy verification - Every table has appropriate policies
□ No hardcoded secrets - Use environment variables
□ Input validation at boundaries - Sanitize all user input
□ Proper authentication checks - Verify auth.uid() where needed
□ Multi-tenant isolation - All queries scoped by organization
□ Function search_path hardened - SET search_path = public
□ No SECURITY DEFINER abuse - Understand the implications
□ service_role key protected - Never exposed to clients
□ No overly permissive policies - Document WHY if using (true)
```

---

## 🗄️ DATABASE & MIGRATION SAFETY

### Migration Requirements
```sql
-- 1. Must be IDEMPOTENT (safe to run twice)
CREATE TABLE IF NOT EXISTS my_table (...);

-- 2. Must be REVERSIBLE (document rollback)
-- Rollback: DROP TABLE IF EXISTS my_table;

-- 3. Must RESPECT existing RLS policies
-- 4. Keep schema changes SMALL and reviewed
```

### Type Generation Pattern
```powershell
# Always set auth token first
$env:SUPABASE_ACCESS_TOKEN = "sbp_your_token"

# Then generate types
supabase gen types typescript --project-id YOUR_PROJECT_ID > admin-panel/src/types/database.types.ts
```

### Extension Schema Rule
```sql
-- ❌ BAD: Extensions in public schema
CREATE EXTENSION vector;

-- ✅ GOOD: Extensions in dedicated schema
CREATE EXTENSION vector WITH SCHEMA extensions;
```

### Schema Drift SOP (Drift ↔ Supabase) [Finished]
1) Make DB changes via supabase/migrations with idempotent, reversible scripts
2) Generate TS types: set SUPABASE_ACCESS_TOKEN, then run scripts/generate_types.js or gen_types.ps1
3) Regenerate Flutter Drift code (if applicable) and verify tables.dart matches baseline.sql
4) Run checks locally:
```
node scripts/check_db_schema.js
node scripts/check_extensions.js
node scripts/apply-migrations.js --dry-run
node scripts/inspect_rpc.js
```
5) Compare generated types and Drift models to baseline.sql; update artifacts in PR
6) CI must fail on drift; do not override gates without approval from DB owner

### Safe RPC Template and Policy Hardening [Finished]
```sql
-- File: supabase/functions/rpc_example.sql
CREATE OR REPLACE FUNCTION public.publish_curriculum(p_project uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public AS $
BEGIN
  IF p_project IS NULL THEN
    RAISE EXCEPTION 'p_project required';
  END IF;
  -- business logic here
END;
$;

-- RLS policy must ensure caller has rights to the project
-- Example WITH CHECK scoping by organization
CREATE POLICY publish_curriculum_check ON public.curricula
  FOR UPDATE TO authenticated
  USING (organization_id = (SELECT organization_id FROM user_orgs WHERE user_id = auth.uid()))
  WITH CHECK (organization_id = (SELECT organization_id FROM user_orgs WHERE user_id = auth.uid()));
```

---

## 🔧 QUESTERIX-SPECIFIC PATTERNS

### Outbox Pattern (Sync Service)
```dart
// Items are grouped by table and action for batch processing
final grouped = <String, List<OutboxEntry>>{};
for (final item in items) {
  final key = '${item.table}_${item.action}';
  grouped.putIfAbsent(key, () => []).add(item);
}
```

### Dead Letter Queue (DLQ)
```dart
// Items are marked as failed after 5 retries
if (item.retryCount >= 5) {
  await markAsFailed(item.id);
}
// Failed items are NOT deleted - kept for debugging
```

### Batch Size Limits
```dart
// Split large batches into chunks of 100
const maxBatchSize = 100;
final batches = <List<T>>[];
for (var i = 0; i < items.length; i += maxBatchSize) {
  final end = (i + maxBatchSize < items.length) 
      ? i + maxBatchSize 
      : items.length;
  batches.add(items.sublist(i, end));
}
```

### Riverpod Provider Pattern
```dart
final myServiceProvider = Provider<MyService>((ref) {
  final supabase = ref.watch(supabaseClientProvider);
  final database = ref.watch(appDatabaseProvider);
  return MyService(supabase: supabase, database: database);
});
```

### React Hook Pattern
```typescript
export function useCurriculum(projectId: string) {
  const [data, setData] = useState<Curriculum | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    
    async function fetchData() {
      try {
        const result = await fetchCurriculum(projectId);
        if (!cancelled) setData(result);
      } catch (e) {
        if (!cancelled) setError(e as Error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    
    fetchData();
    return () => { cancelled = true; };
  }, [projectId]);

  return { data, loading, error };
}
```

### Semantic Icon Layer
```dart
// Instead of directly using LucideIcons throughout the app:
Icon(LucideIcons.home)

// Create a semantic layer:
abstract class AppIcons {
  static const home = LucideIcons.home;
  static const learn = LucideIcons.bookOpen;
  static const practice = LucideIcons.target;
}

// Usage:
Icon(AppIcons.home)  // Platform-agnostic, semantic
```

### Responsive Navigation (Material 3)
```dart
final screenWidth = MediaQuery.of(context).size.width;
final isTablet = screenWidth >= 768;
final isDesktop = screenWidth >= 1024;

if (isTablet) {
  return Row(
    children: [
      NavigationRail(
        extended: isDesktop,  // Show labels only on desktop
        // ...
      ),
      VerticalDivider(),
      Expanded(
        child: ConstrainedBox(
          constraints: BoxConstraints(maxWidth: 1200),
          child: content,
        ),
      ),
    ],
  );
}

return Scaffold(
  body: content,
  bottomNavigationBar: BottomNavigationBar(...),
);
```

---

## 🔄 PR REVIEW AUTOMATION

### PR Review Prompt
```
Review this pull request for:

1. **Correctness** - Does the code do what it's supposed to?
2. **Security** - Any RLS bypasses, hardcoded secrets, multi-tenant issues?
3. **Architecture** - Feature isolation respected? Layer violations?
4. **Performance** - N+1 queries? Missing batching?
5. **Testing** - Adequate test coverage? Edge cases?
6. **Naming** - Follows conventions? (use-*.ts for hooks)
7. **Error Handling** - All async errors caught? User-friendly messages?

Questerix-specific checks:
- [ ] Database types match Supabase schema
- [ ] Sync service handles offline correctly
- [ ] Multi-tenant scoping in all queries
```

---

## 🧰 CI ENFORCEMENT AND QUALITY GATES

This section defines enforceable CI commands, thresholds, and remediation steps. All checks must be automated and fail the pipeline when violated.

### Workspaces and Commands
- Admin Panel (TypeScript)
  - Lint: npm run lint
  - Typecheck: npm run typecheck or tsc --noEmit
  - Unit tests: npm run test -- --coverage
  - Architecture tests: npm run test:arch (ArchUnitTS)
  - Dependency graph: npm run depcruise (see dependency rules below)
- Student App (Flutter)
  - Static analysis: flutter analyze
  - Unit/Widget tests: flutter test --coverage
- Content Engine (Python)
  - Tests + coverage: pytest -q; coverage run -m pytest && coverage report
- Supabase (DB/Migrations)
  - Dry-run/schema sanity:
    - node scripts/check_db_schema.js
    - node scripts/check_extensions.js
    - node scripts/apply-migrations.js --dry-run
  - RPC and policy inspection:
    - node scripts/inspect_rpc.js
    - node scripts/verify_phase_16.js (as applicable)

All commands must exit non-zero on failure and surface actionable logs in pipeline artifacts.

### Coverage Gates (Required)
- Admin Panel (Vitest + c8)
  - Enforce per-project gates via vitest.config.ts:
    ```ts
    // vitest.config.ts (snippet)
    export default defineConfig({
      test: {
        globals: true,
        environment: 'jsdom',
        coverage: {
          reporter: ['text', 'lcov'],
          include: ['src/**/*.{ts,tsx}'],
          all: true,
          lines: 80,
          functions: 80,
          branches: 75,
          statements: 80,
        },
      },
    });
    ```
- Student App (Flutter)
  - Generate coverage: flutter test --coverage
  - Recommended gate (implement in CI script): fail if overall line coverage < required module threshold.
- Content Engine (Python)
  - .coveragerc example:
    ```ini
    [run]
    branch = True

    [report]
    fail_under = 80
    skip_covered = True
    show_missing = True
    ```
  - CI: coverage run -m pytest && coverage report --fail-under=80

When feature-critical modules (Core/Sync, Auth/Security) appear in the diff, raise temporary gates to 90%+ per Master Checklist.

### Canonical Configs and Single Source of Truth [Finished]
- Admin Panel coverage gates: admin-panel/vitest.config.ts
- Python coverage gates: content-engine/.coveragerc (add if missing) and enforced in CI
- Flutter coverage gate: enforced via CI script step comparing coverage/lcov.info summary
- Dependency boundaries: .dependency-cruiser.cjs at repo root and admin-panel/
- Security scanning: .github/workflows/security.yml

### Toolchain and Deterministic Installs [Finished]
- Node: 20.x; npm: 10.x; pin via Volta (package.json engines + volta) or asdf (.tool-versions)
- Python: 3.11.x; use venv; freeze indirects with pip-tools (optional)
- Flutter: stable channel (3.x); flutter --version recorded in docs/operational
- Supabase CLI: latest stable; verify via supabase --version in CI logs
- Commands:
```
# Node
npm ci
# Python
python -m venv .venv && . .venv/Scripts/activate && pip install -r content-engine/requirements.txt
# Flutter
flutter pub get
```

### Dependency Boundaries (dependency-cruiser)
- Rules summary for admin-panel/src:
  - features/** must not import other features/**
  - services/** must not import components/**
  - lib/** must not import features/**
- Example rules (in .dependency-cruiser.cjs):
  ```js
  /** @type {import('dependency-cruiser').IConfiguration} */
  module.exports = {
    forbidden: [
      {
        name: 'no-feature-cross-imports',
        comment: 'Features must not import other features',
        severity: 'error',
        from: { path: '^src/features/([^/]+)/' },
        to: { path: '^src/features/([^/]+)/', pathNot: '^src/features/$1/' },
      },
      {
        name: 'services-no-components',
        severity: 'error',
        from: { path: '^src/services/' },
        to: { path: '^src/components/' },
      },
      {
        name: 'lib-no-features',
        severity: 'error',
        from: { path: '^src/lib/' },
        to: { path: '^src/features/' },
      },
    ],
  };
  ```
- CI command: npx dependency-cruiser --config .dependency-cruiser.cjs src --output-type err

### Generated Types Guard (Supabase)
- Prevent empty or corrupted type files in CI:
  - Validate file is non-empty and compile-checks:
    - PowerShell:
      ```powershell
      if ((Get-Item 'admin-panel/src/types/database.types.ts').Length -eq 0) { Write-Error 'database.types.ts is empty'; exit 1 }
      npm run typecheck
      ```
  - Regeneration:
    ```powershell
    $env:SUPABASE_ACCESS_TOKEN = 'sbp_...'
    supabase gen types typescript --project-id YOUR_PROJECT_ID > admin-panel/src/types/database.types.ts
    ```

### Migration PR Checklist and Pre-flight
- Mandatory for any PR touching supabase/migrations or functions:
  1) Policies: No WITH CHECK (true) except documented exceptions (e.g., error_logs insert). Use WITH CHECK (user_id = auth.uid()) or equivalent tenant scoping.
  2) Functions: SET search_path = public; SECURITY DEFINER usage justified and documented.
  3) RLS completeness: Each table has SELECT/INSERT/UPDATE/DELETE policies or explicit REVOKE.
  4) Idempotent + reversible: CREATE IF NOT EXISTS; document DROP/rollback steps in comments.
  5) Indexing: Create supporting indexes for new FK lookups or high-cardinality filters.
  6) Type drift check: Drift models vs baseline.sql aligned.
- Commands:
  - node scripts/check_db_schema.js
  - node scripts/check_extensions.js
  - node scripts/apply-migrations.js --dry-run
  - node scripts/inspect_rpc.js

### Configuration and Secrets Management
- TypeScript (Vite/Node) – use zod and central loaders:
  ```ts
  import { z } from 'zod';

  const ServerEnv = z.object({
    SUPABASE_URL: z.string().url(),
    SUPABASE_SERVICE_ROLE_KEY: z.string(), // server-only
  });

  const ClientEnv = z.object({
    VITE_SUPABASE_URL: z.string().url(),
    VITE_SUPABASE_ANON_KEY: z.string(),
  });

  export const serverEnv = ServerEnv.parse(process.env);
  export const clientEnv = ClientEnv.parse(import.meta.env);
  ```
- Rule: service_role MUST NEVER ship to clients. Enforce via static search in CI and dependency-cruiser forbidden patterns if needed.
- Python (Pydantic):
  ```python
  from pydantic import BaseSettings, AnyUrl, SecretStr

  class Settings(BaseSettings):
      SUPABASE_URL: AnyUrl
      SUPABASE_SERVICE_ROLE_KEY: SecretStr
      class Config:
          env_file = ('.env', '.env.local')
          extra = 'ignore'

  settings = Settings()
  ```

### Test Data and Seeding Strategy
- Deterministic factories:
  - TS: Use faker with seeded RNG; isolate helpers under admin-panel/tests/test-utils.ts.
  - Python: Use pytest fixtures in content-engine/tests/conftest.py with tmp_path for isolation.
  - Flutter: Keep golden assets under student-app/test/goldens; update via explicit approval only.
- E2E: Use helpers/seed-test-data with idempotent clean/seed before suite and cleanup after.

### Error and Result Modeling
- TypeScript (services):
  ```ts
  type Ok<T> = { ok: true; value: T };
  type Err<E extends Error = Error> = { ok: false; error: E };
  export type Result<T, E extends Error = Error> = Ok<T> | Err<E>;

  export async function fetchCurriculum(id: string): Promise<Result<Curriculum>> {
    try {
      const data = await api.getCurriculum(id);
      return { ok: true, value: data };
    } catch (e) {
      return { ok: false, error: e as Error };
    }
  }
  ```
- Dart (sealed-like result):
  ```dart
  class Result<T> {
    final T? value; final Object? error;
    const Result.ok(this.value) : error = null;
    const Result.err(this.error) : value = null;
    bool get isOk => error == null;
  }
  ```
- Python (custom exceptions): Define domain-specific errors (e.g., GenerationError, ValidationError) and avoid print in libraries; use logging.

#### Adoption Policy and UI Mapping [Finished]
- Services return Result<T> instead of throwing. Only boundary adapters may throw typed domain errors.
- UI layers unwrap Result and display friendly messages; technical details logged with correlation IDs.

UI mapping example (React):
```tsx
const { value, error, ok } = await fetchCurriculum(id);
if (!ok) {
  setToast({ variant: 'destructive', title: 'Could not load curriculum' });
  log.error('curriculum_load_failed', { id, error });
  return;
}
setData(value);
```

### Logging, PII, and Observability
- Do not log PII. Redact emails, names, tokens.
- Admin Panel: Central error boundary strips sensitive details.
- Student App: Offline logs queued; avoid sensitive payloads.
- Prefer structured logs and attach correlation IDs where possible.

### Accessibility and i18n Testing
- Admin Panel: Include accessibility checks with @axe-core/playwright
  ```ts
  import { test, expect } from '@playwright/test';
  import AxeBuilder from '@axe-core/playwright';

  test('homepage has no critical a11y violations', async ({ page }) => {
    await page.goto('/');
    const results = await new AxeBuilder({ page })
      .include('main')
      .analyze();
    const critical = results.violations.filter(v => v.impact === 'critical');
    expect(critical, JSON.stringify(critical, null, 2)).toHaveLength(0);
  });
  ```
- Verify ARIA roles and accessible names in unit tests where feasible.
- Student App: Follow ACCESSIBILITY.md and prefer semantic widgets; include golden tests for contrast/visual regressions as needed.

### Windows Compatibility Notes
- Use cross-env for env vars in Node scripts.
- Ensure scripts support CRLF; avoid bash-only constructs in cross-platform scripts.
- Prefer Node/Python entry points over fragile shell pipelines when possible.

### Drift ORM Advanced Patterns
- Prefer single-statement upserts with ON CONFLICT (id) DO UPDATE semantics when safe and available.
- Use .isIn() for batch operations rather than loops (see earlier pattern).
- Normalize date/time handling; be explicit about UTC and nullability.

### ArchUnitTS Installation Pin
- Use the correct package: archunit (not arch-unit-ts).
  ```bash
  npm i -D archunit vitest
  ```
- Ensure vitest test.globals = true for custom matchers.

### PR Labels and Automation Cues
- Labels → implied checks:
  - db-change: Run migration checklist and DB scripts (dry-run, schema, policies).
  - e2e-needed: Run Playwright suite serially with clean/seed.
  - security-review: Apply Security Review prompt and policy validations.
  - arch-review: Enforce dependency-cruiser + ArchUnitTS rules.

---

## 📚 DOCUMENTATION GENERATION

### JSDoc/Dartdoc Prompt
```
Generate documentation for this code:
- Add JSDoc (TypeScript) or Dartdoc (Dart) comments for all public APIs
- Include parameter descriptions with types
- Add usage examples
- Document error conditions and thrown exceptions
- Note any side effects (database writes, external API calls)
- Document multi-tenant behavior if applicable
```

### README Generation
```
Generate a README for this module:
- Purpose and responsibility
- Installation/setup requirements
- Usage examples
- Configuration options
- Known limitations
- Related modules/dependencies
```

---

## 🔨 REFACTORING ASSISTANCE

### Extract for Testability
```
Refactor this code to improve testability:
- Extract dependencies for injection
- Create interfaces/abstractions for external services
- Separate I/O from pure logic
- Make functions smaller and more focused
- Remove global state dependencies
- Use repository pattern for data access
```

### Reduce Coupling
```
Reduce coupling in this module:
- Identify cross-feature imports that violate architecture
- Extract shared logic to lib/
- Use dependency injection instead of direct imports
- Create interfaces at module boundaries
- Apply repository pattern for data access
```

---

## 📁 PROJECT STRUCTURE REFERENCE

```
Questerix/
├── admin-panel/
│   ├── src/
│   │   ├── __tests__/          # Shared tests (architecture.test.ts)
│   │   ├── components/         # Shared UI components
│   │   ├── features/
│   │   │   ├── ai-assistant/   # AI content generation
│   │   │   ├── auth/           # Authentication
│   │   │   ├── curriculum/     # Domains, Skills, Questions
│   │   │   ├── mentorship/     # Groups, Students
│   │   │   ├── monitoring/     # Error logs, Analytics
│   │   │   └── platform/       # Apps, Landing pages
│   │   ├── hooks/              # Shared hooks (use-*.ts)
│   │   ├── lib/                # Utilities (no feature deps)
│   │   ├── services/           # API services (no UI deps)
│   │   └── types/              # TypeScript types (database.types.ts)
│   └── tests/                  # Playwright E2E
│
├── student-app/
│   ├── lib/src/
│   │   ├── core/
│   │   │   ├── database/       # Drift database
│   │   │   ├── sync/           # SyncService, Outbox
│   │   │   └── security/       # Multi-tenant isolation
│   │   └── features/
│   │       ├── auth/
│   │       ├── curriculum/
│   │       ├── onboarding/
│   │       └── practice/
│   ├── test/                   # Unit & Widget tests
│   └── integration_test/       # Integration tests
│
├── content-engine/
│   ├── src/
│   │   ├── generators/         # Question generators
│   │   ├── parsers/            # Document parsers
│   │   └── validators/         # Content validators
│   └── tests/                  # Pytest tests
│
├── supabase/
│   ├── migrations/             # SQL migrations
│   ├── functions/              # Edge functions
│   └── seed.sql                # Test data
│
├── design-system/
│   ├── tokens/                 # JSON design tokens
│   ├── generators/             # Flutter/Tailwind generators
│   └── generated/              # Generated output
│
├── landing-pages/              # Marketing site
│
├── docs/
│   ├── LEARNING_LOG.md         # Production bug learnings
│   └── reports/                # Audit reports
│
├── .github/workflows/          # CI/CD
│
├── QODO_GUIDE.md               # This file!
├── best_practices.md           # Project conventions
├── SECURITY.md                 # Security context
└── ops_runner.py               # Autonomous execution
```

---

## 🧪 THOROUGH TESTING REQUIREMENTS

### Testing Philosophy
**Every feature MUST be thoroughly tested.** Tests are not optional - they are a requirement for all code changes.

### Test Coverage Requirements
| Module Type | Minimum Coverage | Priority |
|-------------|------------------|----------|
| **Core/Sync** | 90%+ | Critical business logic |
| **Auth/Security** | 90%+ | Security-critical paths |
| **Features** | 80%+ | User-facing functionality |
| **Utils/Helpers** | 70%+ | Supporting code |

### What to Test (Comprehensive List)
```
For EVERY function/component, test:

□ Happy path - Normal successful execution
□ Edge cases - null, undefined, empty arrays, empty strings
□ Boundary values - 0, -1, MAX_INT, empty, single item, many items
□ Error conditions - Network failures, invalid data, timeouts
□ Async states - Loading, success, error, cancelled
□ State transitions - Before, during, after operations
□ Multi-tenant isolation - Data scoped correctly
□ Offline behavior - Works without network (student app)
□ Race conditions - Concurrent operations handled
□ Retry logic - Failures are retried correctly
□ Cleanup - Resources released, listeners disposed
```

### Test Quality Standards
```dart
// ❌ BAD: Vague test name, no edge cases
test('it works', () {
  expect(calculate(5), 10);
});

// ✅ GOOD: Descriptive name, tests edge cases
group('calculate', () {
  test('doubles positive numbers', () {
    expect(calculate(5), 10);
  });
  
  test('handles zero', () {
    expect(calculate(0), 0);
  });
  
  test('handles negative numbers', () {
    expect(calculate(-5), -10);
  });
  
  test('throws for null input', () {
    expect(() => calculate(null), throwsA(isA<ArgumentError>()));
  });
});
```

#### Golden Tests Process (Flutter) [Finished]
- Update goldens explicitly: set UPDATE_GOLDENS=1 (env) or use flutter test --update-goldens
- Store under student-app/test/goldens; review diffs visually in PR
- Require PR label visual-change-approved for golden updates
- Gate visual changes in CI by failing unless label is present (optional policy)

---

## 📖 DOCUMENTATION LOCATIONS

### Where to Document What

| What | Where | Purpose |
|------|-------|---------|
| **Bug learnings & errors** | `docs/LEARNING_LOG.md` | Prevent repeated mistakes |
| **Project conventions** | `best_practices.md` | Code style, test strategy |
| **Security context** | `SECURITY.md` | For external reviewers |
| **AI/Qodo instructions** | `QODO_GUIDE.md` | This file |
| **API documentation** | Inline JSDoc/Dartdoc | Code-level docs |
| **Architecture decisions** | `docs/architecture/` | Design rationale |
| **Audit reports** | `docs/reports/` | Certification results |
| **Module READMEs** | `{module}/README.md` | Module-specific docs |
| **Known issues** | Supabase `known_issues` table | Tracked bugs for AI learning |

### Docs Governance and Freshness [Finished]
- Changes to QODO_GUIDE.md require docs-change label and trigger docs freshness CI (.github/workflows/docs-index.yml)
- Run scripts/check-docs-freshness.sh in CI; fail when guide/related docs are stale vs code changes
- Update docs alongside feature changes; PRs must include inline code docs for new public APIs

### LEARNING_LOG.md Format (MANDATORY)
When you encounter a bug or learn something, document it:

```markdown
## YYYY-MM-DD: [Session Title]

### Session Context
- **Objective**: What were you trying to do?
- **Technologies**: What was involved?
- **Outcome**: Success/Failure/Partial

---

### Key Learnings

#### 1. [Learning Title]

**What Happened**: Describe the problem encountered.

**Error** (if applicable):
\`\`\`
Paste the actual error message
\`\`\`

**Root Cause**: Why did this happen?

**Fix**: What was the solution?

**Prevention**: How to avoid this in the future.

---

### Files Modified/Created

| File | Action | Purpose |
|------|--------|---------|
| `path/to/file` | Created/Modified | Why |

---

### Recommendations for Future Work
1. First recommendation
2. Second recommendation
```

### Documentation After Every Session
```
After completing work, Qodo MUST:

1. ✅ Update LEARNING_LOG.md with any bugs/errors encountered
2. ✅ Add new patterns to QODO_GUIDE.md if discovered
3. ✅ Update best_practices.md if conventions change
4. ✅ Add inline documentation for complex code
5. ✅ Update module README if architecture changes
```

### Inline Documentation Standards
```typescript
/**
 * Fetches curriculum data for a specific project.
 * 
 * @param projectId - The UUID of the project to fetch
 * @returns Promise resolving to curriculum data or null if not found
 * @throws {AuthError} If user is not authenticated
 * @throws {NetworkError} If request fails
 * 
 * @example
 * const curriculum = await fetchCurriculum('123e4567-e89b-12d3-a456-426614174000');
 * 
 * @remarks
 * This function respects multi-tenant boundaries - users can only
 * access curriculum from their assigned organization.
 */
async function fetchCurriculum(projectId: string): Promise<Curriculum | null> {
  // Implementation
}
```

```dart
/// Synchronizes pending outbox items with the remote server.
/// 
/// Items are grouped by table and action, then sent in batches of 100.
/// Failed items are retried up to 5 times before being moved to DLQ.
/// 
/// Throws [NetworkException] if connection fails.
/// Throws [AuthException] if user session has expired.
/// 
/// Example:
/// ```dart
/// await syncService.pushChanges();
/// ```
Future<void> pushChanges() async {
  // Implementation
}
```

---

## ✅ MASTER CHECKLIST

### When Generating Code
- [ ] File placed in correct location (mirror source structure)
- [ ] Correct testing framework (mocktail/Vitest/pytest)
- [ ] Imports are complete and correct
- [ ] Setup and teardown included
- [ ] All edge cases covered
- [ ] Error handling tested
- [ ] Async operations properly handled
- [ ] Naming conventions followed
- [ ] No feature isolation violations
- [ ] Multi-tenant safety considered

### When Reviewing Code
- [ ] No security vulnerabilities (RLS, secrets, XSS)
- [ ] No performance issues (N+1, unbatched ops)
- [ ] Architecture rules respected
- [ ] Bug patterns avoided (see library above)
- [ ] Database types match schema
- [ ] Tests cover critical paths

### Before Committing
- [ ] `flutter analyze` passes (student-app)
- [ ] `npm run lint` passes (admin-panel)
- [ ] `npm run test:arch` passes (admin-panel)
- [ ] Database migrations are idempotent
- [ ] No hardcoded secrets or UUIDs
- [ ] UI text changes synced with tests

---

> **Last Updated**: February 2026
> **Maintained by**: Questerix Development Team
> **Source of Truth**: This file + `best_practices.md` + `LEARNING_LOG.md`
