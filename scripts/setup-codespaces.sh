#!/bin/bash
# Codespaces Environment Setup Script
# Run this after opening the Codespace for the first time

set -e  # Exit on error

echo "🚀 Setting up Questerix development environment..."
echo ""

# ============================================
# 1. Check for required environment variables
# ============================================
echo "📋 Checking environment variables..."

if [ -z "$VITE_SUPABASE_URL" ]; then
    echo "⚠️  VITE_SUPABASE_URL not set in Codespaces Secrets"
    echo "   Add it at: Settings → Codespaces → Secrets"
    echo "   Value: https://zrxvlcvdtfqzqvgqjjvt.supabase.co"
fi

if [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
    echo "⚠️  VITE_SUPABASE_ANON_KEY not set in Codespaces Secrets"
    echo "   Add it at: Settings → Codespaces → Secrets"
    echo "   Get from: Supabase Dashboard → Settings → API"
fi

# ============================================
# 2. Create .env.local files from Codespaces Secrets
# ============================================
echo ""
echo "📝 Creating .env.local files..."

# Admin Panel .env.local
if [ -n "$VITE_SUPABASE_URL" ] && [ -n "$VITE_SUPABASE_ANON_KEY" ]; then
    cat > admin-panel/.env.local << EOF
# Auto-generated from Codespaces Secrets
VITE_SUPABASE_URL=$VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
EOF
    echo "✅ Created admin-panel/.env.local"
else
    echo "⚠️  Skipping admin-panel/.env.local (missing secrets)"
    echo "   Copy admin-panel/.env.example to admin-panel/.env.local and fill in values"
fi

# Admin Panel .env.test.local
if [ -n "$VITE_SUPABASE_URL" ] && [ -n "$VITE_SUPABASE_ANON_KEY" ]; then
    cat > admin-panel/.env.test.local << EOF
# Auto-generated from Codespaces Secrets
VITE_SUPABASE_URL=$VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
VITE_TEST_USER_EMAIL=${VITE_TEST_USER_EMAIL:-test@example.com}
VITE_TEST_USER_PASSWORD=${VITE_TEST_USER_PASSWORD:-test123}
VITE_TEST_ADMIN_EMAIL=${VITE_TEST_ADMIN_EMAIL:-admin@test.com}
VITE_TEST_ADMIN_PASSWORD=${VITE_TEST_ADMIN_PASSWORD:-admin123}
EOF
    echo "✅ Created admin-panel/.env.test.local"
else
    echo "⚠️  Skipping admin-panel/.env.test.local (missing secrets)"
fi

# ============================================
# 3. Install dependencies
# ============================================
echo ""
echo "📦 Installing dependencies..."

# Root workspace
echo "  → Root workspace..."
npm install --silent

# Admin Panel
echo "  → Admin Panel..."
cd admin-panel && npm install --silent && cd ..

# Student App
if command -v flutter &> /dev/null; then
    echo "  → Student App..."
    cd student-app && flutter pub get && cd ..
else
    echo "⚠️  Flutter not found, skipping student-app"
fi

# Content Engine
if command -v python3 &> /dev/null; then
    echo "  → Content Engine..."
    cd content-engine && pip install -q -r requirements.txt && cd ..
else
    echo "⚠️  Python not found, skipping content-engine"
fi

# ============================================
# 4. Verify setup
# ============================================
echo ""
echo "🔍 Verifying setup..."

# Check if .env.local exists
if [ -f "admin-panel/.env.local" ]; then
    echo "✅ Environment variables configured"
else
    echo "⚠️  admin-panel/.env.local not found"
    echo "   Run: cp admin-panel/.env.example admin-panel/.env.local"
    echo "   Then edit with your actual values"
fi

# Check Node.js
if command -v node &> /dev/null; then
    echo "✅ Node.js $(node --version)"
else
    echo "❌ Node.js not found"
fi

# Check npm
if command -v npm &> /dev/null; then
    echo "✅ npm $(npm --version)"
else
    echo "❌ npm not found"
fi

# Check Flutter
if command -v flutter &> /dev/null; then
    echo "✅ Flutter $(flutter --version | head -n 1)"
else
    echo "⚠️  Flutter not found"
fi

# Check Python
if command -v python3 &> /dev/null; then
    echo "✅ Python $(python3 --version)"
else
    echo "⚠️  Python not found"
fi

# Check PowerShell
if command -v pwsh &> /dev/null; then
    echo "✅ PowerShell $(pwsh --version)"
else
    echo "⚠️  PowerShell not found (needed for deployment scripts)"
    echo "   Install: sudo apt-get install -y powershell"
fi

# ============================================
# 5. Next steps
# ============================================
echo ""
echo "✅ Setup complete!"
echo ""
echo "📚 Next steps:"
echo "   1. Read CODESPACES.md for quick start guide"
echo "   2. Read tasks.md for current priorities"
echo "   3. Fix lint errors: cd admin-panel && npm run lint"
echo "   4. Run tests: npm test"
echo "   5. Deploy: pwsh ./orchestrator.ps1"
echo ""
echo "🆘 Need help? Check .agent/HANDOFF.md"
echo ""
