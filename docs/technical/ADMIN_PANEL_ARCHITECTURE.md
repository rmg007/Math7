---
title: "Admin Panel Architecture"
app_scope: admin-panel
doc_type: architecture
complexity: high
priority: high
status: active
summary: "Feature-first architecture patterns, Supabase integration, and multi-tenant state management for the React Admin Panel."
tags:
  - react
  - architecture
  - supabase
  - multi-tenant
  - shadcn
related_files:
  - "infrastructure/deployment-pipeline.md"
  - "security/rls-policies.md"
last_validated_by: antigravity-agent-v1
last_validated_at: 2026-02-03
version: "1.0"
---

# Admin Panel Architecture

> **Status:** Production Ready  
> **Deployed:** https://questerix-admin.pages.dev

## Technology Stack

- **Framework:** React 18 + Vite
- **Language:** TypeScript (strict mode)
- **UI:** Shadcn/UI + Tailwind CSS
- **State:** React Query v5 (server state) + React Context (UI state)
- **Backend:** Supabase (Postgres + Auth + RLS)

## Feature-First Directory Structure

```
admin-panel/
├── src/
│   ├── features/
│   │   ├── auth/           # Authentication feature
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── api/
│   │   ├── domains/        # Domain management
│   │   ├── skills/         # Skill management
│   │   ├── questions/      # Question management
│   │   └── dashboard/      # Dashboard feature
│   ├── components/         # Shared UI components
│   │   └── ui/            # Shadcn components
│   ├── lib/               # Utilities
│   │   └── supabase.ts    # Supabase client
│   ├── config/
│   │   └── env.ts         # Environment accessor
│   └── App.tsx
├── tests/                 # Playwright E2E tests
└── wrangler.toml         # Cloudflare config
```

## Key Patterns

### Supabase Integration

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import { env } from '@/config/env';

export const supabase = createClient(
  env.supabaseUrl,
  env.supabaseAnonKey
);
```

### React Query for Data Fetching

```typescript
// features/domains/hooks/useDomains.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useDomains() {
  return useQuery({
    queryKey: ['domains'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('domains')
        .select('*')
        .is('deleted_at', null)
        .order('sort_order');
      
      if (error) throw error;
      return data;
    },
  });
}
```

### Multi-Tenant State Management

The Admin Panel supports multi-tenant operation via `app_id` context:

```typescript
// Context for current app selection
const AppContext = createContext<AppContextType | null>(null);

// All queries filter by app_id
const { data } = await supabase
  .from('domains')
  .select('*')
  .eq('app_id', currentAppId);
```

## Authentication Flow

1. User navigates to `/login`
2. Supabase Auth handles email/password or OAuth
3. Session stored in localStorage
4. `AuthGuard` component protects routes
5. RLS policies enforce admin-only access on backend

## Key Features

| Feature | Route | Description |
|---------|-------|-------------|
| Dashboard | `/` | Overview metrics and quick actions |
| Domains | `/domains` | CRUD for learning domains |
| Skills | `/skills` | CRUD for skills within domains |
| Questions | `/questions` | Question editor with bulk import |
| Settings | `/settings` | App configuration |

## Deployment

Deployed to Cloudflare Pages via `wrangler`:

```bash
cd admin-panel
npm run build
wrangler pages deploy dist --project-name=questerix-admin
```

## Environment Variables

Required in `.env.local`:

```bash
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
VITE_APP_VERSION=1.0.0
```

See `docs/DEPLOYMENT_PIPELINE.md` for full configuration.
