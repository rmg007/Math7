import { assertEquals } from "https://deno.land/std@0.203.0/testing/asserts.ts";
import { indexSpecificationHandler } from "./index.ts";

Deno.test("index-specification: CORS preflight", async () => {
  const req = new Request("http://localhost/index-specification", {
    method: "OPTIONS",
  });
  const res = await indexSpecificationHandler(req);
  assertEquals(res.status, 200);
});

Deno.test("index-specification: fails without environment header", async () => {
  const req = new Request("http://localhost/index-specification", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ specId: "123" }),
  });
  
  const res = await indexSpecificationHandler(req);
  assertEquals(res.status, 403);
  const data = await res.json();
  assertEquals(data.error, "Cross-environment request blocked");
});
