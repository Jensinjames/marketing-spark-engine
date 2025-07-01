
import { Button } from "@/components/ui/button";
import { Save, Loader2 } from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import Layout from "@/components/layout/Layout";
import { useSettingsForm } from "@/hooks/useSettingsForm";
import { ProfileSettings } from "@/components/settings/ProfileSettings";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { PrivacySettings } from "@/components/settings/PrivacySettings";
import { DangerZoneSettings } from "@/components/settings/DangerZoneSettings";
import { SettingsErrorBoundary } from "@/components/settings/SettingsErrorBoundary";

const Settings = () => {
  const {
    profile,
    notifications,
    privacy,
    isLoading,
    isSaving,
    updateProfile,
    updateNotifications,
    updatePrivacy,
    saveSettings,
    deleteAccount
  } = useSettingsForm();

  if (isLoading) {
    return (
      <AuthGuard requireAuth={true}>
        <Layout>
          <div className="max-w-4xl mx-auto">
            <header className="mb-8">
              <h1 className="text-4xl font-bold mb-3 text-zinc-800">Settings</h1>
              <p className="text-base font-normal text-zinc-800">
                Manage your account preferences and security settings
              </p>
            </header>
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              <span className="ml-2 text-gray-600">Loading your settings...</span>
            </div>
          </div>
        </Layout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requireAuth={true}>
      <Layout>
        <div className="max-w-4xl mx-auto">
          <header className="mb-8">
            <h1 className="text-4xl font-bold mb-3 text-zinc-800">Settings</h1>
            <p className="text-base font-normal text-zinc-800">
              Manage your account preferences and security settings
            </p>
          </header>

          <SettingsErrorBoundary>
            <div className="space-y-8">
              <ProfileSettings 
                profile={profile}
                onUpdate={updateProfile}
                isLoading={isSaving}
              />

              <NotificationSettings 
                notifications={notifications}
                onUpdate={updateNotifications}
                isLoading={isSaving}
              />

              <PrivacySettings 
                privacy={privacy}
                onUpdate={updatePrivacy}
                isLoading={isSaving}
              />

              <DangerZoneSettings 
                onDeleteAccount={deleteAccount}
                isLoading={isSaving}
              />

              <div className="flex justify-end">
                <Button 
                  onClick={saveSettings} 
                  disabled={isSaving} 
                  className="min-w-[120px]"
                  aria-describedby="save-status"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
                <p id="save-status" className="sr-only">
                  {isSaving ? "Settings are being saved" : "Click to save your changes"}
                </p>
              </div>
            </div>
          </SettingsErrorBoundary>
        </div>
      </Layout>
    </AuthGuard>
  );
};

export default Settings;
