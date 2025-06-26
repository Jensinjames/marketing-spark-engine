
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { TeamMemberWithCredits } from "@/hooks/useTeamMembersWithCredits";
import { useTeamMemberActions } from "@/hooks/useTeamMemberActions";
import { Users, CreditCard, UserMinus, Settings } from "lucide-react";
import { toast } from "sonner";

interface BulkActionsProps {
  members: TeamMemberWithCredits[];
  teamId: string;
  currentUserRole: string;
}

export const BulkActions = ({ members, teamId, currentUserRole }: BulkActionsProps) => {
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<string>('');
  const [bulkRole, setBulkRole] = useState<string>('');
  const [bulkCredits, setBulkCredits] = useState<number>(0);

  const { updateRole, updateCredits, removeMember } = useTeamMemberActions(teamId);

  const canBulkManage = ['owner', 'admin'].includes(currentUserRole);
  const selectableMembers = members.filter(m => m.role !== 'owner' && canBulkManage);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedMembers(selectableMembers.map(m => m.id));
    } else {
      setSelectedMembers([]);
    }
  };

  const handleSelectMember = (memberId: string, checked: boolean) => {
    if (checked) {
      setSelectedMembers([...selectedMembers, memberId]);
    } else {
      setSelectedMembers(selectedMembers.filter(id => id !== memberId));
    }
  };

  const executeBulkAction = async () => {
    if (selectedMembers.length === 0) {
      toast.error('Please select at least one member');
      return;
    }

    if (!bulkAction) {
      toast.error('Please select an action');
      return;
    }

    try {
      const promises = selectedMembers.map(async (memberId) => {
        switch (bulkAction) {
          case 'update_role':
            if (!bulkRole) {
              throw new Error('Please select a role');
            }
            return updateRole.mutateAsync({ memberId, newRole: bulkRole });
          
          case 'update_credits':
            if (!bulkCredits || bulkCredits <= 0) {
              throw new Error('Please enter a valid credit amount');
            }
            return updateCredits.mutateAsync({ memberId, creditsLimit: bulkCredits });
          
          case 'remove_members':
            return removeMember.mutateAsync(memberId);
          
          default:
            throw new Error('Invalid action');
        }
      });

      await Promise.all(promises);
      toast.success(`Bulk action completed for ${selectedMembers.length} members`);
      setSelectedMembers([]);
      setBulkAction('');
      setBulkRole('');
      setBulkCredits(0);
      
    } catch (error: any) {
      console.error('Bulk action error:', error);
      toast.error(error.message || 'Failed to execute bulk action');
    }
  };

  if (!canBulkManage || selectableMembers.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center">
          <Settings className="h-5 w-5 mr-2" />
          Bulk Actions
        </h3>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="select-all"
            checked={selectedMembers.length === selectableMembers.length}
            onCheckedChange={handleSelectAll}
          />
          <label htmlFor="select-all" className="text-sm">
            Select All ({selectableMembers.length})
          </label>
        </div>
      </div>

      {/* Member Selection */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-32 overflow-y-auto">
        {selectableMembers.map((member) => (
          <div key={member.id} className="flex items-center space-x-2">
            <Checkbox
              id={`member-${member.id}`}
              checked={selectedMembers.includes(member.id)}
              onCheckedChange={(checked) => handleSelectMember(member.id, !!checked)}
            />
            <label htmlFor={`member-${member.id}`} className="text-sm truncate">
              {member.name}
            </label>
          </div>
        ))}
      </div>

      {selectedMembers.length > 0 && (
        <div className="flex items-center space-x-4 pt-2 border-t">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">
              {selectedMembers.length} selected
            </span>
          </div>

          <Select value={bulkAction} onValueChange={setBulkAction}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Choose action..." />
            </SelectTrigger>
            <SelectContent>
              {currentUserRole === 'owner' && (
                <SelectItem value="update_role">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Update Role
                  </div>
                </SelectItem>
              )}
              <SelectItem value="update_credits">
                <div className="flex items-center">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Update Credits
                </div>
              </SelectItem>
              {currentUserRole === 'owner' && (
                <SelectItem value="remove_members">
                  <div className="flex items-center">
                    <UserMinus className="h-4 w-4 mr-2" />
                    Remove Members
                  </div>
                </SelectItem>
              )}
            </SelectContent>
          </Select>

          {bulkAction === 'update_role' && (
            <Select value={bulkRole} onValueChange={setBulkRole}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Role..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          )}

          {bulkAction === 'update_credits' && (
            <Input
              type="number"
              placeholder="Credits"
              value={bulkCredits || ''}
              onChange={(e) => setBulkCredits(parseInt(e.target.value) || 0)}
              className="w-24"
              min="0"
              max="10000"
            />
          )}

          <Button
            onClick={executeBulkAction}
            disabled={
              !bulkAction ||
              (bulkAction === 'update_role' && !bulkRole) ||
              (bulkAction === 'update_credits' && (!bulkCredits || bulkCredits <= 0)) ||
              updateRole.isPending ||
              updateCredits.isPending ||
              removeMember.isPending
            }
            variant={bulkAction === 'remove_members' ? 'destructive' : 'default'}
          >
            Execute
          </Button>
        </div>
      )}
    </div>
  );
};
