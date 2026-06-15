import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { Upload, X } from "lucide-react";
import {
  cancelPaymentTransaction,
  fetchOrderCheckoutPayment,
  submitPaymentProof,
  uploadPaymentProofImage,
} from "../../api/orderPayments.ts";
import { formatCurrency } from "../../utils/format.js";
import { resolveAssetUrl } from "../../lib/assetUrl.js";
import {
  hasGroupedPaymentDeadlinePassed,
  shouldPollGroupedPaymentGroups,
} from "../../utils/groupedPaymentReadModel.ts";
import AccountOrderPayment2026View from "./AccountOrderPayment2026View.jsx";
import {
  canCancelPayment2026,
  canConfirmTransfer2026,
  normalizeOrderPaymentFor2026,
} from "./accountOrderPayment2026Adapter.js";

const createEmptyForm = (amount = "") => ({
  proofImageUrl: "",
  senderName: "",
  senderBankOrWallet: "",
  transferAmount: amount,
  transferTime: "",
  note: "",
});

const copyText = async (value) => {
  const text = String(value ?? "").trim();
  if (!text) return false;
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall back for browsers without clipboard permission.
  }

  try {
    const helper = document.createElement("textarea");
    helper.value = text;
    helper.setAttribute("readonly", "readonly");
    helper.style.position = "absolute";
    helper.style.left = "-9999px";
    document.body.appendChild(helper);
    helper.select();
    const copied = document.execCommand("copy");
    document.body.removeChild(helper);
    return copied;
  } catch {
    return false;
  }
};

function OverlayDialog({ open, title, onClose, children }) {
  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto bg-slate-950/70 px-4 py-6"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl rounded-xl bg-white p-5 shadow-2xl sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Payment</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

function PaymentProofForm({
  paymentId,
  paymentAmount,
  storeName,
  mode,
  disabled,
  onSubmit,
  isSubmitting,
}) {
  const [form, setForm] = useState(
    createEmptyForm(String(Number(paymentAmount || 0) || ""))
  );
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const senderNameRef = useRef(null);

  useEffect(() => {
    window.requestAnimationFrame(() => senderNameRef.current?.focus?.());
  }, []);

  const handleChange = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (error) setError("");
  };

  const handleProofFileUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setIsUploading(true);
    try {
      const proofImageUrl = await uploadPaymentProofImage(file);
      setForm((current) => ({ ...current, proofImageUrl }));
      setError("");
    } catch (uploadError) {
      setError(
        uploadError?.response?.data?.message ||
          uploadError?.message ||
          "Failed to upload payment proof image."
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (disabled || isSubmitting || isUploading) return;

    const proofImageUrl = String(form.proofImageUrl || "").trim();
    const senderName = String(form.senderName || "").trim();
    const senderBankOrWallet = String(form.senderBankOrWallet || "").trim();
    const transferAmount = Number(form.transferAmount);
    const transferTimeValue = String(form.transferTime || "").trim();

    if (
      !proofImageUrl ||
      !senderName ||
      !senderBankOrWallet ||
      transferAmount < 1 ||
      !transferTimeValue
    ) {
      setError("Please complete all required proof fields.");
      return;
    }

    const transferDate = new Date(transferTimeValue);
    if (Number.isNaN(transferDate.getTime())) {
      setError("Transfer time is invalid.");
      return;
    }

    try {
      await onSubmit(paymentId, {
        proofImageUrl,
        senderName,
        senderBankOrWallet,
        transferAmount,
        transferTime: transferDate.toISOString(),
        note: String(form.note || "").trim(),
      });
      setForm(createEmptyForm(String(Number(paymentAmount || 0) || "")));
      setError("");
    } catch (submitError) {
      setError(
        submitError?.response?.data?.message ||
          submitError?.message ||
          "Failed to submit payment proof."
      );
    }
  };

  const fieldClass =
    "mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600">
        Upload proof for <strong className="text-slate-900">{storeName}</strong>.
        This confirmation remains scoped to this store payment.
      </p>
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="text-xs font-semibold uppercase text-slate-500">
            Proof Image *
          </label>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
            <Upload className="h-4 w-4" />
            {isUploading ? "Uploading..." : "Upload image"}
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              className="sr-only"
              disabled={disabled || isSubmitting || isUploading}
              onChange={handleProofFileUpload}
            />
          </label>
        </div>
        <textarea
          value={form.proofImageUrl}
          onChange={(event) => handleChange("proofImageUrl", event.target.value)}
          disabled={disabled || isSubmitting || isUploading}
          placeholder="Upload an image or paste its URL"
          className="mt-2 h-20 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
        />
        {form.proofImageUrl ? (
          <img
            src={resolveAssetUrl(form.proofImageUrl)}
            alt={`Payment proof for ${storeName}`}
            className="mt-3 max-h-44 w-full rounded-lg border border-slate-200 bg-slate-50 object-contain p-2"
          />
        ) : null}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-xs font-semibold uppercase text-slate-500">
          Sender Name *
          <input
            ref={senderNameRef}
            value={form.senderName}
            onChange={(event) => handleChange("senderName", event.target.value)}
            disabled={disabled || isSubmitting}
            className={fieldClass}
          />
        </label>
        <label className="block text-xs font-semibold uppercase text-slate-500">
          Bank / Wallet *
          <input
            value={form.senderBankOrWallet}
            onChange={(event) =>
              handleChange("senderBankOrWallet", event.target.value)
            }
            disabled={disabled || isSubmitting}
            className={fieldClass}
          />
        </label>
        <label className="block text-xs font-semibold uppercase text-slate-500">
          Transfer Amount *
          <input
            type="number"
            min="1"
            step="1"
            value={form.transferAmount}
            onChange={(event) => handleChange("transferAmount", event.target.value)}
            disabled={disabled || isSubmitting}
            className={fieldClass}
          />
        </label>
        <label className="block text-xs font-semibold uppercase text-slate-500">
          Transfer Time *
          <input
            type="datetime-local"
            value={form.transferTime}
            onChange={(event) => handleChange("transferTime", event.target.value)}
            disabled={disabled || isSubmitting}
            className={fieldClass}
          />
        </label>
      </div>
      <label className="block text-xs font-semibold uppercase text-slate-500">
        Note
        <textarea
          value={form.note}
          onChange={(event) => handleChange("note", event.target.value)}
          disabled={disabled || isSubmitting}
          className="mt-2 h-20 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
        />
      </label>
      {error ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={disabled || isSubmitting || isUploading}
        className="inline-flex h-11 items-center justify-center rounded-lg bg-emerald-600 px-5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting
          ? "Submitting..."
          : mode === "resubmit"
            ? "Submit new payment proof"
            : "Submit payment confirmation"}
      </button>
    </form>
  );
}

