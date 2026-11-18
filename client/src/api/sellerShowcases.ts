import { api } from "./axios.ts";

export type SellerShowcaseProduct = {
  id: number;
  name: string;
  price?: number;
  stock?: number;
  images?: string[];
  slug?: string;
};

export type SellerShowcase = {
  id: number;
  storeId: number;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  sortOrder: number;
  isActive: boolean;
  productCount: number;
  productsCount: number;
  productIds: number[];
  products: SellerShowcaseProduct[];
  createdAt?: string;
  updatedAt?: string;
};

export type SellerShowcaseWritePayload = {
  name: string;
  slug?: string;
  description?: string | null;
  icon?: string | null;
  isActive?: boolean;
  sortOrder?: number;
  productIds?: number[];
};

export const getSellerShowcases = async (
  storeId: number | string,
  params: { q?: string; active?: string | boolean; page?: number; limit?: number } = {}
) => {
  const { data } = await api.get(`/seller/stores/${storeId}/showcases`, { params });
  return data;
};

export const createSellerShowcase = async (
  storeId: number | string,
  payload: SellerShowcaseWritePayload
) => {
  const { data } = await api.post(`/seller/stores/${storeId}/showcases`, payload);
  return data;
};

export const updateSellerShowcase = async (
  storeId: number | string,
  showcaseId: number | string,
  payload: Partial<SellerShowcaseWritePayload>
) => {
  const { data } = await api.put(`/seller/stores/${storeId}/showcases/${showcaseId}`, payload);
  return data;
};

export const toggleSellerShowcaseActive = async (
  storeId: number | string,
  showcaseId: number | string,
  isActive: boolean
) => {
  const { data } = await api.patch(`/seller/stores/${storeId}/showcases/${showcaseId}/active`, {
    isActive,
  });
  return data;
};

export const deleteSellerShowcase = async (
  storeId: number | string,
  showcaseId: number | string
) => {
  const { data } = await api.delete(`/seller/stores/${storeId}/showcases/${showcaseId}`);
  return data;
};

export const reorderSellerShowcases = async (
  storeId: number | string,
  items: Array<{ id: number; sortOrder: number }>
) => {
  const { data } = await api.put(`/seller/stores/${storeId}/showcases/reorder`, { items });
  return data;
};
