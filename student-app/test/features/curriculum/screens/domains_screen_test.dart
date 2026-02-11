import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:questerix_domain/questerix_domain.dart' as model;
import 'package:mocktail/mocktail.dart';
import 'package:drift/drift.dart';
import 'package:student_app/src/core/core_providers.dart';
import 'package:student_app/src/core/sync/sync_service.dart';
import 'package:student_app/src/features/curriculum/repositories/curriculum_repositories.dart';
import 'package:student_app/src/features/curriculum/screens/domains_screen.dart';
import 'package:student_app/src/features/progress/repositories/skill_progress_repository.dart';
// Legacy imports removed

class MockCurriculumRepository extends Mock implements CurriculumRepository {}

class MockSkillProgressRepository extends Mock
    implements SkillProgressRepository {}

// class MockSkillRepository is now MockCurriculumRepository

class MockSyncService extends StateNotifier<SyncState>
    with Mock
    implements SyncService {
  MockSyncService() : super(SyncState.idle());
}

void main() {
  setUpAll(() {
    driftRuntimeOptions.dontWarnAboutMultipleDatabases = true;
  });

  late MockCurriculumRepository mockCurriculumRepository;
  late MockSkillProgressRepository mockSkillProgressRepository;
  late MockSyncService mockSyncService;

  setUp(() {
    mockCurriculumRepository = MockCurriculumRepository();
    mockSkillProgressRepository = MockSkillProgressRepository();
    mockSyncService = MockSyncService();

    when(() => mockSkillProgressRepository.getMasteryForDomain(any()))
        .thenAnswer((_) async => 50);
    when(() => mockSkillProgressRepository.getPointsForDomain(any()))
        .thenAnswer((_) async => 100);

    when(() => mockSyncService.sync()).thenAnswer((_) async {});

    // Default stub for SkillsScreen loading
    when(() => mockCurriculumRepository.watchByDomain(any()))
        .thenAnswer((_) => const Stream.empty());
  });

  Widget createWidgetUnderTest({Map<String, WidgetBuilder>? routes}) {
    return ProviderScope(
      overrides: [
        domainRepositoryProvider.overrideWithValue(mockCurriculumRepository),
        skillProgressRepositoryProvider
            .overrideWithValue(mockSkillProgressRepository),
        skillRepositoryProvider.overrideWithValue(mockCurriculumRepository),
        connectivityServiceProvider
            .overrideWith((ref) => Stream.value(ConnectivityStatus.online)),
        syncServiceProvider.overrideWith((ref) => mockSyncService),
      ],
      child: MaterialApp(
        home: const DomainsScreen(),
        routes: routes ?? {},
      ),
    );
  }

  group('DomainsScreen Widget Tests', () {
    testWidgets('displays loading indicator when loading',
        (WidgetTester tester) async {
      await _setMobileSize(tester);
      // Use a controller to keep the stream active and in 'waiting' state
      final controller = StreamController<List<model.Domain>>();
      addTearDown(() => controller.close());

      when(() => mockCurriculumRepository.watchAllPublished())
          .thenAnswer((_) => controller.stream);

      await tester.pumpWidget(createWidgetUnderTest());
      await tester.pump();
      // Do not pumpAndSettle here as it would wait for stream to close or emit

      expect(find.byType(CircularProgressIndicator), findsOneWidget);

      await _cleanup(tester);
    });

    testWidgets('displays domains list when data is loaded',
        (WidgetTester tester) async {
      await _setMobileSize(tester);
      final mockDomains = [
        model.Domain(
          id: 'test-1',
          slug: 'algebra',
          title: 'Algebra',
          description: 'Algebraic concepts',
          sortOrder: 1,
          isPublished: true,
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        ),
        model.Domain(
          id: 'test-2',
          slug: 'geometry',
          title: 'Geometry',
          description: 'Geometric concepts',
          sortOrder: 2,
          isPublished: true,
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        ),
      ];

      when(() => mockCurriculumRepository.watchAllPublished())
          .thenAnswer((_) => Stream.value(mockDomains));

      await tester.pumpWidget(createWidgetUnderTest());
      await tester.pumpAndSettle();

      expect(find.text('Algebra'), findsOneWidget);

      await _cleanup(tester);
    });

    testWidgets('displays empty state when no domains',
        (WidgetTester tester) async {
      await _setMobileSize(tester);
      when(() => mockCurriculumRepository.watchAllPublished())
          .thenAnswer((_) => Stream.value([]));

      await tester.pumpWidget(createWidgetUnderTest());
      await tester.pumpAndSettle();

      expect(find.text('No subjects available yet'), findsOneWidget);

      await _cleanup(tester);
    });

    testWidgets('navigates to skills screen when domain is tapped',
        (WidgetTester tester) async {
      await _setMobileSize(tester);
      final mockDomains = [
        model.Domain(
          id: 'test-1',
          slug: 'algebra',
          title: 'Algebra',
          description: 'Algebraic concepts',
          sortOrder: 1,
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        ),
      ];

      when(() => mockCurriculumRepository.watchAllPublished())
          .thenAnswer((_) => Stream.value(mockDomains));

      await tester.pumpWidget(createWidgetUnderTest(
        routes: {
          '/skills': (context) => const Scaffold(body: Text('Skills Screen')),
        },
      ));

      await tester.pumpAndSettle();

      await tester.tap(find.text('Algebra'));
      // This pumpAndSettle triggers the navigation and subsequent build of the pushed route (or SkillsScreen)
      // Since we mocked SkillRepository, SkillsScreen build should proceed without error (loading state).
      await tester.pumpAndSettle();

      await _cleanup(tester);
    });

    testWidgets('displays error message when loading fails',
        (WidgetTester tester) async {
      await _setMobileSize(tester);
      when(() => mockCurriculumRepository.watchAllPublished())
          .thenAnswer((_) => Stream.error(Exception('Error loading domains')));

      await tester.pumpWidget(createWidgetUnderTest());
      await tester.pumpAndSettle();

      expect(find.textContaining('Something'), findsOneWidget);

      await _cleanup(tester);
    });
  });
}

/// Helper to set consistent mobile screen size
Future<void> _setMobileSize(WidgetTester tester) async {
  tester.view.physicalSize = const Size(600, 1000);
  tester.view.devicePixelRatio = 1.0;
  addTearDown(() {
    tester.view.resetPhysicalSize();
    tester.view.resetDevicePixelRatio();
  });
}

/// Robust cleanup to avoid pending timers from StreamBuilder and Drift
Future<void> _cleanup(WidgetTester tester) async {
  await tester.pumpWidget(const SizedBox.shrink());
  await tester.pump(const Duration(milliseconds: 100));
  await tester.pumpAndSettle();
}
