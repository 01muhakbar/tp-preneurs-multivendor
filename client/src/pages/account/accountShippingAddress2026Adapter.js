import {
  EMAIL_ADDRESS_REGEX,
  POSTAL_CODE_REGEX,
  formatAddressSummary,
  formatContactName,
  resolveAddressEmailAddress,
  toUserAddressForm,
  toUserAddressPayload,
} from "../../utils/userAddress.ts";

const text = (value, fallback = "") => {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
};

const asArray = (value) => (Array.isArray(value) ? value : []);

const normalizeMarkAs = (value) =>
  text(value).toUpperCase() === "OFFICE" ? "OFFICE" : "HOME";

export const getEmptyShippingAddress2026 = (fallbackEmailAddress = "") => ({
  id: null,
  firstName: "",
  lastName: "",
  emailAddress: text(fallbackEmailAddress),
  phoneNumber: "",
  province: "",
  city: "",
  district: "",
  postalCode: "",
  streetName: "",
  building: "",
  houseNumber: "",
  otherDetails: "",
  markAs: "HOME",
  isPrimary: false,
  isStore: false,
  isReturn: false,
});

export const getShippingAddress2026FormFromAddress = (
  address,
  fallbackEmailAddress = ""
) => ({
  ...getEmptyShippingAddress2026(fallbackEmailAddress),
  ...toUserAddressForm(address, fallbackEmailAddress),
  id: Number(address?.id || 0) || null,
});

export const buildShippingAddressPayloadFrom2026Form = (form) =>
  toUserAddressPayload({
    ...form,
    markAs: normalizeMarkAs(form?.markAs),
    postalCode: text(form?.postalCode).replace(/\D/g, "").slice(0, 5),
  });

export const validateShippingAddress2026Form = (form) => {
  const source = form || {};
  const required = {
    firstName: text(source.firstName),
    lastName: text(source.lastName),
    emailAddress: text(source.emailAddress),
    phoneNumber: text(source.phoneNumber),
    province: text(source.province),
    city: text(source.city),
    district: text(source.district),
    postalCode: text(source.postalCode),
    streetName: text(source.streetName),
    houseNumber: text(source.houseNumber),
  };
  const errors = {
    firstName: required.firstName ? "" : "First name is required.",
    lastName: required.lastName ? "" : "Last name is required.",
    emailAddress: required.emailAddress ? "" : "Email is required.",
    phoneNumber: required.phoneNumber ? "" : "Phone number is required.",
    province: required.province ? "" : "Province is required.",
    city: required.city ? "" : "City/Regency is required.",
    district: required.district ? "" : "Subdistrict is required.",
    postalCode: required.postalCode ? "" : "Postal code is required.",
    streetName: required.streetName ? "" : "Street name is required.",
    houseNumber: required.houseNumber ? "" : "House number is required.",
  };

  if (required.emailAddress && !EMAIL_ADDRESS_REGEX.test(required.emailAddress)) {
    errors.emailAddress = "Enter a valid email address.";
  }
  if (required.postalCode && !POSTAL_CODE_REGEX.test(required.postalCode)) {
    errors.postalCode = "Postal code must be 5 digits.";
  }

  return {
    isValid: Object.values(errors).every((value) => !value),
    errors,
  };
};

const normalizeAddress = (address, fallbackEmailAddress = "") => {
  const id = Number(address?.id || 0);
  const form = getShippingAddress2026FormFromAddress(address, fallbackEmailAddress);
  const summary = formatAddressSummary(address || {});
  const label = normalizeMarkAs(address?.markAs);
  return {
    id,
    title: label === "OFFICE" ? "Office" : "Home",
    label,
    contactName: formatContactName(address || {}) || "Not set",
    emailAddress: resolveAddressEmailAddress(address, fallbackEmailAddress) || "Not set",
    phoneNumber: text(address?.phoneNumber, "Not set"),
    summary: summary || "Not set",
    line1: [`${text(address?.streetName)} ${text(address?.houseNumber)}`.trim()]
      .filter(Boolean)
      .join(""),
    line2: [address?.building, address?.district].map((part) => text(part)).filter(Boolean).join(", "),
    cityLine: [address?.city, address?.province, address?.postalCode]
      .map((part) => text(part))
      .filter(Boolean)
      .join(" "),
    country: "Indonesia",
    isPrimary: Boolean(address?.isPrimary),
    isStore: Boolean(address?.isStore),
    isReturn: Boolean(address?.isReturn),
    raw: address,
    form,
  };
};

export const normalizeShippingAddressesFor2026 = ({
  user,
  profile,
  addresses,
  defaultAddress,
  draft,
  provinces,
  cities,
  districts,
} = {}) => {
  const account = {
    name: text(profile?.name || user?.name || user?.fullName, "Not set"),
    email: text(profile?.email || user?.email, "Not set"),
  };
  const fallbackEmailAddress = account.email === "Not set" ? "" : account.email;
  const addressItems = asArray(addresses).map((item) =>
    normalizeAddress(item, fallbackEmailAddress)
  );
  const defaultId = Number(defaultAddress?.id || 0);

  return {
    account,
    addresses: addressItems.map((item) => ({
      ...item,
      isPrimary: item.isPrimary || (defaultId > 0 && item.id === defaultId),
    })),
    defaultAddress: defaultAddress
      ? normalizeAddress(defaultAddress, fallbackEmailAddress)
      : null,
    form: {
      ...getEmptyShippingAddress2026(fallbackEmailAddress),
      ...(draft || {}),
    },
    provinceOptions: asArray(provinces),
    cityOptions: asArray(cities),
    districtOptions: asArray(districts),
  };
};
