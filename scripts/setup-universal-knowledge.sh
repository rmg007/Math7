#!/usr/bin/env bash

# Universal Knowledge Integration Script
# Sets up universal knowledge sharing for all IDEs

set -e

echo "🔗 Setting up Universal Knowledge Sharing Integration..."
echo "=================================================="

# Get the root directory of the Questerix project
QUESTERIX_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
UNIVERSAL_DIR="$QUESTERIX_ROOT/scripts/universal-knowledge"

echo "📁 Questerix Root: $QUESTERIX_ROOT"
echo "📁 Universal Knowledge Dir: $UNIVERSAL_DIR"

# Check if universal knowledge system is built
if [ ! -d "$UNIVERSAL_DIR/dist" ]; then
    echo "🔨 Building Universal Knowledge System..."
    cd "$UNIVERSAL_DIR"
    npm run build
    cd "$QUESTERIX_ROOT"
fi

# Create IDE-specific integration scripts

echo "📝 Creating IDE integration scripts..."

# Cursor integration
cat > "$QUESTERIX_ROOT/.cursor/knowledge-integration.js" << 'EOF'
// Cursor Knowledge Integration
const { UniversalKnowledgeSystem } = require('../../scripts/universal-knowledge/dist/index.js');

async function searchKnowledge(query) {
    const system = new UniversalKnowledgeSystem();
    await system.initialize();
    return await system.search(query);
}

// Export for Cursor usage
global.searchUniversalKnowledge = searchKnowledge;

console.log('✅ Cursor Knowledge Integration loaded');
EOF

# Qodo integration  
cat > "$QUESTERIX_ROOT/.qodo/knowledge-integration.js" << 'EOF'
// Qodo Knowledge Integration
const { UniversalKnowledgeSystem } = require('../../scripts/universal-knowledge/dist/index.js');

async function searchKnowledge(query) {
    const system = new UniversalKnowledgeSystem();
    await system.initialize();
    return await system.search(query);
}

// Export for Qodo usage
global.searchUniversalKnowledge = searchKnowledge;

console.log('✅ Qodo Knowledge Integration loaded');
EOF

# Codespaces integration
cat > "$QUESTERIX_ROOT/.devcontainer/knowledge-integration.sh" << 'EOF'
#!/bin/bash
# Codespaces Knowledge Integration

echo "🔧 Setting up Universal Knowledge for Codespaces..."

# Set environment variables
export UNIVERSAL_KNOWLEDGE_ENABLED=true
export UNIVERSAL_KNOWLEDGE_PATH="/workspace/scripts/universal-knowledge"

# Add to PATH
export PATH="\$PATH:\$UNIVERSAL_KNOWLEDGE_PATH/dist"

# Create alias for easy access
alias uk-search="node \$UNIVERSAL_KNOWLEDGE_PATH/dist/index.js"

echo "✅ Codespaces Knowledge Integration complete"
echo "💡 Use 'uk-search \"your query\"' to search knowledge base"
EOF

# Antigravity integration
cat > "$QUESTERIX_ROOT/.agent/workflows/knowledge-search.md" << 'EOF'
---
description: Universal Knowledge Search
---

# 🔍 Universal Knowledge Search

Search the universal knowledge base for any topic.

## Usage
\`\`\`bash
/knowledge-search "your search query"
\`\`\`

## Examples
- `/knowledge-search "How does offline sync work?"`
- `/knowledge-search "Flutter testing patterns"`
- `/knowledge-search "Supabase RLS policies"`

## Integration
This workflow integrates with the Universal Knowledge Sharing System to provide consistent search results across all IDEs.

---

// turbo
npm run --prefix scripts/universal-knowledge start "QUERY"
EOF

# Make scripts executable
chmod +x "$QUESTERIX_ROOT/.devcontainer/knowledge-integration.sh"

# Create global configuration
cat > "$QUESTERIX_ROOT/.universal-knowledge-config.json" << 'EOF'
{
  "version": "1.0.0",
  "enabled": true,
  "default_threshold": 0.5,
  "default_count": 5,
  "cache_enabled": true,
  "fallback_enabled": true,
  "ide_specific": {
    "cursor": {
      "enabled": true,
      "config_files": [".cursorrules", "AI_CODING_INSTRUCTIONS.md"]
    },
    "qodo": {
      "enabled": true,
      "config_files": ["QODO_GUIDE.md"]
    },
    "codespaces": {
      "enabled": true,
      "config_files": [".devcontainer/devcontainer.json"]
    },
    "antigravity": {
      "enabled": true,
      "config_files": [".agent/workflows/", ".cursorrules"]
    }
  }
}
EOF

echo ""
echo "✅ Universal Knowledge Integration complete!"
echo ""
echo "📋 Integration Summary:"
echo "  🟢 Cursor: .cursor/knowledge-integration.js"
echo "  🟢 Qodo: .qodo/knowledge-integration.js"
echo "  🟢 Codespaces: .devcontainer/knowledge-integration.sh"
echo "  🟢 Antigravity: .agent/workflows/knowledge-search.md"
echo "  🟢 Global Config: .universal-knowledge-config.json"
echo ""
echo "🚀 Next steps:"
echo "  1. Configure your .env file in scripts/universal-knowledge/"
echo "  2. Test with: npm run --prefix scripts/universal-knowledge start 'test query'"
echo "  3. Check IDE-specific integration files for usage instructions"
echo ""
echo "📚 For detailed documentation, see: scripts/universal-knowledge/README.md"
