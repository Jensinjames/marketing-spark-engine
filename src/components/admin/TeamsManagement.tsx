
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { useDebounced } from '@/hooks/useDebounced';
import { SearchInput } from './SearchInput';
import { TeamsManagementHeader } from './TeamsManagementHeader';
import { TeamsTable } from './TeamsTable';

export const TeamsManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounced(searchTerm, 300);
  const queryClient = useQueryClient();

  // Fetch all teams with member counts and owner info - optimized query
  const { data: teams, isLoading } = useQuery({
    queryKey: ['admin-teams'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select(`
          id,
          name,
          created_at,
          profiles!fk_teams_profiles(full_name, email),
          team_members(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes for admin data
  });

  const deleteTeamMutation = useMutation({
    mutationFn: async (teamId: string) => {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);

      if (error) throw error;

      // Log the admin action
      await supabase.rpc('audit_sensitive_operation', {
        p_action: 'admin_delete_team',
        p_table_name: 'teams',
        p_record_id: teamId,
        p_new_values: { deleted_at: new Date().toISOString() }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-teams'] });
      toast.success('Team deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete team');
      console.error('Delete team error:', error);
    },
  });

  // Memoized filtered teams to avoid re-computation on every render
  const filteredTeams = useMemo(() => {
    if (!teams) return [];
    
    if (!debouncedSearchTerm) return teams;
    
    const searchLower = debouncedSearchTerm.toLowerCase();
    return teams.filter(team =>
      team.name.toLowerCase().includes(searchLower) ||
      team.profiles?.email?.toLowerCase().includes(searchLower) ||
      team.profiles?.full_name?.toLowerCase().includes(searchLower)
    );
  }, [teams, debouncedSearchTerm]);

  const handleEditTeam = (teamId: string) => {
    // Navigate to team details - we'll implement this later
    console.log('View team details:', teamId);
  };

  const handleDeleteTeam = (teamId: string) => {
    deleteTeamMutation.mutate(teamId);
  };

  if (isLoading) {
    return (
      <Card>
        <TeamsManagementHeader />
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <TeamsManagementHeader />
      <CardContent className="space-y-4">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search teams or owners..."
        />

        <TeamsTable
          teams={filteredTeams}
          onEditTeam={handleEditTeam}
          onDeleteTeam={handleDeleteTeam}
          deleteLoading={deleteTeamMutation.isPending}
        />
      </CardContent>
    </Card>
  );
};
