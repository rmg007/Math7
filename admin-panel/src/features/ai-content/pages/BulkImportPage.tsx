import { useBulkImport } from '@/hooks/use-bulk-import';
import { Download, FileUp, Play, Sparkles, Terminal, Trash2, X, Zap } from 'lucide-react';
import { useState } from 'react';

import { AdminHeader } from '@/components/ui/admin-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useSkills } from '@/features/curriculum/hooks/use-skills';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

const WORKERS_URL = import.meta.env.VITE_WORKERS_URL;

async function parseImportPrompt(
  prompt: string,
  skillId: string
): Promise<{ questions: unknown[] }> {
  if (WORKERS_URL) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');
    const response = await fetch(`${WORKERS_URL}/ai/parse-import-prompt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ prompt, skillId }),
      signal: AbortSignal.timeout(45_000),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error((body as { error?: string }).error || `Workers AI error: ${response.status}`);
    }
    return response.json() as Promise<{ questions: unknown[] }>;
  }
  // Fallback: Supabase Edge Function (Gemini)
  const { data, error } = await supabase.functions.invoke('parse-import-prompt', {
    body: { prompt, skillId },
  });
  if (error) throw error;
  return data as { questions: unknown[] };
}

export default function BulkImportPage() {
  const {
    importQueue,
    setImportQueue,
    handleFileUpload,
    processImport,
    isProcessing,
    isDryRun,
    setIsDryRun,
    progress,
  } = useBulkImport();

  const { toast } = useToast();
  const { data: skills } = useSkills();
  const [selectedSkillId, setSelectedSkillId] = useState<string>('');
  const [importPrompt, setImportPrompt] = useState('');
  const [isAiParsing, setIsAiParsing] = useState(false);

  const downloadTemplate = async () => {
    const { downloadBulkImportTemplate } = await import('@/utils/csv-templates');
    downloadBulkImportTemplate();
  };

  const handleAiImport = async () => {
    if (!importPrompt.trim()) return;

    setIsAiParsing(true);
    try {
      const data = await parseImportPrompt(importPrompt, selectedSkillId);

      if (data?.questions) {
        setImportQueue((prev) => [...prev, ...(data.questions as typeof prev)]);
        setImportPrompt('');
        toast({
          title: 'AI Sync Successful',
          description: `Extracted ${data.questions.length} questions from prompt.`,
        });
      }
    } catch (err: unknown) {
      toast({
        title: 'Import failed',
        description: err instanceof Error ? err.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsAiParsing(false);
    }
  };

  return (
    <div
      className="max-w-7xl mx-auto space-y-10 pb-12"
      data-testid="bulk-import-page"
    >
      <AdminHeader
        title="Curriculum Nexus"
        description="High-velocity content ingestion via CSV matrices or intelligent AI prompt synthesis."
        icon={Terminal}
        actions={
          <Button
            variant="outline"
            onClick={downloadTemplate}
            data-testid="bulk-import-template-btn"
            className="group h-10 px-5 rounded-xl border-gray-200/50 bg-white/50 backdrop-blur-sm hover:bg-white hover:border-indigo-200 transition-all duration-300 gap-2"
          >
            <Download className="w-4 h-4 text-indigo-600 transition-transform group-hover:-translate-y-0.5" />
            <span className="bg-gradient-to-r from-indigo-700 to-blue-700 bg-clip-text text-transparent font-black tracking-widest text-[11px] uppercase">
               Download Template
            </span>
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4 space-y-8">
          <Card className="glass-card overflow-hidden border-0 shadow-2xl shadow-indigo-500/10 group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <CardHeader className="relative bg-indigo-900 p-8">
              <div className="absolute top-0 right-0 p-6 opacity-10">
                <Zap className="w-16 h-16 text-white" />
              </div>
              <div className="flex items-center gap-3 mb-2 relative">
                <div className="p-1.5 bg-white/10 rounded-lg backdrop-blur-md">
                  <Zap className="w-4 h-4 text-indigo-300" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-100">
                  Ingestion Core
                </span>
              </div>
              <CardTitle className="text-2xl font-black tracking-tight text-white relative">Import Source</CardTitle>
            </CardHeader>
            <CardContent className="relative p-8 space-y-10">
              <div className="space-y-4">
                <Label className="text-[11px] font-black uppercase tracking-widest text-gray-500">
                  Target Pedagogical Context
                </Label>
                <Select value={selectedSkillId} onValueChange={setSelectedSkillId}>
                  <SelectTrigger
                    aria-label="Select target skill"
                    data-testid="bulk-import-skill-select"
                    className="w-full h-12 rounded-xl border-gray-100 bg-gray-50/50 hover:bg-white focus:ring-indigo-400/20 font-bold text-xs transition-all italic"
                  >
                    <SelectValue placeholder="Select target skill..." />
                  </SelectTrigger>
                  <SelectContent className="glass-card border-gray-800 bg-gray-900/95 text-white" data-testid="bulk-import-skill-options">
                    {skills?.map((skill) => (
                      <SelectItem
                        key={skill.skill_id}
                        value={skill.skill_id}
                        data-testid={`bulk-import-skill-option-${skill.skill_id}`}
                        className="rounded-lg focus:bg-indigo-600"
                      >
                        {skill.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Tabs defaultValue="file" className="w-full" data-testid="bulk-import-tabs">
                <TabsList className="grid w-full grid-cols-2 rounded-2xl h-14 p-1.5 bg-gray-100/50 mb-8 blur-select transition-all">
                  <TabsTrigger
                    value="file"
                    data-testid="bulk-import-tab-csv"
                    className="rounded-xl font-black text-[11px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    CSV Matrix
                  </TabsTrigger>
                  <TabsTrigger
                    value="ai"
                    data-testid="bulk-import-tab-ai"
                    className="rounded-xl font-black text-[11px] uppercase tracking-widest flex gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> AI Synthesis
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="file" className="space-y-6 pt-2">
                  <div className="relative group border-2 border-dashed border-gray-100 rounded-[2.5rem] p-10 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all duration-500">
                    <input
                      type="file"
                      id="bulk-csv-upload"
                      accept=".csv"
                      onChange={handleFileUpload}
                      aria-label="Upload CSV file"
                      data-testid="bulk-import-file-upload"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="flex flex-col items-center justify-center text-center pointer-events-none">
                      <div className="w-16 h-16 rounded-3xl bg-white shadow-xl shadow-indigo-500/10 flex items-center justify-center mb-4 transition-transform group-hover:scale-110 group-hover:rotate-6 duration-500">
                         <FileUp className="w-8 h-8 text-indigo-500" />
                      </div>
                      <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest group-hover:text-indigo-600 transition-colors">
                        Drop CSV Artifact
                      </p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="ai" className="space-y-6 pt-2">
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Paste unstructured educational content here..."
                      data-testid="bulk-import-ai-textarea"
                      className="min-h-[220px] rounded-[2rem] border-gray-100 bg-gray-50 focus:bg-white resize-none text-sm placeholder:text-gray-300 transition-all focus:border-indigo-400 focus:ring-indigo-400/20 p-6 leading-relaxed"
                      value={importPrompt}
                      onChange={(e) => setImportPrompt(e.target.value)}
                    />
                    <Button
                      className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/20 gap-3 transition-all active:scale-95 group"
                      onClick={handleAiImport}
                      data-testid="bulk-import-sync-btn"
                      disabled={isAiParsing || !importPrompt.trim()}
                    >
                      {isAiParsing ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Sparkles className="w-5 h-5 text-indigo-300 transition-transform group-hover:rotate-12" />
                      )}
                      Sync AI Wisdom
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="pt-10 border-t border-gray-100/50 space-y-8">
                <div className="flex items-center justify-between px-2">
                  <div>
                    <Label className="text-[11px] font-black uppercase tracking-widest text-gray-500">
                      Commit Safety
                    </Label>
                    <p className="text-xs font-black text-gray-900 mt-1">
                      {isDryRun ? 'Dry Run Protocol' : 'Live Production'}
                    </p>
                  </div>
                  <Switch
                    checked={isDryRun}
                    onCheckedChange={setIsDryRun}
                    aria-label="Toggle dry run mode"
                    data-testid="bulk-import-dryrun-switch"
                    className="data-[state=checked]:bg-indigo-600"
                  />
                </div>

                <Button
                  className="w-full h-16 bg-[#1a1b4b] hover:bg-[#25266b] text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.25em] gap-4 shadow-2xl shadow-indigo-500/20 transition-all active:scale-[0.98] group overflow-hidden"
                  disabled={importQueue.length === 0 || isProcessing}
                  data-testid="bulk-import-commit-btn"
                  onClick={processImport}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  {isProcessing ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Play className="w-5 h-5 fill-current text-indigo-300 group-hover:scale-110 transition-transform" />
                  )}
                  Execute Persistence Cycle ({importQueue.length})
                </Button>
              </div>
            </CardContent>
          </Card>

          {isProcessing && (
            <Card className="glass-card border-0 shadow-2xl shadow-indigo-500/10 p-8 space-y-4 animate-in zoom-in-95 duration-500">
              <div className="flex justify-between items-end mb-1">
                <div className="space-y-0.5">
                  <h4 className="text-[11px] font-black text-indigo-600 uppercase tracking-widest">Processing Data</h4>
                  <p className="text-xs font-bold text-gray-500 italic">Sequential byte migration...</p>
                </div>
                <span className="text-xl font-black text-indigo-600 font-mono tracking-tighter">{progress}%</span>
              </div>
              <Progress value={progress} className="h-3 bg-indigo-50 rounded-full" />
            </Card>
          )}
        </div>

        <div className="lg:col-span-8 space-y-6">
          <Card
            className="glass-card border-0 shadow-3xl shadow-gray-200/50 overflow-hidden min-h-[700px] flex flex-col rounded-[3rem]"
            data-testid="bulk-import-buffer-card"
          >
            <CardHeader className="p-10 border-b border-gray-100/50 flex flex-row items-center justify-between bg-gray-50/30">
              <div className="space-y-1">
                <CardTitle className="text-2xl font-black tracking-tight text-gray-900 leading-none">
                  Nexus Buffer
                </CardTitle>
                <CardDescription className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                  {importQueue.length} Pending Ingestion Units
                </CardDescription>
              </div>
              {importQueue.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setImportQueue([])}
                  className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-black text-[11px] uppercase tracking-widest gap-2 rounded-xl transition-all"
                >
                  <Trash2 className="w-4 h-4" /> Purge Buffer
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col">
              {importQueue.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-20 text-center space-y-6 grayscale opacity-100">
                  <div className="w-24 h-24 rounded-4xl bg-gray-100 flex items-center justify-center">
                    <Terminal className="w-12 h-12 text-gray-500" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-gray-900">Logical Void Detected</h3>
                    <p className="text-xs font-medium text-gray-500 max-w-xs mx-auto">
                      Initiate content stream via CSV matrix or AI synthesis to populate the nexus buffer.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-gray-100/50 max-h-[800px] overflow-y-auto custom-scrollbar">
                  {importQueue.map((item, index) => (
                    <div
                      key={index}
                      className="p-8 hover:bg-indigo-50/30 transition-all duration-300 group relative border-l-4 border-l-transparent hover:border-l-indigo-500"
                      data-testid={`bulk-import-buffer-item-${index}`}
                    >
                      <div className="flex items-start gap-6 relative">
                        <div className="w-10 h-10 rounded-2xl bg-gray-100/80 backdrop-blur-sm flex items-center justify-center text-xs font-black text-gray-500 shrink-0 shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                          {index + 1}
                        </div>
                        <div className="flex-1 space-y-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <span className="px-2.5 py-1 bg-indigo-100/50 text-indigo-800 rounded-lg text-[11px] font-black uppercase tracking-[0.15em] border border-indigo-200/50">
                                {item.type}
                              </span>
                            </div>
                            <h4 className="text-base font-bold text-gray-900 leading-snug tracking-tight">
                              {item.content}
                            </h4>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-x-10 gap-y-4">
                            <div className="flex items-center gap-3">
                              <div className="w-1 h-8 bg-indigo-100 rounded-full" />
                              <div className="space-y-0.5">
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-extra-wide">Skill ID</span>
                                <p className="text-[11px] font-mono font-bold text-gray-700">
                                  {(item.skill_id as string)?.slice(0, 12)}...
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-1 h-8 bg-gray-100 rounded-full" />
                              <div className="space-y-0.5">
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-extra-wide">Weight</span>
                                <p className="text-[11px] font-black text-gray-900">
                                  {item.points} <span className="text-[10px] text-gray-500 font-bold ml-1">pts</span>
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Remove item from queue"
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-all rounded-2xl h-11 w-11 shrink-0"
                          onClick={() => setImportQueue((q) => q.filter((_, i) => i !== index))}
                        >
                          <X className="w-5 h-5 mt-0.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
