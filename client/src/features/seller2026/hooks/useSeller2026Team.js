import { useQuery } from "@tanstack/react-query";
import { getSellerInvitations } from "../../../api/sellerInvitations.ts";
import { getSellerTeamAudit } from "../../../api/sellerTeamAudit.ts";
import { getSellerStoreMemberLifecycle, getSellerTeamSummary } from "../../../api/sellerTeam.ts";
import {
  adaptSeller2026MemberDetail,
  adaptSeller2026Team,
  adaptSeller2026TeamAudit,
} from "../adapters/seller2026TeamAdapter.js";
import { toSeller2026HookState, useSeller2026LiveRoute } from "./useSeller2026LiveRoute.js";

export function useSeller2026Team(params = {}) {
  const liveRoute = useSeller2026LiveRoute();
  const { storeId } = liveRoute;
  const query = useQuery({
    queryKey: ["seller2026", "team", storeId, params],
    enabled: Boolean(storeId),
    queryFn: async () => {
      const [summary, invitations, audit] = await Promise.all([
        getSellerTeamSummary(storeId),
        getSellerInvitations(),
        getSellerTeamAudit(storeId, params),
      ]);
      return {
        ...adaptSeller2026Team(summary),
        invitations,
        audit: adaptSeller2026TeamAudit(audit),
      };
    },
  });

  return { ...liveRoute, ...toSeller2026HookState(query, (data) => (data?.members || []).length === 0) };
}

export function useSeller2026Member(memberId) {
  const liveRoute = useSeller2026LiveRoute();
  const { storeId } = liveRoute;
  const query = useQuery({
    queryKey: ["seller2026", "team-member", storeId, memberId],
    enabled: Boolean(storeId && memberId),
    queryFn: async () => adaptSeller2026MemberDetail(await getSellerStoreMemberLifecycle(storeId, memberId)),
  });

  return { ...liveRoute, ...toSeller2026HookState(query, (data) => !data?.member) };
}
