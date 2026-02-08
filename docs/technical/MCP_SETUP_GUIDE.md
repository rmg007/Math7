# MCP Setup Guide for Math7

This project is optimized for use with Model Context Protocol (MCP) servers to enhance AI coding capabilities.

## Recommended MCP Stack

1.  **Dart/Flutter:** `dart-mcp-server` (Advanced code intelligence)
2.  **Supabase:** `supabase-mcp-server` (Database & Backend management)
3.  **Playwright:** `@modelcontextprotocol/server-playwright` (E2E Testing & UI Inspection)
4.  **Sequential Thinking:** `@modelcontextprotocol/server-sequential-thinking` (Structured problem-solving)
5.  **Shadcn/UI:** Native CLI Integration (Best-in-class UI Components) - See `docs/SHADCN_GUIDE.md`
6.  **Code Scalpel:** `code-scalpel` (Graph-based refactoring & AST analysis) - *Experimental: May have Windows compatibility issues*
6.  **Flutter Docs:** (Optional, for reference)

## Configuration Instructions

Add the following configuration to your MCP settings file (e.g., `cline_mcp_settings.json` or your agent's config).

**IMPORTANT:** You must replace `[ABSOLUTE_PATH_TO_PROJECT]` with the actual full path to this project on your machine:
`c:\Users\mhali\OneDrive\Desktop\Important Projects\Math7`

```json
{
  "mcpServers": {
    "flutter": {
      "command": "dart",
      "args": ["pub", "global", "run", "dart_mcp_server"]
    },
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server"],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "YOUR_ACCESS_TOKEN", 
        "SUPABASE_PROJECT_ID": "[YOUR-PROJECT-ID]" 
      }
    },
    "playwright": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-playwright"],
      "env": {
        "PLAYWRIGHT_CONFIG_PATH": "c:\\Users\\mhali\\OneDrive\\Desktop\\Important Projects\\Math7\\admin-panel\\playwright.config.ts"
      }
    },
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    },
    "code-scalpel": {
      "command": "uvx",
      "args": ["code-scalpel", "mcp"],
      "env": {
        "CODE_SCALPEL_ROOT": "c:\\Users\\mhali\\OneDrive\\Desktop\\Important Projects\\Math7"
      }
    }
  }
}
```

### Notes
*   **Supabase Token:** You will need to generate a Supabase Access Token from your Supabase Dashboard (Account > Access Tokens) and replace `YOUR_ACCESS_TOKEN`.
*   **Playwright Path:** Ensure the path to `playwright.config.ts` uses double backslashes `\\` on Windows.
*   **Sequential Thinking:** No additional setup required. This MCP improves reasoning quality by forcing structured, step-by-step problem solving.
*   **Code Scalpel:** Requires Python's `uv` tool. Install with `pip install uv` or `pipx install uv` if not already installed. **Note:** As of January 2026, Code Scalpel may have dependency resolution issues on Windows. If `python -m uv tool run code-scalpel init` fails, you can skip this MCP for now. The Dart MCP already provides strong AST-level analysis for your Flutter code.
