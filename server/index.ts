import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import pg from "pg";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const { Pool } = pg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const JWT_SECRET = process.env.JWT_SECRET || "questerix-dev-secret-change-in-production";

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

const ALLOWED_TABLES = new Set([
  "profiles", "subjects", "apps", "domains", "skills", "questions",
  "groups", "group_members", "assignments", "attempts", "sessions",
  "skill_progress", "invitation_codes", "curriculum_meta", "curriculum_snapshots",
  "outbox", "sync_meta", "app_landing_pages", "user_subscriptions",
  "security_events", "security_logs", "known_issues", "error_logs",
  "source_documents", "ai_generation_sessions", "generation_audit_log",
  "tenant_quotas", "content_validation_rules", "approval_workflows",
  "specifications", "spec_validations", "kb_registry", "kb_metrics",
]);

const FK_MAP: Record<string, Record<string, { fk: string; ref: string }>> = {
  domains: {
    apps: { fk: "domains.app_id", ref: "apps.app_id" },
  },
  skills: {
    domains: { fk: "skills.domain_id", ref: "domains.id" },
    apps: { fk: "skills.app_id", ref: "apps.app_id" },
  },
  questions: {
    skills: { fk: "questions.skill_id", ref: "skills.id" },
  },
  apps: {
    subjects: { fk: "apps.subject_id", ref: "subjects.subject_id" },
  },
  app_landing_pages: {
    apps: { fk: "app_landing_pages.app_id", ref: "apps.app_id" },
  },
  groups: {
    profiles: { fk: "groups.owner_id", ref: "profiles.id" },
  },
};

function validateColumnName(name: string): boolean {
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
}

interface AuthRequest extends Request {
  user?: { id: string; email: string; role: string } | null;
}

function authMiddleware(req: AuthRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };
      req.user = decoded;
    } catch {
      req.user = null;
    }
  } else {
    req.user = null;
  }
  next();
}

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.post("/api/auth/signup", async (req: Request, res: Response) => {
  try {
    const { email, password, options } = req.body;
    const fullName = options?.data?.full_name || null;

    const existing = await pool.query("SELECT id FROM profiles WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ data: null, error: { message: "User already exists" } });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO profiles (email, password_hash, full_name, role) VALUES ($1, $2, $3, $4) RETURNING *",
      [email, passwordHash, fullName, "student"]
    );

    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "7d" });

    const { password_hash, ...safeUser } = user;
    res.json({
      data: {
        user: safeUser,
        session: { access_token: token },
      },
      error: null,
    });
  } catch (err: any) {
    res.status(500).json({ data: null, error: { message: err.message } });
  }
});

app.post("/api/auth/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query("SELECT * FROM profiles WHERE email = $1 AND deleted_at IS NULL", [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ data: null, error: { message: "Invalid email or password" } });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash || "");
    if (!valid) {
      return res.status(401).json({ data: null, error: { message: "Invalid email or password" } });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "7d" });

    const { password_hash, ...safeUser } = user;
    res.json({
      data: {
        user: safeUser,
        session: { access_token: token },
      },
      error: null,
    });
  } catch (err: any) {
    res.status(500).json({ data: null, error: { message: err.message } });
  }
});

app.get("/api/auth/session", async (req: AuthRequest, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.json({ data: { session: null }, error: null });
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };
    const result = await pool.query("SELECT * FROM profiles WHERE id = $1 AND deleted_at IS NULL", [decoded.id]);
    if (result.rows.length === 0) {
      return res.json({ data: { session: null }, error: null });
    }

    const { password_hash, ...safeUser } = result.rows[0];
    res.json({
      data: {
        session: {
          access_token: token,
          user: safeUser,
        },
      },
      error: null,
    });
  } catch {
    res.json({ data: { session: null }, error: null });
  }
});

app.get("/api/auth/user", async (req: AuthRequest, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.json({ data: { user: null }, error: null });
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };
    const result = await pool.query("SELECT * FROM profiles WHERE id = $1 AND deleted_at IS NULL", [decoded.id]);
    if (result.rows.length === 0) {
      return res.json({ data: { user: null }, error: null });
    }

    const { password_hash, ...safeUser } = result.rows[0];
    res.json({ data: { user: safeUser }, error: null });
  } catch {
    res.json({ data: { user: null }, error: null });
  }
});

app.post("/api/auth/logout", (_req: Request, res: Response) => {
  res.json({ data: null, error: null });
});

