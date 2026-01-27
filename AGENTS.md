# AGENTS.md Execution Contract

> **Source of Truth**: `AppShell/docs/AGENTS.md`  
> This file is the execution contract for AI agents. Follow it exactly.  
> If any instruction conflicts with another doc, this file wins.

---

## Non-Negotiable Rules

1. **No freelancing**. Do not introduce new libraries, patterns, or architecture choices not explicitly approved here.
2. **Work in phases**. Complete a phase fully, run validations, and stop at the checkpoint.
3. **Small PRs**. Each phase should be delivered as a clean, reviewable change set with a clear summary.
4. **Security and data integrity first**. Never rely on UI-only restrictions for admin access.
5. **Deterministic and audit-friendly**. Prefer explicitness over cleverness.
6. **Phase State Tracking**. Maintain `PHASE_STATE.json` at root.
   - Track `current_phase`, `completed_phases`, `files_created`, `validation_passed`.
   - Support resume/rollback capabilities.
   - Update state after each validation checkpoint.

---

## Decisions Locked

### Platform
- **Student app**: Flutter (tablet-first).
- **Admin panel**: React (browser-first).

### Initialization
- Projects are initialized from templates only:
  - Flutter: `flutter create`
  - React admin: `npm create vite@latest` with React + TypeScript template.
- Agents do not invent scaffolding in an empty directory.

### State Management
- **Flutter**: Riverpod only (no mixing with Provider/BLoC/etc).
- **React admin**: React Query (v5) for server state + React Context for lightweight UI state only.

### Backend/Auth
- Supabase as the backend.
- Admin auth: Supabase Auth + admin role check.
- RBAC is enforced in the database (RLS/policies), not just in UI.

### Secrets/OAuth
- Agents create `.env.example` with placeholders.
- Agents document setup steps.
- Human performs Supabase dashboard/OAuth provider configuration.

### Testing
- Critical-path tests only. Focus on:
  - Auth/session
  - Sync and conflict resolution rules
  - Data validation
  - Any logic that must not break
- UI/UX: Functional requirements + accessibility requirements.
- No pixel-perfect design enforcement unless a design system is provided.

### Errors/Logging
- Comprehensive approach required:
  - Typed error categories
  - User-friendly messages
  - Logging service
  - Retry/backoff strategies (sync/network)
  - External error tracking: Sentry (`sentry_flutter` for Flutter)

### Connectivity
- Hybrid detection:
  - Use `connectivity_plus`
  - Also treat request failures as truth (connectivity APIs can lie)

### Curriculum Updates
- Hybrid strategy:
  - Supabase Realtime subscriptions when online
  - Polling fallback + manual refresh trigger

### Conflict Resolution
- Merge strategy at granular level (question/attempt/skill).
- Deduplicate by stable IDs.
- Never drop user progress due to timestamp races.

### Code Quality
- Strict:
  - Linting and formatting enforced
  - Strong typing
  - No warnings in CI/build

### Deployment
- Agents write build/deploy scripts + documentation.
- Agents do not execute releases or handle app store submissions.

### Seed Data
- Agents create seed scripts with realistic sample data and safe dev reset.

### Dependency Versioning
- Flutter: `supabase_flutter` LOCKED (^2.0.0).
- React: `@tanstack/react-query` LOCKED (v5).
- Explicit update rules: minor updates ok, major require review.

---

## Run and Test Contract

The project includes standardized build/test tooling that agents must use. These files are part of the template and enforce consistency across all implementations.

### Template Files (DO NOT REINVENT)

The following files exist in the template. Agents may modify them to meet requirements but **must not replace the contract** (target names, port bindings, and Proof of Run expectations).

| File | Purpose |
|------|---------|
| `Makefile` | Unified build/test commands for all components |
| `supabase/scripts/verify_rls.sh` | RLS verification runner script |
| `supabase/scripts/verify_rls.sql` | RLS verification SQL queries |

### Makefile Targets

**Admin Panel (React/Vite)**:
- `make web_setup` - Install dependencies
- `make web_dev` - Run dev server on `0.0.0.0:5173`
- `make web_lint` - Lint code
- `make web_test` - Run tests
- `make web_build` - Production build

**Student App (Flutter)**:
- `make flutter_setup` - Install dependencies
- `make flutter_gen` - Run codegen (build_runner)
- `make flutter_analyze` - Static analysis
- `make flutter_test` - Run tests
- `make flutter_run_web` - Smoke test on web at `0.0.0.0:3000`

**Database (Supabase)**:
- `make db_start` - Start local Supabase stack
- `make db_stop` - Stop local Supabase stack
- `make db_migrate` - Apply migrations
- `make db_reset` - Reset local DB (DESTRUCTIVE)
- `make db_verify_rls` - Run RLS verification

**CI/Validation**:
- `make ci` - Run all lint/test/build gates
- `make validate_phase_N` - Run Phase N validation script

### Port and Host Rules

All dev servers **must** bind to `0.0.0.0` (not `localhost` or `127.0.0.1`) to work correctly in:
- GitHub Codespaces
- Replit
- DevContainers
- Remote development environments

| Component | Default Port | Host |
|-----------|--------------|------|
| Admin Panel (Vite) | 5173 | 0.0.0.0 |
| Flutter Web | 3000 | 0.0.0.0 |
| Supabase Studio | 54323 | localhost |
| Supabase API | 54321 | localhost |
| Supabase DB | 54322 | localhost |

### RLS Verification

Before any PR that modifies database schema or RLS policies:

```bash
make db_verify_rls
```

This runs `supabase/scripts/verify_rls.sh` which:
1. Checks that `psql` is installed
2. Connects to local Supabase
3. Executes `verify_rls.sql` to verify:
   - RLS is enabled on all required tables
   - `is_admin()` function exists
   - Anonymous users cannot write to protected tables

Agents **must expand** `verify_rls.sql` as they add new tables and policies.

### Mobile Testing Policy

**Automated testing**: Flutter unit tests and integration tests run via `make flutter_test`.

**Manual device testing**: Agents do not have access to physical devices or simulators in cloud environments (Codespaces, Replit). The following policy applies:

