import { assertEquals } from "https://deno.land/std@0.203.0/testing/asserts.ts";
import { generateQuestionsHandler } from "./index.ts";

Deno.test("generate-questions: CORS preflight", async () => {
  const req = new Request("http://localhost/generate-questions", {
    method: "OPTIONS",
  });
  const res = await generateQuestionsHandler(req);
  assertEquals(res.status, 200);
});

Deno.test("generate-questions: fails without environment header", async () => {
  const req = new Request("http://localhost/generate-questions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: "Hello", difficulty_distribution: { easy: 1, medium: 0, hard: 0 } }),
  });
  
  const res = await generateQuestionsHandler(req);
  assertEquals(res.status, 403);
  const data = await res.json();
  assertEquals(data.error, "Cross-environment request blocked");
});
