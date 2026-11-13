import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { getUserMe } from "../../api/userMe.ts";
import { getDefaultAddress, listAddresses } from "../../api/userAddresses.ts";
import { fetchUserUnreadNotificationCount } from "../../api/userNotifications.ts";
import { useAccountAuth } from "../../auth/authDomainHooks.js";
import AccountMyAccount2026View from "./AccountMyAccount2026View.jsx";
import { normalizeMyAccountFor2026 } from "./accountMyAccount2026Adapter.js";

const isIndonesianLanguage = (i18nInstance) => {
  if (i18nInstance?.language?.toLowerCase().startsWith("id")) return true;
  if (typeof window !== "undefined") {
    const storeLang = (localStorage.getItem("store_language") || "").toLowerCase();
    if (storeLang === "indonesia" || storeLang.startsWith("id")) return true;
    const i18nLng = (localStorage.getItem("i18nextLng") || "").toLowerCase();
    if (i18nLng.startsWith("id")) return true;
    const appLang = (localStorage.getItem("app_lang") || "").toLowerCase();
    if (appLang === "indonesia" || appLang.startsWith("id")) return true;
  }
  return false;
};

export default function AccountMyAccountPage() {
  const navigate = useNavigate();
  const { user: accountUser } = useAccountAuth();

  const { i18n } = useTranslation();
  const [activeLang, setActiveLang] = useState(
    typeof window !== "undefined"
      ? (localStorage.getItem("store_language") === "Indonesia" ? "id" : i18n?.language || "en")
      : "en"
  );

  useEffect(() => {
    const handleSync = (lng) => setActiveLang(lng);
    const handleCustomLang = (e) => {
      if (e?.detail?.isoCode) setActiveLang(e.detail.isoCode);
    };
    const handleStorage = () => {
      const stored = localStorage.getItem("store_language");
      if (stored === "Indonesia") setActiveLang("id");
      else if (stored === "English") setActiveLang("en");
      else setActiveLang(i18n?.language || "en");
    };

    i18n?.on?.("languageChanged", handleSync);
    window.addEventListener("store_language_changed", handleCustomLang);
    window.addEventListener("storage", handleStorage);
    return () => {
      i18n?.off?.("languageChanged", handleSync);
      window.removeEventListener("store_language_changed", handleCustomLang);
      window.removeEventListener("storage", handleStorage);
    };
  }, [i18n]);

  const isIndo = useMemo(
    () => isIndonesianLanguage({ language: activeLang }),
    [activeLang]
  );

  const profileQuery = useQuery({
    queryKey: ["account", "my-account", "profile"],
    queryFn: getUserMe,
    retry: false,
    staleTime: 15_000,
  });

  const addressesQuery = useQuery({
    queryKey: ["user", "addresses"],
    queryFn: () => listAddresses().catch(() => []),
    retry: false,
    staleTime: 15_000,
  });

  const defaultAddressQuery = useQuery({
    queryKey: ["user", "addresses", "default"],
    queryFn: () => getDefaultAddress().catch(() => null),
    retry: false,
    staleTime: 15_000,
  });

  const notificationsQuery = useQuery({
    queryKey: ["user", "notifications", "unread-count"],
    queryFn: () => fetchUserUnreadNotificationCount().catch(() => 0),
    retry: false,
    staleTime: 15_000,
  });

  const profileData = profileQuery.data || accountUser || null;
  const addressList = Array.isArray(addressesQuery.data) ? addressesQuery.data : [];
  const defaultAddress =
    defaultAddressQuery.data ||
    addressList.find((item) => Boolean(item?.isPrimary)) ||
    null;
  const unreadNotificationCount = Number(notificationsQuery.data || 0);
  const isLoading =
    profileQuery.isLoading || addressesQuery.isLoading || defaultAddressQuery.isLoading;

  const error = profileQuery.isError
    ? profileQuery.error?.response?.data?.message ||
      profileQuery.error?.message ||
      (isIndo ? "Gagal memuat profil akun." : "Failed to load account profile.")
    : "";

  const normalized = useMemo(
    () =>
      normalizeMyAccountFor2026({
        user: accountUser,
        profile: profileData,
        address: defaultAddress,
        addresses: addressList,
        notificationCount: unreadNotificationCount,
        isIndo,
      }),
    [accountUser, addressList, defaultAddress, profileData, unreadNotificationCount, isIndo]
  );

  return (
    <AccountMyAccount2026View
      profile={normalized.profile}
      defaultAddress={normalized.defaultAddress}
      notificationCount={normalized.notificationCount}
      isLoading={isLoading}
      error={error}
      isIndo={isIndo}
      LinkComponent={Link}
      onEditProfile={() => navigate("/user/update-profile")}
      onEditAddress={() => navigate("/user/shipping-address")}
    />
  );
}
