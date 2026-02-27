import { execSync } from "child_process";
import * as path from "path";

const KNOWN_PREFIXES: string[] = [];

function resolveProjectRoot(): string {
  try {
    const gitRoot = execSync("git rev-parse --show-toplevel", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "ignore"],
    }).trim();
    return gitRoot.replace(/\\/g, "/");
  } catch {
    return path.resolve(__dirname, "..", "..", "..").replace(/\\/g, "/");
  }
}

const projectRoot = resolveProjectRoot();

export function normalizePath(filePath: string): string {
  const normalized = filePath.replace(/\\/g, "/");

  let withRootStripped = normalized.startsWith(projectRoot)
    ? normalized.slice(projectRoot.length + 1)
    : normalized;

  if (withRootStripped.startsWith("/")) {
    withRootStripped = withRootStripped.slice(1);
  }

  if (withRootStripped.startsWith("@/")) {
    return withRootStripped.slice(2);
  }

  return withRootStripped;
}

/**
 * Validates that a path round-trips through normalizePath to the same value.
 * This ensures path normalization is idempotent.
 */
export function validatePathIdentity(filePath: string): boolean {
  const normalized = normalizePath(filePath);
  const doubleNormalized = normalizePath(normalized);
  return normalized === doubleNormalized;
}
