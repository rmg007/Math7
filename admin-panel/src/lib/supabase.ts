const API_BASE = '/api';

function getToken(): string | null {
  return localStorage.getItem('auth_token');
}

function setToken(token: string) {
  localStorage.setItem('auth_token', token);
}

function clearToken() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
}

function _getStoredUser() {
  try {
    const u = localStorage.getItem('auth_user');
    return u ? JSON.parse(u) : null;
  } catch {
    return null;
  }
}
void _getStoredUser;

function setStoredUser(user: any) {
  localStorage.setItem('auth_user', JSON.stringify(user));
}

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  return res.json();
}

type AuthChangeCallback = (event: string, session: any) => void;
const authListeners: Set<AuthChangeCallback> = new Set();

function notifyAuthListeners(event: string, session: any) {
  authListeners.forEach(cb => {
    try { cb(event, session); } catch {}
  });
}

class QueryBuilder {
  private _table: string;
  private _operation: string;
  private _columns: string;
  private _filters: any[];
  private _order: any[];
  private _rangeFrom: number | null;
  private _rangeTo: number | null;
  private _data: any;
  private _single: boolean;
  private _returning: boolean;
  private _countOption: string | null;

  constructor(table: string, operation: string, columns?: string) {
    this._table = table;
    this._operation = operation;
    this._columns = columns || '*';
    this._filters = [];
    this._order = [];
    this._rangeFrom = null;
    this._rangeTo = null;
    this._data = null;
    this._single = false;
    this._returning = false;
    this._countOption = null;
  }

  select(columns?: string, options?: { count?: string }) {
    if (columns) this._columns = columns;
    if (options?.count) this._countOption = options.count;
    this._returning = true;
    return this;
  }

  insert(data: any) {
    this._operation = 'insert';
    this._data = data;
    return this;
  }

  update(data: any) {
    this._operation = 'update';
    this._data = data;
    return this;
  }

  delete() {
    this._operation = 'delete';
    return this;
  }

  eq(column: string, value: any) {
    this._filters.push({ column, op: 'eq', value });
    return this;
  }

  neq(column: string, value: any) {
    this._filters.push({ column, op: 'neq', value });
    return this;
  }

  gt(column: string, value: any) {
    this._filters.push({ column, op: 'gt', value });
    return this;
  }

  gte(column: string, value: any) {
    this._filters.push({ column, op: 'gte', value });
    return this;
  }

  lt(column: string, value: any) {
    this._filters.push({ column, op: 'lt', value });
    return this;
  }

  lte(column: string, value: any) {
    this._filters.push({ column, op: 'lte', value });
    return this;
  }

  like(column: string, value: any) {
    this._filters.push({ column, op: 'like', value });
    return this;
  }

  ilike(column: string, value: any) {
    this._filters.push({ column, op: 'ilike', value });
    return this;
  }

  is(column: string, value: any) {
    this._filters.push({ column, op: 'is', value });
    return this;
  }

  in(column: string, value: any[]) {
    this._filters.push({ column, op: 'in', value });
    return this;
  }

  not(column: string, _op: string, value: any) {
    this._filters.push({ column, op: 'not', value });
    return this;
  }

  or(value: string) {
    this._filters.push({ column: '_or', op: 'or', value });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this._order.push({ column, ascending: options?.ascending !== false });
    return this;
  }

  range(from: number, to: number) {
    this._rangeFrom = from;
    this._rangeTo = to;
    return this;
  }

  limit(count: number) {
    this._rangeFrom = 0;
    this._rangeTo = count - 1;
    return this;
  }

  single() {
    this._single = true;
    return this;
  }

  maybeSingle() {
    this._single = true;
    return this;
  }

  async then(resolve: (value: any) => void, reject?: (reason: any) => void) {
    try {
      const result = await this._execute();
      resolve(result);
    } catch (e) {
      if (reject) reject(e);
      else resolve({ data: null, error: { message: String(e) } });
    }
  }

