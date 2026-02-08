# Questerix Coding Standards

This directory contains all coding standards and development protocols for the Questerix project.

## 📚 Standards Documents

### [ORACLE_COGNITION.md](./ORACLE_COGNITION.md)
**Authority Level**: #3 (after AGENTS.md and kb_registry)
 
**Primary Standard** for all code development. Defines:
- ✅ **IDD Protocol** (Integrity-Driven Development) - The complete 5-phase cognitive framework for writing resilient code
- ✅ **Language-Specific Patterns** - Flutter/Dart, TypeScript/React, Python, SQL conventions
- ✅ **Bug Pattern Library** - Production-learned anti-patterns and fixes
- ✅ **Security Checklist** - Multi-tenant, RLS-first, input validation standards
- ✅ **Testing Standards** - Templates, conventions, and coverage requirements

**When to Use**: Every time you write or review code. This is the "how to think" guide.

---

## 🔗 Related Documentation

This directory is part of the larger Questerix documentation ecosystem:

- **[../best_practices.md](../best_practices.md)** - High-level project conventions (defer to ORACLE_COGNITION for details)
- **[../SECURITY.md](../SECURITY.md)** - Security model overview (defer to ORACLE_COGNITION for implementation)
- **[../AI_CODING_INSTRUCTIONS.md](../AI_CODING_INSTRUCTIONS.md)** - Authority hierarchy and agent rules
- **[../.cursorrules](../../.cursorrules)** - IDE-specific IDD Protocol instructions

---

## 📖 Authority Order

When there's a conflict between documents, follow this precedence:

1. **docs/strategy/AGENTS.md** (if exists)
2. **kb_registry** (knowledge items)
3. **docs/standards/ORACLE_COGNITION.md** ← YOU ARE HERE
4. **AI_CODING_INSTRUCTIONS.md**
5. **best_practices.md**
6. **SECURITY.md**
7. **README.md**

---

## 🚀 Quick Reference

| Need | Document | Section |
|------|----------|---------|
| Learn IDD Protocol | ORACLE_COGNITION.md | Part 1: The 5-Phase Loop |
| Write Flutter tests | ORACLE_COGNITION.md | Part 3: Flutter/Dart Testing |
| Write React tests | ORACLE_COGNITION.md | Part 3: TypeScript/React Testing |
| Review for security | ORACLE_COGNITION.md | Part 4: Security Checklist |
| Check forbidden patterns | ORACLE_COGNITION.md | Forbidden Patterns table |
| Understand multi-tenancy | ORACLE_COGNITION.md | Part 5: Multi-Tenant Patterns |

---

**Last Updated**: February 2026  
**Maintainer**: Questerix Dev Team
