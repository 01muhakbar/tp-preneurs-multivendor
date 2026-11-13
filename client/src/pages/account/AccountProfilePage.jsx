import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../../api/axios.ts";
import { getDefaultAddress } from "../../api/userAddresses.ts";
import { uploadUserProfileImage } from "../../api/userMe.ts";
import { useAccountAuth } from "../../auth/authDomainHooks.js";
import AccountUpdateProfile2026View from "./AccountUpdateProfile2026View";
import {
  buildUpdateProfilePayloadFrom2026Form,
  normalizeUpdateProfileFor2026,
  readUserProfileMeta,
  validateUpdateProfile2026Form,
  writeUserProfileMeta,
} from "./accountUpdateProfile2026Adapter";

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  avatarUrl: "",
  dateOfBirth: "",
  gender: "",
  language: "en",
};

const fetchMe = async () => {
  const { data } = await api.get("/auth/account/me");
  return data;
};

const updateProfile = async (payload) => {
  const { data } = await api.put("/store/profile", payload);
  return data;
};

const unwrapProfile = (payload) =>
  payload?.data?.user ?? payload?.user ?? payload?.data ?? (payload?.id ? payload : null);

const getProfileForm = (profile, fallbackUser, extraMeta = {}) => {
  const source = {
    ...(fallbackUser || {}),
    ...(profile || {}),
    ...(extraMeta || {}),
  };

  return {
    name: String(source.name || source.fullName || source.displayName || ""),
    email: String(source.email || source.emailAddress || ""),
    phone: String(source.phone || source.mobile || source.phoneNumber || source.mobileNumber || ""),
    avatarUrl: String(
      source.avatarUrl ||
        source.avatar ||
        source.profileImage ||
        source.profileImageUrl ||
        source.image ||
        ""
    ),
    dateOfBirth: String(source.dateOfBirth || source.birthDate || source.dob || "").slice(0, 10),
    gender: String(source.gender || ""),
    language: String(source.language || source.preferredLanguage || "en"),
  };
};

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

