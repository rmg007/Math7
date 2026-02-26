#!/usr/bin/env node

import { spawn } from 'child_process';
import { randomUUID } from 'crypto';

interface MCPTool {
  name: string;
  description: string;
}

interface MCPErrorResponse {
  error?: {
    message: string;
    code?: number;
  };
}

interface ListToolsResponse {
  result?: {
    tools: MCPTool[];
  };
  tools?: MCPTool[];
}

interface ErrorResponse {
  error?: string;
  message?: string;
}

const sessionId = randomUUID();
const serverPath = './dist/src/mcp-server/index.js';

async function runSelfTest(): Promise<void> {
  console.log(`🧪 Cortex MCP Self-Test (session ${sessionId})`);
  
  try {
    // Spawn the MCP server
    const server = spawn('node', [serverPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: process.cwd()
    });

    let stdout = '';
    let stderr = '';

    server.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    server.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    server.on('error', (error) => {
      console.error('❌ Failed to start server:', error.message);
      process.exit(1);
    });

    server.on('close', (code) => {
      // null = killed by signal (SIGTERM from our clean shutdown) — not an error
      if (code !== null && code !== 0) {
        console.error('❌ Server exited with code:', code);
        console.error('STDERR:', stderr);
        process.exit(1);
      }
    });

    // Wait a moment for server to initialize
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Send ListTools request
    const listToolsRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
      params: {}
    };

    server.stdin.write(JSON.stringify(listToolsRequest) + '\n');

    // Read response
    let response = '';
    const responsePromise = new Promise<string>((resolve, reject) => {
      server.stdout.on('data', (data) => {
        response += data.toString();
        // Try to parse complete JSON response
        try {
          const lines = response.split('\n').filter(line => line.trim());
          for (const line of lines) {
            if (line.startsWith('{') && line.endsWith('}')) {
              resolve(line);
              return;
            }
          }
        } catch {
          // Not complete yet
        }
      });

      server.stderr.on('data', (data) => {
        // MCP servers log to stderr - this is normal, not an error
        const msg = data.toString().trim();
        if (msg && !msg.includes('cortex-mcp-server started')) {
          console.log('📋 Server log:', msg);
        }
      });
    });

    const result = await Promise.race<string>([
      responsePromise,
      new Promise<string>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
    ]);

    let parsed: ListToolsResponse | MCPErrorResponse;
    try {
      parsed = JSON.parse(result) as ListToolsResponse | MCPErrorResponse;
    } catch (error) {
      console.error('❌ Failed to parse response:', error);
      console.error('Raw response:', result);
      process.exit(1);
    }

    if ('error' in parsed && parsed.error) {
      const errorMsg = typeof parsed.error === 'string' ? parsed.error : parsed.error.message;
      console.error('❌ MCP server returned error:', errorMsg);
      process.exit(1);
    }

    // Handle MCP JSON-RPC response format (result.tools) or direct format (tools)
    const tools = (parsed as ListToolsResponse).result?.tools || (parsed as ListToolsResponse).tools;
    if (!tools || !Array.isArray(tools)) {
      console.error('❌ Invalid response format - missing tools array');
      console.error('Response:', parsed);
      process.exit(1);
    }
    const expectedTools = [
      'cortex_impact',
      'cortex_query', 
      'cortex_fragility',
      'cortex_plan',
      'cortex_verify',
      'cortex_briefing',
      'cortex_search'
    ];

    const missing = expectedTools.filter(tool => !tools.some(t => t.name === tool));
    const unexpected = tools.filter(t => !expectedTools.includes(t.name));

    if (missing.length > 0) {
      console.error('❌ Missing tools:', missing.join(', '));
      process.exit(1);
    }

    if (unexpected.length > 0) {
      console.warn('⚠️  Unexpected tools:', unexpected.map(t => t.name).join(', '));
    }

    console.log(`✅ All ${expectedTools.length} expected tools registered`);
    console.log('📋 Tool list:');
    tools.forEach(tool => {
      console.log(`  - ${tool.name}: ${tool.description}`);
    });

    // Clean shutdown
    server.kill('SIGTERM');
    console.log('✅ Self-test passed');

  } catch (error) {
    console.error('❌ Self-test failed:', error);
    process.exit(1);
  }
}

runSelfTest();
