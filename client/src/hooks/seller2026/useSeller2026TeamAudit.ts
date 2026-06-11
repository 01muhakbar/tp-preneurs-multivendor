import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getSellerTeamSummary,
  inviteSellerStoreMember,
} from "../../api/sellerTeam.ts";
import { getSellerTeamAudit } from "../../api/sellerTeamAudit.ts";
import {
  adaptSeller2026TeamAudit,
  emptySeller2026TeamAudit,
} from "../../api/seller2026/teamAudit.adapter.ts";

export type Seller2026TeamAuditQuery = {
  action?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
};

type UseSeller2026TeamAuditOptions = {
  enabled?: boolean;
};

type InvitePayload = {
  email: string;
  roleCode: string;
};

const normalize = (value: unknown) => String(value || "").trim().toLowerCase();
const validEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export function useSeller2026TeamAudit(
  storeId: number | string | null | undefined,
  query: Seller2026TeamAuditQuery = {},
  options: UseSeller2026TeamAuditOptions = {}
) {
  const queryClient = useQueryClient();
  const enabled = Boolean(storeId) && options.enabled !== false;
  const action = String(query.action || "all");
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Number(query.limit) || 10);

  const auditQuery = useQuery({
    queryKey: ["seller2026", "team-audit", storeId, action, page, limit],
    queryFn: () =>
      getSellerTeamAudit(storeId as number | string, {
        action: action !== "all" ? action : undefined,
        page,
        limit,
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

  const fullData = useMemo(() => {
    if (!enabled && !auditQuery.data && !teamQuery.data) return emptySeller2026TeamAudit;
    return adaptSeller2026TeamAudit(auditQuery.data, teamQuery.data);
  }, [auditQuery.data, enabled, teamQuery.data]);

  const search = normalize(query.search);
  const fromTime = query.dateFrom ? new Date(`${query.dateFrom}T00:00:00`).getTime() : null;
  const toTime = query.dateTo ? new Date(`${query.dateTo}T23:59:59.999`).getTime() : null;
  const auditRows = useMemo(
    () =>
      fullData.auditRows.filter((row) => {
        const recordedTime = row.recordedAt ? new Date(row.recordedAt).getTime() : null;
        const haystack = normalize(
          `${row.actionLabel} ${row.action} ${row.actor.name} ${row.actor.email} ${row.target.name} ${row.target.email} ${row.change} ${row.summary}`
        );
        return (
          (!search || haystack.includes(search)) &&
          (!fromTime || !recordedTime || recordedTime >= fromTime) &&
          (!toTime || !recordedTime || recordedTime <= toTime)
        );
      }),
    [fromTime, fullData.auditRows, search, toTime]
  );
  const data = useMemo(() => ({ ...fullData, auditRows }), [auditRows, fullData]);

  const inviteMutation = useMutation({
    mutationFn: (payload: InvitePayload) => {
      const email = String(payload.email || "").trim().toLowerCase();
      const roleCode = String(payload.roleCode || "").trim();
      if (!fullData.capabilities.canInviteMembers) {
        throw new Error("Inviting members is not available for your role.");
      }
      if (!validEmail(email)) throw new Error("Enter a valid email address.");
      if (!fullData.assignableRoles.some((role) => role.code === roleCode)) {
        throw new Error("Select a role you are allowed to assign.");
      }
      return inviteSellerStoreMember(storeId as number | string, { email, roleCode });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["seller2026", "team", storeId] }),
        queryClient.invalidateQueries({ queryKey: ["seller2026", "team-audit", storeId] }),
        queryClient.invalidateQueries({ queryKey: ["seller", "team", storeId] }),
        queryClient.invalidateQueries({ queryKey: ["seller", "team", "audit"] }),
      ]);
    },
  });

  return {
    data,
    inviteMember: inviteMutation.mutateAsync,
    isInviting: inviteMutation.isPending,
    mutationError: inviteMutation.error,
    isLoading: auditQuery.isLoading || teamQuery.isLoading,
    isError: auditQuery.isError || teamQuery.isError,
    error: auditQuery.error || teamQuery.error,
    refetch: () => {
      void auditQuery.refetch();
      void teamQuery.refetch();
    },
  };
}
