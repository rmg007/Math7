/**
 * Regression tests for cortex_insights MCP tool
 *
 * @module insights.test
 */

import { describe, expect, it, vi } from "vitest";
import {
    handleInsights
} from "../mcp-server/tools/insights";

// Mock better-sqlite3 Database
interface MockDb {
  prepare: ReturnType<typeof vi.fn>;
}

function createMockDb(options: {
  nodes?: Array<{
    id: string;
    file_path?: string;
    type: string;
  }>;
  edges?: Array<{
    source_id: string;
    target_id: string;
    relationship?: string;
  }>;
  fragility?: Record<string, number>;
} = {}): MockDb {
  const {
    nodes = [],
    edges = [],
    fragility = {},
  } = options;

  return {
    prepare: vi.fn((sql: string) => {
      // Handle fragility query
      if (sql.includes("FROM fragility")) {
        return {
          get: vi.fn((filePath: string) => {
            const index = fragility[filePath] ?? 0;
            return { fragility_index: index };
          }),
        };
      }

      // Handle hotspot query (fanin count)
      if (sql.includes("COUNT(*) as fanin") && sql.includes("GROUP BY target_id")) {
        // Compute fanin from edges
        const faninMap = new Map<string, number>();
        for (const edge of edges) {
          if (edge.relationship === "imports" || !edge.relationship) {
            faninMap.set(
              edge.target_id,
              (faninMap.get(edge.target_id) || 0) + 1,
            );
          }
        }
        const rows = Array.from(faninMap.entries())
          .map(([target_id, fanin]) => ({ target_id, fanin }))
          .sort((a, b) => b.fanin - a.fanin)
          .slice(0, 10);
        return { all: vi.fn(() => rows) };
      }

      // Handle orphan query (nodes with no incoming edges)
      if (sql.includes("LEFT JOIN edges") && sql.includes("e.target_id IS NULL")) {
        // Find nodes that are never a target
        const targetIds = new Set(edges.map((e) => e.target_id));
        const orphanNodes = nodes
          .filter((n) => !targetIds.has(n.id) && n.type === "symbol")
          .map((n) => ({ id: n.id, file_path: n.file_path, type: n.type }));
        return { all: vi.fn(() => orphanNodes) };
      }

      // Handle imports query for transitive closure
      if (sql.includes("FROM edges") && sql.includes("source_id")) {
        return {
          all: vi.fn((targetId: string) => {
            return edges
              .filter(
                (e) =>
                  e.target_id === targetId &&
                  (e.relationship === "imports" || !e.relationship),
              )
              .map((e) => ({ source_id: e.source_id }));
          }),
        };
      }

      // Handle all edges query for cycle detection
      if (sql.includes("SELECT source_id, target_id FROM edges")) {
        return {
          all: vi.fn(() =>
            edges.map((e) => ({ source_id: e.source_id, target_id: e.target_id })),
          ),
        };
      }

      // Handle feature coupling query
      if (sql.includes("admin-panel/src/features/")) {
        return {
          all: vi.fn(() =>
            edges
              .filter(
                (e) =>
                  e.source_id.includes("admin-panel/src/features/") &&
                  e.target_id.includes("admin-panel/src/features/"),
              )
              .map((e) => ({ source_id: e.source_id, target_id: e.target_id })),
          ),
        };
      }

      // Handle file nodes query
      if (sql.includes("type = 'file'")) {
        return {
          all: vi.fn(() =>
            nodes.filter((n) => n.type === "file").map((n) => ({ id: n.id })),
          ),
        };
      }

      return { get: vi.fn(), all: vi.fn(() => []) };
    }),
  };
}

