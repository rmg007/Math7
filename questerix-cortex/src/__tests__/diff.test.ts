/**
 * Regression tests for cortex_diff MCP tool
 *
 * @module diff.test
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { handleDiff } from "../mcp-server/tools/diff";

// Mock child_process execSync
vi.mock("child_process", () => ({
  execSync: vi.fn(),
}));

import { execSync } from "child_process";

// Mock better-sqlite3 Database
interface MockDb {
  prepare: ReturnType<typeof vi.fn>;
}

function createMockDb(fragilityData: Record<string, number> = {}): MockDb {
  return {
    prepare: vi.fn((sql: string) => {
      // Handle scan_meta query
      if (sql.includes("scan_meta")) {
        return {
          get: vi.fn(() => ({ value: "abc123" })),
        };
      }
      // Handle fragility query
      if (sql.includes("fragility")) {
        return {
          get: vi.fn((filePath: string) => {
            const index = fragilityData[filePath] ?? 0;
            return { fragility_index: index };
          }),
        };
      }
      return { get: vi.fn(), all: vi.fn() };
    }),
  };
}

describe("handleDiff", () => {
  const repoRoot = "/repo";
  let mockDb: MockDb;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb = createMockDb({
      "/repo/admin-panel/src/features/auth/hooks/useAuth.ts": 0.4,
      "/repo/admin-panel/src/features/users/api.ts": 0.2,
      "/repo/admin-panel/src/components/Button.tsx": 0.1,
    });
  });

  it("should return empty result when no last_scan_commit exists", () => {
    // Override mock to return no scan commit
    mockDb = {
      prepare: vi.fn((sql: string) => {
        if (sql.includes("scan_meta")) {
          return { get: vi.fn(() => undefined) };
        }
        return { get: vi.fn(), all: vi.fn() };
      }),
    };

    const result = handleDiff("last_session", repoRoot, mockDb as any);

    expect(result.summary.total).toBe(0);
    expect(result.added).toHaveLength(0);
    expect(result.modified).toHaveLength(0);
    expect(result.deleted).toHaveLength(0);
  });

  it("should correctly parse added, modified, and deleted files", () => {
    const mockGitOutput = `A\tadmin-panel/src/features/auth/hooks/useAuth.ts
M\tadmin-panel/src/features/users/api.ts
D\tadmin-panel/src/old/deprecated.ts`;

    (execSync as ReturnType<typeof vi.fn>).mockReturnValue(mockGitOutput);

    const result = handleDiff("abc123", repoRoot, mockDb as any);

    expect(result.added).toHaveLength(1);
    expect(result.added[0].path).toBe(
      "admin-panel/src/features/auth/hooks/useAuth.ts");
    expect(result.added[0].changeType).toBe("added");

    expect(result.modified).toHaveLength(1);
    expect(result.modified[0].path).toBe(
      "admin-panel/src/features/users/api.ts");
    expect(result.modified[0].changeType).toBe("modified");

    expect(result.deleted).toHaveLength(1);
    expect(result.deleted[0].path).toBe(
      "admin-panel/src/old/deprecated.ts");
    expect(result.deleted[0].changeType).toBe("deleted");
  });

  it("should classify files with correct tier based on fragility", () => {
    const mockGitOutput = `A\tadmin-panel/src/features/auth/hooks/useAuth.ts
M\tadmin-panel/src/features/users/api.ts`;

    (execSync as ReturnType<typeof vi.fn>).mockReturnValue(mockGitOutput);

    const result = handleDiff("abc123", repoRoot, mockDb as any);

    // Verify files have tier and fragility properties
    expect(result.added[0]).toHaveProperty("tier");
    expect(result.added[0]).toHaveProperty("fragilityIndex");
    expect(result.modified[0]).toHaveProperty("tier");
    expect(result.modified[0]).toHaveProperty("fragilityIndex");
    
    // Verify tier is one of the valid values
    expect(["A", "B", "C"]).toContain(result.added[0].tier);
    expect(["A", "B", "C"]).toContain(result.modified[0].tier);
  });

  it("should correctly identify structural file changes as Tier C", () => {
    const mockGitOutput = `M\tadmin-panel/src/App.tsx`;

    (execSync as ReturnType<typeof vi.fn>).mockReturnValue(mockGitOutput);

    const result = handleDiff("abc123", repoRoot, mockDb as any);

    expect(result.modified[0].tier).toBe("C");
    expect(result.riskSummary.structuralChanges).toBe(true);
  });

  it("should calculate risk summary correctly", () => {
    // Create mock with high fragility to trigger Tier C
    const highFragilityDb = createMockDb({
      "/repo/admin-panel/src/high/fragile.ts": 0.6,
      "/repo/admin-panel/src/medium/fragile.ts": 0.4,
      "/repo/admin-panel/src/low/fragile.ts": 0.1,
    });

    const mockGitOutput = `A\tadmin-panel/src/high/fragile.ts
M\tadmin-panel/src/medium/fragile.ts
A\tadmin-panel/src/low/fragile.ts`;

    (execSync as ReturnType<typeof vi.fn>).mockReturnValue(mockGitOutput);

    const result = handleDiff("abc123", repoRoot, highFragilityDb as any);

    // Verify risk summary structure exists
    expect(result).toHaveProperty("riskSummary");
    expect(result.riskSummary).toHaveProperty("highRisk");
    expect(result.riskSummary).toHaveProperty("mediumRisk");
    expect(result.riskSummary).toHaveProperty("lowRisk");
    expect(result.riskSummary).toHaveProperty("structuralChanges");
    
    // Total should equal number of files (3)
    const totalRisk = result.riskSummary.highRisk + result.riskSummary.mediumRisk + result.riskSummary.lowRisk;
    expect(totalRisk).toBe(3);
  });

  it("should handle 24h mode using git log", () => {
    const mockGitOutput = `admin-panel/src/features/auth/hooks/useAuth.ts
admin-panel/src/features/users/api.ts`;

    (execSync as ReturnType<typeof vi.fn>).mockReturnValue(mockGitOutput);

    const result = handleDiff("24h", repoRoot, mockDb as any);

    expect(result.summary.total).toBe(2);
    expect(result.modified).toHaveLength(2);
    expect(result.added).toHaveLength(0);
    expect(result.deleted).toHaveLength(0);
  });

  it("should throw error when git command fails", () => {
    (execSync as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw new Error("Git error");
    });

    expect(() => handleDiff("abc123", repoRoot, mockDb as any)).toThrow(
      "Git command failed",
    );
  });

  it("should handle empty git output", () => {
    (execSync as ReturnType<typeof vi.fn>).mockReturnValue("");

    const result = handleDiff("abc123", repoRoot, mockDb as any);

    expect(result.summary.total).toBe(0);
    expect(result.summary.added).toBe(0);
    expect(result.summary.modified).toBe(0);
    expect(result.summary.deleted).toBe(0);
  });

  it("should ignore invalid lines in git output", () => {
    const mockGitOutput = `A\tadmin-panel/src/valid.ts
INVALID_LINE
M\tadmin-panel/src/another.ts
`;

    (execSync as ReturnType<typeof vi.fn>).mockReturnValue(mockGitOutput);

    const result = handleDiff("abc123", repoRoot, mockDb as any);

    expect(result.summary.total).toBe(2);
    expect(result.added).toHaveLength(1);
    expect(result.modified).toHaveLength(1);
  });
});

describe("DiffResult structure", () => {
  it("should return files with tier and fragilityIndex properties", () => {
    const mockDb = createMockDb({
      "/repo/test.ts": 0.5,
    });

    const mockGitOutput = "A\ttest.ts";
    (execSync as ReturnType<typeof vi.fn>).mockReturnValue(mockGitOutput);

    const result = handleDiff("abc123", "/repo", mockDb as any);

    expect(result.added[0]).toHaveProperty("path");
    expect(result.added[0]).toHaveProperty("tier");
    expect(result.added[0]).toHaveProperty("fragilityIndex");
    expect(result.added[0]).toHaveProperty("changeType");
  });
});
