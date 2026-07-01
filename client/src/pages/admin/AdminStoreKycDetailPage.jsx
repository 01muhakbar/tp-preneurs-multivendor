import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Building2, 
  User,
  ShieldCheck,
  AlertTriangle
} from "lucide-react";
import toast from "react-hot-toast";
import { fetchAdminKycRequests, reviewAdminKycRequest } from "../../api/seller2026/kyc.ts";

export default function AdminStoreKycDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-kyc-requests"],
    queryFn: fetchAdminKycRequests,
  });

  const request = data?.items?.find(r => r.id === id);

  const reviewMutation = useMutation({
    mutationFn: ({ decision, reason }) => reviewAdminKycRequest(id, decision, reason),
    onSuccess: () => {
      toast.success("Review submitted successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-kyc-requests"] });
      setShowRejectModal(false);
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to submit review");
    }
  });

  const handleApprove = () => {
    if (confirm("Are you sure you want to approve this KYC update? This will overwrite the store's legal profile.")) {
      reviewMutation.mutate({ decision: "approved", reason: "" });
    }
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }
    reviewMutation.mutate({ decision: "rejected", reason: rejectReason });
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-slate-500">Loading request details...</div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <AlertTriangle className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-2 text-sm font-semibold text-slate-900">Request Not Found</h3>
          <p className="mt-1 text-sm text-slate-500">The KYC request you are looking for does not exist.</p>
          <Link to="/admin/online-store/kyc-audit" className="mt-4 inline-flex text-emerald-600 hover:text-emerald-700 font-medium text-sm">
            &larr; Back to List
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link 
          to="/admin/online-store/kyc-audit" 
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
        >
          <ArrowLeft className="h-4 w-4" /> Back to KYC Audit List
        </Link>
      </div>

      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            Review Request: {request.id}
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Store ID: {request.storeId} • Submitted on {new Date(request.submittedAt).toLocaleString()}
          </p>
        </div>
        <div>
          {request.status === "pending" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
              <Clock className="h-4 w-4" /> Pending Review
            </span>
          )}
          {request.status === "approved" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" /> Approved
            </span>
          )}
          {request.status === "rejected" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400">
              <XCircle className="h-4 w-4" /> Rejected
            </span>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/50">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-500" /> Submitted Identity Data
          </h3>
        </div>
        
        <div className="p-6">
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <h4 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 border-b pb-2">
                <User className="h-4 w-4" /> Owner Information
              </h4>
              <dl className="space-y-4 text-sm">
                <div>
                  <dt className="text-slate-500 dark:text-slate-400">Full Name</dt>
                  <dd className="mt-1 font-medium text-slate-900 dark:text-white text-base">{request.data?.fullName}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 dark:text-slate-400">Identity Number (KTP/Passport)</dt>
                  <dd className="mt-1 font-medium text-slate-900 dark:text-white font-mono">{request.data?.identityNumber}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 dark:text-slate-400">Residential Address</dt>
                  <dd className="mt-1 font-medium text-slate-900 dark:text-white whitespace-pre-wrap">{request.data?.residentialAddress}</dd>
                </div>
              </dl>
            </div>
            
            <div>
              <h4 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 border-b pb-2">
                <Building2 className="h-4 w-4" /> Business Details
              </h4>
              <dl className="space-y-4 text-sm">
                <div>
                  <dt className="text-slate-500 dark:text-slate-400">Business Type</dt>
                  <dd className="mt-1 font-medium text-slate-900 dark:text-white capitalize">{request.data?.businessType}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 dark:text-slate-400">Legal Entity Name</dt>
                  <dd className="mt-1 font-medium text-slate-900 dark:text-white">{request.data?.legalEntityName || "-"}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 dark:text-slate-400">Tax ID (NPWP)</dt>
                  <dd className="mt-1 font-medium text-slate-900 dark:text-white font-mono">{request.data?.taxId}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {request.status === "pending" && (
          <div className="border-t border-slate-200 bg-slate-50 px-6 py-5 flex items-center justify-end gap-3 dark:border-slate-800 dark:bg-slate-900/50">
            {showRejectModal ? (
              <div className="flex-1 flex gap-3">
                <input 
                  type="text" 
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Reason for rejection (required)..." 
                  className="flex-1 rounded-md border-slate-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={reviewMutation.isPending || !rejectReason.trim()}
                  className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
                >
                  {reviewMutation.isPending ? "Submitting..." : "Confirm Reject"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="inline-flex justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setShowRejectModal(true)}
                  className="inline-flex justify-center rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 shadow-sm hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  Reject Update
                </button>
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={reviewMutation.isPending}
                  className="inline-flex justify-center rounded-md border border-transparent bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {reviewMutation.isPending ? "Approving..." : "Approve & Verify"}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