| Test Type | Agent Responsibility | Human Responsibility |
|-----------|---------------------|---------------------|
| Unit tests | Write and run | Review results |
| Integration tests | Write and run (headless) | Run on device |
| UI smoke test | Run on web (`make flutter_run_web`) | Test on tablet device |
| Device-specific features | Document test plan | Execute test plan |

Agents must document any device-specific test requirements in the PR description.

### Proof of Run Requirements

Every PR that includes code changes must demonstrate:

1. **Build Success**: Output from `make ci` or equivalent showing all checks pass
2. **Test Results**: Summary of test runs (pass/fail counts)
3. **RLS Verification**: For database changes, output from `make db_verify_rls`
4. **Screenshots/Recordings**: For UI changes (if running in environment that supports it)

Example PR checklist:
```markdown
## Proof of Run
- [ ] `make ci` passed (attach output)
- [ ] `make db_verify_rls` passed (if applicable)
- [ ] Manual smoke test completed (describe what was tested)
```

---

## Repository Layout Rules

- `AppShell/docs/AGENTS.md` is the source of truth.
- When repo is created, copy to `/AGENTS.md` (root).
- If both exist, they must be identical. If drift is detected, stop and fix it.

---

## Phase Workflow

Each phase includes:
- **Goal**: Clear objective
- **Allowed Changes**: Specific files/directories agents can modify
- **Prerequisites**: Inputs needed from previous phases
- **Required Outputs**: Deliverables that must exist
- **Validation**: Automated scripts (`scripts/validate-phase-X.sh`) and checklist
- **Stop Checkpoint**: Explicit "DO NOT PROCEED" until validated
- **Pre-Stop Checklist**: Artifacts, State (json), Git, Docs

Agents must stop at each checkpoint and wait for the next instruction unless the task explicitly says "continue."

---

## Phase Definitions

### Phase -1: Environment Validation

**Goal**: Verify all required tools are installed and accessible.

**Prerequisites**: None (this is the entry point).

**Allowed Changes**: None (validation only).

**Validation Script** (`scripts/validate-phase--1.sh`):
```bash
#!/bin/bash
set -e

echo "Checking Flutter..."
FLUTTER_VERSION=$(flutter --version | head -n 1 | awk '{print $2}')
REQUIRED_FLUTTER="3.19.0"
if [ "$(printf '%s\n' "$REQUIRED_FLUTTER" "$FLUTTER_VERSION" | sort -V | head -n1)" != "$REQUIRED_FLUTTER" ]; then
  echo "BLOCKER: Flutter version $FLUTTER_VERSION is below minimum $REQUIRED_FLUTTER"
  exit 1
fi

echo "Checking Node..."
NODE_VERSION=$(node --version | cut -d'v' -f2)
REQUIRED_NODE="18.0.0"
if [ "$(printf '%s\n' "$REQUIRED_NODE" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_NODE" ]; then
  echo "BLOCKER: Node version $NODE_VERSION is below minimum $REQUIRED_NODE"
  exit 1
fi

echo "Checking Supabase CLI..."
SUPABASE_VERSION=$(supabase --version | awk '{print $3}')
REQUIRED_SUPABASE="1.123.0"
if [ "$(printf '%s\n' "$REQUIRED_SUPABASE" "$SUPABASE_VERSION" | sort -V | head -n1)" != "$REQUIRED_SUPABASE" ]; then
  echo "BLOCKER: Supabase CLI version $SUPABASE_VERSION is below minimum $REQUIRED_SUPABASE"
  exit 1
fi

echo "Checking Supabase auth..."
if ! supabase projects list > /dev/null 2>&1; then
  echo "BLOCKER: Supabase CLI not authenticated. Run 'supabase login'"
  exit 1
fi

echo "All tools validated successfully"
```

**Required Outputs**:
- Validation script exists and passes
- All tools meet minimum version requirements

**Validation Checklist**:
- [ ] Flutter >= 3.19.0 installed
- [ ] Node >= 18.0.0 installed
- [ ] Supabase CLI >= 1.123.0 installed
- [ ] Supabase CLI authenticated (`supabase projects list` succeeds)

**Stop Checkpoint**: If ANY tool is missing or version is insufficient, STOP and output blocker message. DO NOT PROCEED.

---

### Phase 0: Project Bootstrap

**Goal**: Create baseline Flutter and React apps from templates, add tooling.

**Prerequisites**: Phase -1 validation passed.

**Allowed Changes**:
- Template initialization (`flutter create`, `npm create vite@latest` with React + TypeScript)
- Folder structure creation
- Tooling configuration (lint, format, CI scripts)
- `.env.example` creation
- Basic app skeleton pages (placeholders)
- `PHASE_STATE.json` initialization

**Required Outputs**:
- Flutter app compiles and runs (device/simulator optional)
- React admin builds and runs locally
- `.env.example` for both apps (placeholders only)
- Scripts folder with build commands (not executed)
- Sentry wiring stubbed in Flutter (can be disabled by env)
- Seed script placeholders (can be no-op initially)
- `PHASE_STATE.json` initialized with Phase 0 state

**Validation Script** (`scripts/validate-phase-0.sh`):
```bash
#!/bin/bash
set -e

echo "Validating Flutter app..."
cd student-app
flutter analyze
flutter test || echo "WARNING: No tests yet"
cd ..

echo "Validating React admin..."
cd admin-panel
npm run build
npm run lint || echo "WARNING: Lint not configured yet"
cd ..

echo "Checking required files..."
if [ ! -f "student-app/.env.example" ]; then
  echo "ERROR: student-app/.env.example missing"
  exit 1
fi

if [ ! -f "admin-panel/.env.example" ]; then
  echo "ERROR: admin-panel/.env.example missing"
  exit 1
fi

if [ ! -f "PHASE_STATE.json" ]; then
  echo "ERROR: PHASE_STATE.json missing"
  exit 1
fi

echo "Phase 0 validation passed"
```

**Validation Checklist**:
- [ ] Flutter: `flutter analyze` passes with zero warnings
- [ ] Flutter: `flutter test` runs (even if only one sanity test)
- [ ] React: `npm run build` succeeds
- [ ] React: `npm run lint` passes (if configured)
- [ ] No secrets committed
- [ ] `.env.example` files exist for both apps
- [ ] `PHASE_STATE.json` exists and is valid JSON

