
import { useSettingsForm } from "@/hooks/useSettingsForm";
import { SettingsLayout } from "@/components/settings/SettingsLayout";
import { SettingsLoading } from "@/components/settings/SettingsLoading";
import { SettingsContent } from "@/components/settings/SettingsContent";

const Settings = () => {
  const { isLoading } = useSettingsForm();

  if (isLoading) {
    return <SettingsLoading />;
  }

  return (
    <SettingsLayout>
      <SettingsContent />
    </SettingsLayout>
  );
};

export default Settings;
