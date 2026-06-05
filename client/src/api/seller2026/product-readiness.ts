export type Seller2026ReadinessSeverity = "error" | "warning";

export type Seller2026ProductReadinessItem = {
  key: string;
  label: string;
  passed: boolean;
  severity: Seller2026ReadinessSeverity;
  helper: string;
};

export type Seller2026ProductReadiness = {
  score: number;
  ready: boolean;
  blockingItems: Seller2026ProductReadinessItem[];
  warningItems: Seller2026ProductReadinessItem[];
  items: Seller2026ProductReadinessItem[];
};

type ReadinessInput = {
  name?: unknown;
  productType?: unknown;
  price?: unknown;
  stock?: unknown;
  categoryIds?: unknown;
  categoryLabel?: unknown;
  description?: unknown;
  productId?: unknown;
  productEligible?: unknown;
  submitPermission?: unknown;
  saving?: unknown;
  dirty?: unknown;
  eligibilityReason?: unknown;
};

const text = (value: unknown) => String(value ?? "").trim();

const numberValue = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
};

const hasPositiveCategoryId = (value: unknown) => {
  if (Array.isArray(value)) {
    return value.some((entry) => Number.isInteger(Number(entry)) && Number(entry) > 0);
  }
  return text(value)
    .split(",")
    .map((entry) => Number(entry.trim()))
    .some((entry) => Number.isInteger(entry) && entry > 0);
};

const item = (
  key: string,
  label: string,
  passed: boolean,
  severity: Seller2026ReadinessSeverity,
  helper: string
): Seller2026ProductReadinessItem => ({
  key,
  label,
  passed,
  severity,
  helper,
});

export function getSeller2026ProductReadiness(input: ReadinessInput): Seller2026ProductReadiness {
  const price = numberValue(input.price);
  const stock = numberValue(input.stock);
  const hasCategory =
    hasPositiveCategoryId(input.categoryIds) ||
    Boolean(text(input.categoryLabel) && text(input.categoryLabel).toLowerCase() !== "uncategorized");
  const description = text(input.description);
  const productType = text(input.productType) || "Physical";
  const eligibilityReason = text(input.eligibilityReason);

  const items = [
    item(
      "name",
      "Product name is valid",
      text(input.name).length >= 2,
      "error",
      "Product name must be at least 2 characters."
    ),
    item(
      "product_type",
      "Product type is selected",
      Boolean(productType),
      "error",
      "Select a product type before review."
    ),
    item(
      "price",
      "Price is valid",
      Number.isFinite(price) && price > 0,
      "error",
      "Base price must be greater than 0."
    ),
    item(
      "stock",
      "Stock is valid",
      Number.isFinite(stock) && Number.isInteger(stock) && stock >= 0,
      "error",
      "Stock must be zero or greater."
    ),
    item(
      "saved_draft",
      "Draft is saved",
      Boolean(input.productId),
      "error",
      "Save this product as a draft before submitting it for review."
    ),
    item(
      "eligible_status",
      "Product is eligible for review",
      Boolean(input.productEligible),
      "error",
      eligibilityReason || "Only saved draft products can be submitted for review."
    ),
    item(
      "permission",
      "Seller can submit review",
      Boolean(input.submitPermission),
      "error",
      "Your account does not have permission to submit this product for review."
    ),
    item(
      "save_state",
      "No save is currently running",
      !input.saving,
      "error",
      "Wait until draft saving is complete."
    ),
    item(
      "unsaved_changes",
      "No unsaved changes",
      !input.dirty,
      "error",
      "Save draft changes before submitting for review."
    ),
    item(
      "category",
      "Category is selected",
      hasCategory,
      "warning",
      "Category is recommended for review readiness."
    ),
    item(
      "description",
      "Description is ready",
      description.length > 0,
      "warning",
      "Description is recommended for review readiness."
    ),
  ];

  const blockingItems = items.filter((entry) => entry.severity === "error" && !entry.passed);
  const warningItems = items.filter((entry) => entry.severity === "warning" && !entry.passed);
  const passedCount = items.filter((entry) => entry.passed).length;

  return {
    score: Math.round((passedCount / items.length) * 100),
    ready: blockingItems.length === 0,
    blockingItems,
    warningItems,
    items,
  };
}
