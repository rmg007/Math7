import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, Zap, Loader2 } from 'lucide-react';

interface Skill {
  skill_id: string;
  title: string;
}

interface RefinePersistActionHeaderProps {
  selectedSkillId: string;
  setSelectedSkillId: (id: string) => void;
  skills?: Skill[];
  onExportCSV: () => void;
  onImportDirectly: () => void;
  isSaving: boolean;
  generatedCount: number;
}

export function RefinePersistActionHeader({
  selectedSkillId,
  setSelectedSkillId,
  skills,
  onExportCSV,
  onImportDirectly,
  isSaving,
  generatedCount,
}: RefinePersistActionHeaderProps) {
  return (
    <CardHeader className="relative overflow-hidden border-b border-gray-100/50 pb-8">
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />

      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 relative">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-600/10 text-indigo-600 text-sm font-bold shadow-inner"
              aria-hidden="true"
            >
              3
            </div>
            <CardTitle className="text-gray-900 font-extrabold text-2xl tracking-tight">
              Refine & Persist
            </CardTitle>
          </div>
          <CardDescription className="text-gray-500 font-medium italic opacity-80 pt-1">
            Review {generatedCount} artifacts and transmit them to the Curriculum Nexus for governed
            ingestion.
          </CardDescription>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="w-full sm:w-72 group">
            <Select value={selectedSkillId} onValueChange={setSelectedSkillId}>
              <SelectTrigger
                className="h-12 bg-white/80 border-indigo-100 hover:border-indigo-300 focus:ring-indigo-400/20 rounded-xl transition-all font-bold shadow-sm"
                aria-label="Select target skill"
              >
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
              onClick={onExportCSV}
              variant="outline"
              className="h-12 px-6 rounded-xl text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 font-bold transition-all border-emerald-100/50 gap-2 uppercase tracking-widest text-[10px]"
              aria-label="Export generated questions to CSV"
            >
              <Download className="w-4 h-4" aria-hidden="true" />
              CSV Data
            </Button>

            <Button
              onClick={onImportDirectly}
              disabled={isSaving || !selectedSkillId}
              className="h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-lg shadow-indigo-600/20 gap-3 transition-all active:scale-95 uppercase tracking-[0.2em] text-[10px]"
              aria-label={isSaving ? 'Directing to Nexus...' : 'Send to Nexus'}
            >
              {isSaving ? (
                <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
              ) : (
                <Zap className="w-5 h-5 text-indigo-300" aria-hidden="true" />
              )}
              Send to Nexus
            </Button>
          </div>
        </div>
      </div>
    </CardHeader>
  );
}
