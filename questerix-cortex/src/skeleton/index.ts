import * as fs from 'fs';
import * as path from 'path';
import {
    ArrowFunction,
    ClassDeclaration,
    FunctionDeclaration,
    InterfaceDeclaration,
    Project,
    SourceFile,
    SyntaxKind,
    TypeAliasDeclaration,
    VariableDeclaration,
} from 'ts-morph';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SkeletonExport {
  name: string;
  kind: 'function' | 'class' | 'interface' | 'type' | 'const' | 'unknown';
  signature: string;
  doc: string;
}

export interface SkeletonFile {
  file: string; // relative to admin-panel/src/
  exports: SkeletonExport[];
  imports: string[]; // raw module specifiers
}

export interface SkeletonReport {
  generatedAt: string;
  totalFiles: number;
  totalExports: number;
  files: SkeletonFile[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getDocComment(node: any): string {
  try {
    const docs = node.getJsDocs?.() ?? [];
    const jsDocText = docs.map((d: any) => d.getDescription().trim()).filter(Boolean).join(' ');
    if (jsDocText) return jsDocText;

    // Fallback: Check leading comments if no formal JSDoc
    const fullText = node.getSourceFile().getFullText();
    const commentRanges = node.getLeadingCommentRanges();
    if (commentRanges && commentRanges.length > 0) {
      return commentRanges
        .map((r: any) => {
          const text = fullText.slice(r.getPos(), r.getEnd()).trim();
          return text.replace(/^\/\/\s*/, '').replace(/^\/\*+\s*/, '').replace(/\*+\/$/, '').trim();
        })
        .filter((t: string) => !t.startsWith('@') && t.length > 3)
        .join(' ');
    }
    return '';
  } catch {
    return '';
  }
}

function extractExports(sourceFile: SourceFile): SkeletonExport[] {
  const results: SkeletonExport[] = [];

  const exported = sourceFile.getExportedDeclarations();

  for (const [name, declarations] of exported) {
    for (const decl of declarations) {
      try {
        const kind = decl.getKind();

        if (kind === SyntaxKind.FunctionDeclaration) {
          const fn = decl as FunctionDeclaration;
          const params = fn.getParameters().map(p => p.getText()).join(', ');
          const ret = fn.getReturnTypeNode()?.getText() ?? '';
          results.push({
            name,
            kind: 'function',
            signature: `(${params})${ret ? `: ${ret}` : ''}`,
            doc: getDocComment(fn as any),
          });

        } else if (kind === SyntaxKind.ArrowFunction || kind === SyntaxKind.VariableDeclaration) {
          // Handles: export const useXxx = () => ...
          const varDecl = (decl as VariableDeclaration);
          const init = varDecl.getInitializer?.();
          if (init && (init.getKind() === SyntaxKind.ArrowFunction)) {
            const arrow = init as ArrowFunction;
            const params = arrow.getParameters().map(p => p.getText()).join(', ');
            const ret = arrow.getReturnTypeNode()?.getText() ?? '';
            results.push({
              name,
              kind: 'function',
              signature: `(${params})${ret ? `: ${ret}` : ''}`,
              doc: getDocComment(varDecl as any),
            });
          } else {
            const typeText = (decl as any).getType?.()?.getText?.() ?? '';
            results.push({
              name,
              kind: 'const',
              signature: typeText.length < 120 ? typeText : typeText.slice(0, 120) + '…',
              doc: getDocComment(decl as any),
            });
          }

        } else if (kind === SyntaxKind.ClassDeclaration) {
          const cls = decl as ClassDeclaration;
          const heritage = cls.getExtends()?.getText() ?? '';
          results.push({
            name,
            kind: 'class',
            signature: heritage ? `extends ${heritage}` : '',
            doc: getDocComment(cls as any),
          });

        } else if (kind === SyntaxKind.InterfaceDeclaration) {
          const iface = decl as InterfaceDeclaration;
          const props = iface.getProperties().map(p => p.getName()).slice(0, 6);
          const more = iface.getProperties().length > 6 ? ', …' : '';
          results.push({
            name,
            kind: 'interface',
            signature: `{ ${props.join(', ')}${more} }`,
            doc: getDocComment(iface as any),
          });

        } else if (kind === SyntaxKind.TypeAliasDeclaration) {
          const alias = decl as TypeAliasDeclaration;
          const typeText = alias.getTypeNode()?.getText() ?? '';
          results.push({
            name,
            kind: 'type',
            signature: typeText.length < 120 ? typeText : typeText.slice(0, 120) + '…',
            doc: getDocComment(alias as any),
          });

        } else {
          results.push({ name, kind: 'unknown', signature: '', doc: '' });
        }
      } catch {
        // Skip declarations that can't be introspected
        results.push({ name, kind: 'unknown', signature: '', doc: '' });
      }
    }
  }

  return results;
}

function extractImports(sourceFile: SourceFile): string[] {
  return sourceFile
    .getImportDeclarations()
    .map(i => i.getModuleSpecifierValue());
}

// ── SkeletonGenerator ─────────────────────────────────────────────────────────

export class SkeletonGenerator {
  private project: Project;
  private srcPath: string;
  private srcLabel: string; // e.g. 'admin-panel/src/'

  constructor(project: Project, srcPath: string) {
    this.project = project;
    this.srcPath = srcPath;
    this.srcLabel = srcPath.replace(/\\/g, '/').split('/admin-panel/')[1]
      ? 'admin-panel/' + srcPath.replace(/\\/g, '/').split('/admin-panel/')[1].replace(/\/$/, '') + '/'
      : path.basename(srcPath) + '/';
  }

  generate(): SkeletonReport {
    const sourceFiles = this.project
      .getSourceFiles()
      .filter(sf => !sf.getFilePath().includes('node_modules'));

    const files: SkeletonFile[] = [];

    for (const sf of sourceFiles) {
      const absPath = sf.getFilePath().replace(/\\/g, '/');
      const relPath = absPath.includes('/admin-panel/src/')
        ? absPath.split('/admin-panel/src/')[1]
        : absPath.split('/').pop() ?? absPath;

      const exports = extractExports(sf);
      if (exports.length === 0) continue; // skip files with no exports

      files.push({
        file: relPath,
        exports,
        imports: extractImports(sf),
      });
    }

    // Sort by file path for stable output
    files.sort((a, b) => a.file.localeCompare(b.file));

    return {
      generatedAt: new Date().toISOString(),
      totalFiles: files.length,
      totalExports: files.reduce((s, f) => s + f.exports.length, 0),
      files,
    };
  }

  // ── Output writers ───────────────────────────────────────────────────────

  writeJson(report: SkeletonReport, outputPath: string): void {
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf-8');
  }

  /**
   * Full skeleton — grouped by feature area. Target < 50KB.
   * Load only the section relevant to the current edit.
   */
  writeMarkdownFull(report: SkeletonReport, outputPath: string): void {
    const groups: Record<string, SkeletonFile[]> = {};

    for (const file of report.files) {
      const group = this.groupKey(file.file);
      if (!groups[group]) groups[group] = [];
      groups[group].push(file);
    }

    const lines: string[] = [
      `# Codebase Skeleton`,
      `> Generated: ${report.generatedAt} | ${report.totalFiles} files | ${report.totalExports} exports`,
      `> **Load on demand** — fetch only the section(s) relevant to your current edit.`,
      '',
    ];

    for (const [group, groupFiles] of Object.entries(groups).sort()) {
      lines.push(`## ${group}`);
      for (const file of groupFiles) {
        lines.push(`### \`${file.file}\``);
        for (const exp of file.exports) {
          const doc = exp.doc ? ` — ${exp.doc}` : '';
          lines.push(`- **${exp.name}** \`${exp.kind}\` \`${exp.signature}\`${doc}`);
        }
        lines.push('');
      }
    }

    fs.writeFileSync(outputPath, lines.join('\n'), 'utf-8');
  }

  /**
   * Compact summary — always loaded at session start. Target < 10KB.
   * One line per file listing its top 3 exports.
   */
  writeMarkdownSummary(report: SkeletonReport, outputPath: string) {
    const lines: string[] = [
      `# 📝 Codebase Skeleton Summary`,
      `> Generated: ${report.generatedAt} | ${report.totalFiles} files | ${report.totalExports} exports`,
      '',
      '| Feature / Directory | File | Top Exports |',
      '| :--- | :--- | :--- |',
    ];

    // Better organization: group by directory
    const groups: Record<string, SkeletonFile[]> = {};
    for (const file of report.files) {
      const parts = file.file.split('/');
      const dir = parts.length > 1 ? parts[0] + '/' + (parts[1] === 'hooks' || parts[1] === 'lib' || parts[1] === 'components' ? parts[1] : '') : 'root';
      if (!groups[dir]) groups[dir] = [];
      groups[dir].push(file);
    }

    const sortedDirs = Object.keys(groups).sort();

    for (const dir of sortedDirs) {
      const filesInDir = groups[dir].sort((a, b) => a.file.localeCompare(b.file));
      for (let i = 0; i < filesInDir.length; i++) {
        const file = filesInDir[i];
        const topExports = file.exports
          .slice(0, 5)
          .map(e => `\`${e.name}\``)
          .join(', ');
        const more = file.exports.length > 5 ? ` (+${file.exports.length - 5} more)` : '';
        
        lines.push(`| ${i === 0 ? `**${dir}**` : ''} | \`${file.file}\` | ${topExports}${more} |`);
      }
    }

    fs.writeFileSync(outputPath, lines.join('\n'), 'utf-8');
  }

  /**
   * Utility Registry — specifically for shared helpers in hooks/ and lib/.
   * Helps avoid redundant implementation of common patterns.
   */
  writeUtilityRegistry(report: SkeletonReport, outputPath: string): void {
    const utilityFiles = report.files.filter(f => 
      f.file.startsWith('hooks/') || f.file.startsWith('lib/') || f.file.includes('/hooks/')
    );

    const lines: string[] = [
      `# 🛠️ Utility & Hook Registry`,
      `> Generated: ${report.generatedAt} | ${utilityFiles.length} files | ${utilityFiles.reduce((s, f) => s + f.exports.length, 0)} utilities`,
      `> **Search before you build.** This registry lists all shared logic to prevent redundancy.`,
      '',
      '| Utility / Hook | Kind | File | Signature | Description |',
      '| :--- | :--- | :--- | :--- | :--- |',
    ];

    for (const file of utilityFiles) {
      for (const exp of file.exports) {
        if (exp.kind === 'interface' || exp.kind === 'type') continue;
        const cleanSig = exp.signature.replace(/\|/g, '\\|');
        const cleanDoc = exp.doc.replace(/\|/g, '\\|').replace(/\n/g, ' ');
        lines.push(`| **${exp.name}** | \`${exp.kind}\` | \`${file.file}\` | \`${cleanSig}\` | ${cleanDoc} |`);
      }
    }

    fs.writeFileSync(outputPath, lines.join('\n'), 'utf-8');
  }

  private groupKey(filePath: string): string {
    const parts = filePath.split('/');
    if (parts[0] === 'features' && parts.length > 1) return `features/${parts[1]}`;
    if (parts[0] === 'hooks') return 'hooks';
    if (parts[0] === 'lib') return 'lib';
    if (parts[0] === 'pages') return 'pages';
    if (parts[0] === 'components') return 'components';
    if (parts[0] === 'types') return 'types';
    return parts[0] || 'other';
  }
}
