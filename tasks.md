# Questerix — Tasks

## 🛡️ Phase 5: Certification & Release Sprint

- [ ] **Logic Audit**: Run `/codescene` and `/forensics` to verify bootstrapping stability.
- [ ] **Security Validation**: Run `/security-hardening-audit` to verify the new `apps_anon_read` RLS policy.
- [ ] **Functional Verification**: Run `npm run test:e2e` (Auth Flow) to ensure CSP doesn't block redirects.
- [ ] **Source Sync**: Push all fixes to GitHub (`git push`).
- [ ] **Production Release**: Execute `powershell .\scripts\deploy-all.ps1`.

---

## Postponed

- [ ] (postponed) **P1: Visual Regression Suite**
- [ ] (postponed) **P3: Platform Settings**
- [ ] (postponed) **P3: Rollback Procedures**
