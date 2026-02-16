/**
 * Test Data Seeding Helpers for E2E Tests
 *
 * Aligned with the ACTUAL Supabase schema (database.types.ts).
 * All column names here match the physical DB exactly.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../../src/lib/database.types';

type Tables = Database['public']['Tables'];

// Test data uses an existing app_id from the production seed.
// This is resolved dynamically at runtime via getOrCreateTestApp().
const TEST_SLUG_PREFIX = 'e2e_test';

export interface SeedData {
  domains: Tables['domains']['Insert'][];
  skills: Tables['skills']['Insert'][];
  questions: Tables['questions']['Insert'][];
}

/**
 * Clean all E2E test data from database (identified by slug prefix)
 */
export async function cleanTestData(supabase: SupabaseClient<Database>) {
  // Delete in FK order: questions → skills → domains → apps → subjects
  await supabase.from('questions').delete().like('content', '%E2E Test%');
  await supabase.from('skills').delete().like('slug', `${TEST_SLUG_PREFIX}_%`);
  await supabase.from('domains').delete().like('slug', `${TEST_SLUG_PREFIX}_%`);
  // Clean up auto-created test apps and subjects
  await supabase.from('apps').delete().eq('subdomain', `${TEST_SLUG_PREFIX}_app`);
  await supabase.from('subjects').delete().like('slug', `${TEST_SLUG_PREFIX}_%`);
}

/**
 * Resolve (or auto-create) an app_id and subject_id for test data.
 * Falls back to creating a test app if the database is empty.
 */
async function getTestContext(supabase: SupabaseClient<Database>) {
  // Try to find an existing app
  const { data: apps } = await supabase.from('apps').select('app_id, subject_id').limit(1).single();

  if (apps) {
    return { appId: apps.app_id, subjectId: apps.subject_id ?? undefined };
  }

  // No app found — auto-create a test app so E2E tests can run
  console.warn('No apps found. Auto-creating a test app for E2E tests...');

  // First ensure we have a subject
  const { data: existingSubject } = await supabase
    .from('subjects')
    .select('subject_id')
    .limit(1)
    .single();

  let subjectId: string | undefined;

  if (!existingSubject) {
    const { data: newSubject, error: subjectError } = await supabase
      .from('subjects')
      .insert({
        title: 'E2E Test Mathematics',
        slug: `${TEST_SLUG_PREFIX}_math_subject`,
        description: 'Auto-created subject for E2E tests',
      })
      .select('subject_id')
      .single();

    if (subjectError) {
      throw new Error(`Failed to auto-create test subject: ${subjectError.message}`);
    }
    subjectId = newSubject.subject_id;
  } else {
    subjectId = existingSubject.subject_id;
  }

  const { data: newApp, error: appError } = await supabase
    .from('apps')
    .insert({
      display_name: 'E2E Test App',
      subdomain: `${TEST_SLUG_PREFIX}_app`,
      subject_id: subjectId,
      is_active: true,
    })
    .select('app_id, subject_id')
    .single();

  if (appError) {
    throw new Error(`Failed to auto-create test app: ${appError.message}`);
  }

  console.log(`Created test app: ${newApp.app_id}`);
  return { appId: newApp.app_id, subjectId: newApp.subject_id ?? undefined };
}

/**
 * Generate test data aligned to the current schema
 */
