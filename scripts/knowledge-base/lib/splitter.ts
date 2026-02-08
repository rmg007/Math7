/**
 * Markdown Splitter
 * Hierarchy-aware text splitter that preserves document structure
 */

import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

export interface DocumentChunk {
  content: string;
  breadcrumb: string;
  metadata: {
    heading?: string;
    level?: number;
    section?: string;
  };
}

/**
 * Extract headings from markdown content to build breadcrumb
 */
function extractHeadings(content: string): string[] {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const headings: string[] = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    headings.push(`${'  '.repeat(level - 1)}${text}`);
  }

  return headings;
}

/**
 * Build breadcrumb from heading hierarchy
 */
function buildBreadcrumb(fileName: string, headings: string[]): string {
  if (headings.length === 0) {
    return fileName;
  }
  
  // Take up to 3 most recent headings for context
  const recentHeadings = headings.slice(-3);
  return `${fileName} > ${recentHeadings.join(' > ')}`;
}

/**
 * Split markdown document into chunks while preserving structure
 */
export async function splitMarkdown(
  content: string,
  filePath: string
): Promise<DocumentChunk[]> {
  const fileName = filePath.split('/').pop() || filePath;

  const splitter = RecursiveCharacterTextSplitter.fromLanguage('markdown', {
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const docs = await splitter.createDocuments([content]);

  return docs.map((doc) => {
    const headings = extractHeadings(doc.pageContent);
    const breadcrumb = buildBreadcrumb(fileName, headings);

    // Extract first heading for metadata
    const firstHeadingMatch = doc.pageContent.match(/^(#{1,6})\s+(.+)$/m);
    const heading = firstHeadingMatch ? firstHeadingMatch[2].trim() : undefined;
    const level = firstHeadingMatch ? firstHeadingMatch[1].length : undefined;

    return {
      content: doc.pageContent,
      breadcrumb,
      metadata: {
        heading,
        level,
        section: heading,
      },
    };
  });
}
