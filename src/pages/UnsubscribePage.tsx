import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, Mail, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

const unsubscribeSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  reason: z.string().optional(),
  feedback: z.string().max(500, 'Feedback must be 500 characters or less').optional()
});

const UnsubscribePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    email: searchParams.get('email') || '',
    reason: '',
    feedback: ''
  });

  const token = searchParams.get('token');

  useEffect(() => {
    // Pre-fill email from URL if provided
    const emailFromUrl = searchParams.get('email');
    if (emailFromUrl) {
      setFormData(prev => ({ ...prev, email: decodeURIComponent(emailFromUrl) }));
    }
  }, [searchParams]);

  const handleUnsubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);

      // Validate form data
      const validationResult = unsubscribeSchema.safeParse(formData);
      if (!validationResult.success) {
        const errors = validationResult.error.errors.map(err => err.message);
        throw new Error(errors.join(', '));
      }

      const { email, reason, feedback } = validationResult.data;

      // Generate unsubscribe token if not provided
      let unsubscribeToken = token;
      if (!unsubscribeToken) {
        const { data: tokenData, error: tokenError } = await supabase
          .rpc('generate_unsubscribe_token');
        
        if (tokenError || !tokenData) {
          throw new Error('Failed to generate unsubscribe token');
        }
        unsubscribeToken = tokenData;
      }

      // Add email to unsubscribe list
      const { error: unsubscribeError } = await supabase
        .from('email_unsubscribes')
        .upsert({
          email: email.toLowerCase().trim(),
          unsubscribe_token: unsubscribeToken,
          reason: reason || null,
          unsubscribed_at: new Date().toISOString()
        });

      if (unsubscribeError) {
        // Check if it's a duplicate entry (already unsubscribed)
        if (unsubscribeError.code === '23505') {
          toast.success('You were already unsubscribed from our emails.');
          setSuccess(true);
          return;
        }
        throw new Error(unsubscribeError.message);
      }

      // Log the unsubscribe event for analytics
      await supabase.rpc('audit_sensitive_operation', {
        p_action: 'email_unsubscribe',
        p_table_name: 'email_unsubscribes',
        p_new_values: { 
          email, 
          reason: reason || 'No reason provided',
          has_feedback: !!feedback,
          source: 'unsubscribe_page'
        }
      });

      // If feedback was provided, we could store it separately or send to a feedback system
      if (feedback) {
        console.log('User feedback:', feedback);
        // You could integrate with a feedback service here
      }

      setSuccess(true);
      toast.success('Successfully unsubscribed from email notifications');

    } catch (error: any) {
      console.error('Unsubscribe error:', error);
      setError(error.message || 'Failed to unsubscribe');
      toast.error('Failed to unsubscribe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResubscribe = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!formData.email) {
        throw new Error('Please enter your email address');
      }

      // Remove from unsubscribe list
      const { error } = await supabase
        .from('email_unsubscribes')
        .delete()
        .eq('email', formData.email.toLowerCase().trim());

      if (error) {
        throw new Error(error.message);
      }

      // Log the resubscribe event
      await supabase.rpc('audit_sensitive_operation', {
        p_action: 'email_resubscribe',
        p_table_name: 'email_unsubscribes',
        p_new_values: { 
          email: formData.email,
          source: 'unsubscribe_page'
        }
      });

      toast.success('Successfully resubscribed to email notifications');
      navigate('/');

    } catch (error: any) {
      console.error('Resubscribe error:', error);
      setError(error.message || 'Failed to resubscribe');
      toast.error('Failed to resubscribe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-green-900">Unsubscribed Successfully</CardTitle>
            <CardDescription className="text-green-700">
              You've been removed from our email list
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center text-gray-600">
              <p className="mb-4">
                You will no longer receive team invitations and other email notifications from Marketing Spark Engine.
              </p>
              <p className="text-sm text-gray-500">
                You can resubscribe at any time by visiting this page again and clicking "Resubscribe".
              </p>
            </div>
            
            <div className="space-y-2">
              <Button 
                onClick={() => navigate('/')} 
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                Go to Home
              </Button>
              <Button 
                onClick={handleResubscribe}
                variant="outline" 
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resubscribing...
                  </>
                ) : (
                  'Resubscribe'
                )}
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
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Mail className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle>Unsubscribe from Emails</CardTitle>
          <CardDescription>
            We're sorry to see you go. You can unsubscribe from our emails below.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleUnsubscribe} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter your email address"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason for unsubscribing (optional)</Label>
              <Select 
                value={formData.reason} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, reason: value }))}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="too_many_emails">Too many emails</SelectItem>
                  <SelectItem value="not_relevant">Content not relevant</SelectItem>
                  <SelectItem value="never_signed_up">Never signed up</SelectItem>
                  <SelectItem value="privacy_concerns">Privacy concerns</SelectItem>
                  <SelectItem value="technical_issues">Technical issues</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedback">Additional feedback (optional)</Label>
              <Textarea
                id="feedback"
                value={formData.feedback}
                onChange={(e) => setFormData(prev => ({ ...prev, feedback: e.target.value }))}
                placeholder="Help us improve by sharing your feedback..."
                rows={3}
                maxLength={500}
                disabled={loading}
              />
              <p className="text-xs text-gray-500">
                {formData.feedback.length}/500 characters
              </p>
            </div>

            {error && (
              <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-md">
                <XCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Button 
                type="submit" 
                disabled={loading || !formData.email}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Unsubscribing...
                  </>
                ) : (
                  'Unsubscribe'
                )}
              </Button>
              
              <Button 
                type="button"
                onClick={() => navigate('/')} 
                variant="outline" 
                className="w-full"
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              By unsubscribing, you'll stop receiving team invitations, notifications, and updates from Marketing Spark Engine. 
              You can resubscribe at any time.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UnsubscribePage;