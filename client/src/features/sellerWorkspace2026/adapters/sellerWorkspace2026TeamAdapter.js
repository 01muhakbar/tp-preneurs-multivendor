import { getSellerStoreProfile } from "../../../api/sellerStoreProfile.ts";
import { getSellerTeamSummary } from "../../../api/sellerTeam.ts";
import { getSellerTeamAudit } from "../../../api/sellerTeamAudit.ts";
import { getTeamFallback } from "../utils/sellerWorkspace2026Fallbacks.js";

const mapRole = (code) => {
  const c = code?.toLowerCase();
  if (c === "owner") return "Owner";
  if (c === "admin") return "Admin";
  if (c === "staff") return "Staff";
  if (c === "support") return "Support";
  if (c === "finance") return "Finance";
  if (c === "fulfillment") return "Fulfillment";
  if (c === "custom") return "Custom";
  return "Unknown";
};

const mapStatus = (status) => {
  const s = status?.toUpperCase();
  if (s === "ACTIVE") return "Active";
  if (s === "INVITED") return "Pending Invite";
  if (s === "DISABLED") return "Inactive";
  if (s === "REMOVED") return "Removed";
  return "Unknown";
};

export const fetchSellerWorkspace2026Team = async (storeSlug) => {
  try {
    const storeProfile = await getSellerStoreProfile(storeSlug);
    if (!storeProfile) {
      return getTeamFallback();
    }

    const teamData = await getSellerTeamSummary(storeProfile.id);
    if (!teamData) {
      return getTeamFallback();
    }

    let auditLogs = [];
    try {
      if (teamData.currentAccess?.capabilities?.canViewAudit) {
        const auditData = await getSellerTeamAudit(storeProfile.id, { limit: 10 });
        if (auditData?.items) {
          auditLogs = auditData.items.map(item => ({
            id: item.id,
            actorName: item.actor?.name || "System",
            action: item.action,
            targetName: item.target?.user?.name || item.target?.roleName || "Unknown",
            module: item.readModel?.category || "Team",
            timestamp: item.createdAt,
            description: item.readModel?.changeSummary || item.readModel?.title,
            severity: item.readModel?.tone || "stone"
          }));
        }
      }
    } catch (e) {
      console.warn("Failed to fetch audit logs", e);
    }

    const members = (teamData.members || []).map(member => {
      const isOwner = member.governance?.isOwner;
      const status = mapStatus(member.status);
      return {
        id: member.id,
        name: member.name,
        email: member.email,
        avatarUrl: null, // API doesn't provide
        role: member.roleCode || "unknown",
        roleLabel: isOwner ? "Owner" : (member.roleName || mapRole(member.roleCode)),
        status,
        storeScope: "Global", // Default to Global for now
        lastActiveAt: member.updatedAt || member.joinedAt, // Approximate last active
        invitedAt: member.invitedAt,
        joinedAt: member.joinedAt,
        allowedActions: [
          ...(member.governance?.canEditRole ? ["EDIT_ROLE"] : []),
          ...(member.governance?.canToggleStatus ? ["TOGGLE_STATUS"] : []),
          ...(member.governance?.canRemove ? ["REMOVE"] : []),
          ...(member.governance?.canReinvite ? ["REINVITE"] : [])
        ]
      };
    });

    const roles = (teamData.roles || []).map(role => ({
      id: role.id,
      name: role.code,
      label: role.name || mapRole(role.code),
      description: role.description,
      permissions: role.permissionKeys || []
    }));

    return {
      store: {
        id: storeProfile.id,
        slug: storeProfile.slug,
        name: storeProfile.name,
        status: storeProfile.status
      },
      summary: {
        totalMembers: teamData.summary?.totalMembers || members.length,
        pendingInvites: teamData.summary?.invitedMembers || members.filter(m => m.status === "Pending Invite").length,
        activeRoles: roles.length,
        recentAccessChanges: auditLogs.length
      },
      members,
      roles,
      permissionMatrix: getTeamFallback().permissionMatrix, // Inferred fallback matrix as actual matrix endpoint isn't fully available
      auditLogs,
      governance: {
        backendEnforced: true,
        uiMatrixIsInformational: true,
        sellerCanInvite: teamData.currentAccess?.capabilities?.canInviteMembers || false,
        sellerCanUpdateRole: teamData.currentAccess?.capabilities?.canChangeRoles || false,
        sellerCanDeactivateMember: teamData.currentAccess?.capabilities?.canChangeStatus || false,
        sellerCanViewAudit: teamData.currentAccess?.capabilities?.canViewAudit || false
      },
      meta: {
        usingLiveData: true,
        inferredPermissions: true,
        unknownStatuses: []
      }
    };
  } catch (error) {
    console.error("Team Adapter Error:", error);
    const fallback = getTeamFallback();
    fallback.meta.usingLiveData = false;
    return fallback;
  }
};
