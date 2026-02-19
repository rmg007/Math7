# Questerix — Tasks

## 🛡️ Phase 5: Certification & Release Sprint

- [x] **Logic Audit**: Run `/codescene` and `/forensics` to verify bootstrapping stability. (Verified - 13 Crit identified as false positives)
- [x] **Security Validation**: Run `/security-hardening-audit` to verify the new `apps_anon_read` RLS policy. (Verified)
- [x] **Security Validation**: Run `/security-hardening-workflow` to verify the new `apps_anon_read` RLS policy. (Verified)
- [x] **Functional Verification**: Run `npm run test:e2e` (Auth Flow) to ensure CSP doesn't block redirects. (Passed)
- [x] **Source Sync**: Push all fixes to GitHub (`git push`). (Done)
- [x] **Production Release**: Execute `powershell .\scripts\deploy-all.ps1`. (Done via orchestrator.ps1)

---

## Postponed

- [ ] (postponed) **P1: Visual Regression Suite**
- [ ] (postponed) **P3: Platform Settings**
- [ ] (postponed) **P3: Rollback Procedures**
