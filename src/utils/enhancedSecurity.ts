import { z } from 'zod';
import DOMPurify from 'dompurify';
import { supabase } from '@/integrations/supabase/client';

// Enhanced security configuration
export const SECURITY_CONFIG = {
  RATE_LIMITS: {
    LOGIN_ATTEMPTS: { max: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
    API_REQUESTS: { max: 100, windowMs: 60 * 60 * 1000 }, // 100 requests per hour
    TEAM_INVITATIONS: { max: 20, windowMs: 60 * 60 * 1000 }, // 20 invitations per hour
    PASSWORD_RESET: { max: 3, windowMs: 60 * 60 * 1000 }, // 3 resets per hour
  },
  CSRF: {
    TOKEN_LENGTH: 32,
    TOKEN_EXPIRY: 60 * 60 * 1000, // 1 hour
  },
  INPUT_VALIDATION: {
    MAX_STRING_LENGTH: 10000,
    MAX_EMAIL_LENGTH: 254,
    MAX_NAME_LENGTH: 100,
    MAX_MESSAGE_LENGTH: 5000,
  },
  SUSPICIOUS_ACTIVITY: {
    MAX_FAILED_ATTEMPTS: 10,
    LOCKOUT_DURATION: 24 * 60 * 60 * 1000, // 24 hours
  }
} as const;

// Enhanced rate limiting class with database persistence
export class EnhancedRateLimiter {
  private localCache: Map<string, { count: number; firstAttempt: number; lastAttempt: number }> = new Map();
  
  constructor(
    private maxAttempts: number = 5,
    private windowMs: number = 15 * 60 * 1000,
    private actionType: string = 'default'
  ) {}

  async isLimited(identifier: string, useDatabase: boolean = true): Promise<{
    limited: boolean;
    remainingAttempts: number;
    resetTime: number;
    totalAttempts: number;
  }> {
    const now = Date.now();
    
    try {
      if (useDatabase) {
        // Check database rate limits
        const { data: rateLimit } = await supabase
          .from('rate_limits')
          .select('*')
          .eq('action_type', this.actionType)
          .or(`user_id.eq.${identifier},ip_address.eq.${identifier}`)
          .gte('window_start', new Date(now - this.windowMs).toISOString())
          .order('window_start', { ascending: false })
          .limit(1)
          .single();

        if (rateLimit && rateLimit.attempts >= this.maxAttempts) {
          const resetTime = new Date(rateLimit.window_start).getTime() + this.windowMs;
          return {
            limited: true,
            remainingAttempts: 0,
            resetTime,
            totalAttempts: rateLimit.attempts
          };
        }
      }

      // Check local cache as fallback
      const localEntry = this.localCache.get(identifier);
      if (localEntry) {
        if (now - localEntry.firstAttempt > this.windowMs) {
          // Window expired, reset
          this.localCache.delete(identifier);
        } else if (localEntry.count >= this.maxAttempts) {
          return {
            limited: true,
            remainingAttempts: 0,
            resetTime: localEntry.firstAttempt + this.windowMs,
            totalAttempts: localEntry.count
          };
        }
      }

      const remaining = this.maxAttempts - (localEntry?.count || 0);
      return {
        limited: false,
        remainingAttempts: remaining,
        resetTime: now + this.windowMs,
        totalAttempts: localEntry?.count || 0
      };

    } catch (error) {
      console.error('Rate limit check failed:', error);
      // Fallback to local cache on database error
      return this.checkLocalCache(identifier, now);
    }
  }

  private checkLocalCache(identifier: string, now: number) {
    const localEntry = this.localCache.get(identifier);
    if (!localEntry || now - localEntry.firstAttempt > this.windowMs) {
      return {
        limited: false,
        remainingAttempts: this.maxAttempts,
        resetTime: now + this.windowMs,
        totalAttempts: 0
      };
    }

    const remaining = this.maxAttempts - localEntry.count;
    return {
      limited: localEntry.count >= this.maxAttempts,
      remainingAttempts: Math.max(0, remaining),
      resetTime: localEntry.firstAttempt + this.windowMs,
      totalAttempts: localEntry.count
    };
  }

  async recordAttempt(identifier: string, success: boolean = false, useDatabase: boolean = true): Promise<void> {
    const now = Date.now();
    
    try {
      if (useDatabase) {
        if (success) {
          // Clear rate limit on success
          await supabase
            .from('rate_limits')
            .delete()
            .eq('action_type', this.actionType)
            .or(`user_id.eq.${identifier},ip_address.eq.${identifier}`);
        } else {
          // Record failed attempt
          await supabase
            .from('rate_limits')
            .upsert({
              user_id: identifier.includes('@') ? null : identifier,
              ip_address: identifier.includes('.') ? identifier : null,
              action_type: this.actionType,
              attempts: 1,
              window_start: new Date().toISOString()
            }, {
              onConflict: 'user_id,ip_address,action_type',
              ignoreDuplicates: false
            });
        }
      }

      // Update local cache
      if (success) {
        this.localCache.delete(identifier);
      } else {
        const existing = this.localCache.get(identifier);
        if (!existing || now - existing.firstAttempt > this.windowMs) {
          this.localCache.set(identifier, {
            count: 1,
            firstAttempt: now,
            lastAttempt: now
          });
        } else {
          this.localCache.set(identifier, {
            ...existing,
            count: existing.count + 1,
            lastAttempt: now
          });
        }
      }

    } catch (error) {
      console.error('Failed to record rate limit attempt:', error);
      // Continue with local cache update even if database fails
    }
  }
}

// CSRF Protection
class CSRFProtection {
  private tokens: Map<string, { token: string; expires: number }> = new Map();

  generateToken(sessionId?: string): string {
    const token = Array.from(crypto.getRandomValues(new Uint8Array(SECURITY_CONFIG.CSRF.TOKEN_LENGTH)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    const expires = Date.now() + SECURITY_CONFIG.CSRF.TOKEN_EXPIRY;
    const key = sessionId || 'default';
    
    this.tokens.set(key, { token, expires });
    
    // Clean up expired tokens
    this.cleanupExpiredTokens();
    
    return token;
  }

  validateToken(token: string, sessionId?: string): boolean {
    const key = sessionId || 'default';
    const stored = this.tokens.get(key);
    
    if (!stored || stored.expires < Date.now()) {
      this.tokens.delete(key);
      return false;
    }
    
    return stored.token === token;
  }

  private cleanupExpiredTokens() {
    const now = Date.now();
    for (const [key, value] of this.tokens.entries()) {
      if (value.expires < now) {
        this.tokens.delete(key);
      }
    }
  }
}

export const csrfProtection = new CSRFProtection();

// Enhanced input sanitization
export class InputSanitizer {
  static sanitizeString(input: string, options: {
    maxLength?: number;
    allowHtml?: boolean;
    stripWhitespace?: boolean;
  } = {}): string {
    if (!input || typeof input !== 'string') return '';
    
    let sanitized = input;
    
    // Length check
    if (options.maxLength && sanitized.length > options.maxLength) {
      sanitized = sanitized.substring(0, options.maxLength);
    }
    
    // Strip whitespace
    if (options.stripWhitespace !== false) {
      sanitized = sanitized.trim();
    }
    
    // HTML sanitization
    if (options.allowHtml) {
      sanitized = DOMPurify.sanitize(sanitized, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
        ALLOWED_ATTR: []
      });
    } else {
      sanitized = DOMPurify.sanitize(sanitized, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
    }
    
    return sanitized;
  }

  static sanitizeEmail(email: string): string {
    return this.sanitizeString(email, { 
      maxLength: SECURITY_CONFIG.INPUT_VALIDATION.MAX_EMAIL_LENGTH,
      stripWhitespace: true 
    }).toLowerCase();
  }

  static sanitizeUserInput(input: any): any {
    if (typeof input === 'string') {
      return this.sanitizeString(input, { maxLength: SECURITY_CONFIG.INPUT_VALIDATION.MAX_STRING_LENGTH });
    }
    
    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeUserInput(item));
    }
    
    if (input && typeof input === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(input)) {
        const sanitizedKey = this.sanitizeString(key, { maxLength: 100 });
        sanitized[sanitizedKey] = this.sanitizeUserInput(value);
      }
      return sanitized;
    }
    
    return input;
  }
}

