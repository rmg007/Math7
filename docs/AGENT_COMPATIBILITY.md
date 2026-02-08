# 🤖 AI Agent Compatibility Guide

This document provides comprehensive guidance for AI coding agents working with the Questerix hybrid development environment.

## 🎯 Agent Support Matrix

| Agent | Web Development | Mobile Development | Environment Setup | Validation | Documentation |
|-------|----------------|-------------------|------------------|------------|---------------|
| **Cursor** | ✅ Full | ✅ Full | ✅ Automated | ✅ Built-in | ✅ .cursorrules |
| **Windsurf** | ✅ Full | ✅ Full | ✅ Automated | ✅ Scripts | ✅ Workflows |
| **GitHub Copilot** | ✅ Full | ✅ Full | ✅ Semi-auto | ✅ Scripts | ✅ VS Code |
| **Antigravity** | ✅ Full | ✅ Full | ✅ Automated | ✅ Scripts | ✅ 13 workflows |
| **Claude Dev** | ✅ Full | ✅ Full | ✅ Semi-auto | ✅ Scripts | ✅ Universal |
| **Any Agent** | ✅ Full | ✅ Full | ✅ Scripts | ✅ Scripts | ✅ Universal |

## 🚀 Universal Agent Workflow

### Phase 0: Environment Discovery
```
1. Read AGENT_QUICKSTART.md (project overview)
2. Run npm run validate (environment check)
3. Read docs/HYBRID_DEVELOPMENT.md (architecture)
4. Check .cursorrules or .agent/workflows/ (agent-specific)
```

### Phase 1: Environment Setup
```
1. npm run setup:all (full setup)
2. npm run validate (verify setup)
3. npm run dev:web (test web environment)
4. npm run dev:mobile (test mobile environment)
```

### Phase 2: Development Mode
```
Web Changes:
- Open in DevContainer
- npm run dev:web
- Make changes
- npm run test:web

Mobile Changes:
- npm run dev:mobile
- Make changes
- npm run test:mobile

Cross-Platform:
- npm run validate
- Make changes in both environments
- npm run test:web && npm run test:mobile
```

## 🛠️ Agent-Specific Configurations

### Cursor Integration

**Configuration Files:**
- `.cursorrules`: Full development protocol
- `.vscode/settings.json`: IDE preferences
- `.vscode/extensions.json`: Required extensions

**Workflow:**
1. Load `.cursorrules` automatically
2. Use unified npm scripts
3. Leverage DevContainer for web development
4. Native Flutter for mobile development

**Key Commands:**
```bash
npm run validate          # Check environment
npm run dev:web          # Start web development
npm run dev:mobile       # Start mobile development
npm run setup:all        # Full environment setup
```

### Windsurf Integration

**Workflow Files:**
- `.agent/workflows/process.md`: Full development lifecycle
- `.agent/workflows/help.md`: Available commands
- `.agent/workflows/`: 13 specialized workflows

**Key Workflows:**
- `/process`: Complete development lifecycle
- `/setup`: Environment configuration
- `/validate`: Environment validation
- `/web`: Web development focus
- `/mobile`: Mobile development focus

**Persistent Knowledge Items:**
- Environment configuration
- Development status
- Common issues and solutions

### GitHub Copilot Integration

**VS Code Setup:**
- `.vscode/extensions.json`: Required extensions
- `.vscode/settings.json`: Optimal settings
- DevContainer integration

**Features:**
- Inline code completion
- Chat interface for guidance
- Integrated terminal commands
- DevContainer awareness

### Antigravity Integration

**Available Workflows:**
1. `/process` - Full development lifecycle
2. `/setup` - Environment configuration
3. `/validate` - Environment validation
4. `/web-dev` - Web development workflow
5. `/mobile-dev` - Mobile development workflow
6. `/test` - Testing workflow
7. `/build` - Build workflow
8. `/deploy` - Deployment preparation
9. `/debug` - Debugging workflow
10. `/cleanup` - Environment cleanup
11. `/docs` - Documentation workflow
12. `/review` - Code review workflow
13. `/help` - Help and commands

### Universal Agent Support

For any AI coding agent:

**Entry Points:**
1. `AGENT_QUICKSTART.md` - Project overview and quick start
2. `docs/HYBRID_DEVELOPMENT.md` - Architecture and workflows
3. `npm run validate` - Environment status
4. Unified scripts in root `package.json`

**Universal Commands:**
```bash
# Environment
npm run validate          # Check everything
npm run setup:all        # Setup both environments
npm run clean:all        # Clean everything

# Web Development
npm run dev:web          # Start web server
npm run test:web         # Run web tests
npm run build:web        # Build web app

# Mobile Development
npm run dev:mobile       # Start Flutter
npm run test:mobile      # Run mobile tests
npm run build:mobile     # Build mobile app
```

## 📋 Agent Capabilities

### Environment Detection
- Automatic OS detection
- Tool version checking
- Dependency validation
- Configuration verification

