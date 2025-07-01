import { z } from 'zod';

// Base validation schemas
export const uuidSchema = z.string().uuid('Invalid UUID format');
export const emailSchema = z.string().email('Invalid email format').max(254, 'Email too long');
export const nonEmptyStringSchema = z.string().min(1, 'Field cannot be empty').trim();

// Team role enum
export const teamRoleSchema = z.enum(['owner', 'admin', 'editor', 'viewer'], {
  errorMap: () => ({ message: 'Role must be owner, admin, editor, or viewer' })
});

// Invitation status enum  
export const invitationStatusSchema = z.enum(['pending', 'accepted', 'expired', 'cancelled'], {
  errorMap: () => ({ message: 'Status must be pending, accepted, expired, or cancelled' })
});

// Email delivery status enum
export const emailDeliveryStatusSchema = z.enum(['queued', 'sent', 'delivered', 'bounced', 'failed', 'unsubscribed'], {
  errorMap: () => ({ message: 'Invalid email delivery status' })
});

// Team management schemas
export const createTeamSchema = z.object({
  name: z.string()
    .min(1, 'Team name is required')
    .max(100, 'Team name must be 100 characters or less')
    .trim()
    .refine(val => val.length > 0, 'Team name cannot be empty'),
  description: z.string()
    .max(500, 'Description must be 500 characters or less')
    .optional()
    .transform(val => val?.trim() || null)
});

export const updateTeamSchema = z.object({
  team_id: uuidSchema,
  name: z.string()
    .min(1, 'Team name is required')
    .max(100, 'Team name must be 100 characters or less')
    .trim()
    .optional(),
  description: z.string()
    .max(500, 'Description must be 500 characters or less')
    .optional()
    .transform(val => val?.trim() || null)
});

// Team invitation schemas
export const sendTeamInvitationSchema = z.object({
  team_id: uuidSchema,
  emails: z.array(emailSchema)
    .min(1, 'At least one email is required')
    .max(10, 'Maximum 10 emails allowed per invitation')
    .refine(emails => {
      const unique = new Set(emails.map(e => e.toLowerCase()));
      return unique.size === emails.length;
    }, 'Duplicate emails are not allowed'),
  role: teamRoleSchema,
  message: z.string()
    .max(500, 'Message must be 500 characters or less')
    .optional()
    .transform(val => val?.trim() || null)
});

export const acceptInvitationSchema = z.object({
  invitation_token: z.string()
    .min(1, 'Invitation token is required')
    .max(255, 'Invalid invitation token')
});

export const resendInvitationSchema = z.object({
  invitation_id: uuidSchema
});

// Team member management schemas
export const updateMemberRoleSchema = z.object({
  team_id: uuidSchema,
  member_id: uuidSchema,
  new_role: teamRoleSchema
});

export const removeMemberSchema = z.object({
  team_id: uuidSchema,
  member_id: uuidSchema
});

export const updateMemberCreditsSchema = z.object({
  team_id: uuidSchema,
  member_id: uuidSchema,
  credits_limit: z.number()
    .int('Credits limit must be an integer')
    .min(0, 'Credits limit cannot be negative')
    .max(10000, 'Credits limit cannot exceed 10,000')
});

// Bulk operations schemas
export const bulkMemberActionSchema = z.object({
  team_id: uuidSchema,
  member_ids: z.array(uuidSchema)
    .min(1, 'At least one member must be selected')
    .max(50, 'Maximum 50 members allowed per bulk operation'),
  action: z.enum(['remove', 'change_role', 'update_credits'], {
    errorMap: () => ({ message: 'Action must be remove, change_role, or update_credits' })
  }),
  new_role: teamRoleSchema.optional(),
  credits_limit: z.number()
    .int('Credits limit must be an integer')
    .min(0, 'Credits limit cannot be negative')
    .max(10000, 'Credits limit cannot exceed 10,000')
    .optional()
}).refine(data => {
  if (data.action === 'change_role' && !data.new_role) {
    return false;
  }
  if (data.action === 'update_credits' && typeof data.credits_limit !== 'number') {
    return false;
  }
  return true;
}, {
  message: 'new_role is required for change_role action, credits_limit is required for update_credits action'
});

// Admin schemas
export const adminTeamActionSchema = z.object({
  team_id: uuidSchema,
  action: z.enum(['delete', 'suspend', 'activate', 'view_details'], {
    errorMap: () => ({ message: 'Invalid admin action' })
  }),
  reason: z.string()
    .max(500, 'Reason must be 500 characters or less')
    .optional()
    .transform(val => val?.trim() || null)
});

