import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileCheck2,
  FileText,
  Headphones,
  ImagePlus,
  Loader2,
  LockKeyhole,
  LogOut,
  MapPin,
  Moon,
  QrCode,
  Save,
  Send,
  ShieldCheck,
  Store,
  Sun,
  UploadCloud,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";
import { api } from "../../api/axios.ts";
import {
  PAYMENT_PROFILE_LIMITS,
  PAYMENT_PROFILE_PAYMENT_TYPE,
  PAYMENT_PROFILE_PROVIDER_CODE,
  validatePaymentProfileDraft,
} from "../../api/paymentProfile.contract.ts";
import {
  cancelUserStoreApplication,
  createUserStoreApplicationDraft,
  getCurrentUserStoreApplication,
  resubmitUserStoreApplication,
  submitUserStoreApplication,
  updateUserStoreApplicationDraft,
} from "../../api/userStoreApplications.ts";
import { listSellerWorkspaceStores } from "../../api/sellerWorkspace.ts";
import { useTheme } from "../../theme/ThemeProvider.jsx";
import {
  getCityOptions,
  getDistrictOptions,
  getProvinceOptions,
} from "../../utils/idRegions.ts";
import useStoreBranding from "../../hooks/useStoreBranding.js";
import { getWorkspaceLogoUrl, hasCustomBrandingLogo } from "../../lib/branding.js";
import "./seller-store-application-2026.css";

const APPLICATION_QUERY_KEY = ["seller-store-application", "current"];
const LOGIN_PATH = "/auth/login?next=/seller/store-application?from=seller-verify-email";
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_FILE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

const STEPS = [
  { key: "identity", title: "Store Identity", icon: Store },
  { key: "owner", title: "Owner Information", icon: UserRound },
  { key: "business", title: "Business Details", icon: Building2 },
  { key: "payout", title: "Payment Profile", icon: WalletCards },
  { key: "documents", title: "Documents & Review", icon: FileCheck2 },
];

const SERVER_STEPS = [
  "store_information",
  "owner_identity",
  "operational_address",
  "payout_payment",
  "compliance",
];

const DOCUMENTS = [
  { key: "idCard", label: "ID Card (KTP / Passport)", required: true },
  { key: "businessLicense", label: "Business License (NIB / SIUP)", required: true },
  { key: "taxDocument", label: "Tax Document (NPWP)", required: true },
  { key: "storePhoto", label: "Store Photo", required: false },
];

const META_KEYS = [
  "residentialAddress",
  "ownerCountry",
  "ownerProvince",
  "ownerCity",
  "ownerSubdistrict",
  "ownerPostalCode",
  "legalEntity",
  "email",
  "phone",
  "whatsapp",
  "addressLine1",
  "addressLine2",
  "province",
  "city",
  "district",
  "postalCode",
  "country",
  "paymentAccountName",
  "paymentMerchantName",
  "paymentMerchantId",
  "paymentBankName",
  "paymentAccountNumber",
  "paymentAccountHolderName",
  "paymentQrisImage",
  "paymentQrisPayload",
  "paymentInstructionText",
  "paymentSellerNote",
  "documents",
  "confirmAccuracy",
];

const INITIAL_FORM = {
  storeName: "",
  storeSlug: "",
  category: "",
  ownerName: "",
  ownerEmail: "",
  ownerPhone: "",
  birthDate: "",
  identityType: "KTP",
  identityNumber: "",
  taxNumber: "",
  residentialAddress: "",
  ownerCountry: "Indonesia",
  ownerProvince: "",
  ownerCity: "",
  ownerSubdistrict: "",
  ownerPostalCode: "",
  businessType: "Individual / Sole Proprietor",
  legalEntity: "Sole Proprietorship",
  businessCountry: "Indonesia",
  businessProvince: "",
  businessCity: "",
  businessPostalCode: "",
  businessAddress: "",
  email: "",
  phone: "",
  whatsapp: "",
  addressLine1: "",
  addressLine2: "",
  province: "",
  city: "",
  district: "",
  postalCode: "",
  country: "Indonesia",
  paymentAccountName: "",
  paymentMerchantName: "",
  paymentMerchantId: "",
  paymentBankName: "",
  paymentAccountNumber: "",
  paymentAccountHolderName: "",
  paymentQrisImage: null,
  paymentQrisPayload: "",
  paymentInstructionText: "",
  paymentSellerNote: "",
  documents: {},
  confirmAccuracy: false,
};

const text = (value) => String(value ?? "").trim();
const errorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

function applicationToForm(application) {
  if (!application) return INITIAL_FORM;
  const owner = application.ownerIdentitySnapshot || {};
  const store = application.storeInformationSnapshot || {};
  const address = application.operationalAddressSnapshot || {};
  const payout = application.payoutPaymentSnapshot || {};
  const compliance = application.complianceSnapshot || {};
  const metadata = application.internalMetadata?.sellerOnboarding2026 || {};

  return {
    ...INITIAL_FORM,
    storeName: store.storeName || "",
    storeSlug: store.storeSlug || "",
    category: store.storeCategory || "",
    ownerName: owner.fullName || "",
    ownerEmail: owner.email || application.applicant?.email || "",
    ownerPhone: owner.phoneNumber || "",
    birthDate: owner.birthDate || "",
    identityType: owner.identityType || "KTP",
    identityNumber: compliance.identityNumber || "",
    taxNumber: compliance.taxId || "",
    businessType: store.sellerType || INITIAL_FORM.businessType,
    businessCountry: address.country || "Indonesia",
    businessProvince: address.province || "",
    businessCity: address.city || "",
    businessPostalCode: address.postalCode || "",
    businessAddress: address.addressLine1 || "",
    email: metadata.email || "",
    phone: metadata.phone || "",
    whatsapp: metadata.whatsapp || "",
    addressLine1: metadata.addressLine1 || "",
    addressLine2: metadata.addressLine2 || "",
    province: metadata.province || "",
    city: metadata.city || "",
    district: metadata.district || "",
    postalCode: metadata.postalCode || "",
    country: metadata.country || "Indonesia",
    paymentAccountName: payout.accountName || metadata.paymentAccountName || "",
    paymentMerchantName: payout.merchantName || metadata.paymentMerchantName || "",
    paymentMerchantId: payout.merchantId || metadata.paymentMerchantId || "",
    paymentBankName: payout.bankName || metadata.paymentBankName || "",
    paymentAccountNumber: payout.accountNumber || metadata.paymentAccountNumber || "",
    paymentAccountHolderName:
      payout.accountHolderName ||
      metadata.paymentAccountHolderName ||
      payout.accountName ||
      metadata.paymentAccountName ||
      "",
    paymentQrisImage:
      metadata.paymentQrisImage ||
      (payout.qrisImageUrl
        ? {
            url: payout.qrisImageUrl,
            fileName: "Existing QRIS image",
            size: 0,
            mimeType: "image/png",
            uploadedAt: application.updatedAt || null,
          }
        : null),
    paymentQrisPayload: payout.qrisPayload || metadata.paymentQrisPayload || "",
    paymentInstructionText: payout.instructionText || metadata.paymentInstructionText || "",
    paymentSellerNote: payout.sellerNote || metadata.paymentSellerNote || "",
    documents:
      metadata.documents && typeof metadata.documents === "object"
        ? metadata.documents
        : {},
  };
}