function parseOrFilter(value: string, params: any[], paramIndex: number): { clause: string; newIndex: number } {
  const parts = value.split(",");
  const orConditions: string[] = [];

  for (const part of parts) {
    const dotParts = part.split(".");
    if (dotParts.length < 3) continue;

    const col = dotParts[0];
    const op = dotParts[1];
    const val = dotParts.slice(2).join(".");

    if (!validateColumnName(col)) continue;

    switch (op) {
      case "eq":
        params.push(val);
        orConditions.push(`"${col}" = $${paramIndex++}`);
        break;
      case "neq":
        params.push(val);
        orConditions.push(`"${col}" != $${paramIndex++}`);
        break;
      case "like":
        params.push(val);
        orConditions.push(`"${col}" LIKE $${paramIndex++}`);
        break;
      case "ilike":
        params.push(val);
        orConditions.push(`"${col}" ILIKE $${paramIndex++}`);
        break;
      case "gt":
        params.push(val);
        orConditions.push(`"${col}" > $${paramIndex++}`);
        break;
      case "gte":
        params.push(val);
        orConditions.push(`"${col}" >= $${paramIndex++}`);
        break;
      case "lt":
        params.push(val);
        orConditions.push(`"${col}" < $${paramIndex++}`);
        break;
      case "lte":
        params.push(val);
        orConditions.push(`"${col}" <= $${paramIndex++}`);
        break;
      case "is":
        if (val === "null") {
          orConditions.push(`"${col}" IS NULL`);
        } else {
          orConditions.push(`"${col}" IS NOT NULL`);
        }
        break;
      default:
        params.push(val);
        orConditions.push(`"${col}" = $${paramIndex++}`);
    }
  }

  const clause = orConditions.length > 0 ? `(${orConditions.join(" OR ")})` : "TRUE";
  return { clause, newIndex: paramIndex };
}

function buildWhereClause(
  filters: Array<{ column: string; op: string; value: any }>,
  params: any[],
  startIndex: number,
  tableAlias?: string
): { whereClause: string; paramIndex: number } {
  if (!filters || filters.length === 0) {
    return { whereClause: "", paramIndex: startIndex };
  }

  const conditions: string[] = [];
  let paramIndex = startIndex;
  const prefix = tableAlias ? `${tableAlias}.` : "";

  for (const filter of filters) {
    if (!validateColumnName(filter.column)) continue;

    const col = `${prefix}"${filter.column}"`;

    switch (filter.op) {
      case "eq":
        params.push(filter.value);
        conditions.push(`${col} = $${paramIndex++}`);
        break;
      case "neq":
        params.push(filter.value);
        conditions.push(`${col} != $${paramIndex++}`);
        break;
      case "gt":
        params.push(filter.value);
        conditions.push(`${col} > $${paramIndex++}`);
        break;
      case "gte":
        params.push(filter.value);
        conditions.push(`${col} >= $${paramIndex++}`);
        break;
      case "lt":
        params.push(filter.value);
        conditions.push(`${col} < $${paramIndex++}`);
        break;
      case "lte":
        params.push(filter.value);
        conditions.push(`${col} <= $${paramIndex++}`);
        break;
      case "like":
        params.push(filter.value);
        conditions.push(`${col} LIKE $${paramIndex++}`);
        break;
      case "ilike":
        params.push(filter.value);
        conditions.push(`${col} ILIKE $${paramIndex++}`);
        break;
      case "is":
        if (filter.value === null || filter.value === "null") {
          conditions.push(`${col} IS NULL`);
        } else {
          conditions.push(`${col} IS NOT NULL`);
        }
        break;
      case "in": {
        const values = Array.isArray(filter.value) ? filter.value : [filter.value];
        const placeholders = values.map((v: any) => {
          params.push(v);
          return `$${paramIndex++}`;
        });
        conditions.push(`${col} IN (${placeholders.join(", ")})`);
        break;
      }
      case "not":
        params.push(filter.value);
        conditions.push(`NOT (${col} = $${paramIndex++})`);
        break;
      case "or": {
        const result = parseOrFilter(filter.value, params, paramIndex);
        conditions.push(result.clause);
        paramIndex = result.newIndex;
        break;
      }
      default:
        params.push(filter.value);
        conditions.push(`${col} = $${paramIndex++}`);
    }
  }

  const whereClause = conditions.length > 0 ? ` WHERE ${conditions.join(" AND ")}` : "";
  return { whereClause, paramIndex };
}

