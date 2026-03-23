import { assertEquals } from "https://deno.land/std@0.203.0/testing/asserts.ts";
import { generateTestFromSpecHandler } from "./index.ts";

Deno.test("generate-test-from-spec: CORS preflight", async () => {
  const req = new Request("http://localhost/generate-test-from-spec", {
    method: "OPTIONS",
  });
  const res = await generateTestFromSpecHandler(req);
  assertEquals(res.status, 200);
});

Deno.test("generate-test-from-spec: fails without environment header", async () => {
  const req = new Request("http://localhost/generate-test-from-spec", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ specId: "123" }),
  });
  
  const res = await generateTestFromSpecHandler(req);
  assertEquals(res.status, 403);
  const data = await res.json();
  assertEquals(data.error, "Cross-environment request blocked");
});
