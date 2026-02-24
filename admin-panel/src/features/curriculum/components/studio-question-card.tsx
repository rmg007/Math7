import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { Difficulty, StagedQuestion } from '@/hooks/use-studio-generator';
import { cn } from '@/lib/utils';
import {
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Edit3,
    RefreshCw,
    Trash2,
    TrendingDown,
    TrendingUp,
} from 'lucide-react';
import { useState } from 'react';

interface StudioQuestionCardProps {
  question: StagedQuestion;
  index: number;
  onToggleKeep: () => void;
  onCycleDifficulty: () => void;
  onShiftDifficulty: (dir: 'up' | 'down') => void;
  onRegenerate: () => void;
  onUpdate: (patch: Partial<StagedQuestion>) => void;
  isRegenerating?: boolean;
}

const DIFFICULTY_STYLES: Record<Difficulty, { label: string; className: string }> = {
  easy: { label: 'Easy', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  medium: { label: 'Medium', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  hard: { label: 'Hard', className: 'bg-rose-100 text-rose-700 border-rose-200' },
};

const TYPE_LABELS: Record<string, string> = {
  mcq: 'MCQ',
  mcq_multi: 'MCQ Multi',
  text_input: 'Short Answer',
  boolean: 'True / False',
  reorder_steps: 'Reorder',
  matching: 'Matching',
};

export function StudioQuestionCard({
  question,
  index,
  onToggleKeep,
  onCycleDifficulty,
  onShiftDifficulty,
  onRegenerate,
  onUpdate,
  isRegenerating = false,
}: StudioQuestionCardProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [editText, setEditText] = useState(question.text);
  const [editExplanation, setEditExplanation] = useState(
    question.metadata.explanation ?? ''
  );

  const diffStyle = DIFFICULTY_STYLES[question.difficulty];

  const handleSaveEdit = () => {
    onUpdate({
      text: editText,
      metadata: { ...question.metadata, explanation: editExplanation },
    });
    setIsEditMode(false);
  };

  const handleCancelEdit = () => {
    setEditText(question.text);
    setEditExplanation(question.metadata.explanation ?? '');
    setIsEditMode(false);
  };

  return (
    <div
      className={cn(
        'relative rounded-xl border bg-white shadow-sm transition-all duration-200',
        'animate-in fade-in slide-in-from-bottom-2 duration-300',
        !question.kept && 'opacity-50 bg-gray-50',
        question.edited && question.kept && 'border-indigo-200 shadow-indigo-100'
      )}
    >
      {/* Card header */}
      <div className="flex items-start gap-3 px-4 pt-4 pb-3">
        {/* Q# badge */}
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-white text-xs font-bold shadow-sm">
          {index + 1}
        </div>

        {/* Question text */}
        <div className="flex-1 min-w-0">
          {isEditMode ? (
            <Textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="text-sm font-medium leading-relaxed min-h-[80px] resize-none"
              autoFocus
            />
          ) : (
            <p
              className={cn(
                'text-sm font-medium text-gray-900 leading-relaxed',
                !question.kept && 'line-through text-gray-400'
              )}
            >
              {question.text}
            </p>
          )}
        </div>

        {/* Badges row */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Edited indicator */}
          {question.edited && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-500 border border-indigo-100">
              edited
            </span>
          )}
          {/* Type badge */}
          <span className="text-[10px] font-semibold px-2 py-1 rounded bg-gray-100 text-gray-500 border border-gray-200 whitespace-nowrap">
            {TYPE_LABELS[question.question_type] ?? question.question_type}
          </span>
          {/* Difficulty pill — clickable to cycle */}
          <button
            onClick={onCycleDifficulty}
            title="Click to cycle difficulty"
            className={cn(
              'text-[10px] font-bold px-2 py-1 rounded border transition-colors cursor-pointer',
              diffStyle.className
            )}
          >
            {diffStyle.label}
          </button>
        </div>
      </div>

      {/* MCQ options */}
      {(question.question_type === 'mcq' || question.question_type === 'mcq_multi') &&
        question.metadata.options && (
          <div className="px-4 pb-2 grid grid-cols-2 gap-1.5">
            {question.metadata.options.map((opt, i) => {
              const isCorrect = Array.isArray(question.metadata.correct_answer)
                ? question.metadata.correct_answer.includes(opt)
                : question.metadata.correct_answer === opt;
              return (
                <div
                  key={i}
                  className={cn(
                    'text-xs px-2.5 py-1.5 rounded-lg border transition-colors',
                    isCorrect
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-semibold'
                      : 'bg-gray-50 border-gray-200 text-gray-600'
                  )}
                >
                  <span className="font-bold mr-1 opacity-50">
                    {String.fromCharCode(65 + i)}.
                  </span>
                  {opt}
                </div>
              );
            })}
          </div>
        )}

      {/* Short answer / boolean answer */}
      {(question.question_type === 'text_input' || question.question_type === 'boolean') &&
        question.metadata.correct_answer && (
          <div className="px-4 pb-2">
            <span className="text-xs bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold px-2.5 py-1 rounded-lg">
              ✓{' '}
              {Array.isArray(question.metadata.correct_answer)
                ? question.metadata.correct_answer.join(', ')
                : question.metadata.correct_answer}
            </span>
          </div>
        )}

      {/* Reorder steps */}
      {question.question_type === 'reorder_steps' && question.metadata.options && (
        <div className="px-4 pb-2 space-y-1">
          {question.metadata.options.map((step, i) => (
            <div
              key={i}
              className="text-xs flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700"
            >
              <span className="font-bold text-gray-400">{i + 1}.</span>
              {step}
            </div>
          ))}
        </div>
      )}

      {/* Explanation (collapsible) */}
      {question.metadata.explanation && (
        <div className="px-4 pb-2">
          <button
            onClick={() => setShowExplanation((s) => !s)}
            className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-600 font-medium transition-colors"
          >
            {showExplanation ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
            {showExplanation ? 'Hide' : 'Show'} explanation
          </button>
          {showExplanation && (
            <div className="mt-2">
              {isEditMode ? (
                <Textarea
                  value={editExplanation}
                  onChange={(e) => setEditExplanation(e.target.value)}
                  className="text-xs text-gray-600 leading-relaxed min-h-[60px] resize-none"
                  placeholder="Explanation..."
                />
              ) : (
                <p className="text-xs text-gray-500 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 leading-relaxed">
                  💡 {question.metadata.explanation}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Edit mode save/cancel */}
      {isEditMode && (
        <div className="px-4 pb-3 flex gap-2">
          <Button size="sm" onClick={handleSaveEdit} className="text-xs h-7 bg-indigo-600 hover:bg-indigo-700 text-white">
            Save
          </Button>
          <Button size="sm" variant="ghost" onClick={handleCancelEdit} className="text-xs h-7">
            Cancel
          </Button>
        </div>
      )}

      {/* Divider + Actions */}
      <div className="border-t border-gray-100 px-4 py-2 flex items-center justify-between">
        {/* Left actions */}
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleKeep}
            title={question.kept ? 'Remove from batch' : 'Keep in batch'}
            className={cn(
              'h-7 px-2 text-xs gap-1',
              question.kept
                ? 'text-emerald-600 hover:text-rose-600 hover:bg-rose-50'
                : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'
            )}
          >
            {question.kept ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Keep</span>
              </>
            ) : (
              <>
                <Trash2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Removed</span>
              </>
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (!isEditMode) setShowExplanation(false);
              setIsEditMode((e) => !e);
            }}
            title="Edit this question"
            className="h-7 px-2 text-xs gap-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"
          >
            <Edit3 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Edit</span>
          </Button>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onShiftDifficulty('down')}
            disabled={question.difficulty === 'easy'}
            title="Make easier"
            className="h-7 px-2 text-xs text-gray-400 hover:text-amber-600 hover:bg-amber-50"
          >
            <TrendingDown className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onShiftDifficulty('up')}
            disabled={question.difficulty === 'hard'}
            title="Make harder"
            className="h-7 px-2 text-xs text-gray-400 hover:text-rose-600 hover:bg-rose-50"
          >
            <TrendingUp className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRegenerate}
            disabled={isRegenerating}
            title="Regenerate this question"
            className="h-7 px-2 text-xs gap-1 text-gray-400 hover:text-purple-600 hover:bg-purple-50"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', isRegenerating && 'animate-spin')} />
            <span className="hidden sm:inline">Redo</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
