import { useState } from 'react';
import { useSkills } from '../hooks/use-skills';
import { useAIGenerator } from '@/hooks/use-ai-generator';
import { FileUploader } from '../components/file-uploader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wand2, Download, RefreshCw, AlertTriangle, CheckCircle2, FileText } from 'lucide-react';
import { AIQuestion } from '@/lib/gemini';
import { downloadFile } from '@/lib/data-utils';
import { Link } from 'react-router-dom';

export function AIGeneratorPage() {
    // Stage: 'upload' | 'config' | 'review' | 'results'
    const [stage, setStage] = useState<'upload' | 'config' | 'review' | 'results'>('upload');
    
    // Data State
    const [fileContent, setFileContent] = useState('');
    const [fileName, setFileName] = useState('');
    const [config, setConfig] = useState({
        skillId: '',
        count: 10,
        difficulty: 'Medium',
        type: 'all' as 'all' | 'multiple_choice' | 'boolean'
    });
    const [promptInstruction, setPromptInstruction] = useState('');
    const [generatedQuestions, setGeneratedQuestions] = useState<AIQuestion[]>([]);

    // Hooks
    const { data: skills } = useSkills();
    const { generate, isGenerating } = useAIGenerator();

    // Handlers
    const handleFileParsed = (content: string, name: string) => {
        setFileContent(content);
        setFileName(name);
        setStage('config');
    };

    const handleConfigSubmit = () => {
        // Build initial prompt instruction based on config
        const selectedSkill = skills?.find((s) => s.skill_id === config.skillId);
        const skillName = selectedSkill ? selectedSkill.title : "General Math";
        
        const initialPrompt = `Analyze the provided context material.
Focus heavily on the topic: "${skillName}".
Generate ${config.count} questions at ${config.difficulty} difficulty.
Ensure questions are clear, concise, and suitable for the curriculum.`;

        setPromptInstruction(initialPrompt);
        setStage('review');
    };

    const handleGenerate = async () => {
        const selectedSkill = skills?.find((s) => s.skill_id === config.skillId);
        
        const result = await generate({
            context: fileContent,
            count: config.count,
            difficulty: config.difficulty,
            skillTitle: selectedSkill?.title || 'Math',
            promptInstruction: promptInstruction,
            questionType: config.type
        });

        if (result) {
            setGeneratedQuestions(result);
            setStage('results');
        }
    };

    const handleDownloadCSV = () => {
        if (generatedQuestions.length === 0) return;

        // Convert options array to JSON string for CSV compatibility
        const csvRows = generatedQuestions.map(q => ({
            content: q.content,
            type: q.type,
            points: q.points,
            explanation: q.explanation,
            // We map 'options' to a format that the bulk importer can read later
            // For now, simpler is better: JSON string
            options: q.options ? JSON.stringify(q.options) : '',
            correct_answer: q.correct_answer,
            // Important: We need to output the Skill Title so Bulk Import can map it
            skill_title: skills?.find((s) => s.skill_id === config.skillId)?.title || '',
            status: 'draft'
        }));

        const headers = ['content', 'type', 'points', 'explanation', 'options', 'correct_answer', 'skill_title', 'status'] as const;
        const csvContent = [
            headers.join(','),
            ...csvRows.map(row => 
                headers.map(header => {
                    const val = row[header];
                    // Escape CSV values
                    return `"${String(val).replace(/"/g, '""')}"`;
                }).join(',')
            )
        ].join('\n');

        downloadFile(csvContent, `AI_Questions_${fileName.replace(/\.[^/.]+$/, "")}.csv`, 'text/csv');
    };

    const handleReset = () => {
        setStage('upload');
        setFileContent('');
        setFileName('');
        setGeneratedQuestions([]);
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-12">
            <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                    <Wand2 className="h-8 w-8 text-purple-600" />
                    AI Curriculum Assistant
                </h2>
                <p className="text-gray-500">
                    Generate curriculum-aligned questions from your documents in minutes.
                </p>
                {!import.meta.env.VITE_GEMINI_API_KEY && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3 mt-2">
                        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                        <div>
                            <h4 className="font-semibold text-amber-800">Missing API Key</h4>
                            <p className="text-sm text-amber-700 mt-1">
                                VITE_GEMINI_API_KEY is not detected. The AI generation will fail. 
                                Please add your Google Gemini API key to your .env file.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Stepper / Progress */}
            <div className="flex items-center justify-between px-8 py-4 bg-white rounded-xl border border-gray-100 shadow-sm relative overflow-hidden">
                {['Upload', 'Configure', 'Review Prompt', 'Results'].map((step, idx) => {
                    const stepStageMap = ['upload', 'config', 'review', 'results'];
                    const currentIdx = stepStageMap.indexOf(stage);
                    const isActive = currentIdx >= idx;
                    const isCurrent = currentIdx === idx;
                    
                    return (
                        <div key={step} className={`flex items-center gap-2 z-10 ${isActive ? 'text-purple-700' : 'text-gray-400'}`}>
                            <div className={`
                                w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors
                                ${isActive ? 'bg-purple-100 border-purple-600' : 'bg-white border-gray-200'}
                                ${isCurrent ? 'ring-2 ring-purple-200 ring-offset-2' : ''}
                            `}>
                                {idx + 1}
                            </div>
                            <span className={`font-medium ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>{step}</span>
                        </div>
                    );
                })}
                {/* Progress Bar Background */}
                <div className="absolute left-0 top-1/2 w-full h-0.5 bg-gray-100 -z-0" />
            </div>

            {/* Main Content Area */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 min-h-[400px]">
                
                {/* STAGE 1: UPLOAD */}
                {stage === 'upload' && (
                    <div className="space-y-6 max-w-xl mx-auto text-center py-8">
                        <div>
                            <h3 className="text-xl font-semibold mb-2">Upload Source Material</h3>
                            <p className="text-gray-500">
                                Upload a textbook chapter, lesson plan, or notes. We support PDF, Word, and Text files.
                            </p>
                        </div>
                        <FileUploader onFileParsed={handleFileParsed} onClear={() => setFileContent('')} />
                    </div>
                )}

                {/* STAGE 2: CONFIG */}
                {stage === 'config' && (
                    <div className="space-y-6 max-w-lg mx-auto">
                        <div>
                            <h3 className="text-xl font-semibold">Configuration</h3>
                            <p className="text-gray-500">Target the content to a specific skill and difficulty.</p>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Target Skill (Required)</Label>
                                <Select 
                                    value={config.skillId} 
                                    onValueChange={(val) => setConfig({...config, skillId: val})}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a skill..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {skills?.map((s) => (
                                            <SelectItem key={s.skill_id} value={s.skill_id}>{s.title}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-gray-500">This ensures generated questions map correctly in your database.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Question Count</Label>
                                    <Input 
                                        type="number" 
                                        min={1} 
                                        max={50} 
                                        value={config.count}
                                        onChange={(e) => setConfig({...config, count: parseInt(e.target.value)})} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Difficulty</Label>
                                    <Select 
                                        value={config.difficulty} 
                                        onValueChange={(val) => setConfig({...config, difficulty: val})}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Easy">Easy</SelectItem>
                                            <SelectItem value="Medium">Medium</SelectItem>
                                            <SelectItem value="Hard">Hard</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Data Source</Label>
                                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg flex items-center gap-2 text-sm text-gray-600">
                                    <FileText className="h-4 w-4" />
                                    <span className="truncate flex-1">{fileName}</span>
                                    <span className="text-xs font-semibold px-2 py-1 bg-gray-200 rounded text-gray-700">
                                        {(fileContent.length / 1000).toFixed(1)}k chars
                                    </span>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <Button variant="outline" onClick={() => setStage('upload')} className="flex-1">Back</Button>
                                <Button 
                                    onClick={handleConfigSubmit} 
                                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                                    disabled={!config.skillId}
                                >
                                    Next: Review Prompt
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* STAGE 3: REVIEW PROMPT */}
                {stage === 'review' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-semibold">Review Instruction</h3>
                                <p className="text-gray-500">Review and edit the instructions we will send to the AI.</p>
                            </div>
                            <div className="text-sm px-3 py-1 bg-blue-50 text-blue-700 rounded-full font-medium">
                                Human-in-the-Loop
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>AI Instruction</Label>
                            <Textarea 
                                value={promptInstruction}
                                onChange={(e) => setPromptInstruction(e.target.value)}
                                className="min-h-[200px] font-mono text-sm leading-relaxed"
                                placeholder="Enter instructions..."
                            />
                            <p className="text-xs text-gray-500">
                                Tip: Be specific. e.g., "Avoid negative numbers" or "Focus on word problems".
                            </p>
                        </div>

                        <div className="pt-4 flex gap-3">
                            <Button variant="outline" onClick={() => setStage('config')} className="w-32">Back</Button>
                            <Button 
                                onClick={handleGenerate} 
                                disabled={isGenerating}
                                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-md"
                            >
                                {isGenerating ? (
                                    <>
                                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Wand2 className="mr-2 h-4 w-4" />
                                        Generate Questions
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                )}

                {/* STAGE 4: RESULTS */}
                {stage === 'results' && (
                    <div className="space-y-8">
                        <div className="text-center space-y-2 py-4">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 className="h-8 w-8" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900">Success!</h3>
                            <p className="text-gray-500">
                                We generated {generatedQuestions.length} questions based on your material.
                            </p>
                        </div>

                        <div className="border rounded-xl overflow-hidden">
                            <div className="bg-gray-50 px-4 py-2 border-b text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Preview (First 3)
                            </div>
                            <div className="divide-y divide-gray-100">
                                {generatedQuestions.slice(0, 3).map((q, i) => (
                                    <div key={i} className="p-4 hover:bg-gray-50 transition-colors">
                                        <div className="flex justify-between gap-4 mb-1">
                                            <p className="font-medium text-gray-900">{q.content}</p>
                                            <span className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-600 whitespace-nowrap h-fit">
                                                {q.type}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500 mb-2">Ans: {q.correct_answer}</p>
                                        <div className="flex gap-2">
                                            {q.options?.map((opt, j) => (
                                                <span key={j} className="text-xs px-2 py-1 border rounded bg-white text-gray-500">
                                                    {typeof opt === 'string' ? opt : JSON.stringify(opt)}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <Button 
                                variant="outline" 
                                onClick={handleReset} 
                                className="flex-1"
                            >
                                Start Over
                            </Button>
                            <Button 
                                onClick={handleDownloadCSV} 
                                className="flex-[2] bg-green-600 hover:bg-green-700 text-white"
                            >
                                <Download className="mr-2 h-4 w-4" />
                                Download CSV for Bulk Import
                            </Button>
                            <Link to="/questions" className="flex-1">
                                <Button variant="secondary" className="w-full">
                                    Go to Questions
                                </Button>
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
