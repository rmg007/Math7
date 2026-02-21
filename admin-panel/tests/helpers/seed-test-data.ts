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

export interface GroupSeedResult {
  groupIds: { class: string; family: string };
  assignmentId: string;
}

export interface AIUsageSeedResult {
  totalTokensSeeded: number;
  rowsInserted: number;
}

/**
 * Clean all E2E test data from database (identified by slug prefix).
 * Deletes in FK-safe order: assignments → group_members → groups →
 * ai_token_usage → questions → skills → domains → apps → subjects
 *
 * @param appId - Optional app_id to scope ai_token_usage cleanup.
 *                If not provided, will be resolved via getTestContext().
 */
export async function cleanTestData(supabase: SupabaseClient<Database>, appId?: string) {
  // Resolve appId for ai_token_usage cleanup if not provided
  let resolvedAppId = appId;
  if (!resolvedAppId) {
    const { data: apps } = await supabase
      .from('apps')
      .select('app_id')
      .eq('subdomain', `${TEST_SLUG_PREFIX}_app`)
      .limit(1)
      .single();
    resolvedAppId = apps?.app_id;
  }

  // --- Group / assignment cleanup first (FK deps on groups) ---
  // Get E2E group IDs for targeted deletes
  const { data: e2eGroups } = await supabase.from('groups').select('id').like('name', 'E2E Test%');

  const e2eGroupIds = (e2eGroups ?? []).map((g) => g.id);

  if (e2eGroupIds.length > 0) {
    await supabase.from('assignments').delete().in('group_id', e2eGroupIds);
    await supabase.from('group_members').delete().in('group_id', e2eGroupIds);
  }
  await supabase.from('groups').delete().like('name', 'E2E Test%');

  // --- AI token usage cleanup ---
  if (resolvedAppId) {
    await supabase
      .from('ai_token_usage')
      .delete()
      .eq('app_id', resolvedAppId)
      .eq('operation', 'generate_questions_e2e');
  }

  // --- Curriculum cleanup (original order) ---
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
      grade_level: 'middle',
      ai_token_limit: 100000,
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
    // --- multiple_choice (existing) ---
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
    // --- text_input (existing) ---
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
    // --- mcq_multi (NEW) ---
    {
      skill_id: '', // Linear Equations
      type: 'mcq_multi',
      content: 'E2E Test: Which of the following are prime numbers?',
      solution: JSON.parse('{"correct_answers": ["2", "3", "5"]}'),
      options: JSON.parse('["1", "2", "3", "4", "5"]'),
      explanation: '2, 3, and 5 are prime. 1 is not prime by definition. 4 is divisible by 2.',
      points: 10,
      sort_order: 3,
      app_id: appId,
    },
    // --- boolean (NEW) ---
    {
      skill_id: '', // Triangle Properties
      type: 'boolean',
      content: 'E2E Test: Is the square root of 144 equal to 12?',
      solution: JSON.parse('{"correct_answer": true}'),
      options: JSON.parse('[]'),
      explanation: '√144 = 12, because 12 × 12 = 144.',
      points: 5,
      sort_order: 2,
      app_id: appId,
    },
    // --- reorder_steps (NEW) ---
    {
      skill_id: '', // Linear Equations
      type: 'reorder_steps',
      content: 'E2E Test: Order these steps to solve 3x = 12.',
      solution: JSON.parse('{"correct_order": [0, 1, 2]}'),
      options: JSON.parse(
        '["Write the equation: 3x = 12", "Divide both sides by 3: x = 12 / 3", "Simplify: x = 4"]'
      ),
      explanation: 'Step 1: state the equation. Step 2: divide by 3. Step 3: simplify.',
      points: 10,
      sort_order: 4,
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
    // multiple_choice × 4
    { ...data.questions[0], skill_id: skillIds['Linear Equations'] },
    { ...data.questions[1], skill_id: skillIds['Linear Equations'] },
    { ...data.questions[2], skill_id: skillIds['Quadratic Equations'] },
    { ...data.questions[3], skill_id: skillIds['Triangle Properties'] },
    // text_input × 1
    { ...data.questions[4], skill_id: skillIds['Circle Measurements'] },
    // mean/median multiple_choice
    { ...data.questions[5], skill_id: skillIds['Mean and Median'] },
    // mcq_multi (index 6)
    { ...data.questions[6], skill_id: skillIds['Linear Equations'] },
    // boolean (index 7)
    { ...data.questions[7], skill_id: skillIds['Triangle Properties'] },
    // reorder_steps (index 8)
    { ...data.questions[8], skill_id: skillIds['Linear Equations'] },
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
 * Seed group data: 1 class group + 1 family group + a member + an assignment.
 *
 * Requires `testmentor@example.com` and `teststudent@example.com` to already
 * exist (created by setup-test-users.js).
 *
 * Returns groupIds and the assignmentId for use in tests.
 */
export async function seedGroupData(supabase: SupabaseClient<Database>): Promise<GroupSeedResult> {
  const { appId } = await getTestContext(supabase);

  // Resolve mentor profile (group owner)
  const { data: mentorProfile, error: mentorError } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', 'testmentor@example.com')
    .single();

  if (mentorError || !mentorProfile) {
    throw new Error(
      `Could not find mentor profile. Run setup-test-users.js first. ${mentorError?.message ?? ''}`
    );
  }

  // Resolve student profile (group member)
  const { data: studentProfile, error: studentError } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', 'teststudent@example.com')
    .single();

  if (studentError || !studentProfile) {
    throw new Error(
      `Could not find student profile. Run setup-test-users.js first. ${studentError?.message ?? ''}`
    );
  }

  // Insert class group
  const { data: classGroup, error: classGroupError } = await supabase
    .from('groups')
    .insert({
      app_id: appId,
      name: 'E2E Test Class Group',
      owner_id: mentorProfile.id,
      join_code: 'E2EGRP1',
      type: 'class',
      requires_approval: false,
      allow_anonymous_join: false,
    })
    .select('id')
    .single();

  if (classGroupError || !classGroup) {
    throw new Error(`Failed to create class group: ${classGroupError?.message ?? 'unknown error'}`);
  }

  // Insert family group
  const { data: familyGroup, error: familyGroupError } = await supabase
    .from('groups')
    .insert({
      app_id: appId,
      name: 'E2E Test Family Group',
      owner_id: mentorProfile.id,
      join_code: 'E2EGRP2',
      type: 'family',
      requires_approval: false,
      allow_anonymous_join: false,
    })
    .select('id')
    .single();

  if (familyGroupError || !familyGroup) {
    throw new Error(
      `Failed to create family group: ${familyGroupError?.message ?? 'unknown error'}`
    );
  }

  // Add student as member of the class group
  // group_members PK is composite (group_id, student_id) — no id column returned
  const { error: memberError } = await supabase.from('group_members').insert({
    group_id: classGroup.id,
    student_id: studentProfile.id,
    role: 'student',
  });

  if (memberError) {
    throw new Error(`Failed to add group member: ${memberError.message}`);
  }

  // Resolve a seeded skill to assign (use first e2e skill found)
  const { data: seededSkill } = await supabase
    .from('skills')
    .select('skill_id')
    .like('slug', `${TEST_SLUG_PREFIX}_%`)
    .limit(1)
    .single();

  if (!seededSkill) {
    throw new Error('No seeded skills found. Run seedTestData() before seedGroupData().');
  }

  // Insert assignment scoped to class group
  const { data: assignment, error: assignmentError } = await supabase
    .from('assignments')
    .insert({
      group_id: classGroup.id,
      type: 'skill_mastery',
      target_id: seededSkill.skill_id,
      scope: 'mandatory',
      status: 'pending',
    })
    .select('id')
    .single();

  if (assignmentError || !assignment) {
    throw new Error(`Failed to create assignment: ${assignmentError?.message ?? 'unknown error'}`);
  }

  return {
    groupIds: { class: classGroup.id, family: familyGroup.id },
    assignmentId: assignment.id,
  };
}

/**
 * Seed AI token usage rows summing to ~95% of the test app's token limit.
 * Used for edge-case testing (near-quota behaviour).
 *
 * All rows use operation = 'generate_questions_e2e' so cleanTestData()
 * can identify and delete them precisely.
 */
export async function seedAIUsage(supabase: SupabaseClient<Database>): Promise<AIUsageSeedResult> {
  const { appId } = await getTestContext(supabase);

  // Fetch the app's token limit
  const { data: app, error: appError } = await supabase
    .from('apps')
    .select('ai_token_limit')
    .eq('app_id', appId)
    .single();

  if (appError) {
    throw new Error(`Failed to fetch app token limit: ${appError.message}`);
  }

  const tokenLimit = app?.ai_token_limit ?? 100000;
  const target = Math.floor(tokenLimit * 0.95);

  // Seed in chunks of 5000 tokens to keep row count manageable
  const chunkSize = 5000;
  let totalSeeded = 0;
  let rowsInserted = 0;

  while (totalSeeded < target) {
    const tokensForThisRow = Math.min(chunkSize, target - totalSeeded);

    const { error } = await supabase.from('ai_token_usage').insert({
      app_id: appId,
      operation: 'generate_questions_e2e',
      tokens_used: tokensForThisRow,
      user_id: null,
    });

    if (error) {
      throw new Error(`Failed to insert ai_token_usage row: ${error.message}`);
    }

    totalSeeded += tokensForThisRow;
    rowsInserted++;
  }

  console.log(
    `Seeded ${rowsInserted} ai_token_usage rows — ${totalSeeded} / ${tokenLimit} tokens (${Math.round((totalSeeded / tokenLimit) * 100)}%)`
  );

  return { totalTokensSeeded: totalSeeded, rowsInserted };
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
    student: {
      email: process.env.TEST_STUDENT_EMAIL || 'teststudent@example.com',
      password: process.env.TEST_STUDENT_PASSWORD || 'teststudent@example.com',
    },
  };
}
