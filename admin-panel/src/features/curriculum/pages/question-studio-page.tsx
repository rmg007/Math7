import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useApp } from '@/hooks/use-app';
import {
  useStudioGenerator,
  type DifficultyMix,
  type Domain,
  type QuestionType,
  type StudioConfig,
} from '@/hooks/use-studio-generator';
import { useToast } from '@/hooks/use-toast';
import { Database, Json } from '@/lib/database.types';
import { cn, toJson } from '@/lib/utils';
import {
  AlertCircle,
  BookOpen,
  Brain,
  Calculator,
  CheckSquare2,
  Code2,
  FlaskConical,
  Globe,
  Layers,
  RefreshCw,
  Save,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { useBlocker, useNavigate } from 'react-router-dom';
import { StudioQuestionCard } from '../components/studio-question-card';
import { useBulkCreateQuestions, type QuestionInsert } from '../hooks/use-questions';
import { useSkills } from '../hooks/use-skills';

// ─────────────────────────────────────────────────────────
// Domain config
// ─────────────────────────────────────────────────────────

const DOMAINS: { label: Domain; icon: React.ElementType; color: string; chips: string[] }[] = [
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

// ─────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────

export function QuestionStudioPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Config state
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState(10);
  const [customCount, setCustomCount] = useState(false);
  const [diffMix, setDiffMix] = useState<DifficultyMix>({ easy: 3, medium: 4, hard: 3 });
  const [selectedTypes, setSelectedTypes] = useState<QuestionType[]>(['mcq', 'text_input']);
  const [customInstructions, setCustomInstructions] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Deployment state
  const [skillId, setSkillId] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [reviewed, setReviewed] = useState(false);
  const [savingIdx, setSavingIdx] = useState<number | null>(null);

  // Hooks
  const { currentApp } = useApp();
  const studio = useStudioGenerator();
  const { data: skills } = useSkills();
  const bulkCreate = useBulkCreateQuestions();

  // ── Nav guard ─────────────────────────────────────────
  const blocker = useBlocker(() => studio.hasUnsaved);

  // ── Helpers ───────────────────────────────────────────
  const activeDomain = DOMAINS.find((d) => d.label === selectedDomain);

  const toggleType = (type: QuestionType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const applyPreset = (mix: DifficultyMix) => setDiffMix(mix);

  const handleCountChange = (n: number) => {
    setCount(n);
    // Scale current mix proportionally
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

  const canGenerate =
    selectedDomain !== null && topic.trim().length >= 3 && selectedTypes.length > 0;

  const handleGenerate = async () => {
    if (!selectedDomain || !canGenerate) return;

    if (studio.hasUnsaved) {
      const confirmed = window.confirm(
        'This will replace your current batch of staged questions. Continue?'
      );
      if (!confirmed) return;
    }
    setReviewed(false);

    const config: StudioConfig = {
      domain: selectedDomain,
      topic: topic.trim(),
      count,
      difficultyMix: diffMix,
      questionTypes: selectedTypes,
      customInstructions: customInstructions.trim() || undefined,
    };

    await studio.generateBatch(config);
  };

  const handleSave = async () => {
    if (!skillId) {
      toast({
        title: 'Select a skill',
        description: 'Questions must be linked to a skill.',
        variant: 'destructive',
      });
      return;
    }
    if (!reviewed) return;

    const keptQuestions = studio.stagedQuestions.filter((q) => q.kept);
    if (keptQuestions.length === 0) {
      toast({
        title: 'No questions to save',
        description: 'Keep at least one question.',
        variant: 'destructive',
      });
      return;
    }

    const payload: QuestionInsert[] = keptQuestions.map((q) => {
      let options: Json = null;
      let solution: Json = null;

      // Map question types to DB enum and format options/solution
      const dbType = q.question_type === 'mcq' ? 'multiple_choice' : q.question_type;

      if (q.question_type === 'mcq' || q.question_type === 'mcq_multi') {
        const mappedOptions = (q.metadata.options || []).map((text, i) => ({
          id: String.fromCharCode(97 + i), // a, b, c, d
          text,
        }));
        options = toJson({ options: mappedOptions });

        if (q.question_type === 'mcq') {
          const correctText = q.metadata.correct_answer as string;
          const correctIdx = q.metadata.options?.indexOf(correctText) ?? 0;
          solution = toJson({
            correct_option_id: String.fromCharCode(97 + Math.max(0, correctIdx)),
          });
        } else {
          const correctTexts = (q.metadata.correct_answer as string[]) || [];
          const correctIds = correctTexts
            .map((text) => {
              const idx = q.metadata.options?.indexOf(text) ?? -1;
              return idx !== -1 ? String.fromCharCode(97 + idx) : null;
            })
            .filter(Boolean);
          solution = toJson({ correct_ids: correctIds });
        }
      } else if (q.question_type === 'boolean') {
        options = toJson({ true_label: 'True', false_label: 'False' });
        solution = toJson({ correct_value: q.metadata.correct_answer === 'True' });
      } else if (q.question_type === 'text_input') {
        options = toJson({ placeholder: '' });
        solution = toJson({ exact_match: q.metadata.correct_answer });
      } else if (q.question_type === 'reorder_steps') {
        const steps = (q.metadata.options || []).map((text, i) => ({
          id: String(i + 1),
          text,
        }));
        options = toJson({ steps });
        // correct_answer from AI is expected to be the correct sequence of strings
        const correctTexts = (q.metadata.correct_answer as string[]) || [];
        const correctOrder = correctTexts
          .map((text) => {
            const idx = q.metadata.options?.indexOf(text) ?? -1;
            return idx !== -1 ? String(idx + 1) : null;
          })
          .filter(Boolean);
        solution = toJson({ correct_order: correctOrder });
      }

      return {
        content: q.text,
        type: dbType as Database['public']['Enums']['question_type'],
        skill_id: skillId,
        app_id: currentApp?.app_id as string, // Explicit app_id
        status: status as Database['public']['Enums']['curriculum_status'],
        points: 1,
        explanation: q.metadata.explanation || '',
        options,
        solution,
      } as QuestionInsert;
    });

    try {
      await bulkCreate.mutateAsync(payload);
      toast({
        title: `✓ ${keptQuestions.length} questions saved!`,
        description: `Added to ${skills?.find((s) => s.skill_id === skillId)?.title ?? 'skill'} as ${status}.`,
      });
      studio.resetBatch();
      navigate('/questions');
    } catch (err) {
      toast({
        title: 'Save failed',
        description: err instanceof Error ? err.message : 'An error occurred.',
        variant: 'destructive',
      });
    }
  };

  // ── Blocker dialog ────────────────────────────────────
  if (blocker.state === 'blocked') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-in fade-in zoom-in duration-200">
          <div className="w-14 h-14 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center">
            <AlertCircle className="h-7 w-7 text-amber-600" />
          </div>
          <h2 className="text-xl font-bold text-center text-gray-900 mb-2">Unsaved Questions</h2>
          <p className="text-center text-gray-500 text-sm mb-6">
            You have {studio.keptCount} staged questions that haven't been saved. If you leave now,
            they'll be lost.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => blocker.reset()}>
              Stay & Save
            </Button>
            <Button
              className="flex-1 bg-rose-600 hover:bg-rose-700 text-white"
              onClick={() => blocker.proceed()}
            >
              Leave Anyway
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-screen">
      {/* Page header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center shadow-md shadow-indigo-200">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">AI Question Studio</h1>
            <p className="text-xs text-gray-400">Generate, review, and save question batches</p>
          </div>
        </div>
        {studio.stagedQuestions.length > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">
              {studio.keptCount} of {studio.stagedQuestions.length} kept
            </span>
            {studio.editedCount > 0 && (
              <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 font-semibold border border-amber-100">
                {studio.editedCount} edited
              </span>
            )}
          </div>
        )}
      </div>

      {/* Three-panel body */}
      <div className="flex flex-1 gap-0 overflow-hidden">
        {/* ────────────────────────────────────────────────── */}
        {/* LEFT PANEL — Configuration                        */}
        {/* ────────────────────────────────────────────────── */}
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
                    <span
                      className={cn('text-[10px]', isActive ? 'text-indigo-200' : 'text-gray-400')}
                    >
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
              onClick={handleGenerate}
              disabled={!canGenerate || studio.status === 'generating'}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white shadow-md shadow-indigo-200 font-semibold gap-2"
            >
              {studio.status === 'generating' ? (
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

        {/* ────────────────────────────────────────────────── */}
        {/* CENTER PANEL — Staging Canvas                     */}
        {/* ────────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto bg-gray-50/30 p-6 space-y-4">
          {/* Bulk actions bar */}
          {studio.stagedQuestions.length > 0 && (
            <div className="flex items-center justify-between bg-white rounded-xl border border-gray-100 px-4 py-2.5 shadow-sm sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={studio.keepAll}
                  className="h-7 text-xs gap-1 text-emerald-600 hover:bg-emerald-50"
                >
                  <CheckSquare2 className="h-3.5 w-3.5" /> Keep All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={studio.removeAll}
                  className="h-7 text-xs gap-1 text-rose-500 hover:bg-rose-50"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Remove All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={studio.resetBatch}
                  className="h-7 text-xs gap-1 text-gray-400 hover:bg-gray-100"
                >
                  <X className="h-3.5 w-3.5" /> Clear
                </Button>
              </div>
              <span className="text-xs text-gray-400 font-medium">
                {studio.keptCount} kept · {studio.removedCount} removed
                {studio.editedCount > 0 && ` · ${studio.editedCount} edited`}
              </span>
            </div>
          )}

          {/* Idle empty state */}
          {studio.status === 'idle' && studio.stagedQuestions.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
              <div className="relative">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-indigo-200">
                  <Sparkles className="h-10 w-10 text-white" />
                </div>
                <div className="absolute -inset-4 bg-indigo-100 rounded-full blur-2xl opacity-60 -z-10" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">AI Question Studio</h2>
                <p className="text-gray-400 text-sm max-w-sm">
                  Choose a domain and topic on the left, then click{' '}
                  <strong className="text-indigo-600">Generate</strong> to create your question
                  batch.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center max-w-sm">
                {[
                  'Integer Negatives',
                  'First Conditional',
                  'The French Revolution',
                  'Python Loops',
                  'Vocabulary B2',
                ].map((s) => (
                  <span
                    key={s}
                    className="text-xs px-3 py-1.5 bg-white border border-gray-200 rounded-full text-gray-500 shadow-sm"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Generating skeleton */}
          {studio.status === 'generating' && (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-xl border bg-white shadow-sm p-4 animate-pulse">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-200 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-4/5" />
                      <div className="h-4 bg-gray-200 rounded w-3/5" />
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-1.5">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <div key={j} className="h-7 bg-gray-100 rounded-lg" />
                    ))}
                  </div>
                </div>
              ))}
              <p className="text-center text-sm text-gray-400 font-medium animate-pulse">
                ✦ Building your questions...
              </p>
            </div>
          )}

          {/* Error state */}
          {studio.status === 'error' && (
            <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
              <div className="w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center">
                <AlertCircle className="h-7 w-7 text-rose-500" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-gray-800">Generation Failed</h3>
                <p className="text-sm text-gray-500 mt-1">Check the configuration and try again.</p>
              </div>
              <Button
                onClick={handleGenerate}
                disabled={!canGenerate}
                variant="outline"
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" /> Retry Generation
              </Button>
            </div>
          )}

          {/* Question cards */}
          {studio.stagedQuestions.length > 0 && studio.status !== 'generating' && (
            <div className="space-y-3">
              {studio.stagedQuestions.map((q, i) => (
                <StudioQuestionCard
                  key={q.id}
                  question={q}
                  index={i}
                  isRegenerating={savingIdx === i}
                  onToggleKeep={() => studio.toggleKeep(i)}
                  onCycleDifficulty={() => studio.cycleDifficulty(i)}
                  onShiftDifficulty={(dir) => studio.shiftDifficulty(i, dir)}
                  onRegenerate={async () => {
                    setSavingIdx(i);
                    const config: StudioConfig = {
                      domain: selectedDomain ?? 'General Knowledge',
                      topic: topic.trim(),
                      count,
                      difficultyMix: diffMix,
                      questionTypes: selectedTypes,
                      customInstructions: customInstructions.trim() || undefined,
                    };
                    await studio.regenerateSingle(i, config);
                    setSavingIdx(null);
                  }}
                  onUpdate={(patch) => studio.updateCard(i, patch)}
                />
              ))}
            </div>
          )}
        </main>

        {/* ────────────────────────────────────────────────── */}
        {/* RIGHT PANEL — Deployment                          */}
        {/* ────────────────────────────────────────────────── */}
        <aside className="w-72 flex-shrink-0 border-l border-gray-100 bg-white overflow-y-auto p-5 space-y-5">
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-1 flex items-center gap-2">
              <Layers className="h-4 w-4 text-indigo-500" />
              Deployment
            </h3>
            <p className="text-xs text-gray-400">Link these questions to your curriculum.</p>
          </div>

          {/* Skill selector */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Target Skill
            </Label>
            <Select value={skillId} onValueChange={setSkillId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a skill..." />
              </SelectTrigger>
              <SelectContent>
                {skills?.map((s) => (
                  <SelectItem key={s.skill_id} value={s.skill_id}>
                    <span>{s.title}</span>
                    {s.domains?.title && (
                      <span className="ml-1.5 text-xs text-gray-400">({s.domains.title})</span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Initial Status
            </Label>
            <div className="flex gap-2">
              {(['draft', 'published'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={cn(
                    'flex-1 h-9 rounded-lg border text-sm font-semibold capitalize transition-colors',
                    status === s
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white border-gray-200 text-gray-500 hover:border-indigo-300'
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Batch summary */}
          {studio.stagedQuestions.length > 0 && (
            <div className="bg-gray-50 rounded-xl border border-gray-100 p-3 space-y-1.5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Batch Summary
              </p>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Kept</span>
                <span className="font-bold text-emerald-700">{studio.keptCount}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Removed</span>
                <span className="font-bold text-rose-500">{studio.removedCount}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Edited</span>
                <span className="font-bold text-amber-600">{studio.editedCount}</span>
              </div>
              <div className="border-t border-gray-200 pt-1.5 flex justify-between text-xs">
                <span className="text-gray-500">Will Save</span>
                <span className="font-bold text-indigo-600">{studio.keptCount}</span>
              </div>
            </div>
          )}

          {/* Review guardrail */}
          {studio.keptCount > 0 && (
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={reviewed}
                onChange={(e) => setReviewed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 accent-indigo-600 cursor-pointer"
              />
              <span className="text-xs text-gray-600 leading-relaxed group-hover:text-gray-800 transition-colors">
                I have reviewed all {studio.keptCount} questions for accuracy and appropriateness.
              </span>
            </label>
          )}

          {/* Save button */}
          <Button
            onClick={handleSave}
            disabled={studio.keptCount === 0 || !reviewed || !skillId || bulkCreate.isPending}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold gap-2 disabled:opacity-50"
          >
            {bulkCreate.isPending ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" /> Save {studio.keptCount > 0 ? studio.keptCount : ''}{' '}
                Questions
              </>
            )}
          </Button>

          {studio.keptCount === 0 && studio.stagedQuestions.length > 0 && (
            <p className="text-[11px] text-gray-400 text-center">
              Keep at least one question to save.
            </p>
          )}
          {studio.keptCount > 0 && !reviewed && (
            <p className="text-[11px] text-gray-400 text-center">
              Check the review box above to enable saving.
            </p>
          )}
          {studio.keptCount > 0 && reviewed && !skillId && (
            <p className="text-[11px] text-rose-400 text-center font-medium">
              Select a target skill.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
