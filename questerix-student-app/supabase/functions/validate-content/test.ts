/**
 * Tests for validate-content edge function
 * Tests authentication, authorization, validation logic, AI integration, and error handling
 */

import { assertArrayIncludes, assertEquals, assertExists, assertStringIncludes } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { validateContentHandler } from "./index.ts";

// Mock environment variables
const originalEnv = Deno.env.toObject();

function setupMockEnv() {
  Deno.env.set("SUPABASE_URL", "https://test.supabase.co");
  Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "test-service-key");
  Deno.env.set("GEMINI_API_KEY", "test-gemini-key");
}

function restoreEnv() {
  Deno.env.clear();
  Object.entries(originalEnv).forEach(([key, value]) => {
    Deno.env.set(key, value);
  });
}

// Mock Supabase client (reused from generate-questions tests)
class MockSupabaseClient {
  constructor() {}
  
  auth = {
    getUser: (token: string) => {
      if (token === "valid-token") {
        return Promise.resolve({
          data: { user: { id: "user-123", email: "admin@test.com" } },
          error: null
        });
      } else if (token === "invalid-token") {
        return Promise.resolve({
          data: { user: null },
          error: { message: "Invalid token" }
        });
      }
      return Promise.resolve({
        data: { user: null },
        error: { message: "Token expired" }
      });
    }
  };
  
  from = (table: string) => ({
    select: (columns: string) => ({
      eq: (column: string, value: string) => ({
        single: () => {
          if (table === "profiles" && value === "user-123") {
            return Promise.resolve({
              data: { app_id: "app-456", is_admin: true },
              error: null
            });
          } else if (table === "profiles" && value === "user-789") {
            return Promise.resolve({
              data: { app_id: "app-456", is_admin: false },
              error: null
            });
          }
          return Promise.resolve({
            data: null,
            error: { message: "Profile not found" }
          });
        }
      })
    })
  });
  
  rpc = (fn: string, params: any) => {
    if (fn === "consume_tenant_tokens") {
      return Promise.resolve({ error: null });
    }
    return Promise.resolve({ error: { message: "Unknown RPC" } });
  };
}

// Mock Gemini AI for validation
class MockGenerativeAI {
  constructor(apiKey: string) {}
  
  getGenerativeModel(config: any) {
    return new MockValidationModel(config);
  }
}

class MockValidationModel {
  constructor(private config: any) {}
  
  async generateContent(prompt: string) {
    // Simulate different validation scenarios
    if (prompt.includes("validation-error")) {
      throw new Error("AI validation service unavailable");
    }
    
    if (prompt.includes("invalid-validation-json")) {
      return {
        response: {
          text: () => "This is not valid JSON validation report",
          usageMetadata: {
            totalTokenCount: 80,
            promptTokenCount: 40,
            candidatesTokenCount: 40
          }
        }
      };
    }
    
    // Determine validation result based on prompt content
    if (prompt.includes("perfect-questions")) {
      return {
        response: {
          text: () => JSON.stringify({
            overall_score: 0.95,
            status: "approved",
            consensus_reached: true,
            findings: [
              {
                question_id: 0,
                score: 0.95,
                issues: [],
                suggestions: "Question is well-formed and accurate"
              }
            ],
            summary: "All questions passed validation with high scores"
          }),
          usageMetadata: {
            totalTokenCount: 120,
            promptTokenCount: 60,
            candidatesTokenCount: 60
          }
        }
      };
    }
    
    if (prompt.includes("problematic-questions")) {
      return {
        response: {
          text: () => JSON.stringify({
            overall_score: 0.45,
            status: "flagged",
            consensus_reached: false,
            findings: [
              {
                question_id: 0,
                score: 0.3,
                issues: ["Question contains sensitive content", "Not based on source material"],
                suggestions: "Rewrite question to focus on factual content from source"
              },
              {
                question_id: 1,
                score: 0.6,
                issues: ["Difficulty level mismatch"],
                suggestions: "Consider reclassifying as medium difficulty"
              }
            ],
            summary: "Several issues found that need attention before approval"
          }),
          usageMetadata: {
            totalTokenCount: 150,
            promptTokenCount: 75,
            candidatesTokenCount: 75
          }
        }
      };
    }
    
    // Default successful validation
    return {
      response: {
        text: () => JSON.stringify({
          overall_score: 0.85,
          status: "approved",
          consensus_reached: true,
          findings: [
            {
              question_id: 0,
              score: 0.85,
              issues: ["Minor formatting issue"],
              suggestions: "Consider adding more context to the explanation"
            }
          ],
          summary: "Questions are generally good with minor improvements suggested"
        }),
        usageMetadata: {
          totalTokenCount: 100,
          promptTokenCount: 50,
          candidatesTokenCount: 50
        }
      }
    };
  }
}

Deno.test("validate-content - CORS preflight", async () => {
  const request = new Request("http://localhost:9000/functions/v1/validate-content", {
    method: "OPTIONS"
  });
  
  const response = await validateContentHandler(request, { 
    supabase: new MockSupabaseClient(), 
    genAI: new MockGenerativeAI("test-key") 
  });
  
  assertEquals(response.status, 200);
  assertEquals(response.headers.get("Access-Control-Allow-Origin"), "*");
});

