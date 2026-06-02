import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getSellerStoreMemberLifecycle,
  getSellerTeamSummary,
} from "../../api/sellerTeam.ts";
import {
  adaptSeller2026MemberDetail,
  emptySeller2026MemberDetail,
} from "../../api/seller2026/team.adapter.ts";

type UseSeller2026MemberDetailOptions = {
  enabled?: boolean;
};

export function useSeller2026MemberDetail(
  storeId: number | string | null | undefined,
  memberId: number | string | null | undefined,
  options: UseSeller2026MemberDetailOptions = {}
) {
  const enabled = Boolean(storeId) && Boolean(memberId) && options.enabled !== false;
  const teamQuery = useQuery({
    queryKey: ["seller2026", "team", storeId],
    queryFn: () => getSellerTeamSummary(storeId as number | string),
    enabled,
    retry: false,
  });
  const memberQuery = useQuery({
    queryKey: ["seller2026", "team", storeId, "member", memberId],
    queryFn: () =>
      getSellerStoreMemberLifecycle(storeId as number | string, memberId as number | string),
    enabled,
    retry: false,
  });

  const data = useMemo(() => {
    if (!enabled && !memberQuery.data) return emptySeller2026MemberDetail;
    return adaptSeller2026MemberDetail(memberQuery.data, teamQuery.data);
  }, [enabled, memberQuery.data, teamQuery.data]);

  return {
    data,
    isLoading: memberQuery.isLoading || teamQuery.isLoading,
    isError: memberQuery.isError || teamQuery.isError,
    error: memberQuery.error || teamQuery.error,
    refetch: () => {
      void memberQuery.refetch();
      void teamQuery.refetch();
    },
  };
}
