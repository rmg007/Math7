# MCP Setup Guide for Questerix Student App

This project is optimized for use with Model Context Protocol (MCP) servers to enhance AI coding capabilities.

## Recommended MCP Stack

1.  **Dart/Flutter:** `dart-mcp-server` (Advanced code intelligence) - **CRITICAL for Mobile Engineer persona**
2.  **Supabase:** `supabase-mcp-server` (Database & Backend management)
3.  **Sequential Thinking:** `@modelcontextprotocol/server-sequential-thinking` (Structured problem-solving)
4.  **Code Scalpel:** `code-scalpel` (Graph-based refactoring & AST analysis)

## Configuration Instructions

Add the following configuration to your MCP settings file (e.g., `cline_mcp_settings.json` or your agent's config).

**IMPORTANT:** You must replace `[ABSOLUTE_PATH_TO_PROJECT]` with the actual full path to this project on your machine:
`c:\Users\mhali\OneDrive\Desktop\Important Projects\Questerix\questerix-student-app`

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
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    },
    "code-scalpel": {
      "command": "uvx",
      "args": ["code-scalpel", "mcp"],
      "env": {
        "CODE_SCALPEL_ROOT": "c:\\Users\\mhali\\OneDrive\\Desktop\\Important Projects\\Questerix\\questerix-student-app"
      }
    }
  }
}
```

### Notes

- **Supabase Token:** You will need to generate a Supabase Access Token from your Supabase Dashboard (Account > Access Tokens) and replace `YOUR_ACCESS_TOKEN`.
- **Sequential Thinking:** No additional setup required. This MCP improves reasoning quality by forcing structured, step-by-step problem solving.
- **Code Scalpel:** Requires Python's `uv` tool. Install with `pip install uv`.
- **Dart MCP:** This is your primary tool for navigating the Flutter codebase and ensuring type safety.
