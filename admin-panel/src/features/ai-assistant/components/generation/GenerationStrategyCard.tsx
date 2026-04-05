import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, Sparkles, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DifficultyConfig {
  easy: number;
  medium: number;
  hard: number;
}

interface GenerationStrategyCardProps {
  extractedText: string;
  difficultyConfig: DifficultyConfig;
  setDifficultyConfig: (config: DifficultyConfig) => void;
  customInstructions: string;
  setCustomInstructions: (instructions: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  error: string | null;
}

export function GenerationStrategyCard({
  extractedText,
  difficultyConfig,
  setDifficultyConfig,
  customInstructions,
  setCustomInstructions,
  onGenerate,
  isGenerating,
  error,
}: GenerationStrategyCardProps) {
  const totalQuestions = difficultyConfig.easy + difficultyConfig.medium + difficultyConfig.hard;

  return (
    <Card
      role="region"
      aria-label="Step 2: Generation Strategy"
      className={cn(
        'glass-card border-0 shadow-2xl transition-all duration-500 relative',
        extractedText
          ? 'shadow-purple-500/10 opacity-100 translate-y-0'
          : 'opacity-40 grayscale translate-y-4 pointer-events-none'
      )}
    >
      <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
        <Sparkles className="w-24 h-24 text-purple-600" aria-hidden="true" />
      </div>

      <CardHeader className="pb-4">
        <div className="flex items-center gap-3 mb-1">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-xl bg-purple-600/10 text-purple-600 text-sm font-bold shadow-inner"
            aria-hidden="true"
          >
            2
          </div>
          <CardTitle className="text-gray-900 font-bold tracking-tight">
            Generation Strategy
          </CardTitle>
        </div>
        <CardDescription id="strategy-desc" className="text-gray-500 text-xs">
          Configure constraints and creative direction for the AI.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8 pt-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <Label className="text-gray-700 font-bold text-sm tracking-tight">
                Complexity Distribution
              </Label>
              <span
                className="text-[10px] font-bold px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full"
                aria-live="polite"
              >
                {totalQuestions} Target
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4" role="group" aria-label="Difficulty counts">
              {[
                { id: 'easy', color: 'bg-green-500', label: 'Easy' },
                { id: 'medium', color: 'bg-amber-500', label: 'Medium' },
                { id: 'hard', color: 'bg-rose-500', label: 'Hard' },
              ].map((diff) => (
                <div key={diff.id} className="space-y-2 group">
                  <div className="flex items-center gap-1.5 px-1">
                    <div
                      className={cn(
                        'w-1.5 h-1.5 rounded-full transition-all group-focus-within:scale-150',
                        diff.color
                      )}
                      aria-hidden="true"
                    />
                    <Label
                      htmlFor={diff.id}
                      className="text-[10px] font-bold text-gray-500 uppercase tracking-widest cursor-pointer"
                    >
                      {diff.label}
                    </Label>
                  </div>
                  <Input
                    id={diff.id}
                    type="number"
                    min="0"
                    value={difficultyConfig[diff.id as keyof DifficultyConfig]}
                    onChange={(e) =>
                      setDifficultyConfig({
                        ...difficultyConfig,
                        [diff.id]: parseInt(e.target.value) || 0,
                      })
                    }
                    className="h-11 bg-white/50 border-gray-200/50 focus:border-purple-400 focus:ring-purple-400/20 rounded-xl transition-all font-mono font-bold"
                    aria-label={`Number of ${diff.label} questions`}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label
              htmlFor="instructions"
              className="text-gray-700 font-bold text-sm tracking-tight"
            >
              Refinement Prompt
            </Label>
            <Textarea
              id="instructions"
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="e.g., Focus on bloom's taxonomy, maintain clinical terminology..."
              className="min-h-[110px] bg-white/50 border-gray-200/50 focus:border-purple-400 focus:ring-purple-400/20 rounded-xl text-sm leading-relaxed"
              aria-label="Generation instructions"
            />
          </div>
        </div>

        <div className="pt-2">
          <Button
            onClick={onGenerate}
            disabled={isGenerating || !extractedText || totalQuestions === 0}
            className="w-full h-14 relative group overflow-hidden bg-[#1a1b4b] hover:bg-[#25266b] text-white rounded-2xl shadow-2xl shadow-indigo-200 transition-all duration-300"
            aria-label={
              isGenerating ? 'Synthesizing knowledge...' : 'Initiate knowledge generation'
            }
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity" />

            {isGenerating ? (
              <span className="flex items-center gap-3 font-semibold tracking-wide">
                <div
                  className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"
                  aria-hidden="true"
                />
                Synthesizing Knowledge...
              </span>
            ) : (
              <span className="flex items-center gap-2 font-semibold tracking-wide">
                <Wand2
                  className="w-5 h-5 text-purple-400 group-hover:rotate-12 transition-transform"
                  aria-hidden="true"
                />
                Initiate Intelligent Generation
              </span>
            )}
          </Button>

          {error && (
            <div
              className="mt-4 p-4 bg-rose-50/50 border border-rose-100 rounded-xl flex items-center gap-3 animate-in shake-in duration-500"
              role="alert"
              aria-live="assertive"
            >
              <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" aria-hidden="true" />
              <p className="text-xs text-rose-700 font-semibold">{error}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
