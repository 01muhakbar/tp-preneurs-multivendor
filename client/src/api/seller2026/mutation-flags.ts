export const SELLER_2026_MUTATIONS = {
  storefront: false,
  storeProfileUpdate: true,
  productDraftSave: true,
  products: false,
  catalog: false,
  orders: false,
  payments: false,
  team: false,
  notifications: true,
} as const;

export type Seller2026MutationFeature = keyof typeof SELLER_2026_MUTATIONS;

export function isSeller2026MutationEnabled(featureKey: Seller2026MutationFeature) {
  return Boolean(SELLER_2026_MUTATIONS[featureKey]);
}
