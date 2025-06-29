
import React from "react";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";

export const TeamsHeader = () => {
  const handleInviteMember = () => {
    toast.info("Invite member functionality will be implemented next");
  };

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
        <p className="text-lg text-gray-600 mt-2">
          Manage your team members, roles, and credit usage.
        </p>
      </div>
      <Button className="bg-purple-600 hover:bg-purple-700" onClick={handleInviteMember}>
        <UserPlus className="h-4 w-4 mr-2" />
        Invite Member
      </Button>
    </div>
  );
};
