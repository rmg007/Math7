import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Wand2, Download, AlertCircle, Save, CheckCircle2, FileUp } from 'lucide-react';
import { StatusBadge, StatusType } from '@/components/ui/status-badge';
import { DocumentUploader } from '../components/DocumentUploader';
import { QuestionReviewGrid, GeneratedQuestion } from '../components/QuestionReviewGrid';
import { useSkills } from '@/features/curriculum/hooks/use-skills';
import { useBulkCreateQuestions } from '@/features/curriculum/hooks/use-questions';
import { useToast } from '@/hooks/use-toast';
import { useApp } from '@/contexts/AppContext';
import { governedGenerateQuestions } from '../api/governedGeneration';
import { AdminHeader } from '@/components/ui/admin-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Papa from 'papaparse';
import ReactMarkdown from 'react-markdown';

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

      console.log(`Generated ${result.metadata.questions_generated} questions.`);

      if (result.validation?.status === 'flagged') {
        toast({
          title: 'Validation Warning',
          description: 'AI content was generated but flagged for quality. Please review issues.',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('Generation error:', err);
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
      console.error('Import error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save questions to library');
    } finally {
      setIsSaving(false);
    }
  };

  const totalQuestions = difficultyConfig.easy + difficultyConfig.medium + difficultyConfig.hard;

  return (
    <div className="space-y-8">
      <AdminHeader
        title="AI Question Generator"
        description="Generate questions with AI."
        icon={Wand2}
        actions={
          <Link to="/ai-import">
            <Button variant="outline" className="gap-2 bg-white hover:bg-gray-50">
              <FileUp className="w-4 h-4" />
              Bulk Import CSV
            </Button>
          </Link>
        }
      />

      {/* Step 1: Upload Document */}
      <Card className="border-blue-100 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-sm font-bold">
              1
            </span>
            Source Document
          </CardTitle>
          <CardDescription>
            Upload a PDF, Word doc, or image to extract content for generation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DocumentUploader onTextExtracted={handleTextExtracted} />
        </CardContent>
      </Card>

      {/* Step 2: Configure Generation */}
      {extractedText && (
        <Card className="border-purple-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-900">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-600 text-sm font-bold">
                2
              </span>
              Generation Settings
            </CardTitle>
            <CardDescription>
              Define question distribution and custom instructions for the AI model.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <Label className="text-purple-900 font-semibold">Difficulty Distribution</Label>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label
                      htmlFor="easy"
                      className="text-2xs uppercase tracking-wider text-gray-500"
                    >
                      Easy
                    </Label>
                    <Input
                      id="easy"
                      type="number"
                      min="0"
                      value={difficultyConfig.easy}
                      onChange={(e) =>
                        setDifficultyConfig({
                          ...difficultyConfig,
                          easy: parseInt(e.target.value) || 0,
                        })
                      }
                      className="border-purple-100 focus:ring-purple-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="medium"
                      className="text-2xs uppercase tracking-wider text-gray-500"
                    >
                      Medium
                    </Label>
                    <Input
                      id="medium"
                      type="number"
                      min="0"
                      value={difficultyConfig.medium}
                      onChange={(e) =>
                        setDifficultyConfig({
                          ...difficultyConfig,
                          medium: parseInt(e.target.value) || 0,
                        })
                      }
                      className="border-purple-100 focus:ring-purple-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="hard"
                      className="text-2xs uppercase tracking-wider text-gray-500"
                    >
                      Hard
                    </Label>
                    <Input
                      id="hard"
                      type="number"
                      min="0"
                      value={difficultyConfig.hard}
                      onChange={(e) =>
                        setDifficultyConfig({
                          ...difficultyConfig,
                          hard: parseInt(e.target.value) || 0,
                        })
                      }
                      className="border-purple-100 focus:ring-purple-200"
                    />
                  </div>
                </div>
                <p className="text-xs text-purple-600 font-medium bg-purple-50 p-2 rounded-lg">
                  Total targeting: <span className="font-bold">{totalQuestions}</span> questions
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="instructions" className="text-purple-900 font-semibold">
                  Custom Instructions
                </Label>
                <Textarea
                  id="instructions"
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="e.g., Focus on specific learning objectives, tone should be academic..."
                  className="h-[104px] border-purple-100 focus:ring-purple-200 text-sm"
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}

            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !extractedText || totalQuestions === 0}
              className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg shadow-purple-200"
            >
              {isGenerating ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating {totalQuestions} questions...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Wand2 className="w-5 h-5" />
                  Generate Questions
                </span>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Governance & Validation Summary */}
      {governanceInfo && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
            <h4 className="text-2xs font-bold text-gray-400 uppercase tracking-widest mb-2">
              Tokens Consumed
            </h4>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-gray-900 font-mono">
                {governanceInfo.tokens_consumed.toLocaleString()}
              </p>
              <span className="text-xs text-gray-400">total</span>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
            <h4 className="text-2xs font-bold text-gray-400 uppercase tracking-widest mb-2">
              Quota Remaining
            </h4>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-purple-600 font-mono">
                {governanceInfo.quota_remaining.toLocaleString()}
              </p>
              <span className="text-xs text-purple-300">available</span>
            </div>
          </div>
          <div
            className={`bg-white p-6 rounded-2xl shadow-sm border ${validationSummary?.status === 'approved' ? 'border-green-100' : 'border-red-100'} transition-all hover:shadow-md`}
          >
            <h4 className="text-2xs font-bold text-gray-400 uppercase tracking-widest mb-2">
              Validation Status
            </h4>
            <div className="flex items-center justify-between">
              <StatusBadge
                status={
                  (validationSummary?.status === 'approved'
                    ? 'resolved'
                    : 'exhausted') as StatusType
                }
                label={validationSummary?.status.toUpperCase()}
              />
              <div className="text-right">
                <span
                  className={`text-xl font-bold font-mono ${validationSummary?.status === 'approved' ? 'text-green-600' : 'text-red-500'}`}
                >
                  {((validationSummary?.overall_score || 0) * 100).toFixed(0)}%
                </span>
                <p className="text-2xs text-gray-400 uppercase font-medium">Quality Score</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {validationSummary && validationSummary.status !== 'approved' && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
          <div className="prose prose-sm max-w-none text-amber-900">
            <h4 className="text-sm font-semibold mb-1">Validation Notice</h4>
            <ReactMarkdown>{validationSummary.summary}</ReactMarkdown>
          </div>
        </div>
      )}

      {/* Step 3: Review & Export */}
      {generatedQuestions.length > 0 && (
        <Card className="border-indigo-100 shadow-sm animate-in fade-in zoom-in-95 duration-500">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-indigo-900">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 text-sm font-bold">
                    3
                  </span>
                  Review & Finalize
                </CardTitle>
                <CardDescription>
                  Review AI-generated content and save it to your curriculum library.
                </CardDescription>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="w-64">
                  <Select value={selectedSkillId} onValueChange={setSelectedSkillId}>
                    <SelectTrigger className="bg-white border-indigo-200">
                      <SelectValue placeholder="Select Target Skill..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1b4b] border-white/10 text-white">
                      {skills?.map((skill) => (
                        <SelectItem key={skill.skill_id} value={skill.skill_id}>
                          {skill.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleImportDirectly}
                  disabled={isSaving || !selectedSkillId}
                  className="bg-indigo-600 hover:bg-indigo-700 gap-2"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save to Library
                </Button>

                <Button
                  variant="outline"
                  onClick={handleExportCSV}
                  className="border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800 gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <QuestionReviewGrid
              questions={generatedQuestions}
              onQuestionsChange={setGeneratedQuestions}
            />

            <div className="mt-8 p-6 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl">
              <h4 className="text-sm font-bold text-indigo-900 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                Completion Workflow
              </h4>
              <ul className="text-xs text-indigo-800 space-y-2 grid grid-cols-1 md:grid-cols-2 gap-x-8">
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 flex items-center justify-center rounded-full bg-indigo-200 text-indigo-700 text-2xs font-bold">
                    1
                  </span>
                  Review and refine generated questions in the grid.
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 flex items-center justify-center rounded-full bg-indigo-200 text-indigo-700 text-2xs font-bold">
                    2
                  </span>
                  Select a target skill from the dropdown above.
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 flex items-center justify-center rounded-full bg-indigo-200 text-indigo-700 text-2xs font-bold">
                    3
                  </span>
                  Click "Save to Library" to import directly.
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 flex items-center justify-center rounded-full bg-indigo-200 text-indigo-700 text-2xs font-bold">
                    4
                  </span>
                  Verify your imported questions in the curriculum module.
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