export function generateTestData(appId: string): SeedData {
  const domains: Tables['domains']['Insert'][] = [
    {
      title: 'E2E Test Algebra',
      slug: `${TEST_SLUG_PREFIX}_algebra`,
      description: 'Algebraic concepts for E2E testing',
      sort_order: 900,
      app_id: appId,
    },
    {
      title: 'E2E Test Geometry',
      slug: `${TEST_SLUG_PREFIX}_geometry`,
      description: 'Shapes and spatial relationships for E2E testing',
      sort_order: 901,
      app_id: appId,
    },
    {
      title: 'E2E Test Statistics',
      slug: `${TEST_SLUG_PREFIX}_statistics`,
      description: 'Data analysis for E2E testing',
      sort_order: 902,
      app_id: appId,
    },
  ];

  const skills: Tables['skills']['Insert'][] = [
    {
      domain_id: '', // set after domain insertion
      title: 'Linear Equations',
      slug: `${TEST_SLUG_PREFIX}_linear_equations`,
      description: 'Solving equations of the form ax + b = c',
      sort_order: 1,
      app_id: appId,
    },
    {
      domain_id: '',
      title: 'Quadratic Equations',
      slug: `${TEST_SLUG_PREFIX}_quadratic_equations`,
      description: 'Solving equations of the form ax² + bx + c = 0',
      sort_order: 2,
      app_id: appId,
    },
    {
      domain_id: '', // Geometry
      title: 'Triangle Properties',
      slug: `${TEST_SLUG_PREFIX}_triangle_properties`,
      description: 'Understanding angles and sides of triangles',
      sort_order: 1,
      app_id: appId,
    },
    {
      domain_id: '', // Geometry
      title: 'Circle Measurements',
      slug: `${TEST_SLUG_PREFIX}_circle_measurements`,
      description: 'Calculating circumference, area, and arc length',
      sort_order: 2,
      app_id: appId,
    },
    {
      domain_id: '', // Statistics
      title: 'Mean and Median',
      slug: `${TEST_SLUG_PREFIX}_mean_median`,
      description: 'Calculating measures of central tendency',
      sort_order: 1,
      app_id: appId,
    },
  ];

  const questions: Tables['questions']['Insert'][] = [
    {
      skill_id: '', // set after skill insertion
      type: 'multiple_choice',
      content: 'E2E Test: Solve for x: 2x + 5 = 15',
      solution: JSON.parse('{"correct_answer": "5"}'),
      options: JSON.parse('["3", "5", "7", "10"]'),
      explanation: 'Subtract 5 from both sides: 2x = 10. Divide by 2: x = 5',
      points: 10,
      sort_order: 1,
      app_id: appId,
    },
    {
      skill_id: '', // same skill
      type: 'multiple_choice',
      content: 'E2E Test: Solve for x: 3x - 7 = 11',
      solution: JSON.parse('{"correct_answer": "6"}'),
      options: JSON.parse('["4", "6", "8", "18"]'),
      explanation: 'Add 7 to both sides: 3x = 18. Divide by 3: x = 6',
      points: 10,
      sort_order: 2,
      app_id: appId,
    },
    {
      skill_id: '', // Quadratic
      type: 'multiple_choice',
      content: 'E2E Test: What are the solutions to x² - 5x + 6 = 0?',
      solution: JSON.parse('{"correct_answer": "x = 2 or x = 3"}'),
      options: JSON.parse(
        '["x = 1 or x = 6", "x = 2 or x = 3", "x = -2 or x = -3", "No real solutions"]'
      ),
      explanation: 'Factor: (x - 2)(x - 3) = 0. Solutions: x = 2 or x = 3',
      points: 15,
      sort_order: 1,
      app_id: appId,
    },
    {
      skill_id: '', // Triangle
      type: 'multiple_choice',
      content: 'E2E Test: What is the sum of interior angles in a triangle?',
      solution: JSON.parse('{"correct_answer": "180°"}'),
      options: JSON.parse('["90°", "180°", "270°", "360°"]'),
      explanation: 'The sum of interior angles in any triangle is always 180°',
      points: 5,
      sort_order: 1,
      app_id: appId,
    },
    {
      skill_id: '', // Circle
      type: 'text_input',
      content: 'E2E Test: What is the circumference of a circle with radius 5 cm? (Use π ≈ 3.14)',
      solution: JSON.parse('{"correct_answer": "31.4"}'),
      options: JSON.parse('[]'),
      explanation: 'C = 2πr = 2 × 3.14 × 5 = 31.4 cm',
      points: 10,
      sort_order: 1,
      app_id: appId,
    },
    {
      skill_id: '', // Mean and Median
      type: 'multiple_choice',
      content: 'E2E Test: What is the mean of: 4, 8, 6, 5, 3, 7?',
      solution: JSON.parse('{"correct_answer": "5.5"}'),
      options: JSON.parse('["5", "5.5", "6", "6.5"]'),
      explanation: 'Sum: 4+8+6+5+3+7 = 33. Mean: 33÷6 = 5.5',
      points: 10,
      sort_order: 1,
      app_id: appId,
    },
  ];

  return { domains, skills, questions };
}

