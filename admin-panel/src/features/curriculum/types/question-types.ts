export type QuestionType =
  | 'multiple_choice'
  | 'mcq_multi'
  | 'text_input'
  | 'boolean'
  | 'reorder_steps';

export interface McqOption {
  id: string;
  text: string;
}

export interface McqOptions {
  options: McqOption[];
}

export interface BooleanOptions {
  true_label: string;
  false_label: string;
}

export interface TextInputOptions {
  placeholder: string;
}

export interface ReorderStepsOptions {
  steps: McqOption[];
}

export type QuestionOptions =
  | McqOptions
  | BooleanOptions
  | TextInputOptions
  | ReorderStepsOptions;

export interface McqSolution {
  correct_option_id: string;
}

export interface McqMultiSolution {
  correct_ids: string[];
}

export interface BooleanSolution {
  correct_value: boolean;
}

export interface TextInputSolution {
  exact_match: string;
}

export interface ReorderStepsSolution {
  correct_order: string[];
}

export type QuestionSolution =
  | McqSolution
  | McqMultiSolution
  | BooleanSolution
  | TextInputSolution
  | ReorderStepsSolution;
