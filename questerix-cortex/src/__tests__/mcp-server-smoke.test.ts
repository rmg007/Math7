import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { spawn, ChildProcess } from "child_process";
import * as path from "path";
import * as fs from "fs";

interface MCPTool {
  name: string;
  description: string;
}

interface ListToolsResponse {
  result?: {
    tools: MCPTool[];
  };
  tools?: MCPTool[];
  error?: {
    message: string;
    code?: number;
  };
}

describe("MCP Server Smoke Test", () => {
  let server: ChildProcess | null = null;
  const serverPath = path.resolve(__dirname, "../../dist/src/mcp-server/index.js");
  const expectedTools = [
    "cortex_impact",
    "cortex_query",
    "cortex_fragility",
    "cortex_plan",
    "cortex_verify",
    "cortex_briefing",
    "cortex_search",
    "cortex_governance",
    "cortex_diff",
    "cortex_insights",
  ];

  beforeAll(() => {
    // Ensure dist exists
    if (!fs.existsSync(serverPath)) {
      throw new Error(
        `MCP server not built. Run 'npm run build' first. Expected: ${serverPath}`
      );
    }
  });

  afterAll(() => {
    if (server) {
      server.kill("SIGTERM");
      server = null;
    }
  });

  it("should start the MCP server without errors", async () => {
    server = spawn("node", [serverPath], {
      stdio: ["pipe", "pipe", "pipe"],
      cwd: process.cwd(),
    });

    let stderr = "";
    server.stderr?.on("data", (data) => {
      stderr += data.toString();
    });

    // Wait for server to initialize
    await new Promise((resolve) => setTimeout(resolve, 1000));

    expect(server.pid).toBeDefined();
    expect(server.killed).toBe(false);
  }, 10000);

  it("should respond to tools/list with all expected tools", async () => {
    if (!server) {
      throw new Error("Server not started");
    }

    const listToolsRequest = {
      jsonrpc: "2.0",
      id: 1,
      method: "tools/list",
      params: {},
    };

    // Send request
    server.stdin?.write(JSON.stringify(listToolsRequest) + "\n");

    // Read response with timeout
    const responsePromise = new Promise<string>((resolve, reject) => {
      let response = "";

      const onData = (data: Buffer) => {
        response += data.toString();
        // Try to parse complete JSON response
        try {
          const lines = response.split("\n").filter((line) => line.trim());
          for (const line of lines) {
            if (line.startsWith("{") && line.endsWith("}")) {
              // Verify it's valid JSON
              JSON.parse(line);
              resolve(line);
              server?.stdout?.off("data", onData);
              return;
            }
          }
        } catch {
          // Not complete yet, continue waiting
        }
      };

      server?.stdout?.on("data", onData);

      // Timeout after 10 seconds
      setTimeout(() => {
        server?.stdout?.off("data", onData);
        reject(new Error("Timeout waiting for MCP server response"));
      }, 10000);
    });

    const result = await responsePromise;
    let parsed: ListToolsResponse;

    try {
      parsed = JSON.parse(result) as ListToolsResponse;
    } catch (error) {
      throw new Error(`Failed to parse MCP response: ${error}. Raw: ${result}`);
    }

    if (parsed.error) {
      throw new Error(
        `MCP server returned error: ${parsed.error.message || JSON.stringify(parsed.error)}`
      );
    }

    // Handle both response formats
    const tools = parsed.result?.tools || parsed.tools;
    expect(tools).toBeDefined();
    expect(Array.isArray(tools)).toBe(true);

    // Check all expected tools are present
    const toolNames = tools?.map((t) => t.name) || [];
    const missing = expectedTools.filter(
      (expected) => !toolNames.includes(expected)
    );

    if (missing.length > 0) {
      throw new Error(`Missing expected MCP tools: ${missing.join(", ")}`);
    }

    expect(toolNames.length).toBeGreaterThanOrEqual(expectedTools.length);
  }, 15000);

  it("should have no duplicate tool names", async () => {
    if (!server) {
      throw new Error("Server not started");
    }

    const listToolsRequest = {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/list",
      params: {},
    };

    server.stdin?.write(JSON.stringify(listToolsRequest) + "\n");

    const responsePromise = new Promise<string>((resolve, reject) => {
      let response = "";

      const onData = (data: Buffer) => {
        response += data.toString();
        try {
          const lines = response.split("\n").filter((line) => line.trim());
          for (const line of lines) {
            if (line.startsWith("{") && line.endsWith("}")) {
              JSON.parse(line);
              resolve(line);
              server?.stdout?.off("data", onData);
              return;
            }
          }
        } catch {
          // Continue waiting
        }
      };

      server?.stdout?.on("data", onData);
      setTimeout(() => {
        server?.stdout?.off("data", onData);
        reject(new Error("Timeout"));
      }, 10000);
    });

    const result = await responsePromise;
    const parsed = JSON.parse(result) as ListToolsResponse;
    const tools = parsed.result?.tools || parsed.tools || [];

    const toolNames = tools.map((t) => t.name);
    const uniqueNames = new Set(toolNames);

    expect(uniqueNames.size).toBe(toolNames.length);
  }, 15000);
});
