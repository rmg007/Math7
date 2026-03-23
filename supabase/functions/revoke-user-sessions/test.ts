import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { revokeUserSessionsHandler } from "./index.ts";

Deno.test("revoke-user-sessions returns 401 for missing auth", async () => {
  const req = new Request("http://localhost/revoke", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId: "user-1" }),
  });
  
  const res = await revokeUserSessionsHandler(req);
  assertEquals(res.status, 401);
});

Deno.test("revoke-user-sessions blocks wrong environment", async () => {
  Deno.env.set("APP_ENV", "production");
  
  const req = new Request("http://localhost/revoke", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-App-Env": "staging",
    },
    body: JSON.stringify({ userId: "user-1" }),
  });
  
  const res = await revokeUserSessionsHandler(req);
  assertEquals(res.status, 403);
});
