import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';

typedef AnswerCallback = void Function(Map<String, dynamic> answer);

class MultipleChoiceWidget extends StatelessWidget {
  final dynamic options;
  final Map<String, dynamic>? selectedAnswer;
  final AnswerCallback onAnswerChanged;
  final bool isAnswered;

  const MultipleChoiceWidget({
    super.key,
    required this.options,
    required this.selectedAnswer,
    required this.onAnswerChanged,
    required this.isAnswered,
  });

  @override
  Widget build(BuildContext context) {
    final optionsList = (options is Map && options['options'] != null)
        ? options['options'] as List<dynamic>
        : options as List<dynamic>;

    return Column(
      children: optionsList.map<Widget>((option) {
        final optionId = option['id'] as String;
        final optionText = option['text'] as String;
        final isSelected = selectedAnswer?['selected_option_id'] == optionId;

        return Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            curve: Curves.easeInOut,
            decoration: BoxDecoration(
              color: isSelected
                  ? AppColors.primary.withValues(alpha: 0.1)
                  : AppColors.surface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: isSelected ? AppColors.primary : AppColors.cardBorder,
                width: isSelected ? 2 : 1,
              ),
            ),
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: isAnswered
                    ? null
                    : () => onAnswerChanged({'selected_option_id': optionId}),
                borderRadius: BorderRadius.circular(16),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      SizedBox(
                        width: 48,
                        height: 48,
                        child: Center(
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 200),
                            width: 24,
                            height: 24,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: isSelected
                                    ? AppColors.primary
                                    : AppColors.textSecondary,
                                width: 2,
                              ),
                              color: isSelected
                                  ? AppColors.primary
                                  : Colors.transparent,
                            ),
                            child: isSelected
                                ? const Icon(
                                    Icons.check,
                                    size: 16,
                                    color: Colors.white,
                                  )
                                : null,
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          optionText,
                          style: TextStyle(
                            fontSize: 16,
                            color: isAnswered
                                ? AppColors.textSecondary
                                : AppColors.textPrimary,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}

class McqMultiWidget extends StatelessWidget {
  final dynamic options;
  final Map<String, dynamic>? selectedAnswer;
  final AnswerCallback onAnswerChanged;
  final bool isAnswered;

  const McqMultiWidget({
    super.key,
    required this.options,
    required this.selectedAnswer,
    required this.onAnswerChanged,
    required this.isAnswered,
  });

  List<String> get _selectedIds {
    final ids = selectedAnswer?['selected_ids'];
    if (ids == null) return [];
    if (ids is List) return ids.cast<String>();
    return [];
  }

  void _toggleOption(String optionId) {
    final currentIds = List<String>.from(_selectedIds);
    if (currentIds.contains(optionId)) {
      currentIds.remove(optionId);
    } else {
      currentIds.add(optionId);
    }
    onAnswerChanged({'selected_ids': currentIds});
  }

  @override
  Widget build(BuildContext context) {
    final optionsList = (options is Map && options['options'] != null)
        ? options['options'] as List<dynamic>
        : options as List<dynamic>;

    return Column(
      children: optionsList.map<Widget>((option) {
        final optionId = option['id'] as String;
        final optionText = option['text'] as String;
        final isSelected = _selectedIds.contains(optionId);

        return Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            curve: Curves.easeInOut,
            decoration: BoxDecoration(
              color: isSelected
                  ? AppColors.primary.withValues(alpha: 0.1)
                  : AppColors.surface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: isSelected ? AppColors.primary : AppColors.cardBorder,
                width: isSelected ? 2 : 1,
              ),
            ),
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: isAnswered ? null : () => _toggleOption(optionId),
                borderRadius: BorderRadius.circular(16),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      SizedBox(
                        width: 48,
                        height: 48,
                        child: Center(
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 200),
                            width: 24,
                            height: 24,
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(
                                color: isSelected
                                    ? AppColors.primary
                                    : AppColors.textSecondary,
                                width: 2,
                              ),
                              color: isSelected
                                  ? AppColors.primary
                                  : Colors.transparent,
                            ),
                            child: isSelected
                                ? const Icon(
                                    Icons.check,
                                    size: 16,
                                    color: Colors.white,
                                  )
                                : null,
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          optionText,
                          style: TextStyle(
                            fontSize: 16,
                            color: isAnswered
                                ? AppColors.textSecondary
                                : AppColors.textPrimary,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}

class BooleanWidget extends StatelessWidget {
  final dynamic options;
  final Map<String, dynamic>? selectedAnswer;
  final AnswerCallback onAnswerChanged;
  final bool isAnswered;

  const BooleanWidget({
    super.key,
    required this.options,
    required this.selectedAnswer,
    required this.onAnswerChanged,
    required this.isAnswered,
  });

  @override
  Widget build(BuildContext context) {
    final selectedValue = selectedAnswer?['value'];

    return Row(
      children: [
        Expanded(
          child: _BooleanButton(
            label: 'True',
            icon: Icons.check_circle_outline,
            isSelected: selectedValue == true,
            isAnswered: isAnswered,
            onTap: () => onAnswerChanged({'value': true}),
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: _BooleanButton(
            label: 'False',
            icon: Icons.cancel_outlined,
            isSelected: selectedValue == false,
            isAnswered: isAnswered,
            onTap: () => onAnswerChanged({'value': false}),
          ),
        ),
      ],
    );
  }
}

class _BooleanButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool isSelected;
  final bool isAnswered;
  final VoidCallback onTap;

  const _BooleanButton({
    required this.label,
    required this.icon,
    required this.isSelected,
    required this.isAnswered,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      curve: Curves.easeInOut,
      constraints: const BoxConstraints(minHeight: 100),
      decoration: BoxDecoration(
        color: isSelected
            ? AppColors.primary.withValues(alpha: 0.1)
            : AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isSelected ? AppColors.primary : AppColors.cardBorder,
          width: isSelected ? 2 : 1,
        ),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: isAnswered ? null : onTap,
          borderRadius: BorderRadius.circular(16),
          child: SizedBox(
            height: 100,
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  AnimatedScale(
                    scale: isSelected ? 1.1 : 1.0,
                    duration: const Duration(milliseconds: 200),
                    child: Icon(
                      icon,
                      size: 36,
                      color: isSelected
                          ? AppColors.primary
                          : (isAnswered
                              ? AppColors.textTertiary
                              : AppColors.textSecondary),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    label,
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                      color: isSelected
                          ? AppColors.primary
                          : (isAnswered
                              ? AppColors.textTertiary
                              : AppColors.textPrimary),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class TextInputWidget extends StatefulWidget {
  final dynamic options;
  final Map<String, dynamic>? selectedAnswer;
  final AnswerCallback onAnswerChanged;
  final bool isAnswered;

  const TextInputWidget({
    super.key,
    required this.options,
    required this.selectedAnswer,
    required this.onAnswerChanged,
    required this.isAnswered,
  });

  @override
  State<TextInputWidget> createState() => _TextInputWidgetState();
}

class _TextInputWidgetState extends State<TextInputWidget> {
  late TextEditingController _controller;
  String? _errorText;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(
      text: widget.selectedAnswer?['text'] as String? ?? '',
    );
  }

  @override
  void didUpdateWidget(TextInputWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    final newText = widget.selectedAnswer?['text'] as String? ?? '';
    if (_controller.text != newText && widget.isAnswered) {
      _controller.text = newText;
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _onChanged(String value) {
    setState(() {
      _errorText = value.trim().isEmpty ? 'Please enter an answer' : null;
    });
    widget.onAnswerChanged({'text': value});
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: _errorText != null
              ? AppColors.error
              : (_controller.text.isNotEmpty
                  ? AppColors.primary
                  : AppColors.cardBorder),
          width: _controller.text.isNotEmpty ? 2 : 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TextField(
            controller: _controller,
            enabled: !widget.isAnswered,
            onChanged: _onChanged,
            style: TextStyle(
              fontSize: 16,
              color: widget.isAnswered
                  ? AppColors.textSecondary
                  : AppColors.textPrimary,
            ),
            decoration: InputDecoration(
              hintText: 'Type your answer here...',
              hintStyle: const TextStyle(color: AppColors.textTertiary),
              contentPadding: const EdgeInsets.all(16),
              border: InputBorder.none,
              enabledBorder: InputBorder.none,
              focusedBorder: InputBorder.none,
              disabledBorder: InputBorder.none,
              constraints: const BoxConstraints(minHeight: 56),
              suffixIcon: _controller.text.isNotEmpty && !widget.isAnswered
                  ? IconButton(
                      onPressed: () {
                        _controller.clear();
                        _onChanged('');
                      },
                      icon: const Icon(
                        Icons.clear,
                        color: AppColors.textSecondary,
                      ),
                      constraints: const BoxConstraints(
                        minWidth: 48,
                        minHeight: 48,
                      ),
                    )
                  : null,
            ),
          ),
          if (_errorText != null)
            Padding(
              padding: const EdgeInsets.only(left: 16, right: 16, bottom: 12),
              child: Text(
                _errorText!,
                style: const TextStyle(
                  fontSize: 12,
                  color: AppColors.error,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class ReorderStepsWidget extends StatefulWidget {
  final dynamic options;
  final Map<String, dynamic>? selectedAnswer;
  final AnswerCallback onAnswerChanged;
  final bool isAnswered;

  const ReorderStepsWidget({
    super.key,
    required this.options,
    required this.selectedAnswer,
    required this.onAnswerChanged,
    required this.isAnswered,
  });

  @override
  State<ReorderStepsWidget> createState() => _ReorderStepsWidgetState();
}

class _ReorderStepsWidgetState extends State<ReorderStepsWidget> {
  late List<String> _orderedSteps;

  @override
  void initState() {
    super.initState();
    _initializeSteps();
  }

  @override
  void didUpdateWidget(ReorderStepsWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.options != widget.options) {
      _initializeSteps();
    }
  }

  void _initializeSteps() {
    final existingOrder = widget.selectedAnswer?['order'];
    if (existingOrder != null && existingOrder is List) {
      _orderedSteps = List<String>.from(existingOrder);
    } else {
      final stepsList =
          (widget.options is Map && widget.options['steps'] != null)
              ? widget.options['steps'] as List<dynamic>
              : widget.options as List<dynamic>;
      _orderedSteps = stepsList.map<String>((step) {
        if (step is Map) {
          return step['text'] as String? ??
              step['id'] as String? ??
              step.toString();
        }
        return step.toString();
      }).toList();
    }
  }

  void _onReorder(int oldIndex, int newIndex) {
    if (widget.isAnswered) return;

    setState(() {
      if (newIndex > oldIndex) {
        newIndex -= 1;
      }
      final item = _orderedSteps.removeAt(oldIndex);
      _orderedSteps.insert(newIndex, item);
    });
    widget.onAnswerChanged({'order': List<String>.from(_orderedSteps)});
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.cardBorder),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: ReorderableListView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          buildDefaultDragHandles: !widget.isAnswered,
          itemCount: _orderedSteps.length,
          proxyDecorator: (child, index, animation) {
            return AnimatedBuilder(
              animation: animation,
              builder: (context, child) {
                final animValue = Curves.easeInOut.transform(animation.value);
                final elevation = 8.0 * animValue;
                final scale = 1.0 + 0.02 * animValue;
                return Transform.scale(
                  scale: scale,
                  child: Material(
                    elevation: elevation,
                    borderRadius: BorderRadius.circular(12),
                    color: AppColors.primary.withValues(alpha: 0.1),
                    child: child,
                  ),
                );
              },
              child: child,
            );
          },
          onReorder: _onReorder,
          itemBuilder: (context, index) {
            final step = _orderedSteps[index];
            return _ReorderableStepItem(
              key: ValueKey('$step-$index'),
              index: index,
              text: step,
              isAnswered: widget.isAnswered,
            );
          },
        ),
      ),
    );
  }
}

class _ReorderableStepItem extends StatelessWidget {
  final int index;
  final String text;
  final bool isAnswered;

  const _ReorderableStepItem({
    super.key,
    required this.index,
    required this.text,
    required this.isAnswered,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: EdgeInsets.only(
        top: index == 0 ? 0 : 1,
      ),
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: index > 0
            ? const Border(
                top: BorderSide(color: AppColors.divider, width: 1),
              )
            : null,
      ),
      child: Material(
        color: Colors.transparent,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Center(
                  child: Text(
                    '${index + 1}',
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: AppColors.primary,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  text,
                  style: TextStyle(
                    fontSize: 16,
                    color: isAnswered
                        ? AppColors.textSecondary
                        : AppColors.textPrimary,
                  ),
                ),
              ),
              if (!isAnswered)
                SizedBox(
                  width: 48,
                  height: 48,
                  child: ReorderableDragStartListener(
                    index: index,
                    child: const Icon(
                      Icons.drag_handle,
                      color: AppColors.textTertiary,
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
