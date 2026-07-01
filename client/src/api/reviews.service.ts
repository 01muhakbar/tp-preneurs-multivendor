import { api } from "./axios";

export type ReviewPayload = {
  rating: number;
  comment?: string;
  images?: string[];
};

export type ReviewResponse = {
  id: number;
  userId: number;
  productId: number;
  rating: number;
  comment?: string | null;
  images?: string[] | null;
  createdAt?: string;
  updatedAt?: string;
  status?: "pending" | "published" | "hidden" | string;
  sellerReply?: string | null;
  repliedAt?: string | null;
  user?: {
    id?: number | null;
    name: string;
  } | null;
  product?: {
    id: number;
    name: string;
    slug?: string | null;
    imageUrl?: string | null;
    sku?: string | null;
  } | null;
};

export type NeedReviewItem = {
  productId: number;
  orderId?: number | null;
  orderRef?: string | null;
  orderedAt?: string | null;
  slug?: string | null;
  name: string;
  image?: string | null;
  imageUrl?: string | null;
};

type ReviewsListResponse = {
  items?: ReviewResponse[];
  meta?: {
    totalItems?: number;
  };
};

type NeedReviewListResponse = {
  items?: NeedReviewItem[];
  meta?: {
    totalItems?: number;
  };
};

type ListParams = {
  page?: number;
  limit?: number;
};

const getListItems = <T>(payload: any): T[] => {
  const source = payload?.data ?? payload;
  const candidates = [
    source?.items,
    source?.reviews,
    source?.products,
    source?.data?.items,
    source?.data?.reviews,
    source?.data?.products,
    source?.data,
  ];
  const items = candidates.find((candidate) => Array.isArray(candidate));
  return Array.isArray(items) ? items : [];
};

const getTotalItems = (payload: any, fallback: number) => {
  const source = payload?.data ?? payload;
  const totalItems = Number(
    source?.meta?.totalItems ??
      source?.meta?.total ??
      source?.totalItems ??
      source?.total ??
      source?.data?.meta?.totalItems ??
      fallback
  );
  return Number.isFinite(totalItems) ? totalItems : fallback;
};

export const fetchMyReviews = async (params: ListParams = {}) => {
  const { data } = await api.get<ReviewsListResponse>("/store/my/reviews", {
    params,
  });
  const items = getListItems<ReviewResponse>(data);
  const totalItems = getTotalItems(data, items.length);
  return {
    items,
    meta: {
      totalItems,
    },
  };
};

export const fetchMyReviewNeeds = async (params: ListParams = {}) => {
  const { data } = await api.get<NeedReviewListResponse>(
    "/store/my/reviews/need",
    { params }
  );
  const items = getListItems<NeedReviewItem>(data);
  const totalItems = getTotalItems(data, items.length);
  return {
    items,
    meta: {
      totalItems,
    },
  };
};

export const createReview = async (payload: {
  productId: number;
  rating: number;
  comment?: string;
  images?: string[];
}) => {
  const { data } = await api.post<{ data: ReviewResponse }>(
    "/store/reviews",
    payload
  );
  return data;
};

export const updateReview = async (
  id: number,
  payload: ReviewPayload
) => {
  const { data } = await api.patch<{ data: ReviewResponse }>(
    `/store/reviews/${id}`,
    payload
  );
  return data;
};

export const upsertReviewByProduct = async (
  productId: number,
  payload: ReviewPayload
) => {
  const { data } = await api.put<{ data: ReviewResponse }>(
    `/store/reviews/product/${productId}`,
    payload
  );
  return data;
};

export const uploadReviewImage = async (file: File) => {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post<{ data?: { url?: string } }>("/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  const url = data?.data?.url;
  if (!url) {
    throw new Error("Upload succeeded without URL.");
  }
  return url;
};

export const fetchNeedReviewProducts = fetchMyReviewNeeds;
export const createProductReview = createReview;
export const updateProductReview = updateReview;
export const upsertProductReview = upsertReviewByProduct;
export const uploadReviewAsset = uploadReviewImage;
