
import { Loader2 } from "lucide-react";
import { SettingsLayout } from "./SettingsLayout";

export const SettingsLoading = () => {
  return (
    <SettingsLayout>
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        <span className="ml-2 text-gray-600">Loading your settings...</span>
      </div>
    </SettingsLayout>
  );
};
