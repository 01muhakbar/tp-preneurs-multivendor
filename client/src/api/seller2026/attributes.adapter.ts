export type Seller2026AttributeOptionType =
  | "dropdown"
  | "radio"
  | "checkbox"
  | "text"
  | "number"
  | "color"
  | "boolean"
  | "unknown";

export type Seller2026AttributeStatus = "published" | "draft" | "active" | "inactive";

export type Seller2026AttributeListItem = {
  id: string;
  name: string;
  displayName: string;
  optionType: Seller2026AttributeOptionType;
  values: string[];
  valuesCount: number;
  usageCount: number;
  usageStatus: "in_use" | "unused";
  isPublished: boolean;
  status: Seller2026AttributeStatus;
  visible: boolean;
  updatedAt: string;
  rawUpdatedAt: string | null;
  permissions: {
    canEdit: boolean;
    canManageValues: boolean;
    canPublish: boolean;
    canUnpublish: boolean;
    canArchive: boolean;
  };
};

export type Seller2026AttributesSummary = {
  total: number;
  published: number;
  unused: number;
  withValues: number;
};

export type Seller2026AttributesViewModel = {
  summary: Seller2026AttributesSummary;
  attributes: Seller2026AttributeListItem[];
};

export type Seller2026AttributeForm = {
  name: string;
  displayName: string;
  optionType: "dropdown" | "radio" | "checkbox";
  values: string[];
  visible: boolean;
  published: boolean;
};

export const seller2026AttributeLabels = {
  optionType: {
    dropdown: "Dropdown",
    radio: "Radio",
    checkbox: "Checkbox",
    text: "Text",
    number: "Number",
    color: "Color",
    boolean: "Boolean",
    unknown: "Unknown",
  },
  status: {
    published: "Published",
    draft: "Draft",
    active: "Active",
    inactive: "Inactive",
  },
  usage: {
    in_use: "In Use",
    unused: "Unused",
  },
} as const;

const toText = (value: unknown, fallback = "") => String(value ?? fallback).trim();

const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toObject = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

const toStringArray = (value: unknown) =>
  Array.isArray(value)
    ? value.map((entry) => toText(typeof entry === "object" ? toObject(entry).value : entry)).filter(Boolean)
    : [];

export const normalizeSeller2026AttributeOptionType = (
  value: unknown
): Seller2026AttributeOptionType => {
  const normalized = toText(value).toLowerCase();
  if (
    normalized === "dropdown" ||
    normalized === "radio" ||
    normalized === "checkbox" ||
    normalized === "text" ||
    normalized === "number" ||
    normalized === "color" ||
    normalized === "boolean"
  ) {
    return normalized;
  }
  return "unknown";
};

export const formatSeller2026AttributeDate = (value: unknown, withTime = false) => {
  const normalized = toText(value);
  if (!normalized) return "Not available";
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return "Not available";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
  }).format(date);
};

export const adaptSeller2026Attributes = (
  value: unknown,
  permissions: Partial<Seller2026AttributeListItem["permissions"]> = {}
): Seller2026AttributesViewModel => {
  const response = toObject(value);
  const dataArray = Array.isArray(response.data) ? response.data : Array.isArray(value) ? value : [];

  const attributes = dataArray.map((item, index): Seller2026AttributeListItem => {
    const attr = toObject(item);
    const id = String(attr.id ?? index + 1);
    const name = toText(attr.name, "Untitled attribute");
    const displayName = toText(attr.displayName, name) || name;
    const values = toStringArray(attr.values);
    const valuesCount = toNumber(attr.valueCount ?? attr.valuesCount, values.length);
    const usageCount = toNumber(attr.usageCount, 0);
    const isArchived = toText(attr.status).toLowerCase() === "archived";
    const isPublished = Boolean(attr.published ?? attr.isPublished);
    const editable = Boolean(attr.editable ?? true) && !isArchived;
    const status: Seller2026AttributeStatus = isArchived
      ? "inactive"
      : isPublished
        ? "published"
        : "draft";

    return {
      id,
      name,
      displayName,
      optionType: normalizeSeller2026AttributeOptionType(attr.type ?? attr.optionType),
      values,
      valuesCount,
      usageCount,
      usageStatus: usageCount > 0 || Boolean(attr.isUsed) ? "in_use" : "unused",
      isPublished,
      status,
      visible: isPublished,
      updatedAt: formatSeller2026AttributeDate(attr.updatedAt),
      rawUpdatedAt: toText(attr.updatedAt) || null,
      permissions: {
        canEdit: editable && Boolean(permissions.canEdit ?? true),
        canManageValues: Boolean(permissions.canManageValues ?? true),
        canPublish: editable && Boolean(permissions.canPublish ?? true),
        canUnpublish: editable && Boolean(permissions.canUnpublish ?? true),
        canArchive: editable && Boolean(permissions.canArchive ?? false),
      },
    };
  });

  return {
    summary: summarizeSeller2026Attributes(attributes),
    attributes,
  };
};

export const summarizeSeller2026Attributes = (
  attributes: Seller2026AttributeListItem[]
): Seller2026AttributesSummary => ({
  total: attributes.length,
  published: attributes.filter((attribute) => attribute.isPublished).length,
  unused: attributes.filter((attribute) => attribute.usageStatus === "unused").length,
  withValues: attributes.filter((attribute) => attribute.valuesCount > 0).length,
});

export const createSeller2026AttributeForm = (
  attribute?: Partial<Seller2026AttributeListItem> | null
): Seller2026AttributeForm => ({
  name: toText(attribute?.name),
  displayName: toText(attribute?.displayName || attribute?.name),
  optionType:
    attribute?.optionType === "radio" || attribute?.optionType === "checkbox"
      ? attribute.optionType
      : "dropdown",
  values: Array.from(new Set(toStringArray(attribute?.values))),
  visible: Boolean(attribute?.visible ?? attribute?.isPublished ?? true),
  published: Boolean(attribute?.isPublished ?? true),
});

export const validateSeller2026AttributeForm = (form: Seller2026AttributeForm) => {
  const errors: Partial<Record<keyof Seller2026AttributeForm, string>> = {};
  if (!toText(form.name)) errors.name = "Attribute name is required.";
  if (!toText(form.displayName)) errors.displayName = "Display name is required.";
  if (!["dropdown", "radio", "checkbox"].includes(form.optionType)) {
    errors.optionType = "Choose a supported option type.";
  }
  if (form.values.length === 0) errors.values = "Add at least one value.";
  return errors;
};

export const buildSeller2026AttributePayload = (form: Seller2026AttributeForm) => ({
  name: toText(form.name),
  displayName: toText(form.displayName || form.name),
  type: form.optionType,
  values: Array.from(new Set(form.values.map((value) => toText(value)).filter(Boolean))),
  published: Boolean(form.visible && form.published),
});

export const emptySeller2026Attributes: Seller2026AttributesViewModel = {
  summary: { total: 0, published: 0, unused: 0, withValues: 0 },
  attributes: [],
};
