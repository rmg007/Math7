# Oracle Plus CLI

Specification-driven development tool for Questerix.

## Installation

```bash
npm install -g @questerix/oracle-plus
```

Or from source:

```bash
cd tools/oracle-plus
npm install
npm run build
npm link
```

## Quick Start

```bash
# Set environment variables
export SUPABASE_URL=your_url
export SUPABASE_ANON_KEY=your_key
export GEMINI_API_KEY=your_key
export OPENAI_API_KEY=your_key

# Check all specifications
oracle-plus check --all

# Generate test from spec
oracle-plus generate-tests --spec-id <uuid> --framework mocktail

# Create drift report
oracle-plus report --output drift.md
```

## Commands

- `check` - Run drift analysis
- `index` - Generate embeddings
- `generate-tests` - Create test boilerplate
- `report` - Generate reports

See [full documentation](../../brain/06c33a83-214b-4e8c-9c62-d495fc3d10de/oracle_plus_documentation.md) for details.
