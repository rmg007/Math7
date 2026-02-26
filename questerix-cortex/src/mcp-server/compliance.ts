import type Database from "better-sqlite3";

export function checkCompliance(
  db: Database.Database,
  sessionId: string,
): {
  plan_called: boolean;
  verify_called: boolean;
  compliant: boolean;
  plan_count: number;
  verify_count: number;
} {
  const planCalls = db
    .prepare(
      "SELECT COUNT(*) as count FROM tool_calls WHERE session_id = ? AND tool_name = ?",
    )
    .get(sessionId, "cortex_plan") as { count: number };

  const verifyCalls = db
    .prepare(
      "SELECT COUNT(*) as count FROM tool_calls WHERE session_id = ? AND tool_name = ?",
    )
    .get(sessionId, "cortex_verify") as { count: number };

  return {
    plan_called: planCalls.count > 0,
    verify_called: verifyCalls.count > 0,
    compliant: planCalls.count > 0 && verifyCalls.count > 0,
    plan_count: planCalls.count,
    verify_count: verifyCalls.count,
  };
}
