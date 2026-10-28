import { StoreAuditLog } from "../../models/index.js";
export const SELLER_TEAM_AUDIT_ACTIONS = {
    TEAM_MEMBER_INVITE: "TEAM_MEMBER_INVITE",
    TEAM_MEMBER_INVITE_ACCEPT: "TEAM_MEMBER_INVITE_ACCEPT",
    TEAM_MEMBER_INVITE_DECLINE: "TEAM_MEMBER_INVITE_DECLINE",
    TEAM_MEMBER_REINVITE: "TEAM_MEMBER_REINVITE",
    TEAM_MEMBER_ATTACH: "TEAM_MEMBER_ATTACH",
    TEAM_MEMBER_ROLE_CHANGE: "TEAM_MEMBER_ROLE_CHANGE",
    TEAM_MEMBER_DISABLE: "TEAM_MEMBER_DISABLE",
    TEAM_MEMBER_REACTIVATE: "TEAM_MEMBER_REACTIVATE",
    TEAM_MEMBER_REMOVE: "TEAM_MEMBER_REMOVE",
};
function serializeAuditState(value) {
    if (!value)
        return null;
    return JSON.stringify(value);
}
export async function recordSellerTeamAudit(payload) {
    return StoreAuditLog.create({
        storeId: payload.storeId,
        actorUserId: payload.actorUserId ?? null,
        targetUserId: payload.targetUserId ?? null,
        targetMemberId: payload.targetMemberId ?? null,
        action: payload.action,
        beforeState: serializeAuditState(payload.beforeState),
        afterState: serializeAuditState(payload.afterState),
    });
}