function metadataFromForm(form) {
  return META_KEYS.reduce((snapshot, key) => {
    snapshot[key] = form[key];
    return snapshot;
  }, {});
}

function formToPayload(form, visualStep) {
  return {
    currentStep: SERVER_STEPS[visualStep] || "store_information",
    ownerIdentitySnapshot: {
      fullName: text(form.ownerName) || null,
      operationalContactName: text(form.ownerName) || null,
      email: text(form.ownerEmail) || null,
      phoneNumber: text(form.ownerPhone) || null,
      birthDate: text(form.birthDate) || null,
      identityType: text(form.identityType) || null,
      identityLegalName: text(form.ownerName) || null,
    },
    storeInformationSnapshot: {
      storeName: text(form.storeName) || null,
      storeSlug: text(form.storeSlug) || null,
      storeCategory: text(form.category) || null,
      description: null,
      sellerType: text(form.businessType) || null,
      isSelfProduced: form.businessType === "Individual / Sole Proprietor",
      initialProductCount: null,
    },
    operationalAddressSnapshot: {
      contactName: text(form.ownerName) || null,
      phoneNumber: text(form.ownerPhone) || null,
      addressLine1: text(form.businessAddress) || null,
      addressLine2: null,
      city: text(form.businessCity) || null,
      province: text(form.businessProvince) || null,
      district: null,
      postalCode: text(form.businessPostalCode) || null,
      country: text(form.businessCountry) || null,
      notes: text(form.legalEntity) || null,
    },
    payoutPaymentSnapshot: {
      providerCode: PAYMENT_PROFILE_PROVIDER_CODE,
      paymentType: PAYMENT_PROFILE_PAYMENT_TYPE,
      accountName: text(form.paymentAccountName) || null,
      merchantName: text(form.paymentMerchantName) || null,
      merchantId: text(form.paymentMerchantId) || null,
      bankName: text(form.paymentBankName) || null,
      accountNumber: text(form.paymentAccountNumber) || null,
      accountHolderName: text(form.paymentAccountHolderName) || text(form.paymentAccountName) || null,
      qrisImageUrl: text(form.paymentQrisImage?.url) || null,
      qrisPayload: text(form.paymentQrisPayload) || null,
      instructionText: text(form.paymentInstructionText) || null,
      sellerNote: text(form.paymentSellerNote) || null,
      payoutMethod: PAYMENT_PROFILE_PAYMENT_TYPE,
      accountHolderMatchesIdentity:
        text(form.paymentAccountHolderName || form.paymentAccountName).toLowerCase() ===
        text(form.ownerName).toLowerCase(),
    },
    complianceSnapshot: {
      supportEmail: text(form.ownerEmail) || null,
      supportPhone: text(form.ownerPhone) || null,
      taxId: text(form.taxNumber) || null,
      identityNumber: text(form.identityNumber) || null,
      productTypes: text(form.category) || null,
      brandOwnershipType: text(form.legalEntity) || null,
      authenticityConfirmed: Boolean(form.confirmAccuracy),
      prohibitedGoodsConfirmed: Boolean(form.confirmAccuracy),
      websiteUrl: null,
      socialMediaUrl: null,
      notes: null,
      agreedToTerms: Boolean(form.confirmAccuracy),
      agreedToAdminReview: Boolean(form.confirmAccuracy),
      agreedToPlatformPolicy: Boolean(form.confirmAccuracy),
      understandsStoreInactiveUntilApproved: Boolean(form.confirmAccuracy),
    },
    sellerOnboardingSnapshot: metadataFromForm(form),
  };
}

function paymentProfileDraftFromForm(form) {
  return {
    accountName: text(form.paymentAccountName),
    merchantName: text(form.paymentMerchantName),
    merchantId: text(form.paymentMerchantId),
    bankName: text(form.paymentBankName),
    accountNumber: text(form.paymentAccountNumber),
    accountHolderName: text(form.paymentAccountHolderName),
    qrisImageUrl: text(form.paymentQrisImage?.url),
    qrisPayload: text(form.paymentQrisPayload),
    instructionText: text(form.paymentInstructionText),
    sellerNote: text(form.paymentSellerNote),
  };
}

function validateStep(form, step) {
  const errors = {};
  const required = (key, label) => {
    if (!text(form[key])) errors[key] = `${label} is required.`;
  };

  if (step === 0) {
    required("storeName", "Store name");
    required("storeSlug", "Store slug");
    required("category", "Business category");
    required("email", "Store Email");
    required("phone", "Store Phone");
    required("addressLine1", "Address Line 1");
    required("province", "Province");
    required("city", "City / Regency");
    required("district", "Subdistrict");
    required("postalCode", "Postal Code");
    if (text(form.storeSlug) && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(text(form.storeSlug))) {
      errors.storeSlug = "Use lowercase letters, numbers, and single hyphens only.";
    }
  }
  if (step === 1) {
    [
      ["ownerName", "Full name"],
      ["ownerEmail", "Email address"],
      ["ownerPhone", "Phone number"],
      ["birthDate", "Date of birth"],
      ["identityType", "Identity type"],
      ["identityNumber", "Identity number"],
      ["residentialAddress", "Residential address"],
      ["ownerCountry", "Country"],
      ["ownerProvince", "Province"],
      ["ownerCity", "City"],
      ["ownerSubdistrict", "Subdistrict"],
      ["ownerPostalCode", "Postal code"],
    ].forEach(([key, label]) => required(key, label));
    if (text(form.ownerEmail) && !/^\S+@\S+\.\S+$/.test(text(form.ownerEmail))) {
      errors.ownerEmail = "Enter a valid email address.";
    }
    if (text(form.ownerPhone) && !/^(?:\+62|08)[0-9]{8,14}$/.test(text(form.ownerPhone))) {
      errors.ownerPhone = "Enter a valid Indonesian phone number starting with +62 or 08.";
    }
    if (form.birthDate) {
      const age = (Date.now() - new Date(form.birthDate).getTime()) / 31557600000;
      if (!Number.isFinite(age) || age < 18) errors.birthDate = "You must be at least 18 years old.";
    }
  }
  if (step === 2) {
    [
      ["businessType", "Business type"],
      ["legalEntity", "Legal entity"],
      ["businessCountry", "Country / region"],
      ["businessProvince", "Province / state"],
      ["businessCity", "City"],
      ["businessPostalCode", "Postal code"],
      ["businessAddress", "Business address"],
    ].forEach(([key, label]) => required(key, label));
  }
  if (step === 3) {
    const paymentErrors = validatePaymentProfileDraft(paymentProfileDraftFromForm(form));
    if (paymentErrors.accountName) errors.paymentAccountName = paymentErrors.accountName;
    if (paymentErrors.merchantName) errors.paymentMerchantName = paymentErrors.merchantName;
    if (paymentErrors.merchantId) errors.paymentMerchantId = paymentErrors.merchantId;
    if (paymentErrors.bankName) errors.paymentBankName = paymentErrors.bankName;
    if (paymentErrors.accountNumber) errors.paymentAccountNumber = paymentErrors.accountNumber;
    if (paymentErrors.accountHolderName) {
      errors.paymentAccountHolderName = paymentErrors.accountHolderName;
    }
    if (paymentErrors.qrisImageUrl) errors.paymentQrisImage = paymentErrors.qrisImageUrl;
    if (paymentErrors.qrisPayload) errors.paymentQrisPayload = paymentErrors.qrisPayload;
    if (paymentErrors.instructionText) errors.paymentInstructionText = paymentErrors.instructionText;
    if (paymentErrors.sellerNote) errors.paymentSellerNote = paymentErrors.sellerNote;
  }
  if (step === 4) {
    DOCUMENTS.filter((document) => document.required).forEach((document) => {
      if (!form.documents?.[document.key]) {
        errors[`documents.${document.key}`] = `${document.label} is required.`;
      }
    });
    if (!form.confirmAccuracy) {
      errors.confirmAccuracy = "Confirm that the application is accurate before submitting.";
    }
  }
  return errors;
}

