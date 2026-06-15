import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import SellerSuborderDetail2026PageView from "./SellerSuborderDetail2026PageView.jsx";
import {
  buildSellerSuborderFulfillmentPayload2026,
  normalizeSellerSuborderDetailFor2026,
} from "./sellerSuborderDetail2026Adapter.js";
import { useSeller2026SuborderDetail } from "../../hooks/seller2026/useSeller2026SuborderDetail.ts";
import { useSellerWorkspaceRoute } from "../../utils/sellerWorkspaceRoute.js";
import { getSeller2026PagePermissions } from "./seller2026PagePermissions.js";

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

const copyText = async (value) => {
  const text = String(value || "").trim();
  if (!text || typeof navigator === "undefined") return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

export default function Seller2026LiveSuborderDetailPage() {
  const { suborderId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    sellerContext,
    workspaceStoreId,
    workspaceRoutes,
  } = useSellerWorkspaceRoute();
  const { can } = getSeller2026PagePermissions(sellerContext);
  const canView = can("ORDER_READ");
  const canFulfill = can("ORDER_FULFILLMENT_UPDATE");
  const [searchQuery, setSearchQuery] = useState("");
  const [notice, setNotice] = useState(null);
  const [fulfillmentDraft, setFulfillmentDraft] = useState({
    trackingNumber: "",
    shippingProvider: "",
    courierService: "",
    note: "",
  });

  const detailQuery = useSeller2026SuborderDetail(workspaceStoreId, suborderId, {
    enabled: Boolean(canView && workspaceStoreId && suborderId),
    permissions: { canFulfill },
  });

  const orderDetail2026 =
    detailQuery.data && detailQuery.data.suborder?.id
      ? normalizeSellerSuborderDetailFor2026({
          suborder: detailQuery.data,
          routes: {
            orders: workspaceRoutes.orders(),
          },
        })
      : null;

  useEffect(() => {
    if (!orderDetail2026) return;
    setFulfillmentDraft(orderDetail2026.fulfillmentDraft);
  }, [
    orderDetail2026?.id,
    orderDetail2026?.fulfillmentDraft?.trackingNumber,
    orderDetail2026?.fulfillmentDraft?.shippingProvider,
    orderDetail2026?.fulfillmentDraft?.courierService,
  ]);

  const handleBack = () => {
    navigate(workspaceRoutes.orders());
  };

  const handleCopyReference = async () => {
    const copied = await copyText(orderDetail2026?.reference);
    setNotice({
      type: copied ? "success" : "error",
      text: copied ? "Order reference copied." : "Unable to copy order reference.",
    });
  };

  const handleFulfillmentDraftChange = (name, value) => {
    setFulfillmentDraft((current) => ({ ...current, [name]: value }));
  };

  const handlePrintReceipt = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleFulfillmentAction = async (action) => {
    if (!orderDetail2026?.id || !canFulfill || detailQuery.updatingStatusId) return;
    try {
      const payload = buildSellerSuborderFulfillmentPayload2026(action, fulfillmentDraft);
      await detailQuery.updateFulfillmentStatus({ payload });
      await Promise.all([
        detailQuery.refetch(),
        queryClient.invalidateQueries({ queryKey: ["seller2026", "orders", workspaceStoreId] }),
        queryClient.invalidateQueries({ queryKey: ["seller2026", "dashboard", workspaceStoreId] }),
        queryClient.invalidateQueries({ queryKey: ["seller", "notifications", workspaceStoreId] }),
      ]);
      setNotice({ type: "success", text: "Seller fulfillment updated." });
    } catch (error) {
      setNotice({
        type: "error",
        text: getErrorMessage(error, "Failed to update seller fulfillment."),
      });
    }
  };

  return (
    <SellerSuborderDetail2026PageView
      order={orderDetail2026}
      store={sellerContext?.store}
      isLoading={detailQuery.isLoading}
      error={detailQuery.isError ? detailQuery.error : null}
      isUpdating={Boolean(detailQuery.updatingStatusId)}
      LinkComponent={Link}
      searchQuery={searchQuery}
      fulfillmentDraft={fulfillmentDraft}
      notice={notice}
      onSearchChange={setSearchQuery}
      onCopyReference={handleCopyReference}
      onBack={handleBack}
      onPrintReceipt={handlePrintReceipt}
      onFulfillmentDraftChange={handleFulfillmentDraftChange}
      onMarkPacked={
        orderDetail2026?.actions?.canMarkPacked && canFulfill
          ? () => handleFulfillmentAction("MARK_PROCESSING")
          : undefined
      }
      onMarkShipped={
        orderDetail2026?.actions?.canMarkShipped && canFulfill
          ? () => handleFulfillmentAction("MARK_SHIPPED")
          : undefined
      }
      onMarkDelivered={
        orderDetail2026?.actions?.canMarkDelivered && canFulfill
          ? () => handleFulfillmentAction("MARK_DELIVERED")
          : undefined
      }
    />
  );
}
