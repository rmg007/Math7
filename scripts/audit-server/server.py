import os
import re
from fastmcp import FastMCP

# Initialize the MCP Server (still useful if we want to mount it properly later)
mcp = FastMCP("Questerix Auditor")

# Define paths relative to this script
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../"))

def read_file(rel_path):
    path = os.path.join(BASE_DIR, rel_path)
    if not os.path.exists(path):
        return None
    with open(path, "r", encoding="utf-8") as f:
        return f.read()

@mcp.tool()
def audit_architecture() -> str:
    """
    Performs a Red Team audit on the Questerix codebase.
    Checks for: Tenant Leaks, RPC Vulnerabilities, Schema Drift, and Security Theater.
    """
    report = ["# 🛡️ OPERATION IRONCLAD: AUDIT REPORT\n"]
    issues_found = 0

    # ---------------------------------------------------------
    # CHECK 1: THE "ZOMBIE TENANT" TRAP
    # Target: Student App Config
    # ---------------------------------------------------------
    config_path = "student-app/lib/src/core/config/app_config_service.dart"
    content = read_file(config_path)
    
    report.append("## 1. Multi-Tenant Safety (Client)")
    if content:
        if "51f42753-b192-4bf8-9a3b-18269ad4096a" in content:
            report.append("❌ [CRITICAL] Hardcoded Default Tenant UUID found.")
            report.append("   - File: `app_config_service.dart`")
            report.append("   - Risk: Offline users will fallback to the wrong school.")
            issues_found += 1
        else:
            report.append("✅ No hardcoded defaults detected.")
    else:
        report.append(f"⚠️ Could not find {config_path}")

    # ---------------------------------------------------------
    # CHECK 2: THE "BLIND FIRE" RPC
    # Target: Admin Panel Publish Hook
    # ---------------------------------------------------------
    publish_path = "admin-panel/src/features/curriculum/hooks/use-publish.ts"
    content = read_file(publish_path)
    
    report.append("\n## 2. Admin Operations Safety")
    if content:
        # Check if called without args (heuristic: followed immediately by closing paren)
        if re.search(r"rpc\('publish_curriculum'\s*\)", content) or \
           re.search(r"rpc as any\)\('publish_curriculum'\s*\)", content):
             report.append("❌ [HIGH] 'publish_curriculum' RPC called without arguments.")
             report.append("   - File: `use-publish.ts`")
             report.append("   - Risk: This command will publish ALL tenants' data simultaneously.")
             issues_found += 1
        else:
             report.append("✅ RPC calls appear scoped (manual verification recommended).")
    else:
        report.append(f"⚠️ Could not find {publish_path}")

    # ---------------------------------------------------------
    # CHECK 3: THE "BLIND SCHEMA" (Drift vs Postgres)
    # Target: Mobile Database Definition
    # ---------------------------------------------------------
    drift_path = "student-app/lib/src/core/database/tables.dart"
    content = read_file(drift_path)
    
    report.append("\n## 3. Offline Database Integrity")
    if content:
        # Check if critical tables have app_id
        if "class Domains extends Table" in content:
            if "TextColumn get appId" not in content and "text().named('app_id')" not in content:
                report.append("❌ [BLOCKER] Drift `Domains` table missing `app_id` column.")
                report.append("   - File: `tables.dart`")
                report.append("   - Risk: Local database is not multi-tenant aware. Data will leak between accounts.")
                issues_found += 1
            else:
                report.append("✅ `Domains` table has `app_id`.")
        else:
            report.append("⚠️ Could not find `Domains` table definition.")
    else:
        report.append(f"⚠️ Could not find {drift_path}")

    # ---------------------------------------------------------
    # CHECK 4: THE "OPEN WALLET" VULNERABILITY
    # Target: Edge Functions
    # ---------------------------------------------------------
    edge_path = "supabase/functions/generate-questions/index.ts"
    content = read_file(edge_path)
    
    report.append("\n## 4. API Security (Edge Functions)")
    if content:
        if "auth.getUser" not in content and "supabase.auth" not in content:
            report.append("❌ [CRITICAL] `generate-questions` missing Authentication check.")
            report.append("   - File: `supabase/functions/generate-questions/index.ts`")
            report.append("   - Risk: Public access to paid AI generation.")
            issues_found += 1
        else:
            report.append("✅ Auth check detected in Edge Function.")
    else:
        report.append(f"⚠️ Could not find {edge_path}")

    # Summary
    report.append("\n" + "="*40)
    if issues_found > 0:
        report.append(f"🚨 FAILED: {issues_found} Critical Architecture Violations Found")
        report.append("DO NOT DEPLOY.")
    else:
        report.append("✅ PASSED: Core architecture looks sound.")
    
    return "\n".join(report)

if __name__ == "__main__":
    mcp.run()
