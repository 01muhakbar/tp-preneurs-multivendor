import { useQuery } from "@tanstack/react-query";
import { getSellerAttributes, getSellerAttributeValues } from "../../../api/sellerAttributes.ts";
import {
  adaptSeller2026Attributes,
  adaptSeller2026AttributeValues,
} from "../adapters/seller2026TaxonomyAdapter.js";
import { toSeller2026HookState, useSeller2026LiveRoute } from "./useSeller2026LiveRoute.js";

export function useSeller2026Attributes(params = {}) {
  const liveRoute = useSeller2026LiveRoute();
  const { storeId } = liveRoute;
  const query = useQuery({
    queryKey: ["seller2026", "attributes", storeId, params],
    enabled: Boolean(storeId),
    queryFn: async () => adaptSeller2026Attributes(await getSellerAttributes(storeId, params)),
  });

  return { ...liveRoute, ...toSeller2026HookState(query, (data) => (data?.attributes || []).length === 0) };
}

export function useSeller2026AttributeValues(attributeId, params = {}) {
  const liveRoute = useSeller2026LiveRoute();
  const { storeId } = liveRoute;
  const query = useQuery({
    queryKey: ["seller2026", "attribute-values", storeId, attributeId, params],
    enabled: Boolean(storeId && attributeId),
    queryFn: async () =>
      adaptSeller2026AttributeValues(await getSellerAttributeValues(storeId, attributeId, params)),
  });

  return { ...liveRoute, ...toSeller2026HookState(query, (data) => (data?.values || []).length === 0) };
}
