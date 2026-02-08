# Admin Panel

The Admin Panel for Math7, built with React, Vite, TypeScript, and **shadcn/ui**.

## 🛠 Tech Stack

- **Framework**: React + Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: React Query (server) + Context (local)
- **Forms**: React Hook Form + Zod
- **Icons**: Lucide React
- **Backend Integration**: Supabase Client

## development

### Prerequisites
- Node.js (v18+)
- Supabase project credentials (in `.env`)

### Installation

```bash
npm install
```

### UI Components (shadcn/ui)

We use `shadcn/ui` for our component library.

- **Guide**: See [`../docs/SHADCN_GUIDE.md`](../docs/SHADCN_GUIDE.md) for detailed instructions.
- **Add Component**:
  ```bash
  npx shadcn@latest add component-name
  ```

### Running Locally

```bash
npm run dev
```

## Testing

We have a comprehensive End-to-End (E2E) test suite using Playwright.

- **[Quick Start Guide](tests/QUICKSTART.md)** - Start here!
- **[Test Documentation](tests/INDEX.md)** - Complete guide

### Running Tests

```bash
# Run tests (Interactive UI - Recommended)
npm run test:e2e:ui

# Run tests (Headless)
npm run test:e2e

# Run tests (Browser visible)
npm run test:e2e:headed
```

## ✨ Features
 
- **AI Curriculum Assistant**: Generate smart, curriculum-aligned questions from PDF, Word, and Text documents using Google Gemini. Found in the **Questions** tab.
- **Bulk Import/Export**: Robust CSV/JSON handling for large datasets.
- **Dynamic Curriculum**: Real-time management of Domains, Skills, and Questions.
- **Multi-Tenant**: Support for different app contexts and domains.

See [AI_SETUP_INSTRUCTIONS.md](AI_SETUP_INSTRUCTIONS.md) for details on the AI feature.
