import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../api/axios.ts";
import { getDefaultAddress } from "../../api/userAddresses.ts";
import { uploadUserProfileImage } from "../../api/userMe.ts";
import { useAccountAuth } from "../../auth/authDomainHooks.js";
import AccountUpdateProfile2026View from "./AccountUpdateProfile2026View";
import {
  buildUpdateProfilePayloadFrom2026Form,
  normalizeUpdateProfileFor2026,
  validateUpdateProfile2026Form,
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

const getProfileForm = (profile, fallbackUser) => {
  const source = {
    ...(fallbackUser || {}),
    ...(profile || {}),
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
  const { user: accountUser, refreshSession } = useAccountAuth();
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

  useEffect(() => {
    if (!profileData && !accountUser) return;
    setForm((current) => ({
      ...current,
      ...getProfileForm(profileData, accountUser),
    }));
  }, [accountUser, profileData]);

  const updateProfileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: async (response) => {
      const nextProfile = unwrapProfile(response);
      if (nextProfile) {
        setForm((current) => ({
          ...current,
          ...getProfileForm(nextProfile, current),
        }));
      }
      setStatus({ type: "success", message: "Profile updated." });
      setFieldErrors({});
      await qc.invalidateQueries({ queryKey: ["account", "me"] });
      await refreshSession?.();
    },
    onError: (error) => {
      setStatus({
        type: "error",
        message: getErrorMessage(error, "Failed to update profile."),
      });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: uploadUserProfileImage,
    onSuccess: (nextUrl) => {
      setForm((current) => ({ ...current, avatarUrl: nextUrl }));
      setStatus({
        type: "success",
        message: "Profile image uploaded. Save to persist the change.",
      });
    },
    onError: (error) => {
      setStatus({
        type: "error",
        message: getErrorMessage(error, "Failed to upload profile image."),
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

    const validation = validateUpdateProfile2026Form(form);
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
      message: "Profile image removed. Save to persist the change.",
    });
  };

  const normalized = normalizeUpdateProfileFor2026({
    user: accountUser,
    profile: profileData,
    defaultAddress,
    form,
  });
  const isLoading = profileQuery.isLoading;
  const error = profileQuery.isError
    ? getErrorMessage(profileQuery.error, "Failed to load profile.")
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
