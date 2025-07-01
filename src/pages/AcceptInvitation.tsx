import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Loader2, Users } from 'lucide-react';
import { toast } from 'sonner';

interface InvitationData {
  id: string;
  team_name: string;
  role: string;
  inviter_name: string;
  email: string;
  expires_at: string;
}

const AcceptInvitation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link - missing token');
      setLoading(false);
      return;
    }

    loadInvitationDetails();
  }, [token, user]);

  const loadInvitationDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get invitation details
      const { data: invitationData, error: invitationError } = await supabase
        .from('team_invitations')
        .select(`
          id,
          email,
          role,
          expires_at,
          status,
          teams:team_id(name),
          profiles:invited_by(email, raw_user_meta_data)
        `)
        .eq('token', token)
        .single();

      if (invitationError || !invitationData) {
        throw new Error('Invitation not found or invalid');
      }

      // Check if invitation is still valid
      if (invitationData.status !== 'pending') {
        throw new Error(`This invitation has already been ${invitationData.status}`);
      }

      if (new Date(invitationData.expires_at) < new Date()) {
        throw new Error('This invitation has expired');
      }

      // Check if user email matches invitation email (if user is logged in)
      if (user && user.email !== invitationData.email) {
        throw new Error(`This invitation is for ${invitationData.email}. Please log in with the correct account or create a new account.`);
      }

      const inviterName = invitationData.profiles?.raw_user_meta_data?.full_name || 
                         invitationData.profiles?.email?.split('@')[0] || 
                         'A team member';

      setInvitation({
        id: invitationData.id,
        team_name: invitationData.teams.name,
        role: invitationData.role,
        inviter_name: inviterName,
        email: invitationData.email,
        expires_at: invitationData.expires_at
      });

    } catch (error: any) {
      console.error('Error loading invitation:', error);
      setError(error.message || 'Failed to load invitation details');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async () => {
    if (!user) {
      // Redirect to signup/login with invitation token
      navigate(`/signup?invitation=${token}`);
      return;
    }

    try {
      setAccepting(true);
      setError(null);

      // Accept the invitation
      const { data, error } = await supabase
        .rpc('accept_team_invitation', { invitation_token: token });

      if (error) {
        throw new Error(error.message);
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to accept invitation');
      }

      setSuccess(true);
      toast.success(`Successfully joined ${invitation?.team_name}!`);

      // Redirect to teams page after a short delay
      setTimeout(() => {
        navigate('/teams');
      }, 2000);

    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      setError(error.message || 'Failed to accept invitation');
      toast.error('Failed to accept invitation');
    } finally {
      setAccepting(false);
    }
  };

  const handleDeclineInvitation = async () => {
    try {
      // Update invitation status to cancelled
      const { error } = await supabase
        .from('team_invitations')
        .update({ status: 'cancelled' })
        .eq('token', token);

      if (error) {
        throw new Error(error.message);
      }

      toast.success('Invitation declined');
      navigate('/');

    } catch (error: any) {
      console.error('Error declining invitation:', error);
      toast.error('Failed to decline invitation');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
              <span className="text-gray-600">Loading invitation...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-red-900">Invalid Invitation</CardTitle>
            <CardDescription className="text-red-700">
              {error || 'Unable to load invitation details'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button 
                onClick={() => navigate('/')} 
                variant="outline" 
                className="w-full"
              >
                Go to Home
              </Button>
              {!user && (
                <Button 
                  onClick={() => navigate('/login')} 
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  Sign In
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-green-900">Welcome to the team!</CardTitle>
            <CardDescription className="text-green-700">
              You've successfully joined {invitation.team_name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                Redirecting you to the teams page...
              </p>
              <Button 
                onClick={() => navigate('/teams')} 
                className="bg-purple-600 hover:bg-purple-700"
              >
                Go to Teams
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
            <Users className="h-6 w-6 text-purple-600" />
          </div>
          <CardTitle>Team Invitation</CardTitle>
          <CardDescription>
            You've been invited to join a team on Marketing Spark Engine
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-500">Team</label>
              <p className="text-lg font-semibold text-gray-900">{invitation.team_name}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Invited by</label>
              <p className="text-gray-900">{invitation.inviter_name}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Your role</label>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 capitalize">
                {invitation.role}
              </span>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Email</label>
              <p className="text-gray-900">{invitation.email}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Expires</label>
              <p className="text-gray-900">
                {new Date(invitation.expires_at).toLocaleDateString()} at{' '}
                {new Date(invitation.expires_at).toLocaleTimeString()}
              </p>
            </div>
          </div>

          {!user && (
            <Alert>
              <AlertDescription>
                You need to sign in or create an account with <strong>{invitation.email}</strong> to accept this invitation.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <Button 
              onClick={handleAcceptInvitation} 
              disabled={accepting}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {accepting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {user ? 'Accepting...' : 'Redirecting...'}
                </>
              ) : (
                user ? 'Accept Invitation' : 'Sign In to Accept'
              )}
            </Button>
            
            <Button 
              onClick={handleDeclineInvitation} 
              variant="outline" 
              className="w-full"
              disabled={accepting}
            >
              Decline Invitation
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AcceptInvitation;