import { resolveAssetUrl } from "../../lib/assetUrl.js";

const asObject = (value) =>
  value && typeof value === "object" && !Array.isArray(value) ? value : {};

const asArray = (value) => (Array.isArray(value) ? value : []);

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

const formatDate = (value, isIndo = false) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(isIndo ? "id-ID" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
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

const resolveDefaultAddress = (address, addresses) => {
  const explicit = asObject(address);
  if (Object.keys(explicit).length > 0) return explicit;
  return (
    asArray(addresses).find((item) => Boolean(item?.isPrimary)) ||
    asArray(addresses)[0] ||
    null
  );
};

export const normalizeMyAccountFor2026 = ({
  user,
  profile,
  address,
  addresses,
  notificationCount,
  isIndo = false,
} = {}) => {
  const accountUser = asObject(user);
  const profileData = asObject(profile);
  const mergedProfile = {
    ...accountUser,
    ...profileData,
  };

  const notSet = isIndo ? "Belum diatur" : "Not set";

  const name = pickText(
    mergedProfile.name,
    mergedProfile.fullName,
    mergedProfile.displayName,
    mergedProfile.username
  );
  const email = pickText(mergedProfile.email, mergedProfile.emailAddress);
  const phone = pickText(
    mergedProfile.phone,
    mergedProfile.mobile,
    mergedProfile.phoneNumber,
    mergedProfile.mobileNumber
  );
  const profileAddress = pickText(mergedProfile.address, mergedProfile.addressLine);
  const avatarUrl = resolveAssetUrl(
    pickText(
      mergedProfile.avatarUrl,
      mergedProfile.avatar,
      mergedProfile.profileImage,
      mergedProfile.profileImageUrl,
      mergedProfile.image
    )
  );
  const createdAt = pickText(
    mergedProfile.createdAt,
    mergedProfile.created_at,
    mergedProfile.joinedAt,
    mergedProfile.memberSince
  );
  const memberSinceFormatted = formatDate(createdAt, isIndo);
  const memberSince = memberSinceFormatted
    ? isIndo
      ? `Anggota sejak ${memberSinceFormatted}`
      : `Member since ${memberSinceFormatted}`
    : "";

  const defaultAddress = resolveDefaultAddress(address, addresses);
  const addressSummary = defaultAddress ? formatAddressSummary(defaultAddress) : "";
  const addressPhone = defaultAddress ? pickText(defaultAddress.phoneNumber, defaultAddress.phone) : "";
  const addressName = defaultAddress
    ? pickText(defaultAddress.fullName, defaultAddress.name, name)
    : "";
  const addressRawLabel = defaultAddress
    ? pickText(defaultAddress.markAs, defaultAddress.label, "Home")
    : "";

  const isOffice =
    text(addressRawLabel).toLowerCase() === "office" ||
    text(addressRawLabel).toLowerCase() === "kantor";
  const addressLabel = isIndo ? (isOffice ? "Kantor" : "Rumah") : (isOffice ? "Office" : "Home");

  const count = Number(notificationCount);

  return {
    profile: {
      name: name || notSet,
      email: email || notSet,
      phone: phone || notSet,
      address: profileAddress || addressSummary || notSet,
      avatarUrl,
      initials: getInitials(name || email),
      memberSince,
      statusLabel: isIndo ? "Aktif" : "Active",
    },
    defaultAddress: defaultAddress
      ? {
          id: defaultAddress.id || null,
          name: addressName || notSet,
          phone: addressPhone || notSet,
          summary: addressSummary || notSet,
          label: addressLabel,
          isPrimary: Boolean(defaultAddress.isPrimary),
          hasAddress: Boolean(addressSummary),
        }
      : {
          id: null,
          name: isIndo ? "Belum ada alamat utama" : "No default address",
          phone: notSet,
          summary: isIndo
            ? "Tambahkan alamat pengiriman utama untuk mempermudah checkout."
            : "Add a default shipping address for faster checkout.",
          label: isIndo ? "Rumah" : "Home",
          isPrimary: false,
          hasAddress: false,
        },
    notificationCount: Number.isFinite(count) && count > 0 ? count : 0,
  };
};
