import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Search, Sparkles, ArrowRight, LifeBuoy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { captureException } from '@/lib/error-tracker';
import type { OracleResult } from '@/services/OracleService';

interface KnownIssueOracleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KnownIssueOracleDialog({ open, onOpenChange }: KnownIssueOracleDialogProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<OracleResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    try {
      const { OracleService } = await import('@/services/OracleService');
      const searchResults = await OracleService.search(query);
      setResults(searchResults);
    } catch (err) {
      captureException(err as Error, {
        tags: { component: 'KnownIssueOracleDialog', method: 'handleSearch' },
        extra: { query },
      });
      toast({
        title: 'Search Failed',
        description: 'Failed to query knowledge base.',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-lg border border-gray-200 bg-white p-0 overflow-hidden shadow-lg max-w-2xl max-h-[85vh] overflow-y-auto">
        <div className="px-6 pt-6 pb-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-teal-50 border border-teal-100">
              <Sparkles className="w-4 h-4 text-teal-600" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-gray-900">
                Knowledge Search
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500 mt-0.5">
                Query the knowledge base for patterns and fixes.
              </DialogDescription>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              placeholder="Enter query..."
              className="w-full pl-9 pr-24 py-2 rounded border border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-teal-500 focus:ring-1 focus:ring-teal-600/20 outline-none focus-visible:outline-none text-sm"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-3 rounded bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold gap-1"
              onClick={handleSearch}
              disabled={isSearching}
            >
              {isSearching ? (
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <ArrowRight className="w-3 h-3" />
              )}
              Search
            </Button>
          </div>
        </div>

        <div className="px-6 pb-6 min-h-[200px]">
          {isSearching ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-8 h-8 border-3 border-gray-200 border-t-teal-600 rounded-full animate-spin" />
              <p className="text-xs text-gray-400">Searching...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-3">
              <span className="text-[11px] text-gray-500">{results.length} result(s) found</span>
              {results.map((res, i) => (
                <div key={i} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-gray-400 font-mono">
                      {res.file_path.split('\\').pop()}
                    </span>
                    <span className="text-[10px] text-teal-600 font-medium">
                      {Math.round(res.similarity * 100)}% match
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-4">{res.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <LifeBuoy className="w-10 h-10 text-gray-200 mb-3" />
              <p className="text-xs text-gray-400">Enter a query to search.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
