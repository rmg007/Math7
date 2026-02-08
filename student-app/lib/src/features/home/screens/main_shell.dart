import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:student_app/src/core/connectivity/connectivity_service.dart';
import 'package:student_app/src/core/sync/sync_service.dart';
import 'package:student_app/src/core/theme/app_theme.dart';
import 'package:student_app/src/core/theme/generated/generated.dart';
import 'package:student_app/src/features/curriculum/screens/domains_screen.dart';
import 'package:student_app/src/features/progress/screens/progress_screen.dart';
import 'package:student_app/src/features/settings/screens/settings_screen.dart';

final currentTabProvider = StateProvider<int>((ref) => 0);

class MainShell extends ConsumerWidget {
  const MainShell({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentTab = ref.watch(currentTabProvider);
    final connectivityAsync = ref.watch(connectivityServiceProvider);
    final syncState = ref.watch(syncServiceProvider);

    final screens = [
      const DomainsScreen(),
      const ProgressScreen(),
      const SettingsScreen(),
    ];

    // Responsive breakpoints
    final screenWidth = MediaQuery.of(context).size.width;
    final isTablet = screenWidth >= Breakpoints.lg;
    final isDesktop = screenWidth >= Breakpoints.xl;

    // Navigation items
    final destinations = [
      _NavDestination(
        icon: AppIcons.home,
        selectedIcon: AppIcons.home,
        label: 'Home',
      ),
      _NavDestination(
        icon: AppIcons.progress,
        selectedIcon: AppIcons.progress,
        label: 'Progress',
        badge: syncState.isSyncing ? const _SyncingBadge() : null,
      ),
      _NavDestination(
        icon: AppIcons.settings,
        selectedIcon: AppIcons.settings,
        label: 'Settings',
        badge: connectivityAsync.maybeWhen(
          data: (status) => status == ConnectivityStatus.offline
              ? const _OfflineBadge()
              : null,
          orElse: () => null,
        ),
      ),
    ];

    // Desktop/Tablet: NavigationRail + Content (centered)
    if (isTablet) {
      return Scaffold(
        body: Row(
          children: [
            // NavigationRail
            NavigationRail(
              selectedIndex: currentTab,
              onDestinationSelected: (index) =>
                  ref.read(currentTabProvider.notifier).state = index,
              extended: isDesktop,
              minWidth: 72,
              minExtendedWidth: 200,
              backgroundColor: Theme.of(context).scaffoldBackgroundColor,
              destinations: destinations
                  .map((d) => NavigationRailDestination(
                        icon: Badge(
                          isLabelVisible: d.badge != null,
                          child: Icon(d.icon),
                        ),
                        selectedIcon: Badge(
                          isLabelVisible: d.badge != null,
                          child: Icon(d.selectedIcon),
                        ),
                        label: Text(d.label),
                      ))
                  .toList(),
            ),
            // Divider
            const VerticalDivider(thickness: 1, width: 1),
            // Content (centered with max-width)
            Expanded(
              child: Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 1200),
                  child: IndexedStack(
                    index: currentTab,
                    children: screens,
                  ),
                ),
              ),
            ),
          ],
        ),
      );
    }

    // Mobile: BottomNavigationBar
    return Scaffold(
      body: IndexedStack(
        index: currentTab,
        children: screens,
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.1),
              blurRadius: 10,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: BottomNavigationBar(
          currentIndex: currentTab,
          onTap: (index) => ref.read(currentTabProvider.notifier).state = index,
          items: destinations
              .map((d) => BottomNavigationBarItem(
                    icon: Stack(
                      clipBehavior: Clip.none,
                      children: [
                        Icon(d.icon),
                        if (d.badge != null)
                          Positioned(
                            right: -4,
                            top: -4,
                            child: d.badge!,
                          ),
                      ],
                    ),
                    activeIcon: Stack(
                      clipBehavior: Clip.none,
                      children: [
                        Icon(d.selectedIcon),
                        if (d.badge != null)
                          Positioned(
                            right: -4,
                            top: -4,
                            child: d.badge!,
                          ),
                      ],
                    ),
                    label: d.label,
                  ))
              .toList(),
        ),
      ),
    );
  }
}

class _NavDestination {
  final IconData icon;
  final IconData selectedIcon;
  final String label;
  final Widget? badge;

  _NavDestination({
    required this.icon,
    required this.selectedIcon,
    required this.label,
    this.badge,
  });
}

class _SyncingBadge extends StatelessWidget {
  const _SyncingBadge();

  @override
  Widget build(BuildContext context) {
    return const SizedBox(
      width: 12,
      height: 12,
      child: CircularProgressIndicator(
        strokeWidth: 2,
        color: AppColors.primary,
      ),
    );
  }
}

class _OfflineBadge extends StatelessWidget {
  const _OfflineBadge();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 10,
      height: 10,
      decoration: const BoxDecoration(
        color: AppColors.offline,
        shape: BoxShape.circle,
      ),
    );
  }
}
