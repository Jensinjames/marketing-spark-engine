
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Users, CreditCard, Activity } from 'lucide-react';
import AuthGuard from '@/components/AuthGuard';
import Layout from '@/components/layout/Layout';
import { TeamsManagement } from '@/components/admin/TeamsManagement';
import { CreditsManagement } from '@/components/admin/CreditsManagement';
import { AuditLogs } from '@/components/admin/AuditLogs';

const AdminDashboard = () => {
  const { data: adminAccess, isLoading } = useAdminAccess();

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </Layout>
    );
  }

  if (!adminAccess?.isAdmin) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto mt-16 text-center">
          <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access the admin dashboard.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Shield className="h-8 w-8 text-purple-600" />
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-gray-600">
              Welcome, {adminAccess.isSuperAdmin ? 'Super Admin' : 'Admin'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Role</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{adminAccess.role}</div>
              <p className="text-xs text-muted-foreground">
                {adminAccess.isSuperAdmin ? 'Full system access' : 'Limited admin access'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Teams</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Manage</div>
              <p className="text-xs text-muted-foreground">Teams and members</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Credits</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Control</div>
              <p className="text-xs text-muted-foreground">User credit limits</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="teams" className="space-y-4">
          <TabsList>
            <TabsTrigger value="teams">Teams Management</TabsTrigger>
            <TabsTrigger value="credits">Credits Management</TabsTrigger>
            <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="teams">
            <TeamsManagement />
          </TabsContent>

          <TabsContent value="credits">
            <CreditsManagement />
          </TabsContent>

          <TabsContent value="audit">
            <AuditLogs />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

const Admin = () => {
  return (
    <AuthGuard requireAuth={true}>
      <AdminDashboard />
    </AuthGuard>
  );
};

export default Admin;