**Stop Checkpoint**: Provide a short summary and list of created paths/files. Update `PHASE_STATE.json` with Phase 0 completion. STOP.

---

### Phase 1: Data Model + Contracts

**Goal**: Define the canonical data models and API contracts for:
- Curriculum (domains/skills/questions)
- Student progress (attempts, mastery, timestamps)
- Admin operations (CRUD)

**Prerequisites**: Phase 0 completed, `AppShell/docs/SCHEMA.md` exists.

**Allowed Changes**:
- Data model docs and schemas
- Supabase schema migration files (or SQL)
- RLS policies for admin role
- Seed scripts producing realistic sample curriculum

**Required Outputs**:
- Schema definitions (tables/collections, indexes, constraints)
- RLS policies documented and implemented
- Seed script that can populate a dev environment
- All tables: `profiles`, `domains`, `skills`, `questions`, `attempts`, `sessions`, `skill_progress`, `outbox`, `sync_meta`, `curriculum_meta`

**Phase 1 Implementation Steps**:

1. **Create the migration files**: `supabase/migrations/*.sql`
   - Create granular migration files for each component (enums, profiles, domains, skills, etc.)
   - Follow the naming convention in `SCHEMA.md` Section 9
   - Ensure idempotency: use `IF NOT EXISTS`, `CREATE OR REPLACE`, `ON CONFLICT DO NOTHING`

2. **Create the seed file**: `supabase/seed.sql`
   - Sample domain, skill, and questions (unpublished)
   - Initialize singleton rows (`curriculum_meta`, `sync_meta`)
   - Do NOT try to create admin users in seed (use Supabase Dashboard)

3. **Apply and verify**:
   ```bash
   # Reset DB with migrations + seed
   supabase db reset
   
   # Verify tables exist
   make db_verify_rls
   ```

4. **Update PHASE_STATE.json** with:
   - `files_created`: migration and seed file paths
   - `validation_passed`: true/false

**Code Patterns**:

**SQL Table Creation Pattern** (domains example):
```sql
-- Migration: YYYYMMDDHHMMSS_create_domains.sql
CREATE TABLE domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9_]+$'),
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_domains_slug ON domains(slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_domains_updated_at ON domains(updated_at) WHERE deleted_at IS NULL;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_domains_updated_at
  BEFORE UPDATE ON domains
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**RLS Policy Pattern** (admin role check via `profiles.role`):

**IMPORTANT**: Do NOT create a separate `user_roles` table. Use `profiles.role` as the single source of truth for RBAC.

```sql
-- Helper function to check admin role (uses profiles.role, NOT a separate user_roles table)
-- This function is defined in SCHEMA.md - reference it, don't recreate
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policy: Admins can read/write, students read-only published content
CREATE POLICY domains_admin_all ON domains
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY domains_student_read ON domains
  FOR SELECT
  USING (is_published = true AND deleted_at IS NULL);
```

**Note**: The `is_admin()` function takes no parameters - it uses `auth.uid()` internally. This is more secure than passing user IDs around.

**Seed Script Pattern**:
```sql
-- seed.sql
BEGIN;

-- NOTE: Admin users are created via Supabase Auth (Dashboard or API).
-- The handle_new_user() trigger auto-creates a profiles row with role='student'.
-- To make a user an admin, UPDATE their profile AFTER they authenticate:
--
--   UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@example.com';
--
-- Do NOT try to INSERT directly into profiles - the trigger handles this.

-- Insert sample domain
INSERT INTO public.domains (id, slug, title, description, sort_order, is_published)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'mathematics',
  'Mathematics',
  'Fundamental math concepts and problem-solving',
  1,
  false  -- Set to true when ready to publish
)
ON CONFLICT (slug) DO NOTHING;

-- Insert sample skill
INSERT INTO public.skills (id, domain_id, slug, title, description, difficulty_level, sort_order, is_published)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'addition',
  'Addition',
  'Basic addition operations',
  1,
  1,
  false
)
ON CONFLICT (domain_id, slug) DO NOTHING;

-- Insert sample questions (3 questions)
-- NOTE: Use question types from SCHEMA.md enum: multiple_choice, mcq_multi, text_input, boolean, reorder_steps
INSERT INTO public.questions (id, skill_id, type, content, options, solution, explanation, points, is_published)
VALUES
  (
    '33333333-3333-3333-3333-333333333333',
    '22222222-2222-2222-2222-222222222222',
    'multiple_choice',
    'What is 2 + 2?',
    '{"options": [{"id": "a", "text": "3"}, {"id": "b", "text": "4"}, {"id": "c", "text": "5"}, {"id": "d", "text": "6"}]}'::jsonb,
    '{"correct_option_id": "b"}'::jsonb,
    '2 + 2 = 4',
    1,
    false
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    '22222222-2222-2222-2222-222222222222',
    'multiple_choice',
    'What is 5 + 3?',
    '{"options": [{"id": "a", "text": "7"}, {"id": "b", "text": "8"}, {"id": "c", "text": "9"}, {"id": "d", "text": "10"}]}'::jsonb,
    '{"correct_option_id": "b"}'::jsonb,
    '5 + 3 = 8',
    1,
    false
  ),
  (
    '55555555-5555-5555-5555-555555555555',
    '22222222-2222-2222-2222-222222222222',
    'reorder_steps',
    'Order these steps to solve 2x + 4 = 10',
    '{"steps": [{"id": "1", "text": "Subtract 4 from both sides"}, {"id": "2", "text": "Divide by 2"}, {"id": "3", "text": "x = 3"}]}'::jsonb,
    '{"correct_order": ["1", "2", "3"]}'::jsonb,
    'Step 1: 2x + 4 - 4 = 10 - 4 → 2x = 6. Step 2: 2x/2 = 6/2 → x = 3.',
    2,
    false
  )
ON CONFLICT (id) DO NOTHING;

-- Initialize singleton rows
INSERT INTO public.curriculum_meta (id) VALUES ('singleton') ON CONFLICT DO NOTHING;

