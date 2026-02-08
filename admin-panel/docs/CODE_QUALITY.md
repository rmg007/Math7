# Code Quality Guide

## Overview

This project uses automated code quality tools to catch issues before they reach CI/CD or production. This guide explains how to work with these tools.

## Tools

### ESLint
- **Lints** TypeScript and React code for common errors
- **Runs** automatically on pre-commit and in CI
-  **Configuration**: `.eslintrc.cjs`

### TypeScript Compiler
- **Type-checks** all code
- **Runs** on pre-commit and in CI
- **Configuration**: `tsconfig.json`

### Prettier
- **Formats** code consistently
- **Runs** automatically on save (VS Code) and pre-commit
- **Configuration**: `.prettierrc`

### Pre-commit Hooks
- **Runs** linting and formatting automatically before each commit
- **Powered by**: Husky + lint-staged
- **Blocks** commits with errors

## Local Workflow

### Running Checks Manually

```bash
# Lint all files
npm run lint

# Lint and auto-fix issues
npm run lint:fix

# Type check
npm run typecheck

# Format code
npm run format
```

### Pre-commit Hook Behavior

When you commit code, the hook automatically:
1. Lints changed `.ts` and `.tsx` files (with auto-fix)
2. Formats changed files
3. Runs type checking on the entire codebase
4. **Blocks the commit** if any errors remain

### VS Code Integration

If you're using VS Code with the workspace settings:
- **Format on Save**: Code is auto-formatted when you save
- **ESLint Auto-fix**: ESLint errors are fixed on save
- **Inline Errors**: See linting and type errors as you type

## Common Issues & Fixes

### Issue: `any` Type Usage

**Problem**:
```typescript
const items = data.map((item: any) => item.str); // ❌
```

**Solution**:
```typescript
interface Item {
  str: string;
}
const items = data.map((item: Item) => item.str); // ✅
```

### Issue: Unused Variables

**Problem**:
```typescript
const unusedVar = getValue(); // ❌
```

**Solutions**:
```typescript
// Option 1: Remove if truly unused
// (delete the line)

// Option 2: Prefix with _ if intentionally unused
const _unusedVar = getValue(); // ✅
```

### Issue: Non-null Assertion Overuse

**Problem**:
```typescript
const value = obj!.property!.value!; // ❌
```

**Solution**:
```typescript
// Use optional chaining and nullish coalescing
const value = obj?.property?.value ?? defaultValue; // ✅

// Or proper type guards
if (obj?.property?.value) {
  const value = obj.property.value; // ✅
}
```

### Issue: Yoda Conditions

**Problem**:
```typescript
if (null === value) { } // ❌
```

**Solution**:
```typescript
if (value === null) { } // ✅
```

## Bypassing Pre-commit (Emergency Only)

```bash
# Skip pre-commit hooks (use sparingly!)
git commit --no-verify
```

**When to use**: Only in emergencies, and plan to fix issues immediately after.

## CI/CD Quality Gates

The CI pipeline enforces:
- ✅ Linting (`npm run lint`)
- ✅ Type checking (`npm run typecheck`)
- ✅ Unit tests
- ✅ Architecture tests
- ✅ Build success

**All must pass** for the build to succeed.

## Getting Help

- **Linting errors**: Read the error message - it usually explains the fix
- **Type errors**: Check TypeScript documentation
- **Pre-commit issues**: Run `npm run lint:fix` and `npm run typecheck` manually to debug
