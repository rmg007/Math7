/**
 * Test Data Seeding Helpers for E2E Tests
 * Provides comprehensive seed data for admin panel testing
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../../src/lib/database.types';

type Tables = Database['public']['Tables'];

/**
 * Seed data interface
 */
export interface SeedData {
  domains: Tables['domains']['Insert'][];
  skills: Tables['skills']['Insert'][];
  questions: Tables['questions']['Insert'][];
}

/**
 * Clean all test data from database
 * WARNING: Only use in test environment
 */
export async function cleanTestData(supabase: SupabaseClient<Database>) {
  // Delete in correct order to respect foreign key constraints
  await supabase.from('attempts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('questions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('skills').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('domains').delete().neq('id', '00000000-0000-0000-0000-000000000000');
}

/**
 * Generate test data
 */
export function generateTestData(): SeedData {
  const domains: Tables['domains']['Insert'][] = [
    {
      name: 'Test Algebra',
      description: 'Algebraic concepts and operations for testing',
      order_index: 1,
      icon_url: 'https://example.com/algebra.png',
    },
    {
      name: 'Test Geometry',
      description: 'Shapes, angles, and spatial relationships for testing',
      order_index: 2,
      icon_url: 'https://example.com/geometry.png',
    },
    {
      name: 'Test Statistics',
      description: 'Data analysis and probability for testing',
      order_index: 3,
      icon_url: 'https://example.com/statistics.png',
    },
  ];

  const skills: Tables['skills']['Insert'][] = [
    {
      domain_id: '', // Will be set after domain insertion
      name: 'Linear Equations',
      description: 'Solving equations of the form ax + b = c',
      order_index: 1,
      mastery_threshold: 80,
    },
    {
      domain_id: '', // Will be set after domain insertion
      name: 'Quadratic Equations',
      description: 'Solving equations of the form ax² + bx + c = 0',
      order_index: 2,
      mastery_threshold: 80,
    },
    {
      domain_id: '', // Will be set after domain insertion (Geometry)
      name: 'Triangle Properties',
      description: 'Understanding angles and sides of triangles',
      order_index: 1,
      mastery_threshold: 75,
    },
    {
      domain_id: '', // Will be set after domain insertion (Geometry)
      name: 'Circle Measurements',
      description: 'Calculating circumference, area, and arc length',
      order_index: 2,
      mastery_threshold: 75,
    },
    {
      domain_id: '', // Will be set after domain insertion (Statistics)
      name: 'Mean and Median',
      description: 'Calculating measures of central tendency',
      order_index: 1,
      mastery_threshold: 70,
    },
  ];

  const questions: Tables['questions']['Insert'][] = [
    {
      skill_id: '', // Will be set after skill insertion
      question_type: 'multiple_choice',
      question_text: 'Solve for x: 2x + 5 = 15',
      correct_answer: '5',
      options: JSON.stringify(['3', '5', '7', '10']),
      explanation: 'Subtract 5 from both sides: 2x = 10. Divide by 2: x = 5',
      difficulty: 2,
      points: 10,
      time_limit: 60,
      order_index: 1,
    },
    {
      skill_id: '', // Same skill as above
      question_type: 'multiple_choice',
      question_text: 'Solve for x: 3x - 7 = 11',
      correct_answer: '6',
      options: JSON.stringify(['4', '6', '8', '18']),
      explanation: 'Add 7 to both sides: 3x = 18. Divide by 3: x = 6',
      difficulty: 2,
      points: 10,
      time_limit: 60,
      order_index: 2,
    },
    {
      skill_id: '', // Quadratic skill
      question_type: 'multiple_choice',
      question_text: 'What are the solutions to x² - 5x + 6 = 0?',
      correct_answer: 'x = 2 or x = 3',
      options: JSON.stringify(['x = 1 or x = 6', 'x = 2 or x = 3', 'x = -2 or x = -3', 'No real solutions']),
      explanation: 'Factor: (x - 2)(x - 3) = 0. Solutions: x = 2 or x = 3',
      difficulty: 3,
      points: 15,
      time_limit: 90,
      order_index: 1,
    },
    {
      skill_id: '', // Triangle skill
      question_type: 'multiple_choice',
      question_text: 'What is the sum of interior angles in a triangle?',
      correct_answer: '180°',
      options: JSON.stringify(['90°', '180°', '270°', '360°']),
      explanation: 'The sum of interior angles in any triangle is always 180°',
      difficulty: 1,
      points: 5,
      time_limit: 30,
      order_index: 1,
    },
    {
      skill_id: '', // Circle skill
      question_type: 'text_input',
      question_text: 'What is the circumference of a circle with radius 5 cm? (Use π ≈ 3.14)',
      correct_answer: '31.4',
      explanation: 'C = 2πr = 2 × 3.14 × 5 = 31.4 cm',
      difficulty: 2,
      points: 10,
      time_limit: 60,
      order_index: 1,
    },
    {
      skill_id: '', // Mean and Median skill
      question_type: 'multiple_choice',
      question_text: 'What is the mean of: 4, 8, 6, 5, 3, 7?',
      correct_answer: '5.5',
      options: JSON.stringify(['5', '5.5', '6', '6.5']),
      explanation: 'Sum: 4+8+6+5+3+7 = 33. Mean: 33÷6 = 5.5',
      difficulty: 2,
      points: 10,
      time_limit: 60,
      order_index: 1,
    },
  ];

  return { domains, skills, questions };
}

/**
 * Seed test data into database
 * Returns IDs of created records for reference
 */
export async function seedTestData(
  supabase: SupabaseClient<Database>
): Promise<{
  domainIds: Record<string, string>;
  skillIds: Record<string, string>;
  questionIds: string[];
}> {
  const data = generateTestData();
  const domainIds: Record<string, string> = {};
  const skillIds: Record<string, string> = {};
  const questionIds: string[] = [];

  // Insert domains
  for (const domain of data.domains) {
    const { data: insertedDomain, error } = await supabase
      .from('domains')
      .insert(domain)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to insert domain: ${error.message}`);
    }

    domainIds[domain.name as string] = insertedDomain.id;
  }

  // Insert skills (link to domains)
  const skillsWithDomains = [
    { ...data.skills[0], domain_id: domainIds['Test Algebra'] },
    { ...data.skills[1], domain_id: domainIds['Test Algebra'] },
    { ...data.skills[2], domain_id: domainIds['Test Geometry'] },
    { ...data.skills[3], domain_id: domainIds['Test Geometry'] },
    { ...data.skills[4], domain_id: domainIds['Test Statistics'] },
  ];

  for (const skill of skillsWithDomains) {
    const { data: insertedSkill, error } = await supabase
      .from('skills')
      .insert(skill)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to insert skill: ${error.message}`);
    }

    skillIds[skill.name as string] = insertedSkill.id;
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
    const { data: insertedQuestion, error } = await supabase
      .from('questions')
      .insert(question)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to insert question: ${error.message}`);
    }

    questionIds.push(insertedQuestion.id);
  }

  return { domainIds, skillIds, questionIds };
}

/**
 * Verify seed data exists
 */
export async function verifySeedData(supabase: SupabaseClient<Database>): Promise<boolean> {
  const { data: domains } = await supabase.from('domains').select('id').limit(1);
  const { data: skills } = await supabase.from('skills').select('id').limit(1);
  const { data: questions } = await supabase.from('questions').select('id').limit(1);

  return Boolean(domains && domains.length > 0 && skills && skills.length > 0 && questions && questions.length > 0);
}

/**
 * Get test user credentials from environment
 */
export function getTestUser() {
  return {
    admin: {
      email: process.env.TEST_ADMIN_EMAIL || '',
      password: process.env.TEST_ADMIN_PASSWORD || '',
    },
    superAdmin: {
      email: process.env.TEST_SUPER_ADMIN_EMAIL || '',
      password: process.env.TEST_SUPER_ADMIN_PASSWORD || '',
    },
  };
}
