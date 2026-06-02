import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSellerTeamSummary } from "../../api/sellerTeam.ts";
import {
  adaptSeller2026Team,
  emptySeller2026Team,
  type Seller2026TeamViewModel,
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
};

const matchesSearch = (value: string, search?: string) =>
  !search || value.toLowerCase().includes(search.toLowerCase());

const filterTeam = (
  data: Seller2026TeamViewModel,
  query: Seller2026TeamQuery
): Seller2026TeamViewModel => {
  const search = String(query.search || "").trim();
  const role = String(query.role || "all");
  const status = String(query.status || "all");
  const members = data.members.filter((member) => {
    const haystack = `${member.name} ${member.email} ${member.roleName}`;
    const roleMatches = role === "all" || member.roleName === role || String(member.id) === role;
    const statusMatches = status === "all" || member.status === status;
    return matchesSearch(haystack, search) && roleMatches && statusMatches;
  });

  return {
    ...data,
    members,
  };
};

export function useSeller2026Team(
  storeId: number | string | null | undefined,
  query: Seller2026TeamQuery = {},
  options: UseSeller2026TeamOptions = {}
) {
  const enabled = Boolean(storeId) && options.enabled !== false;
  const teamQuery = useQuery({
    queryKey: ["seller2026", "team", storeId],
    queryFn: () => getSellerTeamSummary(storeId as number | string),
    enabled,
    retry: false,
  });

  const data = useMemo(() => {
    if (!enabled && !teamQuery.data) return emptySeller2026Team;
    return filterTeam(adaptSeller2026Team(teamQuery.data), query);
  }, [enabled, query, teamQuery.data]);

  return {
    data,
    isLoading: teamQuery.isLoading,
    isError: teamQuery.isError,
    error: teamQuery.error,
    refetch: teamQuery.refetch,
  };
}
