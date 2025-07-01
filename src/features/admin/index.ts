
// Admin feature barrel exports
export { default as AdminPage } from '@/pages/Admin';
export { CreditsManagement } from '@/components/admin/CreditsManagement';
export { TeamsManagement } from '@/components/admin/TeamsManagement';
export { useAdminMutations } from '@/hooks/useAdminMutations';

// Types
export type { 
  AdminUser, 
  UserCredits, 
  AdminTeam, 
  UserRole, 
  UserStatus 
} from '@/types/admin';