function validateAll(form) {
  return STEPS.reduce(
    (all, _step, index) => ({ ...all, ...validateStep(form, index) }),
    {}
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  error,
  required,
  as = "input",
  options = [],
  hint,
  placeholder = "Select an option",
  disabled,
  className = "",
  ...props
}) {
  const id = `ssa-${name}`;
  const controlProps = {
    id,
    name,
    value: value ?? "",
    disabled,
    onChange: (event) => onChange(name, event.target.value),
    "aria-invalid": Boolean(error),
    "aria-describedby": error ? `${id}-error` : hint ? `${id}-hint` : undefined,
    ...props,
  };
  return (
    <div className={`ssa-field ${className} ${error ? "ssa-field--error" : ""}`}>
      <label htmlFor={id}>
        {label} {required && <span aria-hidden="true">*</span>}
      </label>
      <div className="ssa-control-wrap">
        {as === "select" ? (
          <>
            <select {...controlProps}>
              <option value="">{placeholder}</option>
              {options.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <ChevronDown size={16} aria-hidden="true" />
          </>
        ) : as === "indonesian-phone" ? (
          <div style={{ display: "flex", alignItems: "center", position: "relative", width: "100%" }}>
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, display: "flex", alignItems: "center", gap: 6, padding: "0 12px", background: "color-mix(in srgb, var(--tp-border) 25%, transparent)", borderRight: "1px solid var(--tp-border)", borderTopLeftRadius: 7, borderBottomLeftRadius: 7, pointerEvents: "none" }}>
              <svg viewBox="0 0 3 2" style={{ display: "block", width: 16, height: 11, borderRadius: 1.5, overflow: "hidden", border: "1px solid rgba(128,128,128,0.2)" }}>
                <rect width="3" height="1" fill="#ed2939" />
                <rect y="1" width="3" height="1" fill="#ffffff" />
              </svg>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--tp-text)" }}>+62</span>
            </div>
            <input {...controlProps} style={{ paddingLeft: 70, width: "100%" }} />
          </div>
        ) : as === "textarea" ? (
          <textarea {...controlProps} />
        ) : (
          <input {...controlProps} />
        )}
      </div>
      {error ? <span id={`${id}-error`} className="ssa-field-error" role="alert">{error}</span> : null}
      {!error && hint ? <span id={`${id}-hint`} className="ssa-field-hint">{hint}</span> : null}
    </div>
  );
}

function UploadBox({
  label,
  value,
  error,
  onUpload,
  uploading,
  optional,
  wide,
  disabled,
  imageOnly,
  accept,
  formatHint,
}) {
  const id = `ssa-upload-${label.toLowerCase().replace(/[^a-z]+/g, "-")}`;
  return (
    <div className={`ssa-upload-field ${wide ? "ssa-upload-field--wide" : ""}`}>
      <span className="ssa-upload-label">{label} {!optional && <b>*</b>} {optional && <small>(Optional)</small>}</span>
      <label className={`ssa-upload-box ${error ? "ssa-upload-box--error" : ""} ${value ? "ssa-upload-box--done" : ""}`} htmlFor={id}>
        {value?.url && imageOnly ? (
          <img src={value.url} alt={label} style={{ width: "100%", height: "100%", objectFit: "contain", maxHeight: 120, borderRadius: 4 }} />
        ) : (
          <>
            {uploading ? <Loader2 className="ssa-spin" size={26} /> : value ? <CheckCircle2 size={26} /> : <ImagePlus size={27} />}
            <strong>{uploading ? "Uploading…" : value ? value.fileName : `Upload ${label.toLowerCase()}`}</strong>
            <span>{value ? (value.size ? `${(value.size / 1024 / 1024).toFixed(1)} MB · Uploaded` : "Saved image") : formatHint || (imageOnly ? "JPG, PNG or WEBP · Max 5MB" : "JPG, PNG, WEBP or PDF · Max 5MB")}</span>
          </>
        )}
        <input
          id={id}
          type="file"
          accept={accept || (imageOnly ? "image/jpeg,image/png,image/webp" : "image/jpeg,image/png,image/webp,application/pdf")}
          disabled={disabled || uploading}
          onChange={(event) => onUpload(event.target.files?.[0] || null)}
        />
      </label>
      {error ? <span className="ssa-field-error" role="alert">{error}</span> : null}
    </div>
  );
}

function SellerIllustration() {
  return (
    <div className="ssa-store-art" aria-hidden="true">
      <span className="ssa-art-cloud ssa-art-cloud--one" />
      <span className="ssa-art-cloud ssa-art-cloud--two" />
      <span className="ssa-art-arrow ssa-art-arrow--one" />
      <span className="ssa-art-arrow ssa-art-arrow--two" />
      <div className="ssa-art-shop">
        <div className="ssa-art-awning"><i /><i /><i /><i /><i /></div>
        <div className="ssa-art-door">TP</div>
        <div className="ssa-art-window" />
      </div>
      <span className="ssa-art-box ssa-art-box--one" />
      <span className="ssa-art-box ssa-art-box--two" />
      <span className="ssa-art-bag">TP</span>
    </div>
  );
}