export default function AccountOrderPaymentPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [proofPaymentId, setProofPaymentId] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [actionNotice, setActionNotice] = useState(null);
  const [now, setNow] = useState(() => Date.now());

  const paymentQuery = useQuery({
    queryKey: ["account", "order", "payment", id],
    queryFn: () => fetchOrderCheckoutPayment(id),
    enabled: Boolean(id),
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false,
    refetchInterval: (query) =>
      shouldPollGroupedPaymentGroups(query.state.data?.data?.groups) ? 15000 : false,
  });

  const invalidatePaymentQueries = async (paymentId) => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["account", "order", "payment", id],
      }),
      queryClient.invalidateQueries({ queryKey: ["account", "orders", id] }),
      queryClient.invalidateQueries({
        queryKey: ["account", "orders", "grouped", id],
      }),
      queryClient.invalidateQueries({ queryKey: ["account", "orders", "my"] }),
      queryClient.invalidateQueries({ queryKey: ["payment", paymentId] }),
    ]);
  };

  const proofMutation = useMutation({
    mutationFn: ({ paymentId, payload }) => submitPaymentProof(paymentId, payload),
    onSuccess: async (_, variables) => {
      setProofPaymentId(null);
      setActionNotice({
        tone: "emerald",
        message: "Payment proof submitted. It is now waiting for seller review.",
      });
      await invalidatePaymentQueries(variables.paymentId);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (paymentId) => cancelPaymentTransaction(paymentId),
    onSuccess: async (_, paymentId) => {
      setCancelTarget(null);
      setProofPaymentId(null);
      setActionNotice({
        tone: "slate",
        message: "Payment transaction cancelled successfully.",
      });
      await invalidatePaymentQueries(paymentId);
    },
    onError: (mutationError) => {
      setActionNotice({
        tone: "rose",
        message:
          mutationError?.response?.data?.message ||
          mutationError?.message ||
          "Failed to cancel this payment transaction.",
      });
    },
  });

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const order = paymentQuery.data?.data || null;
  const groups = Array.isArray(order?.groups) ? order.groups : [];
  const payment2026 = useMemo(
    () =>
      order
        ? normalizeOrderPaymentFor2026({
            order,
            payment: null,
            readModel: order,
          })
        : null,
    [order]
  );
  const primaryPaymentId = payment2026?.primaryPayment?.paymentId ?? null;

  useEffect(() => {
    if (!groups.some((group) => hasGroupedPaymentDeadlinePassed(group, now))) return;
    const timeout = window.setTimeout(() => paymentQuery.refetch(), 250);
    return () => window.clearTimeout(timeout);
  }, [groups, now, paymentQuery.refetch]);

  const handleCopy = async (value) => {
    const copied = await copyText(value);
    if (!copied) {
      setActionNotice({
        tone: "rose",
        message: "Could not copy this value. Please select it manually.",
      });
    }
  };

  const handleSaveQr = () => {
    const imageUrl = resolveAssetUrl(payment2026?.qr?.imageUrl);
    if (!imageUrl) return;
    const link = document.createElement("a");
    link.href = imageUrl;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.download = `${payment2026?.reference || "payment"}-qris`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmitProof = (paymentId, payload) =>
    proofMutation.mutateAsync({ paymentId, payload });

  const handleConfirmTransfer = () => {
    if (primaryPaymentId) setProofPaymentId(primaryPaymentId);
  };

  const handleCancelPayment = () => {
    const primary = payment2026?.primaryPayment;
    if (!primary?.paymentId) return;
    setCancelTarget({
      paymentId: primary.paymentId,
      storeName: primary.storeName,
      amount: primary.amount,
      reference: primary.paymentReference,
    });
  };

  const viewError = !id
    ? new Error("Invalid order id.")
    : paymentQuery.isError
      ? paymentQuery.error
      : !paymentQuery.isLoading && !order
        ? new Error("Order payment view not found.")
        : null;
  const proofGroup =
    groups.find((group) => group?.payment?.id === proofPaymentId) || null;

  return (
    <>
      <AccountOrderPayment2026View
        payment={payment2026}
        isLoading={paymentQuery.isLoading}
        error={viewError}
        status={actionNotice}
        isSubmitting={proofMutation.isPending || cancelMutation.isPending}
        LinkComponent={Link}
        onCopyAmount={() => handleCopy(payment2026?.amount)}
        onCopyReference={() => handleCopy(payment2026?.paymentReference)}
        onSaveQr={handleSaveQr}
        onConfirmTransfer={
          payment2026 && canConfirmTransfer2026(payment2026)
            ? handleConfirmTransfer
            : undefined
        }
        onCancelPayment={
          payment2026 && canCancelPayment2026(payment2026)
            ? handleCancelPayment
            : undefined
        }
      />

      <OverlayDialog
        open={Boolean(proofPaymentId && proofGroup)}
        title={
          payment2026?.primaryPayment?.status?.code === "REJECTED"
            ? "Submit new payment proof"
            : "Confirm your transfer"
        }
        onClose={() => {
          if (!proofMutation.isPending) setProofPaymentId(null);
        }}
      >
        {proofPaymentId && proofGroup ? (
          <PaymentProofForm
            paymentId={proofPaymentId}
            paymentAmount={proofGroup.payment?.amount || proofGroup.totalAmount}
            storeName={proofGroup.storeName}
            mode={
              payment2026?.primaryPayment?.status?.code === "REJECTED"
                ? "resubmit"
                : "submit"
            }
            disabled={!canConfirmTransfer2026(payment2026)}
            isSubmitting={proofMutation.isPending}
            onSubmit={handleSubmitProof}
          />
        ) : null}
      </OverlayDialog>

      <OverlayDialog
        open={Boolean(cancelTarget)}
        title="Cancel transaction"
        onClose={() => {
          if (!cancelMutation.isPending) setCancelTarget(null);
        }}
      >
        {cancelTarget ? (
          <div className="space-y-4">
            <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Cancel this store payment? You can create a new transaction later only
              if the backend still allows it.
            </p>
            <dl className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-slate-200 p-3">
                <dt className="text-xs text-slate-500">Store</dt>
                <dd className="mt-1 font-semibold">{cancelTarget.storeName}</dd>
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <dt className="text-xs text-slate-500">Amount</dt>
                <dd className="mt-1 font-semibold">
                  {formatCurrency(cancelTarget.amount)}
                </dd>
              </div>
              <div className="min-w-0 rounded-lg border border-slate-200 p-3">
                <dt className="text-xs text-slate-500">Reference</dt>
                <dd className="mt-1 break-all text-sm font-semibold">
                  {cancelTarget.reference}
                </dd>
              </div>
            </dl>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => cancelMutation.mutate(cancelTarget.paymentId)}
                disabled={cancelMutation.isPending}
                className="inline-flex h-11 items-center justify-center rounded-lg bg-rose-600 px-5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
              >
                {cancelMutation.isPending ? "Cancelling..." : "Yes, cancel payment"}
              </button>
              <button
                type="button"
                onClick={() => setCancelTarget(null)}
                disabled={cancelMutation.isPending}
                className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                Keep payment
              </button>
            </div>
          </div>
        ) : null}
      </OverlayDialog>
    </>
  );
}
