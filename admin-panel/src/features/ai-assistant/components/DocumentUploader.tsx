import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface DocumentUploaderProps {
  onTextExtracted: (text: string, filename: string) => void;
  maxSizeMB?: number;
}

interface UploadState {
  status: 'idle' | 'uploading' | 'extracting' | 'success' | 'error';
  message?: string;
  filename?: string;
  extractedText?: string;
}

export  const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  onTextExtracted,
  maxSizeMB = 10,
}) => {
  const [uploadState, setUploadState] = useState<UploadState>({ status: 'idle' });

  const extractTextFromPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    const textChunks: string[] = [];
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((item: any) => item.str)
        .join(' ');
      textChunks.push(pageText);
    }
    
    return textChunks.join('\n\n');
  };

  const extractTextFromDOCX = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  };

  const extractTextFromImage = async (file: File): Promise<string> => {
    // For images, we'll need to use Gemini Vision API via Edge Function
    // For now, return a placeholder that the Edge Function will handle
    return `[IMAGE: ${file.name}. Use Gemini Vision for OCR]`;
  };

  const handleFileDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    const fileSizeMB = file.size / (1024 * 1024);
    
    if (fileSizeMB > maxSizeMB) {
      setUploadState({
        status: 'error',
        message: `File size (${fileSizeMB.toFixed(2)}MB) exceeds ${maxSizeMB}MB limit`,
      });
      return;
    }

    setUploadState({
      status: 'extracting',
      message: 'Extracting text from document...',
      filename: file.name,
    });

    try {
      let extractedText: string;

      if (file.type === 'application/pdf') {
        extractedText = await extractTextFromPDF(file);
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        extractedText = await extractTextFromDOCX(file);
      } else if (file.type.startsWith('image/')) {
        extractedText = await extractTextFromImage(file);
      } else {
        throw new Error('Unsupported file type');
      }

      setUploadState({
        status: 'success',
        message: `Successfully extracted ${extractedText.length} characters`,
        filename: file.name,
        extractedText,
      });

      onTextExtracted(extractedText, file.name);
    } catch (error) {
      console.error('Text extraction error:', error);
      setUploadState({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to extract text',
      });
    }
  }, [maxSizeMB, onTextExtracted]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFileDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
    },
    maxFiles: 1,
    multiple: false,
  });

  const getStatusIcon = () => {
    switch (uploadState.status) {
      case 'extracting':
        return <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle2 className="w-12 h-12 text-green-500" />;
      case 'error':
        return <XCircle className="w-12 h-12 text-red-500" />;
      default:
        return <Upload className="w-12 h-12 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (uploadState.status) {
      case 'extracting':
        return 'border-blue-300 bg-blue-50';
      case 'success':
        return 'border-green-300 bg-green-50';
      case 'error':
        return 'border-red-300 bg-red-50';
      default:
        return isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white';
    }
  };

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-all duration-200 ease-in-out
          ${getStatusColor()}
          hover:border-blue-400 hover:bg-blue-50
        `}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center gap-4">
          {getStatusIcon()}
          
          <div>
            {uploadState.status === 'idle' && (
              <>
                <p className="text-lg font-semibold text-gray-700 mb-1">
                  {isDragActive ? 'Drop the file here' : 'Upload Source Document'}
                </p>
                <p className="text-sm text-gray-500">
                  Drag & drop or click to select
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  PDF, DOCX, PNG, JPG (max {maxSizeMB}MB)
                </p>
              </>
            )}
            
            {uploadState.status === 'extracting' && (
              <>
                <p className="text-lg font-semibold text-blue-700 mb-1">
                  Processing {uploadState.filename}
                </p>
                <p className="text-sm text-blue-600">
                  {uploadState.message}
                </p>
              </>
            )}
            
            {uploadState.status === 'success' && (
              <>
                <p className="text-lg font-semibold text-green-700 mb-1">
                  <File className="inline w-5 h-5 mr-2" />
                  {uploadState.filename}
                </p>
                <p className="text-sm text-green-600">
                  {uploadState.message}
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setUploadState({ status: 'idle' });
                  }}
                  className="mt-3 text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Upload another document
                </button>
              </>
            )}
            
            {uploadState.status === 'error' && (
              <>
                <p className="text-lg font-semibold text-red-700 mb-1">
                  Upload Failed
                </p>
                <p className="text-sm text-red-600">
                  {uploadState.message}
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setUploadState({ status: 'idle' });
                  }}
                  className="mt-3 text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Try again
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      
      {uploadState.extractedText && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">
            Extracted Text Preview
          </h4>
          <div className="text-xs text-gray-600 font-mono max-h-32 overflow-y-auto whitespace-pre-wrap">
            {uploadState.extractedText.substring(0, 500)}
            {uploadState.extractedText.length > 500 && '...'}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Total characters: {uploadState.extractedText.length.toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
};