INSERT INTO public.sync_meta (table_name) VALUES
  ('domains'), ('skills'), ('questions'), ('attempts'), ('sessions'), ('skill_progress')
ON CONFLICT (table_name) DO NOTHING;

COMMIT;
```

**Validation Script** (`scripts/validate-phase-1.sh`):
```bash
#!/bin/bash
set -e

echo "Applying migrations..."
supabase db reset --seed

echo "Verifying schema..."
psql $DATABASE_URL -c "\d domains" > /dev/null
psql $DATABASE_URL -c "\d skills" > /dev/null
psql $DATABASE_URL -c "\d questions" > /dev/null
psql $DATABASE_URL -c "\d attempts" > /dev/null
psql $DATABASE_URL -c "\d sessions" > /dev/null
psql $DATABASE_URL -c "\d skill_progress" > /dev/null
psql $DATABASE_URL -c "\d outbox" > /dev/null

echo "Verifying RLS policies..."
# Test queries would go here (agents document manual steps)

echo "Phase 1 validation passed"
```

**Validation Checklist**:
- [ ] Schema can be applied cleanly to a fresh Supabase project (human executes)
- [ ] RLS prevents non-admin from admin tables/operations
- [ ] Seed script populates dev environment successfully
- [ ] All 7 tables exist with correct structure
- [ ] Indexes created for performance

**Stop Checkpoint**: Provide schema summary, RLS summary, and seed usage instructions. Update `PHASE_STATE.json`. STOP.

---

### Phase 2: Student App Core Loop (Offline-First)

**Goal**: Student can browse curriculum and complete questions offline-first with local persistence.

**Prerequisites**: Phase 1 completed (schema exists in Supabase).

**Allowed Changes**: `student-app/lib/**` (all Flutter code).

**Implementation Requirements**:
- Local DB (Drift/SQLite) with deterministic UUIDs
- Riverpod for state management (no Provider/BLoC mixing)
- Sync strategy: Supabase Realtime subscriptions when online + polling fallback
- Offline: queue writes to outbox, retry with exponential backoff
- Hybrid connectivity detection: `connectivity_plus` + request-failure detection
- Merge-based conflict resolution (granular level, dedupe by stable IDs)

**Code Patterns**:

**Drift Table Definition** (domains example):
```dart
// lib/database/tables/domains.dart
import 'package:drift/drift.dart';

class Domains extends Table {
  TextColumn get id => text()();
  TextColumn get slug => text().withLength(min: 1, max: 100)();
  TextColumn get title => text().withLength(min: 1, max: 200)();
  TextColumn get description => text().nullable()();
  DateTimeColumn get createdAt => dateTime()();
  DateTimeColumn get updatedAt => dateTime()();
  DateTimeColumn get deletedAt => dateTime().nullable()();

  @override
  Set<Column> get primaryKey => {id};
}
```

**Riverpod Repository** (local-first pattern):
```dart
// lib/repositories/domain_repository.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:drift/drift.dart';
import '../database/database.dart';

final domainRepositoryProvider = Provider<DomainRepository>((ref) {
  final database = ref.watch(databaseProvider);
  return DomainRepository(database);
});

class DomainRepository {
  final AppDatabase database;

  DomainRepository(this.database);

  // Watch all domains from local DB
  Stream<List<Domain>> watchAll() {
    return (database.select(database.domains)
          ..where((d) => d.deletedAt.isNull())
          ..orderBy([(d) => OrderingTerm.asc(d.title)]))
        .watch();
  }

  // Upsert domain to local DB and outbox
  Future<void> upsert(Domain domain) async {
    await database.transaction(() async {
      // Write to local state immediately
      await database.into(database.domains).insertOnConflictUpdate(domain);
      
      // Queue for sync
      await database.into(database.outbox).insert(
        OutboxCompanion.insert(
          tableName: 'domains',
          action: 'UPSERT',
          recordId: domain.id,
          payload: jsonEncode(domain.toJson()),
          createdAt: DateTime.now(),
        ),
      );
    });
    
    // Trigger background sync (fire and forget)
    ref.read(syncServiceProvider.notifier).push();
  }
}
```

**Sync Service** (outbox processing):
```dart
// lib/services/sync_service.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../database/database.dart';

final syncServiceProvider = StateNotifierProvider<SyncService, SyncState>((ref) {
  final database = ref.watch(databaseProvider);
  final supabase = Supabase.instance.client;
  return SyncService(database, supabase);
});

class SyncService extends StateNotifier<SyncState> {
  final AppDatabase database;
  final SupabaseClient supabase;

  SyncService(this.database, this.supabase) : super(SyncState.idle());

  // Process outbox: upload pending changes
  Future<void> push() async {
    if (state.isSyncing) return;
    state = SyncState.syncing();

    try {
      final outboxItems = await (database.select(database.outbox)
            ..orderBy([(o) => OrderingTerm.asc(o.createdAt)]))
          .get();

      for (final item in outboxItems) {
        final payload = jsonDecode(item.payload) as Map<String, dynamic>;
        
        switch (item.action) {
          case 'INSERT':
          case 'UPSERT':
            await supabase.from(item.tableName).upsert(payload);
            break;
          case 'DELETE':
            await supabase.from(item.tableName).delete().eq('id', item.recordId);
            break;
        }

        // Remove from outbox on success
        await (database.delete(database.outbox)
              ..where((o) => o.id.equals(item.id)))
            .go();
      }

      state = SyncState.success();
    } catch (e) {
      state = SyncState.error(e.toString());
      // Retry with exponential backoff
      Future.delayed(Duration(seconds: 5), push);
    }
  }

  // Sync down: download changes from server
  Future<void> pull() async {
    final lastSync = await _getLastSync();
    
    // Download domains
    final domainsResponse = await supabase
        .from('domains')
        .select()
        .gt('updated_at', lastSync.toIso8601String())
        .is_('deleted_at', null);

    for (final domainData in domainsResponse) {
      await database.into(database.domains).insertOnConflictUpdate(
        Domain.fromJson(domainData),
      );
    }

    // Update sync_meta
    await _updateLastSync(DateTime.now());
  }

  Future<DateTime> _getLastSync() async {
    final meta = await (database.select(database.syncMeta)
          ..where((s) => s.tableName.equals('domains'))
          ..limit(1))
        .getSingleOrNull();
    return meta?.lastSyncedAt ?? DateTime.fromMillisecondsSinceEpoch(0);
  }

  Future<void> _updateLastSync(DateTime time) async {
    await database.into(database.syncMeta).insertOnConflictUpdate(
      SyncMetaCompanion.insert(
        tableName: 'domains',
        lastSyncedAt: time,
      ),
    );
  }
}
```

**Realtime Subscription** (with polling fallback):
```dart
// lib/services/realtime_service.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

final realtimeServiceProvider = Provider<RealtimeService>((ref) {
  final supabase = Supabase.instance.client;
  return RealtimeService(supabase);
});

class RealtimeService {
  final SupabaseClient supabase;
  RealtimeChannel? _channel;

  RealtimeService(this.supabase);

  void subscribeToTable(String table, Function(Map<String, dynamic>) onUpdate) {
    // Cancel existing subscription
    _channel?.unsubscribe();

    _channel = supabase.channel('$table-changes')
      ..onPostgresChanges(
        event: PostgresChangeEvent.all,
        schema: 'public',
        table: table,
        callback: (payload) {
          onUpdate(payload.newRecord);
        },
      )
      ..subscribe();

    // Polling fallback: if Realtime fails, poll every 30 seconds
    Timer.periodic(Duration(seconds: 30), (timer) async {
      if (_channel?.isSubscribed != true) {
        // Realtime not connected, trigger manual sync
        // This would call syncService.pull()
      }
    });
  }

  void unsubscribe() {
    _channel?.unsubscribe();
    _channel = null;
  }
}
```

**Conflict Resolution** (field-level merge):
```dart
// lib/services/conflict_resolver.dart
class ConflictResolver {
  // Merge attempts: never delete student work
  static List<Attempt> mergeAttempts(
    List<Attempt> local,
    List<Attempt> remote,
  ) {
    final Map<String, Attempt> merged = {};
    
    // Add all local attempts
    for (final attempt in local) {
      merged[attempt.id] = attempt;
    }
    
    // Merge remote: if same ID, keep the one with later updated_at
    for (final attempt in remote) {
      final existing = merged[attempt.id];
      if (existing == null) {
        merged[attempt.id] = attempt;
      } else {
        // Keep the newer one, but NEVER delete
        merged[attempt.id] = attempt.updatedAt.isAfter(existing.updatedAt)
            ? attempt
            : existing;
      }
    }
    
    return merged.values.toList();
  }

  // Merge skill progress: max attempts, sum points, latest wins for mastery
  static SkillProgress mergeSkillProgress(
    SkillProgress local,
    SkillProgress remote,
  ) {
    return SkillProgress(
      id: local.id,
      skillId: local.skillId,
      userId: local.userId,
      totalAttempts: math.max(local.totalAttempts, remote.totalAttempts),
      correctAttempts: math.max(local.correctAttempts, remote.correctAttempts),
      totalPoints: local.totalPoints + remote.totalPoints,
      masteryLevel: local.updatedAt.isAfter(remote.updatedAt)
          ? local.masteryLevel
          : remote.masteryLevel,
      updatedAt: local.updatedAt.isAfter(remote.updatedAt)
          ? local.updatedAt
          : remote.updatedAt,
    );
  }
}
```

**Required Outputs**:
- Curriculum browsing UI (functional + accessible)
- Question runner for supported types (multiple_choice, mcq_multi, text_input, boolean, reorder_steps)
- Local progress persistence
- Sync engine with merge-based conflict handling
- Connectivity detection service
- Sentry integration (`sentry_flutter`)

**Validation Script** (`scripts/validate-phase-2.sh`):
```bash
#!/bin/bash
set -e

echo "Running Flutter tests..."
cd student-app
flutter analyze
flutter test

echo "Running integration test..."
flutter test integration_test/offline_workflow_test.dart

cd ..
echo "Phase 2 validation passed"
```

**Integration Test Example** (`integration_test/offline_workflow_test.dart`):
```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('Offline workflow: attempt -> sync', (tester) async {
    // 1. Simulate offline mode
    // 2. Create attempt locally
    // 3. Verify attempt saved to outbox
    // 4. Simulate online mode
    // 5. Trigger sync
    // 6. Verify attempt synced to Supabase
    // 7. Verify no duplication
  });
}
```

**Validation Checklist**:
- [ ] Airplane mode: app works with cached curriculum, records progress
- [ ] Reconnect: progress syncs without duplication or loss
- [ ] Drift schema matches Supabase exactly (field-by-field verification)
- [ ] Sentry captures unhandled exceptions (in debug/staging)
- [ ] Realtime subscriptions work when online
- [ ] Polling fallback triggers when Realtime unavailable
- [ ] Integration test passes

**Stop Checkpoint**: Provide walkthrough and list known limitations. Update `PHASE_STATE.json`. STOP.

---

### Phase 3: Admin Panel MVP

**Goal**: Admin can sign in, manage curriculum, and push updates.

**Prerequisites**: Phase 1 completed (schema + RLS), Phase 2 optional (for testing sync).

**Allowed Changes**: `admin-panel/src/**` (all React code).

**Implementation Requirements**:
- Supabase Auth + admin role check (RBAC in database, not just UI)
- React Query for server state
- React Context for lightweight UI state only
- Validation enforces slug regex `^[a-z0-9_]+$`
- Publish workflow is atomic (all or nothing)

**Code Patterns**:

**Supabase Auth with Admin Role Check** (uses `profiles.role`, NOT `user_roles`):
```typescript
// src/lib/auth.ts
import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

/**
 * Verify the current user has admin role.
 * Checks profiles.role (NOT a separate user_roles table).
 */