function parseJoins(columns: string, table: string): { selectCols: string; joinClauses: string } {
  const joinRegex = /(\w+)\(([^)]+)\)/g;
  const joins: string[] = [];
  const selectParts: string[] = [];
  let hasJoin = false;

  let remaining = columns;
  let match;

  while ((match = joinRegex.exec(columns)) !== null) {
    hasJoin = true;
    const relatedTable = match[1];
    const relatedCols = match[2].split(",").map((c: string) => c.trim());

    const fkMapping = FK_MAP[table]?.[relatedTable];
    if (fkMapping) {
      const [fkTable, fkCol] = fkMapping.fk.split(".");
      const [refTable, refCol] = fkMapping.ref.split(".");
      joins.push(`LEFT JOIN "${relatedTable}" ON "${fkTable}"."${fkCol}" = "${refTable}"."${refCol}"`);
      for (const col of relatedCols) {
        if (validateColumnName(col)) {
          selectParts.push(`"${relatedTable}"."${col}" AS "${relatedTable}_${col}"`);
        }
      }
    }

    remaining = remaining.replace(match[0], "");
  }

  remaining = remaining.replace(/,\s*,/g, ",").replace(/^,\s*|,\s*$/g, "").trim();

  if (!hasJoin) {
    return { selectCols: columns === "*" ? `"${table}".*` : columns, joinClauses: "" };
  }

  const baseCols = remaining && remaining !== "" ? `"${table}".${remaining}` : `"${table}".*`;
  const allSelect = [baseCols, ...selectParts].join(", ");

  return { selectCols: allSelect, joinClauses: joins.join(" ") };
}

app.post("/api/data", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { table, operation, columns, filters, order, range, data, single, count, returning } = req.body;

    if (!ALLOWED_TABLES.has(table)) {
      return res.status(400).json({ data: null, error: { message: `Table '${table}' is not allowed` } });
    }

    const ADMIN_ONLY_TABLES = new Set([
      "subjects", "apps", "domains", "skills", "questions", "invitation_codes",
      "curriculum_meta", "curriculum_snapshots", "app_landing_pages",
      "source_documents", "ai_generation_sessions", "tenant_quotas",
      "content_validation_rules", "approval_workflows", "specifications",
      "spec_validations", "kb_registry", "kb_metrics"
    ]);

    const userRole = req.user?.role;
    if (operation !== "select" && ADMIN_ONLY_TABLES.has(table)) {
      if (!userRole || !["super_admin", "admin"].includes(userRole)) {
        return res.status(403).json({ data: null, error: { message: "Admin access required" } });
      }
    }

    if (operation !== "select" && !req.user?.id) {
      return res.status(401).json({ data: null, error: { message: "Authentication required" } });
    }

    const params: any[] = [];
    let paramIndex = 1;

    if (operation === "select") {
      const colStr = columns || "*";
      const { selectCols, joinClauses } = parseJoins(colStr, table);

      const tableAlias = joinClauses ? table : undefined;
      const { whereClause, paramIndex: newIdx } = buildWhereClause(filters || [], params, paramIndex, tableAlias);
      paramIndex = newIdx;

      let sql = `SELECT ${selectCols} FROM "${table}" ${joinClauses}${whereClause}`;

      if (order && order.length > 0) {
        const orderParts = order.map((o: { column: string; ascending: boolean }) => {
          if (!validateColumnName(o.column)) return null;
          return `"${o.column}" ${o.ascending ? "ASC" : "DESC"}`;
        }).filter(Boolean);
        if (orderParts.length > 0) {
          sql += ` ORDER BY ${orderParts.join(", ")}`;
        }
      }

      if (range && Array.isArray(range) && range.length === 2) {
        const offset = range[0];
        const limit = range[1] - range[0] + 1;
        sql += ` LIMIT ${limit} OFFSET ${offset}`;
      }

      const result = await pool.query(sql, params);
      let totalCount: number | undefined;

      if (count === "exact") {
        const { whereClause: countWhere } = buildWhereClause(filters || [], [], 1, joinClauses ? table : undefined);
        const countSql = `SELECT COUNT(*) FROM "${table}" ${joinClauses}${countWhere}`;
        const countParams: any[] = [];
        buildWhereClause(filters || [], countParams, 1, joinClauses ? table : undefined);
        const countResult = await pool.query(countSql, countParams);
        totalCount = parseInt(countResult.rows[0].count, 10);
      }

      const responseData = single ? (result.rows[0] || null) : result.rows;
      const response: any = { data: responseData, error: null };
      if (totalCount !== undefined) {
        response.count = totalCount;
      }
      return res.json(response);
    }

    if (operation === "insert") {
      const keys = Object.keys(data);
      const validKeys = keys.filter(validateColumnName);
      const values = validKeys.map((k) => data[k]);
      const placeholders = validKeys.map((_, i) => `$${i + 1}`);

      const sql = `INSERT INTO "${table}" (${validKeys.map((k) => `"${k}"`).join(", ")}) VALUES (${placeholders.join(", ")}) RETURNING *`;
      const result = await pool.query(sql, values);
      const responseData = single ? (result.rows[0] || null) : result.rows;
      return res.json({ data: returning !== false ? responseData : null, error: null });
    }

    if (operation === "update") {
      const keys = Object.keys(data);
      const validKeys = keys.filter(validateColumnName);
      const setParts: string[] = [];

      for (const key of validKeys) {
        params.push(data[key]);
        setParts.push(`"${key}" = $${paramIndex++}`);
      }

      const { whereClause } = buildWhereClause(filters || [], params, paramIndex);

      const sql = `UPDATE "${table}" SET ${setParts.join(", ")}${whereClause} RETURNING *`;
      const result = await pool.query(sql, params);
      const responseData = single ? (result.rows[0] || null) : result.rows;
      return res.json({ data: returning !== false ? responseData : null, error: null });
    }

    if (operation === "delete") {
      const { whereClause } = buildWhereClause(filters || [], params, paramIndex);
      const sql = `DELETE FROM "${table}"${whereClause} RETURNING *`;
      const result = await pool.query(sql, params);
      const responseData = single ? (result.rows[0] || null) : result.rows;
      return res.json({ data: returning !== false ? responseData : null, error: null });
    }

    return res.status(400).json({ data: null, error: { message: `Unknown operation '${operation}'` } });
  } catch (err: any) {
    res.status(500).json({ data: null, error: { message: err.message } });
  }
});

