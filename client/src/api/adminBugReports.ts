import { http, post, patch } from "../lib/http.js";

export interface BugReportItem {
  id: number;
  ticketNumber: string;
  pageUrl: string;
  errorName: string;
  errorMessage: string;
  errorStack?: string | null;
  userAgent?: string | null;
  reporterEmail: string;
  reporterUserId?: number | null;
  userNote?: string | null;
  status: "NEW" | "INVESTIGATING" | "FIXED" | "CLOSED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  resolutionNote?: string | null;
  resolvedAt?: string | null;
  resolvedBy?: number | null;
  createdAt: string;
  updatedAt: string;
  reporter?: {
    id: number;
    name: string;
    email: string;
    role: string;
  } | null;
  resolver?: {
    id: number;
    name: string;
    email: string;
    role: string;
  } | null;
}

export interface BugReportsResponse {
  success: boolean;
  data: {
    items: BugReportItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    summary: {
      total: number;
      new: number;
      investigating: number;
      fixed: number;
      closed: number;
    };
  };
}

export async function fetchAdminBugReports(params: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
} = {}): Promise<BugReportsResponse["data"]> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.status && params.status !== "ALL") query.set("status", params.status);
  if (params.search) query.set("search", params.search);

  const res = await http<BugReportsResponse>(`/admin/bug-reports?${query.toString()}`);
  return res.data;
}

export async function fetchAdminBugReportDetail(id: number | string): Promise<BugReportItem> {
  const res = await http<{ success: boolean; data: BugReportItem }>(`/admin/bug-reports/${id}`);
  return res.data;
}

export async function updateAdminBugReportStatus(
  id: number | string,
  payload: { status?: string; priority?: string; resolutionNote?: string }
): Promise<BugReportItem> {
  const res = await patch<{ success: boolean; data: BugReportItem }>(
    `/admin/bug-reports/${id}/status`,
    payload
  );
  return res.data;
}

export async function resolveAdminBugReport(
  id: number | string,
  payload: { resolutionNote: string; sendEmailNotification?: boolean }
): Promise<{ report: BugReportItem; emailSent: boolean }> {
  const res = await post<{ success: boolean; data: { report: BugReportItem; emailSent: boolean } }>(
    `/admin/bug-reports/${id}/resolve`,
    payload
  );
  return res.data;
}
