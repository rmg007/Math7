/**
 * Cortex Insights Tool - Graph Intelligence
 *
 * This tool provides graph analysis capabilities:
 * - Hotspots: Top 10 most-imported files (highest fanin)
 * - Orphans: Symbol nodes with 0 incoming edges
 * - High Blast Radius: Files with >30 transitive dependents
 * - Circular Dependencies: First 5 cycles found via DFS
 * - Feature Coupling Score: Cross-feature import ratio
 */

import type Database from "better-sqlite3";

export interface InsightsResult {
  hotspots: HotspotItem[];
  orphans: OrphanItem[];
  highBlastRadius: BlastRadiusItem[];
  circularDependencies: string[][];
  featureCoupling: FeatureCouplingItem[];
}

export interface HotspotItem {
  file: string;
  fanin: number;
  fragilityIndex: number;
}

export interface OrphanItem {
  id: string;
  file: string;
  type: string;
}

export interface BlastRadiusItem {
  file: string;
  transitiveDependents: number;
  fragilityIndex: number;
}

export interface FeatureCouplingItem {
  feature: string;
  crossFeatureImports: number;
  totalImports: number;
  couplingScore: number;
}

// Known entry points to exclude from orphan detection
const ENTRY_POINT_PATTERNS = [
  /App\.tsx$/,
  /main\.tsx$/,
  /index\.tsx$/,
  /index\.ts$/,
  /pages\/.*\.(tsx|ts)$/,
];

interface FaninRow {
  target_id: string;
  fanin: number;
}

interface NodeRow {
  id: string;
  file_path: string | null;
  type: string;
}

interface EdgeRow {
  source_id: string;
  target_id: string;
}

function isEntryPoint(filePath: string): boolean {
  return ENTRY_POINT_PATTERNS.some((pattern) => pattern.test(filePath));
}

function getFragilityForFile(
  db: Database.Database,
  filePath: string,
): number {
  try {
    const row = db
      .prepare(
        "SELECT fragility_index FROM fragility WHERE file_path = ?",
      )
      .get(filePath) as { fragility_index?: number } | undefined;
    return row?.fragility_index ?? 0;
  } catch {
    return 0;
  }
}

function getHotspots(db: Database.Database): HotspotItem[] {
  try {
    const rows = db
      .prepare(
        `
        SELECT target_id, COUNT(*) as fanin
        FROM edges
        WHERE relationship = 'imports'
        GROUP BY target_id
        ORDER BY fanin DESC
        LIMIT 10
      `,
      )
      .all() as FaninRow[];

    return rows.map((row) => ({
      file: row.target_id,
      fanin: row.fanin,
      fragilityIndex: getFragilityForFile(db, row.target_id),
    }));
  } catch {
    return [];
  }
}

function getOrphans(db: Database.Database): OrphanItem[] {
  try {
    // Find symbol nodes with 0 incoming edges
    const rows = db
      .prepare(
        `
        SELECT n.id, n.file_path, n.type
        FROM nodes n
        LEFT JOIN edges e ON n.id = e.target_id
        WHERE n.type = 'symbol'
        AND e.target_id IS NULL
      `,
      )
      .all() as NodeRow[];

    return rows
      .filter((row) => {
        // Exclude entry points
        const filePath = row.file_path ?? row.id.split("#")[0];
        return !isEntryPoint(filePath);
      })
      .map((row) => ({
        id: row.id,
        file: row.file_path ?? row.id.split("#")[0],
        type: row.type,
      }));
  } catch {
    return [];
  }
}

function computeTransitiveClosure(
  db: Database.Database,
  sourceId: string,
  maxDepth = 10,
): Set<string> {
  const visited = new Set<string>();
  const queue: Array<{ id: string; depth: number }> = [{ id: sourceId, depth: 0 }];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current.id) || current.depth >= maxDepth) continue;

    visited.add(current.id);

    try {
      const rows = db
        .prepare(
          `
          SELECT source_id
          FROM edges
          WHERE target_id = ? AND relationship = 'imports'
        `,
        )
        .all(current.id) as Array<{ source_id: string }>;

      for (const row of rows) {
        if (!visited.has(row.source_id)) {
          queue.push({ id: row.source_id, depth: current.depth + 1 });
        }
      }
    } catch {
      // Continue with empty results
    }
  }

  return visited;
}