Deno.test("validate-content - missing authorization header", async () => {
  const request = new Request("http://localhost:9000/functions/v1/validate-content", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      questions: [{ text: "Test question" }],
      source_text: "Test source"
    })
  });
  
  const response = await validateContentHandler(request, { 
    supabase: new MockSupabaseClient(), 
    genAI: new MockGenerativeAI("test-key") 
  });
  
  assertEquals(response.status, 401);
  const error = await response.json();
  assertEquals(error.error, "Missing authorization header");
});

Deno.test("validate-content - invalid token", async () => {
  const request = new Request("http://localhost:9000/functions/v1/validate-content", {
    method: "POST",
    headers: {
      "Authorization": "Bearer invalid-token",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      questions: [{ text: "Test question" }],
      source_text: "Test source"
    })
  });
  
  const response = await validateContentHandler(request, { 
    supabase: new MockSupabaseClient(), 
    genAI: new MockGenerativeAI("test-key") 
  });
  
  assertEquals(response.status, 401);
  const error = await response.json();
  assertEquals(error.error, "Invalid or expired token");
});

Deno.test("validate-content - non-admin user", async () => {
  const request = new Request("http://localhost:9000/functions/v1/validate-content", {
    method: "POST",
    headers: {
      "Authorization": "Bearer non-admin-token",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      questions: [{ text: "Test question" }],
      source_text: "Test source"
    })
  });
  
  const response = await validateContentHandler(request, { 
    supabase: new MockSupabaseClient(), 
    genAI: new MockGenerativeAI("test-key") 
  });
  assertEquals(response.status, 403);
  const error = await response.json();
  assertEquals(error.error, "Only administrators can validate content");
});

Deno.test("validate-content - missing questions array", async () => {
  const request = new Request("http://localhost:9000/functions/v1/validate-content", {
    method: "POST",
    headers: {
      "Authorization": "Bearer valid-token",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      source_text: "Test source"
    })
  });
  
  const response = await validateContentHandler(request, { 
    supabase: new MockSupabaseClient(), 
    genAI: new MockGenerativeAI("test-key") 
  });
  assertEquals(response.status, 500);
  const error = await response.json();
  assertStringIncludes(error.error, "Questions array is required");
});

Deno.test("validate-content - invalid questions format", async () => {
  const request = new Request("http://localhost:9000/functions/v1/validate-content", {
    method: "POST",
    headers: {
      "Authorization": "Bearer valid-token",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      questions: "not an array",
      source_text: "Test source"
    })
  });
  
  const response = await validateContentHandler(request, { 
    supabase: new MockSupabaseClient(), 
    genAI: new MockGenerativeAI("test-key") 
  });
  assertEquals(response.status, 500);
  const error = await response.json();
  assertStringIncludes(error.error, "Questions array is required");
});

Deno.test("validate-content - successful validation", async () => {
  const questions = [
    {
      text: "What is the capital of France?",
      question_type: "mcq",
      difficulty: "easy",
      metadata: {
        options: ["London", "Paris", "Berlin", "Madrid"],
        correct_answer: "Paris",
        explanation: "Paris is the capital of France."
      }
    }
  ];
  
  const request = new Request("http://localhost:9000/functions/v1/validate-content", {
    method: "POST",
    headers: {
      "Authorization": "Bearer valid-token",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      questions: questions,
      source_text: "France is a country in Europe. Its capital city is Paris, which is famous for the Eiffel Tower."
    })
  });
  
  const response = await validateContentHandler(request, { 
    supabase: new MockSupabaseClient(), 
    genAI: new MockGenerativeAI("test-key") 
  });
  assertEquals(response.status, 200);
  const result = await response.json();
  
  // Check response structure
  assertExists(result.overall_score);
  assertExists(result.status);
  assertExists(result.consensus_reached);
  assertExists(result.findings);
  assertExists(result.summary);
  assertExists(result.metadata);
  
  // Check metadata
  assertEquals(result.metadata.model, "gemini-1.5-pro");
  assertExists(result.metadata.validation_time_ms);
  assertExists(result.metadata.token_count);
  
  // Check findings structure
  assertEquals(Array.isArray(result.findings), true);
  if (result.findings.length > 0) {
    const finding = result.findings[0];
    assertExists(finding.question_id);
    assertExists(finding.score);
    assertExists(finding.issues);
    assertExists(finding.suggestions);
    assertEquals(Array.isArray(finding.issues), true);
  }
});

