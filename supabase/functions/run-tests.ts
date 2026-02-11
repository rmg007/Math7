/**
 * Test runner for Supabase Edge Functions
 * Runs all function tests and provides a summary report
 */

import { runTests } from "https://deno.land/std@0.168.0/testing/mod.ts";

// Import all test files
import "./generate-questions/test.ts";
import "./validate-content/test.ts";

// Run all tests and generate report
async function runAllTests() {
  console.log("🧪 Running Supabase Edge Function Tests...\n");
  
  const startTime = Date.now();
  const results = await runTests();
  const duration = Date.now() - startTime;
  
  // Generate summary report
  const passed = results.filter(r => r.ok).length;
  const failed = results.filter(r => !r.ok).length;
  const total = results.length;
  
  console.log("\n" + "=".repeat(60));
  console.log("📊 EDGE FUNCTION TEST SUMMARY");
  console.log("=".repeat(60));
  console.log(`Total Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏱️  Duration: ${duration}ms`);
  console.log(`📈 Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
  
  if (failed > 0) {
    console.log("\n❌ FAILED TESTS:");
    results.filter(r => !r.ok).forEach(test => {
      console.log(`  - ${test.name}: ${test.error?.message || "Unknown error"}`);
    });
  }
  
  console.log("\n" + "=".repeat(60));
  
  // Exit with appropriate code
  Deno.exit(failed > 0 ? 1 : 0);
}

// Run tests if this file is executed directly
if (import.meta.main) {
  await runAllTests();
}
