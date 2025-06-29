
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { CreditCard, Search, Edit, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export const CreditsManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCredit, setEditingCredit] = useState<any>(null);
  const [newLimit, setNewLimit] = useState('');
  const queryClient = useQueryClient();

  // Fetch all user credits with profile info
  const { data: userCredits, isLoading } = useQuery({
    queryKey: ['admin-credits'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_credits')
        .select(`
          *,
          profiles!user_credits_user_id_fkey(full_name, email, role)
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const updateCreditsMutation = useMutation({
    mutationFn: async ({ userId, newMonthlyLimit }: { userId: string; newMonthlyLimit: number }) => {
      const { error } = await supabase
        .from('user_credits')
        .update({ monthly_limit: newMonthlyLimit })
        .eq('user_id', userId);

      if (error) throw error;

      // Log the admin action
      await supabase.rpc('audit_sensitive_operation', {
        p_action: 'admin_update_credit_limit',
        p_table_name: 'user_credits',
        p_record_id: userId,
        p_new_values: { monthly_limit: newMonthlyLimit, updated_at: new Date().toISOString() }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-credits'] });
      toast.success('Credit limit updated successfully');
      setEditingCredit(null);
      setNewLimit('');
    },
    onError: (error) => {
      toast.error('Failed to update credit limit');
      console.error('Update credits error:', error);
    },
  });

  const resetCreditsMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('user_credits')
        .update({ 
          credits_used: 0,
          reset_at: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;

      // Log the admin action
      await supabase.rpc('audit_sensitive_operation', {
        p_action: 'admin_reset_credits',
        p_table_name: 'user_credits',
        p_record_id: userId,
        p_new_values: { credits_used: 0, reset_at: new Date().toISOString() }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-credits'] });
      toast.success('Credits reset successfully');
    },
    onError: (error) => {
      toast.error('Failed to reset credits');
      console.error('Reset credits error:', error);
    },
  });

  const filteredCredits = userCredits?.filter(credit =>
    credit.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    credit.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUpdateCredits = () => {
    if (!editingCredit || !newLimit) return;
    
    const limit = parseInt(newLimit);
    if (isNaN(limit) || limit < 0) {
      toast.error('Please enter a valid credit limit');
      return;
    }

    updateCreditsMutation.mutate({ 
      userId: editingCredit.user_id, 
      newMonthlyLimit: limit 
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Credits Management</CardTitle>
        </CardHeader>
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
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>Credits Management</span>
            </CardTitle>
            <CardDescription>
              Manage user credit limits and reset credits as needed
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Credits Used</TableHead>
                <TableHead>Monthly Limit</TableHead>
                <TableHead>Reset Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCredits?.map((credit) => (
                <TableRow key={credit.user_id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{credit.profiles?.full_name || 'Unknown'}</div>
                      <div className="text-sm text-gray-500">{credit.profiles?.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={credit.profiles?.role === 'super_admin' ? 'default' : 'secondary'}>
                      {credit.profiles?.role || 'user'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <span>{credit.credits_used}</span>
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full" 
                          style={{ 
                            width: `${Math.min((credit.credits_used / credit.monthly_limit) * 100, 100)}%` 
                          }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{credit.monthly_limit}</TableCell>
                  <TableCell>
                    {new Date(credit.reset_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Dialog 
                        open={editingCredit?.user_id === credit.user_id} 
                        onOpenChange={(open) => {
                          if (!open) {
                            setEditingCredit(null);
                            setNewLimit('');
                          }
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingCredit(credit);
                              setNewLimit(credit.monthly_limit.toString());
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Update Credit Limit</DialogTitle>
                            <DialogDescription>
                              Change the monthly credit limit for {credit.profiles?.full_name}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="creditLimit">Monthly Credit Limit</Label>
                              <Input
                                id="creditLimit"
                                type="number"
                                value={newLimit}
                                onChange={(e) => setNewLimit(e.target.value)}
                                placeholder="Enter new limit"
                              />
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setEditingCredit(null);
                                  setNewLimit('');
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={handleUpdateCredits}
                                disabled={updateCreditsMutation.isPending}
                              >
                                Update Limit
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => resetCreditsMutation.mutate(credit.user_id)}
                        disabled={resetCreditsMutation.isPending}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredCredits?.length === 0 && (
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-500">
              {searchTerm ? 'Try adjusting your search terms.' : 'No user credits found.'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
