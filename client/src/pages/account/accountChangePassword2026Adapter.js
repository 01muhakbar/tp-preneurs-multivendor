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

const evaluateStrength = (password) => {
  const value = String(password || "");
  if (!value) {
    return {
      level: "idle",
      label: "Not set",
      activeBars: 0,
      helper: "Use at least 8 characters, including at least 1 letter and 1 number.",
    };
  }

  let score = 0;
  if (value.length >= 8) score += 1;
  if (/[A-Za-z]/.test(value) && /\d/.test(value)) score += 1;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value) || value.length >= 12) score += 1;

  if (score <= 1) {
    return {
      level: "weak",
      label: "Weak",
      activeBars: 1,
      helper: "Add more length and mix letters with numbers.",
    };
  }
  if (score === 2) {
    return {
      level: "fair",
      label: "Fair",
      activeBars: 2,
      helper: "Good start. Add uppercase letters, symbols, or more length.",
    };
  }
  if (score === 3) {
    return {
      level: "good",
      label: "Good",
      activeBars: 3,
      helper: "Strong enough for most cases.",
    };
  }
  return {
    level: "strong",
    label: "Strong",
    activeBars: 4,
    helper: "Strong password.",
  };
};

export const getEmptyChangePassword2026Form = () => ({
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
});

export const normalizeChangePasswordFor2026 = ({ user, form } = {}) => {
  const accountUser = asObject(user);
  const currentForm = {
    ...getEmptyChangePassword2026Form(),
    ...asObject(form),
  };
  const name = pickText(
    accountUser.name,
    accountUser.fullName,
    accountUser.displayName,
    "Account member"
  );
  const email = pickText(accountUser.email, accountUser.emailAddress, "No email provided");
  const avatarUrl = resolveAssetUrl(
    pickText(
      accountUser.avatarUrl,
      accountUser.avatar,
      accountUser.profileImage,
      accountUser.profileImageUrl,
      accountUser.image
    )
  );
  const hasMinLength = currentForm.newPassword.length >= 8;
  const hasLetterAndNumber =
    /[A-Za-z]/.test(currentForm.newPassword) && /\d/.test(currentForm.newPassword);
  const confirmMatches =
    Boolean(currentForm.confirmPassword) &&
    currentForm.newPassword === currentForm.confirmPassword;
  const differsFromCurrent =
    Boolean(currentForm.currentPassword && currentForm.newPassword) &&
    currentForm.currentPassword !== currentForm.newPassword;

  return {
    account: {
      name,
      email,
      avatarUrl,
      initials: getInitials(name || email),
      badgeLabel: "Member",
    },
    form: currentForm,
    rules: [
      {
        id: "length",
        label: "At least 8 characters",
        isMet: hasMinLength,
      },
      {
        id: "letter-number",
        label: "Include at least 1 letter and 1 number",
        isMet: hasLetterAndNumber,
      },
      {
        id: "confirm",
        label: "New password must match confirmation",
        isMet: confirmMatches,
      },
      {
        id: "different",
        label: "New password differs from current password",
        isMet: differsFromCurrent,
      },
    ],
    strength: evaluateStrength(currentForm.newPassword),
  };
};

export const validateChangePassword2026Form = (form = {}) => {
  const data = asObject(form);
  const currentPassword = String(data.currentPassword || "");
  const newPassword = String(data.newPassword || "");
  const confirmPassword = String(data.confirmPassword || "");
  const errors = {};

  if (!currentPassword) errors.currentPassword = "Current password is required.";
  if (!newPassword) {
    errors.newPassword = "New password is required.";
  } else if (newPassword.length < 8) {
    errors.newPassword = "New password must be at least 8 characters.";
  } else if (!/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
    errors.newPassword = "New password must include at least 1 letter and 1 number.";
  } else if (currentPassword && newPassword === currentPassword) {
    errors.newPassword = "New password must be different from current password.";
  }

  if (!confirmPassword) {
    errors.confirmPassword = "Confirm your new password.";
  } else if (newPassword !== confirmPassword) {
    errors.confirmPassword = "New password and confirmation must match.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const buildChangePasswordPayloadFrom2026Form = (form = {}) => {
  const data = asObject(form);

  return {
    currentPassword: String(data.currentPassword || ""),
    newPassword: String(data.newPassword || ""),
  };
};
