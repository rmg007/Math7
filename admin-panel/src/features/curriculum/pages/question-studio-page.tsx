import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useApp } from '@/hooks/use-app';
import {
  useStudioGenerator,
  type DifficultyMix,
  type QuestionType,
  type StudioConfig,
} from '@/hooks/use-studio-generator';
import { useToast } from '@/hooks/use-toast';
import { Database, Json } from '@questerix/core/types/database';
import { cn, toJson } from '@/lib/utils';
import { AlertCircle, Layers, RefreshCw, Save, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useBlocker, useNavigate, useSearchParams } from 'react-router-dom';
import { StudioQuestionCard } from '../components/studio-question-card';
import { type QuestionInsert } from '../hooks/use-questions';
import { useBulkCreateQuestions } from '../hooks/use-questions-bulk';
import { useSkills } from '../hooks/use-skills';
import { useUpdateStudioPrompt } from '../hooks/use-studio-prompts';
import { QuestionStudioBulkActions } from './question-studio-bulk-actions';
import { QuestionStudioFilterPanel } from './question-studio-filter-panel';

export function QuestionStudioPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Config state
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [topics, setTopics] = useState<string[]>([]);
  const [count, setCount] = useState(10);
  const [diffMix, setDiffMix] = useState<DifficultyMix>({ easy: 3, medium: 4, hard: 3 });
  const [diffPreset, setDiffPreset] = useState('Balanced');
  const [selectedTypes, setSelectedTypes] = useState<QuestionType[]>([
    'multiple_choice',
    'text_input',
  ]);
  const [customInstructions, setCustomInstructions] = useState('');

  // Deployment state
  const [skillId, setSkillId] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [reviewed, setReviewed] = useState(false);
  const [savingIdx, setSavingIdx] = useState<number | null>(null);

  // Hooks
  const { currentApp, isLoading: isAppLoading } = useApp();
  const studio = useStudioGenerator();
  const { data: skills } = useSkills();
  const bulkCreate = useBulkCreateQuestions();
  const updatePrompt = useUpdateStudioPrompt();

  const [searchParams] = useSearchParams();

  // ── Sync Params ───────────────────────────────────────
  useEffect(() => {
    const domain = searchParams.get('domain');
    const topicsParam = searchParams.get('topics');
    const countParam = searchParams.get('count');
    const typesParam = searchParams.get('types');
    const easyParam = searchParams.get('easy');
    const mediumParam = searchParams.get('medium');
    const hardParam = searchParams.get('hard');
    const instructions = searchParams.get('instructions');

    if (domain) setSelectedDomain(domain);
    if (topicsParam) setTopics(topicsParam.split(',').filter(Boolean));
    if (countParam) setCount(parseInt(countParam) || 10);
    if (typesParam) setSelectedTypes(typesParam.split(',').filter(Boolean) as QuestionType[]);

    if (easyParam || mediumParam || hardParam) {
      const easy = parseInt(easyParam || '0') || 0;
      const medium = parseInt(mediumParam || '0') || 0;
      const hard = parseInt(hardParam || '0') || 0;
      setDiffMix({ easy, medium, hard });
      setDiffPreset('Custom');
    }
    if (instructions) setCustomInstructions(instructions);
  }, [searchParams]);

  // ── Nav guard ─────────────────────────────────────────
  const blocker = useBlocker(() => studio.hasUnsaved);

  // 2. Sync Difficulty Mix with Count
  useEffect(() => {
    const totalDifficulty = diffMix.easy + diffMix.medium + diffMix.hard;
    if (totalDifficulty !== count && count > 0) {
      if (totalDifficulty === 0) {
        // Initial state: give all to easy
        setDiffMix({ easy: count, medium: 0, hard: 0 });
        return;
      }

      const ratio = count / totalDifficulty;
      const newEasy = Math.floor(diffMix.easy * ratio);
      const newMedium = Math.floor(diffMix.medium * ratio);

      // Give the remainder to hard to ensure sum equals exactly count
      const newHard = count - newEasy - newMedium;

      // Update only if values actually changed to avoid infinite loops
      if (newEasy !== diffMix.easy || newMedium !== diffMix.medium || newHard !== diffMix.hard) {
        setDiffMix({ easy: newEasy, medium: newMedium, hard: newHard });
      }
    }
  }, [count, diffMix]);

  const canGenerate =
    selectedDomain !== null &&
    topics.length > 0 &&
    selectedTypes.length > 0 &&
    diffMix.easy + diffMix.medium + diffMix.hard === count;

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
      topics,
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

      const dbType = q.question_type;

      if (q.question_type === 'multiple_choice' || q.question_type === 'mcq_multi') {
        const mappedOptions = (q.metadata.options || []).map((text, i) => ({
          id: String.fromCharCode(97 + i),
          text,
        }));
        options = toJson({ options: mappedOptions });

        if (q.question_type === 'multiple_choice') {
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
        const correctTexts = (q.metadata.correct_answer as string[]) || [];
        const correctOrder = correctTexts
          .map((text) => {
            const idx = q.metadata.options?.indexOf(text) ?? -1;
            return idx !== -1 ? String(idx + 1) : null;
          })
          .filter(Boolean);
        solution = toJson({ correct_order: correctOrder });
      } else if (q.question_type === 'matching') {
        const pairs = (q.metadata.terms || []).map((term, i) => ({
          term,
          definition: q.metadata.definitions?.[i] || '',
        }));
        options = toJson({ pairs: pairs.sort(() => Math.random() - 0.5) });
        solution = toJson({ pairs });
      }

      const insert: Record<string, unknown> = {
        content: q.text,
        type: dbType as Database['public']['Enums']['question_type'],
        skill_id: skillId,
        app_id: currentApp?.app_id as string,
        status: status as Database['public']['Enums']['curriculum_status'],
        points: 1,
        explanation: q.metadata.explanation || '',
        options,
        solution,
      };

      // Link to studio prompt if available
      if (studio.currentPromptId) {
        insert.studio_prompt_id = studio.currentPromptId;
      }

      return insert as QuestionInsert;
    });

    try {
      await bulkCreate.mutateAsync(payload);

      // Update the prompt record with saved count
      if (studio.currentPromptId) {
        try {
          await updatePrompt.mutateAsync({
            id: studio.currentPromptId,
            questions_saved: keptQuestions.length,
            status: 'saved',
          });
        } catch {
          console.warn('Failed to update studio prompt status');
        }
      }

      toast({
        title: `✓ ${keptQuestions.length} questions saved!`,
        description: `Added to ${skills?.find((s) => s.skill_id === skillId)?.title ?? 'skill'} as ${status}.`,
      });
      studio.resetBatch();
      setReviewed(false);
      navigate('/questions');
    } catch (err) {
      toast({
        title: 'Save failed',
        description: err instanceof Error ? err.message : 'An error occurred.',
        variant: 'destructive',
      });
    }
  };

  if (isAppLoading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-10 bg-gray-200 rounded-lg w-1/4 mb-4" />
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          <div className="xl:col-span-1 h-[600px] bg-gray-100 rounded-2xl" />
          <div className="xl:col-span-3 h-[600px] bg-white rounded-2xl border border-dashed border-gray-200" />
        </div>
      </div>
    );
  }

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
        {/* LEFT PANEL — Configuration */}
        <QuestionStudioFilterPanel
          selectedDomain={selectedDomain}
          setSelectedDomain={setSelectedDomain}
          topics={topics}
          setTopics={setTopics}
          count={count}
          setCount={setCount}
          diffMix={diffMix}
          setDiffMix={setDiffMix}
          diffPreset={diffPreset}
          setDiffPreset={setDiffPreset}
          selectedTypes={selectedTypes}
          setSelectedTypes={setSelectedTypes}
          customInstructions={customInstructions}
          setCustomInstructions={setCustomInstructions}
          isGenerating={studio.status === 'generating'}
          canGenerate={canGenerate}
          onGenerate={handleGenerate}
        />

        {/* CENTER PANEL — Staging Canvas */}
        <main className="flex-1 overflow-y-auto bg-gray-50/30 p-6 space-y-4">
          {/* Bulk actions bar */}
          {studio.stagedQuestions.length > 0 && (
            <QuestionStudioBulkActions
              keptCount={studio.keptCount}
              removedCount={studio.removedCount}
              editedCount={studio.editedCount}
              onKeepAll={studio.keepAll}
              onRemoveAll={studio.removeAll}
              onClear={studio.resetBatch}
            />
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
                  Choose a domain and add topics on the left, then click{' '}
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
                      topics: topics.length > 0 ? topics : ['General'],
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

        {/* RIGHT PANEL — Deployment */}
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
