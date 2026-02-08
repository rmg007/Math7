# 🚀 Questerix Development Environment

This project uses a **hybrid development environment** that provides the best of both worlds: containerized web development and native mobile development. It's designed to work seamlessly with any AI coding agent.

## 🎯 Quick Start

### For New Developers

1. **Clone Repository**
   ```bash
   git clone <questerix-url>
   cd Questerix
   ```

2. **Automatic Setup**
   ```bash
   # Setup both environments (recommended)
   npm run setup:all
   
   # Or setup individually
   npm run setup:web      # Web development only
   npm run setup:mobile   # Mobile development only
   ```

3. **Start Development**
   ```bash
   npm run dev:web        # Admin panel (in container)
   npm run dev:mobile     # Student app (native)
   ```

### For AI Coding Agents

1. **Environment Detection**
   - Read `AGENT_QUICKSTART.md` for project overview
   - Run `npm run validate` to check environment status
   - Follow the workflow in `.agent/workflows/`

2. **Development Mode**
   - Web changes: Use DevContainer
   - Mobile changes: Use native Flutter
   - Cross-platform: Use unified scripts

## 📁 Project Structure

```
Questerix/
├── .devcontainer/
│   ├── devcontainer.json          # Web-focused container config
│   └── setup-web.sh              # Web environment setup
├── scripts/
│   ├── setup-mobile.sh           # Mobile setup (Linux/macOS)
│   ├── setup-mobile.ps1          # Mobile setup (Windows)
│   ├── validate-environment.sh   # Environment validation (Unix)
│   ├── validate-environment.ps1  # Environment validation (Windows)
│   └── cleanup-all.sh            # Cross-platform cleanup
├── admin-panel/                   # React app (containerized)
├── student-app/                   # Flutter app (native)
├── docs/
│   ├── HYBRID_DEVELOPMENT.md     # Architecture details
│   └── AGENT_COMPATIBILITY.md    # Agent-specific guide
├── AGENT_QUICKSTART.md           # Agent quick start guide
└── package.json                 # Unified scripts
```

## 🛠️ Development Commands

### Environment Setup
```bash
npm run setup:all         # Setup both environments
npm run setup:web         # Setup web environment only
npm run setup:mobile      # Setup mobile environment only
npm run validate          # Check environment health
```

### Development
```bash
npm run dev:web          # Start admin panel development
npm run dev:mobile       # Start Flutter development
npm run test:web         # Run web tests
npm run test:mobile      # Run mobile tests
```

### Building
```bash
npm run build:web        # Build web application
npm run build:mobile     # Build mobile APK
```

### Maintenance
```bash
npm run clean:web        # Clean web environment
npm run clean:mobile     # Clean mobile environment
npm run clean:all        # Clean both environments
npm run doctor:mobile    # Flutter doctor check
```

## 🔍 Environment Validation

Run validation to check your setup:

```bash
# Validate everything
npm run validate

# Validate specific environments
bash scripts/validate-environment.sh --web-only
bash scripts/validate-environment.sh --mobile-only
bash scripts/validate-environment.sh --shared-only
```

### What Validation Checks

1. **Web Environment**
   - Node.js 18+ installed
   - npm available
   - Project structure integrity
   - Dependencies installed

2. **Mobile Environment**
   - Flutter SDK installed
   - Android SDK configured
   - Device connectivity
   - Project dependencies

3. **Shared Environment**
   - Git repository status
   - Docker availability
   - Python installation
   - Environment files

4. **IDE/Agent Compatibility**
   - VS Code extensions
   - Cursor rules
   - DevContainer configuration
   - Agent documentation

## 🏗️ Architecture Overview

### Web Development (Containerized)
- **Technology**: Node.js 20, TypeScript, Vite, React, Tailwind CSS
- **Environment**: DevContainer with Docker
- **Features**: Hot reload, live preview, consistent environment
- **Access**: VS Code "Reopen in Container" or `devcontainer up`

### Mobile Development (Native)
- **Technology**: Flutter 3.24.5, Dart 3.5+, Android SDK
- **Environment**: Native installation
- **Features**: Full hardware access, device emulation, native performance
- **Setup**: `bash scripts/setup-mobile.sh` (Unix) or `scripts\setup-mobile.ps1` (Windows)

### Shared Infrastructure
- **Backend**: Supabase (Postgres + Edge Functions)
- **Database**: Migrations and schema management
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage

