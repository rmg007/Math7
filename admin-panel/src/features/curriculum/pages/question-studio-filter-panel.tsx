import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { DifficultyMix, Domain, QuestionType } from '@/hooks/use-studio-generator';
import { cn } from '@/lib/utils';
import {
  BookOpen,
  Brain,
  Calculator,
  Code2,
  FlaskConical,
  Globe,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import type { ElementType } from 'react';

const DOMAINS: { label: Domain; icon: ElementType; color: string; chips: string[] }[] = [
  {
    label: 'Mathematics',
    icon: Calculator,
    color: 'from-blue-500 to-indigo-600',
    chips: [
      'Integer Operations',
      'Algebra',
      'Geometry',
      'Trigonometry',
      'Statistics',
      'Calculus',
      'Fractions & Decimals',
    ],
  },
  {
    label: 'English Language',
    icon: BookOpen,
    color: 'from-emerald-500 to-teal-600',
    chips: [
      'Grammar',
      'Vocabulary',
      'Reading Comprehension',
      'First Conditional',
      'Writing',
      'Punctuation',
    ],
  },
  {
    label: 'History',
    icon: Globe,
    color: 'from-amber-500 to-orange-600',
    chips: [
      'World War II',
      'Industrial Revolution',
      'Ancient Civilizations',
      'Cold War',
      'French Revolution',
    ],
  },
  {
    label: 'Science',
    icon: FlaskConical,
    color: 'from-rose-500 to-pink-600',
    chips: ['Physics', 'Chemistry', 'Biology', 'Earth Science', 'Forces & Motion'],
  },
  {
    label: 'Computer Science',
    icon: Code2,
    color: 'from-violet-500 to-purple-600',
    chips: ['Algorithms', 'Programming Logic', 'Data Structures', 'Pseudocode', 'Python Basics'],
  },
  {
    label: 'General Knowledge',
    icon: Brain,
    color: 'from-sky-500 to-cyan-600',
    chips: ['Geography', 'Current Affairs', 'Science Facts', 'Arts & Culture'],
  },
];

const QUESTION_TYPES: { key: QuestionType; label: string; desc: string }[] = [
  { key: 'mcq', label: 'MCQ', desc: 'Single correct' },
  { key: 'mcq_multi', label: 'MCQ Multi', desc: 'Multiple correct' },
  { key: 'boolean', label: 'True / False', desc: 'Binary choice' },
  { key: 'text_input', label: 'Short Answer', desc: 'Text response' },
  { key: 'reorder_steps', label: 'Reorder', desc: 'Sequence logic' },
];

const QUANTITY_PRESETS = [5, 10, 20, 30];

const DIFFICULTY_PRESETS: { label: string; mix: (count: number) => DifficultyMix }[] = [
  {
    label: 'Balanced',
    mix: (n) => ({
      easy: Math.floor(n / 3),
      medium: Math.floor(n / 3),
      hard: n - 2 * Math.floor(n / 3),
    }),
  },
  {
    label: 'Beginner',
    mix: (n) => ({
      easy: Math.round(n * 0.7),
      medium: Math.round(n * 0.2),
      hard: n - Math.round(n * 0.7) - Math.round(n * 0.2),
    }),
  },
  {
    label: 'Challenge',
    mix: (n) => ({
      easy: Math.round(n * 0.1),
      medium: Math.round(n * 0.3),
      hard: n - Math.round(n * 0.1) - Math.round(n * 0.3),
    }),
  },
  {
    label: 'Exam Prep',
    mix: (n) => ({
      easy: Math.round(n * 0.2),
      medium: Math.round(n * 0.4),
      hard: n - Math.round(n * 0.2) - Math.round(n * 0.4),
    }),
  },
];

interface QuestionStudioFilterPanelProps {
  selectedDomain: Domain | null;
  setSelectedDomain: (domain: Domain | null) => void;
  topic: string;
  setTopic: (topic: string) => void;
  count: number;
  setCount: (n: number) => void;
  customCount: boolean;
  setCustomCount: (custom: boolean) => void;
  diffMix: DifficultyMix;
  setDiffMix: (mix: DifficultyMix) => void;
  selectedTypes: QuestionType[];
  setSelectedTypes: React.Dispatch<React.SetStateAction<QuestionType[]>>;
  customInstructions: string;
  setCustomInstructions: (instructions: string) => void;
  showAdvanced: boolean;
  setShowAdvanced: React.Dispatch<React.SetStateAction<boolean>>;
  isGenerating: boolean;
  canGenerate: boolean;
  onGenerate: () => void;
}

export function QuestionStudioFilterPanel({
  selectedDomain,
  setSelectedDomain,
  topic,
  setTopic,
  count,
  setCount,
  customCount,
  setCustomCount,
  diffMix,
  setDiffMix,
  selectedTypes,
  setSelectedTypes,
  customInstructions,
  setCustomInstructions,
  showAdvanced,
  setShowAdvanced,
  isGenerating,
  canGenerate,
  onGenerate,
}: QuestionStudioFilterPanelProps) {
  const activeDomain = DOMAINS.find((d) => d.label === selectedDomain);

  const handleCountChange = (n: number) => {
    setCount(n);
    const total = diffMix.easy + diffMix.medium + diffMix.hard || 10;
    setDiffMix({
      easy: Math.round((diffMix.easy / total) * n),
      medium: Math.round((diffMix.medium / total) * n),
      hard: n - Math.round((diffMix.easy / total) * n) - Math.round((diffMix.medium / total) * n),
    });
  };

  const handleDiffInput = (key: keyof DifficultyMix, value: number) => {
    const newMix = { ...diffMix, [key]: Math.max(0, value) };
    setDiffMix(newMix);
    setCount(newMix.easy + newMix.medium + newMix.hard);
  };

  const toggleType = (type: QuestionType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const applyPreset = (mix: DifficultyMix) => setDiffMix(mix);

  return (
    <aside className="w-80 flex-shrink-0 border-r border-gray-100 bg-gray-50/70 overflow-y-auto p-5 space-y-5">
      {/* Domain selector */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Subject Domain
        </Label>
        <div className="grid grid-cols-2 gap-2">
          {DOMAINS.map((d) => {
            const Icon = d.icon;
            const isActive = selectedDomain === d.label;
            return (
              <button
                key={d.label}
                onClick={() => {
                  setSelectedDomain(d.label);
                  setTopic('');
                }}
                className={cn(
                  'flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-semibold transition-all duration-150',
                  isActive
                    ? 'border-indigo-300 bg-indigo-50 text-indigo-700 shadow-sm'
                    : 'border-gray-200 bg-white text-gray-500 hover:border-indigo-200 hover:bg-indigo-50/50'
                )}
              >
                <div
                  className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br text-white shadow-sm',
                    isActive ? d.color : 'from-gray-300 to-gray-400'
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <span className="leading-tight text-center">{d.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Topic input + chips */}
      {selectedDomain && (
        <div className="space-y-2 animate-in fade-in duration-200">
          <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Topic
          </Label>
          <Input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={`e.g. "${activeDomain?.chips[0] ?? 'Enter specific topic'}"`}
            className="text-sm"
          />
          {activeDomain && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {activeDomain.chips.map((chip) => (
                <button
                  key={chip}
                  onClick={() => setTopic(chip)}
                  className={cn(
                    'text-[11px] px-2 py-1 rounded-full border transition-colors',
                    topic === chip
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600'
                  )}
                >
                  {chip}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quantity */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Number of Questions
        </Label>
        <div className="flex gap-1.5">
          {QUANTITY_PRESETS.map((n) => (
            <button
              key={n}
              onClick={() => {
                handleCountChange(n);
                setCustomCount(false);
              }}
              className={cn(
                'flex-1 h-9 rounded-lg border text-sm font-semibold transition-colors',
                !customCount && count === n
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300'
              )}
            >
              {n}
            </button>
          ))}
          <button
            onClick={() => setCustomCount(true)}
            className={cn(
              'flex-1 h-9 rounded-lg border text-sm font-semibold transition-colors',
              customCount
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300'
            )}
          >
            Custom
          </button>
        </div>
        {customCount && (
          <Input
            type="number"
            min={1}
            max={50}
            value={count}
            onChange={(e) =>
              handleCountChange(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))
            }
            className="text-sm"
            placeholder="Enter number (1–50)"
          />
        )}
      </div>

      {/* Difficulty Mixer */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Difficulty Mix
          </Label>
          <span
            className={cn(
              'text-[11px] font-semibold',
              diffMix.easy + diffMix.medium + diffMix.hard !== count
                ? 'text-rose-500'
                : 'text-gray-400'
            )}
          >
            Total: {diffMix.easy + diffMix.medium + diffMix.hard} / {count}
          </span>
        </div>
        {/* Presets */}
        <div className="grid grid-cols-2 gap-1.5">
          {DIFFICULTY_PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => applyPreset(p.mix(count))}
              className="h-7 rounded-lg border border-gray-200 bg-white text-[11px] font-semibold text-gray-500 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
        {/* Manual inputs */}
        <div className="grid grid-cols-3 gap-2">
          {(['easy', 'medium', 'hard'] as const).map((d) => (
            <div key={d} className="space-y-1">
              <label
                className={cn(
                  'text-[10px] font-bold uppercase tracking-wide block',
                  d === 'easy'
                    ? 'text-emerald-600'
                    : d === 'medium'
                      ? 'text-amber-600'
                      : 'text-rose-600'
                )}
              >
                {d}
              </label>
              <Input
                type="number"
                min={0}
                value={diffMix[d]}
                onChange={(e) => handleDiffInput(d, parseInt(e.target.value) || 0)}
                className="h-8 text-sm text-center font-semibold"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Question type chips */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Question Types
        </Label>
        <div className="grid grid-cols-2 gap-1.5">
          {QUESTION_TYPES.map(({ key, label, desc }) => {
            const isActive = selectedTypes.includes(key);
            return (
              <button
                key={key}
                onClick={() => toggleType(key)}
                className={cn(
                  'flex flex-col items-start px-3 py-2 rounded-xl border text-left transition-all',
                  isActive
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300'
                )}
              >
                <span className="text-xs font-bold">{label}</span>
                <span className={cn('text-[10px]', isActive ? 'text-indigo-200' : 'text-gray-400')}>
                  {desc}
                </span>
              </button>
            );
          })}
        </div>
        {selectedTypes.length === 0 && (
          <p className="text-[11px] text-rose-500 font-medium">Select at least one type</p>
        )}
      </div>

      {/* Advanced section */}
      <div className="space-y-2">
        <button
          onClick={() => setShowAdvanced((s) => !s)}
          className="text-xs font-semibold text-indigo-500 hover:text-indigo-700 transition-colors"
        >
          {showAdvanced ? '− Hide' : '+ Add'} Custom Instructions
        </button>
        {showAdvanced && (
          <Textarea
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            placeholder='e.g. "Avoid questions involving fractions" or "Use a story context for each question"'
            className="min-h-[80px] text-xs resize-none"
          />
        )}
      </div>

      {/* Generate button */}
      <div className="pt-2 space-y-2">
        {canGenerate && (
          <p className="text-[11px] text-gray-400 leading-snug bg-gray-100 rounded-lg px-3 py-2">
            Generating <strong>{count}</strong> {selectedDomain} questions on{' '}
            <strong>"{topic}"</strong> ({diffMix.easy}E / {diffMix.medium}M / {diffMix.hard}H)
          </p>
        )}
        <Button
          onClick={onGenerate}
          disabled={!canGenerate || isGenerating}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white shadow-md shadow-indigo-200 font-semibold gap-2"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" /> Generating...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" /> Generate {count} Questions
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
