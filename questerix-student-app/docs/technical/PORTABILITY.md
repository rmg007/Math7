# Questerix Portability & Setup Guide

This document provides instructions for setting up the Questerix development environment on any machine, IDE, or cloud-based coding agent.

## 🚀 Quick Start (3 Minutes)

The easiest way to get started is using the provided `Makefile`.

### 1. Prerequisites

Ensure you have the following tools installed:

- **Node.js** (v18.0.0+)
- **Flutter** (v3.19.0+)
- **Supabase CLI**

### 2. Environment Setup

Run the unified setup command to initialize the directory structure and verify your environment:

```bash
make setup
```

---

## 💻 Environment Specifics

### VS Code Dev Containers

Simply open the folder in VS Code. It will detect the `.devcontainer` and offer to "Reopen in Container". This will automatically provision a Linux environment with all tools pre-installed.

### Windows (WSL2 Recommended)

If you are developing directly on Windows, we strongly recommend using **WSL2 (Ubuntu)**.

1. Install WSL2: `wsl --install`
2. Clone the repo inside WSL.
3. Run `make setup`.

### macOS

1. Install Homebrew.
2. Install dependencies: `brew install node flutter-sdk supabase/tap/supabase`
3. Run `make setup`.

### Cloud Coding Agents (Cursor, Windsurf, etc.)

These agents usually run in a Linux environment.

1. Ensure your agent has access to `flutter` and `node`.
2. Run `make setup`.
3. Use `make web_dev` to start the Admin Panel.

---

## 🛠 Command Reference

| Command                | Description                         |
| ---------------------- | ----------------------------------- |
| `make setup`           | Initialize folders and verify tools |
| `make web_dev`         | Run Admin Panel (React/Vite)        |
| `make flutter_setup`   | Install Student App dependencies    |
| `make flutter_run_web` | Run Student App in Web mode         |
| `make db_start`        | Start local Supabase                |

---

## 🔑 Environment Variables

Copy `.env.example` to `.env` in the `admin-panel` directory and fill in your Supabase credentials.

```bash
cp admin-panel/.env.example admin-panel/.env
```
