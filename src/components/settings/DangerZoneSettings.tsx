
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trash2, AlertTriangle } from "lucide-react";

interface DangerZoneSettingsProps {
  onDeleteAccount: () => void;
  isLoading?: boolean;
}

export const DangerZoneSettings = ({ onDeleteAccount, isLoading }: DangerZoneSettingsProps) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteClick = () => {
    onDeleteAccount();
    setShowDeleteConfirm(false);
  };

  return (
    <Card className="border-red-200">
      <CardHeader>
        <CardTitle className="flex items-center text-red-600">
          <AlertTriangle className="mr-3 h-5 w-5" aria-hidden="true" />
          Danger Zone
        </CardTitle>
      </CardHeader>
      <CardContent>
        {showDeleteConfirm ? (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Are you absolutely sure?</strong> This action cannot be undone. 
              This will permanently delete your account and remove all your data from our servers.
              <div className="mt-4 flex gap-3">
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={handleDeleteClick}
                  disabled={isLoading}
                >
                  {isLoading ? "Deleting..." : "Yes, delete my account"}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Delete Account</h4>
              <p className="text-sm text-gray-500">
                Permanently remove your account and all associated data
              </p>
            </div>
            <Button 
              variant="destructive" 
              onClick={() => setShowDeleteConfirm(true)} 
              aria-describedby="delete-warning"
            >
              <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
              Delete Account
            </Button>
          </div>
        )}
        <p id="delete-warning" className="sr-only">
          Warning: This action cannot be undone and will permanently delete all your data
        </p>
      </CardContent>
    </Card>
  );
};
