
import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import AuthGuard from "@/components/AuthGuard";
import Layout from "@/components/layout/Layout";
import PlanGate from "@/components/shared/PlanGate";
import { useTeamMembersWithCredits } from "@/hooks/useTeamMembersWithCredits";
import { useUserTeams } from "@/hooks/useUserTeams";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, UserPlus, Crown, Mail, CreditCard, TrendingUp, BarChart3, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { MemberManagementDialog } from "@/components/teams/MemberManagementDialog";
import { TeamAnalytics } from "@/components/teams/TeamAnalytics";
import { BulkActions } from "@/components/teams/BulkActions";

const Teams = () => {
  const { user } = useAuth();
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  
  const { data: userTeams, isLoading: teamsLoading } = useUserTeams();
  
  const { 
    data: teamData, 
    isLoading, 
    error, 
    refetch 
  } = useTeamMembersWithCredits(selectedTeamId);

  // Auto-select the first team if none is selected
  React.useEffect(() => {
    if (userTeams && userTeams.length > 0 && !selectedTeamId) {
      setSelectedTeamId(userTeams[0].id);
    }
  }, [userTeams, selectedTeamId]);

  const handleInviteMember = () => {
    toast.info("Invite member functionality will be implemented next");
  };

  // Get current user's role in the team
  const currentUserRole = teamData?.members.find(m => m.user_id === user?.id)?.role || 'viewer';

  if (teamsLoading || isLoading) {
    return (
      <AuthGuard requireAuth={true}>
        <PlanGate requiredPlans={["growth", "elite"]} feature="team management">
          <Layout>
            <div className="max-w-7xl mx-auto space-y-8">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-24 bg-gray-200 rounded"></div>
                  ))}
                </div>
                <div className="h-96 bg-gray-200 rounded"></div>
              </div>
            </div>
          </Layout>
        </PlanGate>
      </AuthGuard>
    );
  }

  if (!userTeams || userTeams.length === 0) {
    return (
      <AuthGuard requireAuth={true}>
        <PlanGate requiredPlans={["growth", "elite"]} feature="team management">
          <Layout>
            <div className="max-w-7xl mx-auto space-y-8">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-2">No Teams Found</h3>
                    <p className="text-gray-600 mb-4">
                      You're not a member of any teams yet. Create a new team or ask to be invited to an existing one.
                    </p>
                    <Button onClick={handleInviteMember}>
                      Create Team
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </Layout>
        </PlanGate>
      </AuthGuard>
    );
  }

  if (error) {
    return (
      <AuthGuard requireAuth={true}>
        <PlanGate requiredPlans={["growth", "elite"]} feature="team management">
          <Layout>
            <div className="max-w-7xl mx-auto space-y-8">
              <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-red-800 mb-2">Access Denied</h3>
                    <p className="text-red-600 mb-4">
                      {error.message || 'You do not have permission to access this team\'s data.'}
                    </p>
                    <Button variant="outline" onClick={() => refetch()}>
                      Try Again
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </Layout>
        </PlanGate>
      </AuthGuard>
    );
  }

  if (!teamData) {
    return (
      <AuthGuard requireAuth={true}>
        <PlanGate requiredPlans={["growth", "elite"]} feature="team management">
          <Layout>
            <div className="max-w-7xl mx-auto space-y-8">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-2">No Team Selected</h3>
                    <p className="text-gray-600 mb-4">
                      Please select a team to manage.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </Layout>
        </PlanGate>
      </AuthGuard>
    );
  }

  const { team, members, statistics } = teamData;

  return (
    <AuthGuard requireAuth={true}>
      <PlanGate requiredPlans={["growth", "elite"]} feature="team management">
        <Layout>
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
                <p className="text-lg text-gray-600 mt-2">
                  Manage your team members, roles, and credit usage.
                </p>
              </div>
              <Button className="bg-purple-600 hover:bg-purple-700" onClick={handleInviteMember}>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Member
              </Button>
            </div>

            {/* Team Selector */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-4">
                  <label htmlFor="team-select" className="text-sm font-medium text-gray-700">
                    Select Team:
                  </label>
                  <Select value={selectedTeamId || ""} onValueChange={setSelectedTeamId}>
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="Choose a team..." />
                    </SelectTrigger>
                    <SelectContent>
                      {userTeams.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name} ({team.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Team Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-3">
                    <Users className="h-8 w-8 text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-600">Total Members</p>
                      <p className="text-2xl font-bold">{statistics.total_members}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Pending Invites</p>
                      <p className="text-2xl font-bold">{statistics.pending_invites}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-3">
                    <CreditCard className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-600">Credits Used</p>
                      <p className="text-2xl font-bold">{statistics.total_credits_used}</p>
                      <p className="text-xs text-gray-500">of {statistics.total_credits_available}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-3">
                    <TrendingUp className="h-8 w-8 text-orange-600" />
                    <div>
                      <p className="text-sm text-gray-600">Utilization</p>
                      <p className="text-2xl font-bold">{statistics.credits_utilization}%</p>
                      <Progress 
                        value={parseFloat(statistics.credits_utilization)} 
                        className="w-full mt-2 h-2"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs for different views */}
            <Tabs defaultValue="members" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="members" className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>Members</span>
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4" />
                  <span>Analytics</span>
                </TabsTrigger>
                <TabsTrigger value="bulk" className="flex items-center space-x-2">
                  <Settings2 className="h-4 w-4" />
                  <span>Bulk Actions</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="members" className="space-y-6">
                {/* Team Members List */}
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
                              teamId={selectedTeamId!}
                              currentUserRole={currentUserRole}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analytics">
                <TeamAnalytics teamData={teamData} />
              </TabsContent>

              <TabsContent value="bulk">
                <Card>
                  <CardHeader>
                    <CardTitle>Bulk Member Management</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <BulkActions 
                      members={members} 
                      teamId={selectedTeamId!}
                      currentUserRole={currentUserRole}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </Layout>
      </PlanGate>
    </AuthGuard>
  );
};

export default Teams;
