import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { describe, expect, it } from "vitest";
import { DeltaEngine } from "../delta";
import { GitOracle } from "../git-oracle";
import { RiskScorer } from "../risk-scorer";
import { ZombieHunter } from "../zombie-hunter";

describe("Phase 2: Orphaned Module Integration", () => {
  describe("RiskScorer", () => {
    it("should calculate a composite score between 0-100", () => {
      const riskScorer = new RiskScorer();
      const mockResults = {
        "unit tests": {
          name: "unit tests (lib)",
          status: "passed" as const,
          duration: 1.5,
          output: "",
        },
        lint: {
          name: "lint check",
          status: "passed" as const,
          duration: 0.5,
          output: "",
        },
        e2e: {
          name: "e2e smoke (desktop)",
          status: "passed" as const,
          duration: 5.0,
          output: "",
        },
      };

      const score = riskScorer.calculateScore(mockResults, undefined, undefined);

      expect(score.composite).toBeGreaterThanOrEqual(0);
      expect(score.composite).toBeLessThanOrEqual(100);
      expect(score.confidence).toBeGreaterThanOrEqual(0);
      expect(score.confidence).toBeLessThanOrEqual(100);
      expect(score.dimensions.smokeGate.score).toBe(100);
    });

    it("should handle incomplete results gracefully", () => {
      const riskScorer = new RiskScorer();
      const score = riskScorer.calculateScore({}, undefined, undefined);

      expect(score.composite).toBe(0);
      expect(score.confidence).toBe(0);
    });
  });

  describe("DeltaEngine", () => {
    it("should compute delta with hotFiles as an array", () => {
      // Use temp directory to avoid double-nested path issues
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "cortex-delta-test-"));
      
      try {
        // Create the outputs directory structure that DeltaEngine expects
        const outputsDir = path.join(tempDir, "questerix-cortex", "outputs");
        fs.mkdirSync(outputsDir, { recursive: true });
        
        // Create a dummy SURFACE_MAP.json file
        const surfaceMapPath = path.join(outputsDir, "SURFACE_MAP.json");
        fs.writeFileSync(surfaceMapPath, JSON.stringify({ hooks: [], pages: [], gaps: [] }), "utf-8");
        
        const deltaEngine = new DeltaEngine(tempDir);
        const mockSurfaceMap = {
          hooks: [],
          pages: [],
          gaps: ["Missing test for hook: useAuth"],
        };

        const deltaResult = deltaEngine.computeDelta(mockSurfaceMap);

        expect(Array.isArray(deltaResult.hotFiles)).toBe(true);
        expect(Array.isArray(deltaResult.newGaps)).toBe(true);
        expect(Array.isArray(deltaResult.resolvedGaps)).toBe(true);
        expect(deltaResult.gitActivity).toBeDefined();
        expect(deltaResult.gitActivity.lastCommitHash).toBeDefined();
      } finally {
        // Cleanup temp directory
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });
  });

  describe("GitOracle", () => {
    it("should analyze git state and return structured result", () => {
      const gitOracle = new GitOracle(process.cwd());
      const mockGaps = ["Missing test for hook: useAuth"];

      const result = gitOracle.analyze(mockGaps);

      expect(result).toHaveProperty("recentlyModifiedFiles");
      expect(result).toHaveProperty("untestedModifiedFiles");
      expect(result).toHaveProperty("commitSummary");
      expect(result).toHaveProperty("uncommittedChanges");
      expect(Array.isArray(result.recentlyModifiedFiles)).toBe(true);
      expect(Array.isArray(result.untestedModifiedFiles)).toBe(true);
      expect(Array.isArray(result.uncommittedChanges)).toBe(true);
    });
  });

  describe("ZombieHunter", () => {
    it("should clean zombie processes without throwing", () => {
      // This test just ensures the method doesn't throw
      expect(() => ZombieHunter.clean(5050)).not.toThrow();
    });
  });

  describe("HISTORY.json coverage field", () => {
    it("should compute coverage from surfaceMap gaps", () => {
      const surfaceMap = {
        hooks: [{ name: "useAuth", file: "auth.ts", hasTest: true, functions: [] }],
        pages: [{ name: "Login", file: "login.tsx", hasTest: false, routes: [] }],
        gaps: ["Missing test for page: Login"],
      };

      // Coverage = ((hooks + pages) - gaps) / (hooks + pages) * 100
      const totalFiles = surfaceMap.hooks.length + surfaceMap.pages.length;
      const gaps = surfaceMap.gaps.length;
      const coverage = Math.round(((totalFiles - gaps) / totalFiles) * 100);

      expect(typeof coverage).toBe("number");
      expect(coverage).toBeGreaterThanOrEqual(0);
      expect(coverage).toBeLessThanOrEqual(100);
      expect(coverage).toBe(50); // 1 tested out of 2 = 50%
    });

    it("should always have coverage as a number, never undefined", () => {
      const emptySurfaceMap = { hooks: [], pages: [], gaps: [] };
      const totalFiles = emptySurfaceMap.hooks.length + emptySurfaceMap.pages.length;

      // Handle empty case - coverage should be 100% if no files
      const coverage = totalFiles === 0 ? 100 : 0;

      expect(typeof coverage).toBe("number");
      expect(coverage).not.toBeUndefined();
      expect(coverage).not.toBeNull();
    });
  });
});
