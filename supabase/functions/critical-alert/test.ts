import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { criticalAlertHandler } from "./index.ts";

Deno.test("critical-alert returns 401 for missing secret", async () => {
  Deno.env.set("ERROR_WEBHOOK_SECRET", "super-secret");
  
  const req = new Request("http://localhost/critical-alert", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ record: {}, type: "INSERT" }),
  });
  
  const res = await criticalAlertHandler(req);
  assertEquals(res.status, 401);
});

Deno.test("critical-alert returns 200 for valid secret", async () => {
  const secret = "super-secret";
  Deno.env.set("ERROR_WEBHOOK_SECRET", secret);
  
  const req = new Request("http://localhost/critical-alert", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-webhook-secret": secret,
    },
    body: JSON.stringify({ 
      record: { id: "test-id", platform: "web", error_type: "Error", error_message: "test" }, 
      type: "INSERT" 
    }),
  });
  
  const res = await criticalAlertHandler(req);
  assertEquals(res.status, 200);
});

Deno.test("critical-alert blocks wrong environment", async () => {
  Deno.env.set("APP_ENV", "production");
  const secret = "super-secret";
  Deno.env.set("ERROR_WEBHOOK_SECRET", secret);

  const req = new Request("http://localhost/critical-alert", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-webhook-secret": secret,
    },
    body: JSON.stringify({ 
      record: { id: "test-id", platform: "web", error_type: "Error", error_message: "test" }, 
      type: "INSERT",
      p_env: "staging" 
    }),
  });
  
  const res = await criticalAlertHandler(req);
  assertEquals(res.status, 403);
});
