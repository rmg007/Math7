import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai@0.1.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TestGenRequest {
  specId: string
  testType: 'unit' | 'integration' | 'e2e'
  framework: 'mocktail' | 'playwright' | 'vitest'
}

const TEST_TEMPLATES = {
  mocktail: `import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

// TODO: Import classes under test

void main() {
  group('{{ENTITY_NAME}} Tests', () {
    {{TEST_CASES}}
  });
}`,

  playwright: `import { test, expect } from '@playwright/test';

test.describe('{{ENTITY_NAME}}', () => {
  {{TEST_CASES}}
});`,

  vitest: `import { describe, it, expect, vi } from 'vitest';

describe('{{ENTITY_NAME}}', () => {
  {{TEST_CASES}}
});`,
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { specId, testType, framework }: TestGenRequest = await req.json()

    // 1. Fetch specification
    const { data: spec, error: specError } = await supabaseClient
      .from('specifications')
      .select('*')
      .eq('id', specId)
      .single()

    if (specError) {
      throw new Error(`Failed to fetch specification: ${specError.message}`)
    }

    // 2. Get template
    const template = TEST_TEMPLATES[framework]

    // 3. Use Gemini to generate test cases
    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') ?? '')
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

    const prompt = `You are a test code generator. Generate test cases for the following specification.

**SPECIFICATION:**
Entity Type: ${spec.entity_type}
Entity Name: ${spec.entity_name}  
Requirements:
${spec.spec_content}

**FRAMEWORK:** ${framework}
**TEST TYPE:** ${testType}

**TASK:**
Generate test cases that validate all requirements in the specification. Return ONLY the test case code blocks (without the describe/group wrapper).

${framework === 'mocktail' ? `
Example format for Mocktail:
test('should do X when Y', () {
  // Arrange
  final mock = MockDependency();
  // Act
  // Assert
});
` : ''}

${framework === 'playwright' ? `
Example format for Playwright:
test('should display X when Y', async ({ page }) => {
  await page.goto('/path');
  await expect(page.getByRole('button')).toBeVisible();
});
` : ''}

${framework === 'vitest' ? `
Example format for Vitest:
it('should return X when Y', () => {
  // Arrange
  const result = functionUnderTest();
  // Assert
  expect(result).toBe(expectedValue);
});
` : ''}

Focus on:
1. Cover all spec requirements
2. Follow best practices for ${framework}
3. Include setup/teardown if needed
4. Add meaningful assertions

Return ONLY the test case code, no explanation.`

    const result = await model.generateContent(prompt)
    const testCases = result.response.text()

    // 4. Generate complete test file
    const testCode = template
      .replace('{{ENTITY_NAME}}', spec.entity_name)
      .replace('{{TEST_CASES}}', testCases)

    const fileName = framework === 'mocktail' 
      ? `${spec.entity_name.toLowerCase().replace(/\s+/g, '_')}_test.dart`
      : framework === 'playwright'
      ? `${spec.entity_name.toLowerCase().replace(/\s+/g, '-')}.spec.ts`
      : `${spec.entity_name.toLowerCase().replace(/\s+/g, '-')}.test.ts`

    return new Response(
      JSON.stringify({
        testCode,
        fileName,
        framework,
        specId,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in generate-test-from-spec:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
