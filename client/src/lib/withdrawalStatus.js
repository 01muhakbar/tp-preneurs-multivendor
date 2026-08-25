export const WITHDRAWAL_STATUS_CODES = ["PENDING", "PROCESSING", "COMPLETED", "REJECTED"];
export const WITHDRAWAL_ADMIN_FEE_AMOUNT = 6500;

const STATUS_COPY = {
  PENDING: {
    label: { en: "Pending", id: "Menunggu" },
    description: {
      en: "Seller has submitted the withdrawal request.",
      id: "Seller sudah mengajukan pencairan dana.",
    },
    pillTone: "warning",
    timelineTone: "warning",
    badge: { background: "#fef3c7", color: "#b45309" },
  },
  PROCESSING: {
    label: { en: "Processing", id: "Diproses" },
    description: {
      en: "Admin is preparing or processing the transfer.",
      id: "Admin sedang menyiapkan atau memproses transfer.",
    },
    pillTone: "warning",
    timelineTone: "info",
    badge: { background: "#eff6ff", color: "#1d4ed8" },
  },
  COMPLETED: {
    label: { en: "Completed", id: "Selesai" },
    description: {
      en: "Transfer has been completed and proof is available when uploaded.",
      id: "Transfer sudah selesai dan bukti tersedia jika sudah diunggah.",
    },
    pillTone: "success",
    timelineTone: "success",
    badge: { background: "#ecfdf5", color: "#047857" },
  },
  REJECTED: {
    label: { en: "Rejected", id: "Ditolak" },
    description: {
      en: "Admin rejected the withdrawal request with a note.",
      id: "Admin menolak permintaan pencairan dengan catatan.",
    },
    pillTone: "danger",
    timelineTone: "danger",
    badge: { background: "#fef2f2", color: "#b91c1c" },
  },
};

const TIMELINE_COPY = {
  REQUESTED: {
    label: { en: "Requested", id: "Diajukan" },
    description: {
      en: "Seller submitted the withdrawal request.",
      id: "Seller mengajukan permintaan pencairan dana.",
    },
  },
  PROCESSING: {
    label: { en: "Admin Processing", id: "Diproses Admin" },
    description: {
      en: "Admin reviews the request and prepares the transfer.",
      id: "Admin meninjau permintaan dan menyiapkan transfer.",
    },
  },
  COMPLETED: {
    label: { en: "Completed", id: "Selesai" },
    description: {
      en: "Admin completed the transfer and attached proof when available.",
      id: "Admin menyelesaikan transfer dan melampirkan bukti jika tersedia.",
    },
  },
  REJECTED: {
    label: { en: "Rejected", id: "Ditolak" },
    description: {
      en: "Admin rejected the request with a note.",
      id: "Admin menolak permintaan dengan catatan.",
    },
  },
};

export const normalizeWithdrawalStatus = (status) => {
  const normalized = String(status || "").trim().toUpperCase();
  return WITHDRAWAL_STATUS_CODES.includes(normalized) ? normalized : "PENDING";
};

export const getWithdrawalStatusMeta = (status, options = {}) => {
  const code = normalizeWithdrawalStatus(status);
  const locale = options.isId ? "id" : "en";
  const copy = STATUS_COPY[code] || STATUS_COPY.PENDING;
  return {
    code,
    label: copy.label[locale],
    description: copy.description[locale],
    pillTone: copy.pillTone,
    timelineTone: copy.timelineTone,
    badge: copy.badge,
  };
};

const readTimestamp = (withdrawal, keys) => {
  for (const key of keys) {
    const value = withdrawal?.[key];
    if (value) return value;
  }
  return null;
};

export const getWithdrawalTimeline = (withdrawalOrStatus, options = {}) => {
  const withdrawal =
    withdrawalOrStatus && typeof withdrawalOrStatus === "object"
      ? withdrawalOrStatus
      : { status: withdrawalOrStatus };
  const status = normalizeWithdrawalStatus(withdrawal.status);
  const locale = options.isId ? "id" : "en";
  const finalCode = status === "REJECTED" ? "REJECTED" : "COMPLETED";
  const finalStatusIndex = status === "PENDING" ? 0 : status === "PROCESSING" ? 1 : 2;

  const steps = [
    {
      code: "REQUESTED",
      sourceStatus: "PENDING",
      label: TIMELINE_COPY.REQUESTED.label[locale],
      description: TIMELINE_COPY.REQUESTED.description[locale],
      timestamp: readTimestamp(withdrawal, ["requestedAt", "createdAt"]),
      tone: "warning",
    },
    {
      code: "PROCESSING",
      sourceStatus: "PROCESSING",
      label: TIMELINE_COPY.PROCESSING.label[locale],
      description: TIMELINE_COPY.PROCESSING.description[locale],
      timestamp: status === "PROCESSING" ? readTimestamp(withdrawal, ["updatedAt"]) : null,
      tone: "info",
    },
    {
      code: finalCode,
      sourceStatus: finalCode,
      label: TIMELINE_COPY[finalCode].label[locale],
      description: TIMELINE_COPY[finalCode].description[locale],
      timestamp: ["COMPLETED", "REJECTED"].includes(status)
        ? readTimestamp(withdrawal, ["processedAt", "updatedAt"])
        : null,
      tone: finalCode === "REJECTED" ? "danger" : "success",
    },
  ];

  return steps.map((step, index) => ({
    ...step,
    state: index < finalStatusIndex ? "complete" : index === finalStatusIndex ? "active" : "pending",
  }));
};

export const getWithdrawalFinancials = (withdrawalOrAmount, options = {}) => {
  const withdrawal =
    withdrawalOrAmount && typeof withdrawalOrAmount === "object"
      ? withdrawalOrAmount
      : { amount: withdrawalOrAmount };
  const amount = Number(withdrawal?.amount || 0);
  const adminFeeAmount = Number(withdrawal?.adminFeeAmount ?? options.adminFeeAmount ?? WITHDRAWAL_ADMIN_FEE_AMOUNT);
  const netTransferAmount = Number(
    withdrawal?.netTransferAmount ?? Math.max(0, amount - adminFeeAmount)
  );

  return {
    amount: Number.isFinite(amount) ? amount : 0,
    adminFeeAmount: Number.isFinite(adminFeeAmount) ? adminFeeAmount : WITHDRAWAL_ADMIN_FEE_AMOUNT,
    netTransferAmount: Number.isFinite(netTransferAmount) ? netTransferAmount : 0,
  };
};
