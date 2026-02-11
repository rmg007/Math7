#!/bin/bash

# Questerix Minimal Viable Automation (MVA) Setup
# This script initializes Husky and lint-staged for cross-platform development.

echo "🚀 Setting up Questerix MVA..."

# 1. Install root dependencies
echo "📦 Installing root dependencies..."
npm install --save-dev husky lint-staged

# 2. Initialize Husky
echo "🎣 Initializing Husky..."
npx husky

# 3. Create pre-commit hook
echo "📝 Creating pre-commit hook..."
echo "npx lint-staged" > .husky/pre-commit

# 4. Create pre-push hook
echo "📝 Creating pre-push hook..."
cat > .husky/pre-push << 'EOF'
#!/bin/sh
echo "🔍 Running pre-push quality gates..."

echo "⚡ Checking admin-panel Types..."
cd admin-panel && npm run typecheck || exit 1

echo "⚡ Analyzing student-app Flutter..."
cd ../student-app && flutter analyze || exit 1

echo "✅ All quality gates passed!"
EOF

# 5. Ensure hooks are executable
chmod +x .husky/pre-commit
chmod +x .husky/pre-push

echo "✨ MVA Setup complete!"
echo "Try committing a file to see it in action."
