import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User, Bell, Shield, Palette, Globe, Trash2, Save, AlertTriangle } from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth";
const Settings = () => {
  const {
    user
  } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Form states
  const [profile, setProfile] = useState({
    fullName: user?.user_metadata?.full_name || "",
    email: user?.email || "",
    company: "",
    timezone: "UTC"
  });
  const [notifications, setNotifications] = useState({
    emailUpdates: true,
    creditAlerts: true,
    weeklyReport: false,
    marketingEmails: false
  });
  const [privacy, setPrivacy] = useState({
    profileVisible: true,
    analyticsSharing: false,
    dataExport: true
  });
  const handleSave = async () => {
    setIsSaving(true);
    // Simulate save operation
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
  };
  return <AuthGuard requireAuth={true}>
      <Layout>
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <header className="mb-8">
            <h1 className="text-4xl font-bold mb-3 text-zinc-800">
              Settings
            </h1>
            <p className="text-base font-normal text-zinc-800">
              Manage your account preferences and security settings
            </p>
          </header>

          <div className="space-y-8">
            {/* Profile Settings */}
            <section aria-labelledby="profile-heading">
              <Card>
                <CardHeader>
                  <CardTitle id="profile-heading" className="flex items-center">
                    <User className="mr-3 h-5 w-5" aria-hidden="true" />
                    Profile Information
                  </CardTitle>
                  <CardDescription>
                    Update your personal information and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="full-name">Full Name *</Label>
                      <Input id="full-name" value={profile.fullName} onChange={e => setProfile({
                      ...profile,
                      fullName: e.target.value
                    })} required aria-describedby="full-name-help" />
                      <p id="full-name-help" className="text-sm text-gray-500">
                        This name will be displayed in your account
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input id="email" type="email" value={profile.email} onChange={e => setProfile({
                      ...profile,
                      email: e.target.value
                    })} required aria-describedby="email-help" />
                      <p id="email-help" className="text-sm text-gray-500">
                        Used for login and important notifications
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="company">Company (Optional)</Label>
                      <Input id="company" value={profile.company} onChange={e => setProfile({
                      ...profile,
                      company: e.target.value
                    })} placeholder="Your company name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <select id="timezone" value={profile.timezone} onChange={e => setProfile({
                      ...profile,
                      timezone: e.target.value
                    })} className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500" aria-describedby="timezone-help">
                        <option value="UTC">UTC</option>
                        <option value="US/Eastern">Eastern Time</option>
                        <option value="US/Central">Central Time</option>
                        <option value="US/Mountain">Mountain Time</option>
                        <option value="US/Pacific">Pacific Time</option>
                        <option value="Europe/London">London</option>
                        <option value="Europe/Paris">Paris</option>
                        <option value="Asia/Tokyo">Tokyo</option>
                      </select>
                      <p id="timezone-help" className="text-sm text-gray-500">
                        Used for scheduling and reporting
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Notification Settings */}
            <section aria-labelledby="notifications-heading">
              <Card>
                <CardHeader>
                  <CardTitle id="notifications-heading" className="flex items-center">
                    <Bell className="mr-3 h-5 w-5" aria-hidden="true" />
                    Notification Preferences
                  </CardTitle>
                  <CardDescription>
                    Choose what notifications you want to receive
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="email-updates" className="text-base font-medium">
                          Email Updates
                        </Label>
                        <p className="text-sm text-gray-500">
                          Receive important account updates via email
                        </p>
                      </div>
                      <Switch id="email-updates" checked={notifications.emailUpdates} onCheckedChange={checked => setNotifications({
                      ...notifications,
                      emailUpdates: checked
                    })} aria-describedby="email-updates-desc" />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="credit-alerts" className="text-base font-medium">
                          Credit Alerts
                        </Label>
                        <p className="text-sm text-gray-500">
                          Get notified when your credits are running low
                        </p>
                      </div>
                      <Switch id="credit-alerts" checked={notifications.creditAlerts} onCheckedChange={checked => setNotifications({
                      ...notifications,
                      creditAlerts: checked
                    })} />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="weekly-report" className="text-base font-medium">
                          Weekly Usage Report
                        </Label>
                        <p className="text-sm text-gray-500">
                          Receive a summary of your weekly activity
                        </p>
                      </div>
                      <Switch id="weekly-report" checked={notifications.weeklyReport} onCheckedChange={checked => setNotifications({
                      ...notifications,
                      weeklyReport: checked
                    })} />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="marketing-emails" className="text-base font-medium">
                          Marketing Emails
                        </Label>
                        <p className="text-sm text-gray-500">
                          Receive tips, feature updates, and promotions
                        </p>
                      </div>
                      <Switch id="marketing-emails" checked={notifications.marketingEmails} onCheckedChange={checked => setNotifications({
                      ...notifications,
                      marketingEmails: checked
                    })} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Privacy Settings */}
            <section aria-labelledby="privacy-heading">
              <Card>
                <CardHeader>
                  <CardTitle id="privacy-heading" className="flex items-center">
                    <Shield className="mr-3 h-5 w-5" aria-hidden="true" />
                    Privacy & Security
                  </CardTitle>
                  <CardDescription>
                    Control your privacy and data sharing preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="profile-visible" className="text-base font-medium">
                          Public Profile
                        </Label>
                        <p className="text-sm text-gray-500">
                          Make your profile visible to other users
                        </p>
                      </div>
                      <Switch id="profile-visible" checked={privacy.profileVisible} onCheckedChange={checked => setPrivacy({
                      ...privacy,
                      profileVisible: checked
                    })} />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="analytics-sharing" className="text-base font-medium">
                          Analytics Sharing
                        </Label>
                        <p className="text-sm text-gray-500">
                          Help improve our service by sharing anonymous usage data
                        </p>
                      </div>
                      <Switch id="analytics-sharing" checked={privacy.analyticsSharing} onCheckedChange={checked => setPrivacy({
                      ...privacy,
                      analyticsSharing: checked
                    })} />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="data-export" className="text-base font-medium">
                          Data Export
                        </Label>
                        <p className="text-sm text-gray-500">
                          Allow downloading your data for backup purposes
                        </p>
                      </div>
                      <Switch id="data-export" checked={privacy.dataExport} onCheckedChange={checked => setPrivacy({
                      ...privacy,
                      dataExport: checked
                    })} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Danger Zone */}
            <section aria-labelledby="danger-heading">
              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle id="danger-heading" className="flex items-center text-red-600">
                    <AlertTriangle className="mr-3 h-5 w-5" aria-hidden="true" />
                    Danger Zone
                  </CardTitle>
                  <CardDescription>
                    Irreversible actions that will affect your account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {showDeleteConfirm ? <Alert className="border-red-200 bg-red-50">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800">
                        <strong>Are you absolutely sure?</strong> This action cannot be undone. 
                        This will permanently delete your account and remove all your data from our servers.
                        <div className="mt-4 flex gap-3">
                          <Button variant="destructive" size="sm" onClick={() => {
                        // Handle account deletion
                        console.log("Account deletion confirmed");
                      }}>
                            Yes, delete my account
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(false)}>
                            Cancel
                          </Button>
                        </div>
                      </AlertDescription>
                    </Alert> : <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-zinc-50">Delete Account</h4>
                        <p className="text-sm text-gray-500">
                          Permanently remove your account and all associated data
                        </p>
                      </div>
                      <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)} aria-describedby="delete-warning">
                        <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                        Delete Account
                      </Button>
                    </div>}
                  <p id="delete-warning" className="sr-only">
                    Warning: This action cannot be undone and will permanently delete all your data
                  </p>
                </CardContent>
              </Card>
            </section>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={isSaving} className="min-w-[120px]" aria-describedby="save-status">
                {isSaving ? "Saving..." : <>
                    <Save className="mr-2 h-4 w-4" aria-hidden="true" />
                    Save Changes
                  </>}
              </Button>
              <p id="save-status" className="sr-only">
                {isSaving ? "Settings are being saved" : "Click to save your changes"}
              </p>
            </div>
          </div>
        </div>
      </Layout>
    </AuthGuard>;
};
export default Settings;