import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import {
  BadgeCheck,
  CalendarClock,
  FileImage,
  ShieldCheck,
  Upload,
  WalletCards,
  X,
} from "lucide-react";
import {
  cancelPaymentTransaction,
  fetchOrderCheckoutPayment,
  fetchPaymentDetail,
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

function OverlayDialog({ open, title, eyebrow = "Payment", onClose, children, panelClassName = "" }) {
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
      className="tp-payment-dialog"
      onClick={onClose}
    >
      <section
        className={`tp-payment-dialog__panel${panelClassName ? ` ${panelClassName}` : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tp-payment-dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <span className="tp-payment-dialog__handle" aria-hidden="true" />
        <div className="tp-payment-dialog__head">
          <div>
            <p>{eyebrow}</p>
            <h2 id="tp-payment-dialog-title">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="tp-payment-dialog__close"
            aria-label="Close dialog"
          >
            <X aria-hidden="true" />
          </button>
        </div>
        <div className="tp-payment-dialog__body">{children}</div>
      </section>
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

  const amountDisplay = formatCurrency(Number(paymentAmount || 0) || 0);
  const isBusy = disabled || isSubmitting || isUploading;

  return (
    <form onSubmit={handleSubmit} className="tp-payment-proof-form">
      <div className="tp-payment-proof-form__summary">
        <div>
          <span><WalletCards aria-hidden="true" /></span>
          <small>Store</small>
          <strong>{storeName}</strong>
        </div>
        <div>
          <span><BadgeCheck aria-hidden="true" /></span>
          <small>Amount</small>
          <strong>{amountDisplay}</strong>
        </div>
      </div>

      <label className="tp-payment-proof-upload">
        <input
          type="file"
          accept="image/png,image/jpeg,image/jpg"
          disabled={isBusy}
          onChange={handleProofFileUpload}
        />
        <span className="tp-payment-proof-upload__icon">
          <FileImage aria-hidden="true" />
        </span>
        <span className="tp-payment-proof-upload__copy">
          <strong>{isUploading ? "Uploading image..." : "Upload proof image"}</strong>
          <small>JPG or PNG, uploaded securely for seller review.</small>
        </span>
        <span className="tp-payment-proof-upload__button">
          <Upload aria-hidden="true" />
          Browse
        </span>
      </label>

      {form.proofImageUrl ? (
        <div className="tp-payment-proof-preview">
          <img
            src={resolveAssetUrl(form.proofImageUrl)}
            alt={`Payment proof for ${storeName}`}
          />
        </div>
      ) : null}

      <div className="tp-payment-proof-form__grid">
        <label className="tp-payment-proof-field">
          <span>Sender name *</span>
          <input
            ref={senderNameRef}
            value={form.senderName}
            onChange={(event) => handleChange("senderName", event.target.value)}
            disabled={disabled || isSubmitting}
            placeholder="Your account name"
          />
        </label>
        <label className="tp-payment-proof-field">
          <span>Bank / wallet *</span>
          <input
            value={form.senderBankOrWallet}
            onChange={(event) =>
              handleChange("senderBankOrWallet", event.target.value)
            }
            disabled={disabled || isSubmitting}
            placeholder="BCA, Mandiri, OVO..."
          />
        </label>
        <label className="tp-payment-proof-field">
          <span>Transfer amount *</span>
          <input
            type="number"
            min="1"
            step="1"
            value={form.transferAmount}
            onChange={(event) => handleChange("transferAmount", event.target.value)}
            disabled={disabled || isSubmitting}
          />
        </label>
        <label className="tp-payment-proof-field">
          <span>Transfer time *</span>
          <span className="tp-payment-proof-field__with-icon">
            <CalendarClock aria-hidden="true" />
            <input
              type="datetime-local"
              value={form.transferTime}
              onChange={(event) => handleChange("transferTime", event.target.value)}
              disabled={disabled || isSubmitting}
            />
          </span>
        </label>
      </div>

      <label className="tp-payment-proof-field tp-payment-proof-field--wide">
        <span>Note</span>
        <textarea
          value={form.note}
          onChange={(event) => handleChange("note", event.target.value)}
          disabled={disabled || isSubmitting}
          placeholder="Optional"
        />
      </label>

      {error ? (
        <p className="tp-payment-proof-form__error">
          {error}
        </p>
      ) : null}

      <div className="tp-payment-proof-form__footer">
        <p><ShieldCheck aria-hidden="true" /> Seller review starts after submit.</p>
      <button
        type="submit"
        disabled={isBusy}
        className="tp-payment-proof-form__submit"
      >
        {isSubmitting
          ? "Submitting..."
          : mode === "resubmit"
            ? "Submit new proof"
            : "Submit confirmation"}
      </button>
      </div>
    </form>
  );
}

export default function AccountOrderPaymentPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [proofPaymentId, setProofPaymentId] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [actionNotice, setActionNotice] = useState(null);
  const [selectedPaymentId, setSelectedPaymentId] = useState(null);
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
  const availablePaymentIds = useMemo(
    () => groups.map((group) => group?.payment?.id).filter(Boolean),
    [groups]
  );

  useEffect(() => {
    if (!availablePaymentIds.length) {
      setSelectedPaymentId(null);
      return;
    }
    setSelectedPaymentId((current) =>
      availablePaymentIds.includes(current) ? current : availablePaymentIds[0]
    );
  }, [availablePaymentIds]);

  const paymentDetailQuery = useQuery({
    queryKey: ["payment", selectedPaymentId],
    queryFn: () => fetchPaymentDetail(selectedPaymentId),
    enabled: Boolean(selectedPaymentId),
    refetchOnWindowFocus: true,
  });
  const selectedPaymentDetail = paymentDetailQuery.data?.data || null;
  const payment2026 = useMemo(
    () =>
      order
        ? normalizeOrderPaymentFor2026({
            order,
            payment: selectedPaymentDetail,
            readModel: order,
            selectedPaymentId,
          })
        : null,
    [order, selectedPaymentDetail, selectedPaymentId]
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

  const handleSaveQr = async () => {
    const imageUrl = resolveAssetUrl(payment2026?.qr?.imageUrl);
    if (!imageUrl) return;
    const fileName = `${payment2026?.reference || "payment"}-qris.png`;
    const clickDownload = (href, { openInNewTab = false } = {}) => {
      const link = document.createElement("a");
      link.href = href;
      link.download = fileName;
      if (openInNewTab) {
        link.target = "_blank";
        link.rel = "noreferrer";
      }
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    try {
      const response = await fetch(imageUrl, { credentials: "include" });
      if (!response.ok) throw new Error("QR image download failed.");
      const objectUrl = URL.createObjectURL(await response.blob());
      clickDownload(objectUrl);
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch {
      clickDownload(imageUrl, { openInNewTab: true });
    }
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
        onSelectDestination={setSelectedPaymentId}
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
        eyebrow="Payment proof"
        title={
          payment2026?.primaryPayment?.status?.code === "REJECTED"
            ? "Submit new payment proof"
            : "Confirm your transfer"
        }
        panelClassName="tp-payment-dialog__panel--proof"
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
