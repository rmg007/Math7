# 🏗️ Questerix Hybrid Development Environment

This document describes the hybrid development environment designed for Questerix, providing optimal development experience for both web and mobile development while maintaining compatibility with any AI coding agent.

## 🎯 Architecture Overview

The hybrid architecture separates web and mobile development environments to provide the best of both worlds:

```
┌─────────────────────────────────────────────────────────────┐
│                    Questerix Project                        │
├─────────────────────────────────────────────────────────────┤
│  Web Development (Containerized)                            │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  DevContainer: admin-panel + tools                 │    │
│  │  - Node.js 20 + TypeScript + Vite                  │    │
│  │  - Supabase CLI + Python tools                     │    │
│  │  - Hot reload + Live preview                       │    │
│  └─────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│  Mobile Development (Native)                                │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Native Setup: student-app                          │    │
│  │  - Flutter SDK + Android SDK                        │    │
│  │  - Device emulation + USB debugging                 │    │
│  │  - Full performance + hardware access               │    │
│  └─────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│  Shared Services & Infrastructure                           │
│  - Supabase (cloud)                                        │
│  - Database migrations                                     │
│  - Environment configuration                               │
│  - Cross-platform scripts                                  │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

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
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── student-app/                   # Flutter app (native)
│   ├── lib/
│   ├── pubspec.yaml
│   └── android/
├── docs/
│   ├── HYBRID_DEVELOPMENT.md     # This file
│   └── AGENT_COMPATIBILITY.md    # Agent-specific notes
├── .vscode/
│   ├── extensions.json
│   └── settings.json
├── .cursorrules                  # Cursor AI rules
├── AGENT_QUICKSTART.md           # Agent quick start guide
└── package.json                 # Root package with unified scripts
```

## 🛠️ Development Environments

### Web Development (Containerized)

**Technology Stack:**
- Node.js 20
- TypeScript 5
- Vite 5
- React 18
- Tailwind CSS
- Supabase CLI

**Features:**
- ✅ Hot module replacement
- ✅ Live preview
- ✅ Consistent environment
- ✅ Zero configuration
- ✅ Integrated testing

**Access Methods:**
1. **VS Code**: Reopen in Container
2. **CLI**: `devcontainer up`
3. **Scripts**: `npm run dev:web`

**Development Workflow:**
```bash
# Start development server
npm run dev:web

# Run tests
npm run test:web

# Build for production
npm run build:web

# Clean and reinstall
npm run clean:web
```

### Mobile Development (Native)

**Technology Stack:**
- Flutter 3.24.5
- Dart 3.5+
- Android SDK 34
- Riverpod 2.6
- Drift 2.24
- Supabase Flutter

**Features:**
- ✅ Full hardware access
- ✅ Android emulation
- ✅ USB debugging
- ✅ Native performance
- ✅ Device testing

**Setup Methods:**
1. **Linux/macOS**: `bash scripts/setup-mobile.sh`
2. **Windows**: `scripts\setup-mobile.ps1`
3. **Manual**: Follow Flutter installation guide

**Development Workflow:**
```bash
# Start development (with device)
npm run dev:mobile

# Run tests
npm run test:mobile

# Build APK
npm run build:mobile

# Clean and reinstall
npm run clean:mobile

# Check environment
npm run doctor:mobile
```

## 🔧 Unified Scripts

The root `package.json` provides unified commands for both environments:

```json
{
  "scripts": {
    "setup:all": "npm run setup:web && npm run setup:mobile",
    "setup:web": "devcontainer up --workspace-folder .",
    "setup:mobile": "bash scripts/setup-mobile.sh",
    "dev:web": "cd admin-panel && npm run dev",
    "dev:mobile": "cd student-app && flutter run",
    "test:web": "cd admin-panel && npm run test",
    "test:mobile": "cd student-app && flutter test",
    "build:web": "cd admin-panel && npm run build",
    "build:mobile": "cd student-app && flutter build apk",
    "clean:web": "cd admin-panel && rm -rf node_modules dist && npm install",
    "clean:mobile": "cd student-app && flutter clean && flutter pub get",
    "validate": "bash scripts/validate-environment.sh",
    "doctor:mobile": "flutter doctor -v",
    "clean:all": "bash scripts/cleanup-all.sh"
  }
}
```

## 🔍 Environment Validation

The validation system ensures your development environment is properly configured:

### Running Validation

```bash
# Validate everything
npm run validate

# Validate specific environments
bash scripts/validate-environment.sh --web-only
bash scripts/validate-environment.sh --mobile-only
bash scripts/validate-environment.sh --shared-only
```

### Validation Categories

1. **Web Environment**
   - Node.js version (18+ required)
   - npm availability
   - Project structure integrity
   - Dependency installation status

2. **Mobile Environment**
   - Flutter SDK installation
   - Android SDK configuration
   - Device connectivity
   - Project dependencies