Deno.test("validate-content - perfect questions validation", async () => {
  const questions = [
    {
      text: "What is 2 + 2?",
      question_type: "mcq",
      difficulty: "easy",
      metadata: {
        options: ["3", "4", "5", "6"],
        correct_answer: "4",
        explanation: "2 + 2 equals 4."
      }
    }
  ];
  
  const request = new Request("http://localhost:9000/functions/v1/validate-content", {
    method: "POST",
    headers: {
      "Authorization": "Bearer valid-token",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      questions: questions,
      source_text: "perfect-questions Basic arithmetic: 2 + 2 = 4"
    })
  });
  
  const response = await validateContentHandler(request, { 
    supabase: new MockSupabaseClient(), 
    genAI: new MockGenerativeAI("test-key") 
  });
  assertEquals(response.status, 200);
  const result = await response.json();
  
  assertEquals(result.status, "approved");
  assertEquals(result.consensus_reached, true);
  assertEquals(result.overall_score, 0.95);
  if (result.findings.length > 0) {
    assertEquals(result.findings[0].issues.length, 0);
  }
});

Deno.test("validate-content - problematic questions validation", async () => {
  const questions = [
    {
      text: "What is your personal opinion on politics?",
      question_type: "text_input",
      difficulty: "easy",
      metadata: {
        correct_answer: "Subjective answer",
        explanation: "Personal views vary"
      }
    }
  ];
  
  const request = new Request("http://localhost:9000/functions/v1/validate-content", {
    method: "POST",
    headers: {
      "Authorization": "Bearer valid-token",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      questions: questions,
      source_text: "problematic-questions Educational content about mathematics"
    })
  });
  
  const response = await validateContentHandler(request, { 
    supabase: new MockSupabaseClient(), 
    genAI: new MockGenerativeAI("test-key") 
  });
  assertEquals(response.status, 200);
  const result = await response.json();
  
  assertEquals(result.status, "flagged");
  assertEquals(result.consensus_reached, false);
  assertEquals(result.overall_score, 0.45);
  assertArrayIncludes(result.findings[0].issues, ["Question contains sensitive content"]);
});

Deno.test("validate-content - with custom validation rules", async () => {
  const questions = [
    {
      text: "Test question",
      question_type: "mcq",
      difficulty: "medium",
      metadata: {
        options: ["A", "B", "C", "D"],
        correct_answer: "A",
        explanation: "Test explanation"
      }
    }
  ];
  
  const customRules = [
    {
      name: "Minimum Options",
      rule_type: "mcq_options_count",
      params: { min_options: 4 }
    },
    {
      name: "Explanation Required",
      rule_type: "has_explanation",
      params: {}
    }
  ];
  
  const request = new Request("http://localhost:9000/functions/v1/validate-content", {
    method: "POST",
    headers: {
      "Authorization": "Bearer valid-token",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      questions: questions,
      source_text: "Test content",
      rules: customRules
    })
  });
  
  const response = await validateContentHandler(request, { 
    supabase: new MockSupabaseClient(), 
    genAI: new MockGenerativeAI("test-key") 
  });
  assertEquals(response.status, 200);
  const result = await response.json();
  
  assertExists(result.findings);
});

Deno.test("validate-content - multiple questions validation", async () => {
  const questions = [
    {
      text: "Question 1",
      question_type: "mcq",
      difficulty: "easy",
      metadata: {
        options: ["A", "B", "C", "D"],
        correct_answer: "A",
        explanation: "Explanation 1"
      }
    },
    {
      text: "Question 2",
      question_type: "text_input",
      difficulty: "medium",
      metadata: {
        correct_answer: "Answer 2",
        explanation: "Explanation 2"
      }
    },
    {
      text: "Question 3",
      question_type: "boolean",
      difficulty: "hard",
      metadata: {
        correct_answer: "true",
        explanation: "Explanation 3"
      }
    }
  ];
  
  const request = new Request("http://localhost:9000/functions/v1/validate-content", {
    method: "POST",
    headers: {
      "Authorization": "Bearer valid-token",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      questions: questions,
      source_text: "Test content for multiple questions"
    })
  });
  
  const response = await validateContentHandler(request, { 
    supabase: new MockSupabaseClient(), 
    genAI: new MockGenerativeAI("test-key") 
  });
  assertEquals(response.status, 200);
  const result = await response.json();
  
  // Should have findings for each question
  assertEquals(result.findings.length, 3);
  result.findings.forEach((finding: any, index: number) => {
    assertEquals(finding.question_id, index);
    assertExists(finding.score);
    assertExists(finding.issues);
    assertExists(finding.suggestions);
  });
});

Deno.test("validate-content - quota enforcement", async () => {
  const request = new Request("http://localhost:9000/functions/v1/validate-content", {
    method: "POST",
    headers: {
      "Authorization": "Bearer valid-token",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      questions: [{ text: "Test question" }],
      source_text: "Test content for quota"
    })
  });
  
  const response = await validateContentHandler(request, { 
    supabase: new MockSupabaseClient(), 
    genAI: new MockGenerativeAI("test-key") 
  });
  assertEquals(response.status, 200);
  // The function should attempt to consume tokens via RPC
  // In a real test, you'd verify the RPC was called
});

// Setup and teardown
Deno.test({
  name: "validate-content setup",
  fn: () => {
    setupMockEnv();
  },
  sanitizeOps: false,
  sanitizeResources: false
});

Deno.test({
  name: "validate-content teardown", 
  fn: () => {
    restoreEnv();
  },
  sanitizeOps: false,
  sanitizeResources: false
});
