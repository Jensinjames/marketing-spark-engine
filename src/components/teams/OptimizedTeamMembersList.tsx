
import React, { useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Crown } from "lucide-react";
import { TeamMemberWithCredits } from "@/types/team";
import { MemberManagementDialog } from "@/components/teams/MemberManagementDialog";
import { MemberListSkeleton } from "@/components/skeletons/MemberListSkeleton";

interface OptimizedTeamMembersListProps {
  members: TeamMemberWithCredits[];
  teamId: string;
  currentUserRole: string;
  isLoading?: boolean;
}

// Memoized member row component to prevent unnecessary re-renders
const MemberRow = React.memo(({ 
  member, 
  teamId, 
  currentUserRole 
}: { 
  member: TeamMemberWithCredits; 
  teamId: string; 
  currentUserRole: string;
}) => {
  const utilizationPercentage = useMemo(() => 
    (member.credits.credits_used / member.credits.monthly_limit) * 100
  , [member.credits.credits_used, member.credits.monthly_limit]);

  const getStatusBadgeColor = useCallback((status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }, []);

  return (
    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex items-center space-x-4">
        <Avatar>
          <AvatarImage src={member.avatar_url} alt={member.name} />
          <AvatarFallback>
            {member.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="font-medium text-gray-900">{member.name}</h3>
            {member.role === "owner" && (
              <Crown className="h-4 w-4 text-yellow-500" />
            )}
          </div>
          <p className="text-sm text-gray-600">{member.email}</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge 
            variant={member.role === 'owner' ? 'default' : 'secondary'}
            className="capitalize"
          >
            {member.role}
          </Badge>
          <Badge 
            variant={member.status === 'active' ? 'default' : 'outline'}
            className={`capitalize ${getStatusBadgeColor(member.status)}`}
          >
            {member.status}
          </Badge>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        {/* Credits Display */}
        <div className="text-right">
          <p className="text-sm font-medium">
            {member.credits.credits_used} / {member.credits.monthly_limit}
          </p>
          <p className="text-xs text-gray-500">
            {member.credits.credits_remaining} remaining
          </p>
          <Progress 
            value={utilizationPercentage}
            className="w-20 h-2 mt-1"
          />
        </div>
        
        {/* Management Actions */}
        <MemberManagementDialog 
          member={member} 
          teamId={teamId}
          currentUserRole={currentUserRole}
        />
      </div>
    </div>
  );
});

MemberRow.displayName = 'MemberRow';

export const OptimizedTeamMembersList = React.memo(({ 
  members, 
  teamId, 
  currentUserRole,
  isLoading = false
}: OptimizedTeamMembersListProps) => {
  if (isLoading) {
    return <MemberListSkeleton count={3} />;
  }

  if (members.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500">No team members found.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Members ({members.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {members.map((member) => (
            <MemberRow
              key={member.id}
              member={member}
              teamId={teamId}
              currentUserRole={currentUserRole}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
});

OptimizedTeamMembersList.displayName = 'OptimizedTeamMembersList';
