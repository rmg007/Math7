/**
 * SENTINEL SMOKE TEST — This file contains intentional violations.
 * It should trigger 3 rules in the Sentinel PR reviewer.
 * DELETE THIS FILE after confirming pr_audit_logs rows appear.
 */

// Rule: NO_AS_NEVER — should trigger at 95% confidence
const badCast = (window as never).nonExistent;

// Rule: NO_UNSAFE_COERCE — should trigger at 95% confidence
const unsafeCoerce = (null as unknown as string).toUpperCase();

// Rule: NO_MANUAL_DB_IFACE — should trigger at 75-100% confidence
export interface ManualUserTable {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  email: string;
  deleted_at: string | null;
}
