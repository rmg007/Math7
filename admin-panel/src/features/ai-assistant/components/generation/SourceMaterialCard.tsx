import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DocumentUploader } from '../DocumentUploader';

interface SourceMaterialCardProps {
  onTextExtracted: (text: string, filename: string) => void;
}

export function SourceMaterialCard({ onTextExtracted }: SourceMaterialCardProps) {
  return (
    <Card
      className="glass-card overflow-hidden border-0 shadow-xl shadow-blue-500/5 group"
      role="region"
      aria-label="Step 1: Source Material Upload"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <CardHeader className="relative pb-2">
        <div className="flex items-center gap-3 mb-1">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-xl bg-blue-600/10 text-blue-600 text-sm font-bold shadow-inner"
            aria-hidden="true"
          >
            1
          </div>
          <CardTitle className="text-gray-900 font-bold tracking-tight">Source Material</CardTitle>
        </div>
        <CardDescription
          id="source-material-desc"
          className="text-gray-500 text-xs leading-relaxed"
        >
          Upload a document to serve as the ground truth for generation.
        </CardDescription>
      </CardHeader>
      <CardContent className="relative pt-4">
        <DocumentUploader onTextExtracted={onTextExtracted} />
      </CardContent>
    </Card>
  );
}
