import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:student_app/src/features/auth/providers/auth_provider.dart';
import 'package:student_app/src/features/auth/screens/login_screen.dart';
import 'package:student_app/src/features/curriculum/screens/domains_screen.dart';

class Math7App extends ConsumerWidget {
  const Math7App({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(currentSessionProvider);
    ref.listen(authStateProvider, (previous, next) {});

    return MaterialApp(
      title: 'Math7',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: Colors.blue,
          brightness: Brightness.light,
        ),
        useMaterial3: true,
      ),
      darkTheme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: Colors.blue,
          brightness: Brightness.dark,
        ),
        useMaterial3: true,
      ),
      home: session != null ? const DomainsScreen() : const LoginScreen(),
    );
  }
}
