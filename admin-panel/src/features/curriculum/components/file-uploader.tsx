import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { parseFile, ParsedFile } from '@/lib/file-parsers';
import { Upload, FileText, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface FileUploaderProps {
    onFileParsed: (content: string, fileName: string) => void;
    onClear: () => void;
}

export function FileUploader({ onFileParsed, onClear }: FileUploaderProps) {
    const [isParsing, setIsParsing] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setIsParsing(true);
        setError(null);

        try {
            console.log(`Parsing file: ${file.name}`);
            const result: ParsedFile = await parseFile(file);
            setFileName(result.name);
            onFileParsed(result.content, result.name);
        } catch (err) {
            setError((err as Error).message);
            console.error(err);
        } finally {
            setIsParsing(false);
        }
    }, [onFileParsed]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'text/plain': ['.txt']
        },
        maxFiles: 1
    });

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        setFileName(null);
        setError(null);
        onClear();
    };

    if (fileName) {
        return (
            <div className="border border-purple-200 bg-purple-50 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                        <FileText className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="font-medium text-purple-900">{fileName}</p>
                        <p className="text-xs text-purple-600">Ready for processing</p>
                    </div>
                </div>
                <Button variant="ghost" size="sm" onClick={handleClear} className="text-purple-400 hover:text-purple-700">
                    <X className="h-5 w-5" />
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
                    ${isDragActive ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'}
                    ${error ? 'border-red-300 bg-red-50' : ''}
                `}
            >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-2">
                    <div className="p-3 bg-gray-100 rounded-full text-gray-500 mb-2">
                        <Upload className="h-6 w-6" />
                    </div>
                    {isParsing ? (
                        <div className="w-full max-w-xs space-y-2">
                            <p className="text-sm font-medium text-gray-600">Extracting text...</p>
                            <Progress value={undefined} className="h-2" />
                        </div>
                    ) : (
                        <>
                            <p className="text-lg font-medium text-gray-700">
                                {isDragActive ? "Drop the file here" : "Drag & drop your file here"}
                            </p>
                            <p className="text-sm text-gray-500">
                                Support for PDF, Word (.docx), and Text files
                            </p>
                        </>
                    )}
                </div>
            </div>
            {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
                    <AlertCircle className="h-4 w-4" />
                    <span>{error}</span>
                </div>
            )}
        </div>
    );
}
