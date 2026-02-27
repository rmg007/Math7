import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { auditGovernance } from "../governance";

describe("Governance", () => {
  let tempDir: string;

  beforeEach(() => {
    // Create a temporary directory for test fixtures
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "governance-test-"));
  });

  afterEach(() => {
    // Clean up temporary directory
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  function createFixtureFile(relPath: string, content: string) {
    const fullPath = path.join(tempDir, relPath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(fullPath, content, "utf-8");
  }

  it("returns exactly 2 dead refs when fixture has 2 dead links and 1 valid link", () => {
    // Create valid file in docs/ since that's where it's referenced from
    createFixtureFile("docs/README.md", "# Valid File\nThis file exists.");

    // Create file with mixed references
    createFixtureFile(
      "docs/guide.md",
      `# Guide

See [valid link](README.md) for more info.
Check [dead link 1](non-existent.md) for details.
Read [dead link 2](./missing/file.md) for reference.
`
    );

    const result = auditGovernance(tempDir, ["docs"]);

    expect(result.deadRefs).toHaveLength(2);
    expect(result.deadRefs[0].ref).toBe("non-existent.md");
    expect(result.deadRefs[1].ref).toBe("./missing/file.md");
    expect(result.scannedFiles).toBeGreaterThanOrEqual(2);
  });

  it("correctly identifies valid markdown links", () => {
    // Create existing.md in docs/ since that's where it's referenced from
    createFixtureFile("docs/existing.md", "# Existing");
    createFixtureFile(
      "docs/references.md",
      `See [existing](existing.md) for more.
Also check \`existing.md\` in the code.
Read existing.md carefully.
`
    );

    const result = auditGovernance(tempDir, ["docs"]);

    // All references are valid since existing.md exists in docs/
    expect(result.deadRefs).toHaveLength(0);
  });

  it("handles external URLs correctly (ignores them)", () => {
    createFixtureFile(
      "docs/external.md",
      `Visit [example](https://example.com) for more.
See [GitHub](http://github.com/user/repo/blob/main/README.md).
`
    );

    const result = auditGovernance(tempDir, ["docs"]);

    // External URLs should be ignored
    expect(result.deadRefs).toHaveLength(0);
  });

  it("handles anchor links correctly", () => {
    // Create existing.md in docs/ since that's where the reference resolves from
    createFixtureFile("docs/existing.md", "# Existing");
    createFixtureFile(
      "docs/anchors.md",
      `Jump to [section](existing.md#section-name).
See [top](README.md#header).
`
    );

    const result = auditGovernance(tempDir, ["docs"]);

    // Should have 1 dead ref (README.md doesn't exist in docs/)
    expect(result.deadRefs).toHaveLength(1);
    expect(result.deadRefs[0].ref).toBe("README.md");
  });

  it("scans governance directories (.agent, .cursor, docs/strategy, docs/standards)", () => {
    // Create files in governance directories
    createFixtureFile(".agent/instructions.md", "# Instructions");
    createFixtureFile(
      ".cursor/rules.md",
      `Rules for [agents](non-existent-agent.md).`
    );
    createFixtureFile(
      "docs/strategy/plan.md",
      `Plan based on [missing](missing-strategy.md).`
    );
    // For the parent directory reference test: create README in docs/
    // Reference from docs/standards/coding.md as ../README.md will resolve to docs/README.md
    createFixtureFile("docs/README.md", "# Docs README");
    createFixtureFile(
      "docs/standards/coding.md",
      `See [parent](../README.md) and [bad](bad-ref.md).`
    );

    // Test with default governance dirs
    const result = auditGovernance(tempDir);

    // Should find dead refs in governance directories
    const deadRefs = result.deadRefs.map((r: { ref: string }) => r.ref);
    expect(deadRefs).toContain("non-existent-agent.md");
    expect(deadRefs).toContain("missing-strategy.md");
    expect(deadRefs).toContain("bad-ref.md");
    // ../README.md resolves to docs/README.md which exists (valid)
    expect(deadRefs).not.toContain("../README.md");
  });

  it("groups dead refs by file correctly", () => {
    createFixtureFile(
      "file1.md",
      `Dead [one](dead1.md) and [two](dead2.md).`
    );
    createFixtureFile(
      "file2.md",
      `Dead [three](dead3.md).`
    );

    const result = auditGovernance(tempDir, ["."]);

    expect(result.deadRefs).toHaveLength(3);

    // Group by file
    const byFile = new Map<string, string[]>();
    for (const { file, ref } of result.deadRefs as Array<{ file: string; ref: string }>) {
      const refs = byFile.get(file) ?? [];
      refs.push(ref);
      byFile.set(file, refs);
    }

    expect(byFile.get("file1.md")).toHaveLength(2);
    expect(byFile.get("file2.md")).toHaveLength(1);
  });

  it("excludes paths outside repo", () => {
    createFixtureFile(
      "docs/outside.md",
      `See [outside](../../../../etc/passwd) for secrets.
Check [parent](../../outside.md) for more.
`
    );

    const result = auditGovernance(tempDir, ["docs"]);

    // References outside repo should be ignored (not flagged as dead)
    expect(result.deadRefs).toHaveLength(0);
  });

  it("handles backtick-quoted paths", () => {
    // Create existing.md in docs/ since that's where the reference resolves from
    createFixtureFile("docs/existing.md", "# Existing");
    createFixtureFile(
      "docs/code.md",
      `Use \`existing.md\` for reference.
Don't use \`missing.md\` anymore.
`
    );

    const result = auditGovernance(tempDir, ["docs"]);

    // existing.md is valid (exists in docs/), missing.md is dead
    expect(result.deadRefs).toHaveLength(1);
    expect(result.deadRefs[0].ref).toBe("missing.md");
  });

  it("handles 'Read path' style references", () => {
    // Create existing.md in docs/ since that's where the reference resolves from
    createFixtureFile("docs/existing.md", "# Existing");
    createFixtureFile(
      "docs/readme.md",
      `Read existing.md carefully.
Read missing.md for more info.
Also see \`another.md\`.
`
    );

    const result = auditGovernance(tempDir, ["docs"]);

    // The "Read" pattern catches: existing.md (valid), missing.md (dead)
    // The backtick pattern catches: another.md (dead)
    // existing.md is valid (exists in docs/), missing.md and another.md are dead
    expect(result.deadRefs).toHaveLength(2);
    const refs = result.deadRefs.map((r: { ref: string }) => r.ref);
    expect(refs).toContain("missing.md");
    expect(refs).toContain("another.md");
    expect(refs).not.toContain("existing.md");
  });

  it("handles relative paths correctly", () => {
    // Create file at nested path - reference from docs/guide.md should work
    createFixtureFile("docs/subdir/existing.md", "# Existing");
    createFixtureFile(
      "docs/guide.md",
      `See [nested](subdir/existing.md) for details.
Also [missing](subdir/missing/file.md) won't work.
`
    );

    const result = auditGovernance(tempDir, ["docs"]);

    expect(result.deadRefs).toHaveLength(1);
    expect(result.deadRefs[0].ref).toBe("subdir/missing/file.md");
  });

  it("returns empty result for directories with no markdown files", () => {
    const result = auditGovernance(tempDir);

    expect(result.deadRefs).toHaveLength(0);
    expect(result.scannedFiles).toBe(0);
  });

  it("deduplicates references in the same file", () => {
    createFixtureFile(
      "docs/duplicate.md",
      `See [link1](same.md) and [link2](same.md) multiple times.
Also \`same.md\` in backticks.
`
    );

    const result = auditGovernance(tempDir, ["docs"]);

    // Should only report same.md once per file
    expect(result.deadRefs).toHaveLength(1);
    expect(result.deadRefs[0].ref).toBe("same.md");
  });
});
