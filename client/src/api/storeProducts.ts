import { api } from "./axios";
import {
  normalizeStorefrontCategoriesResponse,
  normalizeStorefrontProductDetailResponse,
  normalizeStorefrontProductsResponse,
} from "../utils/storefrontCatalog.ts";
import type { StoreCategory, StoreProductDetail, StoreProductsResponse } from "./store.types.ts";

export type {
  StoreCategory,
  StoreProduct,
  StoreProductCategory,
  StoreProductDetail,
  StoreProductsResponse,
  StorefrontProductSellerInfo,
} from "./store.types.ts";

export const fetchStoreCategories = async (params?: { parentsOnly?: boolean; sort?: string }) => {
  const query = {
    parentsOnly: params?.parentsOnly === true ? true : undefined,
    sort: params?.sort || undefined,
  };
  const { data } = await api.get<{ data: StoreCategory[] }>("/store/categories", {
    params: query,
  });
  return normalizeStorefrontCategoriesResponse(data);
};

export const fetchStoreProducts = async (params?: {
  search?: string;
  q?: string;
  category?: string | number;
  storeSlug?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  sort?: string;
  page?: number;
  limit?: number;
  discounted?: boolean;
}) => {
  const query = {
    search: params?.search ?? params?.q,
    category: params?.category,
    storeSlug: params?.storeSlug,
    minPrice: params?.minPrice,
    maxPrice: params?.maxPrice,
    minRating: params?.minRating,
    sort: params?.sort,
    page: params?.page,
    limit: params?.limit,
    discounted: params?.discounted,
  };
  const { data } = await api.get<StoreProductsResponse>("/store/products", { params: query });
  return normalizeStorefrontProductsResponse(data);
};

export const fetchStoreProductById = async (
  id: string | number,
  params?: { storeSlug?: string }
) => {
  const query = params?.storeSlug ? { storeSlug: params.storeSlug } : undefined;
  const { data } = await api.get<{ data: StoreProductDetail }>(`/store/products/${id}`, {
    params: query,
  });
  return normalizeStorefrontProductDetailResponse(data);
};

export const fetchStoreProductsCount = async (): Promise<number> => {
  try {
    const { data } = await api.get<{ success: boolean; count: number }>("/store/products/count");
    if (typeof data?.count === "number") {
      return data.count;
    }
  } catch {
    // fallback to products query
  }
  const fallback = await fetchStoreProducts({ limit: 1 });
  return fallback?.meta?.total ?? fallback?.data?.meta?.total ?? 0;
};

export const subscribeNewsletter = async (payload: {
  email: string;
  lang?: string;
  source?: string;
}): Promise<{ success: boolean; message: string; alreadySubscribed?: boolean }> => {
  const { data } = await api.post("/store/newsletter/subscribe", payload);
  return data;
};

