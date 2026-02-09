# IDE Setup Guide

Optimize your development experience with **Cursor**, **Windsurf**, or **VS Code**.

## 🚀 Recommended Extensions

This project includes a `.vscode/extensions.json` file. When you open the project, your editor should prompt you to install recommended extensions.
Key extensions:
*   **Flutter & Dart**: Essential for Student App development.
*   **ESLint & Prettier**: Enforces code style in the Admin Panel.
*   **Tailwind CSS**: IntelliSense for styling.
*   **Supabase**: Syntax highlighting for Supabase config.

## 🐞 Debugging Configuration

We have provided a `.vscode/launch.json` for one-click debugging.

### 1. Admin Panel (React)
*   Select **"Admin Panel: Chrome"** in the Run and Debug view.
*   This attaches the debugger to the running Vite development server (`http://localhost:3001`).
*   **Prerequisite**: Run `npm run dev` in the `admin-panel` folder first (or use the provided Task).

### 2. Student App (Flutter)
*   Select **"Student App: Chrome (Debug)"**.
*   This launches the Flutter app in Chrome with debugging enabled.
*   Hot Reload/Restart work directly from the debug toolbar.

## 🤖 AI Editor Configuration

### Cursor
*   **Rules**: The project includes `.cursorrules` to instruct Cursor AI on project specifics (like using `ops_runner.py`).
*   **Chat**: Ask questions like "Where is the auth logic?" and Cursor will use the provided context updates.

### Windsurf
*   **Rules**: We include `.windsurfrules` for Windsurf/Codeium context.
*   **Flows**: Use Flows to chain multiple edits across files.

### VS Code (with Copilot)
*   Install the **GitHub Copilot** extension.
*   Use `@workspace` in chat to reference the codebase.

## ⚙️ Workspace Settings
The `.vscode/settings.json` file ensures consistent formatting:
*   **Format On Save**: Enabled for all files.
*   **Prettier**: Default formatter for JS/TS/JSON/Markdown.
*   **Dart Formatter**: Default for Dart files.

---
**Tip**: If you encounter permission issues with terminals, remember to use **Superpower Mode** (`ops_runner.py`) as defined in the rules.