export async function verifyAdminRole(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  // Query profiles table - the single source of truth for RBAC
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (error || !data) return false;
  return data.role === 'admin';
}

/**
 * Sign in with email/password and verify admin role.
 * Non-admins are immediately signed out.
 */
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  
  const isAdmin = await verifyAdminRole();
  if (!isAdmin) {
    await supabase.auth.signOut();
    throw new Error('Access denied: Admin role required');
  }
  
  return data;
}

/**
 * Sign out the current user.
 */
export async function signOut() {
  await supabase.auth.signOut();
}
```

**React Query Hook** (domains):
```typescript
// src/hooks/useDomains.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';

type Domain = Database['public']['Tables']['domains']['Row'];

export function useDomains() {
  return useQuery({
    queryKey: ['domains'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('domains')
        .select('*')
        .is('deleted_at', null)
        .order('title');
      
      if (error) throw error;
      return data as Domain[];
    },
  });
}

export function useCreateDomain() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (domain: Omit<Domain, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('domains')
        .insert(domain)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['domains'] });
    },
  });
}
```

**CRUD Form with Validation**:
```typescript
// src/components/DomainForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateDomain } from '@/hooks/useDomains';

const domainSchema = z.object({
  slug: z.string()
    .regex(/^[a-z0-9_]+$/, 'Slug must contain only lowercase letters, numbers, and underscores')
    .min(1)
    .max(100),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
});