### Setup Automation
- Cross-platform installation
- Environment variable configuration
- SDK installation and setup
- Path configuration

### Development Support
- Hot reload for both environments
- Testing integration
- Build automation
- Error detection and reporting

### Troubleshooting
- Environment validation
- Issue diagnosis
- Repair suggestions
- Fallback mechanisms

## 🔧 Agent Commands Reference

### Environment Commands
```bash
npm run validate              # Full environment validation
npm run validate --web-only   # Web environment only
npm run validate --mobile-only # Mobile environment only
npm run validate --shared-only # Shared environment only
npm run validate --ide-only    # IDE compatibility only
npm run validate --quiet       # Summary only
```

### Setup Commands
```bash
npm run setup:all             # Setup both environments
npm run setup:web             # Setup web environment only
npm run setup:mobile          # Setup mobile environment only
```

### Development Commands
```bash
npm run dev:web               # Start web development server
npm run dev:mobile            # Start Flutter development
npm run test:web              # Run web tests
npm run test:mobile           # Run mobile tests
npm run build:web             # Build web application
npm run build:mobile          # Build mobile application
```

### Maintenance Commands
```bash
npm run clean:web             # Clean web environment
npm run clean:mobile          # Clean mobile environment
npm run clean:all             # Clean both environments
npm run doctor:mobile         # Flutter doctor check
```

## 🎯 Agent Best Practices

### Initial Setup
1. Always read `AGENT_QUICKSTART.md` first
2. Run `npm run validate` before making changes
3. Use unified scripts for consistency
4. Check agent-specific configurations

### Development Workflow
1. Validate environment before starting
2. Use appropriate development mode (web/mobile)
3. Run tests after making changes
4. Validate cross-platform compatibility

### Error Handling
1. Run validation to diagnose issues
2. Check environment-specific outputs
3. Use fallback commands if primary fails
4. Report validation output with issues

### Communication
1. Include validation output in bug reports
2. Specify environment (web/mobile) in issues
3. Use agent-specific workflows when available
4. Follow project documentation hierarchy

## 🚨 Common Agent Issues

### Environment Detection Issues
**Problem**: Agent cannot detect environment
```bash
# Solution
npm run validate --quiet
# Check output and follow recommendations
```

**Problem**: Setup script fails
```bash
# Solution
npm run setup:web    # For web issues
npm run setup:mobile # For mobile issues
# Check individual setup scripts
```

### Development Issues
**Problem**: Web development not working
```bash
# Solution
npm run validate --web-only
npm run clean:web
npm run dev:web
```

**Problem**: Mobile development not working
```bash
# Solution
npm run validate --mobile-only
npm run doctor:mobile
npm run clean:mobile
npm run dev:mobile
```

### Cross-Platform Issues
**Problem**: Changes work in one environment but not other
```bash
# Solution
npm run validate
npm run test:web && npm run test:mobile
# Check environment-specific configurations
```

## 📊 Agent Performance Metrics

### Setup Performance
- **Full Setup**: 5-10 minutes
- **Web Only**: 2-3 minutes
- **Mobile Only**: 3-7 minutes
- **Validation**: <30 seconds

### Development Performance
- **Web Hot Reload**: <2 seconds
- **Mobile Hot Reload**: <3 seconds
- **Web Tests**: <30 seconds
- **Mobile Tests**: <1 minute

### Agent Integration
- **Environment Detection**: <5 seconds
- **Command Execution**: <2 seconds
- **Validation**: <30 seconds
- **Error Diagnosis**: <10 seconds

## 🔄 Agent Evolution

### Version Compatibility
- **Node.js**: 18+ required for web
- **Flutter**: 3.24.5+ for mobile
- **Python**: 3.8+ for content engine
- **Docker**: Optional for web containerization

### Future Enhancements
- Additional agent support
- Enhanced automation
- Improved error handling
- Performance optimizations

### Feedback Loop
- Report agent-specific issues
- Suggest workflow improvements
- Contribute to documentation
- Share optimization tips

## 📚 Agent Resources

### Documentation
- `AGENT_QUICKSTART.md` - Primary agent guide
- `docs/HYBRID_DEVELOPMENT.md` - Architecture details
- `docs/AGENT_COMPATIBILITY.md` - This file
- `.cursorrules` - Cursor-specific rules
- `.agent/workflows/` - Windsurf workflows

### Scripts
- `scripts/validate-environment.sh` - Environment validation
- `scripts/setup-mobile.sh` - Mobile setup (Unix)
- `scripts/setup-mobile.ps1` - Mobile setup (Windows)
- `.devcontainer/setup-web.sh` - Web setup

### Configuration
- `.devcontainer/devcontainer.json` - Web container config
- `package.json` - Unified scripts
- `.vscode/` - VS Code configuration
- `.agent/` - Agent-specific configurations

This guide ensures that any AI coding agent can effectively work with the Questerix hybrid development environment, providing consistent, reliable, and efficient development workflows across all platforms and tools.
