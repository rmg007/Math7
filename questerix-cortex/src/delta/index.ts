import * as fs from "fs";
import * as path from "path";

export interface DeltaResult {
  newGaps: string[];
  resolvedGaps: string[];
  newFailures: string[];
  resolvedFailures: string[];
  hotFiles: string[];
  gitActivity: {
    lastCommitHash: string;
    lastCommitMessage: string;
    lastCommitAuthor: string;
    lastCommitTime: string;
    uncommittedChanges: number;
  };
}

export interface SurfaceMap {
  hooks: {
    name: string;
    file: string;
    hasTest: boolean;
    functions: string[];
  }[];
  pages: { name: string; file: string; hasTest: boolean; routes: string[] }[];
  gaps: string[];
}

export class DeltaEngine {
  private previousSurfaceMapPath: string;
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.previousSurfaceMapPath = path.join(
      projectRoot,
      "questerix-cortex",
      "outputs",
      ".prev_surface_map.json",
    );
  }

  /**
   * Compute delta between current and previous surface map
   */
  computeDelta(currentSurfaceMap: SurfaceMap, gitActivity?: any): DeltaResult {
    // Load previous surface map if it exists
    let previousSurfaceMap: SurfaceMap | null = null;
    if (fs.existsSync(this.previousSurfaceMapPath)) {
      try {
        previousSurfaceMap = JSON.parse(
          fs.readFileSync(this.previousSurfaceMapPath, "utf-8"),
        );
      } catch (error) {
        console.warn("Failed to load previous surface map:", error);
        previousSurfaceMap = null;
      }
    }

    // Save current surface map for next run
    const currentSurfaceMapPath = path.join(
      this.projectRoot,
      "questerix-cortex",
      "outputs",
      "SURFACE_MAP.json",
    );
    fs.writeFileSync(
      this.previousSurfaceMapPath,
      fs.readFileSync(currentSurfaceMapPath),
    );

    // If no previous map, return empty delta
    if (!previousSurfaceMap) {
      return {
        newGaps: currentSurfaceMap.gaps,
        resolvedGaps: [],
        newFailures: [],
        resolvedFailures: [],
        hotFiles: [],
        gitActivity: gitActivity || this.getGitActivity(),
      };
    }

    // Compute gaps delta
    const previousGaps = new Set(previousSurfaceMap.gaps);
    const currentGaps = new Set(currentSurfaceMap.gaps);

    const newGaps = currentSurfaceMap.gaps.filter(
      (gap) => !previousGaps.has(gap),
    );
    const resolvedGaps = previousSurfaceMap.gaps.filter(
      (gap) => !currentGaps.has(gap),
    );

    // Get hot files (recently changed + untested)
    const hotFiles = this.getHotFiles(currentSurfaceMap);

    return {
      newGaps,
      resolvedGaps,
      newFailures: [], // Will be populated by orchestrator
      resolvedFailures: [], // Will be populated by orchestrator
      hotFiles,
      gitActivity: gitActivity || this.getGitActivity(),
    };
  }

  /**
   * Get files that were recently modified and lack test coverage
   */
  private getHotFiles(surfaceMap: SurfaceMap): string[] {
    try {
      // Get files modified in last 24 hours
      const { execSync } = require("child_process");
      const gitOutput = execSync(
        'git log --since="24 hours" --name-only --pretty=format:""',
        {
          cwd: this.projectRoot,
          encoding: "utf-8",
        },
      );

      const recentlyModifiedFiles = new Set<string>(
        gitOutput
          .split("\n")
          .filter((line: string) => line.trim())
          .filter((file: string) => file.match(/\.(ts|tsx)$/))
          .filter(
            (file: string) =>
              !file.includes("node_modules") && !file.includes("dist"),
          )
          .map((file: string) => file.replace(/\\/g, "/")),
      );

      // Intersect with untested files
      const untestedFiles = new Set(
        surfaceMap.gaps
          .map((gap: string) => {
            // Extract file path from gap description
            const match = gap.match(/Missing test for (?:hook|page): (.+)$/);
            return match ? match[1] : null;
          })
          .filter((f): f is string => f !== null),
      );

      const hotFiles = Array.from(recentlyModifiedFiles).filter(
        (file: string) =>
          untestedFiles.has(file) ||
          Array.from(untestedFiles).some(
            (untested: string) =>
              untested.includes(file) || file.includes(untested),
          ),
      );

      return hotFiles.slice(0, 10); // Limit to top 10
    } catch (error) {
      console.warn("Failed to get hot files:", error);
      return [];
    }
  }

  /**
   * Get git activity summary
   */
  private getGitActivity() {
    try {
      const { execSync } = require("child_process");

      // Get last commit info
      const lastCommit = execSync(
        'git log -1 --pretty=format:"%H|%s|%an|%ar"',
        {
          cwd: this.projectRoot,
          encoding: "utf-8",
        },
      ).trim();

      const [hash, message, author, when] = lastCommit.split("|");

      // Get uncommitted changes count
      const statusOutput = execSync("git status --porcelain", {
        cwd: this.projectRoot,
        encoding: "utf-8",
      });

      const uncommittedChanges = statusOutput
        .split("\n")
        .filter((line: string) => line.trim()).length;

      return {
        lastCommitHash: hash.slice(0, 8),
        lastCommitMessage: message,
        lastCommitAuthor: author,
        lastCommitTime: when,
        uncommittedChanges,
      };
    } catch (error) {
      console.warn("Failed to get git activity:", error);
      return {
        lastCommitHash: "unknown",
        lastCommitMessage: "Git unavailable",
        lastCommitAuthor: "unknown",
        lastCommitTime: "unknown",
        uncommittedChanges: 0,
      };
    }
  }
}
