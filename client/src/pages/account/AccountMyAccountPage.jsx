import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getUserMe } from "../../api/userMe.ts";
import { getDefaultAddress, listAddresses } from "../../api/userAddresses.ts";
import { fetchUserUnreadNotificationCount } from "../../api/userNotifications.ts";
import { useAccountAuth } from "../../auth/authDomainHooks.js";
import AccountMyAccount2026View from "./AccountMyAccount2026View.jsx";
import { normalizeMyAccountFor2026 } from "./accountMyAccount2026Adapter.js";

export default function AccountMyAccountPage() {
  const navigate = useNavigate();
  const { user: accountUser } = useAccountAuth();
  const profileQuery = useQuery({
    queryKey: ["account", "my-account", "profile"],
    queryFn: getUserMe,
    retry: false,
  });
  const addressesQuery = useQuery({
    queryKey: ["user", "addresses"],
    queryFn: () => listAddresses().catch(() => []),
    retry: false,
  });
  const defaultAddressQuery = useQuery({
    queryKey: ["user", "addresses", "default"],
    queryFn: () => getDefaultAddress().catch(() => null),
    retry: false,
  });
  const notificationsQuery = useQuery({
    queryKey: ["user", "notifications", "unread-count"],
    queryFn: () => fetchUserUnreadNotificationCount().catch(() => 0),
    retry: false,
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
      "Failed to load account profile."
    : "";

  const normalized = useMemo(
    () =>
      normalizeMyAccountFor2026({
        user: accountUser,
        profile: profileData,
        address: defaultAddress,
        addresses: addressList,
        notificationCount: unreadNotificationCount,
      }),
    [accountUser, addressList, defaultAddress, profileData, unreadNotificationCount]
  );

  return (
    <AccountMyAccount2026View
      profile={normalized.profile}
      defaultAddress={normalized.defaultAddress}
      notificationCount={normalized.notificationCount}
      isLoading={isLoading}
      error={error}
      LinkComponent={Link}
      onEditProfile={() => navigate("/user/update-profile")}
      onEditAddress={() => navigate("/user/shipping-address")}
    />
  );
}
