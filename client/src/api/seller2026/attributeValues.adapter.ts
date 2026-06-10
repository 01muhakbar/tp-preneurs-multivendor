import {
  formatSeller2026AttributeDate,
  normalizeSeller2026AttributeOptionType,
  seller2026AttributeLabels,
  type Seller2026AttributeOptionType,
} from "./attributes.adapter.ts";

export type Seller2026AttributeValueItem = {
  id: string;
  value: string;
  label: string;
  optionType: Seller2026AttributeOptionType;
  usageCount: number;
  usageStatus: "in_use" | "unused";
  isActive: boolean;
  visible: boolean;
  updatedAt: string;
  rawUpdatedAt: string | null;
  permissions: {
    canEdit: boolean;
    canActivate: boolean;
    canDeactivate: boolean;
    canArchive: boolean;
  };
};

export type Seller2026AttributeValuesViewModel = {
  attribute: {
    id: string;
    name: string;
    displayName: string;
    optionType: Seller2026AttributeOptionType;
    usageCount: number;
  };
  summary: {
    total: number;
    activeValues: number;
    usedByProducts: number;
  };
  values: Seller2026AttributeValueItem[];
};

export type Seller2026AttributeValueForm = {
  value: string;
  label: string;
  active: boolean;
};

export const seller2026AttributeValueLabels = {
  ...seller2026AttributeLabels,
  active: "Active",
  inactive: "Inactive",
  visible: "Visible",
  hidden: "Hidden",
};

const toText = (value: unknown, fallback = "") => String(value ?? fallback).trim();

const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toObject = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

export const adaptSeller2026AttributeValues = (
  value: unknown,
  permissions: Partial<Seller2026AttributeValueItem["permissions"]> = {}
): Seller2026AttributeValuesViewModel => {
  const response = toObject(value);
  const rawAttribute = toObject(response.attribute);
  const dataArray = Array.isArray(response.data) ? response.data : Array.isArray(value) ? value : [];
  const optionType = normalizeSeller2026AttributeOptionType(rawAttribute.type ?? rawAttribute.optionType);

  const values = dataArray.map((item, index): Seller2026AttributeValueItem => {
    const rawValue = toObject(item);
    const valueText = toText(rawValue.value, `Value ${index + 1}`);
    const isArchived = toText(rawValue.status).toLowerCase() === "archived";
    const usageCount = toNumber(rawValue.usageCount ?? rawValue.productUsage ?? rawValue.productsCount, 0);

    return {
      id: String(rawValue.id ?? index + 1),
      value: valueText,
      label: toText(rawValue.label, valueText) || valueText,
      optionType,
      usageCount,
      usageStatus: usageCount > 0 || Boolean(rawValue.isUsed) ? "in_use" : "unused",
      isActive: !isArchived,
      visible: !isArchived,
      updatedAt: formatSeller2026AttributeDate(rawValue.updatedAt, true),
      rawUpdatedAt: toText(rawValue.updatedAt) || null,
      permissions: {
        canEdit: !isArchived && Boolean(permissions.canEdit ?? true),
        canActivate: isArchived && Boolean(permissions.canActivate ?? false),
        canDeactivate: !isArchived && Boolean(permissions.canDeactivate ?? false),
        canArchive: !isArchived && Boolean(permissions.canArchive ?? false),
      },
    };
  });

  return {
    attribute: {
      id: String(rawAttribute.id || ""),
      name: toText(rawAttribute.name, "Attribute"),
      displayName: toText(rawAttribute.displayName, toText(rawAttribute.name, "Attribute")),
      optionType,
      usageCount: toNumber(rawAttribute.usageCount, 0),
    },
    summary: {
      total: values.length,
      activeValues: values.filter((item) => item.isActive).length,
      usedByProducts: values.reduce((sum, item) => sum + item.usageCount, 0),
    },
    values,
  };
};

export const createSeller2026AttributeValueForm = (
  value?: Partial<Seller2026AttributeValueItem> | null
): Seller2026AttributeValueForm => ({
  value: toText(value?.value),
  label: toText(value?.label || value?.value),
  active: Boolean(value?.isActive ?? true),
});

export const validateSeller2026AttributeValueForm = (form: Seller2026AttributeValueForm) => {
  const errors: Partial<Record<keyof Seller2026AttributeValueForm, string>> = {};
  if (!toText(form.value)) errors.value = "Value is required.";
  return errors;
};

export const buildSeller2026AttributeValuePayload = (form: Seller2026AttributeValueForm) => ({
  value: toText(form.value),
});

export const emptySeller2026AttributeValues: Seller2026AttributeValuesViewModel = {
  attribute: {
    id: "",
    name: "Attribute",
    displayName: "Attribute",
    optionType: "dropdown",
    usageCount: 0,
  },
  summary: {
    total: 0,
    activeValues: 0,
    usedByProducts: 0,
  },
  values: [],
};
