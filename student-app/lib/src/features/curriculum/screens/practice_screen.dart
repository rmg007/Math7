// ignore_for_file: deprecated_member_use
import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:questerix_domain/questerix_domain.dart' as model;
import 'package:student_app/src/core/theme/app_theme.dart';
import 'package:student_app/src/features/curriculum/repositories/question_repository.dart';
import 'package:student_app/src/features/curriculum/widgets/question_widgets.dart';
import 'package:student_app/src/features/progress/repositories/attempt_repository.dart';
import 'package:student_app/src/features/progress/repositories/session_repository.dart';
import 'package:student_app/src/features/progress/repositories/skill_progress_repository.dart';

class PracticeScreen extends ConsumerStatefulWidget {
  final String skillId;
  final String skillTitle;
  final String? existingSessionId;

  const PracticeScreen({
    super.key,
    required this.skillId,
    required this.skillTitle,
    this.existingSessionId,
  });

  @override
  ConsumerState<PracticeScreen> createState() => _PracticeScreenState();
}

class _PracticeScreenState extends ConsumerState<PracticeScreen> {
  List<model.Question> _questions = [];
  int _currentIndex = 0;
  Map<String, dynamic>? _selectedAnswer;
  bool _isAnswered = false;
  bool _isLoading = true;
  bool _showResults = false;

  String? _sessionId;
  int _totalScore = 0;
  int _correctCount = 0;
  int _currentStreak = 0;
  int _longestStreak = 0;
  int _totalTimeMs = 0;

  final Stopwatch _questionStopwatch = Stopwatch();
  Timer? _timerUpdateTimer;
  String _timerDisplay = '0:00';

  @override
  void initState() {
    super.initState();
    _initializeSession();
  }

  @override
  void dispose() {
    _questionStopwatch.stop();
    _timerUpdateTimer?.cancel();
    super.dispose();
  }

  Future<void> _initializeSession() async {
    await _loadQuestions();
    await _startOrResumeSession();
    _startQuestionTimer();
  }

  Future<void> _startOrResumeSession() async {
    if (widget.existingSessionId != null) {
      _sessionId = widget.existingSessionId;
    } else {
      try {
        _sessionId = await ref
            .read(practiceSessionRepositoryProvider)
            .startSession(skillId: widget.skillId);
      } catch (e) {
        debugPrint('Failed to start session: $e');
      }
    }
  }

  Future<void> _loadQuestions() async {
    final questions = await ref
        .read(questionRepositoryProvider)
        .getRandomBySkill(widget.skillId, 10);

    setState(() {
      _questions = questions;
      _isLoading = false;
    });
  }

