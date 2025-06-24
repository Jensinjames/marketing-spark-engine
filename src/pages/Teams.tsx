
import { useAuth } from "@/hooks/useAuth";
import AuthGuard from "@/components/AuthGuard";
import Layout from "@/components/layout/Layout";
import PlanGate from "@/components/shared/PlanGate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, UserPlus, Crown, Mail, Settings, Trash2 } from "lucide-react";

const Teams = () => {
  const mockTeamMembers = [
    { id: 1, name: "John Doe", email: "john@example.com", role: "owner", status: "active" },
    { id: 2, name: "Jane Smith", email: "jane@example.com", role: "member", status: "pending" },
  ];

  return (
    <AuthGuard requireAuth={true}>
      <PlanGate 
        requiredPlans={["growth", "elite"]} 
        feature="team management"
      >
        <Layout>
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
                <p className="text-lg text-gray-600 mt-2">
                  Manage your team members and their access levels.
                </p>
              </div>
              <Button className="bg-purple-600 hover:bg-purple-700">
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Member
              </Button>
            </div>

            {/* Team Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-3">
                    <Users className="h-8 w-8 text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-600">Total Members</p>
                      <p className="text-2xl font-bold">2</p>
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
                      <p className="text-2xl font-bold">1</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-3">
                    <Crown className="h-8 w-8 text-yellow-600" />
                    <div>
                      <p className="text-sm text-gray-600">Available Seats</p>
                      <p className="text-2xl font-bold">3</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Team Members List */}
            <Card>
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockTeamMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <span className="text-purple-600 font-semibold">
                            {member.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{member.name}</h3>
                          <p className="text-sm text-gray-600">{member.email}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {member.role === "owner" && (
                            <Crown className="h-4 w-4 text-yellow-500" />
                          )}
                          <span className="text-sm px-2 py-1 bg-gray-100 rounded-full capitalize">
                            {member.role}
                          </span>
                          <span className={`text-sm px-2 py-1 rounded-full capitalize ${
                            member.status === "active" 
                              ? "bg-green-100 text-green-800" 
                              : "bg-yellow-100 text-yellow-800"
                          }`}>
                            {member.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                        {member.role !== "owner" && (
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </Layout>
      </PlanGate>
    </AuthGuard>
  );
};

export default Teams;
