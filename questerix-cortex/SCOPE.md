## Cortex v2 Scope Boundaries

### Graph Coverage

- **Covered**: admin-panel/src/ (~184 files)
- **Not covered**: questerix-cortex/, supabase/, `scripts/`, docs/
- **Not covered**: External dependencies (react, @supabase/supabase-js, etc.)

### E2E Test Coverage

- **Convention-mapped**: ~26-32 of 64 E2E test files
- **Not mapped**: Cross-feature tests, regression tests, infrastructure tests
- **Fallback**: Full suite for Tier C changes

### Limitations

- New E2E test files require a full `npm run health` scan to be mapped
- Incremental delta scan only covers admin-panel/src/ — test directory changes aren't detected
- Graph is file-level, not line-level — moving a function within a file isn't tracked
