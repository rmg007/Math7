import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { healthCheckHandler } from "./index.ts";

Deno.test("health-check returns 200 for OPTIONS", async () => {
  const req = new Request("http://localhost/health-check", {
    method: "OPTIONS",
  });
  const res = await healthCheckHandler(req);
  assertEquals(res.status, 200);
});

Deno.test("health-check returns 405 for POST", async () => {
  const req = new Request("http://localhost/health-check", {
    method: "POST",
    body: JSON.stringify({}),
  });
  const res = await healthCheckHandler(req);
  assertEquals(res.status, 405);
});

Deno.test("health-check blocks wrong environment", async () => {
  // Mock environment
  Deno.env.set("APP_ENV", "production");
  
  const req = new Request("http://localhost/health-check", {
    method: "GET",
    headers: {
      "X-App-Env": "staging",
    },
  });
  
  const res = await healthCheckHandler(req);
  assertEquals(res.status, 403);
  const body = await res.json();
  assertEquals(body.code, "FORBIDDEN");
});
