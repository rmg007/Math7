#!/usr/bin/env node

import { Command } from 'commander';
import { checkCommand } from './commands/check.js';
import { reportCommand } from './commands/report.js';
import { indexCommand } from './commands/index-spec.js';
import { generateTestsCommand } from './commands/generate-tests.js';

const program = new Command();

program
  .name('oracle-plus')
  .description('Oracle Plus CLI - Specification-driven development tool')
  .version('1.0.0');

program
  .command('check')
  .description('Run drift analysis on specifications')
  .option('--spec-id <uuid>', 'Check specific specification')
  .option('--all', 'Check all specifications')
  .option('--format <type>', 'Output format (console|github|json)', 'console')
  .action(checkCommand);

program
  .command('report')
  .description('Generate comprehensive drift report')
  .option('--format <type>', 'Output format (markdown|json|html)', 'markdown')
  .option('--output <path>', 'Output file path')
  .action(reportCommand);

program
  .command('index')
  .description('Index specifications and generate embeddings')
  .option('--source <glob>', 'Source files to index (e.g., docs/**/*.md)')
  .option('--spec-id <uuid>', 'Index specific specification')
  .option('--all', 'Re-index all specifications')
  .action(indexCommand);

program
  .command('generate-tests')
  .description('Generate test boilerplate from specifications')
  .requiredOption('--spec-id <uuid>', 'Specification ID')
  .requiredOption('--framework <name>', 'Test framework (mocktail|playwright|vitest)')
  .option('--type <type>', 'Test type (unit|integration|e2e)', 'unit')
  .option('--output <path>', 'Output file path')
  .action(generateTestsCommand);

program.parse();
