class QuesterixValidators {
  static final RegExp _slugRegex = RegExp(r'^[a-z0-9_]+$');

  /// Validates a slug string.
  /// Returns null if valid, or an error message if invalid.
  static String? validateSlug(String? slug) {
    if (slug == null || slug.isEmpty) {
      return 'Slug cannot be empty';
    }
    if (slug.length > 100) {
      return 'Slug must be 100 characters or less';
    }
    if (!_slugRegex.hasMatch(slug)) {
      return 'Slug must contain only lowercase letters, numbers, and underscores';
    }
    return null;
  }

  /// Validates a title string.
  static String? validateTitle(String? title) {
    if (title == null || title.isEmpty) {
      return 'Title cannot be empty';
    }
    if (title.length > 200) {
      return 'Title must be 200 characters or less';
    }
    return null;
  }
}
