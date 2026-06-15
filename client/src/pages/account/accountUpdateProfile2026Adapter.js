import { resolveAssetUrl } from "../../lib/assetUrl.js";

const NOT_SET = "Not set";

const asObject = (value) =>
  value && typeof value === "object" && !Array.isArray(value) ? value : {};

const text = (value, fallback = "") => {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
};

const pickText = (...values) => {
  for (const value of values) {
    const normalized = text(value);
    if (normalized) return normalized;
  }
  return "";
};

const getInitials = (value) => {
  const source = text(value, "User");
  if (source.includes("@")) return source.split("@")[0].slice(0, 2).toUpperCase();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0]?.[0] || ""}${parts[1]?.[0] || ""}`.toUpperCase() || "U";
};

const normalizeDateInput = (value) => {
  const raw = text(value);
  if (!raw) return "";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw.slice(0, 10);
  return date.toISOString().slice(0, 10);
};

const formatAddressSummary = (address) =>
  [
    `${text(address.streetName)} ${text(address.houseNumber)}`.trim(),
    address.building,
    address.district,
    address.city,
    address.province,
    address.postalCode,
  ]
    .map((part) => text(part))
    .filter(Boolean)
    .join(", ");

const normalizeDefaultAddress = (address) => {
  const item = asObject(address);
  const summary = Object.keys(item).length > 0 ? formatAddressSummary(item) : "";

  if (!summary) {
    return {
      id: null,
      title: "No default shipping address",
      subtitle: "Add a shipping address to make checkout faster.",
      phone: NOT_SET,
      label: "Home",
      hasAddress: false,
    };
  }

  return {
    id: item.id || null,
    title: pickText(item.fullName, item.name, "Default shipping address"),
    subtitle: summary,
    phone: pickText(item.phoneNumber, item.phone, NOT_SET),
    label: pickText(item.markAs, item.label, "Home"),
    hasAddress: true,
  };
};

export const getEmptyUpdateProfile2026Form = () => ({
  name: "",
  email: "",
  phone: "",
  avatarUrl: "",
  dateOfBirth: "",
  gender: "",
  language: "en",
});

export const normalizeUpdateProfileFor2026 = ({
  user,
  profile,
  defaultAddress,
  form,
} = {}) => {
  const accountUser = asObject(user);
  const profileData = asObject(profile);
  const currentForm = asObject(form);
  const mergedProfile = {
    ...accountUser,
    ...profileData,
  };

  const sourceForm = {
    name: pickText(mergedProfile.name, mergedProfile.fullName, mergedProfile.displayName),
    email: pickText(mergedProfile.email, mergedProfile.emailAddress),
    phone: pickText(
      mergedProfile.phone,
      mergedProfile.mobile,
      mergedProfile.phoneNumber,
      mergedProfile.mobileNumber
    ),
    avatarUrl: pickText(
      mergedProfile.avatarUrl,
      mergedProfile.avatar,
      mergedProfile.profileImage,
      mergedProfile.profileImageUrl,
      mergedProfile.image
    ),
    dateOfBirth: normalizeDateInput(
      pickText(mergedProfile.dateOfBirth, mergedProfile.birthDate, mergedProfile.dob)
    ),
    gender: pickText(mergedProfile.gender),
    language: pickText(mergedProfile.language, mergedProfile.preferredLanguage, "en"),
  };

  const normalizedForm = {
    ...getEmptyUpdateProfile2026Form(),
    ...sourceForm,
    ...currentForm,
  };
  const avatarUrl = resolveAssetUrl(normalizedForm.avatarUrl || "");
  const displayName = pickText(normalizedForm.name, normalizedForm.email, NOT_SET);

  return {
    form: normalizedForm,
    profile: {
      name: displayName,
      email: pickText(normalizedForm.email, NOT_SET),
      phone: pickText(normalizedForm.phone, NOT_SET),
      avatarUrl,
      initials: getInitials(displayName),
    },
    defaultAddress: normalizeDefaultAddress(defaultAddress),
    genderOptions: [
      { value: "", label: "Select gender" },
      { value: "male", label: "Male" },
      { value: "female", label: "Female" },
      { value: "other", label: "Other" },
    ],
    languageOptions: [
      { value: "en", label: "English" },
      { value: "id", label: "Bahasa Indonesia" },
    ],
  };
};

export const validateUpdateProfile2026Form = (form = {}) => {
  const data = asObject(form);
  const errors = {};
  const name = text(data.name);
  const email = text(data.email);

  if (!name) errors.name = "Full name is required.";
  if (!email) {
    errors.email = "Email address is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const buildUpdateProfilePayloadFrom2026Form = (form = {}) => {
  const data = asObject(form);

  return {
    name: text(data.name),
    email: text(data.email),
    avatarUrl: text(data.avatarUrl) || null,
  };
};
