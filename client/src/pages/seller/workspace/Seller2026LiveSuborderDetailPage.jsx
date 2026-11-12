import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import SellerSuborderDetail2026PageView from "./SellerSuborderDetail2026PageView.jsx";
import SellerShippingLabelPrint from "../../../features/sellerWorkspace2026/orders/print/SellerShippingLabelPrint.jsx";
import { getSellerSuborderShippingLabel } from "../../../api/sellerOrders.ts";
import { toPreferredWhatsAppLink } from "../../../utils/storePublicIdentity.ts";
import {
  buildSellerSuborderFulfillmentPayload2026,
  normalizeSellerSuborderDetailFor2026,
} from "./sellerSuborderDetail2026Adapter.js";
import { useSeller2026SuborderDetail } from "../../../hooks/seller2026/useSeller2026SuborderDetail.ts";
import { useSellerWorkspaceRoute } from "../../../utils/sellerWorkspaceRoute.js";
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
  const { i18n } = useTranslation();
  const { suborderId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [, setLangSyncCounter] = useState(0);

  useEffect(() => {
    const handleSync = () => setLangSyncCounter((c) => c + 1);
    i18n.on("languageChanged", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      i18n.off("languageChanged", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, [i18n]);

  const isIndo = (() => {
    const lang = (i18n.language || "").toLowerCase();
    if (lang.startsWith("id")) return true;
    if (typeof window !== "undefined") {
      try {
        const stored = JSON.parse(
          window.localStorage.getItem("seller_language") || "null"
        );
        if (
          stored?.isoCode?.toLowerCase()?.startsWith("id") ||
          stored?.name?.toLowerCase()?.includes("indonesia")
        ) {
          return true;
        }
      } catch {
        // ignore
      }
      const storeLang = window.localStorage.getItem("store_language") || "";
      if (
        storeLang.toLowerCase().includes("indonesia") ||
        storeLang.toLowerCase() === "id"
      ) {
        return true;
      }
    }
    return false;
  })();

  const {
    sellerContext,
    workspaceStoreId,
    workspaceRoutes,
  } = useSellerWorkspaceRoute();
  const { can } = getSeller2026PagePermissions(sellerContext);
  const canView = can("ORDER_READ");
  const canFulfill = can("ORDER_FULFILLMENT_UPDATE");
  const [notice, setNotice] = useState(null);
  const [shippingLabel, setShippingLabel] = useState(null);
  const [shippingLabelPrintToken, setShippingLabelPrintToken] = useState(null);
  const [printingLabelId, setPrintingLabelId] = useState(null);
  const [fulfillmentDraft, setFulfillmentDraft] = useState({
    trackingNumber: "",
    shippingProvider: "",
    courierService: "",
    note: "",
  });
  const [internalNoteDraft, setInternalNoteDraft] = useState("");

  const detailQuery = useSeller2026SuborderDetail(workspaceStoreId, suborderId, {
    enabled: Boolean(canView && workspaceStoreId && suborderId),
    permissions: { canFulfill },
  });

  const orderDetail2026 =
    detailQuery.data && (detailQuery.data.suborder?.id || detailQuery.data.suborder?.suborderId)
      ? normalizeSellerSuborderDetailFor2026({
          suborder: detailQuery.data,
          routes: {
            orders: workspaceRoutes.orders(),
          },
          isIndo,
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

  useEffect(() => {
    if (orderDetail2026?.internalNotes !== undefined) {
      setInternalNoteDraft(orderDetail2026.internalNotes || "");
    }
  }, [orderDetail2026?.internalNotes]);

  useEffect(() => {
    if (!shippingLabel) return undefined;
    const clearPrintedLabel = () => {
      setShippingLabel(null);
      setShippingLabelPrintToken(null);
    };
    window.addEventListener("afterprint", clearPrintedLabel);
    return () => window.removeEventListener("afterprint", clearPrintedLabel);
  }, [shippingLabel]);

  const handleBack = () => {
    navigate(workspaceRoutes.orders());
  };

  const handleCopyText = async (textToCopy, label = "Nomor pesanan") => {
    const copied = await copyText(textToCopy);
    setNotice({
      type: copied ? "success" : "error",
      text: copied
        ? isIndo
          ? `${textToCopy} berhasil disalin.`
          : `${label} copied.`
        : isIndo
        ? "Gagal menyalin."
        : "Failed to copy.",
    });
  };

  const handleFulfillmentDraftChange = (name, value) => {
    setFulfillmentDraft((current) => ({ ...current, [name]: value }));
  };

  const handlePrintLabel = async () => {
    if (!workspaceStoreId || !suborderId || printingLabelId) return;
    try {
      setPrintingLabelId(suborderId);
      const label = await getSellerSuborderShippingLabel(workspaceStoreId, suborderId);
      if (!label?.canPrint) {
        setNotice({
          type: "error",
          text: label?.reason || (isIndo ? "Label pengiriman belum dapat dicetak untuk pesanan ini." : "Shipping label not available."),
        });
        return;
      }
      setNotice(null);
      setShippingLabel(label);
      setShippingLabelPrintToken(`${suborderId}-${Date.now()}`);
    } catch (err) {
      setNotice({
        type: "error",
        text: getErrorMessage(err, isIndo ? "Gagal memuat label pengiriman." : "Unable to load shipping label."),
      });
    } finally {
      setPrintingLabelId(null);
    }
  };

  const handleMessageBuyer = (customer) => {
    const waUrl = toPreferredWhatsAppLink(customer?.phone, "");
    if (waUrl) {
      window.open(waUrl, "_blank");
    } else if (customer?.email) {
      window.open(`mailto:${customer.email}`, "_blank");
    } else {
      setNotice({
        type: "error",
        text: isIndo ? "Kontak pembeli tidak tersedia." : "Buyer contact info is unavailable.",
      });
    }
  };

  const handleFulfillmentAction = async (action, overrideDraft = null) => {
    if (action === "REVIEW_PAYMENT") {
      navigate(workspaceRoutes.paymentReview());
      return;
    }

    if (!orderDetail2026?.id || !canFulfill || detailQuery.updatingStatusId) return;
    try {
      const activeDraft = overrideDraft || fulfillmentDraft;
      const payload = buildSellerSuborderFulfillmentPayload2026(action, activeDraft);
      await detailQuery.updateFulfillmentStatus({ payload });
      await Promise.all([
        detailQuery.refetch(),
        queryClient.invalidateQueries({ queryKey: ["seller2026", "orders", workspaceStoreId] }),
        queryClient.invalidateQueries({ queryKey: ["seller2026", "dashboard", workspaceStoreId] }),
        queryClient.invalidateQueries({ queryKey: ["seller", "notifications", workspaceStoreId] }),
      ]);
      setNotice({
        type: "success",
        text: isIndo ? "Status pengiriman berhasil diperbarui." : "Seller fulfillment updated.",
      });
    } catch (error) {
      setNotice({
        type: "error",
        text: getErrorMessage(
          error,
          isIndo ? "Gagal memperbarui status pengiriman." : "Failed to update seller fulfillment."
        ),
      });
    }
  };

  const handleSaveInternalNote = async () => {
    if (!orderDetail2026?.id || detailQuery.updatingStatusId) return;
    try {
      await detailQuery.updateInternalNote({ note: internalNoteDraft });
      await detailQuery.refetch();
      setNotice({
        type: "success",
        text: isIndo ? "Catatan internal berhasil disimpan." : "Internal note saved.",
      });
    } catch (error) {
      setNotice({
        type: "error",
        text: getErrorMessage(
          error,
          isIndo ? "Gagal menyimpan catatan internal." : "Failed to save internal note."
        ),
      });
    }
  };

  return (
    <>
      <SellerSuborderDetail2026PageView
        order={orderDetail2026}
        store={sellerContext?.store}
        isLoading={detailQuery.isLoading}
        error={detailQuery.isError ? detailQuery.error : null}
        isUpdating={Boolean(detailQuery.updatingStatusId || printingLabelId)}
        LinkComponent={Link}
        fulfillmentDraft={fulfillmentDraft}
        notice={notice}
        isIndo={isIndo}
        onCopyText={handleCopyText}
        onBack={handleBack}
        onPrintLabel={handlePrintLabel}
        isPrintingLabel={Boolean(printingLabelId)}
        onMessageBuyer={handleMessageBuyer}
        onFulfillmentDraftChange={handleFulfillmentDraftChange}
        onFulfillmentAction={handleFulfillmentAction}
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
        internalNoteDraft={internalNoteDraft}
        onInternalNoteChange={setInternalNoteDraft}
        onSaveInternalNote={handleSaveInternalNote}
      />
      <SellerShippingLabelPrint
        label={shippingLabel}
        printToken={shippingLabelPrintToken}
        onReady={() => {
          window.setTimeout(() => window.print(), 50);
        }}
      />
    </>
  );
}
