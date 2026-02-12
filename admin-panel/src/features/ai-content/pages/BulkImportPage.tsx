import { useBulkImport } from '@/hooks/use-bulk-import';
import {
    Download,
    FileUp,
    Play,
    Sparkles,
    Terminal,
    Trash2,
    X,
    Zap
} from 'lucide-react';
import { useState } from 'react';

import { AdminHeader } from '@/components/ui/admin-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useSkills } from '@/features/curriculum/hooks/use-skills';
import { useToast } from '@/hooks/use-toast';


export default function BulkImportPage() {
  const { 
    importQueue, 
    setImportQueue, 
    handleFileUpload, 
    processImport, 
    isProcessing, 
    isDryRun,
    setIsDryRun,
    progress 
  } = useBulkImport();

  const { toast } = useToast();
  const { data: skills } = useSkills();
  const [selectedSkillId, setSelectedSkillId] = useState<string>('');
  const [importPrompt, setImportPrompt] = useState('');
  const [isAiParsing, _setIsAiParsing] = useState(false);

  const downloadTemplate = async () => {
    const { downloadBulkImportTemplate } = await import('@/utils/csv-templates');
    downloadBulkImportTemplate();
  };

  const handleAiImport = async () => {
    // TODO: Implement parse-import-prompt Edge Function
    // Currently this function doesn't exist on the server
    toast({
      title: "Coming Soon",
      description: "AI-powered import is not yet available. Please use manual upload for now.",
      variant: "default"
    });
    return;
    
    // Original code (commented out until Edge Function exists):
    /*
    const { data, error } = await supabase.functions.invoke('parse-import-prompt', {
      body: { prompt }
    });

    if (error) {
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive"
      });
      return;
    }
    
    if (data) {
      setImportPrompt('');
    }
    */
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 p-4 md:p-8">
      <AdminHeader 
        title="Curriculum Nexus"
        description="Bulk synchronize educational content via CSV or AI Prompt."
        icon={Terminal}
        actions={
          <Button 
            variant="outline" 
            onClick={downloadTemplate}
            className="h-10 px-4 rounded-xl border-gray-200 text-gray-600 hover:bg-gray-50 font-bold uppercase tracking-widest text-[9px] gap-2"
          >
            <Download className="w-4 h-4" /> Template
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <Card className="rounded-[2rem] border-0 shadow-2xl shadow-indigo-100/50 overflow-hidden">
            <CardHeader className="bg-indigo-600 text-white p-8">
              <div className="flex items-center gap-3 mb-2">
                <Zap className="w-5 h-5 text-indigo-200" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-100">Synchronizer</span>
              </div>
              <CardTitle className="text-2xl font-black tracking-tight">Import Source</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="space-y-4">
                 <Label className="text-[10px] font-black uppercase tracking-widest text-gray-600">Target Skill (Optional)</Label>
                 <Select value={selectedSkillId} onValueChange={setSelectedSkillId}>
                    <SelectTrigger aria-label="Select target skill" className="w-full h-12 rounded-xl border-gray-100 bg-gray-50 font-bold text-xs uppercase tracking-tight italic">
                      <SelectValue placeholder="Select target skill..." />
                    </SelectTrigger>
                    <SelectContent>
                      {skills?.map((skill) => (
                        <SelectItem key={skill.skill_id} value={skill.skill_id}>
                          {skill.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                 </Select>
              </div>

              <Tabs defaultValue="file" className="w-full">
                <TabsList className="grid w-full grid-cols-2 rounded-xl h-12 p-1 bg-gray-100 mb-6">
                  <TabsTrigger value="file" className="rounded-lg font-bold text-[10px] uppercase tracking-widest">CSV File</TabsTrigger>
                  <TabsTrigger value="ai" className="rounded-lg font-bold text-[10px] uppercase tracking-widest flex gap-2">
                    <Sparkles className="w-3 h-3" /> AI Prompt
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="file" className="space-y-6">
                  <div className="relative group">
                    <input 
                      type="file" 
                      accept=".csv" 
                      onChange={handleFileUpload}
                      aria-label="Upload CSV file"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="p-10 border-2 border-dashed border-gray-100 rounded-[2rem] bg-gray-50/50 group-hover:border-indigo-400 group-hover:bg-indigo-50/30 transition-all flex flex-col items-center justify-center text-center">
                      <FileUp className="w-12 h-12 text-gray-300 group-hover:text-indigo-500 mb-4 transition-transform group-hover:scale-110" />
                      <p className="text-xs font-bold text-gray-500 group-hover:text-indigo-600 uppercase tracking-widest">Drop CSV Matrix</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="ai" className="space-y-6">
                  <div className="space-y-4">
                    <Textarea 
                      placeholder="Paste unstructured questions here..."
                      className="min-h-[200px] rounded-2xl border-gray-100 bg-gray-50 focus:bg-white resize-none text-sm placeholder:text-gray-300 transition-all focus:border-indigo-500"
                      value={importPrompt}
                      onChange={(e) => setImportPrompt(e.target.value)}
                    />
                    <Button 
                      className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs uppercase tracking-widest gap-2"
                      onClick={handleAiImport}
                      disabled={isAiParsing || !importPrompt.trim()}
                    >
                      {isAiParsing ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                         <Sparkles className="w-4 h-4" />
                      )}
                      Sync with AI
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="pt-8 border-t border-gray-100 space-y-6">
                 <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-[10px] font-black uppercase tracking-widest text-gray-600">Execution Mode</Label>
                      <p className="text-xs font-bold text-gray-700">{isDryRun ? 'Dry Run' : 'Production'}</p>
                    </div>
                    <Switch checked={isDryRun} onCheckedChange={setIsDryRun} aria-label="Toggle dry run mode" />
                 </div>

                 <Button 
                    className="w-full h-14 bg-gray-900 hover:bg-black text-white rounded-2xl font-black text-xs uppercase tracking-widest gap-3 shadow-xl"
                    disabled={importQueue.length === 0 || isProcessing}
                    onClick={processImport}
                  >
                    {isProcessing ? (
                       <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                       <Play className="w-5 h-5 fill-current" />
                    )}
                    Commit {importQueue.length} Units
                  </Button>
              </div>
            </CardContent>
          </Card>

          {isProcessing && (
            <Card className="rounded-3xl border-0 shadow-lg bg-indigo-50 p-6 space-y-3">
              <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-indigo-600">
                <span>Synchronizing...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2 bg-white" />
            </Card>
          )}
        </div>

        <div className="lg:col-span-8 space-y-6">
          <Card className="rounded-[2.5rem] border-0 shadow-sm bg-white overflow-hidden min-h-[600px] flex flex-col">
            <CardHeader className="p-8 border-b border-gray-50 flex flex-row items-center justify-between bg-gray-50/30">
              <div>
                <CardTitle className="text-xl font-black tracking-tight text-gray-900">Synchronizer Buffer</CardTitle>
                <CardDescription className="text-xs font-bold uppercase tracking-widest text-gray-600 mt-1">
                  {importQueue.length} Candidates
                </CardDescription>
              </div>
              {importQueue.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setImportQueue([])}
                  className="text-red-500 hover:bg-red-50 font-black text-[10px] uppercase tracking-widest gap-2"
                >
                  <Trash2 className="w-3 h-3" /> Purge
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col">
              {importQueue.length === 0 ? (
                <EmptyState
                  icon={Terminal}
                  title="Buffer Empty"
                  description="Initialize synchronize operations via CSV upload or AI prompt to populate this buffer."
                  className="flex-1"
                />
              ) : (
                <div className="divide-y divide-gray-50">
                  {importQueue.map((item, index) => (
                    <div key={index} className="p-6 hover:bg-gray-50/50 transition-colors group">
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-400 shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-md text-[9px] font-black uppercase tracking-widest">
                               {item.type}
                            </span>
                            <h4 className="text-sm font-bold text-gray-900 leading-tight line-clamp-2">{item.content}</h4>
                          </div>
                          <div className="flex items-center gap-6">
                             <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Skill ID:</span>
                                <span className="text-[10px] font-mono text-gray-500">{(item.skill_id as string)?.slice(0, 8)}...</span>
                             </div>
                             <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Points:</span>
                                <span className="text-[10px] font-black text-gray-700">{item.points}</span>
                             </div>
                          </div>
                        </div>
                        <Button 
                             variant="ghost" 
                             size="icon" 
                             className="text-gray-300 hover:text-red-500 transition-all rounded-xl"
                             onClick={() => setImportQueue(q => q.filter((_, i) => i !== index))}
                           >
                             <X className="w-4 h-4" />
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
