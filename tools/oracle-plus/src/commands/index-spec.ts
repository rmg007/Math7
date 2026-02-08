import { createClient } from '@supabase/supabase-js';
import ora from 'ora';
import fs from 'fs/promises';
import path from 'path';

interface IndexOptions {
  source?: string;
  specId?: string;
  all?: boolean;
}

export async function indexCommand(options: IndexOptions) {
  const spinner = ora('Initializing indexer...').start();

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );

    if (options.specId) {
      // Index single specification
      spinner.text = `Generating embedding for spec ${options.specId}...`;
      
      const { data, error } = await supabase.functions.invoke('index-specification', {
        body: { specId: options.specId }
      });

      if (error) throw error;
      
      spinner.succeed(`✅ Indexed specification (${data.dimensions} dimensions)`);
      
    } else if (options.all) {
      // Re-index all active specifications
      const { data: specs, error } = await supabase
        .from('specifications')
        .select('id, entity_name')
        .is('deleted_at', null);

      if (error) throw error;

      spinner.text = `Indexing ${specs.length} specifications...`;
      
      for (const spec of specs) {
        await supabase.functions.invoke('index-specification', {
          body: { specId: spec.id }
        });
      }

      spinner.succeed(`✅ Indexed ${specs.length} specifications`);
      
    } else if (options.source) {
      // Parse markdown files and create specifications
      spinner.text = `Parsing specification files from ${options.source}...`;
      
      // This would require glob matching and markdown parsing
      // For now, just error out with instructions
      throw new Error('--source indexing not yet implemented. Use --spec-id or --all for existing specs.');
      
    } else {
      throw new Error('Must specify --source, --spec-id, or --all');
    }

  } catch (error) {
    spinner.fail('Indexing failed');
    console.error('Error:', error.message);
    process.exit(1);
  }
}
