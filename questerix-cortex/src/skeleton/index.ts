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

function getDocComment(node: { getJsDocs?: () => Array<{ getDescription: () => string }> }): string {
  try {
    const docs = node.getJsDocs?.() ?? [];
    return docs.map(d => d.getDescription().trim()).filter(Boolean).join(' ');
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

  constructor(srcPath: string) {
    this.srcPath = srcPath;
    this.srcLabel = srcPath.replace(/\\/g, '/').split('/admin-panel/')[1]
      ? 'admin-panel/' + srcPath.replace(/\\/g, '/').split('/admin-panel/')[1].replace(/\/$/, '') + '/'
      : path.basename(srcPath) + '/';
    this.project = new Project({ skipFileDependencyResolution: true });
    this.project.addSourceFilesAtPaths(path.join(srcPath, '**/*.{ts,tsx}'));
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
  writeMarkdownSummary(report: SkeletonReport, outputPath: string): void {
    const lines: string[] = [
      `# Codebase Skeleton — Summary`,
      `> Generated: ${report.generatedAt} | ${report.totalFiles} files | ${report.totalExports} exports`,
      `> Always load this first. For full signatures, load \`SKELETON.md\` section for the area you're editing.`,
      '',
      '| File | Key Exports |',
      '|------|-------------|',
    ];

    for (const file of report.files) {
      const top = file.exports.slice(0, 3).map(e => `\`${e.name}\``).join(', ');
      const more = file.exports.length > 3 ? ` +${file.exports.length - 3}` : '';
      lines.push(`| \`${file.file}\` | ${top}${more} |`);
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
