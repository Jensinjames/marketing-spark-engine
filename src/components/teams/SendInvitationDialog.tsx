import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { UserPlus, Mail, X, Send, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useSendTeamInvitation, useEmailDeliveryStats } from '@/hooks/useTeamInvitations';
import { isValidEmail } from '@/utils/security';
import { type SendTeamInvitationInput } from '@/utils/apiValidation';

interface SendInvitationDialogProps {
  teamId: string;
  teamName: string;
  currentUserRole: string;
}

export const SendInvitationDialog = ({ teamId, teamName, currentUserRole }: SendInvitationDialogProps) => {
  const [open, setOpen] = useState(false);
  const [emails, setEmails] = useState<string[]>(['']);
  const [role, setRole] = useState<'admin' | 'editor' | 'viewer'>('viewer');
  const [message, setMessage] = useState('');
  const [emailInput, setEmailInput] = useState('');

  const sendInvitation = useSendTeamInvitation();
  const { data: emailStats } = useEmailDeliveryStats(teamId);

  // Check if user can invite based on role
  const canInvite = ['owner', 'admin'].includes(currentUserRole);

  const handleAddEmail = (email: string) => {
    const trimmedEmail = email.trim().toLowerCase();
    
    if (!trimmedEmail) return;
    
    if (!isValidEmail(trimmedEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    if (emails.includes(trimmedEmail)) {
      toast.error('This email has already been added');
      return;
    }
    
    if (emails.filter(e => e).length >= 10) {
      toast.error('Maximum 10 emails allowed per invitation');
      return;
    }
    
    setEmails(prev => [...prev.filter(e => e), trimmedEmail]);
    setEmailInput('');
  };

  const handleRemoveEmail = (index: number) => {
    setEmails(prev => prev.filter((_, i) => i !== index));
  };

  const handleEmailInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
      e.preventDefault();
      handleAddEmail(emailInput);
    }
  };

  const handleBulkEmailPaste = (pastedText: string) => {
    // Extract emails from pasted text (handle various separators)
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const foundEmails = pastedText.match(emailRegex) || [];
    
    const validEmails = foundEmails
      .map(email => email.toLowerCase().trim())
      .filter(email => isValidEmail(email))
      .filter(email => !emails.includes(email))
      .slice(0, 10 - emails.filter(e => e).length);
    
    if (validEmails.length > 0) {
      setEmails(prev => [...prev.filter(e => e), ...validEmails]);
      setEmailInput('');
      toast.success(`Added ${validEmails.length} email${validEmails.length > 1 ? 's' : ''}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validEmails = emails.filter(email => email && isValidEmail(email));
    
    if (validEmails.length === 0) {
      toast.error('Please add at least one valid email address');
      return;
    }

    const invitationData: SendTeamInvitationInput = {
      team_id: teamId,
      emails: validEmails,
      role,
      message: message.trim() || undefined
    };

    try {
      await sendInvitation.mutateAsync(invitationData);
      
      // Reset form and close dialog on success
      setEmails(['']);
      setRole('viewer');
      setMessage('');
      setEmailInput('');
      setOpen(false);
      
    } catch (error) {
      // Error handling is done in the hook
      console.error('Failed to send invitations:', error);
    }
  };

  const handleReset = () => {
    setEmails(['']);
    setRole('viewer');
    setMessage('');
    setEmailInput('');
  };

  if (!canInvite) {
    return (
      <Button disabled variant="outline" size="sm">
        <UserPlus className="h-4 w-4 mr-2" />
        Invite Members
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-purple-600 hover:bg-purple-700">
          <UserPlus className="h-4 w-4 mr-2" />
          Invite Members
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Mail className="h-5 w-5 text-purple-600" />
            <span>Invite Team Members</span>
          </DialogTitle>
          <DialogDescription>
            Send invitations to join <strong>{teamName}</strong>. Invited members will receive an email with instructions.
          </DialogDescription>
        </DialogHeader>

        {/* Email Delivery Stats */}
        {emailStats && (
          <Card className="mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Email Delivery Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-semibold text-lg text-green-600">{emailStats.stats.success_rate.toFixed(1)}%</div>
                  <div className="text-gray-500">Success Rate</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-lg">{emailStats.stats.total}</div>
                  <div className="text-gray-500">Total Sent</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-lg text-yellow-600">{emailStats.stats.pending}</div>
                  <div className="text-gray-500">Pending</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-lg text-red-600">{emailStats.stats.failed}</div>
                  <div className="text-gray-500">Failed</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Input Section */}
          <div className="space-y-3">
            <Label htmlFor="email-input" className="text-sm font-medium">
              Email Addresses <span className="text-red-500">*</span>
            </Label>
            
            {/* Current emails */}
            {emails.filter(email => email).length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg">
                {emails.filter(email => email).map((email, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                    <span>{email}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveEmail(index)}
                      className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            
            {/* Email input */}
            <div className="space-y-2">
              <Input
                id="email-input"
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={handleEmailInputKeyDown}
                onPaste={(e) => {
                  const pastedText = e.clipboardData.getData('text');
                  if (pastedText.includes('@')) {
                    e.preventDefault();
                    handleBulkEmailPaste(pastedText);
                  }
                }}
                placeholder="Enter email address and press Enter"
                className="w-full"
                disabled={sendInvitation.isPending}
              />
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>Press Enter, comma, or space to add email</span>
                <span>{emails.filter(e => e).length}/10 emails</span>
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                You can paste multiple emails separated by commas, spaces, or line breaks. 
                Maximum 10 emails per invitation batch.
              </AlertDescription>
            </Alert>
          </div>

          <Separator />

          {/* Role Selection */}
          <div className="space-y-3">
            <Label htmlFor="role-select" className="text-sm font-medium">
              Role <span className="text-red-500">*</span>
            </Label>
            <Select value={role} onValueChange={(value: 'admin' | 'editor' | 'viewer') => setRole(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer">
                  <div>
                    <div className="font-medium">Viewer</div>
                    <div className="text-xs text-gray-500">Can view team content and analytics</div>
                  </div>
                </SelectItem>
                <SelectItem value="editor">
                  <div>
                    <div className="font-medium">Editor</div>
                    <div className="text-xs text-gray-500">Can create and edit content</div>
                  </div>
                </SelectItem>
                <SelectItem value="admin">
                  <div>
                    <div className="font-medium">Admin</div>
                    <div className="text-xs text-gray-500">Can manage team members and settings</div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Personal Message */}
          <div className="space-y-3">
            <Label htmlFor="message" className="text-sm font-medium">
              Personal Message (Optional)
            </Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a personal message to the invitation..."
              rows={3}
              maxLength={500}
              disabled={sendInvitation.isPending}
            />
            <div className="text-xs text-gray-500 text-right">
              {message.length}/500 characters
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleReset}
              disabled={sendInvitation.isPending}
            >
              Reset
            </Button>
            
            <div className="space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
                disabled={sendInvitation.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={sendInvitation.isPending || emails.filter(e => e).length === 0}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {sendInvitation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send {emails.filter(e => e).length > 0 ? `${emails.filter(e => e).length} ` : ''}Invitation{emails.filter(e => e).length !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};