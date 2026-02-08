import { createClient } from '@supabase/supabase-js';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs/promises';

interface ReportOptions {
  format: 'markdown' | 'json' | 'html';
  output?: string;
}

export async function reportCommand(options: ReportOptions) {
  const spinner = ora('Generating drift report...').start();

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );

    // Fetch recent validations
    const { data: validations, error } = await supabase
      .from('spec_validations')
      .select(`
        *,
        specifications(entity_type, entity_name)
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    spinner.succeed('Data retrieved');

    // Generate report based on format
    let report = '';
    
    if (options.format === 'markdown') {
      report = generateMarkdownReport(validations);
    } else if (options.format === 'json') {
      report = JSON.stringify(validations, null, 2);
    } else {
      throw new Error('HTML format not yet implemented');
    }

    // Output or save
    if (options.output) {
      await fs.writeFile(options.output, report, 'utf-8');
      console.log(chalk.green(`✅ Report saved to: ${options.output}`));
    } else {
      console.log(report);
    }

  } catch (error) {
    spinner.fail('Report generation failed');
    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  }
}

function generateMarkdownReport(validations: any[]): string {
  const now = new Date().toISOString();
  
  let report = `# Oracle Plus Drift Report\n\n`;
  report += `**Generated:** ${now}\n\n`;
  
  // Summary
  const total = validations.length;
  const passed = validations.filter(v => v.status === 'pass').length;
  const failed = validations.filter(v => v.status === 'fail').length;
  const warnings = validations.filter(v => v.status === 'warning').length;
  
  const critical = validations.filter(v => v.severity === 'critical').length;
  const high = validations.filter(v => v.severity === 'high').length;

  report += `## Summary\n\n`;
  report += `- **Total Validations:** ${total}\n`;
  report += `- **Passed:** ${passed} ✅\n`;
  report += `- **Failed:** ${failed} ❌\n`;
  report += `- **Warnings:** ${warnings} ⚠️\n`;
  report += `- **Critical Issues:** ${critical}\n`;
  report += `- **High Priority Issues:** ${high}\n\n`;

  // Group by specification
  const bySpec = validations.reduce((acc, v) => {
    const key = v.specifications?.entity_name || 'Unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(v);
    return acc;
  }, {});

  report += `## Validation Results\n\n`;
  
  Object.entries(bySpec).forEach(([specName, vals]: [string, any]) => {
    const latestVal = vals[0]; // Most recent
    const statusIcon = latestVal.status === 'pass' ? '✅' : latestVal.status === 'fail' ? '❌' : '⚠️';
    
    report += `### ${statusIcon} ${specName}\n\n`;
    report += `**Latest Status:** ${latestVal.status}\n`;
    report += `**Validation Type:** ${latestVal.validation_type}\n`;
    report += `**Checked:** ${latestVal.created_at}\n\n`;
    
    if (latestVal.findings && latestVal.findings.length > 0) {
      report += `#### Findings\n\n`;
      report += `| Severity | Type | Entity | Expected | Actual |\n`;
      report += `|----------|------|--------|----------|--------|\n`;
      
      latestVal.findings.forEach((f: any) => {
        report += `| ${f.severity} | ${f.type} | ${f.entity} | ${f.expected} | ${f.actual} |\n`;
      });
      report += `\n`;
    }
  });

  return report;
}
