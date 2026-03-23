import { assertEquals } from "https://deno.land/std@0.203.0/testing/asserts.ts";
import { manageAppDomainsHandler } from "./index.ts";

Deno.test("manage-app-domains: CORS preflight", async () => {
  const req = new Request("http://localhost/manage-app-domains", {
    method: "OPTIONS",
  });
  const res = await manageAppDomainsHandler(req);
  assertEquals(res.status, 200);
});

Deno.test("manage-app-domains: fails without environment header", async () => {
  const req = new Request("http://localhost/manage-app-domains", {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "x-webhook-secret": "test"
    },
    body: JSON.stringify({ action: "add", domain: "test.com", appId: "123" }),
  });
  
  const res = await manageAppDomainsHandler(req);
  assertEquals(res.status, 403);
  const data = await res.json();
  assertEquals(data.error, "Cross-environment request blocked");
});