app.post("/api/rpc/:name", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { name } = req.params;

    switch (name) {
      case "validate_invitation_code": {
        const { p_code } = req.body;
        const result = await pool.query(
          "SELECT * FROM invitation_codes WHERE code = $1 AND is_active = true",
          [p_code]
        );
        if (result.rows.length === 0) {
          return res.json({ data: { valid: false, error: "Invalid or inactive code" }, error: null });
        }
        const code = result.rows[0];
        if (code.expires_at && new Date(code.expires_at) < new Date()) {
          return res.json({ data: { valid: false, error: "Code has expired" }, error: null });
        }
        if (code.max_uses && code.times_used >= code.max_uses) {
          return res.json({ data: { valid: false, error: "Code has reached maximum uses" }, error: null });
        }
        return res.json({ data: { valid: true }, error: null });
      }

      case "use_invitation_code": {
        const { p_code } = req.body;
        const result = await pool.query(
          "UPDATE invitation_codes SET times_used = times_used + 1, updated_at = now() WHERE code = $1 AND is_active = true RETURNING *",
          [p_code]
        );
        if (result.rows.length === 0) {
          return res.status(400).json({ data: null, error: { message: "Invalid or inactive code" } });
        }
        const updated = result.rows[0];
        if (updated.max_uses && updated.times_used >= updated.max_uses) {
          await pool.query("UPDATE invitation_codes SET is_active = false WHERE id = $1", [updated.id]);
        }
        return res.json({ data: updated, error: null });
      }

      case "publish_invitation_code": {
        const { p_code_id } = req.body;
        const result = await pool.query(
          "UPDATE invitation_codes SET is_active = true, updated_at = now() WHERE id = $1 RETURNING *",
          [p_code_id]
        );
        return res.json({ data: result.rows[0] || null, error: null });
      }

      case "deactivate_invitation_code": {
        const { p_code_id } = req.body;
        const result = await pool.query(
          "UPDATE invitation_codes SET is_active = false, updated_at = now() WHERE id = $1 RETURNING *",
          [p_code_id]
        );
        return res.json({ data: result.rows[0] || null, error: null });
      }

      case "consume_tenant_tokens": {
        const { p_app_id, p_token_count } = req.body;
        const result = await pool.query(
          "UPDATE tenant_quotas SET current_token_usage = current_token_usage + $1, updated_at = now() WHERE app_id = $2 RETURNING *",
          [p_token_count, p_app_id]
        );
        if (result.rows.length === 0) {
          return res.status(404).json({ data: null, error: { message: "Tenant quota not found" } });
        }
        const quota = result.rows[0];
        if (quota.current_token_usage >= quota.monthly_token_limit) {
          await pool.query("UPDATE tenant_quotas SET is_throttled = true WHERE app_id = $1", [p_app_id]);
        }
        return res.json({ data: quota, error: null });
      }

      case "log_security_event": {
        const { p_event_type, p_severity, p_metadata, p_app_id } = req.body;
        const result = await pool.query(
          "INSERT INTO security_logs (event_type, severity, metadata, app_id, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING *",
          [p_event_type, p_severity || "info", p_metadata || {}, p_app_id || null, req.user?.id || null]
        );
        return res.json({ data: result.rows[0], error: null });
      }

      case "log_error": {
        const body = req.body;
        const result = await pool.query(
          "INSERT INTO error_logs (user_id, app_id, platform, app_version, error_type, error_message, stack_trace, url, user_agent, extra_context) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *",
          [
            body.p_user_id || req.user?.id || null,
            body.p_app_id || null,
            body.p_platform || "unknown",
            body.p_app_version || null,
            body.p_error_type || "unknown",
            body.p_error_message || "",
            body.p_stack_trace || null,
            body.p_url || null,
            body.p_user_agent || null,
            body.p_extra_context || {},
          ]
        );
        return res.json({ data: result.rows[0], error: null });
      }

      case "promote_error_to_issue": {
        const { p_error_id, p_title, p_root_cause, p_resolution } = req.body;
        const errorResult = await pool.query("SELECT * FROM error_logs WHERE id = $1", [p_error_id]);
        if (errorResult.rows.length === 0) {
          return res.status(404).json({ data: null, error: { message: "Error log not found" } });
        }
        const errorLog = errorResult.rows[0];
        const issueResult = await pool.query(
          "INSERT INTO known_issues (title, error_message, root_cause, resolution, severity, created_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
          [p_title, errorLog.error_message, p_root_cause || null, p_resolution || null, errorLog.severity || "medium", req.user?.id || null]
        );
        const issue = issueResult.rows[0];
        await pool.query("UPDATE error_logs SET promoted_to_issue_id = $1, status = $2 WHERE id = $3", [
          issue.id,
          "promoted",
          p_error_id,
        ]);
        return res.json({ data: issue, error: null });
      }

      case "deactivate_own_account": {
        if (!req.user) {
          return res.status(401).json({ data: null, error: { message: "Not authenticated" } });
        }
        const result = await pool.query(
          "UPDATE profiles SET deleted_at = now(), updated_at = now() WHERE id = $1 RETURNING *",
          [req.user.id]
        );
        const { password_hash, ...safeUser } = result.rows[0];
        return res.json({ data: safeUser, error: null });
      }

      case "delete_own_account": {
        if (!req.user) {
          return res.status(401).json({ data: null, error: { message: "Not authenticated" } });
        }
        await pool.query("DELETE FROM profiles WHERE id = $1", [req.user.id]);
        return res.json({ data: { success: true }, error: null });
      }

      case "publish_curriculum": {
        const { p_app_id } = req.body;
        const existing = await pool.query("SELECT * FROM curriculum_meta LIMIT 1");
        if (existing.rows.length === 0) {
          const result = await pool.query(
            "INSERT INTO curriculum_meta (version, last_published_at) VALUES (1, now()) RETURNING *"
          );
          return res.json({ data: result.rows[0], error: null });
        }
        const result = await pool.query(
          "UPDATE curriculum_meta SET version = version + 1, last_published_at = now(), updated_at = now() WHERE id = $1 RETURNING *",
          [existing.rows[0].id]
        );
        return res.json({ data: result.rows[0], error: null });
      }

      default:
        return res.status(400).json({ data: null, error: { message: `Unknown RPC function '${name}'` } });
    }
  } catch (err: any) {
    res.status(500).json({ data: null, error: { message: err.message } });
  }
});

app.post("/api/functions/:name", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { name } = req.params;

    switch (name) {
      case "generate-questions": {
        const { skillId, count, difficulty, context } = req.body;
        return res.json({
          data: {
            questions: [],
            message: "AI question generation requires API key configuration. This is a placeholder response.",
            skillId,
            requestedCount: count || 5,
            difficulty: difficulty || "medium",
          },
          error: null,
        });
      }

      case "validate-content": {
        const { content, rules } = req.body;
        return res.json({
          data: {
            valid: true,
            violations: [],
            message: "Content validation placeholder. Configure validation rules for full functionality.",
          },
          error: null,
        });
      }

      default:
        return res.status(400).json({ data: null, error: { message: `Unknown function '${name}'` } });
    }
  } catch (err: any) {
    res.status(500).json({ data: null, error: { message: err.message } });
  }
});

const PORT = 3001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