type DomainFormData = z.infer<typeof domainSchema>;

export function DomainForm() {
  const createDomain = useCreateDomain();
  const { register, handleSubmit, formState: { errors } } = useForm<DomainFormData>({
    resolver: zodResolver(domainSchema),
  });

  const onSubmit = async (data: DomainFormData) => {
    try {
      await createDomain.mutateAsync(data);
      // Success handling
    } catch (error) {
      // Error handling
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('slug')} />
      {errors.slug && <span>{errors.slug.message}</span>}
      
      <input {...register('title')} />
      {errors.title && <span>{errors.title.message}</span>}
      
      <textarea {...register('description')} />
      
      <button type="submit" disabled={createDomain.isPending}>
        Create Domain
      </button>
    </form>
  );
}
```

**Atomic Publish** (RPC transaction):
```typescript
// src/hooks/usePublishCurriculum.ts
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function usePublishCurriculum() {
  return useMutation({
    mutationFn: async (domainIds: string[]) => {
      // RPC call that wraps everything in a transaction
      const { data, error } = await supabase.rpc('publish_curriculum', {
        domain_ids: domainIds,
      });
      
      if (error) throw error;
      return data;
    },
  });
}
```

**SQL RPC Function** (atomic publish):
```sql
-- Migration: YYYYMMDDHHMMSS_create_publish_curriculum_rpc.sql
CREATE OR REPLACE FUNCTION publish_curriculum(domain_ids UUID[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Atomic transaction: update all domains to published state
  UPDATE domains
  SET updated_at = NOW()
  WHERE id = ANY(domain_ids)
    AND deleted_at IS NULL;
  
  -- If any domain doesn't exist, transaction rolls back
  IF NOT FOUND THEN
    RAISE EXCEPTION 'One or more domains not found';
  END IF;
END;
$$;
```

**Required Outputs**:
- Auth flow + guarded routes
- CRUD for domains/skills/questions
- Validation (slug regex, required fields)
- Publish/update triggers (realtime event or updated_at bump)
- Import/export functionality

**Validation Script** (`scripts/validate-phase-3.sh`):
```bash
#!/bin/bash
set -e

echo "Building React admin..."
cd admin-panel
npm run build
npm run lint

echo "Running tests..."
npm test || echo "WARNING: Tests not fully configured"

cd ..
echo "Phase 3 validation passed"
```

**Validation Checklist**:
- [ ] Non-admin cannot access admin routes or data (UI and RLS)
- [ ] Slug validation rejects invalid formats
- [ ] Publish workflow is atomic (no partial publishes)
- [ ] Curriculum update appears on student app via realtime or polling fallback
- [ ] Import/export handles errors gracefully
- [ ] Build succeeds with zero warnings

**Stop Checkpoint**: Provide credentials/setup steps and admin workflow notes. Update `PHASE_STATE.json`. STOP.

---

### Phase 4: Hardening

**Goal**: Make it reliable: error handling, observability, performance, and critical tests.

**Prerequisites**: Phases 0-3 completed.

**Allowed Changes**:
- Error handling across both apps
- Logging service implementation
- Sentry configuration and integration
- Retry/backoff tuning
- Critical-path test expansion
- CI/CD configuration (lint gates)

**Code Patterns**:

**Typed Error Classes** (Flutter):
```dart
// lib/core/errors/app_errors.dart
sealed class AppError implements Exception {
  final String message;
  AppError(this.message);
}

class NetworkError extends AppError {
  NetworkError(super.message);
}

class SyncError extends AppError {
  final int? retryAfter;
  SyncError(super.message, {this.retryAfter});
}

class ValidationError extends AppError {
  final Map<String, String> fieldErrors;
  ValidationError(super.message, this.fieldErrors);
}
```

**Error Handling Wrapper**:
```dart
// lib/core/error_handler.dart
import 'package:sentry_flutter/sentry_flutter.dart';

Future<T> handleError<T>(
  Future<T> Function() operation,
  T Function(AppError)? onError,
) async {
  try {
    return await operation();
  } on NetworkError catch (e) {
    await Sentry.captureException(e);
    if (onError != null) return onError(e);
    rethrow;
  } on SyncError catch (e) {
    await Sentry.captureException(e);
    // Retry logic here
    if (onError != null) return onError(e);
    rethrow;
  } catch (e) {
    await Sentry.captureException(e);
    rethrow;
  }
}
```

**Retry with Exponential Backoff**:
```dart
// lib/core/retry.dart
Future<T> retryWithBackoff<T>(
  Future<T> Function() operation, {
  int maxRetries = 3,
  Duration initialDelay = const Duration(seconds: 1),
}) async {
  int attempt = 0;
  Duration delay = initialDelay;
  
  while (attempt < maxRetries) {
    try {
      return await operation();
    } catch (e) {
      attempt++;
      if (attempt >= maxRetries) rethrow;
      
      await Future.delayed(delay);
      delay = Duration(seconds: delay.inSeconds * 2); // Exponential backoff
    }
  }
  
  throw Exception('Max retries exceeded');
}
```

**Sentry Initialization** (Flutter):
```dart
// lib/main.dart
import 'package:sentry_flutter/sentry_flutter.dart';

Future<void> main() async {
  await SentryFlutter.init(
    (options) {
      options.dsn = const String.fromEnvironment('SENTRY_DSN');
      options.environment = const String.fromEnvironment('ENV', defaultValue: 'development');
      options.tracesSampleRate = 1.0;
    },
    appRunner: () => runApp(MyApp()),
  );
}
```

**Sentry Initialization** (React):
```typescript
// src/main.tsx
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 1.0,
  integrations: [
    new Sentry.BrowserTracing(),
  ],
});
```

**Required Outputs**:
- Typed errors across student/admin apps
- Logging service with levels
- Sentry fully configured
- Retry/backoff tuned for sync operations
- Critical-path test coverage expanded
- Strict lint gates enforced in CI

**Validation Script** (`scripts/validate-phase-4.sh`):
```bash
#!/bin/bash
set -e

