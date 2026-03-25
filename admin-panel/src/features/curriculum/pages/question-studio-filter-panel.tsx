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
import { useDomains } from '@/features/curriculum/hooks/use-domains';
import type { DifficultyMix, QuestionType, StudioConfig } from '@/hooks/use-studio-generator';
import { buildStudioPrompt } from '@/hooks/use-studio-generator';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, Eye, EyeOff, Plus, RefreshCw, Sparkles, X } from 'lucide-react';
import { useMemo, useState } from 'react';

const QUESTION_TYPES: { key: QuestionType; label: string; desc: string }[] = [
  { key: 'multiple_choice', label: 'Multiple Choice', desc: 'Single correct' },
  { key: 'mcq_multi', label: 'Multiple Answer', desc: 'Multi-select' },
  { key: 'boolean', label: 'True / False', desc: 'Binary choice' },
  { key: 'text_input', label: 'Short Answer', desc: 'Text response' },
  { key: 'reorder_steps', label: 'Reorder', desc: 'Sequence logic' },
  { key: 'matching', label: 'Matching', desc: 'Term/Def pairs' },
];

const QUANTITY_OPTIONS = [5, 10, 15, 20, 25, 30];

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
  selectedDomain: string | null;
  setSelectedDomain: (domain: string | null) => void;
  topics: string[];
  setTopics: React.Dispatch<React.SetStateAction<string[]>>;
  count: number;
  setCount: (n: number) => void;
  diffMix: DifficultyMix;
  setDiffMix: (mix: DifficultyMix) => void;
  diffPreset: string;
  setDiffPreset: (preset: string) => void;
  selectedTypes: QuestionType[];
  setSelectedTypes: React.Dispatch<React.SetStateAction<QuestionType[]>>;
  customInstructions: string;
  setCustomInstructions: (instructions: string) => void;
  isGenerating: boolean;
  canGenerate: boolean;
  onGenerate: () => void;
}

