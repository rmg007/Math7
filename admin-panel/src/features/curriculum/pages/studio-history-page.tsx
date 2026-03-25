import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useStudioPrompts, useStudioPromptQuestions } from '../hooks/use-studio-prompts';
import type { StudioPromptRow } from '../hooks/use-studio-prompts';
import { cn } from '@/lib/utils';
import {
  ArrowRight,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ClipboardCopy,
  Clock,
  Hash,
  Play,
  Search,
  Sparkles,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Detail panel for a selected prompt ──────────────────
function PromptDetail({ prompt }: { prompt: StudioPromptRow }) {
  const navigate = useNavigate();
  const [showPrompt, setShowPrompt] = useState(false);
  const { data: linkedQuestions, isLoading: questionsLoading } = useStudioPromptQuestions(
    prompt.id
  );

  const mix = prompt.difficulty_mix as { easy: number; medium: number; hard: number };

  const handleRerun = () => {
    // Navigate to studio with config pre-filled via search params
    const params = new URLSearchParams({
      domain: prompt.domain_name,
      topics: prompt.topics.join(','),
      count: String(prompt.question_count),
      easy: String(mix.easy),
      medium: String(mix.medium),
      hard: String(mix.hard),
      types: prompt.question_types.join(','),
    });
    if (prompt.custom_instructions) {
      params.set('instructions', prompt.custom_instructions);
    }
    navigate(`/questions/studio?${params.toString()}`);
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(prompt.assembled_prompt);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Config snapshot */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-50 rounded-xl border border-gray-100 p-3 space-y-1">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Domain</p>
          <p className="text-sm font-bold text-gray-800">{prompt.domain_name}</p>
        </div>
        <div className="bg-gray-50 rounded-xl border border-gray-100 p-3 space-y-1">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
            Questions
          </p>
          <p className="text-sm font-bold text-gray-800">
            {prompt.questions_saved} / {prompt.questions_generated} saved
          </p>
        </div>
      </div>

      {/* Topics */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Topics</p>
        <div className="flex flex-wrap gap-1.5">
          {prompt.topics.map((t) => (
            <span
              key={t}
              className="text-[11px] px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 font-semibold"
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Difficulty mix & types */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
            Difficulty Mix
          </p>
          <div className="flex gap-2">
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold">
              E: {mix.easy}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold">
              M: {mix.medium}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold">
              H: {mix.hard}
            </span>
          </div>
        </div>
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
            Question Types
          </p>
          <div className="flex flex-wrap gap-1">
            {prompt.question_types.map((t) => (
              <span
                key={t}
                className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-semibold"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Prompt text */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowPrompt(!showPrompt)}
            className="flex items-center gap-1 text-xs font-semibold text-indigo-500 hover:text-indigo-700 transition-colors"
          >
            {showPrompt ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {showPrompt ? 'Hide' : 'Show'} Full Prompt
          </button>
          <button
            onClick={handleCopyPrompt}
            className="flex items-center gap-1 text-[10px] font-medium text-gray-400 hover:text-gray-700 transition-colors"
          >
            <ClipboardCopy className="h-3 w-3" /> Copy
          </button>
        </div>
        {showPrompt && (
          <div className="bg-gray-900 text-gray-200 rounded-xl p-4 max-h-56 overflow-y-auto animate-in fade-in duration-200">
            <pre className="text-[11px] whitespace-pre-wrap font-mono leading-relaxed">
              {prompt.assembled_prompt}
            </pre>
          </div>
        )}
      </div>

      {/* Linked Questions */}
      {linkedQuestions && linkedQuestions.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
            Saved Questions ({linkedQuestions.length})
          </p>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {(linkedQuestions as Array<{ question_id: string; content: string; type: string }>).map(
              (q) => (
                <div
                  key={q.question_id}
                  className="flex items-start gap-2 text-xs bg-white border border-gray-100 rounded-lg px-3 py-2"
                >
                  <span className="inline-block w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 bg-indigo-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-700 line-clamp-2">{q.content}</p>
                    <div className="flex gap-2 mt-1">
                      <span className="text-[10px] text-gray-400 font-medium">{q.type}</span>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}
      {questionsLoading && (
        <div className="py-4 text-center text-xs text-gray-400 animate-pulse">
          Loading questions...
        </div>
      )}

      {/* Custom instructions */}
      {prompt.custom_instructions && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
            Custom Instructions
          </p>
          <p className="text-xs text-gray-600 bg-amber-50 border border-amber-100 rounded-lg p-2.5">
            {prompt.custom_instructions}
          </p>
        </div>
      )}

      {/* Metadata */}
      <div className="flex gap-3 text-[10px] text-gray-400">
        {prompt.model_used && (
          <span className="flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> {prompt.model_used}
          </span>
        )}
        {prompt.generation_time_ms && (
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> {(prompt.generation_time_ms / 1000).toFixed(1)}s
          </span>
        )}
        {prompt.token_count && (
          <span className="flex items-center gap-1">
            <Hash className="h-3 w-3" /> {prompt.token_count.toLocaleString()} tokens
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button
          onClick={handleRerun}
          className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white font-semibold gap-2"
        >
          <Play className="h-4 w-4" /> Re-run this Prompt
        </Button>
      </div>
    </div>
  );
}

// ── Main History Page ───────────────────────────────────
export function StudioHistoryPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const { data: promptsData, isLoading } = useStudioPrompts(page, 15);

  const selectedPrompt = useMemo(() => {
    return promptsData?.data.find((p) => p.id === selectedId) ?? null;
  }, [promptsData, selectedId]);

  const filteredPrompts = useMemo(() => {
    if (!promptsData?.data) return [];
    if (!search.trim()) return promptsData.data;
    const q = search.toLowerCase();
    return promptsData.data.filter(
      (p) =>
        p.domain_name.toLowerCase().includes(q) || p.topics.some((t) => t.toLowerCase().includes(q))
    );
  }, [promptsData, search]);

  return (
    <div className="flex flex-col h-full min-h-screen">
      {/* Page header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center shadow-md shadow-purple-200">
            <Clock className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">AI Studio History</h1>
            <p className="text-xs text-gray-400">
              Browse past generation sessions • {promptsData?.totalCount ?? 0} total
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate('/questions/studio')}
          className="gap-2 text-sm"
        >
          <Sparkles className="h-4 w-4" /> New Generation <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT — Prompt list */}
        <div className="w-96 flex-shrink-0 border-r border-gray-100 bg-gray-50/70 flex flex-col overflow-hidden">
          {/* Search */}
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by domain or topic..."
                className="pl-8 h-9 text-sm"
              />
            </div>
          </div>

          {/* Prompt items */}
          <div className="flex-1 overflow-y-auto">
            {isLoading && (
              <div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            )}
            {filteredPrompts.map((p) => {
              const mix = p.difficulty_mix as { easy: number; medium: number; hard: number };
              const isSelected = selectedId === p.id;
              return (
                <button
                  key={p.id}
                  data-testid="prompt-item"
                  onClick={() => setSelectedId(p.id)}
                  className={cn(
                    'w-full text-left px-4 py-3 border-b border-gray-100 transition-colors',
                    isSelected ? 'bg-indigo-50 border-l-2 border-l-indigo-500' : 'hover:bg-gray-50'
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-gray-800 truncate">
                      {p.domain_name}
                    </span>
                    <span
                      className={cn(
                        'text-[10px] font-bold px-2 py-0.5 rounded-full uppercase',
                        p.status === 'saved'
                          ? 'bg-emerald-100 text-emerald-700'
                          : p.status === 'failed'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-gray-100 text-gray-500'
                      )}
                    >
                      {p.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-1.5">
                    {p.topics.slice(0, 3).map((t) => (
                      <span
                        key={t}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 font-medium"
                      >
                        {t}
                      </span>
                    ))}
                    {p.topics.length > 3 && (
                      <span className="text-[10px] text-gray-400 font-medium">
                        +{p.topics.length - 3}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-gray-400">
                    <span className="flex items-center gap-0.5">
                      <Calendar className="h-3 w-3" /> {formatRelativeDate(p.created_at)}
                    </span>
                    <span>
                      {p.questions_generated}q / {mix.easy}E-{mix.medium}M-{mix.hard}H
                    </span>
                  </div>
                </button>
              );
            })}
            {!isLoading && filteredPrompts.length === 0 && (
              <div className="p-8 text-center">
                <Sparkles className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500 font-medium">No prompts found</p>
                <p className="text-xs text-gray-400 mt-1">
                  Generate questions in the{' '}
                  <button
                    onClick={() => navigate('/questions/studio')}
                    className="text-indigo-500 hover:underline"
                  >
                    AI Studio
                  </button>{' '}
                  to see them here.
                </p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {promptsData && promptsData.totalPages > 1 && (
            <div className="px-4 py-2 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[10px] text-gray-400">
                Page {promptsData.page} / {promptsData.totalPages}
              </span>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  disabled={page >= promptsData.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT — Prompt detail */}
        <div className="flex-1 overflow-y-auto p-6">
          {selectedPrompt ? (
            <PromptDetail prompt={selectedPrompt} />
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                <ChevronLeft className="h-8 w-8 text-gray-300" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-600 mb-1">Select a prompt</h3>
                <p className="text-sm text-gray-400">
                  Click on a generation session from the list to view its details.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
