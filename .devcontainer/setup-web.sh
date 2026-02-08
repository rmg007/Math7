#!/usr/bin/env bash
set -euo pipefail

echo "🚀 Setting up Questerix Web Development Environment..."

# Install system dependencies
echo "📦 Installing system dependencies..."
sudo apt-get update
sudo apt-get install -y curl git wget python3 python3-pip

# Install Supabase CLI
echo "🔧 Installing Supabase CLI..."
if ! command -v supabase &> /dev/null; then
    curl -L https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.tar.gz | tar xz
    sudo mv supabase /usr/local/bin/
    supabase --version
else
    echo "✅ Supabase CLI already installed"
fi

# Install Python dependencies for content engine
echo "🐍 Setting up Python environment..."
if [ -f "requirements.txt" ]; then
    pip3 install -r requirements.txt
fi

# Install Node.js dependencies for admin panel
echo "📦 Installing Node.js dependencies..."
if [ -d "admin-panel" ]; then
    cd admin-panel
    npm install
    echo "✅ Admin panel dependencies installed"
    cd ..
fi

# Install Node.js dependencies for tools
echo "🛠️ Installing tool dependencies..."
if [ -f "package.json" ]; then
    npm install
    echo "✅ Root dependencies installed"
fi

# Setup environment validation
echo "🔍 Setting up environment validation..."
cat > ~/.bashrc.d/questerix-web.sh << 'EOF'
# Questerix Web Development Environment
export QUESTERIX_ENV="web"
export QUESTERIX_MODE="development"
export NODE_ENV="development"

# Add Supabase to PATH if not already there
if ! command -v supabase &> /dev/null; then
    export PATH="$PATH:/usr/local/bin"
fi

# Questerix aliases
alias dev-web="cd admin-panel && npm run dev"
alias test-web="cd admin-panel && npm run test"
alias build-web="cd admin-panel && npm run build"
alias clean-web="cd admin-panel && rm -rf node_modules dist && npm install"
EOF

# Source the environment for current session
source ~/.bashrc.d/questerix-web.sh

echo "✅ Web development environment setup complete!"
echo ""
echo "🎯 Quick Start Commands:"
echo "  dev-web    - Start admin panel development server"
echo "  test-web   - Run web tests"
echo "  build-web  - Build for production"
echo "  clean-web  - Clean and reinstall dependencies"
echo ""
echo "🌐 Development server will be available at: http://localhost:5173"
