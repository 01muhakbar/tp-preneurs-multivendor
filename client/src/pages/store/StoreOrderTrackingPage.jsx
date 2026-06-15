import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchStoreOrder } from "../../api/public/storeOrders.ts";
import { TRANSFER_INSTRUCTIONS } from "../../config/paymentInstructions.ts";
import { isOrderContractFinal } from "../../utils/orderContract.ts";
import { isSplitOperationallyFinal } from "../../utils/splitOperationalTruth.ts";
import StoreOrderTracking2026View from "./StoreOrderTracking2026View.jsx";
import {
  getStoreTrackingSafeRef2026,
  normalizeStoreOrderTrackingFor2026,
} from "./storeOrderTracking2026Adapter.js";

const normalizeTrackingPayload = (response) =>
  response?.data?.data ??
  response?.data ??
  response?.order ??
  response?.data?.order ??
  response ??
  null;

const shouldPollTracking = (tracking) => {
  if (!tracking || typeof tracking !== "object") return false;
  if (!isOrderContractFinal(tracking.contract)) return true;
  const storeSplits = Array.isArray(tracking.storeSplits) ? tracking.storeSplits : [];
  return storeSplits.some((split) => !isSplitOperationallyFinal(split));
};

const safeFileName = (value) =>
  String(value || "invoice")
    .trim()
    .replace(/[^a-z0-9-_]+/gi, "-")
    .replace(/^-+|-+$/g, "") || "invoice";

export default function StoreOrderTrackingPage() {
  const params = useParams();
  const ref = getStoreTrackingSafeRef2026(params);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  const trackingQuery = useQuery({
    queryKey: ["store-order-tracking", ref],
    queryFn: () => fetchStoreOrder(ref),
    enabled: Boolean(ref),
    retry: false,
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false,
    refetchInterval: (query) => {
      const tracking = normalizeTrackingPayload(query.state.data);
      return shouldPollTracking(tracking) ? 15_000 : false;
    },
  });

  const rawTracking = useMemo(
    () => normalizeTrackingPayload(trackingQuery.data),
    [trackingQuery.data]
  );
  const tracking2026 = useMemo(
    () => normalizeStoreOrderTrackingFor2026({ tracking: rawTracking }),
    [rawTracking]
  );

  const invalidReferenceError = !ref
    ? new Error("Order tracking requires a valid public invoice reference.")
    : null;

  const handlePrintInvoice = () => {
    if (typeof window !== "undefined") window.print();
  };

  const handleDownloadInvoice = async () => {
    if (!tracking2026 || isDownloading) return;
    try {
      setDownloadError("");
      setIsDownloading(true);
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 15;
      let y = 18;
      const write = (label, value) => {
        pdf.setFont("helvetica", "bold");
        pdf.text(`${label}:`, margin, y);
        pdf.setFont("helvetica", "normal");
        pdf.text(String(value || "-"), margin + 38, y);
        y += 7;
      };

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(20);
      pdf.text("ORDER INVOICE", margin, y);
      pdf.setFontSize(10);
      pdf.text("TP PRENEURS", pageWidth - margin, y, { align: "right" });
      y += 11;
      write("Reference", tracking2026.reference);
      write("Created", tracking2026.createdAtLabel);
      write("Status", tracking2026.status.label);
      write("Payment", `${tracking2026.payment.method} - ${tracking2026.payment.label}`);
      write("Customer", tracking2026.customer.name);
      y += 3;

      pdf.setFont("helvetica", "bold");
      pdf.text("Items", margin, y);
      y += 7;
      tracking2026.items.forEach((item, index) => {
        if (y > 270) {
          pdf.addPage();
          y = 18;
        }
        pdf.setFont("helvetica", "normal");
        pdf.text(
          `${index + 1}. ${item.name} x${item.quantity}`,
          margin,
          y
        );
        pdf.text(item.subtotalLabel, pageWidth - margin, y, { align: "right" });
        y += 7;
      });

      y += 3;
      pdf.setDrawColor(220, 228, 238);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 8;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.text("Total", margin, y);
      pdf.text(tracking2026.totals.totalLabel, pageWidth - margin, y, { align: "right" });
      pdf.save(`${safeFileName(tracking2026.reference)}.pdf`);
    } catch (error) {
      console.error("[store/order-tracking-2026] invoice download failed", error);
      setDownloadError("Unable to download the invoice. Use Print Invoice as a fallback.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleEmailSupport = () => {
    if (typeof window === "undefined") return;
    window.location.href = `mailto:support@tppreneurs.com?subject=${encodeURIComponent(
      `Order support ${tracking2026?.reference || ref}`
    )}`;
  };

  const handleWhatsAppSupport = () => {
    if (typeof window === "undefined") return;
    const phone = String(TRANSFER_INSTRUCTIONS.whatsapp || "").replace(/\D/g, "");
    const message = encodeURIComponent(
      `Hello, I need help with order ${tracking2026?.reference || ref}.`
    );
    window.open(`https://wa.me/${phone}?text=${message}`, "_blank", "noopener,noreferrer");
  };

  return (
    <StoreOrderTracking2026View
      tracking={tracking2026}
      isLoading={Boolean(ref) && trackingQuery.isLoading && !trackingQuery.data}
      error={invalidReferenceError || (trackingQuery.isError ? trackingQuery.error : null)}
      isDownloading={isDownloading}
      downloadError={downloadError}
      LinkComponent={Link}
      onDownloadInvoice={handleDownloadInvoice}
      onPrintInvoice={handlePrintInvoice}
      onEmailSupport={handleEmailSupport}
      onWhatsAppSupport={handleWhatsAppSupport}
    />
  );
}
