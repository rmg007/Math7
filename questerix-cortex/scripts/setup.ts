#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";

const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const mcpConfigPath = path.join(repoRoot, ".mcp_config.example.json");
const cortexRoot = path.resolve(__dirname, "..");
const compiledServerPath = path.join(
  cortexRoot,
  "dist/src/mcp-server/index.js",
);

function main() {
  console.log("🔧 Cortex MCP Setup");
  console.log(`Repo root: ${repoRoot}`);
  console.log(`Cortex root: ${cortexRoot}`);
  console.log(`Server path: ${compiledServerPath}`);

  // Check if compiled server exists
  if (!fs.existsSync(compiledServerPath)) {
    console.error('❌ MCP server not compiled. Run "npm run build" first.');
    process.exit(1);
  }

  // Read example config
  if (!fs.existsSync(mcpConfigPath)) {
    console.error("❌ .mcp_config.example.json not found");
    process.exit(1);
  }

  const config = JSON.parse(fs.readFileSync(mcpConfigPath, "utf-8"));

  // Add or update cortex entry
  const cortexEntry = {
    command: "node",
    args: [path.relative(repoRoot, compiledServerPath)],
  };

  config.cortex = cortexEntry;

  // Print the ready-to-paste config
  console.log("\n📋 Ready-to-paste MCP config snippet:");
  console.log("Add this to your IDE's MCP configuration:");
  console.log("");
  console.log(JSON.stringify(config, null, 2));
  console.log("");

  // Instructions for different IDEs
  console.log("📖 IDE-specific instructions:");
  console.log("  • Windsurf: Add to ~/.codeium/windsurf/mcp_config.json");
  console.log("  • Cursor: Add to .cursor/mcp.json");
  console.log("  • Other: Follow your IDE's MCP configuration guide");
  console.log("");
  console.log("✅ Setup complete");
}

main();
