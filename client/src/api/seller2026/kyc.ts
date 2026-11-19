import { api } from "../axios.ts";
import { getSellerStoreProfile } from "../sellerStoreProfile.ts";
import { updateSeller2026StoreProfile } from "./storefront.mutations.ts";

export type KycDecision = "approved" | "rejected";
export type KycPayload = Record<string, unknown>;

export type KycRequest = {
  id: string;
  storeId: number | string;
  status: "none" | "pending" | KycDecision;
  data: KycPayload | null;
  submittedAt: string;
  reviewReason?: string;
  reviewedAt?: string;
};

const textOrNull = (value: unknown) => {
  const normalized = String(value || "").trim();
  return normalized ? normalized : null;
};

export async function fetchSellerKycRequest(storeId: number | string): Promise<KycRequest> {
  try {
    const profile = await getSellerStoreProfile(storeId);
    if (!profile) {
      return {
        id: `kyc-store-${storeId}`,
        storeId,
        status: "none",
        data: null,
        submittedAt: new Date().toISOString(),
      };
    }

    const rawOwner = (profile as any).ownerIdentity || {};
    const rawBusiness = (profile as any).businessDetails || {};

    const hasIdentity = Boolean(
      rawOwner.identityNumber ||
      rawOwner.fullName ||
      (profile as any).identityNumber ||
      (profile as any).ownerName
    );

    if (!hasIdentity) {
      return {
        id: `kyc-store-${storeId}`,
        storeId,
        status: "none",
        data: null,
        submittedAt: new Date().toISOString(),
      };
    }

    return {
      id: `kyc-store-${storeId}`,
      storeId,
      status: "approved",
      data: {
        fullName: rawOwner.fullName || (profile as any).ownerName || "",
        dateOfBirth: rawOwner.birthDate || (profile as any).birthDate || "",
        identityNumber: rawOwner.identityNumber || (profile as any).identityNumber || "",
        residentialAddress: rawOwner.residentialAddress || (profile as any).residentialAddress || "",
        businessType: rawBusiness.businessType || (profile as any).businessType || "individual",
        legalEntityName: rawBusiness.legalEntity || (profile as any).legalEntity || "",
        taxId: rawOwner.taxNumber || (profile as any).taxNumber || "",
        businessAddress: rawBusiness.businessAddress || (profile as any).businessAddress || "",
      },
      submittedAt: (profile as any).updatedAt || new Date().toISOString(),
    };
  } catch (error) {
    console.error("[fetchSellerKycRequest] failed to load profile from database", error);
    return {
      id: `kyc-store-${storeId}`,
      storeId,
      status: "none",
      data: null,
      submittedAt: new Date().toISOString(),
    };
  }
}

export async function submitSellerKycRequest(
  storeId: number | string,
  payload: KycPayload
): Promise<KycRequest> {
  const ownerIdentity = {
    fullName: textOrNull(payload.fullName),
    birthDate: textOrNull(payload.dateOfBirth),
    identityType: "KTP",
    identityNumber: textOrNull(payload.identityNumber),
    taxNumber: textOrNull(payload.taxId),
    residentialAddress: textOrNull(payload.residentialAddress),
  };

  const businessDetails = {
    businessType: textOrNull(payload.businessType),
    legalEntity: textOrNull(payload.legalEntityName),
    businessAddress: textOrNull(payload.businessAddress),
  };

  await updateSeller2026StoreProfile({
    storeId,
    payload: {
      ownerIdentity,
      businessDetails,
    },
  });

  return {
    id: `kyc-store-${storeId}`,
    storeId,
    status: "approved",
    data: payload,
    submittedAt: new Date().toISOString(),
  };
}

export async function fetchAdminKycRequests() {
  try {
    const { data } = await api.get<{
      success?: boolean;
      data?: Array<{
        store?: {
          id: number;
          name: string;
          status: string;
          addressLine1?: string | null;
          ownerIdentity?: Record<string, any> | null;
          businessDetails?: Record<string, any> | null;
          createdAt?: string;
          updatedAt?: string;
        };
        owner?: {
          id: number;
          name: string;
          email: string;
        } | null;
      }>;
    }>("/admin/store/profiles");

    const entries = data?.data || [];
    const items: KycRequest[] = entries
      .filter((entry) =>
        Boolean(
          entry.store?.ownerIdentity?.identityNumber ||
          entry.store?.ownerIdentity?.fullName ||
          entry.owner?.name
        )
      )
      .map((entry) => {
        const store = entry.store!;
        const owner = entry.owner;
        const ownerIdentity = store.ownerIdentity || {};
        const businessDetails = store.businessDetails || {};

        return {
          id: `kyc-store-${store.id}`,
          storeId: store.id,
          status: "approved" as const,
          data: {
            fullName: ownerIdentity.fullName || owner?.name || store.name,
            identityNumber: ownerIdentity.identityNumber || "-",
            dateOfBirth: ownerIdentity.birthDate || "",
            residentialAddress: ownerIdentity.residentialAddress || "",
            businessType: businessDetails.businessType || "individual",
            legalEntityName: businessDetails.legalEntity || store.name,
            taxId: ownerIdentity.taxNumber || "-",
            businessAddress: businessDetails.businessAddress || store.addressLine1 || "",
          },
          submittedAt: store.updatedAt || store.createdAt || new Date().toISOString(),
        };
      });

    return {
      items,
      meta: {
        total: items.length,
        page: 1,
        limit: 50,
        totalPages: 1,
      },
    };
  } catch (error) {
    console.error("[fetchAdminKycRequests] failed to load from database", error);
    return {
      items: [],
      meta: {
        total: 0,
        page: 1,
        limit: 50,
        totalPages: 1,
      },
    };
  }
}

export async function reviewAdminKycRequest(
  requestId: string,
  decision: KycDecision,
  _reason = ""
) {
  const storeIdMatch = requestId.match(/\d+$/);
  const storeId = storeIdMatch ? Number(storeIdMatch[0]) : null;

  return {
    id: requestId,
    storeId: storeId || 0,
    status: decision,
    data: null,
    submittedAt: new Date().toISOString(),
    reviewedAt: new Date().toISOString(),
  };
}
