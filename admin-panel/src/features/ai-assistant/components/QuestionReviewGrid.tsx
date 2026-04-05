import React, { useState } from 'react';
import { Trash2, Edit2, Save, X, AlertCircle } from 'lucide-react';
import { StatusBadge, StatusType } from '@/components/ui/status-badge';
import { CanonicalQuestionType } from '@questerix/core/constants/question-types';

export interface GeneratedQuestion {
  id: string;
  text: string;
  question_type: CanonicalQuestionType;
  difficulty: 'easy' | 'medium' | 'hard';
  metadata: {
    options?: string[];
    correct_answer?: string | string[];
    explanation?: string;
  };
  validation_errors?: string[];
}

interface QuestionReviewGridProps {
  questions: GeneratedQuestion[];
  onQuestionsChange: (questions: GeneratedQuestion[]) => void;
}

export const QuestionReviewGrid: React.FC<QuestionReviewGridProps> = ({
  questions,
  onQuestionsChange,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<GeneratedQuestion | null>(null);

  const handleStartEdit = (question: GeneratedQuestion) => {
    setEditingId(question.id);
    setEditForm({ ...question });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const handleSaveEdit = () => {
    if (!editForm) return;

    const updatedQuestions = questions.map((q) => (q.id === editForm.id ? editForm : q));
    onQuestionsChange(updatedQuestions);
    setEditingId(null);
    setEditForm(null);
  };

  const handleDelete = (id: string) => {
    const updatedQuestions = questions.filter((q) => q.id !== id);
    onQuestionsChange(updatedQuestions);
  };

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case 'multiple_choice':
        return 'Multiple Choice (Single)';
      case 'mcq_multi':
        return 'Multiple Choice (Multi)';
      case 'text_input':
        return 'Text Input';
      case 'boolean':
        return 'True/False';
      case 'reorder_steps':
        return 'Reorder Steps';
      default:
        return type;
    }
  };

  if (questions.length === 0) {
    return (
      <div className="text-center p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <p className="text-gray-500">No questions generated yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Generated Questions ({questions.length})
        </h3>
        <div
          className="flex items-center gap-3"
          role="status"
          aria-label="Question difficulty breakdown"
        >
          <div
            className="flex items-center gap-1.5"
            aria-label={`${questions.filter((q) => q.difficulty === 'easy').length} easy questions`}
          >
            <span className="w-2 h-2 rounded-full bg-green-500" aria-hidden="true" />
            <span className="text-sm font-medium text-gray-600">
              {questions.filter((q) => q.difficulty === 'easy').length} Easy
            </span>
          </div>
          <span className="text-gray-300" aria-hidden="true">
            ·
          </span>
          <div
            className="flex items-center gap-1.5"
            aria-label={`${questions.filter((q) => q.difficulty === 'medium').length} medium questions`}
          >
            <span className="w-2 h-2 rounded-full bg-yellow-500" aria-hidden="true" />
            <span className="text-sm font-medium text-gray-600">
              {questions.filter((q) => q.difficulty === 'medium').length} Medium
            </span>
          </div>
          <span className="text-gray-300" aria-hidden="true">
            ·
          </span>
          <div
            className="flex items-center gap-1.5"
            aria-label={`${questions.filter((q) => q.difficulty === 'hard').length} hard questions`}
          >
            <span className="w-2 h-2 rounded-full bg-red-500" aria-hidden="true" />
            <span className="text-sm font-medium text-gray-600">
              {questions.filter((q) => q.difficulty === 'hard').length} Hard
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3" role="list" aria-label="Generated questions list">
        {questions.map((question, index) => {
          const isEditing = editingId === question.id;
          const displayQuestion = isEditing && editForm ? editForm : question;

          return (
            <div
              key={question.id}
              role="listitem"
              aria-label={`Question ${index + 1}`}
              className={`
                border rounded-lg p-4 transition-all
                ${isEditing ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-white'}
                ${question.validation_errors && question.validation_errors.length > 0 ? 'border-red-300' : ''}
              `}
            >
              <div className="flex items-start gap-4">
                <div
                  className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-semibold text-gray-700"
                  aria-hidden="true"
                >
                  {index + 1}
                </div>

                <div className="flex-grow" aria-live="polite">
                  {/* Question Text */}
                  <div className="mb-3">
                    {isEditing ? (
                      <textarea
                        value={editForm?.text || ''}
                        onChange={(e) =>
                          setEditForm(editForm ? { ...editForm, text: e.target.value } : null)
                        }
                        className="w-full p-2 border border-gray-300 rounded-md text-sm"
                        rows={3}
                        aria-label={`Edit text for question ${index + 1}`}
                        autoFocus
                      />
                    ) : (
                      <p className="text-gray-800 font-medium">{displayQuestion.text}</p>
                    )}
                  </div>

                  {/* Metadata (Options, Answer, Explanation) */}
                  <div className="space-y-2 text-sm">
                    {displayQuestion.metadata.options && (
                      <div>
                        <span
                          className="font-semibold text-gray-600"
                          id={`q-${question.id}-options-label`}
                        >
                          Options:
                        </span>
                        <ul
                          className="list-disc list-inside text-gray-700 ml-2"
                          role="list"
                          aria-labelledby={`q-${question.id}-options-label`}
                        >
                          {displayQuestion.metadata.options.map((opt, i) => (
                            <li key={i} role="listitem">
                              {opt}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {displayQuestion.metadata.correct_answer && (
                      <div aria-label="Correct answer">
                        <span className="font-semibold text-gray-600">Answer:</span>{' '}
                        <span className="text-green-700 font-medium">
                          {Array.isArray(displayQuestion.metadata.correct_answer)
                            ? displayQuestion.metadata.correct_answer.join(', ')
                            : displayQuestion.metadata.correct_answer}
                        </span>
                      </div>
                    )}

                    {displayQuestion.metadata.explanation && (
                      <div aria-label="Explanation">
                        <span className="font-semibold text-gray-600">Explanation:</span>{' '}
                        <span className="text-gray-700">
                          {displayQuestion.metadata.explanation}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Validation Errors */}
                  {question.validation_errors && question.validation_errors.length > 0 && (
                    <div
                      className="mt-3 p-2 bg-red-50 border border-red-200 rounded-md"
                      role="alert"
                      aria-live="assertive"
                    >
                      <div className="flex items-start gap-2">
                        <AlertCircle
                          className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5"
                          aria-hidden="true"
                        />
                        <div className="text-xs text-red-700">
                          <p className="font-semibold mb-1">
                            Validation Errors for question {index + 1}:
                          </p>
                          {question.validation_errors.map((err, i) => (
                            <div key={i}>• {err}</div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Metadata Tags */}
                  <div className="flex items-center gap-2 mt-3" aria-label="Question tags">
                    <StatusBadge status={displayQuestion.difficulty as StatusType} />
                    <StatusBadge
                      status="draft"
                      label={getQuestionTypeLabel(displayQuestion.question_type)}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex-shrink-0 flex gap-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleSaveEdit}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                        aria-label={`Save changes to question ${index + 1}`}
                        title="Save changes"
                      >
                        <Save className="w-4 h-4" aria-hidden="true" />
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                        aria-label={`Cancel editing question ${index + 1}`}
                        title="Cancel"
                      >
                        <X className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleStartEdit(question)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        aria-label={`Edit question ${index + 1}`}
                        title="Edit question"
                      >
                        <Edit2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                      <button
                        onClick={() => handleDelete(question.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        aria-label={`Delete question ${index + 1}`}
                        title="Delete question"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
