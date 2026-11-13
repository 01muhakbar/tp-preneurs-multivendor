import { resolveAssetUrl } from "../../lib/assetUrl.js";

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

const normalizeLabel = (rawLabel, isIndo = false) => {
  const raw = String(rawLabel || "").trim().toLowerCase();
  if (raw === "home" || raw === "rumah") return isIndo ? "Rumah" : "Home";
  if (raw === "office" || raw === "kantor") return isIndo ? "Kantor" : "Office";
  return rawLabel || (isIndo ? "Rumah" : "Home");
};

export const normalizeDefaultAddress = (address, isIndo = false) => {
  const notSetLabel = isIndo ? "Belum diatur" : "Not set";
  const item = asObject(address);
  const summary = Object.keys(item).length > 0 ? formatAddressSummary(item) : "";

  if (!summary) {
    return {
      id: null,
      title: isIndo ? "Belum ada alamat pengiriman utama" : "No default shipping address",
      subtitle: isIndo
        ? "Tambahkan alamat pengiriman untuk mempercepat proses checkout."
        : "Add a shipping address to make checkout faster.",
      phone: notSetLabel,
      label: isIndo ? "Rumah" : "Home",
      hasAddress: false,
    };
  }

  const rawTitle = pickText(item.fullName, item.name);
  const fallbackTitle = isIndo ? "Alamat pengiriman utama" : "Default shipping address";

  return {
    id: item.id || null,
    title: rawTitle || fallbackTitle,
    subtitle: summary,
    phone: pickText(item.phoneNumber, item.phone, notSetLabel),
    label: normalizeLabel(item.markAs || item.label, isIndo),
    hasAddress: true,
  };
};

export const readUserProfileMeta = (userId) => {
  if (!userId || typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(`tp_user_profile_extra_${userId}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export const writeUserProfileMeta = (userId, meta = {}) => {
  if (!userId || typeof window === "undefined") return;
  try {
    const current = readUserProfileMeta(userId);
    localStorage.setItem(
      `tp_user_profile_extra_${userId}`,
      JSON.stringify({ ...current, ...meta })
    );
  } catch {
    // ignore storage errors
  }
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
  isIndo = false,
} = {}) => {
  const notSetLabel = isIndo ? "Belum diatur" : "Not set";
  const accountUser = asObject(user);
  const profileData = asObject(profile);
  const currentForm = asObject(form);
  const userId = accountUser.id || profileData.id || null;
  const storedMeta = readUserProfileMeta(userId);

  const mergedProfile = {
    ...accountUser,
    ...profileData,
    ...storedMeta,
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
    language: pickText(
      mergedProfile.language,
      mergedProfile.preferredLanguage,
      isIndo ? "id" : "en"
    ),
  };

  const normalizedForm = {
    ...getEmptyUpdateProfile2026Form(),
    ...sourceForm,
    ...currentForm,
  };
  const avatarUrl = resolveAssetUrl(normalizedForm.avatarUrl || "");
  const displayName = pickText(normalizedForm.name, normalizedForm.email, notSetLabel);

  return {
    form: normalizedForm,
    profile: {
      name: displayName,
      email: pickText(normalizedForm.email, notSetLabel),
      phone: pickText(normalizedForm.phone, notSetLabel),
      avatarUrl,
      initials: getInitials(displayName),
    },
    defaultAddress: normalizeDefaultAddress(defaultAddress, isIndo),
    genderOptions: isIndo
      ? [
          { value: "", label: "Pilih jenis kelamin" },
          { value: "male", label: "Laki-laki" },
          { value: "female", label: "Perempuan" },
          { value: "other", label: "Lainnya" },
        ]
      : [
          { value: "", label: "Select gender" },
          { value: "male", label: "Male" },
          { value: "female", label: "Female" },
          { value: "other", label: "Other" },
        ],
    languageOptions: isIndo
      ? [
          { value: "id", label: "Bahasa Indonesia" },
          { value: "en", label: "Bahasa Inggris" },
        ]
      : [
          { value: "en", label: "English" },
          { value: "id", label: "Indonesian" },
        ],
  };
};

export const validateUpdateProfile2026Form = (form = {}, isIndo = false) => {
  const data = asObject(form);
  const errors = {};
  const name = text(data.name);
  const email = text(data.email);
  const phone = text(data.phone);

  if (!name) {
    errors.name = isIndo ? "Nama lengkap wajib diisi." : "Full name is required.";
  }
  if (!email) {
    errors.email = isIndo ? "Alamat email wajib diisi." : "Email address is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = isIndo
      ? "Masukkan alamat email yang valid."
      : "Enter a valid email address.";
  }
  if (phone && !/^[0-9+\-\s()]{6,25}$/.test(phone)) {
    errors.phone = isIndo
      ? "Masukkan nomor telepon yang valid."
      : "Enter a valid phone number.";
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
    phone: text(data.phone) || null,
    avatarUrl: text(data.avatarUrl) || null,
  };
};
