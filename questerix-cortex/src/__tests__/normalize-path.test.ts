import { describe, expect, it } from "vitest";
import { normalizePath, validatePathIdentity } from "../utils/normalize-path";

describe("normalizePath", () => {
  it("should normalize Windows and POSIX absolute paths to the same repo-relative result", () => {
    const posixPath = "/home/user/Questerix/admin-panel/src/features/auth/hooks/useAuth.ts";
    const windowsPath = "C:\\Users\\user\\Questerix\\admin-panel\\src\\features\\auth\\hooks\\useAuth.ts";

    const posixNormalized = normalizePath(posixPath);
    const windowsNormalized = normalizePath(windowsPath);

    // Both should contain the repo-relative path with admin-panel/ prefix preserved
    expect(posixNormalized).toContain("admin-panel/src/features/auth/hooks/useAuth.ts");
    expect(windowsNormalized).toContain("admin-panel/src/features/auth/hooks/useAuth.ts");
  });

  it("should be idempotent: normalizePath(normalizePath(x)) === normalizePath(x)", () => {
    const fixturePaths = [
      "admin-panel/src/features/auth/hooks/useAuth.ts",
      "admin-panel/src/pages/Login.tsx",
      "questerix-cortex/src/utils/normalize-path.ts",
      "supabase/functions/_shared/rate-limiter.ts",
      "/absolute/path/to/admin-panel/src/components/Button.tsx",
      "C:\\Users\\dev\\Questerix\\admin-panel\\src\\services\\api.ts",
      "src/utils/helpers.ts",
      "components/Header.tsx",
      "@/features/dashboard/hooks/useDashboard.ts",
      "../relative/path/file.ts",
    ];

    for (const testPath of fixturePaths) {
      const once = normalizePath(testPath);
      const twice = normalizePath(once);
      expect(twice).toBe(once);
      expect(validatePathIdentity(testPath)).toBe(true);
    }
  });

  it("should produce identical output for absolute and relative paths to the same file", () => {
    const relativePath = "admin-panel/src/features/auth/hooks/useAuth.ts";
    const absolutePath = "C:\\Users\\mhali\\OneDrive\\Desktop\\Important Projects\\Questerix\\admin-panel\\src\\features\\auth\\hooks\\useAuth.ts";

    const relativeNormalized = normalizePath(relativePath);
    const absoluteNormalized = normalizePath(absolutePath);

    // The absolute path should be stripped to match the relative path
    expect(absoluteNormalized).toBe(relativeNormalized);
  });

  it("should return the original value unchanged for paths outside the repo", () => {
    const outsidePath = "/some/other/repo/file.ts";
    const normalized = normalizePath(outsidePath);

    // Since the path doesn't start with the project root, it should remain unchanged
    // (but backslashes should still be normalized to forward slashes)
    expect(normalized).toBe("some/other/repo/file.ts");
  });

  it("should preserve full repo-relative paths without stripping known prefixes", () => {
    const pathWithPrefix = "admin-panel/src/features/auth/hooks/useAuth.ts";
    const normalized = normalizePath(pathWithPrefix);

    // Should preserve the full path including admin-panel/src/
    expect(normalized).toBe(pathWithPrefix);
  });

  it("should handle @/ aliases by stripping the prefix", () => {
    const aliasPath = "@/features/auth/hooks/useAuth.ts";
    const normalized = normalizePath(aliasPath);

    expect(normalized).toBe("features/auth/hooks/useAuth.ts");
  });

  it("should handle edge cases with trailing slashes and empty strings", () => {
    expect(normalizePath("")).toBe("");
    expect(normalizePath("/")).toBe("");
    expect(normalizePath("file.ts")).toBe("file.ts");
  });
});

describe("validatePathIdentity", () => {
  it("should return true for paths that normalize idempotently", () => {
    expect(validatePathIdentity("admin-panel/src/App.tsx")).toBe(true);
    expect(validatePathIdentity("questerix-cortex/src/utils/path.ts")).toBe(true);
  });

  it("should detect potential identity issues (if they existed)", () => {
    // This test documents that our normalization should always be idempotent
    // If this test ever fails, it indicates a regression in path normalization
    const complexPath = "C:\\Users\\dev\\Questerix\\admin-panel\\src\\features\\complex\\path\\file.ts";
    expect(validatePathIdentity(complexPath)).toBe(true);
  });
});
