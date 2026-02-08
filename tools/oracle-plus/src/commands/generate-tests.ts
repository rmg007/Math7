import { createClient } from '@supabase/supabase-js';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs/promises';

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

    // Call Edge Function to generate tests
    const { data, error } = await supabase.functions.invoke('generate-test-from-spec', {
      body: {
        specId: options.specId,
        testType: options.type,
        framework: options.framework
      }
    });

    if (error) throw error;

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
    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  }
}
