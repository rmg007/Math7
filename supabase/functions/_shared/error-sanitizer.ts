// Error handling utilities to prevent information disclosure

export interface SanitizedError {
  message: string;
  code?: string;
  statusCode: number;
  timestamp: string;
  requestId?: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Creates a sanitized error response that doesn't leak sensitive information
 */
export function createSanitizedError(
  error: unknown, 
  statusCode: number = 500,
  requestId?: string
): Response {
  const sanitizedError = sanitizeError(error, statusCode, requestId);
  
  return new Response(
    JSON.stringify(sanitizedError),
    {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId || generateRequestId(),
        ...corsHeaders,
      },
    }
  );
}

/**
 * Sanitizes an error to prevent information disclosure
 */
export function sanitizeError(
  error: unknown, 
  statusCode: number = 500,
  requestId?: string
): SanitizedError {
  const timestamp = new Date().toISOString();
  
  // Don't expose internal errors in production
  if (statusCode >= 500) {
    return {
      message: 'An internal error occurred. Please try again later.',
      code: 'INTERNAL_ERROR',
      statusCode,
      timestamp,
      requestId,
    };
  }
  
  // For client errors (4xx), provide more context but still sanitize
  if (error instanceof Error) {
    // Remove any potential sensitive information from error messages
    let message = error.message;
    
    // Filter out common patterns that might leak information
    const sensitivePatterns = [
      /database/gi,
      /sql/gi,
      /password/gi,
      /token/gi,
      /secret/gi,
      /private.*key/gi,
      /internal/gi,
      /stack.*trace/gi,
    ];
    
    for (const pattern of sensitivePatterns) {
      message = message.replace(pattern, '[REDACTED]');
    }
    
    // Limit message length to prevent information leakage
    if (message.length > 200) {
      message = message.substring(0, 200) + '...';
    }
    
    return {
      message,
      code: error.constructor.name,
      statusCode,
      timestamp,
      requestId,
    };
  }
  
  // Fallback for non-Error objects
  return {
    message: 'An error occurred',
    code: 'UNKNOWN_ERROR',
    statusCode,
    timestamp,
    requestId,
  };
}

/**
 * Generates a unique request ID for tracking
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Wraps an async function with error sanitization
 */
export function withErrorSanitization<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  options: {
    statusCode?: number;
    includeRequestId?: boolean;
  } = {}
) {
  return async (...args: T): Promise<Response> => {
    const requestId = options.includeRequestId ? generateRequestId() : undefined;
    
    try {
      const result = await fn(...args);
      
      // If the result is already a Response, add request ID if needed
      if (result instanceof Response && requestId) {
        result.headers.set('X-Request-ID', requestId);
        return result;
      }
      
      // If the result is not a Response, wrap it
      if (result instanceof Response) {
        return result;
      }
      
      // For non-Response results, create a Response
      return new Response(JSON.stringify(result), {
        headers: {
          'Content-Type': 'application/json',
          ...(requestId && { 'X-Request-ID': requestId }),
          ...corsHeaders,
        },
      });
    } catch (error: any) {
      console.error('Error in sanitized function:', error);
      // EXPOSE INTERNAL ERROR FOR DEBUGGING
      return new Response(JSON.stringify({
        message: error.message || 'Internal Error',
        stack: error.stack,
        code: 'DEBUG_INTERNAL_ERROR'
      }), { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
        } 
      });
    }
  };
}

/**
 * Common error types with appropriate status codes
 */
export const ErrorTypes = {
  BAD_REQUEST: { statusCode: 400, code: 'BAD_REQUEST' },
  UNAUTHORIZED: { statusCode: 401, code: 'UNAUTHORIZED' },
  FORBIDDEN: { statusCode: 403, code: 'FORBIDDEN' },
  NOT_FOUND: { statusCode: 404, code: 'NOT_FOUND' },
  METHOD_NOT_ALLOWED: { statusCode: 405, code: 'METHOD_NOT_ALLOWED' },
  CONFLICT: { statusCode: 409, code: 'CONFLICT' },
  RATE_LIMITED: { statusCode: 429, code: 'RATE_LIMITED' },
  INTERNAL_ERROR: { statusCode: 500, code: 'INTERNAL_ERROR' },
  SERVICE_UNAVAILABLE: { statusCode: 503, code: 'SERVICE_UNAVAILABLE' },
} as const;

/**
 * Creates a specific type of sanitized error
 */
export function createSanitizedErrorResponse(
  type: keyof typeof ErrorTypes,
  message?: string,
  requestId?: string
): Response {
  const errorType = ErrorTypes[type];
  const sanitizedError: SanitizedError = {
    message: message || getDefaultMessage(type),
    code: errorType.code,
    statusCode: errorType.statusCode,
    timestamp: new Date().toISOString(),
    requestId,
  };
  
  return new Response(
    JSON.stringify(sanitizedError),
    {
      status: errorType.statusCode,
      headers: {
        'Content-Type': 'application/json',
        ...(requestId && { 'X-Request-ID': requestId }),
        ...corsHeaders,
      },
    }
  );
}

function getDefaultMessage(type: keyof typeof ErrorTypes): string {
  const messages = {
    BAD_REQUEST: 'Invalid request format or parameters',
    UNAUTHORIZED: 'Authentication required',
    FORBIDDEN: 'Access denied',
    NOT_FOUND: 'Resource not found',
    METHOD_NOT_ALLOWED: 'Method not allowed',
    CONFLICT: 'Resource conflict',
    RATE_LIMITED: 'Rate limit exceeded. Please try again later',
    INTERNAL_ERROR: 'An internal error occurred. Please try again later',
    SERVICE_UNAVAILABLE: 'Service temporarily unavailable',
  };
  
  return messages[type];
}