## 🤖 AI Agent Compatibility

This environment is optimized for AI coding agents:

### Supported Agents
- **Cursor**: Full compatibility with `.cursorrules`
- **Windsurf**: 13 specialized workflows in `.agent/workflows/`
- **GitHub Copilot**: VS Code integration
- **Antigravity**: Workflow support
- **Any Agent**: Universal documentation and scripts

### Agent Workflow
1. Read `AGENT_QUICKSTART.md`
2. Run `npm run validate`
3. Use unified scripts for consistency
4. Follow environment-specific workflows

## 🐛 Troubleshooting

### Common Issues

**DevContainer won't start**
```bash
docker --version          # Check Docker running
devcontainer up --rebuild # Rebuild container
```

**Flutter not found**
```bash
npm run setup:mobile     # Reinstall Flutter
source ~/.bashrc        # Reload environment
```

**Validation fails**
```bash
npm run validate --quiet # See summary only
npm run validate --web-only # Check specific area
```

**Performance issues**
```bash
npm run clean:all        # Clean caches
npm run validate         # Check environment
```

### Getting Help

1. **Check Validation**: `npm run validate`
2. **Read Documentation**: 
   - `docs/HYBRID_DEVELOPMENT.md` - Architecture details
   - `docs/AGENT_COMPATIBILITY.md` - Agent-specific guide
3. **Agent Guide**: `AGENT_QUICKSTART.md`
4. **Issue Template**: Include validation output

## 📊 Performance

### Setup Times
- **Full Setup**: 5-10 minutes
- **Web Only**: 2-3 minutes
- **Mobile Only**: 3-7 minutes
- **Validation**: <30 seconds

### Development Performance
- **Web Hot Reload**: <2 seconds
- **Mobile Hot Reload**: <3 seconds
- **Web Tests**: <30 seconds
- **Mobile Tests**: <1 minute

### Resource Usage
- **Web Container**: ~2GB RAM, ~1GB storage
- **Mobile Development**: ~4GB RAM, ~8GB storage
- **Total**: ~6GB RAM, ~9GB storage

## 🔄 Maintenance

### Regular Tasks
- **Weekly**: `npm run validate` to check environment health
- **Monthly**: `npm run clean:all` to remove accumulated caches
- **Quarterly**: Update SDK versions in setup scripts

### Version Updates
- **Flutter**: Update `FLUTTER_VERSION` in `setup-mobile.sh`
- **Node.js**: Update DevContainer base image
- **Dependencies**: Regular `npm update` and `flutter pub upgrade`

## 🎯 Best Practices

### Development
- Always run `npm run validate` before starting work
- Use environment-specific scripts for better performance
- Commit validation output with bug reports
- Keep documentation updated with environment changes

### AI Agent Integration
- Follow `AGENT_QUICKSTART.md` for initial setup
- Use validation output to diagnose issues
- Leverage unified scripts for consistent behavior
- Report environment-specific issues separately

### Team Collaboration
- Standardize on the same validation workflow
- Share validation outputs for debugging
- Document environment-specific workarounds
- Use the same script versions across team

## 📚 Documentation

- **`AGENT_QUICKSTART.md`** - Primary agent guide
- **`docs/HYBRID_DEVELOPMENT.md`** - Architecture and workflows
- **`docs/AGENT_COMPATIBILITY.md`** - Agent-specific compatibility
- **`.cursorrules`** - Cursor AI rules
- **`.agent/workflows/`** - Windsurf workflows

## 🚀 Advanced Usage

### Custom Development
```bash
# Development with specific environments
npm run validate --web-only && npm run dev:web
npm run validate --mobile-only && npm run dev:mobile

# Cross-platform testing
npm run test:web && npm run test:mobile

# Production builds
npm run build:web && npm run build:mobile
```

### Environment Debugging
```bash
# Detailed validation
bash scripts/validate-environment.sh --verbose

# Environment-specific debugging
bash scripts/validate-environment.sh --web-only --verbose
bash scripts/validate-environment.sh --mobile-only --verbose
```

### Performance Optimization
```bash
# Clean and rebuild
npm run clean:all
npm run setup:all

# Selective cleanup
npm run clean:web    # Web only
npm run clean:mobile # Mobile only
```

This hybrid environment provides optimal development experience for Questerix while maintaining excellent compatibility with AI coding agents. The separation of concerns ensures best performance for both web and mobile development while providing unified tooling and documentation.
