import { z } from 'zod';

export const UseFeatureSchema = z.object({
  user_id: z.string().uuid('Invalid user ID format'),
  feature_name: z.string()
    .min(1, 'Feature name is required')
    .max(50, 'Feature name too long')
    .regex(/^[a-z_]+$/, 'Feature name must be lowercase with underscores only'),
  increment_by: z.number()
    .int('Increment must be an integer')
    .min(1, 'Increment must be at least 1')
    .max(10, 'Increment cannot exceed 10')
    .default(1),
});

export const CheckFeatureUsageSchema = z.object({
  user_id: z.string().uuid('Invalid user ID format'),
  feature_name: z.string()
    .min(1, 'Feature name is required')
    .max(50, 'Feature name too long'),
});

export const BulkFeatureUsageSchema = z.object({
  user_id: z.string().uuid('Invalid user ID format'),
  feature_names: z.array(z.string().min(1))
    .min(1, 'At least one feature name is required')
    .max(10, 'Cannot check more than 10 features at once'),
});

export const ResetFeatureUsageSchema = z.object({
  user_id: z.string().uuid('Invalid user ID format'),
  feature_name: z.string().min(1, 'Feature name is required'),
  admin_user_id: z.string().uuid('Invalid admin user ID format'),
});

// Common feature names used throughout the app
export const FEATURE_NAMES = {
  CONTENT_GENERATION: 'content_generation',
  INTEGRATIONS: 'integrations',
  TEAM_MEMBERS: 'team_members',
  AI_TEMPLATES: 'ai_templates',
  EXPORT_PDF: 'export_pdf',
  EXPORT_DOCX: 'export_docx',
  ANALYTICS: 'analytics',
  COLLABORATION: 'collaboration',
} as const;

export type FeatureName = typeof FEATURE_NAMES[keyof typeof FEATURE_NAMES];