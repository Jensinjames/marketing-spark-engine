
import React from "react";
import { useAuth } from "@/hooks/useAuth";
import AuthGuard from "@/components/AuthGuard";
import Layout from "@/components/layout/Layout";
import PlanGate from "@/components/shared/PlanGate";
import { useTeamMembersWithCredits } from "@/hooks/useTeamMembersWithCredits";
import { useTeamSelection } from "@/hooks/team/useTeamSelection";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TeamsHeader } from "@/components/teams/TeamsHeader";
import { TeamSelector } from "@/components/teams/TeamSelector";
import { TeamStats } from "@/components/teams/TeamStats";
import { TeamsTabs } from "@/components/teams/TeamsTabs";
import { TeamPermissions } from "@/utils/teamPermissions";

const Teams = () => {
  const { user } = useAuth();
  const {
    selectedTeamId,
    userTeams,
    teamsLoading,
    handleTeamChange,
    hasTeams
  } = useTeamSelection();

  const {
    data: teamData,
    isLoading,
    error,
    refetch
  } = useTeamMembersWithCredits(selectedTeamId);

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

  if (!hasTeams) {
    return (
      <AuthGuard requireAuth={true}>
        <PlanGate requiredPlans={["growth", "elite"]} feature="team management">
          <Layout>
            <div className="max-w-7xl mx-auto space-y-8">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-2">No Teams Found</h3>
                    <p className="mb-4 text-gray-600">
                      You're not a member of any teams yet. Create a new team or ask to be invited to an existing one.
                    </p>
                    <Button onClick={() => {}}>
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

  return (
    <AuthGuard requireAuth={true}>
      <PlanGate requiredPlans={["growth", "elite"]} feature="team management">
        <Layout>
          <div className="max-w-7xl mx-auto space-y-8">
            <TeamsHeader />
            <TeamSelector 
              userTeams={userTeams} 
              selectedTeamId={selectedTeamId} 
              onTeamChange={handleTeamChange} 
            />
            <TeamStats statistics={teamData.statistics} />
            <TeamsTabs 
              teamData={teamData} 
              selectedTeamId={selectedTeamId!} 
              currentUserRole={currentUserRole}
            />
          </div>
        </Layout>
      </PlanGate>
    </AuthGuard>
  );
};

export default Teams;
