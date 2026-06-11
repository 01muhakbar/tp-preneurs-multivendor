import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createSellerStoreMember,
  getSellerStoreMemberLifecycle,
  getSellerTeamSummary,
  inviteSellerStoreMember,
} from "../../api/sellerTeam.ts";
import {
  adaptSeller2026MemberLifecycle,
  adaptSeller2026Team,
  emptySeller2026MemberLifecycle,
  emptySeller2026Team,
} from "../../api/seller2026/team.adapter.ts";

export type Seller2026TeamQuery = {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  limit?: number;
};

type UseSeller2026TeamOptions = {
  enabled?: boolean;
  selectedMemberId?: number | string | null;
};

type MemberPayload = {
  email: string;
  roleCode: string;
};

const normalize = (value: unknown) => String(value || "").trim().toLowerCase();

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export function useSeller2026Team(
  storeId: number | string | null | undefined,
  query: Seller2026TeamQuery = {},
  options: UseSeller2026TeamOptions = {}
) {
  const queryClient = useQueryClient();
  const enabled = Boolean(storeId) && options.enabled !== false;
  const selectedMemberId = options.selectedMemberId || null;
  const teamQuery = useQuery({
    queryKey: ["seller2026", "team", storeId],
    queryFn: () => getSellerTeamSummary(storeId as number | string),
    enabled,
    retry: false,
  });

  const fullData = useMemo(() => {
    if (!enabled && !teamQuery.data) return emptySeller2026Team;
    return adaptSeller2026Team(teamQuery.data);
  }, [enabled, teamQuery.data]);

  const search = normalize(query.search);
  const role = String(query.role || "all");
  const status = String(query.status || "all").toLowerCase();
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Number(query.limit) || 10);
  const filteredMembers = useMemo(
    () =>
      fullData.members.filter((member) => {
        const haystack = normalize(
          `${member.name} ${member.email} ${member.roleName} ${member.roleCode} ${member.statusLabel}`
        );
        const roleMatches =
          role === "all" || member.roleCode === role || String(member.id) === role;
        const statusMatches =
          status === "all" ||
          member.status === status ||
          member.statusCode.toLowerCase() === status;
        return (!search || haystack.includes(search)) && roleMatches && statusMatches;
      }),
    [fullData.members, role, search, status]
  );
  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / limit));
  const safePage = Math.min(page, totalPages);
  const members = filteredMembers.slice((safePage - 1) * limit, safePage * limit);
  const data = useMemo(
    () => ({ ...fullData, members }),
    [fullData, members]
  );

  const fallbackMember =
    fullData.members.find((member) => String(member.id) === String(selectedMemberId)) || null;
  const lifecycleQuery = useQuery({
    queryKey: [
      "seller2026",
      "team",
      storeId,
      "member-lifecycle",
      selectedMemberId,
    ],
    queryFn: () =>
      getSellerStoreMemberLifecycle(
        storeId as number | string,
        selectedMemberId as number | string
      ),
    enabled: enabled && Boolean(selectedMemberId),
    retry: false,
  });
  const lifecycle = useMemo(() => {
    if (!selectedMemberId) return emptySeller2026MemberLifecycle;
    return adaptSeller2026MemberLifecycle(lifecycleQuery.data, fallbackMember);
  }, [fallbackMember, lifecycleQuery.data, selectedMemberId]);

  const invalidateTeam = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["seller2026", "team", storeId] }),
      queryClient.invalidateQueries({ queryKey: ["seller", "team", storeId] }),
      queryClient.invalidateQueries({ queryKey: ["seller", "team", "audit"] }),
    ]);
  };

  const validatePayload = (payload: MemberPayload, capability: boolean) => {
    const email = String(payload.email || "").trim().toLowerCase();
    const roleCode = String(payload.roleCode || "").trim();
    if (!capability) throw new Error("This team action is not available for your role.");
    if (!isValidEmail(email)) throw new Error("Enter a valid email address.");
    if (!fullData.currentAccess.capabilities.manageableRoleCodes.includes(roleCode)) {
      throw new Error("Select a role you are allowed to assign.");
    }
    return { email, roleCode };
  };

  const inviteMutation = useMutation({
    mutationFn: (payload: MemberPayload) =>
      inviteSellerStoreMember(
        storeId as number | string,
        validatePayload(payload, fullData.currentAccess.capabilities.canInviteMembers)
      ),
    onSuccess: invalidateTeam,
  });

  const attachMutation = useMutation({
    mutationFn: (payload: MemberPayload) =>
      createSellerStoreMember(
        storeId as number | string,
        validatePayload(payload, fullData.currentAccess.capabilities.canAttachMembers)
      ),
    onSuccess: invalidateTeam,
  });

  return {
    data,
    fullData,
    filteredCount: filteredMembers.length,
    pagination: {
      page: safePage,
      limit,
      total: filteredMembers.length,
      totalPages,
    },
    manageableRoles: fullData.roles.filter((item) => item.isManageable && item.isActive),
    lifecycle,
    lifecycleState: {
      isLoading: lifecycleQuery.isLoading,
      isError: lifecycleQuery.isError,
      error: lifecycleQuery.error,
      refetch: lifecycleQuery.refetch,
    },
    inviteMember: inviteMutation.mutateAsync,
    addExistingMember: attachMutation.mutateAsync,
    isSubmitting: inviteMutation.isPending || attachMutation.isPending,
    mutationError: inviteMutation.error || attachMutation.error,
    isLoading: teamQuery.isLoading,
    isError: teamQuery.isError,
    error: teamQuery.error,
    refetch: teamQuery.refetch,
  };
}
