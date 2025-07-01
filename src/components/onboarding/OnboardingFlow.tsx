import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  UserPlus, 
  BarChart3, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle, 
  Clock,
  Target,
  Gift,
  Zap,
  X
} from 'lucide-react';
import { useTeamContext } from '@/contexts/TeamContext';
import { useSecurityContext } from '@/contexts/SecurityContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  component?: React.ComponentType<OnboardingStepProps>;
  estimatedTime: string;
  isOptional?: boolean;
  prerequisites?: string[];
}

interface OnboardingStepProps {
  onNext: () => void;
  onPrevious: () => void;
  onComplete: () => void;
  onSkip: () => void;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Your Team!',
    description: 'Get started with team collaboration and content creation',
    icon: <Gift className="h-6 w-6" />,
    component: WelcomeStep,
    estimatedTime: '1 min',
  },
  {
    id: 'team_overview',
    title: 'Explore Your Team',
    description: 'Learn about team structure, roles, and permissions',
    icon: <Users className="h-6 w-6" />,
    component: TeamOverviewStep,
    estimatedTime: '2 min',
  },
  {
    id: 'invite_members',
    title: 'Invite Team Members',
    description: 'Add colleagues to collaborate on your marketing content',
    icon: <UserPlus className="h-6 w-6" />,
    component: InviteMembersStep,
    estimatedTime: '2 min',
    isOptional: true,
  },
  {
    id: 'explore_features',
    title: 'Discover Key Features',
    description: 'Analytics, content generation, and team management tools',
    icon: <Sparkles className="h-6 w-6" />,
    component: ExploreFeaturesStep,
    estimatedTime: '3 min',
  },
  {
    id: 'first_content',
    title: 'Create Your First Content',
    description: 'Generate your first marketing content with AI assistance',
    icon: <Zap className="h-6 w-6" />,
    component: FirstContentStep,
    estimatedTime: '3 min',
    isOptional: true,
  },
  {
    id: 'completion',
    title: 'You\'re All Set!',
    description: 'Congratulations! You\'re ready to supercharge your marketing',
    icon: <Target className="h-6 w-6" />,
    component: CompletionStep,
    estimatedTime: '1 min',
  }
];