// Device fingerprinting
export class DeviceFingerprinting {
  static async generateFingerprint(): Promise<string> {
    const components = [
      navigator.userAgent,
      navigator.language,
      navigator.platform,
      screen.width + 'x' + screen.height + 'x' + screen.colorDepth,
      new Date().getTimezoneOffset(),
      navigator.hardwareConcurrency || 'unknown',
      navigator.deviceMemory || 'unknown'
    ];
    
    // Add canvas fingerprint
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('Device fingerprint test', 2, 2);
        components.push(canvas.toDataURL());
      }
    } catch (e) {
      components.push('canvas-error');
    }
    
    const fingerprint = components.join('|');
    
    // Hash the fingerprint
    const encoder = new TextEncoder();
    const data = encoder.encode(fingerprint);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  static async getEnhancedClientInfo() {
    const fingerprint = await this.generateFingerprint();
    
    return {
      fingerprint,
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screen: {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth
      },
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timezoneOffset: new Date().getTimezoneOffset(),
      hardware: {
        concurrency: navigator.hardwareConcurrency || null,
        memory: (navigator as any).deviceMemory || null
      },
      connection: (navigator as any).connection ? {
        effectiveType: (navigator as any).connection.effectiveType,
        downlink: (navigator as any).connection.downlink
      } : null,
      timestamp: new Date().toISOString()
    };
  }
}

