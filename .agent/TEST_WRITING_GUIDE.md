# Test Writing Quick Reference

## 🎯 Before Writing Any Test

1. **View the implementation file** - Don't assume, verify
2. **Trace all dependencies** - Supabase, APIs, services, utilities
3. **Check for schemas** - Zod, Yup, TypeScript interfaces
4. **Identify error paths** - What can fail? How?

---

## ✅ Test Writing Checklist

### Setup Phase

- [ ] Import all necessary testing utilities
- [ ] Mock ALL external dependencies (complete API surface)
- [ ] Create schema-aware mock data
- [ ] Set up cleanup handlers (`afterEach`, `beforeEach`)

### Test Phase

- [ ] Test happy path with realistic data
- [ ] Test error paths (network, validation, auth)
- [ ] Test edge cases (null, undefined, empty, large)
- [ ] Verify error messages match actual implementation
- [ ] Check type safety (no `as any`)

### Cleanup Phase

- [ ] Clear mocks between tests (`vi.clearAllMocks()`)
- [ ] Clean up resources (timers, connections, jobs)
- [ ] Reset state to prevent test pollution

---

## 🚫 Common Mistakes to Avoid

### ❌ Incomplete Mocks

```typescript
// WRONG - Missing auth and from
vi.mock("@/lib/supabase", () => ({
  supabase: {
    rpc: vi.fn(),
  },
}));

// CORRECT - Complete API surface
vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: { getUser: vi.fn() },
    rpc: vi.fn(),
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ error: null }),
    })),
  },
}));
```

### ❌ Schema-Violating Mocks

```typescript
// WRONG - Missing required fields
const mockQuestion = {
  text: "Q1",
  type: "mcq",
};

// CORRECT - Satisfies Zod schema
const mockQuestion = {
  text: "Q1",
  question_type: "mcq" as const,
  difficulty: "medium" as const,
  metadata: {
    options: ["A", "B"],
    correct_answer: "A",
    explanation: "Because...",
  },
};
```

### ❌ Assuming Error Messages

```typescript
// WRONG - Assumed message
expect(mockToast).toHaveBeenCalledWith({
  description: "Invalid CSV format",
});

// CORRECT - Actual error message
expect(mockToast).toHaveBeenCalledWith({
  description: "Parse error",
});
```

### ❌ Wrong Data Types

```typescript
// WRONG - Boolean uses array
expect(question).toMatchObject({
  type: "boolean",
  options: [{ text: "True" }],
});

// CORRECT - Boolean uses null
expect(question).toMatchObject({
  type: "boolean",
  options: null,
});
```

---

## 💡 Best Practices

### 1. Mock Factories

```typescript
const createMockQuestion = (overrides = {}) => ({
  text: "Default question",
  question_type: "mcq" as const,
  difficulty: "medium" as const,
  metadata: {
    options: ["A", "B"],
    correct_answer: "A",
    explanation: "Explanation",
  },
  ...overrides,
});

// Usage
const mockQuestion = createMockQuestion({ difficulty: "hard" });
```

### 2. Complete API Mocking

```typescript
// Mock the entire API surface
vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      }),
    },
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ error: null }),
      update: vi.fn().mockResolvedValue({ error: null }),
      delete: vi.fn().mockResolvedValue({ error: null }),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: {}, error: null }),
    })),
  },
}));
```

### 3. Error Path Testing

```typescript
it("should handle API errors", async () => {
  // Mock the error
  vi.mocked(generateQuestions).mockRejectedValue(
    new Error("API rate limit exceeded"),
  );

  const { result } = renderHook(() => useAIGenerator());

  await act(async () => {
    await result.current.generate(params);
  });

  // Verify error handling
  expect(mockToast).toHaveBeenCalledWith({
    title: "Generation Failed",
    description: "API rate limit exceeded",
    variant: "destructive",
  });
});
```

### 4. Cleanup Handlers

```typescript
describe("MyComponent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // Tests here
});
```

---

## 🔍 Debugging Failed Tests

### 1. Check Mock Structure

```bash
# View implementation to verify API calls
code admin-panel/src/hooks/use-ai-generator.ts

# Check what's actually being called
console.log(vi.mocked(generateQuestions).mock.calls);
```

### 2. Verify Schema Compliance

```typescript
// Add schema validation to your test
import { AIQuestionSchema } from "@/hooks/use-ai-generator";

const mockQuestion = {
  /* your mock */
};
const result = AIQuestionSchema.safeParse(mockQuestion);
console.log(result.success, result.error);
```

### 3. Check Actual Error Messages

```typescript
// Trigger the actual error to see the message
try {
  Papa.parse(file, {
    error: (error) => {
      console.log("Actual error message:", error.message);
    },
  });
} catch (err) {
  console.log("Actual error:", err.message);
}
```

---

## 📋 Running Tests

### Single Test File

```bash
npx vitest src/__tests__/hooks/use-ai-generator.test.tsx --run
```

### Watch Mode

```bash
npx vitest --watch
```

### With Coverage

```bash
npm run test -- --coverage
```

### All Tests (Parallel)

```powershell
.\scripts\run-all-tests.ps1
```

---

## 🎯 Quick Wins

1. **Always view implementation first** - 5 minutes saves 30 minutes of debugging
2. **Use mock factories** - Reusable, schema-compliant, maintainable
3. **Test error paths** - Most bugs are in error handling
4. **Clean up resources** - Prevents flaky tests
5. **Verify error messages** - Don't assume, check actual errors

---

**Last Updated**: 2026-02-13  
**See Also**: `.agent/learnings/test-implementation-feb-13-2026.md`
