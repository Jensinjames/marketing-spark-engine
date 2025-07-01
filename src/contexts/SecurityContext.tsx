import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { SecurityAuditLogger, DeviceFingerprinting, csrfProtection, authRateLimiter } from '@/utils/enhancedSecurity';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SecurityContextType {
  // CSRF Protection
  csrfToken: string | null;
  generateCSRFToken: () => string;
  validateCSRFToken: (token: string) => boolean;
  
  // Device Fingerprinting
  deviceFingerprint: string | null;
  clientInfo: any;
  
  // Rate Limiting
  checkRateLimit: (action: string, identifier?: string) => Promise<{
    allowed: boolean;
    remainingAttempts: number;
    resetTime: number;
  }>;
  
  // Security Event Logging
  logSecurityEvent: (action: string, details?: any, severity?: 'low' | 'medium' | 'high' | 'critical') => Promise<void>;
  
  // Suspicious Activity Detection
  suspiciousActivityDetected: boolean;
  securityAlerts: SecurityAlert[];
  dismissAlert: (alertId: string) => void;
  
  // Security Settings
  securitySettings: SecuritySettings;
  updateSecuritySettings: (settings: Partial<SecuritySettings>) => Promise<void>;
}

interface SecurityAlert {
  id: string;
  type: 'rate_limit' | 'suspicious_activity' | 'security_warning' | 'device_change';
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  details?: any;
}

interface SecuritySettings {
  enableDeviceTracking: boolean;
  enableLocationTracking: boolean;
  enableActivityLogging: boolean;
  alertOnNewDevice: boolean;
  alertOnSuspiciousActivity: boolean;
  sessionTimeout: number; // in minutes
}

const defaultSecuritySettings: SecuritySettings = {
  enableDeviceTracking: true,
  enableLocationTracking: false,
  enableActivityLogging: true,
  alertOnNewDevice: true,
  alertOnSuspiciousActivity: true,
  sessionTimeout: 60, // 1 hour
};

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export const useSecurityContext = () => {
  const context = useContext(SecurityContext);
  if (context === undefined) {
    throw new Error('useSecurityContext must be used within a SecurityProvider');
  }
  return context;
};

interface SecurityProviderProps {
  children: ReactNode;
}