// Enhanced audit logging
export class SecurityAuditLogger {
  static async logSecurityEvent(
    action: string,
    details: Record<string, any> = {},
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<void> {
    try {
      const clientInfo = await DeviceFingerprinting.getEnhancedClientInfo();
      const { data: { user } } = await supabase.auth.getUser();
      
      const auditLog = {
        action,
        severity,
        user_id: user?.id || null,
        ip_address: await this.getClientIP(),
        user_agent: navigator.userAgent,
        device_fingerprint: clientInfo.fingerprint,
        client_info: clientInfo,
        details: InputSanitizer.sanitizeUserInput(details),
        url: window.location.href,
        referrer: document.referrer || null,
        timestamp: new Date().toISOString()
      };

      // Log to audit system
      await supabase.rpc('audit_sensitive_operation', {
        p_action: action,
        p_table_name: 'security_events',
        p_new_values: auditLog
      });

      // Check for suspicious activity patterns
      await this.checkSuspiciousActivity(auditLog);

    } catch (error) {
      console.error('Failed to log security event:', error);
      // Fallback to local logging
      console.warn('Security Event (local):', { action, details, severity });
    }
  }

  private static async getClientIP(): Promise<string | null> {
    try {
      // Try to get IP from various headers (this will work if set by proxy)
      const response = await fetch('/api/ip', { method: 'GET' });
      if (response.ok) {
        const data = await response.json();
        return data.ip;
      }
    } catch (e) {
      // Fallback: IP will be captured server-side
    }
    return null;
  }

  private static async checkSuspiciousActivity(auditLog: any): Promise<void> {
    try {
      // Check for rapid failed login attempts
      if (auditLog.action.includes('login_failed')) {
        const { data: recentFailures } = await supabase
          .from('security_events')
          .select('id')
          .eq('action', auditLog.action)
          .eq('device_fingerprint', auditLog.device_fingerprint)
          .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Last hour
          .limit(10);

        if (recentFailures && recentFailures.length >= 5) {
          await this.logSecurityEvent('suspicious_activity_detected', {
            type: 'rapid_failed_logins',
            count: recentFailures.length,
            device_fingerprint: auditLog.device_fingerprint
          }, 'high');
        }
      }

      // Check for unusual access patterns
      if (auditLog.action.includes('team_invitation') || auditLog.action.includes('admin_action')) {
        const { data: recentActions } = await supabase
          .from('security_events')
          .select('id, details')
          .eq('user_id', auditLog.user_id)
          .gte('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString()) // Last 10 minutes
          .limit(20);

        if (recentActions && recentActions.length >= 15) {
          await this.logSecurityEvent('suspicious_activity_detected', {
            type: 'unusual_activity_volume',
            count: recentActions.length,
            user_id: auditLog.user_id
          }, 'medium');
        }
      }

    } catch (error) {
      console.error('Failed to check suspicious activity:', error);
    }
  }
}

// Enhanced validation schemas with security checks
export const securityValidationSchemas = {
  userInput: z.string()
    .max(SECURITY_CONFIG.INPUT_VALIDATION.MAX_STRING_LENGTH)
    .refine(val => !val.includes('<script'), 'Potential XSS detected')
    .refine(val => !val.includes('javascript:'), 'Potential XSS detected')
    .transform(val => InputSanitizer.sanitizeString(val)),
    
  email: z.string()
    .email('Invalid email format')
    .max(SECURITY_CONFIG.INPUT_VALIDATION.MAX_EMAIL_LENGTH)
    .transform(val => InputSanitizer.sanitizeEmail(val)),
    
  csrfToken: z.string()
    .length(SECURITY_CONFIG.CSRF.TOKEN_LENGTH * 2) // Hex representation
    .regex(/^[a-f0-9]+$/, 'Invalid CSRF token format')
};

// Middleware for API request security
export const createSecurityMiddleware = (actionType: string) => {
  const rateLimiter = new EnhancedRateLimiter(
    SECURITY_CONFIG.RATE_LIMITS.API_REQUESTS.max,
    SECURITY_CONFIG.RATE_LIMITS.API_REQUESTS.windowMs,
    actionType
  );

  return async (identifier: string, data?: any) => {
    // Rate limiting check
    const rateLimitResult = await rateLimiter.isLimited(identifier);
    if (rateLimitResult.limited) {
      await SecurityAuditLogger.logSecurityEvent('rate_limit_exceeded', {
        action_type: actionType,
        identifier,
        attempts: rateLimitResult.totalAttempts
      }, 'medium');
      
      throw new Error(`Rate limit exceeded. Try again in ${Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)} seconds.`);
    }

    // Input sanitization
    const sanitizedData = data ? InputSanitizer.sanitizeUserInput(data) : undefined;

    return { sanitizedData, rateLimiter, identifier };
  };
};

// Export rate limiters for specific use cases
export const authRateLimiter = new EnhancedRateLimiter(
  SECURITY_CONFIG.RATE_LIMITS.LOGIN_ATTEMPTS.max,
  SECURITY_CONFIG.RATE_LIMITS.LOGIN_ATTEMPTS.windowMs,
  'auth_attempt'
);

export const invitationRateLimiter = new EnhancedRateLimiter(
  SECURITY_CONFIG.RATE_LIMITS.TEAM_INVITATIONS.max,
  SECURITY_CONFIG.RATE_LIMITS.TEAM_INVITATIONS.windowMs,
  'send_invitation'
);

export const passwordResetRateLimiter = new EnhancedRateLimiter(
  SECURITY_CONFIG.RATE_LIMITS.PASSWORD_RESET.max,
  SECURITY_CONFIG.RATE_LIMITS.PASSWORD_RESET.windowMs,
  'password_reset'
);