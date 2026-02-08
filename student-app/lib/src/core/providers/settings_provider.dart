import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AppSettings {
  final bool largeText;
  final bool darkMode;

  const AppSettings({
    this.largeText = false,
    this.darkMode = false,
  });

  AppSettings copyWith({
    bool? largeText,
    bool? darkMode,
  }) {
    return AppSettings(
      largeText: largeText ?? this.largeText,
      darkMode: darkMode ?? this.darkMode,
    );
  }

  double get textScale => largeText ? 1.25 : 1.0;
}

class SettingsNotifier extends StateNotifier<AppSettings> {
  SettingsNotifier() : super(const AppSettings()) {
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    final prefs = await SharedPreferences.getInstance();
    state = AppSettings(
      largeText: prefs.getBool('largeText') ?? false,
      darkMode: prefs.getBool('darkMode') ?? false,
    );
  }

  Future<void> setLargeText(bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('largeText', value);
    state = state.copyWith(largeText: value);
  }

  Future<void> setDarkMode(bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('darkMode', value);
    state = state.copyWith(darkMode: value);
  }

  Future<void> toggleLargeText() async {
    await setLargeText(!state.largeText);
  }

  Future<void> toggleDarkMode() async {
    await setDarkMode(!state.darkMode);
  }
}

final settingsProvider =
    StateNotifierProvider<SettingsNotifier, AppSettings>((ref) {
  return SettingsNotifier();
});
