import Papa from 'papaparse';

/**
 * CSV Template for Bulk Import
 * Provides a well-formatted example for users based on Zod schema requirements.
 */
export const BULK_IMPORT_TEMPLATE = [
  {
    content: 'What is 2 + 2?',
    type: 'multiple_choice',
    points: 1,
    explanation: 'Basic addition.',
    hint_text: 'Try counting on your fingers.',
    rule_text: 'Addition of integers.',
    eli10_text: 'When you have two apples and get two more, you have four.',
    options: JSON.stringify([
      { text: '3', is_correct: false },
      { text: '4', is_correct: true },
      { text: '5', is_correct: false },
    ]),
    solution: JSON.stringify({ text: '4' }),
  },
  {
    content: 'Which of these are prime numbers?',
    type: 'mcq_multi',
    points: 2,
    explanation: '2 and 3 are prime.',
    hint_text: 'Prime numbers only have two factors.',
    rule_text: 'Prime number definition.',
    eli10_text: "Primes are special numbers that can't be split into equal smaller groups.",
    options: JSON.stringify([
      { text: '2', is_correct: true },
      { text: '3', is_correct: true },
      { text: '4', is_correct: false },
    ]),
    solution: JSON.stringify(['2', '3']),
  },
  {
    content: 'The Earth is flat.',
    type: 'boolean',
    points: 1,
    explanation: 'The Earth is a sphere.',
    hint_text: 'Think about photos from space.',
    rule_text: 'Planetary physics.',
    eli10_text: 'The world is actually a big ball, even if it looks flat on the ground.',
    options: 'null',
    solution: 'false',
  },
  {
    content: 'Capital of France?',
    type: 'text_input',
    points: 1,
    explanation: 'Paris is the capital.',
    hint_text: 'City of lights.',
    rule_text: 'World Geography.',
    eli10_text: 'Paris is the most famous city in France.',
    options: 'null',
    solution: 'Paris',
  },
];

/**
 * Triggers a download of the bulk import CSV template
 */
export const downloadBulkImportTemplate = () => {
  const csv = Papa.unparse(BULK_IMPORT_TEMPLATE);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', 'questerix_bulk_import_template.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
