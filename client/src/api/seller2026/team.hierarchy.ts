export const TEAM_ROLE_RANK: Record<string, number> = {
  STORE_OWNER: 100,
  STORE_ADMIN: 80,
  FINANCE_VIEWER: 60,
  STORE_STAFF: 40,
};

export function getRoleRank(roleCode: string | null | undefined): number {
  const code = String(roleCode || "").toUpperCase();
  return TEAM_ROLE_RANK[code] ?? 20; // Default rank for unknown/viewer roles
}

export function isOwner(targetMemberOrAccess: any): boolean {
  if (!targetMemberOrAccess) return false;
  // Handle both store member snapshot and currentAccess
  const code = String(targetMemberOrAccess.roleCode || "").toUpperCase();
  const membershipStatus = String(targetMemberOrAccess.membershipStatus || "").toUpperCase();
  
  if (code === "STORE_OWNER") return true;
  if (membershipStatus === "VIRTUAL_OWNER") return true;
  
  // also check if governance.isOwner is exposed from backend
  if (targetMemberOrAccess.governance?.isOwner) return true;

  return false;
}

export function isCurrentUser(actorAccess: any, targetMember: any): boolean {
  if (!actorAccess || !targetMember) return false;
  
  // Checking through governance API if available
  if (targetMember.governance?.isSelf) return true;

  // Fallback checking memberId or userId
  const actorMemberId = Number(actorAccess.memberId || 0);
  const targetMemberId = Number(targetMember.id || 0);
  
  if (actorMemberId > 0 && targetMemberId > 0 && actorMemberId === targetMemberId) {
    return true;
  }
  
  return false;
}

export function canChangeRole(actorAccess: any, targetMember: any, nextRoleCode: string): boolean {
  if (!actorAccess || !targetMember) return false;
  
  // 1. Current user cannot change own role
  if (isCurrentUser(actorAccess, targetMember)) return false;
  
  // 2. Owner cannot be changed
  if (isOwner(targetMember)) return false;
  
  // 3. Backend governance flag
  if (targetMember.governance && !targetMember.governance.canEditRole) return false;

  const actorRank = getRoleRank(actorAccess.roleCode);
  const targetRank = getRoleRank(targetMember.roleCode);
  const nextRank = getRoleRank(nextRoleCode);

  // 4. Cannot change someone with higher or equal rank (unless backend explicitly allows via governance, but we double check)
  if (targetRank >= actorRank) return false;

  // 5. Cannot assign a role with higher or equal rank
  if (nextRank >= actorRank) return false;

  return true;
}

export function canRemoveMember(actorAccess: any, targetMember: any): boolean {
  if (!actorAccess || !targetMember) return false;

  // 1. Cannot remove self
  if (isCurrentUser(actorAccess, targetMember)) return false;

  // 2. Cannot remove owner
  if (isOwner(targetMember)) return false;

  // 3. Backend governance flag
  if (targetMember.governance && !targetMember.governance.canRemove) return false;

  const actorRank = getRoleRank(actorAccess.roleCode);
  const targetRank = getRoleRank(targetMember.roleCode);

  // 4. Cannot remove someone with higher or equal rank
  if (targetRank >= actorRank) return false;

  return true;
}

export function getDisabledReasonForRemoval(actorAccess: any, targetMember: any): string | null {
  if (!targetMember) return "Member not found.";
  if (isOwner(targetMember)) return "Owners cannot be removed from Seller Workspace.";
  if (isCurrentUser(actorAccess, targetMember)) return "You cannot remove your own access.";
  
  const actorRank = getRoleRank(actorAccess.roleCode);
  const targetRank = getRoleRank(targetMember.roleCode);
  
  if (targetRank >= actorRank) {
    return "This action is unavailable because it would exceed your permission level.";
  }
  
  if (targetMember.governance?.restrictionReason) {
    return targetMember.governance.restrictionReason;
  }
  
  if (targetMember.governance && !targetMember.governance.canRemove) {
    return "Permission editing is managed by the system and cannot be changed here.";
  }

  return null;
}

export function getDisabledReasonForRoleChange(actorAccess: any, targetMember: any, nextRoleCode?: string): string | null {
  if (!targetMember) return "Member not found.";
  if (isOwner(targetMember)) return "Store owner role cannot be changed.";
  if (isCurrentUser(actorAccess, targetMember)) return "You cannot change your own role.";
  
  const actorRank = getRoleRank(actorAccess.roleCode);
  const targetRank = getRoleRank(targetMember.roleCode);

  if (targetRank >= actorRank) {
    return "This role change is unavailable because it would exceed your permission level.";
  }
  
  if (nextRoleCode) {
    const nextRank = getRoleRank(nextRoleCode);
    if (nextRank >= actorRank) {
      return "You cannot assign a role equal to or higher than your own.";
    }
  }

  if (targetMember.governance?.restrictionReason) {
    return targetMember.governance.restrictionReason;
  }

  if (targetMember.governance && !targetMember.governance.canEditRole) {
    return "Permission editing is managed by the system and cannot be changed here.";
  }

  return null;
}
