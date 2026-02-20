import { createClient } from '@supabase/supabase-js';
import chalk from 'chalk';
import fs from 'fs/promises';
import ora from 'ora';

interface GenerateTestsOptions {
  specId: string;
  framework: 'mocktail' | 'playwright' | 'vitest';
  type: 'unit' | 'integration' | 'e2e';
  output?: string;
}

export async function generateTestsCommand(options: GenerateTestsOptions) {
  const spinner = ora('Generating test boilerplate...').start();

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );

    // Call Workers AI for test generation (falls back to Supabase Edge Function)
    let data: any;
    const workersUrl = process.env.WORKERS_URL;
    if (workersUrl) {
      const token = process.env.SUPABASE_SERVICE_ROLE_KEY;
      const response = await fetch(`${workersUrl}/ai/analyze-spec-drift`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          spec: `specId: ${options.specId}, framework: ${options.framework}, type: ${options.type}`,
          implementation: `Generate ${options.type} tests using ${options.framework} for spec ${options.specId}`,
          context: `Output ONLY runnable ${options.framework} test code with no explanations.`,
        }),
        signal: AbortSignal.timeout(60_000),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error((body as any).error || `Workers error: ${response.status}`);
      }
      const workerResult = (await response.json()) as any;
      // Map drift_report.recommended_tests to testCode format
      data = {
        testCode: workerResult.drift_report?.recommended_tests?.join('\n\n') ?? '// No test suggestions generated',
        fileName: `${options.specId}.${options.framework}.test.ts`,
      };
    } else {
      // Fallback: Supabase Edge Function (Gemini)
      const { data: edgeData, error } = await supabase.functions.invoke('generate-test-from-spec', {
        body: {
          specId: options.specId,
          testType: options.type,
          framework: options.framework
        }
      });
      if (error) throw error;
      data = edgeData;
    }

    spinner.succeed('Test generated successfully');

    // Output or save
    if (options.output) {
      await fs.writeFile(options.output, data.testCode, 'utf-8');
      console.log(chalk.green(`✅ Test saved to: ${options.output}`));
    } else {
      console.log(`\n${chalk.bold('Suggested filename:')} ${data.fileName}\n`);
      console.log(chalk.dim('─'.repeat(60)));
      console.log(data.testCode);
      console.log(chalk.dim('─'.repeat(60)));
    }

  } catch (error) {
    spinner.fail('Test generation failed');
    console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
