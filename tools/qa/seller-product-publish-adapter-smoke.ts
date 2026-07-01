import assert from "node:assert/strict";
import { adaptSeller2026Products } from "../../client/src/api/seller2026/products.adapter.ts";

const baseProduct = {
  id: 14,
  name: "Lorong Keheningan Abadi",
  slug: "lorong-keheningan-abadi",
  status: "active",
  submission: { status: "none" },
  pricing: { price: 100_000 },
  inventory: { stock: 30 },
};

const unpublished = adaptSeller2026Products({
  governance: { canPublish: true },
  summary: { totalProducts: 1, active: 1, storefrontVisible: 0, internalOnly: 1 },
  pagination: { page: 1, limit: 10, total: 1 },
  items: [
    {
      ...baseProduct,
      published: false,
      storefrontVisibilityState: "INTERNAL_ONLY",
      visibility: { isPublished: false, stateCode: "INTERNAL_ONLY" },
    },
  ],
});

assert.equal(unpublished.products[0]?.status, "active");
assert.equal(unpublished.products[0]?.isPublished, false);
assert.equal(unpublished.products[0]?.visibility, "internal_only");
assert.equal(unpublished.summary.active, 1);
assert.equal(unpublished.summary.storefrontVisible, 0);
assert.equal(unpublished.permissions.canPublish, true);

const published = adaptSeller2026Products({
  governance: { canPublish: true },
  summary: { totalProducts: 1, active: 1, storefrontVisible: 1 },
  pagination: { page: 1, limit: 10, total: 1 },
  items: [
    {
      ...baseProduct,
      published: true,
      storefrontVisibilityState: "STOREFRONT_VISIBLE",
      visibility: { isPublished: true, stateCode: "STOREFRONT_VISIBLE" },
    },
  ],
});

assert.equal(published.products[0]?.isPublished, true);
assert.equal(published.products[0]?.visibility, "storefront_visible");
assert.equal(published.summary.storefrontVisible, 1);

console.log("seller product publish adapter smoke: passed");
