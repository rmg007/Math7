import { assertEquals } from "https://deno.land/std@0.203.0/testing/asserts.ts";
import { analyzeSpecDriftHandler } from "./index.ts";

Deno.test("analyze-spec-drift: CORS preflight", async () => {
  const req = new Request("http://localhost/analyze-spec-drift", {
    method: "OPTIONS",
  });
  const res = await analyzeSpecDriftHandler(req);
  assertEquals(res.status, 200);
  assertEquals(res.headers.get("Access-Control-Allow-Origin"), "*");
});

Deno.test("analyze-spec-drift: fails without environment header", async () => {
  const req = new Request("http://localhost/analyze-spec-drift", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ specId: "123" }),
  });
  
  // Note: Deno.env.get("ENV") defaults to "development" in tests if not set
  const res = await analyzeSpecDriftHandler(req);
  
  // Should fail because X-App-Env (null) !== development
  assertEquals(res.status, 403);
  const data = await res.json();
  assertEquals(data.error, "Cross-environment request blocked");
});

Deno.test("analyze-spec-drift: fails with mismatched environment header", async () => {
  const req = new Request("http://localhost/analyze-spec-drift", {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "X-App-Env": "production"
    },
    body: JSON.stringify({ specId: "123" }),
  });
  
  const res = await analyzeSpecDriftHandler(req);
  assertEquals(res.status, 403);
});
