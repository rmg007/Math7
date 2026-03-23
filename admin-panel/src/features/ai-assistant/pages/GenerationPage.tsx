import { AdminHeader } from '@/components/ui/admin-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useApp } from '@/contexts/AppContext';
import { useBulkCreateQuestions } from '@/features/curriculum/hooks/use-questions';
import { useSkills } from '@/features/curriculum/hooks/use-skills';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileUp,
  Save,
  Sparkles,
  Wand2,
  Zap,
} from 'lucide-react';
import Papa from 'papaparse';
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';
import { governedGenerateQuestions } from '../api/governedGeneration';
import { DocumentUploader } from '../components/DocumentUploader';
import { addBreadcrumb, captureException } from '@/lib/error-tracker';
import { GeneratedQuestion, QuestionReviewGrid } from '../components/QuestionReviewGrid';

interface DifficultyConfig {
  easy: number;
  medium: number;
  hard: number;
}

export const GenerationPage: React.FC = () => {
  const [extractedText, setExtractedText] = useState<string>('');
  const [, setSourceFilename] = useState<string>(''); // Kept for future features
  const [difficultyConfig, setDifficultyConfig] = useState<DifficultyConfig>({
    easy: 10,
    medium: 20,
    hard: 10,
  });
  const [customInstructions, setCustomInstructions] = useState<string>('');
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedSkillId, setSelectedSkillId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [validationSummary, setValidationSummary] = useState<{
    status: string;
    summary: string;
    overall_score: number;
    findings: Array<{ question_id: number; issues: string[] }>;
  } | null>(null);
  const [governanceInfo, setGovernanceInfo] = useState<{
    tokens_consumed: number;
    quota_remaining: number;
  } | null>(null);

  const { data: skills } = useSkills();
  const bulkCreate = useBulkCreateQuestions();
  const { toast } = useToast();
  const { currentApp } = useApp();

  const handleTextExtracted = (text: string, filename: string) => {
    setExtractedText(text);
    setSourceFilename(filename);
    setError(null);
  };

  const handleGenerate = async () => {
    if (!extractedText) {
      setError('Please upload a document first');
      return;
    }

    const totalQuestions = difficultyConfig.easy + difficultyConfig.medium + difficultyConfig.hard;
    if (totalQuestions === 0) {
      setError('Please configure at least one question');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      if (!currentApp) throw new Error('No active app context found');

      const result = await governedGenerateQuestions(currentApp.app_id, {
        text: extractedText,
        difficulty_distribution: difficultyConfig,
        custom_instructions: customInstructions || undefined,
      });

      // Transform API response to GeneratedQuestion format with validation findings
      const transformedQuestions: GeneratedQuestion[] = result.questions.map((q, index) => {
        const finding = result.validation?.findings.find((f) => f.question_id === index);
        return {
          ...q,
          id: `q-${Date.now()}-${index}`,
          validation_errors: finding?.issues || [],
        };
      });

      setGeneratedQuestions(transformedQuestions);
      setValidationSummary(result.validation || null);
      setGovernanceInfo(result.governance);
      addBreadcrumb(
        `Generated ${result.metadata.questions_generated} questions.`,
        'ai-assistant',
        'info'
      );

      if (result.validation?.status === 'flagged') {
        toast({
          title: 'Validation Warning',
          description: 'AI content was generated but flagged for quality. Please review issues.',
          variant: 'destructive',
        });
      }
    } catch (err) {
      captureException(err, {
        tags: { component: 'GenerationPage', method: 'handleGenerate' },
        extra: { difficultyConfig, hasText: Boolean(extractedText) },
      });
      setError(err instanceof Error ? err.message : 'Failed to generate questions');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportCSV = () => {
    if (generatedQuestions.length === 0) return;

    const csvData = generatedQuestions.map((q) => {
      const options = q.metadata.options
        ? {
            options: q.metadata.options.map((text, i) => ({
              id: String.fromCharCode(97 + i),
              text,
            })),
          }
        : {};
      const solution = {
        correct_answer: q.metadata.correct_answer,
        explanation: q.metadata.explanation,
      };

      return {
        content: q.text,
        type: q.question_type === 'mcq' ? 'multiple_choice' : q.question_type,
        points: q.difficulty === 'hard' ? 20 : q.difficulty === 'medium' ? 10 : 5,
        status: 'draft',
        options: JSON.stringify(options),
        solution: JSON.stringify(solution),
        explanation: q.metadata.explanation || '',
      };
    });

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
    link.setAttribute('href', url);
    link.setAttribute('download', `questerix_questions_${timestamp}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportDirectly = async () => {
    if (generatedQuestions.length === 0) return;
    if (!selectedSkillId) {
      setError('Please select a skill to import to');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const questionsToImport = generatedQuestions.map((q, index) => {
        // Transform the AI metadata to the DB options/solution schema
        const options = q.metadata.options
          ? {
              options: q.metadata.options.map((text, i) => ({
                id: String.fromCharCode(97 + i),
                text,
              })),
            }
          : {};

        const solution = {
          correct_answer: q.metadata.correct_answer,
          explanation: q.metadata.explanation,
        };

        return {
          app_id: currentApp?.app_id || '',
          content: q.text,
          type: (q.question_type === 'mcq' ? 'multiple_choice' : q.question_type) as
            | 'boolean'
            | 'multiple_choice'
            | 'mcq_multi'
            | 'text_input'
            | 'reorder_steps',
          points: q.difficulty === 'hard' ? 20 : q.difficulty === 'medium' ? 10 : 5,
          status: 'draft' as const,
          options,
          solution,
          explanation: q.metadata.explanation || '',
          skill_id: selectedSkillId,
          sort_order: generatedQuestions.length * 100 + index, // Temporary sort order strategy
        };
      });

      await bulkCreate.mutateAsync(questionsToImport);

      toast({
        title: 'Success!',
        description: `Successfully imported ${questionsToImport.length} questions to the selected skill.`,
      });

      setGeneratedQuestions([]); // Clear after successful import
    } catch (err) {
      captureException(err, {
        tags: { component: 'GenerationPage', method: 'handleImportDirectly' },
        extra: { questionCount: generatedQuestions.length, skillId: selectedSkillId },
      });
      setError(err instanceof Error ? err.message : 'Failed to save questions to library');
    } finally {
      setIsSaving(false);
    }
  };

  const totalQuestions = difficultyConfig.easy + difficultyConfig.medium + difficultyConfig.hard;

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-12">
      <AdminHeader
        title="AI Question Generator"
        description="Craft high-quality educational content through intelligent document analysis and behavioral generation."
        icon={Wand2}
        actions={
          <Link to="/ai-import">
            <Button
              variant="outline"
              className="group gap-2 bg-white/50 backdrop-blur-sm border-gray-200/50 hover:bg-white hover:border-purple-200 transition-all duration-300"
            >
              <FileUp className="w-4 h-4 text-purple-600 transition-transform group-hover:-translate-y-0.5" />
              <span className="bg-gradient-to-r from-purple-700 to-blue-700 bg-clip-text text-transparent font-medium">
                Bulk Import CSV
              </span>
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4 space-y-8">
          {/* Step 1: Upload Document */}
          <Card className="glass-card overflow-hidden border-0 shadow-xl shadow-blue-500/5 group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="relative pb-2">
              <div className="flex items-center gap-3 mb-1">
                <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-blue-600/10 text-blue-600 text-sm font-bold shadow-inner">
                  1
                </div>
                <CardTitle className="text-gray-900 font-bold tracking-tight">
                  Source Material
                </CardTitle>
              </div>
              <CardDescription className="text-gray-500 text-xs leading-relaxed">
                Upload a document to serve as the ground truth for generation.
              </CardDescription>
            </CardHeader>
            <CardContent className="relative pt-4">
              <DocumentUploader onTextExtracted={handleTextExtracted} />
            </CardContent>
          </Card>

          {/* Governance Mini-View (Only show if gen has happened) */}
          {governanceInfo && (
            <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-700 delay-200">
              <div className="glass-card p-5 border-0 shadow-lg shadow-purple-500/5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      Daily Usage
                    </h4>
                    <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent font-mono">
                      {governanceInfo.tokens_consumed.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <Zap className="w-4 h-4 text-purple-600" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-medium text-gray-500">
                    <span>Quota Remaining</span>
                    <span className="text-purple-600">
                      {governanceInfo.quota_remaining.toLocaleString()} tokens
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-1000 ease-out"
                      style={{
                        width: `${Math.min(100, (governanceInfo.tokens_consumed / (governanceInfo.tokens_consumed + governanceInfo.quota_remaining)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-8 space-y-10">
          {/* Step 2: Configure Generation */}
          <Card
            className={cn(
              'glass-card border-0 shadow-2xl transition-all duration-500',
              extractedText
                ? 'shadow-purple-500/10 opacity-100 translate-y-0'
                : 'opacity-40 grayscale translate-y-4 pointer-events-none'
            )}
          >
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Sparkles className="w-24 h-24 text-purple-600" />
            </div>

            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-1">
                <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-purple-600/10 text-purple-600 text-sm font-bold shadow-inner">
                  2
                </div>
                <CardTitle className="text-gray-900 font-bold tracking-tight">
                  Generation Strategy
                </CardTitle>
              </div>
              <CardDescription className="text-gray-500 text-xs">
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
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                      {totalQuestions} Target
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
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
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || !extractedText || totalQuestions === 0}
                  className="w-full h-14 relative group overflow-hidden bg-[#1a1b4b] hover:bg-[#25266b] text-white rounded-2xl shadow-2xl shadow-indigo-200 transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity" />

                  {isGenerating ? (
                    <span className="flex items-center gap-3 font-semibold tracking-wide">
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Synthesizing Knowledge...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 font-semibold tracking-wide">
                      <Wand2 className="w-5 h-5 text-purple-400 group-hover:rotate-12 transition-transform" />
                      Initiate Intelligent Generation
                    </span>
                  )}
                </Button>

                {error && (
                  <div className="mt-4 p-4 bg-rose-50/50 border border-rose-100 rounded-xl flex items-center gap-3 animate-in shake-in duration-500">
                    <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
                    <p className="text-xs text-rose-700 font-semibold">{error}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Validation Report (Approved/Flagged) */}
          {validationSummary && (
            <div
              className={cn(
                'p-6 rounded-3xl border animate-in slide-in-from-top-4 duration-500',
                validationSummary.status === 'approved'
                  ? 'bg-emerald-50/30 border-emerald-100/50'
                  : 'bg-amber-50/30 border-amber-100/50 text-amber-900'
              )}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'p-2 rounded-xl',
                      validationSummary.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-600'
                        : 'bg-amber-100 text-amber-600'
                    )}
                  >
                    {validationSummary.status === 'approved' ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <AlertCircle className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold tracking-tight">AI Content Audit</h3>
                    <p className="text-xs opacity-70">Automated quality evaluation results</p>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={cn(
                      'text-2xl font-black font-mono leading-none',
                      validationSummary.status === 'approved'
                        ? 'text-emerald-600'
                        : 'text-amber-600'
                    )}
                  >
                    {(validationSummary.overall_score * 100).toFixed(0)}%
                  </span>
                  <p className="text-[10px] uppercase font-bold tracking-widest opacity-50">
                    Confidence Score
                  </p>
                </div>
              </div>
              <div className="prose prose-sm max-w-none text-gray-700 text-xs leading-relaxed">
                <ReactMarkdown>{validationSummary.summary}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Step 3: Review & Library Integration */}
      {generatedQuestions.length > 0 && (
        <Card className="glass-card border-0 shadow-3xl animate-in fade-in zoom-in-95 duration-700">
          <CardHeader className="relative overflow-hidden border-b border-gray-100/50 pb-8">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />

            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 relative">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-600/10 text-indigo-600 text-sm font-bold shadow-inner">
                    3
                  </div>
                  <CardTitle className="text-gray-900 font-extrabold text-2xl tracking-tight">
                    Refine & Persist
                  </CardTitle>
                </div>
                <CardDescription className="text-gray-500 font-medium">
                  Review generated artifacts and synchronize with your curriculum library.
                </CardDescription>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="w-full sm:w-72 group">
                  <Select value={selectedSkillId} onValueChange={setSelectedSkillId}>
                    <SelectTrigger className="h-12 bg-white/80 border-indigo-100 hover:border-indigo-300 focus:ring-indigo-400/20 rounded-xl transition-all">
                      <SelectValue placeholder="Target Skill Context..." />
                    </SelectTrigger>
                    <SelectContent className="glass-card border-gray-800 bg-gray-900/95 text-white p-2">
                      {skills?.map((skill) => (
                        <SelectItem
                          key={skill.skill_id}
                          value={skill.skill_id}
                          className="rounded-lg focus:bg-indigo-600 focus:text-white"
                        >
                          {skill.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleExportCSV}
                    variant="ghost"
                    className="h-12 px-6 rounded-xl text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 font-bold transition-all border border-transparent hover:border-emerald-100 gap-2"
                  >
                    <Download className="w-4 h-4" />
                    CSV Data
                  </Button>

                  <Button
                    onClick={handleImportDirectly}
                    disabled={isSaving || !selectedSkillId}
                    className="h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 gap-3 transition-all active:scale-95"
                  >
                    {isSaving ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Save className="w-5 h-5" />
                    )}
                    Sync to Library
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-8">
            <QuestionReviewGrid
              questions={generatedQuestions}
              onQuestionsChange={setGeneratedQuestions}
            />

            <div className="mt-12 p-8 bg-indigo-900 rounded-4xl text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:rotate-12 transition-transform duration-1000">
                <CheckCircle2 className="w-48 h-48" />
              </div>

              <div className="relative">
                <h4 className="text-lg font-black mb-6 flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-indigo-300" />
                  Preservation Workflow
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {[
                    {
                      n: 1,
                      t: 'Verification',
                      d: 'Review each artifact in the interactive grid for accuracy.',
                    },
                    {
                      n: 2,
                      t: 'Contextualize',
                      d: 'Assign a target skill to provide pedagogical alignment.',
                    },
                    {
                      n: 3,
                      t: 'Persist',
                      d: 'Synchronize approved content with the global library.',
                    },
                    {
                      n: 4,
                      t: 'Distribute',
                      d: 'Questions become instantly available for student assignments.',
                    },
                  ].map((step) => (
                    <div key={step.n} className="space-y-2">
                      <span className="text-xs font-black text-indigo-400 font-mono tracking-widest">
                        {step.n.toString().padStart(2, '0')}
                      </span>
                      <h5 className="font-bold text-white leading-none mb-1">{step.t}</h5>
                      <p className="text-indigo-200 text-[11px] leading-relaxed opacity-80">
                        {step.d}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
