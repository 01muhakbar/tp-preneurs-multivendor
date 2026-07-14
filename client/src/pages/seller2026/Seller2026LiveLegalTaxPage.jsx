import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  Clock,
  ShieldCheck,
  ShieldAlert,
  ShieldBan,
  FileText,
  User,
  MapPin,
  Calendar,
  AlertTriangle
} from "lucide-react";
import toast from "react-hot-toast";
import { fetchSellerKycRequest, submitSellerKycRequest } from "../../api/seller2026/kyc.ts";

const translateBusinessType = (type, isId = false) => {
  if (!type) return "-";
  const str = String(type).toLowerCase().trim();
  if (!isId) {
    if (str === "individual") return "Individual";
    if (str === "cv") return "CV (Commanditaire Vennootschap)";
    if (str === "pt") return "PT (Perseroan Terbatas)";
    return type;
  }
  if (str === "individual") return "Perorangan / Pribadi";
  if (str === "cv") return "CV (Commanditaire Vennootschap)";
  if (str === "pt") return "PT (Perseroan Terbatas)";
  return type;
};

export default function Seller2026LiveLegalTaxPage() {
  const { workspaceStoreId, sellerContext, isId = false } = useOutletContext() || {};
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: "",
    dateOfBirth: "",
    identityNumber: "",
    residentialAddress: "",
    businessType: "individual",
    legalEntityName: "",
    taxId: "",
    businessAddress: "",
  });

  const { data: kycReq, isLoading } = useQuery({
    queryKey: ["seller-kyc", workspaceStoreId],
    queryFn: () => fetchSellerKycRequest(workspaceStoreId),
    enabled: !!workspaceStoreId,
  });

  const submitMutation = useMutation({
    mutationFn: (payload) => submitSellerKycRequest(workspaceStoreId, payload),
    onSuccess: () => {
      toast.success(isId ? "Permohonan pembaruan KYC berhasil dikirim" : "KYC update requested successfully");
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["seller-kyc", workspaceStoreId] });
    },
    onError: (error) => {
      toast.error(error?.message || (isId ? "Gagal mengirim permohonan" : "Failed to submit request"));
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    submitMutation.mutate(formData);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const status = kycReq?.status || "none";
  
  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-slate-500">{isId ? "Memuat data Hukum & Pajak..." : "Loading Legal & Tax data..."}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {isId ? "Pengaturan Hukum & Pajak" : "Legal & Tax Settings"}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {isId ? "Kelola informasi identitas hukum dan kepatuhan pajak toko Anda." : "Manage your store's legal identity and tax compliance information."}
          </p>
        </div>
      </div>

      {status === "pending" && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-900/20">
          <div className="flex items-start gap-3">
            <Clock className="mt-0.5 h-5 w-5 text-amber-600 dark:text-amber-500" />
            <div>
              <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-400">
                {isId ? "Verifikasi Sedang Berlangsung" : "Verification in Progress"}
              </h3>
              <p className="mt-1 text-sm text-amber-700 dark:text-amber-500">
                {isId
                  ? "Pembaruan dokumen hukum Anda saat ini sedang ditinjau oleh tim kepatuhan kami. Mohon tunggu hingga 48 jam hingga proses tinjauan selesai."
                  : "Your legal document update is currently being reviewed by our compliance team. Please allow up to 48 hours for the review process to complete."}
              </p>
            </div>
          </div>
        </div>
      )}

      {status === "rejected" && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-900/20">
          <div className="flex items-start gap-3">
            <ShieldBan className="mt-0.5 h-5 w-5 text-red-600 dark:text-red-500" />
            <div>
              <h3 className="text-sm font-semibold text-red-800 dark:text-red-400">
                {isId ? "Verifikasi Ditolak" : "Verification Rejected"}
              </h3>
              <p className="mt-1 text-sm text-red-700 dark:text-red-500">
                {isId ? "Permohonan pembaruan KYC Anda baru-baru ini ditolak. Alasan: " : "Your recent KYC update request was rejected. Reason: "}
                {kycReq?.reviewReason || (isId ? "Dokumen tidak jelas atau tidak valid." : "Documents unclear or invalid.")}
              </p>
              <button 
                onClick={() => setIsEditing(true)}
                className="mt-3 text-sm font-medium text-red-700 hover:text-red-800 dark:text-red-400"
              >
                {isId ? "Ajukan Permohonan Baru" : "Submit New Request"}
              </button>
            </div>
          </div>
        </div>
      )}

      {status === "approved" && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/50 dark:bg-emerald-900/20">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-600 dark:text-emerald-500" />
            <div>
              <h3 className="text-sm font-semibold text-emerald-800 dark:text-emerald-400">
                {isId ? "Terverifikasi Penuh" : "Fully Verified"}
              </h3>
              <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-500">
                {isId
                  ? "Identitas hukum toko Anda telah terverifikasi. Anda dapat mengajukan pembaruan jika detail bisnis Anda berubah."
                  : "Your store's legal identity has been verified. You can request an update if your business details change."}
              </p>
            </div>
          </div>
        </div>
      )}

      {!isEditing ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{isId ? "Identitas Bisnis" : "Business Identity"}</h3>
            {(status === "none" || status === "approved") && (
              <button 
                onClick={() => {
                  if (kycReq?.data) setFormData(kycReq.data);
                  setIsEditing(true);
                }}
                className="rounded-md bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                {isId ? "Ajukan Pembaruan" : "Request Update"}
              </button>
            )}
          </div>
          <div className="p-6">
            {kycReq?.data ? (
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h4 className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                    <User className="h-4 w-4" /> {isId ? "Informasi Pemilik" : "Owner Information"}
                  </h4>
                  <dl className="mt-3 space-y-3 text-sm">
                    <div>
                      <dt className="text-slate-500 dark:text-slate-400">{isId ? "Nama Lengkap" : "Full Name"}</dt>
                      <dd className="font-medium text-slate-900 dark:text-white">{kycReq.data.fullName}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500 dark:text-slate-400">{isId ? "Nomor Identitas (KTP/Paspor)" : "Identity Number (KTP/Passport)"}</dt>
                      <dd className="font-medium text-slate-900 dark:text-white">{kycReq.data.identityNumber}</dd>
                    </div>
                  </dl>
                </div>
                <div>
                  <h4 className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                    <Building2 className="h-4 w-4" /> {isId ? "Detail Bisnis" : "Business Details"}
                  </h4>
                  <dl className="mt-3 space-y-3 text-sm">
                    <div>
                      <dt className="text-slate-500 dark:text-slate-400">{isId ? "Jenis Bisnis" : "Business Type"}</dt>
                      <dd className="font-medium text-slate-900 dark:text-white capitalize">{translateBusinessType(kycReq.data.businessType, isId)}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500 dark:text-slate-400">{isId ? "Nomor NPWP" : "Tax ID (NPWP)"}</dt>
                      <dd className="font-medium text-slate-900 dark:text-white">{kycReq.data.taxId}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <ShieldAlert className="mx-auto h-12 w-12 text-slate-400" />
                <h3 className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{isId ? "Belum Ada Data Hukum" : "No Legal Data"}</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {isId ? "Anda belum mengajukan dokumen hukum untuk diverifikasi." : "You haven't submitted your legal documents for verification yet."}
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{isId ? "Perbarui Informasi Hukum" : "Update Legal Information"}</h3>
            <p className="mt-1 text-sm text-slate-500">
              {isId
                ? "Ajukan informasi hukum terbaru Anda. Pembaruan ini memerlukan verifikasi admin sebelum aktif."
                : "Submit your updated legal information. This will require admin verification before it becomes active."}
            </p>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <h4 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 pb-2 dark:border-slate-800">
                  <User className="h-4 w-4 text-emerald-500" /> {isId ? "Detail Pemilik" : "Owner Details"}
                </h4>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    {isId ? "Nama Lengkap (sesuai KTP/Paspor)" : "Full Name (as per ID)"}
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    {isId ? "Nomor Identitas (KTP/Paspor)" : "Identity Number (KTP/Passport)"}
                  </label>
                  <input
                    type="text"
                    name="identityNumber"
                    required
                    value={formData.identityNumber}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    {isId ? "Alamat Tempat Tinggal" : "Residential Address"}
                  </label>
                  <textarea
                    name="residentialAddress"
                    rows={2}
                    required
                    value={formData.residentialAddress}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 pb-2 dark:border-slate-800">
                  <Building2 className="h-4 w-4 text-emerald-500" /> {isId ? "Detail Bisnis" : "Business Details"}
                </h4>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    {isId ? "Jenis Bisnis" : "Business Type"}
                  </label>
                  <select
                    name="businessType"
                    value={formData.businessType}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="individual">{isId ? "Perorangan / Pribadi" : "Individual / Personal"}</option>
                    <option value="cv">CV (Commanditaire Vennootschap)</option>
                    <option value="pt">PT (Perseroan Terbatas)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    {isId ? "Nama Badan Hukum (jika ada)" : "Legal Entity Name (if applicable)"}
                  </label>
                  <input
                    type="text"
                    name="legalEntityName"
                    value={formData.legalEntityName}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    {isId ? "Nomor NPWP" : "Tax ID (NPWP)"}
                  </label>
                  <input
                    type="text"
                    name="taxId"
                    required
                    value={formData.taxId}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>
            </div>
            
            <div className="rounded-md bg-blue-50 p-4 dark:bg-blue-900/20">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-blue-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">{isId ? "Unggah Dokumen Diperlukan" : "Document Upload Required"}</h3>
                  <div className="mt-2 text-sm text-blue-700 dark:text-blue-400">
                    <p>{isId ? "Dalam implementasi penuh, Anda diwajibkan untuk mengunggah foto fisik KTP dan izin usaha di sini." : "In a full implementation, you would be required to upload photos of your physical ID cards and business licenses here."}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 flex justify-end gap-3 dark:border-slate-800 dark:bg-slate-900/50">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              {isId ? "Batal" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={submitMutation.isPending}
              className="inline-flex justify-center rounded-md border border-transparent bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {submitMutation.isPending ? (isId ? "Mengirim..." : "Submitting...") : (isId ? "Ajukan Verifikasi" : "Submit for Verification")}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
