import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSellerTeamSummary } from "../../api/sellerTeam.ts";
import { getSellerTeamAudit } from "../../api/sellerTeamAudit.ts";
import {
  adaptSeller2026TeamAudit,
  emptySeller2026TeamAudit,
  type Seller2026TeamAuditViewModel,
} from "../../api/seller2026/team.adapter.ts";

export type Seller2026TeamAuditQuery = {
  action?: string;
  member?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
};

type UseSeller2026TeamAuditOptions = {
  enabled?: boolean;
};

const filterAudit = (
  data: Seller2026TeamAuditViewModel,
  query: Seller2026TeamAuditQuery
): Seller2026TeamAuditViewModel => {
  const member = String(query.member || "").trim().toLowerCase();
  const dateFrom = query.dateFrom ? new Date(query.dateFrom).getTime() : null;
  const dateTo = query.dateTo ? new Date(query.dateTo).getTime() : null;
  const auditLogs = data.auditLogs.filter((log) => {
    const logTime = log.time ? new Date(log.time).getTime() : null;
    const memberMatches =
      !member || `${log.memberName} ${log.target} ${log.action}`.toLowerCase().includes(member);
    const fromMatches = !dateFrom || !logTime || logTime >= dateFrom;
    const toMatches = !dateTo || !logTime || logTime <= dateTo;
    return memberMatches && fromMatches && toMatches;
  });

  return {
    ...data,
    auditLogs,
  };
};

export function useSeller2026TeamAudit(
  storeId: number | string | null | undefined,
  query: Seller2026TeamAuditQuery = {},
  options: UseSeller2026TeamAuditOptions = {}
) {
  const enabled = Boolean(storeId) && options.enabled !== false;
  const auditQuery = useQuery({
    queryKey: ["seller2026", "team-audit", storeId, query.action, query.page, query.limit],
    queryFn: () =>
      getSellerTeamAudit(storeId as number | string, {
        action: query.action && query.action !== "all" ? query.action : undefined,
        page: Number(query.page || 1),
        limit: Number(query.limit || 10),
      }),
    enabled,
    retry: false,
  });
  const teamQuery = useQuery({
    queryKey: ["seller2026", "team", storeId],
    queryFn: () => getSellerTeamSummary(storeId as number | string),
    enabled,
    retry: false,
  });

  const data = useMemo(() => {
    if (!enabled && !auditQuery.data && !teamQuery.data) return emptySeller2026TeamAudit;
    return filterAudit(adaptSeller2026TeamAudit(auditQuery.data, teamQuery.data), query);
  }, [auditQuery.data, enabled, query, teamQuery.data]);

  return {
    data,
    isLoading: auditQuery.isLoading || teamQuery.isLoading,
    isError: auditQuery.isError || teamQuery.isError,
    error: auditQuery.error || teamQuery.error,
    refetch: () => {
      void auditQuery.refetch();
      void teamQuery.refetch();
    },
  };
}
