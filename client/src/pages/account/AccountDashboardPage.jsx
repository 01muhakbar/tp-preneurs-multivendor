import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useOutletContext } from "react-router-dom";
import { getSellerInvitations } from "../../api/sellerInvitations.ts";
import { listSellerWorkspaceStores } from "../../api/sellerWorkspace.ts";
import { fetchStoreMyOrders } from "../../api/storeOrders.ts";
import { listAddresses } from "../../api/userAddresses.ts";
import { fetchUserUnreadNotificationCount } from "../../api/userNotifications.ts";
import { getCurrentUserStoreApplication } from "../../api/userStoreApplications.ts";
import { getOrderTruthStatus } from "../../utils/orderTruth.js";
import { buildSellerWorkspacePath } from "../../utils/sellerWorkspaceRoute.js";
import {
  presentStoreApplicationStatus,
  presentStoreReadiness,
} from "../../utils/storeOnboardingPresentation.ts";
import AccountDashboard2026View from "./AccountDashboard2026View.jsx";

const isUnauthorized = (error) => Number(error?.response?.status || 0) === 401;

const listOptionalSellerWorkspaceStores = async () => {
  try {
    return await listSellerWorkspaceStores();
  } catch (error) {
    if (isUnauthorized(error)) return [];
    throw error;
  }
};

const getOptionalSellerInvitations = async () => {
  try {
    return await getSellerInvitations();
  } catch (error) {
    if (isUnauthorized(error)) return { items: [], total: 0 };
    throw error;
  }
};

const getOrderDateValue = (order) =>
  order?.createdAt || order?.created_at || order?.orderTime || null;

const getOrderTimestamp = (order) => {
  const value = getOrderDateValue(order);
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
};

const unwrapOrders = (response) => {
  if (Array.isArray(response?.data)) return response.data;
  return Array.isArray(response) ? response : [];
};

const resolveOnboarding = ({ application, sellerStores }) => {
  const ownerStore =
    sellerStores.find((entry) => entry?.access?.isOwner) || sellerStores[0] || null;
  const applicationStatus = application
    ? presentStoreApplicationStatus(application.statusMeta, application.status)
    : null;
  const readinessStatus = presentStoreReadiness({
    storeStatus: ownerStore?.store?.status || application?.activation?.storeStatus || null,
    hasStore: Boolean(ownerStore || application?.activation?.storeId),
    sellerAccessReady: Boolean(application?.activation?.sellerAccessReady),
  });

  return {
    hasApplication: Boolean(application),
    status: application?.status || null,
    workflow: application?.workflow || {},
    applicationStatus,
    readinessStatus,
    description:
      application?.revisionNote ||
      application?.rejectReason ||
      applicationStatus?.description ||
      (ownerStore
        ? "Your seller access is ready. Review the application details or continue setup."
        : "Complete your store details and submit them for review."),
    completedFields: Number(application?.completeness?.completedFields || 0),
    totalFields: Number(application?.completeness?.totalFields || 0),
    updatedAt:
      application?.updatedAt ||
      application?.reviewedAt ||
      application?.submittedAt ||
      null,
    workspaceHref: ownerStore?.store
      ? buildSellerWorkspacePath(ownerStore.store)
      : null,
  };
};

export default function AccountDashboardPage() {
  const { user } = useOutletContext() || {};
  const ordersQuery = useQuery({
    queryKey: ["account", "orders", "my", "dashboard"],
    queryFn: () => fetchStoreMyOrders({ limit: 100 }),
  });
  const applicationQuery = useQuery({
    queryKey: ["user", "store-application", "current"],
    queryFn: getCurrentUserStoreApplication,
    retry: false,
  });
  const sellerStoresQuery = useQuery({
    queryKey: ["seller", "workspace", "stores"],
    queryFn: listOptionalSellerWorkspaceStores,
    retry: false,
  });
  const notificationsQuery = useQuery({
    queryKey: ["user", "notifications", "unread-count"],
    queryFn: fetchUserUnreadNotificationCount,
    retry: false,
  });
  const invitationsQuery = useQuery({
    queryKey: ["seller", "invitations"],
    queryFn: getOptionalSellerInvitations,
    retry: false,
  });
  const addressesQuery = useQuery({
    queryKey: ["user", "addresses"],
    queryFn: listAddresses,
    retry: false,
  });

  const orderSnapshots = useMemo(
    () =>
      unwrapOrders(ordersQuery.data).map((order) => ({
        order,
        truthStatus: getOrderTruthStatus(order),
      })),
    [ordersQuery.data]
  );
  const recentOrders = useMemo(
    () =>
      [...orderSnapshots]
        .sort((left, right) => getOrderTimestamp(right.order) - getOrderTimestamp(left.order))
        .slice(0, 5),
    [orderSnapshots]
  );
  const stats = useMemo(
    () => ({
      total: orderSnapshots.length,
      pending: orderSnapshots.filter(({ truthStatus }) => truthStatus.bucket === "pending")
        .length,
      processing: orderSnapshots.filter(
        ({ truthStatus }) =>
          truthStatus.bucket === "processing" || truthStatus.bucket === "shipping"
      ).length,
      completed: orderSnapshots.filter(({ truthStatus }) => truthStatus.bucket === "complete")
        .length,
    }),
    [orderSnapshots]
  );
  const sellerStores = Array.isArray(sellerStoresQuery.data)
    ? sellerStoresQuery.data
    : [];
  const onboarding = resolveOnboarding({
    application: applicationQuery.data || null,
    sellerStores,
  });
  const invitationItems = Array.isArray(invitationsQuery.data?.items)
    ? invitationsQuery.data.items
    : [];
  const nonBlockingErrors = [
    ordersQuery.isError ? "Recent orders could not be loaded." : "",
    applicationQuery.isError || sellerStoresQuery.isError
      ? "Store application status could not be loaded."
      : "",
    notificationsQuery.isError ? "Notification count is temporarily unavailable." : "",
    invitationsQuery.isError ? "Invitation count is temporarily unavailable." : "",
    addressesQuery.isError ? "Address count is temporarily unavailable." : "",
  ].filter(Boolean);

  return (
    <AccountDashboard2026View
      user={user}
      stats={stats}
      recentOrders={recentOrders}
      onboarding={onboarding}
      notificationCount={Number(notificationsQuery.data || 0)}
      invitationCount={invitationItems.filter((item) => item?.isActionable).length}
      addressCount={Array.isArray(addressesQuery.data) ? addressesQuery.data.length : 0}
      isOrdersLoading={ordersQuery.isLoading}
      isOnboardingLoading={applicationQuery.isLoading || sellerStoresQuery.isLoading}
      errors={nonBlockingErrors}
    />
  );
}