3. **Shared Environment**
   - Git repository status
   - Docker availability (optional)
   - Python installation
   - Environment files

4. **IDE/Agent Compatibility**
   - VS Code extensions
   - Cursor rules
   - DevContainer configuration
   - Agent documentation

## 🤖 AI Agent Compatibility

### Supported Agents

- **Cursor**: Full compatibility with `.cursorrules`
- **Windsurf**: Workflow support in `.agent/workflows/`
- **GitHub Copilot**: VS Code integration
- **Antigravity**: 13 available workflows
- **Any Agent**: Universal documentation and scripts

### Agent Workflow

1. **Initial Setup**
   ```
   Read AGENT_QUICKSTART.md → Run npm run validate → Follow recommendations
   ```

2. **Web Development**
   ```
   Open in DevContainer → npm run dev:web → Make changes → Test
   ```

3. **Mobile Development**
   ```
   npm run setup:mobile → npm run dev:mobile → Make changes → Test
   ```

4. **Cross-Platform Changes**
   ```
   npm run validate → Make changes → npm run test:web && npm run test:mobile
   ```

## 🔄 Development Workflow

### Feature Development

1. **Start New Feature**
   ```bash
   git checkout -b feature/new-feature
   npm run validate
   ```

2. **Web Changes**
   ```bash
   # Open in DevContainer
   npm run dev:web
   # Make changes
   npm run test:web
   ```

3. **Mobile Changes**
   ```bash
   npm run dev:mobile
   # Make changes
   npm run test:mobile
   ```

4. **Integration Testing**
   ```bash
   npm run validate
   npm run test:web
   npm run test:mobile
   ```

5. **Deployment Preparation**
   ```bash
   npm run build:web
   npm run build:mobile
   git add .
   git commit -m "feat: new feature"
   ```

### Bug Fixing

1. **Identify Environment**
   ```bash
   npm run validate --web-only    # Web issue?
   npm run validate --mobile-only # Mobile issue?
   ```

2. **Isolate and Fix**
   ```bash
   npm run dev:web    # For web bugs
   npm run dev:mobile # For mobile bugs
   ```

3. **Test Fix**
   ```bash
   npm run test:web
   npm run test:mobile
   ```

## 🐛 Troubleshooting

### Common Issues

#### Web Development Issues

**Problem**: DevContainer won't start
```bash
# Solution
docker --version          # Check Docker running
devcontainer up --rebuild # Rebuild container
```

**Problem**: npm install fails
```bash
# Solution
npm run clean:web        # Clean and reinstall
npm cache clean --force  # Clear npm cache
```

#### Mobile Development Issues

**Problem**: Flutter not found
```bash
# Solution
npm run setup:mobile     # Reinstall Flutter
source ~/.bashrc        # Reload environment
```

**Problem**: Android device not detected
```bash
# Solution
npm run doctor:mobile   # Check Flutter doctor
adb devices             # Check ADB devices
```

#### Environment Issues

**Problem**: Validation fails
```bash
# Solution
npm run validate --quiet # See summary only
npm run validate --web-only # Check specific area
```

### Getting Help

1. **Check Validation**: `npm run validate`
2. **Read Documentation**: `docs/HYBRID_DEVELOPMENT.md`
3. **Agent Guide**: `AGENT_QUICKSTART.md`
4. **Issue Template**: Use GitHub issues with validation output

## 📊 Performance Considerations

### Web Development
- **Build Time**: <2 minutes (first time)
- **Hot Reload**: <2 seconds
- **Memory Usage**: ~2GB (container)
- **Storage**: ~1GB (container + cache)

### Mobile Development
- **Setup Time**: 5-10 minutes (first time)
- **Hot Reload**: <3 seconds
- **Memory Usage**: ~4GB (Flutter + emulator)
- **Storage**: ~8GB (SDK + tools)

### Optimization Tips

1. **Use Volume Mounts**: Persistent caches reduce rebuild time
2. **Parallel Development**: Work on web and mobile simultaneously
3. **Selective Validation**: Use `--web-only` or `--mobile-only` for faster checks
4. **Regular Cleanup**: `npm run clean:all` to free space

## 🔄 Maintenance

### Regular Tasks

- **Weekly**: `npm run validate` to check environment health
- **Monthly**: `npm run clean:all` to remove accumulated caches
- **Quarterly**: Update SDK versions in setup scripts

### Version Updates

1. **Flutter**: Update `FLUTTER_VERSION` in `setup-mobile.sh`
2. **Node.js**: Update DevContainer base image
3. **Dependencies**: Regular `npm update` and `flutter pub upgrade`

### Backup and Recovery

- **Configuration**: All settings in version control
- **Caches**: Use volume mounts for persistence
- **Recovery**: `npm run setup:all` restores full environment

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

This hybrid environment provides the optimal balance of performance, consistency, and flexibility for Questerix development while maintaining excellent compatibility with AI coding agents.
