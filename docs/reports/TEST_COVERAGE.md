# 🧪 Questerix Test Coverage Matrix

**Status**: Phase 4 Remediation  
**Last Updated**: 2026-02-03  
**Enforcement**: All new features must have a corresponding entry here.

## 📱 Student App (Flutter)

| Feature | Source File | Test File | Type | Coverage |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | `lib/src/features/auth/providers/auth_provider.dart` | *Missing* (Using manual verification) | Unit | 0% |
| **Security** | `lib/src/core/security/security_service.dart` | `test/core/security/multi_tenant_isolation_test.dart` | Unit/Policy | 50% |
| **Widgets** | `lib/src/features/practice/widgets/*` | `test/features/practice/widgets/question_widgets_test.dart` | Widget | 80% |
| **Onboarding** | `lib/src/features/onboarding/screens/*` | `test/features/onboarding/screens/onboarding_screen_test.dart` | Widget | 90% |
| **Env** | `lib/src/core/config/env.dart` | *Implicit Build Failure Check* | Integration | 100% |

## 🖥️ Admin Panel (React)
*Coverage managed via Playwright E2E Tests*

| Feature | Source File | Spec File | Type | Coverage |
| :--- | :--- | :--- | :--- | :--- |
| **Login** | `src/features/auth/pages/LoginPage.tsx` | `tests/admin-panel.e2e.spec.ts` | E2E | 100% |
| **Curriculum** | `src/features/curriculum/*` | `tests/admin-panel.e2e.spec.ts` | E2E | 80% |

## 🛡️ Database (Supabase)
*Coverage managed via `supabase test` (pgTAP)*

| Policy | Details | Status |
| :--- | :--- | :--- |
| **Isolation** | `app_id` RLS checks | ⚠️ Pending automated verification |
| **Snapshots** | Content preservation | ✅ Verified by Migration `20260203000006` |