function getHighBlastRadius(db: Database.Database): BlastRadiusItem[] {
  try {
    // Get all file nodes
    const fileNodes = db
      .prepare("SELECT id FROM nodes WHERE type = 'file'")
      .all() as Array<{ id: string }>;

    const highBlastItems: BlastRadiusItem[] = [];

    for (const node of fileNodes) {
      const dependents = computeTransitiveClosure(db, node.id);
      const count = dependents.size - 1; // Exclude self

      if (count > 30) {
        highBlastItems.push({
          file: node.id,
          transitiveDependents: count,
          fragilityIndex: getFragilityForFile(db, node.id),
        });
      }
    }

    return highBlastItems.sort(
      (a, b) => b.transitiveDependents - a.transitiveDependents,
    );
  } catch {
    return [];
  }
}

function findCycles(
  db: Database.Database,
  maxCycles = 5,
): string[][] {
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  // Get all edges for efficient traversal
  const edgesMap = new Map<string, string[]>();
  try {
    const rows = db
      .prepare(
        "SELECT source_id, target_id FROM edges WHERE relationship = 'imports'",
      )
      .all() as EdgeRow[];

    for (const row of rows) {
      if (!edgesMap.has(row.source_id)) {
        edgesMap.set(row.source_id, []);
      }
      edgesMap.get(row.source_id)!.push(row.target_id);
    }
  } catch {
    return [];
  }

  function dfs(node: string, path: string[]): boolean {
    if (recursionStack.has(node)) {
      // Found cycle - extract cycle from path
      const cycleStart = path.indexOf(node);
      if (cycleStart !== -1) {
        const cycle = path.slice(cycleStart).concat([node]);
        // Normalize cycle: rotate to start with lexicographically smallest element
        const minIndex = cycle
          .slice(0, -1)
          .reduce(
            (min, curr, i) => (curr < cycle[min] ? i : min),
            0,
          );
        const normalized = [
          ...cycle.slice(minIndex, -1),
          ...cycle.slice(0, minIndex),
          cycle[minIndex],
        ];
        const cycleKey = normalized.slice(0, -1).join("->");

        // Check if we already have this cycle
        const alreadyExists = cycles.some(
          (c) => c.join("->") === cycleKey,
        );
        if (!alreadyExists) {
          cycles.push(normalized.slice(0, -1));
        }
      }
      return cycles.length >= maxCycles;
    }

    if (visited.has(node)) return false;

    visited.add(node);
    recursionStack.add(node);

    const neighbors = edgesMap.get(node) ?? [];
    for (const neighbor of neighbors) {
      if (dfs(neighbor, [...path, node])) {
        return true;
      }
    }

    recursionStack.delete(node);
    return false;
  }

  // Run DFS from all nodes
  const allNodes = Array.from(edgesMap.keys());
  for (const node of allNodes) {
    if (!visited.has(node)) {
      dfs(node, []);
      if (cycles.length >= maxCycles) break;
    }
  }

  return cycles;
}

function getFeatureCoupling(db: Database.Database): FeatureCouplingItem[] {
  try {
    // Extract features from file paths and count cross-feature imports
    const rows = db
      .prepare(
        `
        SELECT e.source_id, e.target_id
        FROM edges e
        WHERE e.relationship = 'imports'
        AND e.source_id LIKE 'admin-panel/src/features/%'
        AND e.target_id LIKE 'admin-panel/src/features/%'
      `,
      )
      .all() as EdgeRow[];

    const featureStats = new Map<
      string,
      { crossFeature: number; total: number }
    >();

    for (const row of rows) {
      const sourceMatch = row.source_id.match(
        /admin-panel\/src\/features\/([^/]+)/,
      );
      const targetMatch = row.target_id.match(
        /admin-panel\/src\/features\/([^/]+)/,
      );

      if (!sourceMatch) continue;

      const sourceFeature = sourceMatch[1];
      const targetFeature = targetMatch ? targetMatch[1] : null;

      if (!featureStats.has(sourceFeature)) {
        featureStats.set(sourceFeature, { crossFeature: 0, total: 0 });
      }

      const stats = featureStats.get(sourceFeature)!;
      stats.total++;

      if (targetFeature && targetFeature !== sourceFeature) {
        stats.crossFeature++;
      }
    }

    return Array.from(featureStats.entries()).map(
      ([feature, stats]) => ({
        feature,
        crossFeatureImports: stats.crossFeature,
        totalImports: stats.total,
        couplingScore:
          stats.total > 0 ? stats.crossFeature / stats.total : 0,
      }),
    );
  } catch {
    return [];
  }
}

export function handleInsights(
  db: Database.Database,
): InsightsResult {
  return {
    hotspots: getHotspots(db),
    orphans: getOrphans(db),
    highBlastRadius: getHighBlastRadius(db),
    circularDependencies: findCycles(db, 5),
    featureCoupling: getFeatureCoupling(db),
  };
}
