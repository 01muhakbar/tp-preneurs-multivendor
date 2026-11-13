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

const evaluateStrength = (password, isIndo = false) => {
  const value = String(password || "");
  if (!value) {
    return {
      level: "idle",
      label: isIndo ? "Belum diatur" : "Not set",
      activeBars: 0,
      helper: isIndo
        ? "Gunakan minimal 8 karakter dengan kombinasi huruf dan angka."
        : "Use at least 8 characters, including at least 1 letter and 1 number.",
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
      label: isIndo ? "Lemah" : "Weak",
      activeBars: 1,
      helper: isIndo
        ? "Tambahkan panjang karakter dan variasikan huruf serta angka."
        : "Add more length and mix letters with numbers.",
    };
  }
  if (score === 2) {
    return {
      level: "fair",
      label: isIndo ? "Cukup" : "Fair",
      activeBars: 2,
      helper: isIndo
        ? "Awal yang baik. Tambahkan huruf besar atau simbol."
        : "Good start. Add uppercase letters, symbols, or more length.",
    };
  }
  if (score === 3) {
    return {
      level: "good",
      label: isIndo ? "Baik" : "Good",
      activeBars: 3,
      helper: isIndo ? "Sandi cukup aman." : "Strong enough for most cases.",
    };
  }
  return {
    level: "strong",
    label: isIndo ? "Kuat" : "Strong",
    activeBars: 4,
    helper: isIndo ? "Sandi sangat kuat dan aman." : "Strong password.",
  };
};

export const getEmptyChangePassword2026Form = () => ({
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
});

export const normalizeChangePasswordFor2026 = ({ user, form, isIndo = false } = {}) => {
  const accountUser = asObject(user);
  const currentForm = {
    ...getEmptyChangePassword2026Form(),
    ...asObject(form),
  };
  const name = pickText(
    accountUser.name,
    accountUser.fullName,
    accountUser.displayName,
    isIndo ? "Anggota Akun" : "Account member"
  );
  const email = pickText(
    accountUser.email,
    accountUser.emailAddress,
    isIndo ? "Email belum diatur" : "No email provided"
  );
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
      badgeLabel: isIndo ? "Member" : "Member",
    },
    form: currentForm,
    rules: [
      {
        id: "length",
        label: isIndo ? "Minimal 8 karakter" : "At least 8 characters",
        isMet: hasMinLength,
      },
      {
        id: "letter-number",
        label: isIndo ? "Kombinasi huruf dan angka" : "Include at least 1 letter and 1 number",
        isMet: hasLetterAndNumber,
      },
      {
        id: "confirm",
        label: isIndo ? "Konfirmasi sandi cocok" : "New password must match confirmation",
        isMet: confirmMatches,
      },
      {
        id: "different",
        label: isIndo ? "Berbeda dari kata sandi saat ini" : "New password differs from current password",
        isMet: differsFromCurrent,
      },
    ],
    strength: evaluateStrength(currentForm.newPassword, isIndo),
  };
};

export const validateChangePassword2026Form = (form = {}, isIndo = false) => {
  const data = asObject(form);
  const currentPassword = String(data.currentPassword || "");
  const newPassword = String(data.newPassword || "");
  const confirmPassword = String(data.confirmPassword || "");
  const errors = {};

  if (!currentPassword) {
    errors.currentPassword = isIndo
      ? "Kata sandi saat ini wajib diisi."
      : "Current password is required.";
  }
  if (!newPassword) {
    errors.newPassword = isIndo
      ? "Kata sandi baru wajib diisi."
      : "New password is required.";
  } else if (newPassword.length < 8) {
    errors.newPassword = isIndo
      ? "Kata sandi baru minimal 8 karakter."
      : "New password must be at least 8 characters.";
  } else if (!/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
    errors.newPassword = isIndo
      ? "Kata sandi baru harus menyertakan huruf dan angka."
      : "New password must include at least 1 letter and 1 number.";
  } else if (currentPassword && newPassword === currentPassword) {
    errors.newPassword = isIndo
      ? "Kata sandi baru harus berbeda dari kata sandi saat ini."
      : "New password must be different from current password.";
  }

  if (!confirmPassword) {
    errors.confirmPassword = isIndo
      ? "Konfirmasi kata sandi baru Anda."
      : "Confirm your new password.";
  } else if (newPassword !== confirmPassword) {
    errors.confirmPassword = isIndo
      ? "Kata sandi baru dan konfirmasi tidak cocok."
      : "New password and confirmation must match.";
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