export const adminUserActionSchema = z.object({
  user_id: uuidSchema,
  action: z.enum(['suspend', 'activate', 'reset_credits', 'view_details'], {
    errorMap: () => ({ message: 'Invalid admin action' })
  }),
  reason: z.string()
    .max(500, 'Reason must be 500 characters or less')
    .optional()
    .transform(val => val?.trim() || null),
  credits_amount: z.number()
    .int('Credits amount must be an integer')
    .min(0, 'Credits amount cannot be negative')
    .max(10000, 'Credits amount cannot exceed 10,000')
    .optional()
});

// Email unsubscribe schemas
export const unsubscribeEmailSchema = z.object({
  email: emailSchema,
  reason: z.enum([
    'too_many_emails',
    'not_relevant', 
    'never_signed_up',
    'privacy_concerns',
    'technical_issues',
    'other'
  ]).optional(),
  feedback: z.string()
    .max(500, 'Feedback must be 500 characters or less')
    .optional()
    .transform(val => val?.trim() || null)
});

// Rate limiting schemas
export const rateLimitCheckSchema = z.object({
  action_type: z.string().min(1, 'Action type is required'),
  user_id: uuidSchema.optional(),
  ip_address: z.string().ip('Invalid IP address').optional()
}).refine(data => data.user_id || data.ip_address, {
  message: 'Either user_id or ip_address must be provided'
});

// Analytics and reporting schemas
export const teamAnalyticsSchema = z.object({
  team_id: uuidSchema,
  date_range: z.object({
    start_date: z.string().datetime('Invalid start date format'),
    end_date: z.string().datetime('Invalid end date format')
  }).refine(data => new Date(data.start_date) <= new Date(data.end_date), {
    message: 'Start date must be before or equal to end date'
  }).optional(),
  metrics: z.array(z.enum([
    'member_count',
    'credits_usage', 
    'content_generation',
    'activity_log',
    'invitation_stats'
  ])).optional()
});

// Pagination schemas
export const paginationSchema = z.object({
  page: z.number().int().min(1, 'Page must be at least 1').default(1),
  limit: z.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(10),
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});

// Search and filtering schemas
export const teamSearchSchema = z.object({
  query: z.string().max(100, 'Search query too long').optional(),
  filters: z.object({
    role: teamRoleSchema.optional(),
    status: z.enum(['active', 'inactive', 'pending']).optional(),
    created_after: z.string().datetime().optional(),
    created_before: z.string().datetime().optional()
  }).optional(),
  ...paginationSchema.shape
});

// Input sanitization helpers
export const sanitizeString = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

export const sanitizeHtml = (input: string): string => {
  // Basic HTML sanitization - in production, use a proper library like DOMPurify
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// Validation error formatter
export const formatValidationErrors = (errors: z.ZodError) => {
  return errors.errors.map(error => ({
    field: error.path.join('.'),
    message: error.message,
    code: error.code
  }));
};

// Generic API response validation
export const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  errors: z.array(z.object({
    field: z.string(),
    message: z.string()
  })).optional(),
  meta: z.object({
    page: z.number().optional(),
    limit: z.number().optional(),
    total: z.number().optional(),
    total_pages: z.number().optional()
  }).optional()
});

// Environment-specific validation
export const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key is required'),
  RESEND_API_KEY: z.string().min(1, 'Resend API key is required').optional()
});

// Export commonly used validation functions
export const validateTeamInvitation = (data: unknown) => sendTeamInvitationSchema.parse(data);
export const validateMemberUpdate = (data: unknown) => updateMemberRoleSchema.parse(data);
export const validateBulkAction = (data: unknown) => bulkMemberActionSchema.parse(data);
export const validateEmailUnsubscribe = (data: unknown) => unsubscribeEmailSchema.parse(data);

// Type exports for TypeScript usage
export type SendTeamInvitationInput = z.infer<typeof sendTeamInvitationSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
export type BulkMemberActionInput = z.infer<typeof bulkMemberActionSchema>;
export type UnsubscribeEmailInput = z.infer<typeof unsubscribeEmailSchema>;
export type TeamAnalyticsInput = z.infer<typeof teamAnalyticsSchema>;
export type ApiResponse = z.infer<typeof apiResponseSchema>;