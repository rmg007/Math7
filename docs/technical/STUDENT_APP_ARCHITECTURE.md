---
title: "Student App Architecture"
app_scope: student-app
doc_type: architecture
complexity: high
priority: high
status: active
summary: "Offline-first Flutter architecture using Riverpod, Drift/SQLite, and Supabase sync for the student learning application."
tags:
  - flutter
  - riverpod
  - offline-first
  - drift
  - supabase
related_files:
  - "infrastructure/deployment-pipeline.md"
  - "student-app/question-widgets.md"
last_validated_by: antigravity-agent-v1
last_validated_at: 2026-02-03
version: "1.0"
---

# Student App Architecture

> **Status:** Production Ready  
> **Platforms:** Web, Android, iOS (tablet-first)

## Technology Stack

- **Framework:** Flutter 3.19+
- **Language:** Dart
- **State Management:** Riverpod (ONLY - no Provider/BLoC)
- **Local Database:** Drift (SQLite)
- **Backend:** Supabase
- **Sync Strategy:** Offline-first with queue-based sync

## Core Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      UI LAYER                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Screens   │  │   Widgets   │  │  Question   │         │
│  │             │  │             │  │   Widgets   │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
└─────────┼────────────────┼────────────────┼─────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────┐
│                    STATE LAYER (Riverpod)                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Providers  │  │  Notifiers  │  │   States    │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
└─────────┼────────────────┼────────────────┼─────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────┐
│                   REPOSITORY LAYER                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Domain    │  │    Skill    │  │  Question   │         │
│  │    Repo     │  │    Repo     │  │    Repo     │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
└─────────┼────────────────┼────────────────┼─────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATA LAYER                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Drift (SQLite) - Local DB              │   │
│  └──────────────────────┬──────────────────────────────┘   │
│                         │                                    │
│  ┌──────────────────────▼──────────────────────────────┐   │
│  │                  Sync Service                        │   │
│  │   ┌─────────┐    ┌─────────┐    ┌─────────────┐    │   │
│  │   │ Outbox  │    │  Pull   │    │    Push     │    │   │
│  │   │ Queue   │    │  Sync   │    │    Sync     │    │   │
│  │   └─────────┘    └─────────┘    └─────────────┘    │   │
│  └──────────────────────┬──────────────────────────────┘   │
│                         │                                    │
│  ┌──────────────────────▼──────────────────────────────┐   │
│  │                 Supabase Client                      │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
student-app/
├── lib/
│   ├── src/
│   │   ├── core/
│   │   │   ├── config/env.dart      # Environment accessor
│   │   │   ├── database/            # Drift tables
│   │   │   └── sync/                # Sync service
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── domains/
│   │   │   ├── skills/
│   │   │   ├── practice/            # Question flow
│   │   │   └── progress/
│   │   └── widgets/
│   │       └── questions/           # Question type widgets
│   └── main.dart
├── test/                            # Unit & widget tests
└── pubspec.yaml
```

## Offline-First Pattern

### Local Writes First

```dart
// Repository always writes locally first
Future<void> submitAttempt(Attempt attempt) async {
  // 1. Write to local Drift DB
  await database.into(database.attempts).insert(attempt);
  
  // 2. Queue for sync (outbox pattern)
  await database.into(database.outbox).insert(
    OutboxEntry(
      tableName: 'attempts',
      action: 'INSERT',
      recordId: attempt.id,
      payload: jsonEncode(attempt.toJson()),
    ),
  );
  
  // 3. Trigger background sync
  ref.read(syncServiceProvider.notifier).push();
}
```

### Sync Service

```dart
class SyncService extends StateNotifier<SyncState> {
  // Push: Upload outbox items to Supabase
  Future<void> push() async {
    final items = await database.select(database.outbox).get();
    for (final item in items) {
      await supabase.from(item.tableName).upsert(item.payload);
      await database.delete(database.outbox).eq('id', item.id);
    }
  }
  
  // Pull: Download changes since last sync
  Future<void> pull() async {
    final lastSync = await getLastSyncTime();
    final domains = await supabase
        .from('domains')
        .select()
        .gt('updated_at', lastSync.toIso8601String());
    // Upsert to local DB...
  }
}
```

## Question Widget System

Each question type has a dedicated widget:

| Type | Widget | Description |
|------|--------|-------------|
| `multiple_choice` | `McqSingleWidget` | Single correct answer |
| `mcq_multi` | `McqMultiWidget` | Multiple correct answers |
| `boolean` | `BooleanWidget` | True/False |
| `text_input` | `TextInputWidget` | Free text entry |
| `reorder_steps` | `ReorderStepsWidget` | Drag-and-drop ordering |

See `student-app/question-widgets.md` for implementation details.

## Environment Configuration

```dart
// lib/src/core/config/env.dart
class Env {
  static String get supabaseUrl => 
    const String.fromEnvironment('SUPABASE_URL');
  static String get supabaseAnonKey => 
    const String.fromEnvironment('SUPABASE_ANON_KEY');
  
  static void validate() {
    if (supabaseUrl.isEmpty) throw Exception('SUPABASE_URL required');
    if (supabaseAnonKey.isEmpty) throw Exception('SUPABASE_ANON_KEY required');
  }
}
```

## Deployment

```powershell
# Build for web
flutter build web --dart-define=SUPABASE_URL=xxx --dart-define=SUPABASE_ANON_KEY=xxx

# Deploy to Cloudflare Pages
wrangler pages deploy build/web --project-name=questerix-student
```
