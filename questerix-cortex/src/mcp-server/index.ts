#!/usr/bin/env node
import { startServer } from "./server";

startServer().catch((error) => {
  console.error("cortex-mcp-server failed to start:", error);
  process.exit(1);
});
