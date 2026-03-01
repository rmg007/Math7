import mammoth from 'mammoth';

// pdfjs-dist is loaded lazily to avoid Node.js compatibility issues in test environments
let pdfjsLib: typeof import('pdfjs-dist') | null = null;

async function getPdfjs() {
  if (!pdfjsLib) {
    pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.mjs';
  }
  return pdfjsLib;
}

export interface ParsedFile {
  name: string;
  content: string;
  type: 'pdf' | 'docx' | 'txt';
}

export async function parseFile(file: File): Promise<ParsedFile> {
  // --- HADES: FILE SIZE LIMIT (F-17) ---
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      `File size too large (max 10MB). Received ${Math.round(file.size / 1024 / 1024)}MB`
    );
  }

  const fileType = file.name.split('.').pop()?.toLowerCase();
  let content = '';

  try {
    if (fileType === 'pdf') {
      content = await parsePdf(file);
    } else if (fileType === 'docx') {
      content = await parseDocx(file);
    } else if (fileType === 'txt') {
      content = await parseTxt(file);
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }
  } catch (error) {
    console.error('Error parsing file:', error);
    throw new Error(`Failed to parse ${file.name}: ${(error as Error).message}`);
  }

  return {
    name: file.name,
    content: content,
    type: fileType as 'pdf' | 'docx' | 'txt',
  };
}

async function parsePdf(file: File): Promise<string> {
  const pdfjs = await getPdfjs();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    interface TextItem {
      str: string;
    }
    const pageText = (textContent.items as TextItem[]).map((item) => item.str).join(' ');
    fullText += `\n--- Page ${i} ---\n${pageText}`;
  }

  return fullText;
}

async function parseDocx(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

async function parseTxt(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}
