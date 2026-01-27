// ignore_for_file: deprecated_member_use
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:student_app/src/core/database/database.dart';
import 'package:student_app/src/features/curriculum/repositories/question_repository.dart';
import 'package:student_app/src/features/progress/repositories/attempt_repository.dart';

/// Practice screen - quiz interface for a skill
class PracticeScreen extends ConsumerStatefulWidget {
  final String skillId;
  final String skillTitle;

  const PracticeScreen({
    super.key,
    required this.skillId,
    required this.skillTitle,
  });

  @override
  ConsumerState<PracticeScreen> createState() => _PracticeScreenState();
}

class _PracticeScreenState extends ConsumerState<PracticeScreen> {
  List<Question> _questions = [];
  int _currentIndex = 0;
  Map<String, dynamic>? _selectedAnswer;
  bool _isAnswered = false;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadQuestions();
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

  void _submitAnswer() async {
    if (_selectedAnswer == null) return;

    final question = _questions[_currentIndex];
    final solution = jsonDecode(question.solution) as Map<String, dynamic>;
    final isCorrect = _checkAnswer(question.type, _selectedAnswer!, solution);

    await ref.read(attemptRepositoryProvider).submitAttempt(
          questionId: question.id,
          response: _selectedAnswer!,
          isCorrect: isCorrect,
          scoreAwarded: isCorrect ? question.points : 0,
        );

    setState(() {
      _isAnswered = true;
    });
  }

  bool _checkAnswer(
    String type,
    Map<String, dynamic> response,
    Map<String, dynamic> solution,
  ) {
    switch (type) {
      case 'multiple_choice':
        return response['selected_option_id'] == solution['correct_option_id'];
      case 'boolean':
        return response['value'] == solution['correct_value'];
      case 'text_input':
        final userAnswer = (response['text'] as String).toLowerCase().trim();
        final correctAnswer =
            (solution['exact_match'] as String).toLowerCase().trim();
        return userAnswer == correctAnswer;
      default:
        return false;
    }
  }

  void _nextQuestion() {
    if (_currentIndex < _questions.length - 1) {
      setState(() {
        _currentIndex++;
        _selectedAnswer = null;
        _isAnswered = false;
      });
    } else {
      // Quiz complete
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Practice session complete!')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (_questions.isEmpty) {
      return Scaffold(
        appBar: AppBar(title: Text(widget.skillTitle)),
        body: const Center(
          child: Text('No questions available for this skill'),
        ),
      );
    }

    final question = _questions[_currentIndex];

    return Scaffold(
      appBar: AppBar(
        title: Text('${widget.skillTitle} - Question ${_currentIndex + 1}/${_questions.length}'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
      ),
      body: Column(
        children: [
          LinearProgressIndicator(
            value: (_currentIndex + 1) / _questions.length,
          ),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Card(
                    elevation: 2,
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Text(
                        question.content,
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  _buildQuestionWidget(question),
                  if (_isAnswered && question.explanation != null) ...[
                    const SizedBox(height: 24),
                    Card(
                      color: _checkAnswer(
                        question.type,
                        _selectedAnswer!,
                        jsonDecode(question.solution),
                      )
                          ? Colors.green[50]
                          : Colors.red[50],
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Icon(
                                  _checkAnswer(
                                    question.type,
                                    _selectedAnswer!,
                                    jsonDecode(question.solution),
                                  )
                                      ? Icons.check_circle
                                      : Icons.cancel,
                                  color: _checkAnswer(
                                    question.type,
                                    _selectedAnswer!,
                                    jsonDecode(question.solution),
                                  )
                                      ? Colors.green
                                      : Colors.red,
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  _checkAnswer(
                                    question.type,
                                    _selectedAnswer!,
                                    jsonDecode(question.solution),
                                  )
                                      ? 'Correct!'
                                      : 'Incorrect',
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    color: _checkAnswer(
                                      question.type,
                                      _selectedAnswer!,
                                      jsonDecode(question.solution),
                                    )
                                        ? Colors.green
                                        : Colors.red,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text(question.explanation!),
                          ],
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _isAnswered ? _nextQuestion : _submitAnswer,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
                child: Text(
                  _isAnswered
                      ? (_currentIndex < _questions.length - 1
                          ? 'Next Question'
                          : 'Finish')
                      : 'Submit Answer',
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuestionWidget(Question question) {
    switch (question.type) {
      case 'multiple_choice':
        return _buildMultipleChoice(question);
      case 'boolean':
        return _buildBoolean(question);
      case 'text_input':
        return _buildTextInput(question);
      default:
        return const Text('Unsupported question type');
    }
  }

  Widget _buildMultipleChoice(Question question) {
    final options = jsonDecode(question.options)['options'] as List<dynamic>;

    return Column(
      children: options.map<Widget>((option) {
        final optionId = option['id'] as String;
        final optionText = option['text'] as String;
        final isSelected = _selectedAnswer?['selected_option_id'] == optionId;

        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          color: isSelected
              ? Theme.of(context).colorScheme.primaryContainer
              : null,
          child: InkWell(
            onTap: _isAnswered
                ? null
                : () {
                    setState(() {
                      _selectedAnswer = {'selected_option_id': optionId};
                    });
                  },
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Radio<String>(
                    value: optionId,
                    groupValue: _selectedAnswer?['selected_option_id'],
                    onChanged: _isAnswered
                        ? null
                        : (value) {
                            setState(() {
                              _selectedAnswer = {'selected_option_id': value};
                            });
                          },
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      optionText,
                      style: Theme.of(context).textTheme.bodyLarge,
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildBoolean(Question question) {
    return Row(
      children: [
        Expanded(
          child: Card(
            color: _selectedAnswer?['value'] == true
                ? Theme.of(context).colorScheme.primaryContainer
                : null,
            child: InkWell(
              onTap: _isAnswered
                  ? null
                  : () {
                      setState(() {
                        _selectedAnswer = {'value': true};
                      });
                    },
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Center(
                  child: Text(
                    'True',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                ),
              ),
            ),
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Card(
            color: _selectedAnswer?['value'] == false
                ? Theme.of(context).colorScheme.primaryContainer
                : null,
            child: InkWell(
              onTap: _isAnswered
                  ? null
                  : () {
                      setState(() {
                        _selectedAnswer = {'value': false};
                      });
                    },
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Center(
                  child: Text(
                    'False',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildTextInput(Question question) {
    final controller = TextEditingController();

    return TextField(
      controller: controller,
      enabled: !_isAnswered,
      decoration: const InputDecoration(
        labelText: 'Your Answer',
        border: OutlineInputBorder(),
      ),
      onChanged: (value) {
        setState(() {
          _selectedAnswer = {'text': value};
        });
      },
    );
  }
}
