import { assertEquals } from "https://deno.land/std@0.203.0/testing/asserts.ts";
import { parseImportHandler } from "./index.ts";

Deno.test("parse-import-prompt: CORS preflight", async () => {
  const req = new Request("http://localhost/parse-import-prompt", {
    method: "OPTIONS",
    headers: { "Origin": "http://localhost:5173" }
  });
  const res = await parseImportHandler(req);
  assertEquals(res.status, 200);
  assertEquals(res.headers.get("Access-Control-Allow-Origin"), "http://localhost:5173");
});

Deno.test("parse-import-prompt: fails without environment header", async () => {
  const req = new Request("http://localhost/parse-import-prompt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: "Hello" }),
  });
  
  const res = await parseImportHandler(req);
  assertEquals(res.status, 403);
  const data = await res.json();
  assertEquals(data.error, "Cross-environment request blocked");
});
