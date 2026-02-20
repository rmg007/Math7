import { createClient } from '@supabase/supabase-js';
import chalk from 'chalk';
import ora from 'ora';

interface CheckOptions {
  specId?: string;
  all?: boolean;
  format: 'console' | 'github' | 'json';
}

export async function checkCommand(options: CheckOptions) {
  const spinner = ora('Initializing drift analysis...').start();

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );

    // Fetch specifications to check
    let specs;
    if (options.specId) {
      const { data, error } = await supabase
        .from('specifications')
        .select('*')
        .eq('id', options.specId)
        .single();
      
      if (error) throw error;
      specs = [data];
    } else if (options.all) {
      const { data, error } = await supabase
        .from('specifications')
        .select('*')
        .is('deleted_at', null)
        .eq('status', 'active');
      
      if (error) throw error;
      specs = data;
    } else {
      throw new Error('Must specify --spec-id or --all');
    }

    spinner.text = `Analyzing ${specs.length} specification(s)...`;

    const results = [];
    let criticalCount = 0;
    let highCount = 0;
    let failCount = 0;

    for (const spec of specs) {
      spinner.text = `Checking: ${spec.entity_name}...`;

      // Call Workers AI for drift analysis (falls back to Supabase Edge Function)
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
            spec: JSON.stringify(spec),
            implementation: `specId: ${spec.id}, scope: all`,
          }),
          signal: AbortSignal.timeout(60_000),
        });
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          results.push({ spec: spec.entity_name, status: 'error', error: (body as any).error || `Workers error: ${response.status}` });
          continue;
        }
        const workerResult = (await response.json()) as any;
        data = workerResult.drift_report;
      } else {
        // Fallback: Supabase Edge Function (Gemini)
        const { data: edgeData, error } = await supabase.functions.invoke('analyze-spec-drift', {
          body: { specId: spec.id, scope: 'all' }
        });
        if (error) {
          results.push({ spec: spec.entity_name, status: 'error', error: error.message });
          continue;
        }
        data = edgeData;
      }

      results.push({
        spec: spec.entity_name,
        ...data
      });

      if (data.status === 'fail') failCount++;
      
      data.findings?.forEach((f: any) => {
        if (f.severity === 'critical') criticalCount++;
        if (f.severity === 'high') highCount++;
      });
    }

    spinner.succeed('Analysis complete');

    // Output results based on format
    if (options.format === 'console') {
      outputConsole(results, { criticalCount, highCount, failCount });
    } else if (options.format === 'github') {
      outputGithub(results, { criticalCount, highCount, failCount });
    } else {
      console.log(JSON.stringify(results, null, 2));
    }

    // Exit with error if critical issues found
    if (criticalCount > 0) {
      process.exit(1);
    }

  } catch (error) {
    spinner.fail('Analysis failed');
    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  }
}

function outputConsole(results: any[], summary: any) {
  console.log('\n' + chalk.bold('📊 Drift Analysis Results') + '\n');
  
  results.forEach(result => {
    const statusIcon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
    console.log(`${statusIcon} ${chalk.bold(result.spec)}: ${result.status}`);
    
    if (result.findings && result.findings.length > 0) {
      result.findings.forEach((f: any) => {
        const severityColor = {
          critical: chalk.red,
          high: chalk.yellow,
          medium: chalk.cyan,
          low: chalk.gray
        }[f.severity];
        
        console.log(`  ${severityColor('●')} ${f.type}: ${f.entity}`);
        console.log(`    Expected: ${f.expected}`);
        console.log(`    Actual: ${f.actual}`);
      });
    }
    console.log('');
  });

  console.log(chalk.bold('Summary:'));
  console.log(`  Total: ${results.length}`);
  console.log(`  Failed: ${summary.failCount}`);
  console.log(`  Critical Issues: ${chalk.red(summary.criticalCount)}`);
  console.log(`  High Issues: ${chalk.yellow(summary.highCount)}`);
}

function outputGithub(results: any[], summary: any) {
  console.log('## 📊 Oracle Plus: Specification Drift Report\n');
  
  if (summary.criticalCount > 0) {
    console.log('> [!CAUTION]');
    console.log(`> **${summary.criticalCount} critical** specification violations found!\n`);
  } else if (summary.highCount > 0) {
    console.log('> [!WARNING]');
    console.log(`> **${summary.highCount} high priority** drift issues found.\n`);
  } else {
    console.log('> [!NOTE]');
    console.log('> All specifications validated successfully ✅\n');
  }

  console.log('### Results\n');
  console.log(`- **Total Specs Checked:** ${results.length}`);
  console.log(`- **Failed:** ${summary.failCount}`);
  console.log(`- **Critical Issues:** ${summary.criticalCount}`);
  console.log(`- **High Issues:** ${summary.highCount}\n`);

  console.log('### Details\n');
  
  results.forEach(result => {
    const statusEmoji = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
    console.log(`#### ${statusEmoji} ${result.spec}\n`);
    
    if (result.findings && result.findings.length > 0) {
      console.log('| Severity | Type | Entity | Expected | Actual |');
      console.log('|----------|------|--------|----------|--------|');
      
      result.findings.forEach((f: any) => {
        console.log(`| ${f.severity} | ${f.type} | ${f.entity} | ${f.expected} | ${f.actual} |`);
      });
      console.log('');
    }

    if (result.recommendations && result.recommendations.length > 0) {
      console.log('**Recommendations:**\n');
      result.recommendations.forEach((r: string) => {
        console.log(`- ${r}`);
      });
      console.log('');
    }
  });
}
