# 🧪 Questerix Test Coverage Matrix

**Status**: Phase 4 Remediation  
**Last Updated**: 2026-02-11  
**Enforcement**: All new features must have a corresponding entry here.

## 📱 Student App (Flutter)

| Feature        | Source File                                                  | Test File                                                      | Type        | Coverage |
| :------------- | :----------------------------------------------------------- | :------------------------------------------------------------- | :---------- | :------- |
| **Auth**       | `lib/src/features/auth/providers/auth_provider.dart`         | `test/features/auth/providers/auth_provider_test.dart`         | Unit        | 90%      |
| **Session**    | `lib/src/features/auth/repositories/session_repository.dart` | `test/features/auth/repositories/session_repository_test.dart` | Unit        | 95%      |
| **Security**   | `lib/src/core/security/security_service.dart`                | `test/core/security/multi_tenant_isolation_test.dart`          | Unit/Policy | 50%      |
| **Widgets**    | `lib/src/features/practice/widgets/*`                        | `test/features/practice/widgets/question_widgets_test.dart`    | Widget      | 80%      |
| **Onboarding** | `lib/src/features/onboarding/screens/*`                      | `test/features/onboarding/screens/onboarding_screen_test.dart` | Widget      | 90%      |
| **Env**        | `lib/src/core/config/env.dart`                               | _Implicit Build Failure Check_                                 | Integration | 100%     |

## 🖥️ Admin Panel (React)

_Coverage managed via Playwright E2E Tests_

| Feature             | Source File                                           | Spec File                                                            | Type       | Coverage           |
| :------------------ | :---------------------------------------------------- | :------------------------------------------------------------------- | :--------- | :----------------- |
| **Login**           | `src/features/auth/pages/LoginPage.tsx`               | `tests/admin-panel.e2e.spec.ts`                                      | E2E        | 100%               |
| **Curriculum**      | `src/features/curriculum/*`                           | `tests/admin-panel.e2e.spec.ts`                                      | E2E        | 80%                |
| **Domains Hook**    | `src/features/curriculum/hooks/use-domains.ts`        | `src/features/curriculum/hooks/__tests__/use-domains.test.tsx`       | Unit       | 95%                |
| **Questions Hook**  | `src/features/curriculum/hooks/use-questions.ts`      | `src/features/curriculum/hooks/__tests__/use-questions.test.tsx`     | Unit       | 90%                |
| **Apps Hook**       | `src/features/platform/hooks/use-apps.ts`             | `src/features/platform/hooks/__tests__/use-apps.test.tsx`            | Unit       | 90%                |
| **AI Governance**   | `src/features/ai-assistant/api/governedGeneration.ts` | `src/features/ai-assistant/api/__tests__/governedGeneration.test.ts` | Unit       | 100%               |
| **Monitoring**      | `src/features/monitoring/*`                           | `tests/monitoring.e2e.spec.ts`                                       | E2E        | 70%                |
| **OVERALL (Admin)** | `src/`                                                | `...`                                                                | **Hybrid** | ✅ **GATED (70%)** |

## 🧠 AI Content Engine (Python)

_Coverage managed via `pytest --cov`_

| Component              | Source Dir        | Test Dir                           | Coverage | Status             |
| :--------------------- | :---------------- | :--------------------------------- | :------- | :----------------- |
| **Document Parser**    | `src/parsers/`    | `tests/test_document_parser.py`    | 98%      | ✅ Stabilized      |
| **Question Generator** | `src/generators/` | `tests/test_question_generator.py` | 98%      | ✅ Verified        |
| **CLI & Main**         | `src/__main__.py` | `tests/test_main.py`               | 81%      | ✅ Verified        |
| **Validators**         | `src/validators/` | `tests/test_question_generator.py` | 87%      | ✅ Verified        |
| **OVERALL**            | `src/`            | `tests/`                           | **91%**  | ✅ **GATED (80%)** |

## 🛡️ Database (Supabase)

_Coverage managed via `supabase test` (pgTAP)_

| Policy        | Details              | Status                                    |
| :------------ | :------------------- | :---------------------------------------- |
| **Isolation** | `app_id` RLS checks  | ⚠️ Pending automated verification         |
| **Snapshots** | Content preservation | ✅ Verified by Migration `20260203000006` |
