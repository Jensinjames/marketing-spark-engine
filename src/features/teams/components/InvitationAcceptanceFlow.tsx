import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface InvitationData {
  team_name: string;
  inviter_name: string;
  role: string;
  expires_at: string;
}

export const InvitationAcceptanceFlow = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const token = searchParams.get('invitation');

  useEffect(() => {
    if (!token) {
      setError("No invitation token provided");
      setLoading(false);
      return;
    }

    if (!user) {
      // User needs to log in first
      setLoading(false);
      return;
    }

    fetchInvitationDetails();
  }, [token, user]);

  const fetchInvitationDetails = async () => {
    if (!token || !user) return;

    try {
      setLoading(true);
      
      // Get user's profile to check email
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        throw new Error('Could not verify user profile');
      }

      // Get invitation details
      const { data: inviteData, error: inviteError } = await supabase
        .from('team_invitations')
        .select(`
          id,
          team_id,
          email,
          role,
          expires_at,
          invited_by,
          teams!team_invitations_team_id_fkey(name)
        `)
        .eq('token', token)
        .eq('email', profile.email)
        .eq('status', 'pending')
        .single();

      if (inviteError || !inviteData) {
        throw new Error('Invitation not found or no longer valid');
      }

      // Check if invitation has expired
      if (new Date(inviteData.expires_at) <= new Date()) {
        throw new Error('This invitation has expired');
      }

      // Get inviter profile separately
      const { data: inviterProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', inviteData.invited_by)
        .single();

      setInvitation({
        team_name: inviteData.teams?.name || 'Unknown Team',
        inviter_name: inviterProfile?.full_name || 'Someone',
        role: inviteData.role,
        expires_at: inviteData.expires_at
      });

    } catch (error: any) {
      console.error('Error fetching invitation:', error);
      setError(error.message || 'Failed to load invitation details');
    } finally {
      setLoading(false);
    }
  };

  const acceptInvitation = async () => {
    if (!token) return;

    try {
      setAccepting(true);
      
      const { data, error } = await supabase.functions.invoke('accept-team-invitation', {
        body: { token }
      });

      if (error) throw error;

      if (data.success) {
        toast.success(data.message || 'Successfully joined the team!');
        navigate(`/teams`);
      } else {
        throw new Error(data.error || 'Failed to accept invitation');
      }

    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      toast.error(error.message || 'Failed to accept invitation');
    } finally {
      setAccepting(false);
    }
  };

  const declineInvitation = () => {
    navigate('/dashboard');
    toast.info('Invitation declined');
  };

  if (!token) {
    return (
      <Card className="w-full max-w-md mx-auto mt-8">
        <CardHeader className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <CardTitle>Invalid Invitation</CardTitle>
          <CardDescription>
            No invitation token was provided.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => navigate('/dashboard')} 
            className="w-full"
          >
            Go to Dashboard
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="w-full max-w-md mx-auto mt-8">
        <CardHeader className="text-center">
          <Mail className="h-12 w-12 text-primary mx-auto mb-4" />
          <CardTitle>Sign In Required</CardTitle>
          <CardDescription>
            Please sign in to accept this team invitation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={() => navigate(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`)} 
            className="w-full"
          >
            Sign In
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate(`/signup?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`)} 
            className="w-full"
          >
            Create Account
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="w-full max-w-md mx-auto mt-8">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-md mx-auto mt-8">
        <CardHeader className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <CardTitle>Invitation Error</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => navigate('/dashboard')} 
            className="w-full"
          >
            Go to Dashboard
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!invitation) {
    return null;
  }

  const expiresAt = new Date(invitation.expires_at);
  const timeUntilExpiry = expiresAt.getTime() - Date.now();
  const daysUntilExpiry = Math.ceil(timeUntilExpiry / (1000 * 60 * 60 * 24));

  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardHeader className="text-center">
        <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
        <CardTitle>Team Invitation</CardTitle>
        <CardDescription>
          You've been invited to join a team!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium">Team:</span>
            <span className="text-sm">{invitation.team_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium">Invited by:</span>
            <span className="text-sm">{invitation.inviter_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium">Role:</span>
            <span className="text-sm capitalize">{invitation.role}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium">Expires:</span>
            <span className="text-sm">
              {daysUntilExpiry > 0 ? `${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}` : 'Soon'}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <Button 
            onClick={acceptInvitation} 
            disabled={accepting}
            className="w-full"
          >
            {accepting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Accepting...
              </>
            ) : (
              'Accept Invitation'
            )}
          </Button>
          <Button 
            variant="outline"
            onClick={declineInvitation} 
            disabled={accepting}
            className="w-full"
          >
            Decline
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};