echo "Validating Flutter production build..."
cd student-app
flutter analyze
flutter test
flutter build apk --release

echo "Validating React production build..."
cd ../admin-panel
npm run build
npm run lint

echo "Checking CI configuration..."
if [ ! -f ".github/workflows/ci.yml" ]; then
  echo "WARNING: CI workflow not found"
fi

cd ..
echo "Phase 4 validation passed"
```

**CI Workflow Example** (`.github/workflows/ci.yml`):
```yaml
name: CI

on: [push, pull_request]

jobs:
  flutter:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: subosito/flutter-action@v2
      - run: cd student-app && flutter analyze
      - run: cd student-app && flutter test

  react:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd admin-panel && npm ci
      - run: cd admin-panel && npm run lint
      - run: cd admin-panel && npm run build
```

**Validation Checklist**:
- [ ] No warnings in builds
- [ ] Tests cover auth/session, sync merge, validation rules
- [ ] Sentry captures errors correctly
- [ ] Logging service functional
- [ ] Retry logic works (test with network simulation)
- [ ] CI lint gates prevent warnings
- [ ] Production builds succeed

**Stop Checkpoint**: Provide final hardening report and remaining risks. Update `PHASE_STATE.json`. STOP.

---

## Error Recovery & Debugging

### Recovery Patterns

**Pattern 1: Validation Failure**
```yaml
IF: Phase validation command fails
THEN:
  1. Parse error output for specific failure
  2. Check if error is in "Known Recoverable Errors" list
  3. IF recoverable: Execute recovery action, re-run validation
     ELSE: STOP and report "UNRECOVERABLE ERROR"

Known Recoverable Errors:
  - "Package not found" → Run package install command
  - "Lint rule violated" → Run auto-formatter (flutter format / npm run format)
  - "Port already in use" → Kill process on port, retry
  - "Version solving failed" → Delete lockfile, reinstall
```

**Pattern 2: Dependency Conflict**
```yaml
IF: "Version solving failed" (Flutter) or "ERESOLVE" (npm)
THEN:
  1. Delete lockfile (pubspec.lock / package-lock.json)
  2. Re-run package install
  3. IF still fails: Report conflicting dependencies, STOP
```

**Pattern 3: Network Failures**
```yaml
IF: Network request fails during sync
THEN:
  1. Implement exponential backoff (1s, 2s, 4s, 8s)
  2. Retry up to 3 times
  3. IF still fails: Queue for later sync, log error
```

**Pattern 4: Phase Rollback**
```yaml
IF: Agent needs to undo Phase X due to critical error
THEN:
  1. Read PHASE_STATE.json → phase_artifacts[X].files_created
  2. Delete all files in files_created list
  3. Update PHASE_STATE.json: Remove X from completed_phases
  4. Set blocked_on: "Phase X rolled back due to [reason]"
  5. STOP and report
```

### Debugging Playbook

**Issue: Package version conflicts**
- Solution: Check `pubspec.yaml` / `package.json` for conflicting ranges
- Fix: Lock specific versions, update lockfiles

**Issue: RLS blocking legitimate requests**
- Solution: Verify `profiles.role` is set correctly for the user
- Fix: Check RLS policy conditions, verify `is_admin()` function works, test with `service_role` key

**Issue: Drift schema mismatch with Supabase**
- Solution: Compare field-by-field in `SCHEMA.md`
- Fix: Regenerate Drift schema, run `dart run build_runner build --delete-conflicting-outputs`

**Issue: Sync duplicates data**
- Solution: Check conflict resolution logic
- Fix: Verify UUID deduplication, check merge functions

**Issue: Realtime not working**
- Solution: Check Supabase dashboard for channel status
- Fix: Verify authentication, check polling fallback triggers

---

## Output Format for Agent Updates

Every checkpoint response must include:

**What Changed**:
- Bullet list of modifications made
- New files created
- Existing files modified

**Files Touched**:
- List of file paths (relative to project root)
- Group by component (backend, student-app, admin-panel)

**Commands Run + Results**:
- Exact commands executed
- Success/failure status
- Any error messages or warnings

**Risks/Assumptions**:
- Known limitations
- Assumptions made
- Potential issues to watch

**Next Recommended Step**:
- One sentence describing what should happen next
- Reference to next phase or specific task

**Example Format**:
```markdown
## Phase 0 Checkpoint Summary

**What Changed**:
- Created Flutter project structure
- Created React admin panel with Vite
- Added .env.example files
- Configured linting and formatting
- Initialized PHASE_STATE.json

**Files Touched**:
- student-app/pubspec.yaml
- student-app/.env.example
- admin-panel/package.json
- admin-panel/.env.example
- scripts/build.sh
- PHASE_STATE.json

**Commands Run + Results**:
- `flutter create student-app` → Success
- `npm create vite@latest admin-panel -- --template react-ts` → Success
- `flutter analyze` → Zero warnings
- `npm run build` → Build successful

**Risks/Assumptions**:
- Assumes Flutter SDK 3.19+ installed
- Assumes Node.js 18+ installed
- Sentry DSN not configured yet (stubbed)

