import 'package:flutter/material.dart';

/// A button with proper semantic labeling for screen readers
class SemanticButton extends StatelessWidget {
  final Widget child;
  final VoidCallback? onPressed;
  final String? semanticLabel;
  final String? semanticHint;
  final bool enabled;

  const SemanticButton({
    super.key,
    required this.child,
    required this.onPressed,
    this.semanticLabel,
    this.semanticHint,
    this.enabled = true,
  });

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      enabled: enabled,
      label: semanticLabel,
      hint: semanticHint,
      onTap: enabled ? onPressed : null,
      child: GestureDetector(
        onTap: enabled ? onPressed : null,
        behavior: HitTestBehavior.opaque,
        child: child,
      ),
    );
  }
}

/// A card with semantic header for screen reader navigation
class SemanticCard extends StatelessWidget {
  final Widget child;
  final String? semanticLabel;
  final bool isHeader;
  final VoidCallback? onTap;

  const SemanticCard({
    super.key,
    required this.child,
    this.semanticLabel,
    this.isHeader = false,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: semanticLabel,
      header: isHeader,
      button: onTap != null,
      onTap: onTap,
      child: child,
    );
  }
}

/// An image with semantic description for screen readers
class SemanticImage extends StatelessWidget {
  final Widget image;
  final String semanticLabel;
  final bool isDecorative;

  const SemanticImage({
    super.key,
    required this.image,
    required this.semanticLabel,
    this.isDecorative = false,
  });

  @override
  Widget build(BuildContext context) {
    if (isDecorative) {
      return ExcludeSemantics(child: image);
    }

    return Semantics(
      image: true,
      label: semanticLabel,
      child: image,
    );
  }
}

/// A progress indicator with semantic value announcement
class SemanticProgressIndicator extends StatelessWidget {
  final double value;
  final Widget child;
  final String label;

  const SemanticProgressIndicator({
    super.key,
    required this.value,
    required this.child,
    required this.label,
  });

  @override
  Widget build(BuildContext context) {
    final percentage = (value * 100).toInt();
    return Semantics(
      label: label,
      value: '$percentage percent complete',
      child: child,
    );
  }
}

/// A text input field with proper semantic labels
class SemanticTextField extends StatelessWidget {
  final TextEditingController? controller;
  final String label;
  final String? hint;
  final TextInputType? keyboardType;
  final ValueChanged<String>? onChanged;
  final String? errorText;

  const SemanticTextField({
    super.key,
    this.controller,
    required this.label,
    this.hint,
    this.keyboardType,
    this.onChanged,
    this.errorText,
  });

  @override
  Widget build(BuildContext context) {
    return Semantics(
      textField: true,
      label: label,
      hint: hint,
      child: TextField(
        controller: controller,
        keyboardType: keyboardType,
        onChanged: onChanged,
        decoration: InputDecoration(
          labelText: label,
          hintText: hint,
          errorText: errorText,
        ),
      ),
    );
  }
}

/// An icon with semantic label
class SemanticIcon extends StatelessWidget {
  final IconData icon;
  final String semanticLabel;
  final double? size;
  final Color? color;
  final bool isDecorative;

  const SemanticIcon({
    super.key,
    required this.icon,
    required this.semanticLabel,
    this.size,
    this.color,
    this.isDecorative = false,
  });

  @override
  Widget build(BuildContext context) {
    final iconWidget = Icon(icon, size: size, color: color);

    if (isDecorative) {
      return ExcludeSemantics(child: iconWidget);
    }

    return Semantics(
      label: semanticLabel,
      child: iconWidget,
    );
  }
}
