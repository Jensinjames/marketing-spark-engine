import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useDebounced } from '@/hooks/useDebounced';
import { useAdminMutations } from '@/hooks/useAdminMutations';
import { 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  Users, 
  Crown, 
  Calendar, 
  MoreHorizontal,
  Download,
  Filter
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CreateTeamDialog } from './CreateTeamDialog';
import { EditTeamDialog } from './EditTeamDialog';
import { toast } from 'sonner';

interface ExtendedTeam {
  id: string;
  name: string;
  created_at: string;
  profiles?: {
    full_name?: string;
    email?: string;
  };
  team_members: Array<{
    id: string;
    role: string;
    status: string;
  }>;
  member_count: number;
  active_members: number;
  pending_invitations: number;
}

export const EnhancedTeamsManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState<'all' | 'small' | 'medium' | 'large'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'created' | 'members'>('created');
  const [selectedTeam, setSelectedTeam] = useState<ExtendedTeam | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  
  const debouncedSearchTerm = useDebounced(searchTerm, 300);
  const { deleteTeam, isLoading: adminLoading } = useAdminMutations();

  // Fetch enhanced team data with statistics
  const { data: teams, isLoading, refetch } = useQuery({
    queryKey: ['admin-enhanced-teams'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select(`
          id,
          name,
          created_at,
          owner_id,
          profiles!teams_owner_id_fkey(full_name, email),
          team_members(
            id,
            role,
            status
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data to include statistics
      return data.map(team => ({
        ...team,
        member_count: team.team_members.length,
        active_members: team.team_members.filter(m => m.status === 'active').length,
        pending_invitations: 0 // Simplified for now
      })) as ExtendedTeam[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Enhanced filtering and sorting
  const filteredAndSortedTeams = useMemo(() => {
    if (!teams) return [];
    
    let filtered = teams;

    // Search filter
    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(team =>
        team.name.toLowerCase().includes(searchLower) ||
        team.profiles?.email?.toLowerCase().includes(searchLower) ||
        team.profiles?.full_name?.toLowerCase().includes(searchLower)
      );
    }

    // Size filter
    if (filterBy !== 'all') {
      filtered = filtered.filter(team => {
        const memberCount = team.active_members;
        switch (filterBy) {
          case 'small': return memberCount <= 5;
          case 'medium': return memberCount > 5 && memberCount <= 20;
          case 'large': return memberCount > 20;
          default: return true;
        }
      });
    }

    // Sort
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'members':
          return b.active_members - a.active_members;
        case 'created':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
  }, [teams, debouncedSearchTerm, filterBy, sortBy]);

  const handleDeleteTeam = async (teamId: string, teamName: string) => {
    if (!confirm(`Are you sure you want to delete "${teamName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteTeam.mutateAsync(teamId);
      toast.success('Team deleted successfully');
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete team');
    }
  };

  const handleEditTeam = (team: ExtendedTeam) => {
    setSelectedTeam(team);
    setShowEditDialog(true);
  };

  const exportTeamData = () => {
    if (!filteredAndSortedTeams) return;

    const csvData = filteredAndSortedTeams.map(team => ({
      Name: team.name,
      Owner: team.profiles?.full_name || team.profiles?.email || 'Unknown',
      'Total Members': team.member_count,
      'Active Members': team.active_members,
      'Pending Invitations': team.pending_invitations,
      'Created Date': new Date(team.created_at).toLocaleDateString()
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `teams-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Team data exported successfully');
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Enhanced Teams Management
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {filteredAndSortedTeams?.length || 0} teams found
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button onClick={exportTeamData} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Team
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Enhanced Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search teams, owners, or emails..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterBy} onValueChange={(value: any) => setFilterBy(value)}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sizes</SelectItem>
                <SelectItem value="small">Small (≤5 members)</SelectItem>
                <SelectItem value="medium">Medium (6-20 members)</SelectItem>
                <SelectItem value="large">Large ({'>'}20 members)</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created">Created Date</SelectItem>
                <SelectItem value="name">Team Name</SelectItem>
                <SelectItem value="members">Member Count</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Enhanced Teams Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead className="text-center">Members</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedTeams?.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell>
                      <div className="font-medium">{team.name}</div>
                      <div className="text-sm text-muted-foreground">{team.id}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Crown className="h-4 w-4 mr-2 text-yellow-500" />
                        <div>
                          <div className="font-medium">
                            {team.profiles?.full_name || 'Unknown'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {team.profiles?.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="space-y-1">
                        <div className="font-medium">{team.active_members}</div>
                        {team.pending_invitations > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            +{team.pending_invitations} pending
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant={team.active_members > 0 ? "default" : "secondary"}
                      >
                        {team.active_members > 0 ? 'Active' : 'Empty'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-2" />
                        {new Date(team.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleEditTeam(team)}>
                            <Edit3 className="h-4 w-4 mr-2" />
                            Edit Team
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteTeam(team.id, team.name)}
                            className="text-destructive"
                            disabled={adminLoading}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Team
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredAndSortedTeams?.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm || filterBy !== 'all' 
                  ? 'No teams match your filters' 
                  : 'No teams found'
                }
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Team Dialog */}
      <CreateTeamDialog 
        open={showCreateDialog} 
        onOpenChange={setShowCreateDialog}
        onSuccess={() => {
          refetch();
          setShowCreateDialog(false);
        }}
      />

      {/* Edit Team Dialog */}
      {selectedTeam && (
        <EditTeamDialog 
          open={showEditDialog} 
          onOpenChange={setShowEditDialog}
          team={selectedTeam}
          onSuccess={() => {
            refetch();
            setShowEditDialog(false);
          }}
        />
      )}
    </div>
  );
};