export const OnboardingFlow: React.FC = () => {
  const { 
    userPreferences, 
    updateUserPreferences, 
    completeOnboardingStep, 
    skipOnboarding,
    isOnboardingComplete 
  } = useTeamContext();
  const { logSecurityEvent } = useSecurityContext();
  
  const [isOpen, setIsOpen] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [startTime] = useState(Date.now());

  const shouldShowOnboarding = userPreferences?.ui_preferences.show_onboarding && !isOnboardingComplete;

  useEffect(() => {
    if (shouldShowOnboarding) {
      setIsOpen(true);
      startOnboardingSession();
    }
  }, [shouldShowOnboarding]);

  const startOnboardingSession = async () => {
    try {
      const { data, error } = await supabase.rpc('start_onboarding_session', {
        p_session_type: 'first_time',
        p_device_info: {
          userAgent: navigator.userAgent,
          screen: { width: screen.width, height: screen.height },
          language: navigator.language
        }
      });

      if (error) throw error;
      setSessionId(data);

      await logSecurityEvent('onboarding_started', {
        session_id: data,
        session_type: 'first_time'
      }, 'low');

    } catch (error) {
      console.error('Failed to start onboarding session:', error);
    }
  };

  const completeOnboardingSession = async () => {
    if (!sessionId) return;

    try {
      const completionRate = (currentStepIndex / ONBOARDING_STEPS.length) * 100;
      
      await supabase.rpc('complete_onboarding_session', {
        p_session_id: sessionId,
        p_completion_rate: completionRate
      });

      await logSecurityEvent('onboarding_completed', {
        session_id: sessionId,
        completion_rate: completionRate,
        time_spent: Date.now() - startTime
      }, 'low');

    } catch (error) {
      console.error('Failed to complete onboarding session:', error);
    }
  };

  const handleNext = async () => {
    const currentStep = ONBOARDING_STEPS[currentStepIndex];
    
    try {
      await completeOnboardingStep(currentStep.id);
      
      if (currentStepIndex < ONBOARDING_STEPS.length - 1) {
        setCurrentStepIndex(prev => prev + 1);
      } else {
        await handleComplete();
      }
    } catch (error) {
      console.error('Failed to complete step:', error);
      toast.error('Failed to save progress');
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleSkipStep = async () => {
    const currentStep = ONBOARDING_STEPS[currentStepIndex];
    
    await logSecurityEvent('onboarding_step_skipped', {
      step_id: currentStep.id,
      step_title: currentStep.title
    }, 'low');

    if (currentStepIndex < ONBOARDING_STEPS.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      await handleComplete();
    }
  };

  const handleComplete = async () => {
    await completeOnboardingSession();
    setIsOpen(false);
    
    // Update preferences to hide onboarding
    await updateUserPreferences({
      ui_preferences: {
        ...userPreferences?.ui_preferences,
        show_onboarding: false,
      }
    });

    toast.success('Welcome to Marketing Spark Engine! 🚀', {
      description: 'You\'re all set to create amazing marketing content with your team.',
      duration: 5000,
    });
  };

  const handleSkipOnboarding = async () => {
    await skipOnboarding();
    await completeOnboardingSession();
    setIsOpen(false);
  };

  const currentStep = ONBOARDING_STEPS[currentStepIndex];
  const progress = ((currentStepIndex + 1) / ONBOARDING_STEPS.length) * 100;
  const StepComponent = currentStep.component;

  if (!shouldShowOnboarding) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                {currentStep.icon}
              </div>
              <div>
                <DialogTitle className="text-xl">{currentStep.title}</DialogTitle>
                <DialogDescription className="text-base">
                  {currentStep.description}
                </DialogDescription>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">
                Step {currentStepIndex + 1} of {ONBOARDING_STEPS.length}
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Clock className="h-3 w-3" />
                <span>{currentStep.estimatedTime}</span>
                {currentStep.isOptional && (
                  <Badge variant="secondary" className="text-xs">Optional</Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Progress</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
          </div>
        </DialogHeader>

        <div className="py-6">
          {StepComponent && (
            <StepComponent
              onNext={handleNext}
              onPrevious={handlePrevious}
              onComplete={handleComplete}
              onSkip={handleSkipStep}
            />
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              onClick={handleSkipOnboarding}
              className="text-gray-500 hover:text-gray-700"
            >
              Skip Onboarding
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            {currentStepIndex > 0 && (
              <Button variant="outline" onClick={handlePrevious}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
            )}
            
            {currentStep.isOptional && (
              <Button variant="outline" onClick={handleSkipStep}>
                Skip Step
              </Button>
            )}
            
            <Button onClick={handleNext} className="bg-purple-600 hover:bg-purple-700">
              {currentStepIndex === ONBOARDING_STEPS.length - 1 ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Individual step components
function WelcomeStep({ onNext }: OnboardingStepProps) {
  const { currentTeam } = useTeamContext();
  
  return (
    <div className="text-center space-y-6">
      <div className="relative mx-auto w-32 h-32 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
        <Gift className="h-16 w-16 text-white" />
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
          <Sparkles className="h-4 w-4 text-yellow-800" />
        </div>
      </div>
      
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome to {currentTeam?.name || 'Your Team'}! 🎉
        </h2>
        <p className="text-lg text-gray-600 mb-4">
          You're about to discover the power of AI-driven marketing content creation with your team.
        </p>
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4">
          <p className="text-gray-700">
            This quick tour will help you get the most out of Marketing Spark Engine. 
            It takes about <strong>10 minutes</strong> and will set you up for success.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center space-x-2 mb-2">
              <Users className="h-5 w-5 text-purple-600" />
              <span className="font-medium">Collaborate</span>
            </div>
            <p className="text-sm text-gray-600">
              Work together with your team on marketing campaigns
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center space-x-2 mb-2">
              <Zap className="h-5 w-5 text-purple-600" />
              <span className="font-medium">Create</span>
            </div>
            <p className="text-sm text-gray-600">
              Generate content with AI-powered marketing tools
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center space-x-2 mb-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              <span className="font-medium">Analyze</span>
            </div>
            <p className="text-sm text-gray-600">
              Track performance and optimize your content strategy
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TeamOverviewStep({ onNext }: OnboardingStepProps) {
  const { currentTeam, currentTeamMembers, getCurrentUserRole } = useTeamContext();
  const userRole = getCurrentUserRole();
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Meet Your Team</h2>
        <p className="text-gray-600">
          Here's an overview of your team structure and your role within it.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Team Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-500">Team Name</label>
              <p className="text-lg font-semibold">{currentTeam?.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Your Role</label>
              <Badge className="capitalize ml-2">{userRole}</Badge>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Team Size</label>
              <p>{currentTeamMembers?.length || 0} members</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>What You Can Do</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {userRole === 'owner' || userRole === 'admin' ? (
              <>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Invite and manage team members</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">View team analytics and reports</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Manage team settings and permissions</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Create and edit content</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">View team content and analytics</span>
                </div>
              </>
            )}
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Generate AI-powered marketing content</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {currentTeamMembers && currentTeamMembers.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Teammates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {currentTeamMembers.slice(0, 5).map((member) => (
                <div key={member.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{member.name}</p>
                      <p className="text-xs text-gray-500">{member.email}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="capitalize">
                    {member.role}
                  </Badge>
                </div>
              ))}
              {currentTeamMembers.length > 5 && (
                <p className="text-sm text-gray-500 text-center pt-2">
                  and {currentTeamMembers.length - 5} more members...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function InviteMembersStep({ onNext, onSkip }: OnboardingStepProps) {
  const { isTeamAdmin } = useTeamContext();
  
  if (!isTeamAdmin()) {
    return (
      <div className="text-center space-y-4">
        <div className="p-8 bg-blue-50 rounded-lg">
          <UserPlus className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Inviting Team Members</h2>
          <p className="text-gray-600 mb-4">
            As a team member, you can't invite others directly. Your team admin or owner can add new members to collaborate with you.
          </p>
          <p className="text-sm text-gray-500">
            💡 Tip: Ask your team admin to invite colleagues who could benefit from AI-powered marketing content creation!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Invite Your Team</h2>
        <p className="text-gray-600">
          Add colleagues to collaborate on marketing content and campaigns.
        </p>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <UserPlus className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-2">Ready to invite team members?</h3>
            <p className="text-gray-600 mb-4">
              You can invite team members now or skip this step and do it later from the team management page.
            </p>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Send email invitations with custom roles</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Track invitation status and delivery</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Manage team permissions and access levels</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-500 mb-4">
          You can always invite team members later from the Teams page.
        </p>
        <div className="space-x-3">
          <Button variant="outline" onClick={onSkip}>
            Skip for Now
          </Button>
          <Button 
            onClick={() => {
              // This would open the invite dialog
              toast.info('Team invitation feature will be available after onboarding!');
              onNext();
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Invite Team Members
          </Button>
        </div>
      </div>
    </div>
  );
}

function ExploreFeaturesStep({ onNext }: OnboardingStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Discover Key Features</h2>
        <p className="text-gray-600">
          Here are the main features that will help you create amazing marketing content.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-yellow-600" />
              <span>AI Content Generation</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-3">
              Create compelling marketing content with our AI-powered tools.
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Social media posts and campaigns</li>
              <li>• Email marketing content</li>
              <li>• Blog articles and web copy</li>
              <li>• Marketing strategy suggestions</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <span>Team Analytics</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-3">
              Track your team's content creation and performance metrics.
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Content generation statistics</li>
              <li>• Team productivity insights</li>
              <li>• Credit usage and optimization</li>
              <li>• Performance trending</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-purple-600" />
              <span>Team Management</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-3">
              Collaborate effectively with role-based permissions and controls.
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Invite and manage team members</li>
              <li>• Set roles and permissions</li>
              <li>• Monitor team activity</li>
              <li>• Bulk member operations</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-green-600" />
              <span>Smart Integrations</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-3">
              Connect with your favorite marketing tools and platforms.
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Social media scheduling</li>
              <li>• CRM integrations</li>
              <li>• Email marketing platforms</li>
              <li>• Analytics and reporting tools</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Sparkles className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-800 mb-1">Pro Tip</h4>
            <p className="text-yellow-700 text-sm">
              Start with content generation to get familiar with the AI tools, then explore team analytics to track your success!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FirstContentStep({ onNext, onSkip }: OnboardingStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Create Your First Content</h2>
        <p className="text-gray-600">
          Let's generate your first piece of marketing content together!
        </p>
      </div>

      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6">
        <div className="text-center">
          <Zap className="h-16 w-16 text-purple-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Ready to create something amazing?</h3>
          <p className="text-gray-600 mb-4">
            Our AI will help you create engaging marketing content in seconds. 
            You can generate social media posts, email campaigns, blog content, and more!
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            <div className="bg-white rounded-lg p-4 border">
              <h4 className="font-medium mb-2">🎯 Social Media Posts</h4>
              <p className="text-sm text-gray-600">
                Engaging posts for all major platforms
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 border">
              <h4 className="font-medium mb-2">📧 Email Campaigns</h4>
              <p className="text-sm text-gray-600">
                Compelling email marketing content
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 border">
              <h4 className="font-medium mb-2">📝 Blog Articles</h4>
              <p className="text-sm text-gray-600">
                SEO-optimized blog posts and articles
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-500 mb-4">
          You can start creating content right after finishing this onboarding.
        </p>
        <div className="space-x-3">
          <Button variant="outline" onClick={onSkip}>
            Skip for Now
          </Button>
          <Button 
            onClick={() => {
              toast.info('Content generation will be available after onboarding!');
              onNext();
            }}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Let's Create Content!
          </Button>
        </div>
      </div>
    </div>
  );
}

function CompletionStep({ onComplete }: OnboardingStepProps) {
  const { currentTeam } = useTeamContext();
  
  return (
    <div className="text-center space-y-6">
      <div className="relative mx-auto w-32 h-32 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
        <CheckCircle className="h-16 w-16 text-white" />
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-pulse">
          <Sparkles className="h-4 w-4 text-yellow-800" />
        </div>
      </div>
      
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Congratulations! 🎉
        </h2>
        <p className="text-lg text-gray-600 mb-4">
          You're all set to supercharge your marketing with {currentTeam?.name}!
        </p>
      </div>

      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-3">What's Next?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
          <div className="flex items-start space-x-3">
            <Zap className="h-5 w-5 text-purple-600 mt-1" />
            <div>
              <h4 className="font-medium">Generate Content</h4>
              <p className="text-sm text-gray-600">
                Start creating your first marketing content with AI assistance
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Users className="h-5 w-5 text-blue-600 mt-1" />
            <div>
              <h4 className="font-medium">Invite Your Team</h4>
              <p className="text-sm text-gray-600">
                Add colleagues to collaborate on marketing campaigns
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <BarChart3 className="h-5 w-5 text-green-600 mt-1" />
            <div>
              <h4 className="font-medium">Track Performance</h4>
              <p className="text-sm text-gray-600">
                Monitor your team's productivity and content success
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Target className="h-5 w-5 text-orange-600 mt-1" />
            <div>
              <h4 className="font-medium">Optimize Strategy</h4>
              <p className="text-sm text-gray-600">
                Use analytics to improve your marketing approach
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-gray-600">
          Need help? Check out our knowledge base or contact support anytime.
        </p>
        <Button 
          onClick={onComplete}
          size="lg"
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          <Target className="h-5 w-5 mr-2" />
          Let's Get Started!
        </Button>
      </div>
    </div>
  );
}

export default OnboardingFlow;