**Next Recommended Step**:
Proceed to Phase 1: Create Supabase schema migrations and seed scripts.
```

---

## Reference Documents

Agents should reference these specification documents when implementing:

| Document | Path | Status |
|----------|------|--------|
| **Product Requirements** | `AppShell/docs/specs/PRODUCT_REQUIREMENTS.md` | Stub |
| **Data Model Spec** | `AppShell/docs/specs/DATA_MODEL.md` | Stub |
| **API Specification** | `AppShell/docs/specs/API_SPEC.md` | Stub |
| **Student App Spec** | `AppShell/docs/specs/STUDENT_APP_SPEC.md` | Stub |
| **Admin Panel Spec** | `AppShell/docs/specs/ADMIN_PANEL_SPEC.md` | Stub |
| **Implementation Checklist** | `AppShell/docs/specs/IMPLEMENTATION_CHECKLIST.md` | Stub |
| **Field Mapping Reference** | `AppShell/docs/specs/FIELD_MAPPING.md` | Stub |
| **Database Schema** | `AppShell/docs/SCHEMA.md` | **Complete** |

**Note**: If any instruction in AGENTS.md conflicts with these documents, AGENTS.md takes precedence.

**Stub Documents**: Documents marked as "Stub" require human input before agents can rely on them. If a stub document is needed but incomplete, STOP and ask for clarification.

---

## Phase Prerequisites Matrix

| Phase | Depends On | Required Resources | Blocking Conditions |
|-------|------------|-------------------|---------------------|
| **-1** | None | Tools installed (Flutter, Node, Supabase CLI) | Tool version too low |
| **0** | Phase -1 | AGENTS.md, SCHEMA.md | Phase -1 not validated |
| **1** | Phase 0 | Flutter project, React project initialized | Apps don't compile |
| **2** | Phase 1 | Supabase schema applied, RLS working | Schema not deployed |
| **3** | Phase 1 | Supabase schema applied | Schema not deployed |
| **4** | Phase 2, 3 | Both apps functional, tests passing | Build failures |

### Dependency Rules

1. **Hard Dependencies**: Phase N cannot start until Phase N-1 is fully validated
2. **Parallel Execution**: Phases 2 and 3 can run in parallel after Phase 1
3. **Rollback**: If Phase N fails, check if Phase N-1 artifacts are corrupted

---

## Error Code Reference

Standard error codes for debugging and recovery:

### Application Errors

| Code | Category | Description | Recovery Action |
|------|----------|-------------|-----------------|
| `E001` | Network | Request timeout | Retry with exponential backoff |
| `E002` | Auth | JWT expired | Re-authenticate user |
| `E003` | Auth | RLS policy denied | Check user role in profiles |
| `E004` | Sync | Conflict detected | Apply merge strategy |
| `E005` | Schema | Field mismatch | Regenerate Drift schema |
| `E006` | Validation | Invalid input | Show field-level errors |
| `E007` | Database | Unique constraint | Handle duplicate gracefully |

### Build/CI Errors

| Code | Category | Description | Recovery Action |
|------|----------|-------------|-----------------|
| `B001` | Flutter | `flutter analyze` failed | Fix lint warnings |
| `B002` | Flutter | Build failed | Check pubspec.yaml |
| `B003` | React | `npm run build` failed | Check TypeScript errors |
| `B004` | React | `npm run lint` failed | Run `npm run lint:fix` |
| `B005` | Supabase | Migration failed | Check SQL syntax |
| `B006` | Supabase | RLS test failed | Verify policy logic |

### Sync Error Codes (Student App)

| Code | Category | Description | Recovery Action |
|------|----------|-------------|-----------------|
| `S001` | Push | Outbox item failed | Queue for retry |
| `S002` | Pull | Server unreachable | Switch to offline mode |
| `S003` | Merge | Duplicate detected | Dedupe by UUID |
| `S004` | Merge | Data loss risk | Preserve both versions |
| `S005` | Meta | sync_meta corrupted | Reset to epoch, full sync |

---

## Drift Schema Synchronization

When modifying `SCHEMA.md`, ensure Drift tables stay in sync:

### Synchronization Steps

1. **Update SCHEMA.md** with new/modified table definitions
2. **Update Drift tables** in `student-app/lib/database/tables/*.dart`
3. **Run code generation**:
   ```bash
   cd student-app
   dart run build_runner build --delete-conflicting-outputs
   ```
4. **Verify parity** between:
   - `supabase/migrations/*.sql`
   - `student-app/lib/database/database.g.dart`

### Field Naming Convention

| PostgreSQL (snake_case) | Dart (camelCase) | TypeScript (snake_case) |
|------------------------|------------------|------------------------|
| `created_at` | `createdAt` | `created_at` |
| `is_published` | `isPublished` | `is_published` |
| `domain_id` | `domainId` | `domain_id` |

---

## Validation Scripts

Cross-platform validation scripts are available:

| Phase | Bash | PowerShell |
|-------|------|------------|
| -1 | `scripts/validate-phase--1.sh` | `scripts/validate-phase--1.ps1` |
| 0 | `scripts/validate-phase-0.sh` | `scripts/validate-phase-0.ps1` |
| 1 | `scripts/validate-phase-1.sh` | `scripts/validate-phase-1.ps1` |
| 2 | `scripts/validate-phase-2.sh` | `scripts/validate-phase-2.ps1` |
| 3 | `scripts/validate-phase-3.sh` | `scripts/validate-phase-3.ps1` |
| 4 | `scripts/validate-phase-4.sh` | `scripts/validate-phase-4.ps1` |

### Running Validation

**Linux/macOS**:
```bash
chmod +x scripts/validate-phase-*.sh
./scripts/validate-phase-0.sh
```

**Windows (PowerShell)**:
```powershell
.\scripts\validate-phase-0.ps1
```

---

## Execution Protocol

At every interaction, the agent must:

1. **Read Phase State**: Open `PHASE_STATE.json` and parse current state.
2. **Check Prerequisites**: If `blocked_on` is not null, solve that blocker first.
3. **Verify Phase Completion**: If `current_phase` has `validation_passed: false`, do not advance.
4. **Execute Phase**: Perform the *smallest possible atomic step* for the current phase.
5. **Validate**: Run the specific validation script for that phase.
6. **Update State**: Write the result to `PHASE_STATE.json` including:
   - `timestamp`
   - `files_created` or `files_modified`
   - `validation_passed` (boolean)
   - `notes` (any issues encountered)

---

**END OF AGENTS.md**
