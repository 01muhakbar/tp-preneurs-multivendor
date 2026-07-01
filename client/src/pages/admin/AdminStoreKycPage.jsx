import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ShieldCheck, Clock, FileText, CheckCircle2, XCircle } from "lucide-react";
import { fetchAdminKycRequests } from "../../api/seller2026/kyc.ts";

const StatusBadge = ({ status }) => {
  switch (status) {
    case "pending":
      return <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"><Clock className="h-3 w-3" /> Pending</span>;
    case "approved":
      return <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"><CheckCircle2 className="h-3 w-3" /> Approved</span>;
    case "rejected":
      return <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400"><XCircle className="h-3 w-3" /> Rejected</span>;
    default:
      return <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800 dark:bg-slate-800 dark:text-slate-300">{status}</span>;
  }
};

export default function AdminStoreKycPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-kyc-requests"],
    queryFn: fetchAdminKycRequests,
  });

  const items = data?.items || [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-emerald-500" /> KYC / Legal Audit
          </h1>
          <p className="mt-2 text-sm text-slate-700 dark:text-slate-400">
            Review and verify store legal entity and identity document updates.
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Request ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Store ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Owner Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Submitted
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-900">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-sm text-slate-500">
                    Loading requests...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-sm text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <FileText className="h-10 w-10 text-slate-300 mb-3" />
                      No KYC update requests found.
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">
                      {req.id}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                      {req.storeId}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-900 dark:text-slate-300">
                      {req.data?.fullName}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                      {new Date(req.submittedAt).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <Link
                        to={`/admin/online-store/kyc-audit/${req.id}`}
                        className="text-emerald-600 hover:text-emerald-900 dark:text-emerald-500 dark:hover:text-emerald-400"
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