export default function AccountProfilePage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { i18n } = useTranslation();
  const outletCtx = useOutletContext() || {};
  const { user: accountUser, refreshSession } = useAccountAuth();

  const [currentLang, setCurrentLang] = useState(() => {
    const raw =
      localStorage.getItem("store_language") ||
      localStorage.getItem("i18nextLng") ||
      i18n.language ||
      "en";
    return String(raw).toLowerCase().startsWith("id") || String(raw).toLowerCase() === "indonesia"
      ? "id"
      : "en";
  });

  useEffect(() => {
    const syncLang = () => {
      const raw =
        localStorage.getItem("store_language") ||
        localStorage.getItem("i18nextLng") ||
        i18n.language ||
        "en";
      const next =
        String(raw).toLowerCase().startsWith("id") || String(raw).toLowerCase() === "indonesia"
          ? "id"
          : "en";
      setCurrentLang(next);
    };

    const handleCustomLang = (e) => {
      if (e?.detail?.isoCode) {
        const next = String(e.detail.isoCode).toLowerCase().startsWith("id") ? "id" : "en";
        setCurrentLang(next);
      } else {
        syncLang();
      }
    };

    i18n.on("languageChanged", syncLang);
    window.addEventListener("store_language_changed", handleCustomLang);
    window.addEventListener("storage", syncLang);

    return () => {
      i18n.off("languageChanged", syncLang);
      window.removeEventListener("store_language_changed", handleCustomLang);
      window.removeEventListener("storage", syncLang);
    };
  }, [i18n]);

  const isIndo = Boolean(outletCtx.isId || currentLang === "id");

  const [form, setForm] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [status, setStatus] = useState(null);

  const profileQuery = useQuery({
    queryKey: ["account", "me"],
    queryFn: fetchMe,
  });
  const defaultAddressQuery = useQuery({
    queryKey: ["account", "addresses", "default"],
    queryFn: getDefaultAddress,
    retry: false,
  });

  const profileData = unwrapProfile(profileQuery.data) || accountUser;
  const defaultAddress = defaultAddressQuery.data || null;
  const activeUserId = profileData?.id || accountUser?.id || null;

  useEffect(() => {
    if (!profileData && !accountUser) return;
    const extraMeta = readUserProfileMeta(activeUserId);
    setForm((current) => ({
      ...current,
      ...getProfileForm(profileData, accountUser, extraMeta),
    }));
  }, [accountUser, profileData, activeUserId]);

  const updateProfileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: async (response) => {
      const nextProfile = unwrapProfile(response);
      const extraMeta = {
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        language: form.language,
      };
      if (activeUserId) {
        writeUserProfileMeta(activeUserId, extraMeta);
      }

      if (form.language) {
        const targetIso = form.language.toLowerCase() === "id" ? "id" : "en";
        const targetStorageName = targetIso === "id" ? "Indonesia" : "English";
        const currentStored = localStorage.getItem("store_language");
        if (
          currentStored !== targetStorageName &&
          currentStored !== targetIso
        ) {
          localStorage.setItem("store_language", targetStorageName);
          localStorage.setItem("i18nextLng", targetIso);
          await i18n.changeLanguage(targetIso);
          window.dispatchEvent(
            new CustomEvent("store_language_changed", { detail: { isoCode: targetIso } })
          );
        }
      }

      if (nextProfile) {
        setForm((current) => ({
          ...current,
          ...getProfileForm(nextProfile, current, extraMeta),
        }));
      }

      setStatus({
        type: "success",
        message: isIndo ? "Profil berhasil diperbarui." : "Profile updated successfully.",
      });
      setFieldErrors({});
      await qc.invalidateQueries({ queryKey: ["account", "me"] });
      await qc.invalidateQueries({ queryKey: ["auth", "me"] });
      await qc.invalidateQueries({ queryKey: ["account"] });
      await refreshSession?.();
    },
    onError: (error) => {
      setStatus({
        type: "error",
        message: getErrorMessage(
          error,
          isIndo ? "Gagal memperbarui profil." : "Failed to update profile."
        ),
      });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: uploadUserProfileImage,
    onSuccess: (nextUrl) => {
      setForm((current) => ({ ...current, avatarUrl: nextUrl }));
      setStatus({
        type: "success",
        message: isIndo
          ? "Foto profil berhasil diunggah. Klik Simpan untuk menerapkan."
          : "Profile image uploaded. Save to persist the change.",
      });
    },
    onError: (error) => {
      setStatus({
        type: "error",
        message: getErrorMessage(
          error,
          isIndo ? "Gagal mengunggah foto profil." : "Failed to upload profile image."
        ),
      });
    },
  });

  const handleFormChange = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
    if (status?.type === "error") setStatus(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus(null);

    const validation = validateUpdateProfile2026Form(form, isIndo);
    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      return;
    }

    setFieldErrors({});
    const payload = buildUpdateProfilePayloadFrom2026Form(form);
    try {
      await updateProfileMutation.mutateAsync(payload);
    } catch {
      // Mutation onError owns the user-facing message.
    }
  };

  const handleUploadImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setStatus(null);
    try {
      await uploadMutation.mutateAsync(file);
    } catch {
      // Mutation onError owns the user-facing message.
    } finally {
      event.target.value = "";
    }
  };

  const handleRemoveImage = () => {
    setForm((current) => ({ ...current, avatarUrl: "" }));
    setStatus({
      type: "success",
      message: isIndo
        ? "Foto profil dihapus. Klik Simpan untuk menerapkan."
        : "Profile image removed. Save to persist the change.",
    });
  };

  const normalized = normalizeUpdateProfileFor2026({
    user: accountUser,
    profile: profileData,
    defaultAddress,
    form,
    isIndo,
  });
  const isLoading = profileQuery.isLoading;
  const error = profileQuery.isError
    ? getErrorMessage(
        profileQuery.error,
        isIndo ? "Gagal memuat profil akun." : "Failed to load profile."
      )
    : "";

  return (
    <AccountUpdateProfile2026View
      form={normalized.form}
      profile={normalized.profile}
      defaultAddress={normalized.defaultAddress}
      fieldErrors={fieldErrors}
      genderOptions={normalized.genderOptions}
      languageOptions={normalized.languageOptions}
      isLoading={isLoading}
      isSaving={updateProfileMutation.isPending || uploadMutation.isPending}
      isIndo={isIndo}
      error={error}
      status={status}
      LinkComponent={Link}
      onFormChange={handleFormChange}
      onSubmit={handleSubmit}
      onCancel={() => navigate("/user/my-account")}
      onUploadImage={handleUploadImage}
      onRemoveImage={handleRemoveImage}
    />
  );
}
