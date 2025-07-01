
import { Button } from "@/components/ui/button";
import { Save, Loader2 } from "lucide-react";

interface SettingsSaveButtonProps {
  onSave: () => void;
  isSaving: boolean;
}

export const SettingsSaveButton = ({ onSave, isSaving }: SettingsSaveButtonProps) => {
  return (
    <div className="flex justify-end">
      <Button 
        onClick={onSave} 
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
  );
};