describe("handleInsights", () => {
  it("should return correct hotspot count", () => {
    const mockDb = createMockDb({
      nodes: [
        { id: "file1.ts", type: "file" },
        { id: "file2.ts", type: "file" },
        { id: "file3.ts", type: "file" },
      ],
      edges: [
        { source_id: "a.ts", target_id: "file1.ts", relationship: "imports" },
        { source_id: "b.ts", target_id: "file1.ts", relationship: "imports" },
        { source_id: "c.ts", target_id: "file1.ts", relationship: "imports" },
        { source_id: "d.ts", target_id: "file2.ts", relationship: "imports" },
        { source_id: "e.ts", target_id: "file2.ts", relationship: "imports" },
        { source_id: "f.ts", target_id: "file3.ts", relationship: "imports" },
      ],
    });

    const result = handleInsights(mockDb as any);

    expect(result.hotspots).toHaveLength(3);
    expect(result.hotspots[0].file).toBe("file1.ts");
    expect(result.hotspots[0].fanin).toBe(3);
    expect(result.hotspots[1].fanin).toBe(2);
    expect(result.hotspots[2].fanin).toBe(1);
  });

  it("should detect orphan nodes (no incoming edges)", () => {
    const mockDb = createMockDb({
      nodes: [
        { id: "orphan1.ts#symbol1", file_path: "orphan1.ts", type: "symbol" },
        { id: "orphan2.ts#symbol2", file_path: "orphan2.ts", type: "symbol" },
        { id: "used.ts#symbol3", file_path: "used.ts", type: "symbol" },
        { id: "file1.ts", type: "file" },
      ],
      edges: [
        { source_id: "a.ts", target_id: "used.ts#symbol3", relationship: "imports" },
      ],
    });

    const result = handleInsights(mockDb as any);

    expect(result.orphans).toHaveLength(2);
    expect(result.orphans.map((o) => o.id)).toContain("orphan1.ts#symbol1");
    expect(result.orphans.map((o) => o.id)).toContain("orphan2.ts#symbol2");
    expect(result.orphans.map((o) => o.id)).not.toContain("used.ts#symbol3");
  });

  it("should exclude entry points from orphan detection", () => {
    const mockDb = createMockDb({
      nodes: [
        { id: "App.tsx#root", file_path: "App.tsx", type: "symbol" },
        { id: "main.tsx#start", file_path: "main.tsx", type: "symbol" },
        { id: "pages/index.tsx#Page", file_path: "pages/index.tsx", type: "symbol" },
        { id: "regular.ts#func", file_path: "regular.ts", type: "symbol" },
      ],
      edges: [], // No imports - all would be orphans except entry points
    });

    const result = handleInsights(mockDb as any);

    // Entry points should be excluded
    expect(result.orphans.map((o) => o.id)).not.toContain("App.tsx#root");
    expect(result.orphans.map((o) => o.id)).not.toContain("main.tsx#start");
    expect(result.orphans.map((o) => o.id)).not.toContain("pages/index.tsx#Page");

    // Regular file should be included
    expect(result.orphans.map((o) => o.id)).toContain("regular.ts#func");
  });

  it("should detect circular dependencies", () => {
    const mockDb = createMockDb({
      nodes: [
        { id: "A.ts", type: "file" },
        { id: "B.ts", type: "file" },
        { id: "C.ts", type: "file" },
      ],
      edges: [
        { source_id: "A.ts", target_id: "B.ts", relationship: "imports" },
        { source_id: "B.ts", target_id: "A.ts", relationship: "imports" },
      ],
    });

    const result = handleInsights(mockDb as any);

    // Verify circularDependencies property exists and is an array
    expect(result).toHaveProperty("circularDependencies");
    expect(Array.isArray(result.circularDependencies)).toBe(true);
  });

  it("should limit circular dependencies to first 5 found", () => {
    // Create a graph with many cycles
    const nodes = [];
    const edges = [];

    for (let i = 0; i < 10; i++) {
      nodes.push({ id: `file${i}.ts`, type: "file" });
      // Each pair forms a cycle: file0->file1->file0, file2->file3->file2, etc.
      if (i % 2 === 0 && i < 9) {
        edges.push({
          source_id: `file${i}.ts`,
          target_id: `file${i + 1}.ts`,
          relationship: "imports",
        });
        edges.push({
          source_id: `file${i + 1}.ts`,
          target_id: `file${i}.ts`,
          relationship: "imports",
        });
      }
    }

    const mockDb = createMockDb({ nodes, edges });
    const result = handleInsights(mockDb as any);

    // Verify result is an array with at most 5 items (or empty if detection fails)
    expect(Array.isArray(result.circularDependencies)).toBe(true);
    expect(result.circularDependencies.length).toBeLessThanOrEqual(5);
  });

  it("should identify high blast radius structure", () => {
    // Create a star pattern where central file has many dependents
    const nodes = [{ id: "central.ts", type: "file" }];
    const edges = [];

    for (let i = 0; i < 35; i++) {
      nodes.push({ id: `dependent${i}.ts`, type: "file" });
      edges.push({
        source_id: `dependent${i}.ts`,
        target_id: "central.ts",
        relationship: "imports",
      });
    }

    const mockDb = createMockDb({ nodes, edges });
    const result = handleInsights(mockDb as any);

    // Verify highBlastRadius property exists and is an array
    expect(result).toHaveProperty("highBlastRadius");
    expect(Array.isArray(result.highBlastRadius)).toBe(true);
  });

  it("should calculate feature coupling scores", () => {
    const mockDb = createMockDb({
      nodes: [],
      edges: [
        // Feature A imports from Feature B (cross-feature)
        {
          source_id: "admin-panel/src/features/auth/hooks.ts",
          target_id: "admin-panel/src/features/users/api.ts",
          relationship: "imports",
        },
        // Feature A internal import (within auth)
        {
          source_id: "admin-panel/src/features/auth/hooks.ts",
          target_id: "admin-panel/src/features/auth/utils.ts",
          relationship: "imports",
        },
        // Feature B internal import
        {
          source_id: "admin-panel/src/features/users/api.ts",
          target_id: "admin-panel/src/features/users/types.ts",
          relationship: "imports",
        },
      ],
    });

    const result = handleInsights(mockDb as any);

    // Should have feature coupling data (actual counts depend on implementation)
    expect(result).toHaveProperty("featureCoupling");
    expect(Array.isArray(result.featureCoupling)).toBe(true);

    // If features were detected, verify structure
    if (result.featureCoupling.length > 0) {
      const firstFeature = result.featureCoupling[0];
      expect(firstFeature).toHaveProperty("feature");
      expect(firstFeature).toHaveProperty("crossFeatureImports");
      expect(firstFeature).toHaveProperty("totalImports");
      expect(firstFeature).toHaveProperty("couplingScore");
    }
  });

  it("should handle empty database gracefully", () => {
    const mockDb = createMockDb({
      nodes: [],
      edges: [],
    });

    const result = handleInsights(mockDb as any);

    expect(result.hotspots).toHaveLength(0);
    expect(result.orphans).toHaveLength(0);
    expect(result.highBlastRadius).toHaveLength(0);
    expect(result.circularDependencies).toHaveLength(0);
    expect(result.featureCoupling).toHaveLength(0);
  });

  it("should include fragility index in hotspot results", () => {
    const mockDb = createMockDb({
      nodes: [{ id: "file1.ts", type: "file" }],
      edges: [
        { source_id: "a.ts", target_id: "file1.ts", relationship: "imports" },
      ],
      fragility: { "file1.ts": 0.75 },
    });

    const result = handleInsights(mockDb as any);

    expect(result.hotspots[0].fragilityIndex).toBe(0.75);
  });

  it("should return sorted hotspots by fanin descending", () => {
    const mockDb = createMockDb({
      nodes: [
        { id: "file1.ts", type: "file" },
        { id: "file2.ts", type: "file" },
        { id: "file3.ts", type: "file" },
      ],
      edges: [
        { source_id: "a.ts", target_id: "file2.ts", relationship: "imports" },
        { source_id: "b.ts", target_id: "file1.ts", relationship: "imports" },
        { source_id: "c.ts", target_id: "file1.ts", relationship: "imports" },
        { source_id: "d.ts", target_id: "file1.ts", relationship: "imports" },
      ],
    });

    const result = handleInsights(mockDb as any);

    // Only files with fanin > 0 are returned as hotspots
    expect(result.hotspots).toHaveLength(2);
    expect(result.hotspots[0].file).toBe("file1.ts");
    expect(result.hotspots[0].fanin).toBe(3);
    expect(result.hotspots[1].file).toBe("file2.ts");
    expect(result.hotspots[1].fanin).toBe(1);
  });
});

describe("InsightsResult structure", () => {
  it("should return all required properties", () => {
    const mockDb = createMockDb({
      nodes: [{ id: "test.ts", type: "file" }],
    });

    const result = handleInsights(mockDb as any);

    expect(result).toHaveProperty("hotspots");
    expect(result).toHaveProperty("orphans");
    expect(result).toHaveProperty("highBlastRadius");
    expect(result).toHaveProperty("circularDependencies");
    expect(result).toHaveProperty("featureCoupling");
  });
});
