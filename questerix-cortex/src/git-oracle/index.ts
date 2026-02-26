import { execSync } from 'child_process';

export interface GitOracleResult {
  recentlyModifiedFiles: string[];
  untestedModifiedFiles: string[];
  commitSummary: {
    hash: string;
    message: string;
    author: string;
    timeAgo: string;
  };
  uncommittedChanges: string[];
}

export class GitOracle {
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  /**
   * Analyze git state to find recently changed files that lack test coverage
   */
  analyze(untestedFiles: string[]): GitOracleResult {
    const recentlyModified = this.getRecentlyModifiedFiles();
    const untestedModified = this.findUntestedModifiedFiles(recentlyModified, untestedFiles);
    const commitSummary = this.getLastCommitSummary();
    const uncommittedChanges = this.getUncommittedChanges();

    return {
      recentlyModifiedFiles: recentlyModified,
      untestedModifiedFiles: untestedModified,
      commitSummary,
      uncommittedChanges
    };
  }

  /**
   * Get files modified in the last 24 hours
   */
  private getRecentlyModifiedFiles(): string[] {
    try {
      const output = execSync('git log --since="24 hours" --name-only --pretty=format:""', {
        cwd: this.projectRoot,
        encoding: 'utf-8'
      });

      return output
        .split('\n')
        .filter(line => line.trim())
        .filter(file => this.isSourceFile(file))
        .filter(file => !this.isExcluded(file))
        .map(file => this.normalizePath(file))
        .filter((file, index, arr) => arr.indexOf(file) === index); // Remove duplicates
    } catch (error) {
      console.warn('Failed to get recently modified files:', error);
      return [];
    }
  }

  /**
   * Find recently modified files that are also untested
   */
  private findUntestedModifiedFiles(recentlyModified: string[], untestedFiles: string[]): string[] {
    const untestedSet = new Set(
      untestedFiles.map(file => this.normalizePath(file))
    );

    return recentlyModified.filter(file => 
      untestedSet.has(file) || 
      untestedSet.has(file.replace(/\.(ts|tsx)$/, '')) ||
      Array.from(untestedSet).some((untested: string) => 
        file.includes(untested) || untested.includes(file)
      )
    ).slice(0, 10); // Limit to top 10
  }

  /**
   * Get summary of the last commit
   */
  private getLastCommitSummary() {
    try {
      const output = execSync('git log -1 --pretty=format:"%H|%s|%an|%ar"', {
        cwd: this.projectRoot,
        encoding: 'utf-8'
      }).trim();

      const [hash, message, author, timeAgo] = output.split('|');

      return {
        hash: hash.slice(0, 8),
        message,
        author,
        timeAgo
      };
    } catch (error) {
      console.warn('Failed to get last commit summary:', error);
      return {
        hash: 'unknown',
        message: 'Git unavailable',
        author: 'unknown',
        timeAgo: 'unknown'
      };
    }
  }

  /**
   * Get list of uncommitted changes
   */
  private getUncommittedChanges(): string[] {
    try {
      const output = execSync('git status --porcelain', {
        cwd: this.projectRoot,
        encoding: 'utf-8'
      });

      return output
        .split('\n')
        .filter(line => line.trim())
        .map(line => line.slice(3)) // Remove status characters
        .filter(file => this.isSourceFile(file))
        .filter(file => !this.isExcluded(file))
        .map(file => this.normalizePath(file));
    } catch (error) {
      console.warn('Failed to get uncommitted changes:', error);
      return [];
    }
  }

  /**
   * Check if file is a source file we care about
   */
  private isSourceFile(filePath: string): boolean {
    return /\.(ts|tsx|js|jsx)$/.test(filePath);
  }

  /**
   * Check if file should be excluded
   */
  private isExcluded(filePath: string): boolean {
    const excludePatterns = [
      'node_modules',
      'dist',
      'build',
      '.git',
      'coverage',
      '.next',
      '.nuxt',
      '.output',
      '__tests__',
      '.test.',
      '.spec.'
    ];

    return excludePatterns.some(pattern => filePath.includes(pattern));
  }

  /**
   * Normalize file path to use forward slashes
   */
  private normalizePath(filePath: string): string {
    return filePath.replace(/\\/g, '/');
  }
}