export function QuestionStudioFilterPanel({
  selectedDomain,
  setSelectedDomain,
  topics,
  setTopics,
  count,
  setCount,
  diffMix,
  setDiffMix,
  diffPreset,
  setDiffPreset,
  selectedTypes,
  setSelectedTypes,
  customInstructions,
  setCustomInstructions,
  isGenerating,
  canGenerate,
  onGenerate,
}: QuestionStudioFilterPanelProps) {
  const { data: domains, isLoading: isDomainsLoading } = useDomains();
  const [topicInput, setTopicInput] = useState('');
  const [showPrompt, setShowPrompt] = useState(false);
  const [showCustomDiff, setShowCustomDiff] = useState(false);

  const handleCountChange = (n: number) => {
    setCount(n);
    const preset = DIFFICULTY_PRESETS.find((p) => p.label === diffPreset);
    if (preset) {
      setDiffMix(preset.mix(n));
    } else {
      const total = diffMix.easy + diffMix.medium + diffMix.hard || 10;
      setDiffMix({
        easy: Math.round((diffMix.easy / total) * n),
        medium: Math.round((diffMix.medium / total) * n),
        hard: n - Math.round((diffMix.easy / total) * n) - Math.round((diffMix.medium / total) * n),
      });
    }
  };

  const handleDiffInput = (key: keyof DifficultyMix, value: number) => {
    const newMix = { ...diffMix, [key]: Math.max(0, value) };
    setDiffMix(newMix);
    setCount(newMix.easy + newMix.medium + newMix.hard);
    setDiffPreset('Custom');
  };

  const handleAddTopic = () => {
    const trimmed = topicInput.trim();
    if (trimmed && !topics.includes(trimmed)) {
      setTopics((prev) => [...prev, trimmed]);
      setTopicInput('');
    }
  };

  const handleRemoveTopic = (topic: string) => {
    setTopics((prev) => prev.filter((t) => t !== topic));
  };

  const handleTopicKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTopic();
    }
  };

  const toggleType = (type: QuestionType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  // Build live prompt preview
  const previewPrompt = useMemo(() => {
    if (!selectedDomain || topics.length === 0) return '';
    const config: StudioConfig = {
      domain: selectedDomain,
      topics,
      count,
      difficultyMix: diffMix,
      questionTypes: selectedTypes,
      customInstructions: customInstructions.trim() || undefined,
    };
    return buildStudioPrompt(config);
  }, [selectedDomain, topics, count, diffMix, selectedTypes, customInstructions]);

  return (
    <aside
      className="w-80 flex-shrink-0 border-r border-gray-100 bg-gray-50/70 overflow-y-auto p-5 space-y-5"
      data-testid="studio-filter-aside"
    >
      {/* ── Subject Domain (Dropdown) ────────────────────── */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Subject Domain
        </Label>
        <Select
          value={selectedDomain ?? ''}
          onValueChange={(v) => {
            setSelectedDomain(v || null);
          }}
        >
          <SelectTrigger className="w-full" data-testid="studio-domain-select">
            <SelectValue
              placeholder={
                isDomainsLoading ? 'Loading domains...' : selectedDomain || 'Select a domain...'
              }
            />
          </SelectTrigger>
          <SelectContent>
            {domains?.map((d) => (
              <SelectItem
                key={d.domain_id}
                value={d.title}
                data-testid={`domain-option-${d.title}`}
              >
                {d.title}
              </SelectItem>
            ))}
            {/* Fallback if no domains in DB yet */}
            {!isDomainsLoading && (!domains || domains.length === 0) && (
              <>
                <SelectItem value="Mathematics" data-testid="domain-option-Mathematics">
                  Mathematics
                </SelectItem>
                <SelectItem value="English Language" data-testid="domain-option-English Language">
                  English Language
                </SelectItem>
                <SelectItem value="History" data-testid="domain-option-History">
                  History
                </SelectItem>
                <SelectItem value="Science" data-testid="domain-option-Science">
                  Science
                </SelectItem>
                <SelectItem value="Computer Science" data-testid="domain-option-Computer Science">
                  Computer Science
                </SelectItem>
                <SelectItem value="General Knowledge" data-testid="domain-option-General Knowledge">
                  General Knowledge
                </SelectItem>
              </>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* ── Topics (Dynamic Add/Delete) ──────────────────── */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Topics
        </Label>
        <div className="flex gap-1.5">
          <Input
            value={topicInput}
            onChange={(e) => setTopicInput(e.target.value)}
            onKeyDown={handleTopicKeyDown}
            placeholder="Type a topic and press Enter"
            className="text-sm flex-1"
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleAddTopic}
            disabled={!topicInput.trim()}
            className="h-9 w-9 p-0 flex-shrink-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {topics.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {topics.map((topic) => (
              <span
                key={topic}
                className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-indigo-600 text-white font-semibold"
              >
                {topic}
                <button
                  onClick={() => handleRemoveTopic(topic)}
                  className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        {topics.length === 0 && (
          <p className="text-[11px] text-gray-400">Add at least one topic to generate questions</p>
        )}
      </div>

      {/* ── Number of Questions (Dropdown) ───────────────── */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Number of Questions
        </Label>
        <Select value={String(count)} onValueChange={(v) => handleCountChange(Number(v))}>
          <SelectTrigger className="w-full" data-testid="studio-count-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {QUANTITY_OPTIONS.map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n} questions
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ── Difficulty Mix (Dropdown → Custom) ───────────── */}
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
        <Select
          value={diffPreset}
          onValueChange={(v) => {
            setDiffPreset(v);
            if (v === 'Custom') {
              setShowCustomDiff(true);
            } else {
              setShowCustomDiff(false);
              const preset = DIFFICULTY_PRESETS.find((p) => p.label === v);
              if (preset) setDiffMix(preset.mix(count));
            }
          }}
        >
          <SelectTrigger className="w-full" data-testid="studio-diff-preset-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DIFFICULTY_PRESETS.map((p) => (
              <SelectItem key={p.label} value={p.label}>
                {p.label}
              </SelectItem>
            ))}
            <SelectItem value="Custom">Custom</SelectItem>
          </SelectContent>
        </Select>
        {(diffPreset === 'Custom' || showCustomDiff) && (
          <div className="grid grid-cols-3 gap-2 animate-in fade-in duration-200">
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
        )}
      </div>

      {/* ── Question Types (Multi-select chips) ──────────── */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Question Types
        </Label>
        <div className="space-y-1">
          {QUESTION_TYPES.map(({ key, label, desc }) => {
            const isActive = selectedTypes.includes(key);
            return (
              <button
                key={key}
                onClick={() => toggleType(key)}
                data-testid={`type-btn-${key}`}
                aria-pressed={isActive}
                className={cn(
                  'flex items-center justify-between w-full px-3 py-2 rounded-lg border text-left text-sm transition-all',
                  isActive
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300'
                )}
              >
                <div>
                  <span className="font-semibold text-xs">{label}</span>
                  <span
                    className={cn(
                      'ml-2 text-[10px]',
                      isActive ? 'text-indigo-200' : 'text-gray-400'
                    )}
                  >
                    {desc}
                  </span>
                </div>
                {isActive && (
                  <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
        {selectedTypes.length === 0 && (
          <p className="text-[11px] text-rose-500 font-medium">Select at least one type</p>
        )}
      </div>

      {/* ── Prompt Preview / Editor ──────────────────────── */}
      <div className="space-y-2">
        <button
          onClick={() => setShowPrompt((s) => !s)}
          className="flex items-center gap-1.5 text-xs font-semibold text-indigo-500 hover:text-indigo-700 transition-colors"
        >
          {showPrompt ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          {showPrompt ? 'Hide' : 'View'} Prompt Preview
          {showPrompt ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
        {showPrompt && (
          <div className="space-y-2 animate-in fade-in duration-200">
            <div className="bg-white border border-gray-200 rounded-xl p-3 max-h-48 overflow-y-auto">
              <pre className="text-[11px] text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
                {previewPrompt || 'Select a domain and add topics to preview the prompt.'}
              </pre>
            </div>
            <Textarea
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder='Optional: Add custom instructions, e.g. "Avoid fractions" or "Use a story context"'
              className="min-h-[60px] text-xs resize-none"
            />
          </div>
        )}
      </div>

      {/* ── Generate Button ─────────────────────────────── */}
      <div className="pt-2 space-y-2">
        {canGenerate && (
          <p className="text-[11px] text-gray-400 leading-snug bg-gray-100 rounded-lg px-3 py-2">
            Generating <strong>{count}</strong> {selectedDomain} questions on{' '}
            <strong>"{topics.join(', ')}"</strong> ({diffMix.easy}E / {diffMix.medium}M /{' '}
            {diffMix.hard}H)
          </p>
        )}
        <Button
          onClick={onGenerate}
          disabled={!canGenerate || isGenerating}
          data-testid="generate-btn"
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
