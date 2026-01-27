import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:student_app/src/features/curriculum/repositories/skill_repository.dart';
import 'package:student_app/src/features/curriculum/screens/practice_screen.dart';

/// Skills screen - Browse skills within a domain
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
    final skillsStream = ref.watch(skillRepositoryProvider).watchByDomain(domainId);

    return Scaffold(
      appBar: AppBar(
        title: Text(domainTitle),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
      ),
      body: StreamBuilder(
        stream: skillsStream,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (snapshot.hasError) {
            return Center(
              child: Text('Error: ${snapshot.error}'),
            );
          }

          final skills = snapshot.data ?? [];

          if (skills.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.lightbulb_outline,
                    size: 64,
                    color: Colors.grey[400],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'No skills available',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                ],
              ),
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: skills.length,
            itemBuilder: (context, index) {
              final skill = skills[index];
              return Card(
                margin: const EdgeInsets.only(bottom: 12),
                child: ListTile(
                  leading: CircleAvatar(
                    backgroundColor: _getDifficultyColor(skill.difficultyLevel),
                    child: Text(
                      skill.difficultyLevel.toString(),
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  title: Text(
                    skill.title,
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (skill.description != null) ...[
                        const SizedBox(height: 4),
                        Text(
                          skill.description!,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          _buildDifficultyBadge(skill.difficultyLevel),
                        ],
                      ),
                    ],
                  ),
                  trailing: ElevatedButton.icon(
                    onPressed: () {
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
                    icon: const Icon(Icons.play_arrow, size: 16),
                    label: const Text('Practice'),
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                    ),
                  ),
                  isThreeLine: true,
                ),
              );
            },
          );
        },
      ),
    );
  }

  Color _getDifficultyColor(int level) {
    switch (level) {
      case 1:
        return Colors.green;
      case 2:
        return Colors.blue;
      case 3:
        return Colors.orange;
      case 4:
        return Colors.red;
      case 5:
        return Colors.purple;
      default:
        return Colors.grey;
    }
  }

  Widget _buildDifficultyBadge(int level) {
    String label;
    switch (level) {
      case 1:
        label = 'Beginner';
        break;
      case 2:
        label = 'Easy';
        break;
      case 3:
        label = 'Medium';
        break;
      case 4:
        label = 'Hard';
        break;
      case 5:
        label = 'Expert';
        break;
      default:
        label = 'Unknown';
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: _getDifficultyColor(level).withValues(alpha: 0.2),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.bold,
          color: _getDifficultyColor(level),
        ),
      ),
    );
  }
}
