import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  inviteSellerStoreMember,
  reinviteSellerStoreMember,
  updateSellerStoreMemberRole,
  updateSellerStoreMemberStatus,
  removeSellerStoreMember,
} from "../../api/sellerTeam.ts";

export function useSeller2026TeamMutations(storeId: number | string | null | undefined) {
  const queryClient = useQueryClient();

  const invalidateTeam = () => {
    if (!storeId) return;
    queryClient.invalidateQueries({ queryKey: ["seller2026", "team", storeId] });
    queryClient.invalidateQueries({ queryKey: ["seller2026", "team-audit", storeId] });
    queryClient.invalidateQueries({ queryKey: ["seller2026", "member-detail", storeId] });
  };

  const inviteMutation = useMutation({
    mutationFn: (payload: { email: string; roleCode: string }) => {
      if (!storeId) throw new Error("Store ID is required");
      return inviteSellerStoreMember(storeId, payload);
    },
    onSuccess: () => invalidateTeam(),
  });

  const reinviteMutation = useMutation({
    mutationFn: (args: { memberId: number | string; roleCode: string }) => {
      if (!storeId) throw new Error("Store ID is required");
      return reinviteSellerStoreMember(storeId, args.memberId, { roleCode: args.roleCode });
    },
    onSuccess: () => invalidateTeam(),
  });

  const updateRoleMutation = useMutation({
    mutationFn: (args: { memberId: number | string; roleCode: string }) => {
      if (!storeId) throw new Error("Store ID is required");
      return updateSellerStoreMemberRole(storeId, args.memberId, { roleCode: args.roleCode });
    },
    onSuccess: () => invalidateTeam(),
  });

  const updateStatusMutation = useMutation({
    mutationFn: (args: { memberId: number | string; status: "ACTIVE" | "DISABLED" }) => {
      if (!storeId) throw new Error("Store ID is required");
      return updateSellerStoreMemberStatus(storeId, args.memberId, { status: args.status });
    },
    onSuccess: () => invalidateTeam(),
  });

  const removeMutation = useMutation({
    mutationFn: (memberId: number | string) => {
      if (!storeId) throw new Error("Store ID is required");
      return removeSellerStoreMember(storeId, memberId);
    },
    onSuccess: () => invalidateTeam(),
  });

  return {
    invite: inviteMutation,
    reinvite: reinviteMutation,
    updateRole: updateRoleMutation,
    updateStatus: updateStatusMutation,
    remove: removeMutation,
  };
}