/**
 * Seed test data into database.
 * Returns IDs of created records for reference in tests.
 */
export async function seedTestData(supabase: SupabaseClient<Database>): Promise<{
  domainIds: Record<string, string>;
  skillIds: Record<string, string>;
  questionIds: string[];
}> {
  const { appId } = await getTestContext(supabase);
  const data = generateTestData(appId);
  const domainIds: Record<string, string> = {};
  const skillIds: Record<string, string> = {};
  const questionIds: string[] = [];

  // Insert domains
  for (const domain of data.domains) {
    const { data: inserted, error } = await supabase
      .from('domains')
      .insert(domain)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to insert domain "${domain.title}": ${error.message}`);
    }

    domainIds[domain.title] = inserted.domain_id;
  }

  // Insert skills (link to domains)
  const skillsWithDomains = [
    { ...data.skills[0], domain_id: domainIds['E2E Test Algebra'] },
    { ...data.skills[1], domain_id: domainIds['E2E Test Algebra'] },
    { ...data.skills[2], domain_id: domainIds['E2E Test Geometry'] },
    { ...data.skills[3], domain_id: domainIds['E2E Test Geometry'] },
    { ...data.skills[4], domain_id: domainIds['E2E Test Statistics'] },
  ];

  for (const skill of skillsWithDomains) {
    const { data: inserted, error } = await supabase.from('skills').insert(skill).select().single();

    if (error) {
      throw new Error(`Failed to insert skill "${skill.title}": ${error.message}`);
    }

    skillIds[skill.title] = inserted.skill_id;
  }

  // Insert questions (link to skills)
  const questionsWithSkills = [
    { ...data.questions[0], skill_id: skillIds['Linear Equations'] },
    { ...data.questions[1], skill_id: skillIds['Linear Equations'] },
    { ...data.questions[2], skill_id: skillIds['Quadratic Equations'] },
    { ...data.questions[3], skill_id: skillIds['Triangle Properties'] },
    { ...data.questions[4], skill_id: skillIds['Circle Measurements'] },
    { ...data.questions[5], skill_id: skillIds['Mean and Median'] },
  ];

  for (const question of questionsWithSkills) {
    const { data: inserted, error } = await supabase
      .from('questions')
      .insert(question)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to insert question: ${error.message}`);
    }

    questionIds.push(inserted.question_id);
  }

  return { domainIds, skillIds, questionIds };
}

/**
 * Verify seed data exists
 */
export async function verifySeedData(supabase: SupabaseClient<Database>): Promise<boolean> {
  const { data: domains } = await supabase
    .from('domains')
    .select('domain_id')
    .like('slug', `${TEST_SLUG_PREFIX}_%`)
    .limit(1);
  const { data: skills } = await supabase
    .from('skills')
    .select('skill_id')
    .like('slug', `${TEST_SLUG_PREFIX}_%`)
    .limit(1);
  const { data: questions } = await supabase
    .from('questions')
    .select('question_id')
    .like('content', '%E2E Test%')
    .limit(1);

  return Boolean(
    domains &&
    domains.length > 0 &&
    skills &&
    skills.length > 0 &&
    questions &&
    questions.length > 0
  );
}

/**
 * Get test user credentials from environment
 */
export function getTestUser() {
  return {
    superAdmin: {
      email: process.env.TEST_SUPER_ADMIN_EMAIL || 'mhalim80@hotmail.com',
      password: process.env.TEST_SUPER_ADMIN_PASSWORD || 'mhalim80@hotmail.com',
    },
    admin: {
      email: process.env.TEST_ADMIN_EMAIL || 'testadmin@example.com',
      password: process.env.TEST_ADMIN_PASSWORD || 'testadmin@example.com',
    },
    mentor: {
      email: process.env.TEST_MENTOR_EMAIL || 'testmentor@example.com',
      password: process.env.TEST_MENTOR_PASSWORD || 'testmentor@example.com',
    },
  };
}
