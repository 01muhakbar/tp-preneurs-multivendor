import { api } from "./axios.ts";

export type PublicShowcaseProduct = {
  id: number;
  name: string;
  price: number;
  salePrice?: number | null;
  stock?: number;
  images?: string[];
  slug?: string;
  rating?: number;
  averageRating?: number;
  totalReviews?: number;
};

export type PublicStoreShowcase = {
  id: number;
  storeId: number;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  sortOrder: number;
  productCount: number;
  products: PublicShowcaseProduct[];
};

export const fetchStoreShowcases = async (storeSlug: string): Promise<PublicStoreShowcase[]> => {
  const normalizedSlug = String(storeSlug || "").trim();
  if (!normalizedSlug) return [];
  try {
    const { data } = await api.get<{ success: boolean; data: PublicStoreShowcase[] }>(
      `/store/stores/${encodeURIComponent(normalizedSlug)}/showcases`
    );
    return Array.isArray(data?.data) ? data.data : [];
  } catch (err) {
    console.warn("[fetchStoreShowcases] failed, returning empty list", err);
    return [];
  }
};
