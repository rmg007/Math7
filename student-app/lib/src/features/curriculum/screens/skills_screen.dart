import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:questerix_domain/questerix_domain.dart' as model;
import 'package:student_app/src/core/theme/app_theme.dart';
import 'package:student_app/src/features/curriculum/repositories/skill_repository.dart';
import 'package:student_app/src/features/curriculum/screens/practice_screen.dart';
import 'package:student_app/src/features/progress/repositories/skill_progress_repository.dart';

class SkillsScreen extends ConsumerWidget {
  final String domainId;
  final String domainTitle;

  const SkillsScreen({
    super.key,
    required this.domainId,
    required this.domainTitle,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final skillsStream =
        ref.watch(skillRepositoryProvider).watchByDomain(domainId);

    return Scaffold(
      appBar: AppBar(
        title: Text(domainTitle),
      ),
      body: StreamBuilder<List<model.Skill>>(
        stream: skillsStream,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(),
                  SizedBox(height: 16),
                  Text('Loading skills...'),
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
                      Icons.error_outline,
                      size: 64,
                      color: AppColors.error,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Error loading skills',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '${snapshot.error}',
                      style: Theme.of(context).textTheme.bodySmall,
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            );
          }

          final skills = snapshot.data ?? [];

          if (skills.isEmpty) {
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
                        Icons.lightbulb_outline,
                        size: 64,
                        color: AppColors.primary,
                      ),
                    ),
                    const SizedBox(height: 24),
                    Text(
                      'No skills available',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Check back later for new content',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: AppColors.textSecondary,
                          ),
                    ),
                  ],
                ),
              ),
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: skills.length,
            itemBuilder: (context, index) {
              final skill = skills[index];
              return _SkillCard(
                skill: skill,
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => PracticeScreen(
                        skillId: skill.id,
                        skillTitle: skill.title,
                      ),
                    ),
                  );
                },
              );
            },
          );
        },
      ),
    );
  }
}

class _SkillCard extends ConsumerWidget {
  final model.Skill skill;
  final VoidCallback onTap;

  const _SkillCard({
    required this.skill,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return FutureBuilder(
      future: ref
          .read(skillProgressRepositoryProvider)
          .getProgressForSkill(skill.id),
      builder: (context, snapshot) {
        final progress = snapshot.data;
        final mastery = progress?.masteryLevel ?? 0;
        final points = progress?.totalPoints ?? 0;
        final streak = progress?.currentStreak ?? 0;

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
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          color: _getDifficultyColor(skill.difficultyLevel)
                              .withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Center(
                          child: Text(
                            '${skill.difficultyLevel}',
                            style: TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                              color: _getDifficultyColor(skill.difficultyLevel),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              skill.title,
                              style: Theme.of(context)
                                  .textTheme
                                  .titleMedium
                                  ?.copyWith(
                                    fontWeight: FontWeight.bold,
                                  ),
                            ),
                            const SizedBox(height: 4),
                            _buildMasteryStars(mastery),
                          ],
                        ),
                      ),
                    ],
                  ),
                  if (skill.description != null) ...[
                    const SizedBox(height: 8),
                    Text(
                      skill.description!,
                      style: Theme.of(context).textTheme.bodySmall,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      _buildBadge(
                        icon: Icons.stars,
                        label: '$mastery%',
                        color: _getMasteryColor(mastery),
                      ),
                      const SizedBox(width: 8),
                      _buildBadge(
                        icon: Icons.star,
                        label: '$points pts',
                        color: AppColors.points,
                      ),
                      if (streak > 0) ...[
                        const SizedBox(width: 8),
                        _buildBadge(
                          icon: Icons.local_fire_department,
                          label: '$streak',
                          color: AppColors.streak,
                        ),
                      ],
                      const Spacer(),
                      ElevatedButton.icon(
                        onPressed: onTap,
                        icon: const Icon(Icons.play_arrow, size: 18),
                        label: const Text('Practice'),
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 16, vertical: 8),
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

  Widget _buildMasteryStars(int mastery) {
    final stars = (mastery / 20).ceil().clamp(0, 5);
    return Row(
      children: List.generate(5, (index) {
        return Icon(
          index < stars ? Icons.star : Icons.star_border,
          size: 16,
          color: index < stars ? AppColors.points : AppColors.textTertiary,
        );
      }),
    );
  }

  Widget _buildBadge({
    required IconData icon,
    required String label,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  Color _getDifficultyColor(int level) {
    switch (level) {
      case 1:
        return AppColors.success;
      case 2:
        return const Color(0xFF3B82F6);
      case 3:
        return AppColors.warning;
      case 4:
        return AppColors.error;
      case 5:
        return AppColors.mastery;
      default:
        return AppColors.textSecondary;
    }
  }

  Color _getMasteryColor(int mastery) {
    if (mastery >= 80) return AppColors.success;
    if (mastery >= 60) return AppColors.primary;
    if (mastery >= 40) return AppColors.warning;
    return AppColors.textTertiary;
  }
}
