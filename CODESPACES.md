# GitHub Codespaces Quick Start

This file is automatically displayed when you open this project in GitHub Codespaces.

## 🚀 First-Time Setup (5 minutes)

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install admin panel dependencies
cd admin-panel && npm install && cd ..

# Install student app dependencies
cd student-app && flutter pub get && cd ..

# Install content engine dependencies
cd content-engine && pip install -r requirements.txt && cd ..
```

### 2. Configure Environment Variables

Create environment files with your Supabase credentials:

```bash
# Create admin panel env file
cat > admin-panel/.env.local << 'EOF'
VITE_SUPABASE_URL=https://zrxvlcvdtfqzqvgqjjvt.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
EOF

# Create test env file
cat > admin-panel/.env.test.local << 'EOF'
VITE_SUPABASE_URL=https://zrxvlcvdtfqzqvgqjjvt.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_TEST_USER_EMAIL=test@example.com
VITE_TEST_USER_PASSWORD=your_test_password
EOF
```

**⚠️ Get your actual keys from:**

- Supabase Dashboard → Project Settings → API
- Never commit these files (they're in .gitignore)

### 3. Verify Setup

```bash
# Run preflight checks
pwsh ./scripts/preflight.ps1

# If you see errors, check tasks.md for fixes
```

---

## 🎯 Current Task: Fix Lint Errors

**Status**: Deployment is blocked by 7 lint errors  
**Time**: ~15-30 minutes  
**See**: `tasks.md` for detailed instructions

**Quick Fix:**

```bash
cd admin-panel
npm run lint  # See the errors
# Fix the 'any' types in the 4 files listed
npm run lint  # Verify fixed
```

---

## 🔧 Common Commands

### Development

```bash
# Start admin panel dev server
cd admin-panel && npm run dev

# Start student app (Flutter web)
cd student-app && flutter run -d web-server --web-port 3000

# Run tests
cd admin-panel && npm test
cd student-app && flutter test
cd content-engine && pytest
```

### Testing

```bash
# Lint check
cd admin-panel && npm run lint

# Type check
cd admin-panel && npx tsc --noEmit

# Accessibility tests
cd admin-panel && npx playwright test tests/accessibility.spec.ts

# All E2E tests
cd admin-panel && npx playwright test
```

### Deployment

```bash
# Full deployment (from root)
pwsh ./orchestrator.ps1

# This runs:
# 1. Preflight checks (lint, typecheck, deps)
# 2. All test suites
# 3. Build & deploy to Cloudflare
```

---

## 📚 Documentation

- **Tasks & Priorities**: `tasks.md` (comprehensive guide)
- **Session Work**: `.agent/ui-improvements-feb-13.md`
- **Learning Log**: `docs/LEARNING_LOG.md`
- **Test Coverage**: `docs/reports/TEST_COVERAGE.md`

---

## 🆘 Troubleshooting

### "Command not found: pwsh"

```bash
# Use bash instead
bash ./scripts/preflight.sh  # If bash version exists
# OR install PowerShell
sudo apt-get update && sudo apt-get install -y powershell
```

### "Module not found" errors

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
cd admin-panel && rm -rf node_modules package-lock.json && npm install
```

### "Supabase connection failed"

```bash
# Check your .env.local files exist and have correct values
cat admin-panel/.env.local
# Should show VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
```

### Port already in use

```bash
# Kill process on port 5173 (admin panel)
lsof -ti:5173 | xargs kill -9

# Kill process on port 3000 (student app)
lsof -ti:3000 | xargs kill -9
```

---

## 🎓 Next Steps

1. ✅ Fix the 7 lint errors (see `tasks.md`)
2. ✅ Run `npm run lint` to verify
3. ✅ Run `pwsh ./orchestrator.ps1` to deploy
4. ✅ Implement super admin visibility features
5. ✅ Document your changes in `.agent/` directory

---

**Need Help?** Check `tasks.md` for detailed guides on:

- Documentation best practices
- Testing procedures
- Deployment workflow
- Common tasks reference

**Happy Coding! 🚀**
