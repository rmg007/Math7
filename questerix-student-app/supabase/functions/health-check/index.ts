import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Type declarations for Deno
declare global {
  const Deno: {
    env: {
      get(key: string): string | undefined;
    };
  };
}

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    database: HealthCheckItem;
    auth: HealthCheckItem;
    storage: HealthCheckItem;
    edgeFunction: HealthCheckItem;
  };
  timestamp: string;
  version: string;
}

interface HealthCheckItem {
  status: 'pass' | 'warn' | 'fail';
  latency?: number;
  error?: string;
  details?: Record<string, unknown>;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Health check thresholds (milliseconds)
const THRESHOLDS = {
  database: { warn: 1000, fail: 3000 },
  auth: { warn: 500, fail: 1500 },
  storage: { warn: 800, fail: 2000 },
};

async function checkDatabaseHealth(supabase: any): Promise<HealthCheckItem> {
  const startTime = Date.now();
  
  try {
    // Simple database connectivity test
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
      .single();
    
    const latency = Date.now() - startTime;
    
    if (error) {
      return {
        status: 'fail',
        latency,
        error: error.message,
      };
    }
    
    // Determine status based on latency
    if (latency > THRESHOLDS.database.fail) {
      return {
        status: 'fail',
        latency,
        error: `Database response too slow: ${latency}ms`,
      };
    } else if (latency > THRESHOLDS.database.warn) {
      return {
        status: 'warn',
        latency,
        details: { warning: `Slow database response: ${latency}ms` },
      };
    }
    
    return {
      status: 'pass',
      latency,
    };
  } catch (error: unknown) {
    return {
      status: 'fail',
      latency: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function checkAuthHealth(supabase: any): Promise<HealthCheckItem> {
  const startTime = Date.now();
  
  try {
    // Test auth service by checking JWT validation
    const { data, error } = await supabase.auth.getUser(
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0IiwiaWF0IjoxNjE2MjM5MDIyfQ.invalid'
    );
    
    const latency = Date.now() - startTime;
    
    // We expect this to fail with invalid JWT, but not timeout
    if (error && !error.message.includes('timeout')) {
      if (latency > THRESHOLDS.auth.fail) {
        return {
          status: 'fail',
          latency,
          error: `Auth response too slow: ${latency}ms`,
        };
      } else if (latency > THRESHOLDS.auth.warn) {
        return {
          status: 'warn',
          latency,
          details: { warning: `Slow auth response: ${latency}ms` },
        };
      }
      
      return {
        status: 'pass',
        latency,
        details: { note: 'Auth service responding normally' },
      };
    }
    
    return {
      status: 'fail',
      latency,
      error: 'Unexpected auth response',
    };
  } catch (error: unknown) {
    return {
      status: 'fail',
      latency: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function checkStorageHealth(supabase: any): Promise<HealthCheckItem> {
  const startTime = Date.now();
  
  try {
    // Test storage by listing buckets (should be fast)
    const { data, error } = await supabase.storage.listBuckets();
    
    const latency = Date.now() - startTime;
    
    if (error) {
      return {
        status: 'fail',
        latency,
        error: error.message,
      };
    }
    
    if (latency > THRESHOLDS.storage.fail) {
      return {
        status: 'fail',
        latency,
        error: `Storage response too slow: ${latency}ms`,
      };
    } else if (latency > THRESHOLDS.storage.warn) {
      return {
        status: 'warn',
        latency,
        details: { warning: `Slow storage response: ${latency}ms` },
      };
    }
    
    return {
      status: 'pass',
      latency,
      details: { bucketCount: data?.length || 0 },
    };
  } catch (error: unknown) {
    return {
      status: 'fail',
      latency: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function checkEdgeFunctionHealth(): HealthCheckItem {
  const startTime = Date.now();
  
  try {
    // Check memory usage via Deno API (performance.memory is Chrome-only)
    let usedMemory = 0;
    let totalMemory = 1;
    try {
      // Deno exposes memoryUsage() similar to Node.js process.memoryUsage()
      const mem = (Deno as any).memoryUsage?.();
      if (mem) {
        usedMemory = mem.heapUsed || 0;
        totalMemory = mem.heapTotal || 1;
      }
    } catch {
      // Fallback: memory API not available, report unknown
    }
    const memoryUtilization = totalMemory > 0 ? (usedMemory / totalMemory) * 100 : 0;
    
    const latency = Date.now() - startTime;
    
    if (memoryUtilization > 90) {
      return {
        status: 'fail',
        latency,
        error: `High memory usage: ${memoryUtilization.toFixed(1)}%`,
        details: { memoryUtilization, usedMemory, totalMemory },
      };
    } else if (memoryUtilization > 75) {
      return {
        status: 'warn',
        latency,
        details: { 
          warning: `Elevated memory usage: ${memoryUtilization.toFixed(1)}%`,
          memoryUtilization,
          usedMemory,
          totalMemory,
        },
      };
    }
    
    return {
      status: 'pass',
      latency,
      details: { memoryUtilization },
    };
  } catch (error: unknown) {
    return {
      status: 'fail',
      latency: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function performHealthCheck(): Promise<HealthCheckResult> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Run all health checks in parallel for efficiency
  const [database, auth, storage, edgeFunction] = await Promise.all([
    checkDatabaseHealth(supabase),
    checkAuthHealth(supabase),
    checkStorageHealth(supabase),
    checkEdgeFunctionHealth(),
  ]);
  
  // Determine overall status
  const allChecks = [database, auth, storage, edgeFunction];
  const hasFailures = allChecks.some(check => check.status === 'fail');
  const hasWarnings = allChecks.some(check => check.status === 'warn');
  
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
  if (hasFailures) {
    overallStatus = 'unhealthy';
  } else if (hasWarnings) {
    overallStatus = 'degraded';
  } else {
    overallStatus = 'healthy';
  }
  
  return {
    status: overallStatus,
    checks: {
      database,
      auth,
      storage,
      edgeFunction,
    },
    timestamp: new Date().toISOString(),
    version: (globalThis as any).Deno?.env?.get('SERVICE_VERSION') || 'unknown',
  };
}

export const healthCheckHandler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  if (req.method !== 'GET') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: { ...corsHeaders, 'Allow': 'GET, OPTIONS' }
    });
  }
  
  try {
    const healthResult = await Promise.race([
      performHealthCheck(),
      new Promise<HealthCheckResult>((_, reject) =>
        setTimeout(() => reject(new Error('Health check global deadline exceeded (5s)')), 5_000)
      ),
    ]);
    
    // Determine HTTP status code based on health
    let statusCode = 200;
    if (healthResult.status === 'degraded') {
      statusCode = 200; // Still serve traffic but indicate issues
    } else if (healthResult.status === 'unhealthy') {
      statusCode = 503; // Service unavailable
    }
    
    return new Response(JSON.stringify(healthResult, null, 2), {
      status: statusCode,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Status': healthResult.status,
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({
      status: 'unhealthy',
      error: 'Health check failed',
      message: error.message,
      timestamp: new Date().toISOString(),
    }, null, 2), {
      status: 503,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'X-Health-Status': 'unhealthy',
      },
    });
  }
};

// Start the server only if run as main
if (import.meta.main) {
  serve(healthCheckHandler);
}
