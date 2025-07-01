
export type TeamRole = 'owner' | 'admin' | 'editor' | 'viewer';

export const TeamPermissions = {
  canManageTeam: (role: TeamRole): boolean => {
    return role === 'owner';
  },

  canManageMembers: (role: TeamRole): boolean => {
    return ['owner', 'admin'].includes(role);
  },

  canEditContent: (role: TeamRole): boolean => {
    return ['owner', 'admin', 'editor'].includes(role);
  },

  canViewContent: (role: TeamRole): boolean => {
    return ['owner', 'admin', 'editor', 'viewer'].includes(role);
  },

  canUpdateMemberRole: (currentRole: TeamRole, targetRole: TeamRole): boolean => {
    if (currentRole !== 'owner') return false;
    return targetRole !== 'owner';
  },

  canRemoveMember: (currentRole: TeamRole, targetRole: TeamRole): boolean => {
    if (currentRole !== 'owner') return false;
    return targetRole !== 'owner';
  },

  getRoleHierarchy: (): TeamRole[] => {
    return ['owner', 'admin', 'editor', 'viewer'];
  },

  getRoleDisplayName: (role: TeamRole): string => {
    const roleNames = {
      owner: 'Owner',
      admin: 'Administrator',
      editor: 'Editor',
      viewer: 'Viewer'
    };
    return roleNames[role];
  }
};
