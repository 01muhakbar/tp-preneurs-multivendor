import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { listAdminWithdrawals, updateWithdrawalStatus, uploadWithdrawalProof } from "../../api/adminWithdrawals";
import WithdrawalStatusTimeline from "../../components/withdrawals/WithdrawalStatusTimeline.jsx";
import { resolveAssetUrl } from "../../lib/assetUrl.js";
import { getWithdrawalFinancials, getWithdrawalStatusMeta, WITHDRAWAL_STATUS_CODES } from "../../lib/withdrawalStatus.js";

export function AdminWithdrawalsPage() {
  const { t, i18n } = useTranslation("admin");
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const [proofFile, setProofFile] = useState(null);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const dateLocale = i18n.language?.toLowerCase().startsWith("id") ? "id-ID" : "en-US";
  const isId = i18n.language?.toLowerCase().startsWith("id");
  const formatCurrency = (value) => `Rp ${Number(value || 0).toLocaleString("id-ID")}`;
  const formatDate = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString(dateLocale);
  };
  const maskAccountNumber = (value) => {
    const normalized = String(value || "").replace(/\s+/g, "");
    if (!normalized) return "-";
    if (normalized.length <= 4) return normalized;
    return `${"*".repeat(Math.max(0, normalized.length - 4))}${normalized.slice(-4)}`;
  };
  const statusMeta = (status) => getWithdrawalStatusMeta(status, { isId });
  const statusLabel = (status) => statusMeta(status).label;

  const fetchWithdrawals = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listAdminWithdrawals(1, 100, statusFilter);
      setWithdrawals(res.data || []);
    } catch (err) {
      console.error(err);
      setError(t("withdrawals.Failed to load withdrawals", "Failed to load withdrawals"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, i18n.language]);

  const handleAction = async (status) => {
    setActionLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      let proofUrl = undefined;

      if (status === "COMPLETED" && proofFile) {
        const uploadRes = await uploadWithdrawalProof(selectedWithdrawal.id, proofFile);
        proofUrl = uploadRes?.data?.proofImageUrl;
      }

      await updateWithdrawalStatus(selectedWithdrawal.id, status, adminNote, proofUrl);
      setSuccessMsg(`${t("withdrawals.Withdrawal marked as", "Withdrawal marked as")} ${statusLabel(status)}`);
      setSelectedWithdrawal(null);
      setAdminNote("");
      setProofFile(null);
      fetchWithdrawals();
    } catch (err) {
      setError(err.response?.data?.message || t("withdrawals.Action failed", "Action failed"));
    } finally {
      setActionLoading(false);
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "24px", fontWeight: 700 }}>
              {t("withdrawals.Withdrawals", "Withdrawals")}
            </h1>
            <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: "14px" }}>
              {t("withdrawals.Manage seller withdrawal requests and transfer proof.", "Manage seller withdrawal requests and transfer proof.")}
            </p>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db" }}
          >
            <option value="">{t("withdrawals.All Statuses", "All Statuses")}</option>
            {WITHDRAWAL_STATUS_CODES.map((status) => (
              <option value={status} key={status}>{statusLabel(status)}</option>
            ))}
          </select>
        </div>

        {error && <div style={{ background: "#fef2f2", color: "#b91c1c", padding: "12px", borderRadius: "8px", marginBottom: "16px" }}>{error}</div>}
        {successMsg && <div style={{ background: "#ecfdf5", color: "#047857", padding: "12px", borderRadius: "8px", marginBottom: "16px" }}>{successMsg}</div>}

        <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
              <tr>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", color: "#6b7280" }}>ID</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", color: "#6b7280" }}>{t("withdrawals.Store", "Store")}</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", color: "#6b7280" }}>{t("withdrawals.Destination", "Destination")}</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", color: "#6b7280" }}>{t("withdrawals.Amount", "Amount")}</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", color: "#6b7280" }}>{t("withdrawals.Requested At", "Requested At")}</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", color: "#6b7280" }}>{t("withdrawals.Status", "Status")}</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", color: "#6b7280" }}>{t("withdrawals.Action", "Action")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ padding: "24px", textAlign: "center" }}>{t("withdrawals.Loading...", "Loading...")}</td></tr>
              ) : withdrawals.length === 0 ? (
                <tr><td colSpan="7" style={{ padding: "24px", textAlign: "center", color: "#6b7280" }}>{t("withdrawals.No withdrawals found", "No withdrawals found")}</td></tr>
              ) : (
                withdrawals.map((withdrawal) => (
                  <tr key={withdrawal.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "16px", fontSize: "14px" }}>#{withdrawal.id}</td>
                    <td style={{ padding: "16px", fontSize: "14px" }}>
                      <div style={{ fontWeight: 500 }}>{withdrawal.store?.name || "-"}</div>
                      <div style={{ color: "#6b7280", fontSize: "12px" }}>@{withdrawal.store?.slug || "-"}</div>
                    </td>
                    <td style={{ padding: "16px", fontSize: "14px" }}>
                      <div style={{ fontWeight: 600 }}>{withdrawal.bankName || "-"}</div>
                      <div style={{ color: "#6b7280", fontSize: "12px" }}>
                        {maskAccountNumber(withdrawal.accountNumber)}
                      </div>
                      <div style={{ color: "#6b7280", fontSize: "12px" }}>
                        {withdrawal.accountName || "-"}
                      </div>
                    </td>
                    <td style={{ padding: "16px", fontSize: "14px", fontWeight: 600 }}>
                      <div>{formatCurrency(getWithdrawalFinancials(withdrawal).netTransferAmount)}</div>
                      <div style={{ color: "#6b7280", fontSize: "12px", fontWeight: 500 }}>
                        {t("withdrawals.Request", "Request")} {formatCurrency(getWithdrawalFinancials(withdrawal).amount)}
                      </div>
                    </td>
                    <td style={{ padding: "16px", fontSize: "14px" }}>{formatDate(withdrawal.requestedAt)}</td>
                    <td style={{ padding: "16px", fontSize: "14px" }}>
                      <span style={{
                        padding: "4px 8px",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontWeight: 500,
                        background: statusMeta(withdrawal.status).badge.background,
                        color: statusMeta(withdrawal.status).badge.color,
                      }}>
                        {statusLabel(withdrawal.status)}
                      </span>
                    </td>
                    <td style={{ padding: "16px", fontSize: "14px" }}>
                      <button
                        type="button"
                        onClick={() => setSelectedWithdrawal(withdrawal)}
                        style={{ padding: "6px 12px", background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: 500 }}
                      >
                        {t("withdrawals.Review", "Review")}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedWithdrawal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ background: "#fff", padding: "24px", borderRadius: "12px", width: "500px", maxWidth: "90%", maxHeight: "90vh", overflowY: "auto" }}>
            {(() => {
              const selectedFinancials = getWithdrawalFinancials(selectedWithdrawal);
              return (
                <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 600 }}>
                {t("withdrawals.Review Withdrawal", "Review Withdrawal")} #{selectedWithdrawal.id}
              </h2>
              <button type="button" onClick={() => setSelectedWithdrawal(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px" }}>x</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
              <div>
                <div style={{ fontSize: "12px", color: "#6b7280" }}>{t("withdrawals.Store", "Store")}</div>
                <div style={{ fontWeight: 500 }}>{selectedWithdrawal.store?.name || "-"}</div>
              </div>
              <div>
                <div style={{ fontSize: "12px", color: "#6b7280" }}>{t("withdrawals.Amount", "Amount")}</div>
                <div style={{ fontWeight: 700, fontSize: "18px", color: "#2563eb" }}>{formatCurrency(selectedFinancials.netTransferAmount)}</div>
              </div>
              <div>
                <div style={{ fontSize: "12px", color: "#6b7280" }}>{t("withdrawals.Bank Name", "Bank Name")}</div>
                <div style={{ fontWeight: 500 }}>{selectedWithdrawal.bankName || "-"}</div>
              </div>
              <div>
                <div style={{ fontSize: "12px", color: "#6b7280" }}>{t("withdrawals.Account Number", "Account Number")}</div>
                <div style={{ fontWeight: 500 }}>{selectedWithdrawal.accountNumber || "-"}</div>
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <div style={{ fontSize: "12px", color: "#6b7280" }}>{t("withdrawals.Account Holder", "Account Holder")}</div>
                <div style={{ fontWeight: 500 }}>{selectedWithdrawal.accountName || "-"}</div>
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <div style={{ fontSize: "12px", color: "#6b7280" }}>{t("withdrawals.Status", "Status")}</div>
                <div style={{ marginTop: "6px" }}>
                  <span style={{
                    padding: "4px 8px",
                    borderRadius: "12px",
                    fontSize: "12px",
                    fontWeight: 600,
                    background: statusMeta(selectedWithdrawal.status).badge.background,
                    color: statusMeta(selectedWithdrawal.status).badge.color,
                  }}>
                    {statusLabel(selectedWithdrawal.status)}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: "24px", padding: "14px", background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: "10px", display: "grid", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", fontSize: "13px" }}>
                <span style={{ color: "#64748b" }}>{t("withdrawals.Requested Amount", "Requested Amount")}</span>
                <strong>{formatCurrency(selectedFinancials.amount)}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", fontSize: "13px" }}>
                <span style={{ color: "#64748b" }}>{t("withdrawals.Admin Fee", "Admin Fee")}</span>
                <strong>{formatCurrency(selectedFinancials.adminFeeAmount)}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", paddingTop: "8px", borderTop: "1px solid #e5e7eb", fontSize: "14px" }}>
                <span style={{ color: "#0f172a", fontWeight: 700 }}>{t("withdrawals.Net Transfer Amount", "Net Transfer Amount")}</span>
                <strong style={{ color: "#2563eb" }}>{formatCurrency(selectedFinancials.netTransferAmount)}</strong>
              </div>
              <p style={{ margin: "2px 0 0", color: "#64748b", fontSize: "12px" }}>
                {t("withdrawals.Transfer proof should match the net transfer amount.", "Transfer proof should match the net transfer amount.")}
              </p>
            </div>

            <div style={{ marginBottom: "24px", padding: "14px", background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: "10px" }}>
              <div style={{ fontSize: "12px", color: "#6b7280", fontWeight: 700, textTransform: "uppercase" }}>
                {t("withdrawals.Timeline", "Timeline")}
              </div>
              <WithdrawalStatusTimeline withdrawal={selectedWithdrawal} isId={isId} />
            </div>

            {selectedWithdrawal.status !== "COMPLETED" && selectedWithdrawal.status !== "REJECTED" && (
              <>
                <div style={{ marginBottom: "16px", padding: "12px", background: "#eff6ff", borderRadius: "8px", border: "1px solid #bfdbfe", color: "#1e40af", fontSize: "13px" }}>
                  {selectedWithdrawal.status === "PENDING"
                    ? t("withdrawals.Pending next actions", "Next allowed actions: set this request to Processing, or Reject it with a note.")
                    : t("withdrawals.Processing next actions", "Next allowed actions: Complete this request with transfer proof, or Reject it with a note.")}
                </div>
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", fontSize: "13px", color: "#374151", marginBottom: "8px", fontWeight: 500 }}>{t("withdrawals.Admin Note Optional", "Admin Note (Optional)")}</label>
                  <textarea
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder={t("withdrawals.Reason for rejection or transfer note...", "Reason for rejection or transfer note...")}
                    style={{ width: "100%", boxSizing: "border-box", padding: "10px", borderRadius: "8px", border: "1px solid #d1d5db", minHeight: "80px", fontFamily: "inherit" }}
                  />
                  <div style={{ color: "#6b7280", fontSize: "12px", marginTop: "6px" }}>{t("withdrawals.Required when rejecting a withdrawal.", "Required when rejecting a withdrawal.")}</div>
                </div>

                <div style={{ marginBottom: "24px", padding: "16px", background: "#f9fafb", borderRadius: "8px", border: "1px dashed #d1d5db" }}>
                  <label style={{ display: "block", fontSize: "13px", color: "#374151", marginBottom: "8px", fontWeight: 500 }}>{t("withdrawals.Transfer Receipt If Completing", "Transfer Receipt (If Completing)")}</label>
                  <input
                    type="file"
                    onChange={(e) => setProofFile(e.target.files[0])}
                    accept="image/*"
                    style={{ fontSize: "13px" }}
                  />
                  <div style={{ color: "#6b7280", fontSize: "12px", marginTop: "8px" }}>{t("withdrawals.Required before marking a withdrawal as completed.", "Required before marking a withdrawal as completed.")}</div>
                </div>

                <div style={{ display: "flex", gap: "12px" }}>
                  <button
                    type="button"
                    disabled={actionLoading || !adminNote.trim()}
                    onClick={() => handleAction("REJECTED")}
                    style={{ flex: 1, padding: "10px", borderRadius: "8px", background: "#fff", border: "1px solid #ef4444", color: "#ef4444", fontWeight: 600, cursor: (actionLoading || !adminNote.trim()) ? "not-allowed" : "pointer", opacity: !adminNote.trim() ? 0.6 : 1 }}
                  >
                    {t("withdrawals.Reject", "Reject")}
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading || selectedWithdrawal.status === "PROCESSING"}
                    onClick={() => handleAction("PROCESSING")}
                    style={{ flex: 1, padding: "10px", borderRadius: "8px", background: "#f59e0b", border: "none", color: "#fff", fontWeight: 600, cursor: (actionLoading || selectedWithdrawal.status === "PROCESSING") ? "not-allowed" : "pointer" }}
                  >
                    {t("withdrawals.Set Processing", "Set Processing")}
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading || selectedWithdrawal.status !== "PROCESSING" || !proofFile}
                    onClick={() => handleAction("COMPLETED")}
                    style={{ flex: 1, padding: "10px", borderRadius: "8px", background: "#10b981", border: "none", color: "#fff", fontWeight: 600, cursor: (actionLoading || selectedWithdrawal.status !== "PROCESSING" || !proofFile) ? "not-allowed" : "pointer", opacity: (selectedWithdrawal.status !== "PROCESSING" || !proofFile) ? 0.6 : 1 }}
                  >
                    {t("withdrawals.Complete", "Complete")}
                  </button>
                </div>
              </>
            )}

            {(selectedWithdrawal.status === "COMPLETED" || selectedWithdrawal.status === "REJECTED") && (
              <div style={{ padding: "16px", background: "#f9fafb", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
                <div style={{ marginBottom: "12px" }}>
                  <div style={{ fontSize: "12px", color: "#6b7280" }}>{t("withdrawals.Processed At", "Processed At")}</div>
                  <div style={{ fontWeight: 500 }}>{formatDate(selectedWithdrawal.processedAt)}</div>
                </div>
                {selectedWithdrawal.adminNote && (
                  <div style={{ marginBottom: "12px" }}>
                    <div style={{ fontSize: "12px", color: "#6b7280" }}>{t("withdrawals.Admin Note", "Admin Note")}</div>
                    <div style={{ fontWeight: 500 }}>{selectedWithdrawal.adminNote}</div>
                  </div>
                )}
                {selectedWithdrawal.proofImageUrl && (
                  <div>
                    <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "8px" }}>{t("withdrawals.Transfer Receipt", "Transfer Receipt")}</div>
                    <img src={resolveAssetUrl(selectedWithdrawal.proofImageUrl)} alt={t("withdrawals.Transfer Receipt", "Transfer Receipt")} style={{ width: "100%", borderRadius: "8px", border: "1px solid #e5e7eb" }} />
                  </div>
                )}
              </div>
            )}
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminWithdrawalsPage;
