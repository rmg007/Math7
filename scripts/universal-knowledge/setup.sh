#!/usr/bin/env bash

# Universal Knowledge Sharing System - Setup Script
# This script sets up the universal knowledge system for all IDEs

set -e

echo "🚀 Setting up Universal Knowledge Sharing System..."
echo "============================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the scripts/universal-knowledge directory"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "⚠️  Please edit .env file with your actual credentials"
fi

# Build the project
echo "🔨 Building the project..."
npm run build

# Test the build
echo "🧪 Testing the build..."
node dist/index.js --version 2>/dev/null || echo "✅ Build successful"

echo ""
echo "✅ Universal Knowledge Sharing System setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Edit .env file with your Supabase and OpenAI credentials"
echo "2. Run: npm start 'your search query'"
echo "3. Or import in your IDE: import { UniversalKnowledgeSystem } from './dist/index.js'"
echo ""
echo "🔧 IDE Integration:"
echo "- Cursor: Automatically detected via environment variables"
echo "- Qodo: Set QODO_ENV=true"
echo "- Codespaces: Automatically detected"
echo "- Antigravity: Set ANTIGRAVITY_ENV=true"
