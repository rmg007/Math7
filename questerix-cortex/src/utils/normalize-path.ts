import * as path from "path";

const KNOWN_PREFIXES = ["admin-panel/src/", "admin-panel/", "src/"];

export function normalizePath(filePath: string): string {
  const normalized = filePath.replace(/\\/g, "/");
  const projectRoot = path.resolve(__dirname, "..", "..", "..").replace(/\\/g, "/");
  let withRootStripped = normalized.startsWith(projectRoot)
    ? normalized.slice(projectRoot.length + 1)
    : normalized;

  if (withRootStripped.startsWith("/")) {
    withRootStripped = withRootStripped.slice(1);
  }

  const withoutPrefixes = KNOWN_PREFIXES.reduce((value, prefix) => {
    return value.startsWith(prefix) ? value.slice(prefix.length) : value;
  }, withRootStripped);

  if (withoutPrefixes.startsWith("@/")) {
    return withoutPrefixes.slice(2);
  }

  return withoutPrefixes;
}
