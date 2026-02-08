import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:student_app/src/core/connectivity/connectivity_service.dart';
import 'package:student_app/src/core/providers/settings_provider.dart';
import 'package:student_app/src/core/theme/app_theme.dart';
import 'package:student_app/src/features/auth/providers/auth_provider.dart';
import 'package:student_app/src/features/auth/screens/welcome_screen.dart';
import 'package:student_app/src/features/home/screens/main_shell.dart';
import 'package:student_app/src/features/progress/repositories/session_repository.dart';
import 'package:student_app/src/features/curriculum/screens/practice_screen.dart';

class QuesterixApp extends ConsumerStatefulWidget {
  const QuesterixApp({super.key});

  @override
  ConsumerState<QuesterixApp> createState() => _QuesterixAppState();
}

class _QuesterixAppState extends ConsumerState<QuesterixApp> {
  bool _hasCheckedResume = false;

  @override
  Widget build(BuildContext context) {
    final session = ref.watch(currentSessionProvider);
    final settings = ref.watch(settingsProvider);
    ref.listen(authStateProvider, (previous, next) {});

    ref.listen(connectivityServiceProvider, (previous, next) {
      next.whenData((status) {
        if (previous != null) {
          previous.whenData((prevStatus) {
            if (prevStatus != status) {
              _showConnectivitySnackbar(context, status);
            }
          });
        }
      });
    });

    return MaterialApp(
      title: 'Questerix',
      debugShowCheckedModeBanner: false,
      theme: _getTheme(context, settings, false),
      darkTheme: _getTheme(context, settings, true),
      highContrastTheme:
          _getTheme(context, settings, false, highContrast: true),
      highContrastDarkTheme:
          _getTheme(context, settings, true, highContrast: true),
      themeMode: settings.darkMode ? ThemeMode.dark : ThemeMode.light,
      home: session != null
          ? _AuthenticatedHome(
              onFirstBuild: () {
                if (!_hasCheckedResume) {
                  _hasCheckedResume = true;
                  _checkForResumeSession(context, ref);
                }
              },
            )
          : const WelcomeScreen(),
    );
  }

  ThemeData _getTheme(
    BuildContext context,
    dynamic settings,
    bool isDark, {
    bool highContrast = false,
  }) {
    final textScale = settings.textScale ?? 1.0;

    if (highContrast) {
      return isDark
          ? AppTheme.highContrastDark(textScale: textScale)
          : AppTheme.highContrastLight(textScale: textScale);
    }

    return isDark
        ? AppTheme.dark(textScale: textScale)
        : AppTheme.light(textScale: textScale);
  }

  void _showConnectivitySnackbar(
      BuildContext context, ConnectivityStatus status) {
    final message = status == ConnectivityStatus.online
        ? 'You are back online'
        : 'You are offline - changes will sync later';
    final icon =
        status == ConnectivityStatus.online ? Icons.wifi : Icons.wifi_off;
    final color = status == ConnectivityStatus.online
        ? AppColors.success
        : AppColors.warning;

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            Icon(icon, color: Colors.white),
            const SizedBox(width: 12),
            Text(message),
          ],
        ),
        backgroundColor: color,
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 3),
      ),
    );
  }

  Future<void> _checkForResumeSession(
      BuildContext context, WidgetRef ref) async {
    await Future.delayed(const Duration(milliseconds: 500));

    if (!mounted) return;

    final sessionRepo = ref.read(practiceSessionRepositoryProvider);
    final activeSession = await sessionRepo.getActiveSession();

    if (activeSession != null && context.mounted) {
      final shouldResume = await showDialog<bool>(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Resume Practice?'),
          content: Text(
            'You have an unfinished practice session with ${activeSession.questionsAttempted} questions attempted. Would you like to continue?',
          ),
          actions: [
            TextButton(
              onPressed: () {
                sessionRepo.endSession(activeSession.id);
                Navigator.pop(context, false);
              },
              child: const Text('Start Fresh'),
            ),
            ElevatedButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text('Resume'),
            ),
          ],
        ),
      );

      if (shouldResume == true && activeSession.skillId != null) {
        if (!context.mounted) return;
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => PracticeScreen(
              skillId: activeSession.skillId!,
              skillTitle: 'Practice',
              existingSessionId: activeSession.id,
            ),
          ),
        );
      }
    }
  }
}

class _AuthenticatedHome extends ConsumerStatefulWidget {
  final VoidCallback onFirstBuild;

  const _AuthenticatedHome({required this.onFirstBuild});

  @override
  ConsumerState<_AuthenticatedHome> createState() => _AuthenticatedHomeState();
}

class _AuthenticatedHomeState extends ConsumerState<_AuthenticatedHome> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      widget.onFirstBuild();
    });
  }

  @override
  Widget build(BuildContext context) {
    return const MainShell();
  }
}
