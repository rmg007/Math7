import { act, render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { QuestionReviewGrid, GeneratedQuestion } from '../QuestionReviewGrid';

const mockQuestions: GeneratedQuestion[] = [
  {
    id: '1',
    text: 'What is 2+2?',
    question_type: 'multiple_choice',
    difficulty: 'easy',
    metadata: {
      options: ['3', '4', '5'],
      correct_answer: '4',
      explanation: 'Basic addition',
    },
  },
  {
    id: '2',
    text: 'Capital of France?',
    question_type: 'text_input',
    difficulty: 'medium',
    metadata: {
      correct_answer: 'Paris',
    },
    validation_errors: ['Missing explanation'],
  },
];

describe('QuestionReviewGrid', () => {
  it('renders "No questions" message when list is empty', () => {
    render(<QuestionReviewGrid questions={[]} onQuestionsChange={vi.fn()} />);
    expect(screen.getByText(/no questions generated yet/i)).toBeInTheDocument();
  });

  it('renders all questions in the list', () => {
    render(<QuestionReviewGrid questions={mockQuestions} onQuestionsChange={vi.fn()} />);
    expect(screen.getByText('What is 2+2?')).toBeInTheDocument();
    expect(screen.getByText('Capital of France?')).toBeInTheDocument();
  });

  it('shows difficulty breakdown stats', () => {
    render(<QuestionReviewGrid questions={mockQuestions} onQuestionsChange={vi.fn()} />);
    expect(screen.getByText('1 Easy')).toBeInTheDocument();
    expect(screen.getByText('1 Medium')).toBeInTheDocument();
    expect(screen.getByText('0 Hard')).toBeInTheDocument();
  });

  it('enters editing mode when edit button clicked', () => {
    render(<QuestionReviewGrid questions={mockQuestions} onQuestionsChange={vi.fn()} />);
    const editButtons = screen.getAllByTitle('Edit question');
    act(() => {
      fireEvent.click(editButtons[0]);
    });

    expect(screen.getByDisplayValue('What is 2+2?')).toBeInTheDocument();
    expect(screen.getByTitle('Save changes')).toBeInTheDocument();
    expect(screen.getByTitle('Cancel')).toBeInTheDocument();
  });

  it('calls onQuestionsChange when a question is deleted', () => {
    const onQuestionsChange = vi.fn();
    render(<QuestionReviewGrid questions={mockQuestions} onQuestionsChange={onQuestionsChange} />);
    const deleteButtons = screen.getAllByTitle('Delete question');
    act(() => {
      fireEvent.click(deleteButtons[0]);
    });

    expect(onQuestionsChange).toHaveBeenCalledWith([mockQuestions[1]]);
  });

  it('calls onQuestionsChange with updated text after saving edits', () => {
    const onQuestionsChange = vi.fn();
    render(<QuestionReviewGrid questions={mockQuestions} onQuestionsChange={onQuestionsChange} />);

    // Start edit
    act(() => {
      fireEvent.click(screen.getAllByTitle('Edit question')[0]);
    });

    // Change text
    const textarea = screen.getByDisplayValue('What is 2+2?');
    act(() => {
      fireEvent.change(textarea, { target: { value: 'Updated Question' } });
    });

    // Save
    act(() => {
      fireEvent.click(screen.getByTitle('Save changes'));
    });

    expect(onQuestionsChange).toHaveBeenCalledWith([
      { ...mockQuestions[0], text: 'Updated Question' },
      mockQuestions[1],
    ]);
  });

  it('displays validation errors if present', () => {
    render(<QuestionReviewGrid questions={mockQuestions} onQuestionsChange={vi.fn()} />);
    expect(screen.getByText(/validation errors for question 2/i)).toBeInTheDocument();
    expect(screen.getByText(/• missing explanation/i)).toBeInTheDocument();
  });

  it('renders question metadata like options and explanations', () => {
    render(<QuestionReviewGrid questions={mockQuestions} onQuestionsChange={vi.fn()} />);
    expect(screen.getByText('Basic addition')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    // '4' appears twice: in the options and in the difficulty breakdown stats (if there were 4 easy/medium/hard, but here it's because of some other reason?)
    // Actually, '4' is also part of 'What is 2+2?' -> '4' is the answer.
    // Let's use getAllByText or check for the specific one.
    expect(screen.getAllByText('4').length).toBeGreaterThan(0);
    expect(screen.getByText('5')).toBeInTheDocument();
  });
});
