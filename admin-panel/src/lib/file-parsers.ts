// @ts-expect-error - No types available for pdfjs-dist build
import * as pdfjsLib from "pdfjs-dist/build/pdf";
import mammoth from "mammoth";

// We need to set up the worker for PDF.js
// Ideally this should be handled by a vite plugin, or copy the worker to public
// For this implementation we will use a CDN for the worker to avoid complex build config changes
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface ParsedFile {
    name: string;
    content: string;
    type: 'pdf' | 'docx' | 'txt';
}

export async function parseFile(file: File): Promise<ParsedFile> {
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
        console.error("Error parsing file:", error);
        throw new Error(`Failed to parse ${file.name}: ${(error as Error).message}`);
    }

    return {
        name: file.name,
        content: content,
        type: fileType as 'pdf' | 'docx' | 'txt'
    };
}

async function parsePdf(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
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
