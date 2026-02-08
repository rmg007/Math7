import React, { useState } from 'react';
import { Wand2, Download, AlertCircle, Save } from 'lucide-react';
import { DocumentUploader } from '../components/DocumentUploader';
import { QuestionReviewGrid, GeneratedQuestion } from '../components/QuestionReviewGrid';
import { useSkills } from '@/features/curriculum/hooks/use-skills';
import { useBulkCreateQuestions } from '@/features/curriculum/hooks/use-questions';
import { useToast } from '@/hooks/use-toast';
import { useApp } from '@/contexts/AppContext';
import { governedGenerateQuestions } from '../api/governedGeneration';
import Papa from 'papaparse';

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
  const [validationSummary, setValidationSummary] = useState<{ status: string; summary: string; overall_score: number; findings: Array<{ question_id: number; issues: string[] }> } | null>(null);
  const [governanceInfo, setGovernanceInfo] = useState<{ tokens_consumed: number; quota_remaining: number } | null>(null);

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
        const finding = result.validation?.findings.find(f => f.question_id === index);
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
          variant: 'destructive'
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
      const options = q.metadata.options ? { options: q.metadata.options.map((text, i) => ({ id: String.fromCharCode(97 + i), text })) } : {};
      const solution = {
        correct_answer: q.metadata.correct_answer,
        explanation: q.metadata.explanation
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
        const options = q.metadata.options ? { 
          options: q.metadata.options.map((text, i) => ({ id: String.fromCharCode(97 + i), text })) 
        } : {};
        
        const solution = {
          correct_answer: q.metadata.correct_answer,
          explanation: q.metadata.explanation
        };

        return {
          app_id: currentApp?.app_id || '',
          content: q.text,
          type: (q.question_type === 'mcq' ? 'multiple_choice' : q.question_type) as 'boolean' | 'multiple_choice' | 'mcq_multi' | 'text_input' | 'reorder_steps',
          points: q.difficulty === 'hard' ? 20 : q.difficulty === 'medium' ? 10 : 5,
          status: 'draft' as const,
          options,
          solution,
          explanation: q.metadata.explanation || '',
          skill_id: selectedSkillId,
          sort_order: (generatedQuestions.length * 100) + index // Temporary sort order strategy
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
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          AI Question Generator
        </h1>
        <p className="text-gray-600">
          Upload a document, configure generation settings, and review AI-generated questions
        </p>
      </div>

      {/* Step 1: Upload Document */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Step 1: Upload Source Document
        </h2>
        <DocumentUploader onTextExtracted={handleTextExtracted} />
      </div>

      {/* Step 2: Configure Generation */}
      {extractedText && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Step 2: Configure Question Generation
          </h2>

          <div className="space-y-6">
            {/* Difficulty Distribution */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Difficulty Distribution (Total: {totalQuestions} questions)
              </label>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Easy
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={difficultyConfig.easy}
                    onChange={(e) =>
                      setDifficultyConfig({
                        ...difficultyConfig,
                        easy: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Medium
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={difficultyConfig.medium}
                    onChange={(e) =>
                      setDifficultyConfig({
                        ...difficultyConfig,
                        medium: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Hard
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={difficultyConfig.hard}
                    onChange={(e) =>
                      setDifficultyConfig({
                        ...difficultyConfig,
                        hard: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Custom Instructions */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Custom Instructions (Optional)
              </label>
              <textarea
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="E.g., Focus on algebra concepts, include word problems..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                rows={3}
              />
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !extractedText}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-3 px-4 rounded-md hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating {totalQuestions} questions...
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5" />
                  Generate {totalQuestions} Questions
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Governance & Validation Summary */}
      {governanceInfo && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">Tokens Consumed</h4>
            <p className="text-2xl font-bold text-gray-900">{governanceInfo.tokens_consumed.toLocaleString()}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">Quota Remaining</h4>
            <p className="text-2xl font-bold text-purple-600">{governanceInfo.quota_remaining.toLocaleString()}</p>
          </div>
          <div className={`bg-white p-4 rounded-lg shadow-sm border border-gray-200 ${validationSummary?.status === 'approved' ? 'border-green-200' : 'border-red-200'}`}>
            <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">Validation Status</h4>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${validationSummary?.status === 'approved' ? 'text-green-600' : 'text-red-500'}`}>
                {validationSummary?.status.toUpperCase()}
              </span>
              <span className="text-sm font-medium text-gray-500">
                 Score: {((validationSummary?.overall_score || 0) * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {validationSummary && validationSummary.status !== 'approved' && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-amber-900">Validation Notice</h4>
            <p className="text-sm text-amber-800">{validationSummary.summary}</p>
          </div>
        </div>
      )}

      {/* Step 3: Review & Export */}
      {generatedQuestions.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              Step 3: Review & Save
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedSkillId}
                onChange={(e) => setSelectedSkillId(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm min-w-[200px]"
              >
                <option value="">Select Target Skill...</option>
                {skills?.map((skill: { skill_id: string; title: string }) => (
                  <option key={skill.skill_id} value={skill.skill_id}>
                    {skill.title}
                  </option>
                ))}
              </select>
              
              <button
                onClick={handleImportDirectly}
                disabled={isSaving || !selectedSkillId}
                className="bg-purple-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-purple-700 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save to Library
              </button>

              <button
                onClick={handleExportCSV}
                className="bg-green-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-green-700 transition-all flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </div>

          <QuestionReviewGrid
            questions={generatedQuestions}
            onQuestionsChange={setGeneratedQuestions}
          />

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">
              📋 Next Steps
            </h4>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Review and edit the generated questions above</li>
              <li>Choose a target skill from the dropdown</li>
              <li>Click "Save to Library" to import directly OR "Export CSV" for manual bulk import</li>
              <li>Verify the questions in the curriculum management page</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
};
