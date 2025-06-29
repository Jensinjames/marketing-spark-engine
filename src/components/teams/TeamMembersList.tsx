
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Crown } from "lucide-react";
import { TeamMemberWithCredits } from "@/hooks/useTeamMembersWithCredits";
import { MemberManagementDialog } from "@/components/teams/MemberManagementDialog";

interface TeamMembersListProps {
  members: TeamMemberWithCredits[];
  teamId: string;
  currentUserRole: string;
}

export const TeamMembersList = ({ members, teamId, currentUserRole }: TeamMembersListProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Members</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
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
                    className={`capitalize ${
                      member.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : member.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
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
                    value={(member.credits.credits_used / member.credits.monthly_limit) * 100}
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
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
