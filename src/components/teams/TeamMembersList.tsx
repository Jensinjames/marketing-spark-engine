
import React from "react";
import { TeamMemberWithCredits } from "@/types/team";
import { OptimizedTeamMembersList } from "./OptimizedTeamMembersList";

interface TeamMembersListProps {
  members: TeamMemberWithCredits[];
  teamId: string;
  currentUserRole: string;
  isLoading?: boolean;
}

export const TeamMembersList = (props: TeamMembersListProps) => {
  return <OptimizedTeamMembersList {...props} />;
};
