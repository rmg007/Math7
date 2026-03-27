# 🚀 Questerix (Core Repo) Quickstart

Welcome to the **Questerix Core** repository, which houses the Admin Panel UI, backend edge functions, Supabase DB definitions, and monorepo orchestration logic.

## 📦 Stack

- **Frontend:** React 18, Vite, Tailwind CSS, shadcn/ui
- **Backend:** Supabase, Postgres, Deno Edge Functions
- **Orchestration:** PowerShell scripts

## 🛠️ Setup & Run

1. **Install Dependencies:**

   ```powershell
   cd admin-panel
   npm install --legacy-peer-deps
   ```

2. **Start Local Database (Supabase):**

   ```powershell
   supabase start
   ```

3. **Start Admin Panel App:**
   ```powershell
   cd admin-panel
   npm run dev
   ```

## 🧑‍💻 Useful Commands

- `npm run typecheck` - Verify TypeScript typings across the admin panel.
- `supabase db reset` - Wipe local database, re-apply migrations, and seed.
- `supabase gen types typescript --local > types/database.ts` - Regenerate local TS database types.

## 🧩 Deployment Orchestrator

To deploy to both platforms (Student App & Admin Panel), you can run the deployment script from the project root:

```powershell
.\scripts\deploy\deploy-all.ps1
```

## 💡 Quick Rules

- **No manual styling:** Use `tokens.css` via Tailwind classes.
- **Rules list:** See `AGENTS.md` for our universal AI agent rules and conventions.
