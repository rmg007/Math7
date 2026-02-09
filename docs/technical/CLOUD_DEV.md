# Cloud Development Guide

This guide explains how to run the **Questerix** project in cloud-based development environments like **Replit** and **GitHub Codespaces**.

## ⚡ Replit

Questerix includes a dedicated `replit.nix` configuration for one-click setup.

### Quick Start
1.  **Fork/Import** this repository into Replit.
2.  Wait for the environment to provision. The `.replit` file automatically configures:
    *   Node.js 20
    *   Java 17 (JDK)
    *   Flutter SDK
    *   PostgreSQL 16
3.  Click the **"Run"** button. This will trigger a parallel workflow:
    *   **Admin Panel**: Starts on port `3001`.
    *   **Student App**: Starts on port `5000` (Flutter Web).

### Manual Setup
If the automatic run fails, you can start services manually from the Shell:

**Admin Panel:**
```bash
cd admin-panel
npm install
npm run dev -- --host 0.0.0.0
```

**Student App (Web):**
```bash
cd student-app
flutter pub get
flutter run -d web-server --web-port=5000 --web-hostname=0.0.0.0
```

## 📦 GitHub Codespaces

The project is fully configured for Codespaces via `.devcontainer`.

### Quick Start
1.  Go to the GitHub repository.
2.  Click **Code** -> **Codespaces** -> **Create codespace on main**.
3.  The container will build with all dependencies pre-installed (Node, Java, Flutter, Supabase CLI).

### Features
*   **Pre-installed Tools**: Node 20, Java 17, Flutter, Supabase CLI, Docker-in-Docker.
*   **Android Support**: The container includes scripts to set up Android SDK for mobile development (see `.devcontainer/setup-android.sh`).
*   **Volume Mounts**: Caches for `pub`, `npm`, and `maven` are persisted to speed up rebuilds.

### Initialization
Once the terminal opens:
1.  **Admin Panel**: `cd admin-panel && npm install && npm run dev`
2.  **Student App**: `cd student-app && flutter pub get && flutter run -d web-server`

## 🛠 Troubleshooting

*   **Flutter Web CanvasKit Error**: If you see CORS errors on Replit, ensure you are using the `html` renderer or configure the server headers properly.
    `flutter run -d web-server --web-renderer html`
*   **Port Forwarding**: Ensure ports 3000, 3001, and 5000 are public or forwarded correctly in your environment settings.
