// Input sanitization and validation utilities for AI prompts

export interface SanitizationResult {
  sanitized: string;
  isSafe: boolean;
  warnings: string[];
}

/**
 * Sanitizes custom instructions to prevent prompt injection attacks
 */
export function sanitizeCustomInstructions(instructions: string): SanitizationResult {
  const warnings: string[] = [];
  let sanitized = instructions;
  
  // List of potentially dangerous patterns
  const dangerousPatterns = [
    { pattern: /ignore\s+(previous|all)\s+instructions/gi, warning: 'Contains instruction override attempt' },
    { pattern: /system\s*:/gi, warning: 'Contains system prompt manipulation' },
    { pattern: /developer\s*:/gi, warning: 'Contains developer mode attempt' },
    { pattern: /jailbreak/gi, warning: 'Contains jailbreak attempt' },
    { pattern: /\b(dan|dopelganger)\b/gi, warning: 'Contains known prompt injection patterns' },
    { pattern: /roleplay\s+as/gi, warning: 'Contains roleplay manipulation' },
    { pattern: /pretend\s+(to\s+be|you\s+are)/gi, warning: 'Contains persona manipulation' },
    { pattern: /act\s+as\s+if/gi, warning: 'Contains behavior manipulation' },
    { pattern: /\${.*?}/g, warning: 'Contains template injection attempt' },
    { pattern: /```[\s\S]*?```/g, warning: 'Contains code block injection' },
  ];
  
  // Check for dangerous patterns
  for (const { pattern, warning } of dangerousPatterns) {
    pattern.lastIndex = 0; // Reset regex state before test
    if (pattern.test(sanitized)) {
      warnings.push(warning);
      pattern.lastIndex = 0; // Reset again before replace
      sanitized = sanitized.replace(pattern, '[FILTERED]');
    }
  }
  
  // Length limits to prevent token overflow attacks
  const maxLength = 2000;
  if (sanitized.length > maxLength) {
    warnings.push(`Input too long (${sanitized.length} chars), truncated to ${maxLength}`);
    sanitized = sanitized.substring(0, maxLength);
  }
  
  // Remove excessive whitespace and control characters
  sanitized = sanitized.replace(/\s+/g, ' ').trim();
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
  
  // Check if the result is safe enough
  const isSafe = warnings.length === 0;
  
  return {
    sanitized,
    isSafe,
    warnings,
  };
}

/**
 * Validates source text for content generation
 */
export function sanitizeSourceText(text: string): SanitizationResult {
  const warnings: string[] = [];
  let sanitized = text;
  
  // Length limits
  const maxLength = 10000; // 10k characters for source text
  if (sanitized.length > maxLength) {
    warnings.push(`Source text too long (${sanitized.length} chars), truncated to ${maxLength}`);
    sanitized = sanitized.substring(0, maxLength);
  }
  
  // Remove potentially malicious content
  const maliciousPatterns = [
    { pattern: /<script[\s\S]*?<\/script>/gi, warning: 'Contains script tags' },
    { pattern: /javascript:/gi, warning: 'Contains JavaScript URLs' },
    { pattern: /on\w+\s*=/gi, warning: 'Contains event handlers' },
  ];
  
  for (const { pattern, warning } of maliciousPatterns) {
    pattern.lastIndex = 0;
    if (pattern.test(sanitized)) {
      warnings.push(warning);
      pattern.lastIndex = 0;
      sanitized = sanitized.replace(pattern, '[REMOVED]');
    }
  }
  
  // Normalize whitespace
  sanitized = sanitized.replace(/\s+/g, ' ').trim();
  
  const isSafe = warnings.length === 0;
  
  return {
    sanitized,
    isSafe,
    warnings,
  };
}

/**
 * Validates difficulty distribution parameters
 */
export function validateDifficultyDistribution(distribution: any): { isValid: boolean; error?: string } {
  if (!distribution) {
    return { isValid: false, error: 'Difficulty distribution is missing (difficulty_distribution)' };
  }
  const { easy, medium, hard } = distribution;
  
  // Check for negative numbers
  if (easy < 0 || medium < 0 || hard < 0) {
    return { isValid: false, error: 'Difficulty values cannot be negative' };
  }
  
  // Check total limits
  const total = easy + medium + hard;
  if (total === 0) {
    return { isValid: false, error: 'At least one question must be requested' };
  }
  
  if (total > 100) {
    return { isValid: false, error: 'Cannot generate more than 100 questions at once' };
  }
  
  // Check individual limits
  const maxPerDifficulty = 50;
  if (easy > maxPerDifficulty || medium > maxPerDifficulty || hard > maxPerDifficulty) {
    return { isValid: false, error: `Maximum ${maxPerDifficulty} questions per difficulty level` };
  }
  
  return { isValid: true };
}

/**
 * Validates AI model selection
 */
export function validateModelSelection(model: string): { isValid: boolean; error?: string } {
  const allowedModels = ['gemini-1.5-flash', 'gpt-4o-mini'];
  
  if (!allowedModels.includes(model)) {
    return { 
      isValid: false, 
      error: `Model "${model}" not allowed. Allowed models: ${allowedModels.join(', ')}` 
    };
  }
  
  return { isValid: true };
}

/**
 * Comprehensive input validation for question generation
 */
export function validateGenerationRequest(request: {
  text: string;
  difficulty_distribution: { easy: number; medium: number; hard: number };
  custom_instructions?: string;
  model?: string;
}): { isValid: boolean; errors: string[]; sanitizedRequest?: any } {
  const errors: string[] = [];
  const sanitizedRequest = { ...request };
  
  // Validate source text
  const textResult = sanitizeSourceText(request.text);
  if (!textResult.isSafe) {
    errors.push(...textResult.warnings);
  }
  sanitizedRequest.text = textResult.sanitized;
  
  // Validate custom instructions
  if (request.custom_instructions) {
    const instructionsResult = sanitizeCustomInstructions(request.custom_instructions);
    if (!instructionsResult.isSafe) {
      errors.push(`Custom instructions: ${instructionsResult.warnings.join(', ')}`);
    }
    sanitizedRequest.custom_instructions = instructionsResult.sanitized;
  }
  
  // Validate difficulty distribution
  const distributionResult = validateDifficultyDistribution(request.difficulty_distribution);
  if (!distributionResult.isValid) {
    errors.push(distributionResult.error!);
  }
  
  // Validate model selection
  if (request.model) {
    const modelResult = validateModelSelection(request.model);
    if (!modelResult.isValid) {
      errors.push(modelResult.error!);
    }
  } else {
    sanitizedRequest.model = 'gemini-1.5-flash'; // Default model
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedRequest: errors.length === 0 ? sanitizedRequest : undefined,
  };
}