  private async _execute() {
    const body: any = {
      table: this._table,
      operation: this._operation,
      columns: this._columns,
      filters: this._filters,
      order: this._order,
      single: this._single,
      returning: this._returning,
    };

    if (this._rangeFrom !== null && this._rangeTo !== null) {
      body.range = [this._rangeFrom, this._rangeTo];
    }

    if (this._data !== null) {
      body.data = this._data;
    }

    if (this._countOption) {
      body.count = this._countOption;
    }

    const result = await apiFetch('/data', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    if (this._countOption && result.count !== undefined) {
      return { data: result.data, error: result.error, count: result.count };
    }

    return { data: result.data, error: result.error };
  }
}

export const supabase = {
  from(table: string) {
    const qb = new QueryBuilder(table, 'select');
    return {
      select(columns?: string, options?: { count?: string }) {
        qb.select(columns, options);
        return qb;
      },
      insert(data: any) {
        qb.insert(data);
        return qb;
      },
      update(data: any) {
        qb.update(data);
        return qb;
      },
      delete() {
        qb.delete();
        return qb;
      },
    };
  },

  auth: {
    async getSession() {
      const token = getToken();
      if (!token) {
        return { data: { session: null }, error: null };
      }
      try {
        const result = await apiFetch('/auth/session');
        if (result.data?.session) {
          setStoredUser(result.data.session.user);
          return { data: { session: result.data.session }, error: null };
        }
        clearToken();
        return { data: { session: null }, error: null };
      } catch {
        return { data: { session: null }, error: null };
      }
    },

    async getUser() {
      const token = getToken();
      if (!token) {
        return { data: { user: null }, error: null };
      }
      try {
        const result = await apiFetch('/auth/user');
        if (result.data?.user) {
          setStoredUser(result.data.user);
          return { data: { user: result.data.user }, error: null };
        }
        return { data: { user: null }, error: null };
      } catch {
        return { data: { user: null }, error: null };
      }
    },

    async signInWithPassword({ email, password }: { email: string; password: string }) {
      try {
        const result = await apiFetch('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
        if (result.error) {
          return { data: { user: null, session: null }, error: result.error };
        }
        setToken(result.data.session.access_token);
        setStoredUser(result.data.user);
        notifyAuthListeners('SIGNED_IN', result.data.session);
        return { data: result.data, error: null };
      } catch (e: any) {
        return { data: { user: null, session: null }, error: { message: e.message || 'Login failed' } };
      }
    },

    async signUp({ email, password, options }: { email: string; password: string; options?: { data?: Record<string, any> } }) {
      try {
        const result = await apiFetch('/auth/signup', {
          method: 'POST',
          body: JSON.stringify({ email, password, options }),
        });
        if (result.error) {
          return { data: { user: null, session: null }, error: result.error };
        }
        setToken(result.data.session.access_token);
        setStoredUser(result.data.user);
        notifyAuthListeners('SIGNED_IN', result.data.session);
        return { data: result.data, error: null };
      } catch (e: any) {
        return { data: { user: null, session: null }, error: { message: e.message || 'Signup failed' } };
      }
    },

    async signOut() {
      try {
        await apiFetch('/auth/logout', { method: 'POST' });
      } catch {}
      clearToken();
      notifyAuthListeners('SIGNED_OUT', null);
      return { error: null };
    },

    onAuthStateChange(callback: AuthChangeCallback) {
      authListeners.add(callback);
      return {
        data: {
          subscription: {
            unsubscribe() {
              authListeners.delete(callback);
            },
          },
        },
      };
    },
  },

  async rpc(functionName: string, params?: any) {
    try {
      const result = await apiFetch(`/rpc/${functionName}`, {
        method: 'POST',
        body: JSON.stringify(params || {}),
      });
      return { data: result.data, error: result.error || null };
    } catch (e: any) {
      return { data: null, error: { message: e.message } };
    }
  },

  functions: {
    async invoke(functionName: string, options?: { body?: any }) {
      try {
        const result = await apiFetch(`/functions/${functionName}`, {
          method: 'POST',
          body: JSON.stringify(options?.body || {}),
        });
        return { data: result.data || result, error: result.error || null };
      } catch (e: any) {
        return { data: null, error: { message: e.message } };
      }
    },
  },
};
