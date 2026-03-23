import { assertEquals } from "https://deno.land/std@0.203.0/testing/asserts.ts";
import { validateContentHandler } from "./index.ts";

Deno.test("validate-content: CORS preflight", async () => {
  const req = new Request("http://localhost/validate-content", {
    method: "OPTIONS",
  });
  const res = await validateContentHandler(req);
  assertEquals(res.status, 200);
});

Deno.test("validate-content: fails without environment header", async () => {
  const req = new Request("http://localhost/validate-content", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: "Hello", type: "question" }),
  });
  
  const res = await validateContentHandler(req);
  assertEquals(res.status, 403);
  const data = await res.json();
  assertEquals(data.error, "Cross-environment request blocked");
});
