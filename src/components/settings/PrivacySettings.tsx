
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Shield } from "lucide-react";
import { PrivacySettings as PrivacySettingsType } from "@/services/settingsService";

interface PrivacySettingsProps {
  privacy: PrivacySettingsType;
  onUpdate: (updates: Partial<PrivacySettingsType>) => void;
  isLoading?: boolean;
}

export const PrivacySettings = ({ privacy, onUpdate, isLoading }: PrivacySettingsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
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
            <Switch 
              id="profile-visible" 
              checked={privacy.profileVisible} 
              onCheckedChange={(checked) => onUpdate({ profileVisible: checked })}
              disabled={isLoading}
            />
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
            <Switch 
              id="analytics-sharing" 
              checked={privacy.analyticsSharing} 
              onCheckedChange={(checked) => onUpdate({ analyticsSharing: checked })}
              disabled={isLoading}
            />
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
            <Switch 
              id="data-export" 
              checked={privacy.dataExport} 
              onCheckedChange={(checked) => onUpdate({ dataExport: checked })}
              disabled={isLoading}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
