import { AdminHeader } from '@/components/ui/admin-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useApp } from '@/contexts/AppContext';
import { useSkills } from '@/features/curriculum/hooks/use-skills';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, FileUp, Wand2 } from 'lucide-react';
import Papa from 'papaparse';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { governedGenerateQuestions } from '../api/governedGeneration';
import { addBreadcrumb, captureException } from '@/lib/error-tracker';
import { GeneratedQuestion, QuestionReviewGrid } from '../components/QuestionReviewGrid';
import { useBulkImport } from '@/hooks/use-bulk-import';
import { QueuedQuestion } from '@/lib/validation/import-schema';

// Modular Components
import { SourceMaterialCard } from '../components/generation/SourceMaterialCard';
import { GovernanceInfo } from '../components/generation/GovernanceInfo';
import { GenerationStrategyCard } from '../components/generation/GenerationStrategyCard';
import { QualityAuditModule } from '../components/generation/QualityAuditModule';
import { RefinePersistActionHeader } from '../components/generation/RefinePersistActionHeader';

export interface DifficultyConfig {
  easy: number;
  medium: number;
  hard: number;
}

export const GenerationPage: React.FC = () => {
  const [extractedText, setExtractedText] = useState<string>('');
  const [, setSourceFilename] = useState<string>('');
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
  const { addToQueue } = useBulkImport();
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
        type: q.question_type,
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

  const handleSendToNexus = async () => {
    if (generatedQuestions.length === 0) return;
    if (!selectedSkillId) {
      setError('Please select a skill to import to');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const questionsToQueue = generatedQuestions.flatMap((q): QueuedQuestion[] => {
        const base = {
          skill_id: selectedSkillId,
          content: q.text,
          explanation: q.metadata.explanation,
          points: q.difficulty === 'hard' ? 20 : q.difficulty === 'medium' ? 10 : 5,
          is_published: true,
        };

        if (q.question_type === 'multiple_choice' || q.question_type === 'mcq_multi') {
          const options =
            q.metadata.options?.map((opt) => ({
              text: opt,
              is_correct:
                opt === q.metadata.correct_answer ||
                (Array.isArray(q.metadata.correct_answer) &&
                  q.metadata.correct_answer.includes(opt)),
            })) || [];

          if (options.length < 2) return [];

          return [
            {
              ...base,
              type: q.question_type,
              options,
            },
          ];
        }

        if (q.question_type === 'text_input') {
          return [
            {
              ...base,
              type: 'text_input',
              solution:
                typeof q.metadata.correct_answer === 'string' ? q.metadata.correct_answer : '',
            },
          ];
        }

        if (q.question_type === 'boolean') {
          return [
            {
              ...base,
              type: 'boolean',
              solution: String(q.metadata.correct_answer).toLowerCase() === 'true',
            },
          ];
        }

        if (q.question_type === 'reorder_steps') {
          const steps = q.metadata.options || [];
          if (steps.length < 2) return [];

          return [
            {
              ...base,
              type: 'reorder_steps',
              options: steps,
              solution: Array.isArray(q.metadata.correct_answer)
                ? q.metadata.correct_answer
                : typeof q.metadata.correct_answer === 'string'
                  ? q.metadata.correct_answer.split(',').map((s) => s.trim())
                  : steps,
            },
          ];
        }

        return [];
      });

      addToQueue(questionsToQueue);

      toast({
        title: 'Sent to Nexus',
        description: `Successfully added ${questionsToQueue.length} questions to the import buffer.`,
      });

      setGeneratedQuestions([]);
    } catch (err) {
      captureException(err, {
        tags: { component: 'GenerationPage', method: 'handleSendToNexus' },
        extra: { questionCount: generatedQuestions.length, skillId: selectedSkillId },
      });
      setError(err instanceof Error ? err.message : 'Failed to send questions to Nexus');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main
      className="max-w-7xl mx-auto space-y-10 pb-12"
      role="main"
      aria-label="AI Question Generation Interface"
    >
      <AdminHeader
        title="AI Question Generator"
        description="Craft high-quality educational content through intelligent document analysis and behavioral generation."
        icon={Wand2}
        backTo="/questions"
        actions={
          <Link to="/ai-import">
            <Button
              variant="outline"
              aria-label="Navigate to Bulk Import Nexus"
              className="group gap-2 bg-white/50 backdrop-blur-sm border-gray-200/50 hover:bg-white hover:border-purple-200 transition-all duration-300 shadow-sm"
            >
              <FileUp className="w-4 h-4 text-purple-600 transition-transform group-hover:-translate-y-0.5" />
              <span className="bg-gradient-to-r from-purple-700 to-blue-700 bg-clip-text text-transparent font-black tracking-widest text-[10px] uppercase">
                Bulk Import
              </span>
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4 space-y-8">
          <SourceMaterialCard onTextExtracted={handleTextExtracted} />
          {governanceInfo && (
            <GovernanceInfo
              tokensConsumed={governanceInfo.tokens_consumed}
              quotaRemaining={governanceInfo.quota_remaining}
            />
          )}
        </div>

        <div className="lg:col-span-8 space-y-10">
          <GenerationStrategyCard
            extractedText={extractedText}
            difficultyConfig={difficultyConfig}
            setDifficultyConfig={setDifficultyConfig}
            customInstructions={customInstructions}
            setCustomInstructions={setCustomInstructions}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            error={error}
          />
          {validationSummary && <QualityAuditModule validationSummary={validationSummary} />}
        </div>
      </div>

      {generatedQuestions.length > 0 && (
        <Card
          className="glass-card border-0 shadow-3xl animate-in fade-in zoom-in-95 duration-700 overflow-hidden"
          role="region"
          aria-label="Step 3: Review and Synchronization"
        >
          <RefinePersistActionHeader
            selectedSkillId={selectedSkillId}
            setSelectedSkillId={setSelectedSkillId}
            skills={skills}
            onExportCSV={handleExportCSV}
            onImportDirectly={handleSendToNexus}
            isSaving={isSaving}
            generatedCount={generatedQuestions.length}
          />
          <CardContent className="pt-8 relative">
            <QuestionReviewGrid
              questions={generatedQuestions}
              onQuestionsChange={setGeneratedQuestions}
            />

            {/* Preservation Workflow Contextual Footer */}
            <div className="mt-12 p-10 bg-indigo-950 rounded-4xl text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:rotate-12 transition-transform duration-1000">
                <CheckCircle2 className="w-48 h-48" />
              </div>
              <div className="relative">
                <h4 className="text-xl font-black mb-8 flex items-center gap-4 text-white">
                  <div className="p-2 rounded-lg bg-white/10">
                    <CheckCircle2 className="w-6 h-6 text-indigo-400" />
                  </div>
                  System Preservation Workflow
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                  {[
                    {
                      n: 1,
                      t: 'Forensic Audit',
                      d: 'Review each artifact for conceptual purity & alignment.',
                    },
                    {
                      n: 2,
                      t: 'Ontological Link',
                      d: 'Assign target skill context for proper curriculum mapping.',
                    },
                    {
                      n: 3,
                      t: 'Global Sync',
                      d: 'Persist approved primitives to the curriculum engine.',
                    },
                    {
                      n: 4,
                      t: 'Live Deployment',
                      d: 'Artifacts become instantly accessible for assessments.',
                    },
                  ].map((step) => (
                    <div key={step.n} className="space-y-4 group/step">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-indigo-500 font-mono tracking-widest border border-indigo-500/30 px-2 py-0.5 rounded-md">
                          STEP {step.n.toString().padStart(2, '0')}
                        </span>
                        <div className="h-px flex-1 bg-white/10 group-hover/step:bg-white/30 transition-colors" />
                      </div>
                      <h5 className="font-bold text-white text-base leading-none mb-1">{step.t}</h5>
                      <p className="text-indigo-200/60 text-[11px] leading-relaxed font-medium">
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
    </main>
  );
};
