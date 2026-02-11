# Checkly Monitoring Integration

Autonomous production monitoring for Questerix.

## Checks

- **Uptime monitors**: Admin, Landing, Student, Supabase API, Supabase Auth
- **Playwright checks**: Admin login, CRUD pages, Landing pages
- **API health**: Supabase REST, Auth, Edge Functions

## Workflow Phases

1. Deploy monitoring config
2. Health check all services (3x retry)
3. Self-heal (redeploy failed services)
4. Auto-rollback (if self-heal fails)
5. Incident report (GitHub Issue)
6. Auto-resolve (close issues when healthy)
7. Checkly synthetic tests
8. Health report summary

## Triggers

- Push to main (when check files change)
- Every 6 hours (scheduled)
- After CI/E2E workflows complete
- Manual (workflow_dispatch)
