import * as fs from "fs";
import * as path from "path";
import { auditGovernance, GovernanceResult } from "./index";

interface Config {
  thresholds?: {
    governanceThreshold?: number;
  };
}

function loadConfig(projectRoot: string): Config {
  const configPath = path.join(projectRoot, "questerix-cortex", "cortex.config.json");
  try {
    const content = fs.readFileSync(configPath, "utf-8");
    return JSON.parse(content) as Config;
  } catch {
    return { thresholds: { governanceThreshold: 5 } };
  }
}

function removeDeadLinks(content: string, deadRefs: Array<{ ref: string }>): string {
  let cleaned = content;

  for (const { ref } of deadRefs) {
    // Remove markdown links to dead refs: [text](path) or [text](path#anchor)
    const linkRegex = new RegExp(`\\[([^\\]]+)\\]\\(${escapeRegex(ref)}[^)]*\\)`, "g");
    cleaned = cleaned.replace(linkRegex, "$1");

    // Remove backtick-quoted dead refs
    const backtickRegex = new RegExp(`\`${escapeRegex(ref)}\``, "g");
    cleaned = cleaned.replace(backtickRegex, ref);

    // Remove "Read path" style references
    const readRegex = new RegExp(`[Rr]ead\\s+\`?${escapeRegex(ref)}\`?`, "g");
    cleaned = cleaned.replace(readRegex, `\`${ref}\``);
  }

  return cleaned;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function groupDeadRefsByFile(
  deadRefs: Array<{ file: string; ref: string }>,
): Map<string, Array<{ ref: string }>> {
  const grouped = new Map<string, Array<{ ref: string }>>();
  for (const { file, ref } of deadRefs) {
    const refs = grouped.get(file) ?? [];
    refs.push({ ref });
    grouped.set(file, refs);
  }
  return grouped;
}

async function runFixMode(result: GovernanceResult, projectRoot: string): Promise<void> {
  const grouped = groupDeadRefsByFile(result.deadRefs);

  for (const [file, refs] of grouped) {
    const filePath = path.join(projectRoot, file);
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const cleaned = removeDeadLinks(content, refs);

      if (content !== cleaned) {
        fs.writeFileSync(filePath, cleaned, "utf-8");
        console.log(`✅ Fixed: ${file} (${refs.length} dead link${refs.length === 1 ? "" : "s"} removed)`);
      }
    } catch (err) {
      console.error(`❌ Failed to fix ${file}: ${err}`);
    }
  }

  console.log(`\n🔧 Fixed ${result.deadRefs.length} dead reference${result.deadRefs.length === 1 ? "" : "s"} in ${grouped.size} file${grouped.size === 1 ? "" : "s"}`);
}

async function runCheckMode(result: GovernanceResult, threshold: number): Promise<number> {
  const { deadRefs, scannedFiles } = result;

  console.log(`📋 Governance Check Results`);
  console.log(`   Scanned: ${scannedFiles} files`);
  console.log(`   Dead refs: ${deadRefs.length}`);
  console.log(`   Threshold: ${threshold}`);
  console.log();

  if (deadRefs.length === 0) {
    console.log("✅ No dead references found.");
    return 0;
  }

  // Group by file for cleaner output
  const grouped = groupDeadRefsByFile(deadRefs);
  for (const [file, refs] of grouped) {
    console.log(`❌ ${file}:`);
    for (const { ref } of refs) {
      console.log(`   - ${ref}`);
    }
  }

  console.log();

  if (deadRefs.length > threshold) {
    console.log(`❌ FAILED: ${deadRefs.length} dead references exceed threshold (${threshold})`);
    return 1;
  } else {
    console.log(`⚠️ WARNING: ${deadRefs.length} dead references found (within threshold of ${threshold})`);
    return 0;
  }
}

async function main(): Promise<number> {
  const args = process.argv.slice(2);
  const isCheckMode = args.includes("--check");
  const isFixMode = args.includes("--fix");

  // Resolve project root (repo root, not cortex directory)
  const scriptDir = __dirname;
  const projectRoot = path.resolve(scriptDir, "../..");

  // Load config for threshold
  const config = loadConfig(projectRoot);
  const threshold = config.thresholds?.governanceThreshold ?? 5;

  // Run audit
  const result = auditGovernance(projectRoot);

  if (isFixMode) {
    await runFixMode(result, projectRoot);
    return 0;
  }

  if (isCheckMode) {
    return await runCheckMode(result, threshold);
  }

  // Default: just print results
  return await runCheckMode(result, threshold);
}

main().then((exitCode) => {
  process.exit(exitCode);
}).catch((err) => {
  console.error("❌ Governance check failed:", err);
  process.exit(1);
});