export const SecurityProvider: React.FC<SecurityProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [deviceFingerprint, setDeviceFingerprint] = useState<string | null>(null);
  const [clientInfo, setClientInfo] = useState<any>(null);
  const [suspiciousActivityDetected, setSuspiciousActivityDetected] = useState(false);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>(defaultSecuritySettings);
  const [sessionStartTime] = useState(Date.now());

  // Initialize security context
  useEffect(() => {
    initializeSecurity();
  }, []);

  // Monitor user changes
  useEffect(() => {
    if (user) {
      handleUserLogin();
      loadUserSecuritySettings();
    } else {
      handleUserLogout();
    }
  }, [user]);

  // Session timeout monitoring
  useEffect(() => {
    if (user && securitySettings.sessionTimeout > 0) {
      const timeoutId = setTimeout(() => {
        handleSessionTimeout();
      }, securitySettings.sessionTimeout * 60 * 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [user, securitySettings.sessionTimeout]);

  const initializeSecurity = async () => {
    try {
      // Generate CSRF token
      const token = csrfProtection.generateToken();
      setCsrfToken(token);

      // Generate device fingerprint
      const fingerprint = await DeviceFingerprinting.generateFingerprint();
      setDeviceFingerprint(fingerprint);

      // Get enhanced client info
      const info = await DeviceFingerprinting.getEnhancedClientInfo();
      setClientInfo(info);

      // Log security initialization
      await SecurityAuditLogger.logSecurityEvent('security_context_initialized', {
        device_fingerprint: fingerprint,
        client_info: info
      }, 'low');

    } catch (error) {
      console.error('Failed to initialize security context:', error);
      addSecurityAlert('security_warning', 'Failed to initialize security features', 'medium');
    }
  };

  const handleUserLogin = async () => {
    try {
      if (!deviceFingerprint || !user) return;

      // Check if this is a new device
      const { data: knownDevices } = await supabase
        .from('user_devices')
        .select('device_fingerprint, last_seen')
        .eq('user_id', user.id)
        .eq('device_fingerprint', deviceFingerprint);

      const isNewDevice = !knownDevices || knownDevices.length === 0;

      if (isNewDevice && securitySettings.alertOnNewDevice) {
        addSecurityAlert(
          'device_change',
          'Login detected from a new device',
          'medium',
          { device_fingerprint: deviceFingerprint, client_info: clientInfo }
        );
      }

      // Record device login
      await supabase
        .from('user_devices')
        .upsert({
          user_id: user.id,
          device_fingerprint: deviceFingerprint,
          device_info: clientInfo,
          last_seen: new Date().toISOString(),
          is_trusted: !isNewDevice
        });

      // Log login event
      await SecurityAuditLogger.logSecurityEvent('user_login_success', {
        device_fingerprint: deviceFingerprint,
        is_new_device: isNewDevice,
        login_time: new Date().toISOString()
      }, isNewDevice ? 'medium' : 'low');

    } catch (error) {
      console.error('Failed to handle user login security:', error);
    }
  };

  const handleUserLogout = async () => {
    try {
      if (user && deviceFingerprint) {
        await SecurityAuditLogger.logSecurityEvent('user_logout', {
          device_fingerprint: deviceFingerprint,
          session_duration: Date.now() - sessionStartTime
        }, 'low');
      }

      // Clear security state
      setCsrfToken(null);
      setSecurityAlerts([]);
      setSuspiciousActivityDetected(false);

    } catch (error) {
      console.error('Failed to handle user logout security:', error);
    }
  };

  const handleSessionTimeout = async () => {
    try {
      await SecurityAuditLogger.logSecurityEvent('session_timeout', {
        session_duration: Date.now() - sessionStartTime,
        timeout_setting: securitySettings.sessionTimeout
      }, 'low');

      // Sign out user
      await supabase.auth.signOut();
      
      toast.warning('Session expired for security reasons. Please sign in again.', {
        duration: 5000
      });

    } catch (error) {
      console.error('Failed to handle session timeout:', error);
    }
  };

  const loadUserSecuritySettings = async () => {
    try {
      if (!user) return;

      const { data: settings } = await supabase
        .from('user_security_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (settings) {
        setSecuritySettings({
          enableDeviceTracking: settings.enable_device_tracking ?? defaultSecuritySettings.enableDeviceTracking,
          enableLocationTracking: settings.enable_location_tracking ?? defaultSecuritySettings.enableLocationTracking,
          enableActivityLogging: settings.enable_activity_logging ?? defaultSecuritySettings.enableActivityLogging,
          alertOnNewDevice: settings.alert_on_new_device ?? defaultSecuritySettings.alertOnNewDevice,
          alertOnSuspiciousActivity: settings.alert_on_suspicious_activity ?? defaultSecuritySettings.alertOnSuspiciousActivity,
          sessionTimeout: settings.session_timeout ?? defaultSecuritySettings.sessionTimeout,
        });
      }

    } catch (error) {
      console.error('Failed to load user security settings:', error);
    }
  };

  const generateCSRFToken = (): string => {
    const token = csrfProtection.generateToken(user?.id);
    setCsrfToken(token);
    return token;
  };

  const validateCSRFToken = (token: string): boolean => {
    return csrfProtection.validateToken(token, user?.id);
  };

  const checkRateLimit = async (action: string, identifier?: string): Promise<{
    allowed: boolean;
    remainingAttempts: number;
    resetTime: number;
  }> => {
    try {
      const id = identifier || user?.id || deviceFingerprint || 'anonymous';
      const result = await authRateLimiter.isLimited(id);

      if (result.limited) {
        addSecurityAlert(
          'rate_limit',
          `Rate limit exceeded for action: ${action}`,
          'medium',
          { action, attempts: result.totalAttempts }
        );
      }

      return {
        allowed: !result.limited,
        remainingAttempts: result.remainingAttempts,
        resetTime: result.resetTime
      };

    } catch (error) {
      console.error('Rate limit check failed:', error);
      return { allowed: true, remainingAttempts: 0, resetTime: 0 };
    }
  };

  const logSecurityEvent = async (
    action: string,
    details?: any,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<void> => {
    try {
      await SecurityAuditLogger.logSecurityEvent(action, details, severity);

      // Check for suspicious activity patterns
      if (severity === 'high' || severity === 'critical') {
        setSuspiciousActivityDetected(true);
        
        if (securitySettings.alertOnSuspiciousActivity) {
          addSecurityAlert(
            'suspicious_activity',
            `Suspicious activity detected: ${action}`,
            severity,
            details
          );
        }
      }

    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  };

  const addSecurityAlert = (
    type: SecurityAlert['type'],
    message: string,
    severity: SecurityAlert['severity'],
    details?: any
  ) => {
    const alert: SecurityAlert = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      message,
      severity,
      timestamp: new Date().toISOString(),
      details
    };

    setSecurityAlerts(prev => [alert, ...prev.slice(0, 9)]); // Keep last 10 alerts

    // Show toast for high severity alerts
    if (severity === 'high' || severity === 'critical') {
      toast.error(message, { duration: 8000 });
    } else if (severity === 'medium') {
      toast.warning(message, { duration: 5000 });
    }
  };

  const dismissAlert = (alertId: string) => {
    setSecurityAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const updateSecuritySettings = async (newSettings: Partial<SecuritySettings>): Promise<void> => {
    try {
      if (!user) throw new Error('User must be logged in to update security settings');

      const updatedSettings = { ...securitySettings, ...newSettings };
      setSecuritySettings(updatedSettings);

      // Save to database
      await supabase
        .from('user_security_settings')
        .upsert({
          user_id: user.id,
          enable_device_tracking: updatedSettings.enableDeviceTracking,
          enable_location_tracking: updatedSettings.enableLocationTracking,
          enable_activity_logging: updatedSettings.enableActivityLogging,
          alert_on_new_device: updatedSettings.alertOnNewDevice,
          alert_on_suspicious_activity: updatedSettings.alertOnSuspiciousActivity,
          session_timeout: updatedSettings.sessionTimeout,
          updated_at: new Date().toISOString()
        });

      await logSecurityEvent('security_settings_updated', newSettings, 'low');
      
      toast.success('Security settings updated successfully');

    } catch (error) {
      console.error('Failed to update security settings:', error);
      toast.error('Failed to update security settings');
      throw error;
    }
  };

  const contextValue: SecurityContextType = {
    csrfToken,
    generateCSRFToken,
    validateCSRFToken,
    deviceFingerprint,
    clientInfo,
    checkRateLimit,
    logSecurityEvent,
    suspiciousActivityDetected,
    securityAlerts,
    dismissAlert,
    securitySettings,
    updateSecuritySettings,
  };

  return (
    <SecurityContext.Provider value={contextValue}>
      {children}
    </SecurityContext.Provider>
  );
};

// HOC for components that need security protection
export const withSecurityProtection = <P extends object>(
  Component: React.ComponentType<P>,
  options: {
    requireCSRF?: boolean;
    logAccess?: boolean;
    actionName?: string;
  } = {}
) => {
  return React.forwardRef<any, P>((props, ref) => {
    const security = useSecurityContext();
    
    useEffect(() => {
      if (options.logAccess && options.actionName) {
        security.logSecurityEvent(`component_access_${options.actionName}`, {
          component: Component.name
        }, 'low');
      }
    }, []);

    // Generate CSRF token if required
    useEffect(() => {
      if (options.requireCSRF && !security.csrfToken) {
        security.generateCSRFToken();
      }
    }, [security.csrfToken]);

    return <Component {...props} ref={ref} />;
  });
};

export default SecurityProvider;