export default function SellerStoreApplicationPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { resolvedTheme, setTheme } = useTheme();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState("");
  const [actionError, setActionError] = useState("");
  const [uploading, setUploading] = useState({});
  const [uploadErrors, setUploadErrors] = useState({});
  const [workspaceSlug, setWorkspaceSlug] = useState("");
  const { branding } = useStoreBranding();

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
      navigate("/seller/login", { replace: true });
    } catch {
      navigate("/seller/login", { replace: true });
    }
  };

  const ownerProvinceOptions = useMemo(
    () => getProvinceOptions(form.ownerProvince),
    [form.ownerProvince]
  );
  const ownerCityOptions = useMemo(
    () => getCityOptions(form.ownerProvince, form.ownerCity),
    [form.ownerProvince, form.ownerCity]
  );
  const ownerSubdistrictOptions = useMemo(
    () => getDistrictOptions(
      form.ownerProvince,
      form.ownerCity,
      form.ownerSubdistrict
    ),
    [form.ownerProvince, form.ownerCity, form.ownerSubdistrict]
  );

  const applicationQuery = useQuery({
    queryKey: APPLICATION_QUERY_KEY,
    queryFn: getCurrentUserStoreApplication,
    retry: false,
  });
  const application = applicationQuery.data;

  useEffect(() => {
    if (applicationQuery.isError && applicationQuery.error?.response?.status === 401) {
      navigate(LOGIN_PATH, { replace: true });
    }
  }, [applicationQuery.error, applicationQuery.isError, navigate]);

  useEffect(() => {
    if (!applicationQuery.isSuccess) return;
    const nextForm = applicationToForm(application);
    setForm(nextForm);
    if (application?.currentStep) {
      let serverStep = SERVER_STEPS.indexOf(application.currentStep);
      const step0Errors = validateStep(nextForm, 0);
      if (Object.keys(step0Errors).length > 0) {
        serverStep = 0;
      }
      if (serverStep >= 0) setStep(serverStep);
    }
  }, [application, applicationQuery.isSuccess]);

  useEffect(() => {
    if (application?.status !== "approved") return;
    let active = true;
    listSellerWorkspaceStores()
      .then((stores) => {
        if (!active) return;
        const match = stores.find((store) =>
          application.activation?.storeId
            ? Number(store.id) === Number(application.activation.storeId)
            : true
        );
        setWorkspaceSlug(match?.slug || match?.storeSlug || application.activation?.storeSlug || "");
      })
      .catch(() => setWorkspaceSlug(application.activation?.storeSlug || ""));
    return () => { active = false; };
  }, [application]);

  const saveMutation = useMutation({
    mutationFn: async ({ draft, visualStep }) => {
      const payload = formToPayload(draft, visualStep);
      return application?.id
        ? updateUserStoreApplicationDraft(application.id, payload)
        : createUserStoreApplicationDraft(payload);
    },
    onSuccess: (saved) => queryClient.setQueryData(APPLICATION_QUERY_KEY, saved),
  });

  const actionMutation = useMutation({
    mutationFn: async ({ action, id }) => {
      if (action === "submit") return submitUserStoreApplication(id);
      if (action === "resubmit") return resubmitUserStoreApplication(id);
      return cancelUserStoreApplication(id);
    },
    onSuccess: (saved) => queryClient.setQueryData(APPLICATION_QUERY_KEY, saved),
  });

  const isEditable = !application || Boolean(application.workflow?.canEdit);
  const isBusy = saveMutation.isPending || actionMutation.isPending;

  const updateField = useCallback((name, value) => {
    setForm((current) => {
      const next = {
        ...current,
        [name]: value,
        ...(name === "ownerProvince"
          ? { ownerCity: "", ownerSubdistrict: "" }
          : {}),
        ...(name === "ownerCity" ? { ownerSubdistrict: "" } : {}),
      };
      
      if (name === "storeName") {
        next.storeSlug = (value || "")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, "");
      }
      
      return next;
    });
    setErrors((current) => {
      const next = { ...current };
      delete next[name];
      if (name === "ownerProvince") {
        delete next.ownerCity;
        delete next.ownerSubdistrict;
      }
      if (name === "ownerCity") delete next.ownerSubdistrict;
      return next;
    });
    setActionError("");
    setNotice("");
  }, []);

  const saveDraft = useCallback(async ({ draft = form, visualStep = step, message = "Draft saved securely." } = {}) => {
    setActionError("");
    setNotice("");
    try {
      const saved = await saveMutation.mutateAsync({ draft, visualStep });
      setNotice(message);
      return saved;
    } catch (error) {
      setActionError(errorMessage(error, "Unable to save your draft."));
      throw error;
    }
  }, [form, saveMutation, step]);

  const continueStep = async () => {
    const stepErrors = validateStep(form, step);
    if (Object.keys(stepErrors).length) {
      setErrors(stepErrors);
      setActionError("Please complete the highlighted fields before continuing.");
      return;
    }
    try {
      const nextStep = Math.min(4, step + 1);
      await saveDraft({ visualStep: nextStep, message: "Progress saved. Continue with the next step." });
      setStep(nextStep);
      setErrors({});
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      // Error state is set by saveDraft.
    }
  };

  const uploadFile = async (
    field,
    file,
    { document = false, imageOnly = false, allowedTypes = null, invalidTypeMessage = "" } = {}
  ) => {
    if (!file) return;
    const errorKey = document ? `documents.${field}` : field;
    const acceptedTypes = allowedTypes ? new Set(allowedTypes) : ALLOWED_FILE_TYPES;
    if (!acceptedTypes.has(file.type) || (imageOnly && file.type === "application/pdf")) {
      setUploadErrors((current) => ({
        ...current,
        [errorKey]:
          invalidTypeMessage ||
          (imageOnly
            ? "Upload a JPG, PNG, or WEBP image."
            : "Upload a JPG, PNG, WEBP, or PDF file."),
      }));
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setUploadErrors((current) => ({ ...current, [errorKey]: "File must be 5MB or smaller." }));
      return;
    }

    setUploading((current) => ({ ...current, [errorKey]: true }));
    setUploadErrors((current) => ({ ...current, [errorKey]: "" }));
    setActionError("");
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await api.post("/upload", body, { headers: { "Content-Type": "multipart/form-data" } });
      const metadata = {
        url: response?.data?.data?.url,
        fileName: file.name,
        size: file.size,
        mimeType: file.type,
        uploadedAt: new Date().toISOString(),
      };
      const next = document
        ? { ...form, documents: { ...form.documents, [field]: metadata } }
        : { ...form, [field]: metadata };
      setForm(next);
      setErrors((current) => {
        const updated = { ...current };
        delete updated[errorKey];
        return updated;
      });
      await saveDraft({ draft: next, message: `${file.name} uploaded and saved.` });
    } catch (error) {
      setUploadErrors((current) => ({ ...current, [errorKey]: errorMessage(error, "Upload failed. Please try again.") }));
    } finally {
      setUploading((current) => ({ ...current, [errorKey]: false }));
    }
  };

  const removeDocument = (key) => {
    const documents = { ...form.documents };
    delete documents[key];
    setForm((current) => ({ ...current, documents }));
  };

  const submitApplication = async () => {
    const allErrors = validateAll(form);
    if (Object.keys(allErrors).length) {
      setErrors(allErrors);
      const firstInvalidStep = STEPS.findIndex((_entry, index) => Object.keys(validateStep(form, index)).length > 0);
      if (firstInvalidStep >= 0) setStep(firstInvalidStep);
      setActionError("Complete every required field and document before submitting.");
      return;
    }
    setActionError("");
    setNotice("");
    try {
      const saved = await saveDraft({ visualStep: 4, message: "" });
      const wantsResubmit = ["revision_requested", "rejected"].includes(saved.status);
      const allowed = wantsResubmit ? saved.workflow?.canResubmit : saved.workflow?.canSubmit;
      if (!allowed) {
        setActionError(saved.statusMeta?.description || "This application cannot be submitted in its current status.");
        return;
      }
      const submitted = await actionMutation.mutateAsync({
        action: wantsResubmit ? "resubmit" : "submit",
        id: saved.id,
      });
      setNotice(wantsResubmit ? "Application resubmitted for admin review." : "Application submitted for admin review.");
      setForm(applicationToForm(submitted));
    } catch (error) {
      setActionError(errorMessage(error, "Unable to submit your application."));
    }
  };

  const cancelApplication = async () => {
    if (!application?.workflow?.canCancel) return;
    if (!window.confirm("Cancel this store application? This action cannot be undone.")) return;
    setActionError("");
    try {
      await actionMutation.mutateAsync({ action: "cancel", id: application.id });
      setNotice("Application cancelled.");
    } catch (error) {
      setActionError(errorMessage(error, "Unable to cancel this application."));
    }
  };

  const stepValidity = useMemo(
    () => STEPS.map((_entry, index) => Object.keys(validateStep(form, index)).length === 0),
    [form]
  );
  const completedCount = stepValidity.filter(Boolean).length;
  const progress = completedCount * 20;
  const status = application?.status || "draft";
  const ActiveStepIcon = STEPS[step].icon;

  if (applicationQuery.isLoading) {
    return <main className="ssa-loading"><Loader2 className="ssa-spin" /><p>Loading your store application…</p></main>;
  }

  const renderStep = () => {
    const common = { onChange: updateField, disabled: !isEditable };
    if (step === 0) {
      return (
        <>
          <div className="ssa-form-grid ssa-form-grid--two">
            <Field label="Store Name" name="storeName" value={form.storeName} error={errors.storeName} required placeholder="Enter your store name" autoComplete="organization" {...common} />
            <Field label="Store Slug" name="storeSlug" value={form.storeSlug} error={errors.storeSlug} required placeholder="your-store-slug" hint="This becomes your store's unique URL." {...common} />
            <Field label="Business Category" name="category" value={form.category} error={errors.category} required as="select" options={["Fashion & Apparel", "Food & Beverage", "Beauty & Personal Care", "Home & Living", "Electronics", "Services", "Other"]} {...common} />
          </div>
          
          <h3 style={{ marginTop: 24, fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}><Headphones size={18} /> Contact</h3>
          <div className="ssa-form-grid ssa-form-grid--two">
            <Field label="Store Email" name="email" value={form.email} error={errors.email} required type="email" {...common} />
            <Field label="Phone" name="phone" value={form.phone} error={errors.phone} required {...common} />
            <Field label="WhatsApp" name="whatsapp" value={form.whatsapp} error={errors.whatsapp} {...common} />
          </div>

          <h3 style={{ marginTop: 24, fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}><MapPin size={18} /> Public Store Address</h3>
          <div className="ssa-form-grid ssa-form-grid--two">
            <Field label="Address Line 1" name="addressLine1" value={form.addressLine1} error={errors.addressLine1} required {...common} />
            <Field label="Address Line 2" name="addressLine2" value={form.addressLine2} error={errors.addressLine2} placeholder="Optional" {...common} />
            
            <Field label="Province" name="province" value={form.province} error={errors.province} required as="select" options={getProvinceOptions(form.province)} placeholder="Select Province" onChange={(name, value) => {
              common.onChange("province", value);
              common.onChange("city", "");
              common.onChange("district", "");
            }} disabled={!isEditable} />
            <Field label="City/Regency" name="city" value={form.city} error={errors.city} required as="select" options={getCityOptions(form.province, form.city)} placeholder={form.province ? "Select City/Regency" : "Select Province first"} onChange={(name, value) => {
              common.onChange("city", value);
              common.onChange("district", "");
            }} disabled={!isEditable || !form.province} />
            
            <Field label="Subdistrict" name="district" value={form.district} error={errors.district} required as="select" options={getDistrictOptions(form.province, form.city, form.district)} placeholder={form.city ? "Select Subdistrict" : "Select City first"} {...common} disabled={!isEditable || !form.city} />
            <Field label="Postal Code" name="postalCode" value={form.postalCode} error={errors.postalCode} required inputMode="numeric" {...common} />
            <Field label="Country" name="country" value={form.country} error={errors.country} required {...common} />
          </div>
        </>
      );
    }
    if (step === 1) {
      return (
        <div className="ssa-form-grid ssa-form-grid--three">
          <Field label="Full Name" name="ownerName" value={form.ownerName} error={errors.ownerName} required autoComplete="name" {...common} />
          <Field label="Email Address" name="ownerEmail" value={form.ownerEmail} error={errors.ownerEmail} required type="email" autoComplete="email" hint="Use your verified account email." {...common} />
          <Field label="WhatsApp / Phone number" name="ownerPhone" value={form.ownerPhone} error={errors.ownerPhone} required as="indonesian-phone" type="tel" autoComplete="tel" {...common} />
          <Field label="Date of Birth" name="birthDate" value={form.birthDate} error={errors.birthDate} required type="date" {...common} />
          <Field label="Identity Type" name="identityType" value={form.identityType} error={errors.identityType} required as="select" options={["KTP", "Passport", "Driver License"]} {...common} />
          <Field label="Identity Number" name="identityNumber" value={form.identityNumber} error={errors.identityNumber} required {...common} />
          <Field label="Tax ID (NPWP)" name="taxNumber" value={form.taxNumber} error={errors.taxNumber} hint="Optional at this stage." {...common} />
          <Field label="Residential Address" name="residentialAddress" value={form.residentialAddress} error={errors.residentialAddress} required className="ssa-span-two" autoComplete="street-address" {...common} />
          <Field label="Country" name="ownerCountry" value="Indonesia" error={errors.ownerCountry} required {...common} disabled hint="Seller onboarding is currently available in Indonesia." />
          <Field label="Province" name="ownerProvince" value={form.ownerProvince} error={errors.ownerProvince} required as="select" options={ownerProvinceOptions} placeholder="Select Province" {...common} />
          <Field label="City / Regency" name="ownerCity" value={form.ownerCity} error={errors.ownerCity} required as="select" options={ownerCityOptions} placeholder={form.ownerProvince ? "Select City / Regency" : "Select Province first"} {...common} disabled={!isEditable || !form.ownerProvince} />
          <Field label="Subdistrict" name="ownerSubdistrict" value={form.ownerSubdistrict} error={errors.ownerSubdistrict} required as="select" options={ownerSubdistrictOptions} placeholder={form.ownerCity ? "Select Subdistrict" : "Select City / Regency first"} {...common} disabled={!isEditable || !form.ownerCity} />
          <Field label="Postal Code" name="ownerPostalCode" value={form.ownerPostalCode} error={errors.ownerPostalCode} required inputMode="numeric" {...common} />
        </div>
      );
    }
    if (step === 2) {
      return (
        <div className="ssa-section-stack">
          <section className="ssa-form-section">
            <h3><Building2 size={18} /> 1. Business Information</h3>
            <div className="ssa-form-grid ssa-form-grid--three">
              <Field label="Business Type" name="businessType" value={form.businessType} error={errors.businessType} required as="select" options={["Individual / Sole Proprietor", "Partnership", "Limited Company", "Cooperative"]} {...common} />
              <Field label="Legal Entity" name="legalEntity" value={form.legalEntity} error={errors.legalEntity} required as="select" options={["Sole Proprietorship", "CV", "PT", "Cooperative", "Other"]} {...common} />
              <Field label="Country / Region" name="businessCountry" value={form.businessCountry} error={errors.businessCountry} required {...common} />
              <Field label="Province / State" name="businessProvince" value={form.businessProvince} error={errors.businessProvince} required {...common} />
              <Field label="City" name="businessCity" value={form.businessCity} error={errors.businessCity} required {...common} />
              <Field label="Postal Code" name="businessPostalCode" value={form.businessPostalCode} error={errors.businessPostalCode} required inputMode="numeric" {...common} />
              <Field label="Business Address" name="businessAddress" value={form.businessAddress} error={errors.businessAddress} required className="ssa-span-three" autoComplete="street-address" {...common} />
            </div>
          </section>
        </div>
      );
    }
    if (step === 3) {
      return (
        <div className="ssa-payment-profile">
          <div className="ssa-payment-contract" aria-label="Payment profile type">
            <span><QrCode size={21} /><small>Payment method</small><strong>Static QRIS</strong></span>
            <span><ShieldCheck size={21} /><small>Provider</small><strong>Manual QRIS</strong></span>
          </div>

          <div className="ssa-payment-grid">
            <div className="ssa-qris-panel">
              <div className="ssa-qris-upload-card">
                <div className="ssa-qris-upload-header">
                  <ImagePlus size={20} />
                  <span>
                    <strong>QRIS image</strong>
                    <small>PNG or JPEG, maximum 5MB. Upload does not auto-save.</small>
                  </span>
                </div>
                <UploadBox
                  label="QRIS Image"
                  value={form.paymentQrisImage}
                  error={uploadErrors.paymentQrisImage || errors.paymentQrisImage}
                  uploading={uploading.paymentQrisImage}
                  onUpload={(file) => uploadFile("paymentQrisImage", file, {
                    imageOnly: true,
                    allowedTypes: ["image/jpeg", "image/png"],
                    invalidTypeMessage: "Upload a PNG or JPEG QRIS image.",
                  })}
                  disabled={!isEditable}
                  imageOnly
                  accept="image/png,image/jpeg"
                  formatHint="PNG or JPEG · Max 5MB"
                />
              </div>
              {form.paymentQrisImage?.url ? (
                <div className="ssa-qris-preview">
                  <img src={form.paymentQrisImage.url} alt="QRIS payment profile preview" />
                  <span><CheckCircle2 size={15} /> QRIS ready for admin review</span>
                </div>
              ) : (
                <div className="ssa-qris-empty"><QrCode size={42} /><strong>No QRIS image yet</strong><span>Upload an image or enter its URL below.</span></div>
              )}
            </div>

            <div className="ssa-payment-fields">
              <section className="ssa-payment-section">
                <h3>Required details</h3>
                <p>Needed before admin review.</p>
                <div className="ssa-form-grid ssa-form-grid--two">
                  <Field label="Account Name" name="paymentAccountName" value={form.paymentAccountName} error={errors.paymentAccountName} required autoComplete="name" maxLength={PAYMENT_PROFILE_LIMITS.accountName} {...common} />
                  <Field label="Merchant Name" name="paymentMerchantName" value={form.paymentMerchantName} error={errors.paymentMerchantName} required maxLength={PAYMENT_PROFILE_LIMITS.merchantName} {...common} />
                  <Field label="Payout Bank" name="paymentBankName" value={form.paymentBankName} error={errors.paymentBankName} required maxLength={PAYMENT_PROFILE_LIMITS.bankName} hint="Bank used by Admin for seller withdrawal transfer." {...common} />
                  <Field label="Payout Account Number" name="paymentAccountNumber" value={form.paymentAccountNumber} error={errors.paymentAccountNumber} required maxLength={PAYMENT_PROFILE_LIMITS.accountNumber} {...common} />
                  <Field label="Payout Account Holder" name="paymentAccountHolderName" value={form.paymentAccountHolderName} error={errors.paymentAccountHolderName} required maxLength={PAYMENT_PROFILE_LIMITS.accountHolderName} {...common} />
                </div>
                <div className="ssa-form-grid" style={{ marginTop: 14 }}>
                  <Field label="QRIS Image URL" name="paymentQrisImageUrl" value={form.paymentQrisImage?.url || ""} error={errors.paymentQrisImageUrl} required maxLength={PAYMENT_PROFILE_LIMITS.qrisImageUrl} hint="The image buyers will see after Admin approval." onChange={(name, value) => {
                    setForm((current) => ({
                      ...current,
                      paymentQrisImage: value
                        ? { ...(current.paymentQrisImage || {}), url: value, fileName: current.paymentQrisImage?.fileName || "Manual URL entry", size: current.paymentQrisImage?.size || 0, mimeType: current.paymentQrisImage?.mimeType || "image/png", uploadedAt: current.paymentQrisImage?.uploadedAt || new Date().toISOString() }
                        : null,
                    }));
                    setErrors((current) => { const next = { ...current }; delete next.paymentQrisImage; delete next.paymentQrisImageUrl; return next; });
                    setActionError("");
                    setNotice("");
                  }} disabled={!isEditable} />
                </div>
              </section>

              <section className="ssa-payment-section">
                <h3>Optional details</h3>
                <p>Useful for audit, QR validation, and buyer instructions.</p>
                <div className="ssa-form-grid ssa-form-grid--two">
                  <Field label="Merchant ID" name="paymentMerchantId" value={form.paymentMerchantId} error={errors.paymentMerchantId} maxLength={PAYMENT_PROFILE_LIMITS.merchantId} hint="Optional" {...common} />
                  <Field label="QRIS Payload" name="paymentQrisPayload" value={form.paymentQrisPayload} error={errors.paymentQrisPayload} as="textarea" rows={3} maxLength={PAYMENT_PROFILE_LIMITS.qrisPayload} hint="Optional QR data embedded in the code." {...common} />
                  <Field label="Instruction Text" name="paymentInstructionText" value={form.paymentInstructionText} error={errors.paymentInstructionText} as="textarea" rows={3} maxLength={PAYMENT_PROFILE_LIMITS.instructionText} className="ssa-span-two" hint="Optional instructions shown to buyers." {...common} />
                  <Field label="Seller Note" name="paymentSellerNote" value={form.paymentSellerNote} error={errors.paymentSellerNote} as="textarea" rows={3} maxLength={PAYMENT_PROFILE_LIMITS.sellerNote} className="ssa-span-two" hint="Optional note for the admin reviewer." {...common} />
                </div>
              </section>
            </div>
          </div>

          <div className="ssa-info-banner"><ShieldCheck size={20} /><div><strong>Admin approval required</strong><span>This application only prepares a Payment Profile draft. Checkout will use QRIS only after the store and payment setup are reviewed and activated by an admin.</span></div></div>
          <div className="ssa-security-note"><LockKeyhole size={19} /><span>Your QRIS setup is stored securely with this application.</span><b><ShieldCheck size={15} /> Review protected</b></div>
        </div>
      );
    }
    return (
      <div className="ssa-review-step">
        <section>
          <h3><UploadCloud size={19} /> 1. Upload Documents</h3>
          <p>Upload clear, valid documents. Maximum file size 5MB.</p>
          <div className="ssa-document-grid">
            {DOCUMENTS.map((document) => {
              const file = form.documents?.[document.key];
              const key = `documents.${document.key}`;
              return (
                <div className={`ssa-document-card ${file ? "ssa-document-card--done" : ""}`} key={document.key}>
                  <FileText size={27} />
                  <div><strong>{document.label}{!document.required && " (Optional)"}</strong><span>{file?.fileName || "No file uploaded"}</span></div>
                  {file ? <button type="button" onClick={() => removeDocument(document.key)} disabled={!isEditable} aria-label={`Remove ${document.label}`}><X size={16} /></button> : null}
                  <label>
                    {uploading[key] ? <Loader2 className="ssa-spin" size={17} /> : file ? <CheckCircle2 size={17} /> : <UploadCloud size={17} />}
                    {uploading[key] ? "Uploading…" : file ? "Replace file" : "Choose file"}
                    <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" disabled={!isEditable || uploading[key]} onChange={(event) => uploadFile(document.key, event.target.files?.[0] || null, { document: true })} />
                  </label>
                  {(uploadErrors[key] || errors[key]) && <span className="ssa-field-error" role="alert">{uploadErrors[key] || errors[key]}</span>}
                </div>
              );
            })}
          </div>
        </section>
        <section className="ssa-final-checklist">
          <h3><FileCheck2 size={19} /> 2. Final Review Checklist</h3>
          <p>Confirm that every section is complete and accurate.</p>
          <div>
            {STEPS.slice(0, 4).map((entry, index) => (
              <button type="button" key={entry.key} onClick={() => setStep(index)}>
                {stepValidity[index] ? <CheckCircle2 size={18} /> : <span className="ssa-empty-dot" />}
                <span><strong>{entry.title}</strong><small>{stepValidity[index] ? "Completed" : "Needs attention"}</small></span>
              </button>
            ))}
            <span className="ssa-check-item"><CheckCircle2 size={18} /><span><strong>Admin review</strong><small>Your store stays inactive until approved</small></span></span>
          </div>
        </section>
        <label className={`ssa-confirm ${errors.confirmAccuracy ? "ssa-confirm--error" : ""}`}>
          <input type="checkbox" checked={form.confirmAccuracy} disabled={!isEditable} onChange={(event) => updateField("confirmAccuracy", event.target.checked)} />
          <span><strong>I confirm that all information provided is accurate and complete.</strong><small>By checking this box, you agree to our Terms of Service and Privacy Policy.</small></span>
        </label>
        {errors.confirmAccuracy && <span className="ssa-field-error" role="alert">{errors.confirmAccuracy}</span>}
      </div>
    );
  };

  return (
    <main className="ssa-page">
      <aside className="ssa-sidebar">
        <Link to="/seller/login" className="ssa-brand" aria-label="TP Preneurs Seller Workspace">
          <span 
            className="ssa-brand-mark"
            style={hasCustomBrandingLogo(branding?.sellerLogoUrl) ? { background: "transparent", boxShadow: "none" } : undefined}
          >
            {hasCustomBrandingLogo(branding?.sellerLogoUrl) ? (
              <img 
                src={getWorkspaceLogoUrl("seller", branding?.sellerLogoUrl)} 
                alt="Seller Logo" 
                style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: "inherit" }} 
              />
            ) : (
              "TP"
            )}
          </span>
          <span><strong>TP <b>Preneurs</b></strong><small>SELLER WORKSPACE</small></span>
        </Link>
        <div className="ssa-sidebar-copy"><i /><p>Your store.<br />Your brand.<br /><strong>Your growth.</strong></p></div>
        <SellerIllustration />
        <div className="ssa-help-card"><Headphones size={28} /><div><strong>Need help?</strong><span>Our support team is here to help you anytime.</span></div><a href="mailto:support@tpreneurs.com">Contact Support <ArrowRight size={16} /></a></div>
      </aside>

      <section className="ssa-main">
        <header className="ssa-topbar">
          <div className="ssa-journey" aria-label="Seller onboarding progress">
            {["Account Created", "Email Verified", "Store Application", "Review"].map((label, index) => (
              <div className={`ssa-journey-step ${index < 2 ? "is-done" : index === 2 ? "is-active" : status !== "draft" ? "is-current" : ""}`} key={label}>
                <span>{index < 2 ? <Check size={16} /> : index + 1}</span><small>{label}</small>
              </div>
            ))}
          </div>
          <div className="ssa-top-actions">
            <div className="ssa-theme-switch" aria-label="Color theme">
              <button type="button" className={resolvedTheme === "light" ? "is-active" : ""} onClick={() => setTheme("light")}><Sun size={16} /> Light</button>
              <button type="button" className={resolvedTheme === "dark" ? "is-active" : ""} onClick={() => setTheme("dark")}><Moon size={16} /> Dark</button>
            </div>
            <button type="button" className="ssa-logout-btn" onClick={handleLogout} aria-label="Logout"><LogOut size={14} /> Logout</button>
            <span className="ssa-language">EN <ChevronDown size={14} /></span>
          </div>
        </header>

        <div className="ssa-content-grid">
          <div className="ssa-workspace">
            <div className="ssa-page-heading">
              <div><h1>Store Application</h1><p>Step {step + 1} of 5 <b>·</b> {STEPS[step].title}</p><span>{["Tell us about your store so customers can find and trust your brand.", "Tell us about the owner so we can verify your identity and build trust.", "Tell us how your business operates and fulfills customer orders.", "Prepare the QRIS checkout destination. Changes need admin approval.", "Upload the required documents and review your details before submitting."][step]}</span></div>
              <div className="ssa-heading-icon"><ActiveStepIcon size={42} /></div>
            </div>

            {application?.revisionNote && <div className="ssa-workflow-message ssa-workflow-message--warning" role="alert"><strong>Revision requested</strong><span>{application.revisionNote}</span></div>}
            {application?.rejectReason && <div className="ssa-workflow-message ssa-workflow-message--danger" role="alert"><strong>Application rejected</strong><span>{application.rejectReason}</span></div>}
            {!isEditable && status !== "approved" && <div className="ssa-workflow-message"><strong>{application?.statusMeta?.label || "Application locked"}</strong><span>{application?.statusMeta?.description || "Editing is unavailable while admin review is in progress."}</span></div>}
            {status === "approved" && <div className="ssa-workflow-message ssa-workflow-message--success" role="status"><strong>Your store application is approved.</strong><span>{workspaceSlug ? "Your seller workspace is ready." : "We're finishing your seller workspace access."}</span>{workspaceSlug && <Link to={`/seller/stores/${encodeURIComponent(workspaceSlug)}`}>Open Seller Workspace <ArrowRight size={16} /></Link>}</div>}

            <form className="ssa-form-card" onSubmit={(event) => event.preventDefault()}>
              <div className="ssa-card-title"><ActiveStepIcon size={20} /><strong>{STEPS[step].title}</strong>{application?.statusMeta && <span>{application.statusMeta.label}</span>}</div>
              {renderStep()}

              {(actionError || notice) && <div className={`ssa-action-message ${actionError ? "is-error" : "is-success"}`} role={actionError ? "alert" : "status"}>{actionError || notice}</div>}

              <div className="ssa-form-actions">
                <button type="button" className="ssa-button ssa-button--secondary" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0 || isBusy}><ArrowLeft size={18} /> Back</button>
                <button type="button" className="ssa-button ssa-button--secondary" onClick={() => saveDraft().catch(() => {})} disabled={!isEditable || isBusy}>{saveMutation.isPending ? <Loader2 className="ssa-spin" size={18} /> : <Save size={18} />} Save Draft</button>
                {step < 4 ? (
                  <button type="button" className="ssa-button ssa-button--primary" onClick={continueStep} disabled={!isEditable || isBusy}>Continue <ArrowRight size={18} /></button>
                ) : (
                  <button type="button" className="ssa-button ssa-button--submit" onClick={submitApplication} disabled={!isEditable || isBusy}>{actionMutation.isPending ? <Loader2 className="ssa-spin" size={18} /> : <Send size={18} />}{status === "revision_requested" ? "Resubmit Application" : "Submit Application"}</button>
                )}
              </div>
              {application?.workflow?.canCancel && <button type="button" className="ssa-cancel-link" onClick={cancelApplication} disabled={isBusy}>Cancel application</button>}
            </form>
          </div>

          <aside className="ssa-summary">
            <section className="ssa-summary-card">
              <h2>Application Summary</h2>
              <div className="ssa-progress-row"><div className="ssa-progress-ring" style={{ "--ssa-progress": `${progress * 3.6}deg` }}><span><strong>{progress}%</strong><small>{progress === 100 ? "Ready" : "Completed"}</small></span></div><p>{progress === 100 ? "Perfect! Your application is ready for review." : `Great progress! ${5 - completedCount} step${5 - completedCount === 1 ? "" : "s"} remaining.`}<b>{status.replaceAll("_", " ")}</b></p></div>
            </section>
            <section className="ssa-summary-card"><h2>Verification Status</h2><div className="ssa-verification"><CheckCircle2 size={43} /><div><strong>Email Verified</strong><span>{form.ownerEmail || application?.applicant?.email || "Verified account"}</span><small>Identity linked to this application</small></div></div></section>
            <section className="ssa-summary-card"><h2>Requirements Checklist</h2><div className="ssa-requirements">{STEPS.map((entry, index) => <button type="button" className={step === index ? "is-active" : ""} key={entry.key} onClick={() => setStep(index)}>{stepValidity[index] ? <CheckCircle2 size={16} /> : <span />}{entry.title}</button>)}</div></section>
            <section className="ssa-summary-card"><h2>Review Timeline</h2><div className="ssa-timeline"><span className={status !== "draft" ? "is-done" : "is-active"}><i>{status !== "draft" ? <Check size={13} /> : "1"}</i><b>Submitted</b><small>Your application enters the admin queue</small></span><span className={["under_review", "revision_requested"].includes(status) ? "is-active" : status === "approved" || status === "rejected" ? "is-done" : ""}><i>2</i><b>Admin Review</b><small>Usually completed in 1–2 days</small></span><span className={status === "approved" ? "is-done" : ""}><i>{status === "approved" ? <Check size={13} /> : "3"}</i><b>Activation</b><small>Publish your approved store</small></span></div></section>
            <section className="ssa-summary-card ssa-summary-help"><Headphones size={27} /><div><h2>Need Help?</h2><p>Our support team is ready to help.</p></div><a href="mailto:support@tpreneurs.com">Contact Support <ArrowRight size={16} /></a></section>
          </aside>
        </div>
        <footer className="ssa-footer"><span>© 2026 TP Preneurs. All rights reserved.</span><nav><a href="/terms">Terms of Service</a><a href="/privacy">Privacy Policy</a></nav></footer>
      </section>
    </main>
  );
}
