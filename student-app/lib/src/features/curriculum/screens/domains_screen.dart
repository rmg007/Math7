import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:questerix_domain/questerix_domain.dart' as model;
import 'package:student_app/src/core/connectivity/connectivity_service.dart';
import 'package:student_app/src/core/sync/sync_service.dart';
import 'package:student_app/src/core/theme/app_theme.dart';
import 'package:student_app/src/core/theme/generated/generated.dart';
import 'package:student_app/src/features/curriculum/repositories/domain_repository.dart';
import 'package:student_app/src/features/curriculum/screens/skills_screen.dart';
import 'package:student_app/src/features/progress/repositories/skill_progress_repository.dart';

class DomainsScreen extends ConsumerWidget {
  const DomainsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final domainsStream =
        ref.watch(domainRepositoryProvider).watchAllPublished();
    final connectivityAsync = ref.watch(connectivityServiceProvider);
    final syncState = ref.watch(syncServiceProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Learn'),
        automaticallyImplyLeading: false,
        actions: [
          _buildOfflineIndicator(context, connectivityAsync, syncState),
          IconButton(
            icon: syncState.isSyncing
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.white,
                    ),
                  )
                : const Icon(AppIcons.refresh),
            tooltip: 'Sync',
            onPressed: syncState.isSyncing
                ? null
                : () => ref.read(syncServiceProvider.notifier).sync(),
          ),
        ],
      ),
      body: StreamBuilder<List<model.Domain>>(
        stream: domainsStream,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(),
                  SizedBox(height: 16),
                  Text('Loading domains...'),
                ],
              ),
            );
          }

          if (snapshot.hasError) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(
                      AppIcons.error,
                      size: 64,
                      color: AppColors.error,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Something went wrong',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '${snapshot.error}',
                      style: Theme.of(context).textTheme.bodySmall,
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 24),
                    ElevatedButton.icon(
                      onPressed: () =>
                          ref.read(syncServiceProvider.notifier).sync(),
                      icon: const Icon(Icons.refresh),
                      label: const Text('Try Again'),
                    ),
                  ],
                ),
              ),
            );
          }

          final domains = snapshot.data ?? [];

          if (domains.isEmpty) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withValues(alpha: 0.1),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        AppIcons.learn,
                        size: 64,
                        color: AppColors.primary,
                      ),
                    ),
                    const SizedBox(height: 24),
                    Text(
                      'No subjects available yet',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Pull down to refresh or sync to get the latest content',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: AppColors.textSecondary,
                          ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 24),
                    ElevatedButton.icon(
                      onPressed: () =>
                          ref.read(syncServiceProvider.notifier).sync(),
                      icon: const Icon(AppIcons.refresh),
                      label: const Text('Sync Now'),
                    ),
                  ],
                ),
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () async {
              await ref.read(syncServiceProvider.notifier).sync();
            },
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: domains.length,
              itemBuilder: (context, index) {
                final domain = domains[index];
                return _DomainCard(
                  domain: domain,
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => SkillsScreen(
                          domainId: domain.id,
                          domainTitle: domain.title,
                        ),
                      ),
                    );
                  },
                );
              },
            ),
          );
        },
      ),
    );
  }

  Widget _buildOfflineIndicator(
    BuildContext context,
    AsyncValue<ConnectivityStatus> connectivityAsync,
    SyncState syncState,
  ) {
    return connectivityAsync.when(
      data: (status) {
        if (status == ConnectivityStatus.offline) {
          return Container(
            margin: const EdgeInsets.only(right: 8),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: AppColors.offline.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(AppIcons.mute, size: 16, color: Colors.white),
                SizedBox(width: 4),
                Text(
                  'Offline',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: Colors.white,
                  ),
                ),
              ],
            ),
          );
        }
        return const SizedBox.shrink();
      },
      loading: () => const SizedBox.shrink(),
      error: (_, __) => const SizedBox.shrink(),
    );
  }
}

class _DomainCard extends ConsumerWidget {
  final model.Domain domain;
  final VoidCallback onTap;

  const _DomainCard({
    required this.domain,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return FutureBuilder<List<int>>(
      future: Future.wait([
        ref
            .read(skillProgressRepositoryProvider)
            .getMasteryForDomain(domain.id),
        ref.read(skillProgressRepositoryProvider).getPointsForDomain(domain.id),
      ]),
      builder: (context, snapshot) {
        final mastery = snapshot.data?[0] ?? 0;
        final points = snapshot.data?[1] ?? 0;

        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          child: InkWell(
            onTap: onTap,
            borderRadius: BorderRadius.circular(16),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(
                          AppIcons.domain,
                          color: AppColors.primary,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              domain.title,
                              style: Theme.of(context)
                                  .textTheme
                                  .titleMedium
                                  ?.copyWith(
                                    fontWeight: FontWeight.bold,
                                  ),
                            ),
                            if (domain.description != null)
                              Text(
                                domain.description!,
                                style: Theme.of(context).textTheme.bodySmall,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                          ],
                        ),
                      ),
                      const Icon(
                        AppIcons.chevronRight,
                        size: 16,
                        color: AppColors.textTertiary,
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  'Mastery',
                                  style: Theme.of(context).textTheme.bodySmall,
                                ),
                                Text(
                                  '$mastery%',
                                  style: Theme.of(context)
                                      .textTheme
                                      .bodySmall
                                      ?.copyWith(
                                        fontWeight: FontWeight.bold,
                                        color: _getMasteryColor(mastery),
                                      ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            ClipRRect(
                              borderRadius: BorderRadius.circular(4),
                              child: LinearProgressIndicator(
                                value: mastery / 100,
                                backgroundColor: AppColors.cardBorder,
                                valueColor: AlwaysStoppedAnimation(
                                    _getMasteryColor(mastery)),
                                minHeight: 6,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 16),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: AppColors.points.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(
                              AppIcons.points,
                              size: 16,
                              color: AppColors.points,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              '$points pts',
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: AppColors.points,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Color _getMasteryColor(int mastery) {
    if (mastery >= 80) return AppColors.success;
    if (mastery >= 60) return AppColors.primary;
    if (mastery >= 40) return AppColors.warning;
    return AppColors.textTertiary;
  }
}
