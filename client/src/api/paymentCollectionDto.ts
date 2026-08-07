export type PaymentCollectionAllocation = {
  paymentId?: number | null;
  suborderId?: number | null;
  storeId?: number | null;
  paymentChannel: string;
  paymentType: string;
  status: string;
  amount: number;
};

export type PaymentCollectionDto = {
  collectionRail?: string | null;
  claimState?: string | null;
  claimSource?: string | null;
  attemptStatus?: string | null;
  paymentUrl?: string | null;
  callbackState?: string | null;
  manualReviewReason?: string | null;
  allocations?: PaymentCollectionAllocation[];
};