  void _startQuestionTimer() {
    _questionStopwatch.reset();
    _questionStopwatch.start();
    _timerUpdateTimer?.cancel();
    _timerUpdateTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) {
        setState(() {
          final seconds = _questionStopwatch.elapsed.inSeconds;
          final mins = seconds ~/ 60;
          final secs = seconds % 60;
          _timerDisplay = '$mins:${secs.toString().padLeft(2, '0')}';
        });
      }
    });
  }

  void _stopQuestionTimer() {
    _questionStopwatch.stop();
    _timerUpdateTimer?.cancel();
  }

  Future<void> _submitAnswer() async {
    if (_selectedAnswer == null) return;

    _stopQuestionTimer();
    final timeSpentMs = _questionStopwatch.elapsedMilliseconds;
    _totalTimeMs += timeSpentMs;

    final question = _questions[_currentIndex];
    final solution = question.solution;
    final isCorrect = _checkAnswer(question.type, _selectedAnswer!, solution);

    int scoreAwarded = 0;
    if (isCorrect) {
      _correctCount++;
      _currentStreak++;

      final multiplier = _getStreakMultiplier(_currentStreak);
      scoreAwarded = (question.points * multiplier).round();
      _totalScore += scoreAwarded;

      if (_currentStreak > _longestStreak) {
        _longestStreak = _currentStreak;
      }
    } else {
      _currentStreak = 0;
    }

    await ref.read(attemptRepositoryProvider).submitAttempt(
          questionId: question.id,
          response: _selectedAnswer!,
          isCorrect: isCorrect,
          scoreAwarded: scoreAwarded,
          timeSpentMs: timeSpentMs,
        );

    try {
      await ref.read(skillProgressRepositoryProvider).recordAttempt(
            skillId: widget.skillId,
            isCorrect: isCorrect,
            pointsEarned: scoreAwarded,
          );
    } catch (e) {
      debugPrint('Failed to record skill progress: $e');
    }

    if (_sessionId != null) {
      try {
        await ref.read(practiceSessionRepositoryProvider).updateSession(
              sessionId: _sessionId!,
              questionsAttempted: _currentIndex + 1,
              questionsCorrect: _correctCount,
              totalTimeMs: _totalTimeMs,
            );
      } catch (e) {
        debugPrint('Failed to update session: $e');
      }
    }

    setState(() {
      _isAnswered = true;
    });
  }

  bool _checkAnswer(
    model.QuestionType type,
    Map<String, dynamic> response,
    Map<String, dynamic> solution,
  ) {
    switch (type) {
      case model.QuestionType.multipleChoice:
        return response['selected_option_id'] == solution['correct_option_id'];
      case model.QuestionType.mcqMulti:
        final userIds = List<String>.from(response['selected_ids'] ?? []);
        final correctIds = List<String>.from(solution['correct_ids'] ?? []);
        userIds.sort();
        correctIds.sort();
        return userIds.length == correctIds.length &&
            userIds.every((id) => correctIds.contains(id));
      case model.QuestionType.boolean:
        return response['value'] == solution['correct_value'];
      case model.QuestionType.textInput:
        final userAnswer = (response['text'] as String).toLowerCase().trim();
        final correctAnswer =
            (solution['exact_match'] as String).toLowerCase().trim();
        return userAnswer == correctAnswer;
      case model.QuestionType.reorderSteps:
        final userOrder = List<String>.from(response['order'] ?? []);
        final correctOrder = List<String>.from(solution['correct_order'] ?? []);
        if (userOrder.length != correctOrder.length) return false;
        for (int i = 0; i < userOrder.length; i++) {
          if (userOrder[i] != correctOrder[i]) return false;
        }
        return true;
    }
  }

  double _getStreakMultiplier(int streak) {
    if (streak >= 5) return 2.0;
    if (streak >= 3) return 1.5;
    return 1.0;
  }

  Future<void> _nextQuestion() async {
    if (_currentIndex < _questions.length - 1) {
      setState(() {
        _currentIndex++;
        _selectedAnswer = null;
        _isAnswered = false;
      });
      _startQuestionTimer();
    } else {
      if (_sessionId != null) {
        try {
          await ref
              .read(practiceSessionRepositoryProvider)
              .endSession(_sessionId!);
        } catch (e) {
          debugPrint('Failed to end session: $e');
        }
      }
      setState(() {
        _showResults = true;
      });
    }
  }

  void _onAnswerChanged(Map<String, dynamic> answer) {
    setState(() {
      _selectedAnswer = answer;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        backgroundColor: AppColors.background,
        body: Center(
          child: CircularProgressIndicator(color: AppColors.primary),
        ),
      );
    }

    if (_questions.isEmpty) {
      return Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          title: Text(widget.skillTitle),
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
        ),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(
                Icons.quiz_outlined,
                size: 64,
                color: AppColors.textSecondary,
              ),
              const SizedBox(height: 16),
              Text(
                'No questions available for this skill',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      color: AppColors.textSecondary,
                    ),
              ),
            ],
          ),
        ),
      );
    }

    if (_showResults) {
      return _buildResultsScreen();
    }

    return _buildQuizScreen();
  }

  Widget _buildQuizScreen() {
    final question = _questions[_currentIndex];
    final isCurrentCorrect = _isAnswered
        ? _checkAnswer(
            question.type,
            _selectedAnswer!,
            question.solution,
          )
        : null;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text('Question ${_currentIndex + 1}/${_questions.length}'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 16),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              children: [
                const Icon(Icons.timer, size: 18),
                const SizedBox(width: 4),
                Text(
                  _timerDisplay,
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          LinearProgressIndicator(
            value: (_currentIndex + 1) / _questions.length,
            backgroundColor: AppColors.cardBorder,
            valueColor: const AlwaysStoppedAnimation<Color>(AppColors.primary),
          ),
          if (_currentStreak > 1 && !_isAnswered)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 8),
              color: AppColors.streak.withValues(alpha: 0.1),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text('🔥', style: TextStyle(fontSize: 16)),
                  const SizedBox(width: 4),
                  Text(
                    'Streak: $_currentStreak',
                    style: const TextStyle(
                      color: AppColors.streak,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Card(
                    elevation: 0,
                    color: AppColors.surface,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                      side: const BorderSide(color: AppColors.cardBorder),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 4,
                                ),
                                decoration: BoxDecoration(
                                  color:
                                      AppColors.primary.withValues(alpha: 0.1),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  '${question.points} pts',
                                  style: const TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: AppColors.primary,
                                  ),
                                ),
                              ),
                              const Spacer(),
                              Text(
                                _getQuestionTypeLabel(question.type),
                                style: const TextStyle(
                                  fontSize: 12,
                                  color: AppColors.textSecondary,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          Text(
                            question.content,
                            style: Theme.of(context)
                                .textTheme
                                .titleLarge
                                ?.copyWith(
                                  color: AppColors.textPrimary,
                                  height: 1.4,
                                ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  _buildQuestionWidget(question),
                  if (_isAnswered) ...[
                    const SizedBox(height: 24),
                    _buildFeedbackCard(question, isCurrentCorrect!),
                  ],
                ],
              ),
            ),
          ),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.surface,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 10,
                  offset: const Offset(0, -2),
                ),
              ],
            ),
            child: SafeArea(
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _selectedAnswer != null
                      ? (_isAnswered ? _nextQuestion : _submitAnswer)
                      : null,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _isAnswered
                        ? (isCurrentCorrect!
                            ? AppColors.success
                            : AppColors.primary)
                        : AppColors.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    disabledBackgroundColor: AppColors.cardBorder,
                  ),
                  child: Text(
                    _isAnswered
                        ? (_currentIndex < _questions.length - 1
                            ? 'Next Question'
                            : 'See Results')
                        : 'Check Answer',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFeedbackCard(model.Question question, bool isCorrect) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      decoration: BoxDecoration(
        color: isCorrect ? AppColors.successLight : AppColors.errorLight,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isCorrect ? AppColors.success : AppColors.error,
          width: 1,
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  isCorrect ? Icons.check_circle : Icons.cancel,
                  color: isCorrect ? AppColors.success : AppColors.error,
                  size: 28,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        isCorrect ? 'Correct!' : 'Incorrect',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 18,
                          color:
                              isCorrect ? AppColors.success : AppColors.error,
                        ),
                      ),
                      if (isCorrect && _currentStreak > 1)
                        Text(
                          '🔥 Streak: $_currentStreak',
                          style: const TextStyle(
                            color: AppColors.streak,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                    ],
                  ),
                ),
                if (isCorrect)
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.success.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Text(
                      '+${question.points} pts',
                      style: const TextStyle(
                        color: AppColors.success,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
              ],
            ),
            if (question.explanation != null) ...[
              const SizedBox(height: 16),
              const Divider(height: 1),
              const SizedBox(height: 16),
              Text(
                question.explanation!,
                style: TextStyle(
                  color: isCorrect
                      ? AppColors.success.withValues(alpha: 0.8)
                      : AppColors.error.withValues(alpha: 0.8),
                  fontSize: 14,
                  height: 1.5,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildQuestionWidget(model.Question question) {
    final options = question.options;

    switch (question.type) {
      case model.QuestionType.multipleChoice:
        return MultipleChoiceWidget(
          options: options,
          selectedAnswer: _selectedAnswer,
          onAnswerChanged: _onAnswerChanged,
          isAnswered: _isAnswered,
        );
      case model.QuestionType.mcqMulti:
        return McqMultiWidget(
          options: options,
          selectedAnswer: _selectedAnswer,
          onAnswerChanged: _onAnswerChanged,
          isAnswered: _isAnswered,
        );
      case model.QuestionType.boolean:
        return BooleanWidget(
          options: options,
          selectedAnswer: _selectedAnswer,
          onAnswerChanged: _onAnswerChanged,
          isAnswered: _isAnswered,
        );
      case model.QuestionType.textInput:
        return TextInputWidget(
          options: options,
          selectedAnswer: _selectedAnswer,
          onAnswerChanged: _onAnswerChanged,
          isAnswered: _isAnswered,
        );
      case model.QuestionType.reorderSteps:
        return ReorderStepsWidget(
          options: options,
          selectedAnswer: _selectedAnswer,
          onAnswerChanged: _onAnswerChanged,
          isAnswered: _isAnswered,
        );
    }
  }

  String _getQuestionTypeLabel(model.QuestionType type) {
    switch (type) {
      case model.QuestionType.multipleChoice:
        return 'Single Choice';
      case model.QuestionType.mcqMulti:
        return 'Multiple Choice';
      case model.QuestionType.boolean:
        return 'True/False';
      case model.QuestionType.textInput:
        return 'Text Answer';
      case model.QuestionType.reorderSteps:
        return 'Reorder';
    }
  }

  Widget _buildResultsScreen() {
    final accuracy = _questions.isNotEmpty
        ? (_correctCount / _questions.length * 100).round()
        : 0;
    final totalMinutes = _totalTimeMs ~/ 60000;
    final totalSeconds = (_totalTimeMs % 60000) ~/ 1000;
    final showCelebration = accuracy >= 80;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Stack(
          children: [
            SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Column(
                children: [
                  const SizedBox(height: 40),
                  _buildResultsHeader(accuracy, showCelebration),
                  const SizedBox(height: 32),
                  _buildStatsGrid(accuracy, totalMinutes, totalSeconds),
                  const SizedBox(height: 24),
                  _buildStreakCard(),
                  const SizedBox(height: 24),
                  _buildPerformanceMessage(accuracy),
                  const SizedBox(height: 40),
                  _buildActionButtons(),
                  const SizedBox(height: 24),
                ],
              ),
            ),
            if (showCelebration) _buildCelebrationOverlay(),
          ],
        ),
      ),
    );
  }

  Widget _buildResultsHeader(int accuracy, bool showCelebration) {
    return Column(
      children: [
        Stack(
          alignment: Alignment.center,
          children: [
            SizedBox(
              width: 160,
              height: 160,
              child: CircularProgressIndicator(
                value: accuracy / 100,
                strokeWidth: 12,
                backgroundColor: AppColors.cardBorder,
                valueColor: AlwaysStoppedAnimation<Color>(
                  accuracy >= 80
                      ? AppColors.success
                      : accuracy >= 50
                          ? AppColors.warning
                          : AppColors.error,
                ),
              ),
            ),
            Column(
              children: [
                Text(
                  '$accuracy%',
                  style: const TextStyle(
                    fontSize: 48,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
                const Text(
                  'Accuracy',
                  style: TextStyle(
                    fontSize: 14,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ],
        ),
        const SizedBox(height: 24),
        Text(
          showCelebration ? '🎉 Excellent Work! 🎉' : 'Practice Complete!',
          style: const TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: AppColors.textPrimary,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          widget.skillTitle,
          style: const TextStyle(
            fontSize: 16,
            color: AppColors.textSecondary,
          ),
        ),
      ],
    );
  }

  Widget _buildStatsGrid(int accuracy, int totalMinutes, int totalSeconds) {
    return Row(
      children: [
        Expanded(
          child: _buildStatCard(
            icon: Icons.check_circle,
            iconColor: AppColors.success,
            label: 'Correct',
            value: '$_correctCount/${_questions.length}',
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildStatCard(
            icon: Icons.stars,
            iconColor: AppColors.points,
            label: 'Points',
            value: '$_totalScore',
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildStatCard(
            icon: Icons.timer,
            iconColor: AppColors.primary,
            label: 'Time',
            value: '${totalMinutes}m ${totalSeconds}s',
          ),
        ),
      ],
    );
  }

  Widget _buildStatCard({
    required IconData icon,
    required Color iconColor,
    required String label,
    required String value,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.cardBorder),
      ),
      child: Column(
        children: [
          Icon(icon, color: iconColor, size: 28),
          const SizedBox(height: 8),
          Text(
            value,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: const TextStyle(
              fontSize: 12,
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStreakCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppColors.streak.withOpacity(0.1),
            AppColors.points.withOpacity(0.1),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.streak.withOpacity(0.3)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          Column(
            children: [
              const Text('🔥', style: TextStyle(fontSize: 32)),
              const SizedBox(height: 8),
              Text(
                '$_longestStreak',
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: AppColors.streak,
                ),
              ),
              const Text(
                'Best Streak',
                style: TextStyle(
                  fontSize: 12,
                  color: AppColors.textSecondary,
                ),
              ),
            ],
          ),
          Container(
            width: 1,
            height: 60,
            color: AppColors.cardBorder,
          ),
          Column(
            children: [
              const Text('⚡', style: TextStyle(fontSize: 32)),
              const SizedBox(height: 8),
              Text(
                '$_currentStreak',
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: AppColors.points,
                ),
              ),
              const Text(
                'Final Streak',
                style: TextStyle(
                  fontSize: 12,
                  color: AppColors.textSecondary,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPerformanceMessage(int accuracy) {
    String message;
    String emoji;

    if (accuracy >= 90) {
      message = 'Outstanding! You\'ve mastered this skill!';
      emoji = '🏆';
    } else if (accuracy >= 80) {
      message = 'Great job! You\'re doing really well!';
      emoji = '🌟';
    } else if (accuracy >= 70) {
      message = 'Good effort! Keep practicing to improve.';
      emoji = '👍';
    } else if (accuracy >= 50) {
      message = 'Nice try! A bit more practice will help.';
      emoji = '💪';
    } else {
      message = 'Don\'t give up! Every attempt helps you learn.';
      emoji = '📚';
    }

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.cardBorder),
      ),
      child: Row(
        children: [
          Text(emoji, style: const TextStyle(fontSize: 40)),
          const SizedBox(width: 16),
          Expanded(
            child: Text(
              message,
              style: const TextStyle(
                fontSize: 16,
                color: AppColors.textPrimary,
                height: 1.4,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButtons() {
    return Column(
      children: [
        SizedBox(
          width: double.infinity,
          child: ElevatedButton.icon(
            onPressed: () {
              setState(() {
                _currentIndex = 0;
                _selectedAnswer = null;
                _isAnswered = false;
                _showResults = false;
                _totalScore = 0;
                _correctCount = 0;
                _currentStreak = 0;
                _longestStreak = 0;
                _totalTimeMs = 0;
              });
              _loadQuestions();
              _startOrResumeSession();
              _startQuestionTimer();
            },
            icon: const Icon(Icons.refresh),
            label: const Text('Practice Again'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          width: double.infinity,
          child: OutlinedButton.icon(
            onPressed: () => Navigator.pop(context),
            icon: const Icon(Icons.arrow_back),
            label: const Text('Back to Skills'),
            style: OutlinedButton.styleFrom(
              foregroundColor: AppColors.primary,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              side: const BorderSide(color: AppColors.primary),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildCelebrationOverlay() {
    return IgnorePointer(
      child: _CelebrationAnimation(),
    );
  }
}

class _CelebrationAnimation extends StatefulWidget {
  @override
  State<_CelebrationAnimation> createState() => _CelebrationAnimationState();
}

class _CelebrationAnimationState extends State<_CelebrationAnimation>
    with TickerProviderStateMixin {
  late List<_ConfettiParticle> _particles;
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _particles = List.generate(50, (_) => _ConfettiParticle());
    _controller = AnimationController(
      duration: const Duration(seconds: 3),
      vsync: this,
    )..forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return CustomPaint(
          size: Size.infinite,
          painter: _ConfettiPainter(
            particles: _particles,
            progress: _controller.value,
          ),
        );
      },
    );
  }
}

class _ConfettiParticle {
  final double x = Random().nextDouble();
  final double startY = -0.1 - Random().nextDouble() * 0.2;
  final double speed = 0.5 + Random().nextDouble() * 0.5;
  final double size = 8 + Random().nextDouble() * 12;
  final double rotation = Random().nextDouble() * 2 * pi;
  final double rotationSpeed = (Random().nextDouble() - 0.5) * 4;
  final Color color = [
    AppColors.primary,
    AppColors.success,
    AppColors.streak,
    AppColors.points,
    AppColors.mastery,
  ][Random().nextInt(5)];
  final int shape = Random().nextInt(3);
}

class _ConfettiPainter extends CustomPainter {
  final List<_ConfettiParticle> particles;
  final double progress;

  _ConfettiPainter({required this.particles, required this.progress});

  @override
  void paint(Canvas canvas, Size size) {
    for (final particle in particles) {
      final opacity = (1.0 - progress).clamp(0.0, 1.0);
      if (opacity <= 0) continue;

      final paint = Paint()
        ..color = particle.color.withOpacity(opacity)
        ..style = PaintingStyle.fill;

      final x = particle.x * size.width;
      final y =
          (particle.startY + progress * particle.speed * 1.5) * size.height;

      if (y > size.height) continue;

      canvas.save();
      canvas.translate(x, y);
      canvas.rotate(particle.rotation + progress * particle.rotationSpeed);

      switch (particle.shape) {
        case 0:
          canvas.drawRect(
            Rect.fromCenter(
              center: Offset.zero,
              width: particle.size,
              height: particle.size * 0.6,
            ),
            paint,
          );
          break;
        case 1:
          canvas.drawCircle(Offset.zero, particle.size / 2, paint);
          break;
        case 2:
          final path = Path();
          path.moveTo(0, -particle.size / 2);
          path.lineTo(particle.size / 2, particle.size / 2);
          path.lineTo(-particle.size / 2, particle.size / 2);
          path.close();
          canvas.drawPath(path, paint);
          break;
      }

      canvas.restore();
    }
  }

  @override
  bool shouldRepaint(_ConfettiPainter oldDelegate) => true;
}
