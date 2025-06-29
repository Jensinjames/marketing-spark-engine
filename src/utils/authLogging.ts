
import { supabase } from '@/integrations/supabase/client';

export const logSecurityEvent = async (event: string, details: any) => {
  // Only log in development or if explicitly enabled
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Security] ${event}:`, details);
  }
  
  // In production, you would send this to your security monitoring service
  try {
    await supabase.rpc('audit_sensitive_operation', {
      p_action: event,
      p_table_name: 'auth_events',
      p_new_values: details
    });
  } catch (error) {
    // Silently fail audit logging to not disrupt user experience
    if (process.env.NODE_ENV === 'development') {
      console.warn('Failed to log security event:', error);
    }
  }
};
