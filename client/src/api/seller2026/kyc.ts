const STORAGE_KEY = "mock_kyc_requests";

type KycDecision = "approved" | "rejected";
type KycPayload = Record<string, unknown>;
type KycRequest = {
  id: string;
  storeId: number | string;
  status: "pending" | KycDecision;
  data: KycPayload;
  submittedAt: string;
  reviewReason?: string;
  reviewedAt?: string;
};

const getKycRequests = (): KycRequest[] => {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? (JSON.parse(data) as KycRequest[]) : [];
  } catch {
    return [];
  }
};

const saveKycRequests = (requests: KycRequest[]) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
  }
};

// Simulate network delay
const delay = (ms = 500) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function fetchSellerKycRequest(storeId: number | string) {
  await delay();
  const reqs = getKycRequests();
  const req = reqs.find(r => r.storeId === storeId);
  if (!req) {
    // Return empty state
    return {
      status: "none",
      data: null
    };
  }
  return req;
}

export async function submitSellerKycRequest(storeId: number | string, payload: KycPayload) {
  await delay();
  const reqs = getKycRequests();
  const existingIndex = reqs.findIndex(r => r.storeId === storeId);
  const newRequest: KycRequest = {
    id: `kyc-${Date.now()}`,
    storeId,
    status: "pending",
    data: payload,
    submittedAt: new Date().toISOString()
  };
  
  if (existingIndex >= 0) {
    reqs[existingIndex] = newRequest;
  } else {
    reqs.push(newRequest);
  }
  saveKycRequests(reqs);
  return newRequest;
}

export async function fetchAdminKycRequests() {
  await delay();
  const reqs = getKycRequests();
  return {
    items: [...reqs].reverse(),
    meta: {
      total: reqs.length,
      page: 1,
      limit: 50,
      totalPages: 1
    }
  };
}

export async function reviewAdminKycRequest(
  requestId: string,
  decision: KycDecision,
  reason = ""
) {
  await delay();
  const reqs = getKycRequests();
  const reqIndex = reqs.findIndex(r => r.id === requestId);
  if (reqIndex === -1) throw new Error("Request not found");
  
  reqs[reqIndex].status = decision; // 'approved' or 'rejected'
  reqs[reqIndex].reviewReason = reason;
  reqs[reqIndex].reviewedAt = new Date().toISOString();
  
  saveKycRequests(reqs);
  return reqs[reqIndex];
}
