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
  LogOut,
  MapPin,
  Moon,
  Save,
  Send,
  ShieldCheck,
  Store,
  Sun,
  UploadCloud,
  UserRound,
  X,
} from "lucide-react";
import i18n from "../../../i18n.js";
import { api } from "../../../api/axios.ts";
import {
  cancelUserStoreApplication,
  createUserStoreApplicationDraft,
  getCurrentUserStoreApplication,
  resubmitUserStoreApplication,
  submitUserStoreApplication,
  updateUserStoreApplicationDraft,
} from "../../../api/userStoreApplications.ts";
import { listSellerWorkspaceStores } from "../../../api/sellerWorkspace.ts";
import { useSellerAuth } from "../../../auth/authDomainHooks.js";
import { useTheme } from "../../../theme/ThemeProvider.jsx";
import {
  getCityOptions,
  getDistrictOptions,
  getProvinceOptions,
} from "../../../utils/idRegions.ts";
import useStoreBranding from "../../../hooks/useStoreBranding.js";
import { getWorkspaceLogoUrl, hasCustomBrandingLogo } from "../../../lib/branding.js";
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
  { key: "identity", titleKey: "step1Title", icon: Store },
  { key: "owner", titleKey: "step2Title", icon: UserRound },
  { key: "business", titleKey: "step3Title", icon: Building2 },
  { key: "documents", titleKey: "step4Title", icon: FileCheck2 },
];

const SERVER_STEPS = [
  "store_information",
  "owner_identity",
  "operational_address",
  "compliance",
];

const DOCUMENTS = [
  { key: "idCard", labelKey: "idCardDoc", required: false },
  { key: "businessLicense", labelKey: "businessLicenseDoc", required: false },
  { key: "taxDocument", labelKey: "taxDoc", required: false },
  { key: "storePhoto", labelKey: "storePhotoDoc", required: false },
];

const META_KEYS = [
  "residentialAddress",
  "ownerCountry",
  "ownerProvince",
  "ownerCity",
  "ownerSubdistrict",
  "ownerPostalCode",
  "legalEntity",
  "businessSubdistrict",
  "sameAsOwnerAddress",
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
  businessSubdistrict: "",
  businessPostalCode: "",
  businessAddress: "",
  sameAsOwnerAddress: false,
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

const TRANSLATIONS = {
  en: {
    sidebarSlogan1: "Your store.",
    sidebarSlogan2: "Your brand.",
    sidebarSlogan3: "Your growth.",
    needHelp: "Need help?",
    supportTeamDesc: "Our support team is here to help you anytime.",
    contactSupport: "Contact Support",
    accountCreated: "Account Created",
    emailVerified: "Email Verified",
    storeApplication: "Store Application",
    review: "Review",
    light: "Light",
    dark: "Dark",
    logout: "Logout",
    stepOf: "Step",
    of: "of",
    underReviewBadge: "Under Review",
    step1Title: "Store Identity",
    step2Title: "Owner Information",
    step3Title: "Business Details",
    step4Title: "Documents & Review",
    step1Subtitle: "Tell us about your store so customers can find and trust your brand.",
    step2Subtitle: "Tell us about the owner so we can verify your identity and build trust.",
    step3Subtitle: "Tell us how your business operates and fulfills customer orders.",
    step4Subtitle: "Upload your documents (optional) and review your details before submitting.",
    revisionRequested: "Revision requested",
    applicationRejected: "Application rejected",
    appUnderReview: "Application Under Review",
    appUnderReviewDesc: "Your store application was submitted and is in the review queue. Usually reviewed in 1–2 business days.",
    appApprovedTitle: "Your store application is approved.",
    appApprovedReady: "Your seller workspace is ready.",
    appApprovedFinishing: "We're finishing your seller workspace access.",
    openSellerWorkspace: "Open Seller Workspace",
    readOnlyMode: "Read-only mode while under review",
    previousStep: "Previous Step",
    nextStep: "Next Step",
    back: "Back",
    saveDraft: "Save Draft",
    continue: "Continue",
    submitApplication: "Submit Application",
    resubmitApplication: "Resubmit Application",
    cancelApplication: "Cancel application",
    cancelConfirm: "Cancel this store application? This action cannot be undone.",
    applicationCancelled: "Application cancelled.",
    storeIdentitySection: "1. Store Identity",
    storeName: "Store Name",
    storeSlug: "Store Slug",
    storeSlugHint: "This becomes your store's unique URL.",
    storeCategory: "Store Category",
    selectCategory: "Select category",
    contactSection: "2. Contact",
    storeEmail: "Store Email",
    phoneWhatsapp: "WhatsApp / Phone number",
    publicStoreAddressSection: "3. Public Store Address",
    addressLine1: "Address Line 1",
    addressLine2: "Address Line 2",
    optional: "Optional",
    province: "Province",
    selectProvince: "Select Province",
    cityRegency: "City/Regency",
    selectCity: "Select City/Regency",
    selectProvinceFirst: "Select Province first",
    subdistrict: "Subdistrict",
    selectSubdistrict: "Select Subdistrict",
    selectCityFirst: "Select City first",
    postalCode: "Postal Code",
    country: "Country",
    fullName: "Full Name",
    emailAddress: "Email Address",
    emailHint: "Use your verified account email.",
    dateOfBirth: "Date of Birth",
    identityType: "Identity Type",
    identityNumber: "Identity Number",
    taxIdNpwp: "Tax ID (NPWP)",
    taxHint: "Optional at this stage.",
    residentialAddress: "Residential Address",
    countryHint: "Seller onboarding is currently available in Indonesia.",
    businessInfoSection: "1. Business Information",
    businessType: "Business Type",
    legalEntity: "Legal Entity",
    countryRegion: "Country / Region",
    sameAsOwnerTitle: "Same as Owner's Residential Address (Step 2 of 4)",
    sameAsOwnerDesc: "Auto-fill and sync Address, Province, City, Subdistrict, and Postal Code from Step 2.",
    businessAddress: "Business Address",
    provinceState: "Province / State",
    uploadDocumentsSection: "1. Upload Documents",
    uploadDocumentsDesc: "Upload clear, valid documents (optional). Maximum file size 5MB.",
    idCardDoc: "ID Card (KTP / Passport)",
    businessLicenseDoc: "Business License (NIB / SIUP)",
    taxDoc: "Tax Document (NPWP)",
    storePhotoDoc: "Store Photo",
    optionalTag: " (Optional)",
    noFileUploaded: "No file uploaded",
    uploading: "Uploading…",
    chooseFile: "Choose file",
    replaceFile: "Replace file",
    removeFile: "Remove",
    finalChecklistSection: "2. Final Review Checklist",
    finalChecklistDesc: "Confirm that every section is complete and accurate.",
    completedStatus: "Completed",
    needsAttentionStatus: "Needs attention",
    adminReviewCheck: "Admin review",
    adminReviewDesc: "Your store stays inactive until approved",
    confirmAccuracyLabel: "I confirm that all information provided is accurate and complete.",
    confirmAccuracySublabel: "By checking this box, you agree to our Terms of Service and Privacy Policy.",
    applicationSummary: "Application Summary",
    progressCompleted: "Completed",
    progressReady: "Ready",
    allCompletedMsg: "Perfect! Your application is ready for review.",
    remainingStepsMsg: "Great progress! {count} step{plural} remaining.",
    verificationStatus: "Verification Status",
    emailVerifiedBadge: "Email Verified",
    verifiedAccount: "Verified account",
    identityLinked: "Identity linked to this application",
    requirementsChecklist: "Requirements Checklist",
    reviewTimeline: "Review Timeline",
    timelineSubmitted: "Submitted",
    timelineEnteredQueue: "Your application enters the admin queue",
    timelineSubmittedOn: "Submitted on {date}",
    timelineAdminReview: "Admin Review",
    timelineRevisionNeeded: "Revision needed - see notes",
    timelineUnderReview: "Under review (usually 1–2 days)",
    timelineUsuallyCompleted: "Usually completed in 1–2 days",
    timelineActivation: "Activation",
    timelineWorkspaceActive: "Store workspace active",
    timelinePublishApproved: "Publish your approved store",
    needHelpSide: "Need Help?",
    supportTeamReady: "Our support team is ready to help.",
    copyright: "© 2026 TP Preneurs. All rights reserved.",
    termsOfService: "Terms of Service",
    privacyPolicy: "Privacy Policy",
    fieldRequired: "{label} is required.",
    slugError: "Use lowercase letters, numbers, and single hyphens only.",
    emailInvalid: "Enter a valid email address.",
    phoneInvalid: "Enter a valid Indonesian WhatsApp / Phone number starting with +62 or 08.",
    under18Error: "You must be at least 18 years old.",
    completeFieldsBeforeCont: "Please complete the highlighted fields before continuing.",
    completeRequiredBeforeSubmit: "Complete every required field before submitting.",
    confirmAccuracyError: "Confirm that the application is accurate before submitting.",
    draftSavedSecurely: "Draft saved securely.",
    loadingApp: "Loading your store application…",
    appSubmittedNotice: "Application submitted for admin review.",
    appResubmittedNotice: "Application resubmitted for admin review.",
    fileUploadedSaved: "{fileName} uploaded and saved.",
    fileSizeLimit: "File must be 5MB or smaller.",
    fileTypeInvalid: "Upload a JPG, PNG, WEBP, or PDF file.",
    imageTypeInvalid: "Upload a JPG, PNG, or WEBP image.",
  },
  id: {
    sidebarSlogan1: "Toko Anda.",
    sidebarSlogan2: "Merek Anda.",
    sidebarSlogan3: "Pertumbuhan Anda.",
    needHelp: "Butuh bantuan?",
    supportTeamDesc: "Tim dukungan kami siap membantu Anda kapan saja.",
    contactSupport: "Hubungi Dukungan",
    accountCreated: "Akun Dibuat",
    emailVerified: "Email Terverifikasi",
    storeApplication: "Aplikasi Toko",
    review: "Tinjauan",
    light: "Terang",
    dark: "Gelap",
    logout: "Keluar",
    stepOf: "Langkah",
    of: "dari",
    underReviewBadge: "Sedang Ditinjau",
    step1Title: "Identitas Toko",
    step2Title: "Informasi Pemilik",
    step3Title: "Detail Bisnis",
    step4Title: "Dokumen & Tinjauan",
    step1Subtitle: "Ceritakan tentang toko Anda agar pelanggan dapat menemukan dan mempercayai merek Anda.",
    step2Subtitle: "Beritahu kami tentang pemilik agar kami dapat memverifikasi identitas Anda dan membangun kepercayaan.",
    step3Subtitle: "Ceritakan bagaimana bisnis Anda beroperasi dan memenuhi pesanan pelanggan.",
    step4Subtitle: "Unggah dokumen Anda (opsional) dan tinjau detail Anda sebelum mengirimkan.",
    revisionRequested: "Permintaan revisi",
    applicationRejected: "Aplikasi ditolak",
    appUnderReview: "Aplikasi Sedang Ditinjau",
    appUnderReviewDesc: "Aplikasi toko Anda telah dikirim dan berada dalam antrean peninjauan. Biasanya ditinjau dalam 1–2 hari kerja.",
    appApprovedTitle: "Aplikasi toko Anda telah disetujui.",
    appApprovedReady: "Ruang kerja penjual Anda telah siap.",
    appApprovedFinishing: "Kami sedang menyelesaikan akses ruang kerja penjual Anda.",
    openSellerWorkspace: "Buka Ruang Kerja Penjual",
    readOnlyMode: "Mode hanya-lihat saat dalam peninjauan",
    previousStep: "Langkah Sebelumnya",
    nextStep: "Langkah Berikutnya",
    back: "Kembali",
    saveDraft: "Simpan Draf",
    continue: "Lanjutkan",
    submitApplication: "Kirim Aplikasi Toko",
    resubmitApplication: "Kirim Ulang Aplikasi",
    cancelApplication: "Batalkan aplikasi",
    cancelConfirm: "Batalkan aplikasi toko ini? Tindakan ini tidak dapat diurungkan.",
    applicationCancelled: "Aplikasi dibatalkan.",
    storeIdentitySection: "1. Identitas Toko",
    storeName: "Nama Toko",
    storeSlug: "Slug Toko",
    storeSlugHint: "Ini akan menjadi tautan (URL) unik toko Anda.",
    storeCategory: "Kategori Toko",
    selectCategory: "Pilih kategori",
    contactSection: "2. Kontak",
    storeEmail: "Email Toko",
    phoneWhatsapp: "Nomor WhatsApp / Telepon",
    publicStoreAddressSection: "3. Alamat Publik Toko",
    addressLine1: "Alamat Baris 1",
    addressLine2: "Alamat Baris 2",
    optional: "Opsional",
    province: "Provinsi",
    selectProvince: "Pilih Provinsi",
    cityRegency: "Kota / Kabupaten",
    selectCity: "Pilih Kota / Kabupaten",
    selectProvinceFirst: "Pilih Provinsi terlebih dahulu",
    subdistrict: "Kecamatan",
    selectSubdistrict: "Pilih Kecamatan",
    selectCityFirst: "Pilih Kota terlebih dahulu",
    postalCode: "Kode Pos",
    country: "Negara",
    fullName: "Nama Lengkap",
    emailAddress: "Alamat Email",
    emailHint: "Gunakan email akun Anda yang telah terverifikasi.",
    dateOfBirth: "Tanggal Lahir",
    identityType: "Jenis Identitas",
    identityNumber: "Nomor Identitas (NIK / Paspor)",
    taxIdNpwp: "NPWP",
    taxHint: "Opsional pada tahap ini.",
    residentialAddress: "Alamat Tempat Tinggal",
    countryHint: "Pendaftaran penjual saat ini tersedia di Indonesia.",
    businessInfoSection: "1. Informasi Bisnis",
    businessType: "Tipe Bisnis",
    legalEntity: "Badan Usaha / Badan Hukum",
    countryRegion: "Negara / Wilayah",
    sameAsOwnerTitle: "Sama dengan Alamat Tempat Tinggal Pemilik (Langkah 2 dari 4)",
    sameAsOwnerDesc: "Otomatis mengisi dan menyinkronkan Alamat, Provinsi, Kota, Kecamatan, dan Kode Pos dari Langkah 2.",
    businessAddress: "Alamat Operasional Bisnis",
    provinceState: "Provinsi",
    uploadDocumentsSection: "1. Unggah Dokumen",
    uploadDocumentsDesc: "Unggah dokumen yang jelas dan valid (opsional). Ukuran file maksimum 5MB.",
    idCardDoc: "KTP / Paspor",
    businessLicenseDoc: "Izin Usaha (NIB / SIUP)",
    taxDoc: "Dokumen Pajak (NPWP)",
    storePhotoDoc: "Foto Toko",
    optionalTag: " (Opsional)",
    noFileUploaded: "Belum ada file yang diunggah",
    uploading: "Mengunggah…",
    chooseFile: "Pilih file",
    replaceFile: "Ganti file",
    removeFile: "Hapus",
    finalChecklistSection: "2. Daftar Periksa Tinjauan Akhir",
    finalChecklistDesc: "Pastikan setiap bagian telah lengkap dan akurat.",
    completedStatus: "Selesai",
    needsAttentionStatus: "Perlu diperhatikan",
    adminReviewCheck: "Peninjauan admin",
    adminReviewDesc: "Toko Anda tetap nonaktif hingga disetujui",
    confirmAccuracyLabel: "Saya mengonfirmasi bahwa semua informasi yang diberikan adalah akurat dan lengkap.",
    confirmAccuracySublabel: "Dengan mencentang kotak ini, Anda menyetujui Ketentuan Layanan dan Kebijakan Privasi kami.",
    applicationSummary: "Ringkasan Aplikasi",
    progressCompleted: "Selesai",
    progressReady: "Siap",
    allCompletedMsg: "Sempurna! Aplikasi Anda siap untuk ditinjau.",
    remainingStepsMsg: "Progres bagus! {count} langkah tersisa.",
    verificationStatus: "Status Verifikasi",
    emailVerifiedBadge: "Email Terverifikasi",
    verifiedAccount: "Akun terverifikasi",
    identityLinked: "Identitas terhubung ke aplikasi ini",
    requirementsChecklist: "Daftar Persyaratan",
    reviewTimeline: "Linimasa Peninjauan",
    timelineSubmitted: "Dikirimkan",
    timelineEnteredQueue: "Aplikasi Anda masuk ke antrean admin",
    timelineSubmittedOn: "Dikirim pada {date}",
    timelineAdminReview: "Peninjauan Admin",
    timelineRevisionNeeded: "Revisi diperlukan - lihat catatan",
    timelineUnderReview: "Sedang ditinjau (biasanya 1–2 hari)",
    timelineUsuallyCompleted: "Biasanya selesai dalam 1–2 hari",
    timelineActivation: "Aktivasi",
    timelineWorkspaceActive: "Ruang kerja toko aktif",
    timelinePublishApproved: "Publikasikan toko Anda yang disetujui",
    needHelpSide: "Butuh Bantuan?",
    supportTeamReady: "Tim dukungan kami siap membantu.",
    copyright: "© 2026 TP Preneurs. Hak cipta dilindungi.",
    termsOfService: "Ketentuan Layanan",
    privacyPolicy: "Kebijakan Privasi",
    fieldRequired: "{label} wajib diisi.",
    slugError: "Gunakan huruf kecil, angka, dan tanda hubung tunggal saja.",
    emailInvalid: "Masukkan alamat email yang valid.",
    phoneInvalid: "Masukkan nomor WhatsApp / telepon Indonesia yang valid diawali +62 atau 08.",
    under18Error: "Usia Anda minimal harus 18 tahun.",
    completeFieldsBeforeCont: "Silakan lengkapi bidang yang disorot sebelum melanjutkan.",
    completeRequiredBeforeSubmit: "Lengkapi setiap bidang wajib sebelum mengirimkan.",
    confirmAccuracyError: "Konfirmasikan keakuratan aplikasi sebelum mengirimkan.",
    draftSavedSecurely: "Draf berhasil disimpan dengan aman.",
    loadingApp: "Memuat aplikasi toko Anda…",
    appSubmittedNotice: "Aplikasi dikirimkan untuk peninjauan admin.",
    appResubmittedNotice: "Aplikasi dikirim ulang untuk peninjauan admin.",
    fileUploadedSaved: "{fileName} berhasil diunggah dan disimpan.",
    fileSizeLimit: "Ukuran file harus 5MB atau lebih kecil.",
    fileTypeInvalid: "Unggah file JPG, PNG, WEBP, atau PDF.",
    imageTypeInvalid: "Unggah gambar JPG, PNG, atau WEBP.",
  }
};

const getInitialLang = () => {
  if (typeof window === "undefined") return "en";
  try {
    const fromSeller = JSON.parse(localStorage.getItem("seller_language") || "null");
    if (fromSeller?.isoCode?.toLowerCase()?.startsWith("id")) return "id";
    if (fromSeller?.isoCode?.toLowerCase()?.startsWith("en")) return "en";
  } catch {}
  const storeLang = localStorage.getItem("store_language");
  if (storeLang === "Indonesia" || storeLang === "id") return "id";
  if (i18n.language?.startsWith("id")) return "id";
  return "en";
};

const text = (value) => String(value ?? "").trim();
const errorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

function applicationToForm(application, user) {
  if (!application) {
    return {
      ...INITIAL_FORM,
      ownerName: user?.name || "",
      ownerEmail: user?.email || "",
      ownerPhone: user?.phoneNumber || "",
    };
  }
  const owner = application.ownerIdentitySnapshot || {};
  const store = application.storeInformationSnapshot || {};
  const address = application.operationalAddressSnapshot || {};
  const payout = application.payoutPaymentSnapshot || {};
  const compliance = application.complianceSnapshot || {};
  const metadata =
    application.internalMetadata?.sellerOnboarding2026 ||
    application.sellerOnboardingSnapshot ||
    {};

  return {
    ...INITIAL_FORM,
    storeName: store.storeName || metadata.storeName || "",
    storeSlug: store.storeSlug || metadata.storeSlug || "",
    category: store.storeCategory || metadata.category || "",
    ownerName: owner.fullName || metadata.ownerName || user?.name || "",
    ownerEmail: owner.email || metadata.ownerEmail || application.applicant?.email || user?.email || "",
    ownerPhone: owner.phoneNumber || metadata.ownerPhone || user?.phoneNumber || "",
    birthDate: owner.birthDate || metadata.birthDate || "",
    identityType: owner.identityType || metadata.identityType || "KTP",
    identityNumber: compliance.identityNumber || metadata.identityNumber || "",
    taxNumber: compliance.taxId || metadata.taxNumber || "",
    residentialAddress: metadata.residentialAddress || "",
    ownerCountry: metadata.ownerCountry || "Indonesia",
    ownerProvince: metadata.ownerProvince || "",
    ownerCity: metadata.ownerCity || "",
    ownerSubdistrict: metadata.ownerSubdistrict || "",
    ownerPostalCode: metadata.ownerPostalCode || "",
    businessType: store.sellerType || metadata.businessType || INITIAL_FORM.businessType,
    legalEntity: metadata.legalEntity || address.notes || INITIAL_FORM.legalEntity,
    businessCountry: address.country || metadata.businessCountry || "Indonesia",
    businessProvince: metadata.businessProvince || address.province || "",
    businessCity: metadata.businessCity || address.city || "",
    businessSubdistrict: metadata.businessSubdistrict || address.district || "",
    businessPostalCode: metadata.businessPostalCode || address.postalCode || "",
    businessAddress: metadata.businessAddress || address.addressLine1 || "",
    sameAsOwnerAddress: Boolean(
      metadata.sameAsOwnerAddress ?? (
        (metadata.businessAddress || address.addressLine1) &&
        metadata.residentialAddress &&
        (metadata.businessAddress || address.addressLine1) === metadata.residentialAddress &&
        (metadata.businessProvince || address.province) === metadata.ownerProvince
      )
    ),
    email: metadata.email || compliance.supportEmail || "",
    phone: metadata.phone || metadata.whatsapp || address.phoneNumber || owner.phoneNumber || "",
    whatsapp: metadata.whatsapp || metadata.phone || address.phoneNumber || owner.phoneNumber || "",
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
    confirmAccuracy: Boolean(
      metadata.confirmAccuracy ?? compliance.authenticityConfirmed ?? false
    ),
  };
}

function metadataFromForm(form) {
  return {
    ...form,
  };
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
      description: text(form.description) || null,
      sellerType: text(form.businessType) || null,
      isSelfProduced: form.businessType === "Individual / Sole Proprietor",
      initialProductCount: null,
    },
    operationalAddressSnapshot: {
      contactName: text(form.ownerName) || null,
      phoneNumber: text(form.phone) || text(form.ownerPhone) || null,
      addressLine1: text(form.businessAddress) || text(form.addressLine1) || null,
      addressLine2: text(form.addressLine2) || null,
      city: text(form.businessCity) || text(form.city) || null,
      province: text(form.businessProvince) || text(form.province) || null,
      district: text(form.businessSubdistrict) || text(form.district) || null,
      postalCode: text(form.businessPostalCode) || text(form.postalCode) || null,
      country: text(form.businessCountry) || text(form.country) || "Indonesia",
      notes: text(form.legalEntity) || null,
    },
    complianceSnapshot: {
      supportEmail: text(form.email) || text(form.ownerEmail) || null,
      supportPhone: text(form.phone) || text(form.whatsapp) || text(form.ownerPhone) || null,
      taxId: text(form.taxNumber) || null,
      identityNumber: text(form.identityNumber) || null,
      productTypes: text(form.category) || null,
      brandOwnershipType: text(form.legalEntity) || null,
      authenticityConfirmed: Boolean(form.confirmAccuracy),
    },
    payoutPaymentSnapshot: {
      accountName: text(form.paymentAccountName) || null,
      accountHolderName: text(form.paymentAccountHolderName) || null,
      accountNumber: text(form.paymentAccountNumber) || null,
      bankName: text(form.paymentBankName) || null,
      currency: "IDR",
      merchantName: text(form.paymentMerchantName) || null,
      merchantId: text(form.paymentMerchantId) || null,
      qrisImageUrl: form.paymentQrisImage?.url || null,
      qrisPayload: text(form.paymentQrisPayload) || null,
      instructionText: text(form.paymentInstructionText) || null,
      sellerNote: text(form.paymentSellerNote) || null,
    },
    sellerOnboardingSnapshot: metadataFromForm(form),
  };
}

function validateStep(form, step, lang = "en") {
  const errors = {};
  const tStr = (key) => TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS.en[key] ?? key;
  const isId = lang === "id";

  const required = (key, label) => {
    if (!text(form[key])) errors[key] = tStr("fieldRequired").replace("{label}", label);
  };

  if (step === 0) {
    required("storeName", isId ? "Nama Toko" : "Store Name");
    required("storeSlug", isId ? "Slug Toko" : "Store Slug");
    required("email", isId ? "Email Toko" : "Store Email");
    required("phone", isId ? "Nomor WhatsApp / Telepon" : "WhatsApp / Phone number");
    required("addressLine1", isId ? "Alamat Baris 1" : "Address Line 1");
    required("province", isId ? "Provinsi" : "Province");
    required("city", isId ? "Kota / Kabupaten" : "City / Regency");
    required("district", isId ? "Kecamatan" : "Subdistrict");
    required("postalCode", isId ? "Kode Pos" : "Postal Code");
    if (text(form.storeSlug) && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(text(form.storeSlug))) {
      errors.storeSlug = tStr("slugError");
    }
    if (text(form.email) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text(form.email))) {
      errors.email = tStr("emailInvalid");
    }
    const cleanPhone = text(form.phone).replace(/[\s-]/g, "");
    if (cleanPhone && !/^(?:\+?62|0)?8[0-9]{8,13}$/.test(cleanPhone)) {
      errors.phone = tStr("phoneInvalid");
    }
  }
  if (step === 1) {
    [
      ["ownerName", isId ? "Nama Lengkap" : "Full name"],
      ["ownerEmail", isId ? "Alamat Email" : "Email address"],
      ["ownerPhone", isId ? "Nomor Telepon" : "Phone number"],
      ["birthDate", isId ? "Tanggal Lahir" : "Date of birth"],
      ["identityType", isId ? "Jenis Identitas" : "Identity type"],
      ["identityNumber", isId ? "Nomor Identitas" : "Identity number"],
      ["residentialAddress", isId ? "Alamat Tempat Tinggal" : "Residential address"],
      ["ownerCountry", isId ? "Negara" : "Country"],
      ["ownerProvince", isId ? "Provinsi" : "Province"],
      ["ownerCity", isId ? "Kota" : "City"],
      ["ownerSubdistrict", isId ? "Kecamatan" : "Subdistrict"],
      ["ownerPostalCode", isId ? "Kode Pos" : "Postal code"],
    ].forEach(([key, label]) => required(key, label));
    if (text(form.ownerEmail) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text(form.ownerEmail))) {
      errors.ownerEmail = tStr("emailInvalid");
    }
    const cleanOwnerPhone = text(form.ownerPhone).replace(/[\s-]/g, "");
    if (cleanOwnerPhone && !/^(?:\+?62|0)?8[0-9]{8,13}$/.test(cleanOwnerPhone)) {
      errors.ownerPhone = tStr("phoneInvalid");
    }
    if (form.birthDate) {
      const age = (Date.now() - new Date(form.birthDate).getTime()) / 31557600000;
      if (!Number.isFinite(age) || age < 18) errors.birthDate = tStr("under18Error");
    }
  }
  if (step === 2) {
    [
      ["businessType", isId ? "Tipe Bisnis" : "Business type"],
      ["legalEntity", isId ? "Badan Usaha" : "Legal entity"],
      ["businessCountry", isId ? "Negara" : "Country / region"],
      ["businessProvince", isId ? "Provinsi" : "Province / state"],
      ["businessCity", isId ? "Kota" : "City"],
      ["businessSubdistrict", isId ? "Kecamatan" : "Subdistrict"],
      ["businessPostalCode", isId ? "Kode Pos" : "Postal code"],
      ["businessAddress", isId ? "Alamat Bisnis" : "Business address"],
    ].forEach(([key, label]) => required(key, label));
  }
  if (step === 3) {
    DOCUMENTS.filter((document) => document.required).forEach((document) => {
      if (!form.documents?.[document.key]) {
        const docLabel = tStr(document.labelKey);
        errors[`documents.${document.key}`] = tStr("fieldRequired").replace("{label}", docLabel);
      }
    });
    if (!form.confirmAccuracy) {
      errors.confirmAccuracy = tStr("confirmAccuracyError");
    }
  }
  return errors;
}

function validateAll(form, lang = "en") {
  return STEPS.reduce(
    (all, _step, index) => ({ ...all, ...validateStep(form, index, lang) }),
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
              {options.map((option) => {
                const optVal = typeof option === "object" && option !== null ? option.value : option;
                const optLabel = typeof option === "object" && option !== null ? option.label : option;
                return (
                  <option key={optVal} value={optVal}>{optLabel}</option>
                );
              })}
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

function SellerIllustration() {
  return (
    <div className="ssa-store-art" aria-hidden="true">
      <div className="ssa-store-roof">
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="ssa-store-frame">
        <div className="ssa-store-window">
          <span>TP</span>
        </div>
        <div className="ssa-store-door" />
      </div>
      <div className="ssa-store-box ssa-store-box--one" />
      <div className="ssa-store-box ssa-store-box--two" />
      <div className="ssa-store-bag">
        <span />
        <small>TP</small>
      </div>
    </div>
  );
}

export default function SellerStoreApplicationPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useSellerAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const [lang, setLang] = useState(getInitialLang);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState("");
  const [actionError, setActionError] = useState("");
  const [uploading, setUploading] = useState({});
  const [uploadErrors, setUploadErrors] = useState({});
  const [workspaceSlug, setWorkspaceSlug] = useState("");
  const { branding } = useStoreBranding();

  const t = useCallback((key) => {
    return TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS.en?.[key] ?? key;
  }, [lang]);

  useEffect(() => {
    const handleLangChange = (lng) => {
      const nextLang = lng?.startsWith("id") ? "id" : "en";
      setLang(nextLang);
    };
    i18n.on("languageChanged", handleLangChange);
    return () => {
      i18n.off("languageChanged", handleLangChange);
    };
  }, []);

  const handleLanguageChange = (newLang) => {
    setLang(newLang);
    i18n.changeLanguage(newLang);
    try {
      localStorage.setItem("seller_language", JSON.stringify({
        isoCode: newLang,
        name: newLang === "id" ? "Indonesia" : "English",
        label: newLang === "id" ? "ID Indonesia" : "EN English",
        flag: newLang.toUpperCase(),
      }));
      localStorage.setItem("store_language", newLang === "id" ? "Indonesia" : "English");
    } catch {}
  };

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

  const businessProvinceOptions = useMemo(
    () => getProvinceOptions(form.businessProvince),
    [form.businessProvince]
  );
  const businessCityOptions = useMemo(
    () => getCityOptions(form.businessProvince, form.businessCity),
    [form.businessProvince, form.businessCity]
  );
  const businessSubdistrictOptions = useMemo(
    () => getDistrictOptions(
      form.businessProvince,
      form.businessCity,
      form.businessSubdistrict
    ),
    [form.businessProvince, form.businessCity, form.businessSubdistrict]
  );

  const handleToggleSameAsOwner = useCallback((checked) => {
    setForm((current) => {
      if (checked) {
        return {
          ...current,
          sameAsOwnerAddress: true,
          businessAddress: current.residentialAddress || "",
          businessProvince: current.ownerProvince || "",
          businessCity: current.ownerCity || "",
          businessSubdistrict: current.ownerSubdistrict || "",
          businessPostalCode: current.ownerPostalCode || "",
          businessCountry: current.ownerCountry || "Indonesia",
        };
      }
      return {
        ...current,
        sameAsOwnerAddress: false,
      };
    });
    if (checked) {
      setErrors((current) => {
        const next = { ...current };
        delete next.businessAddress;
        delete next.businessProvince;
        delete next.businessCity;
        delete next.businessSubdistrict;
        delete next.businessPostalCode;
        delete next.businessCountry;
        return next;
      });
    }
  }, []);

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
    const nextForm = applicationToForm(application, user);
    setForm(nextForm);
    if (application?.currentStep) {
      let serverStep = SERVER_STEPS.indexOf(application.currentStep);
      if (application.currentStep === "payout_payment") {
        serverStep = 3;
      }
      const step0Errors = validateStep(nextForm, 0, lang);
      if (Object.keys(step0Errors).length > 0) {
        serverStep = 0;
      }
      if (serverStep >= 0) setStep(serverStep);
    }
  }, [application, applicationQuery.isSuccess, user, lang]);

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
        ...(name === "businessProvince"
          ? { businessCity: "", businessSubdistrict: "" }
          : {}),
        ...(name === "businessCity" ? { businessSubdistrict: "" } : {}),
      };
      
      if (name === "storeName") {
        next.storeSlug = (value || "")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, "");
      }

      if (name === "phone") {
        next.whatsapp = value;
      }

      if (current.sameAsOwnerAddress) {
        if (name === "residentialAddress") next.businessAddress = value;
        if (name === "ownerCountry") next.businessCountry = value;
        if (name === "ownerProvince") {
          next.businessProvince = value;
          next.businessCity = "";
          next.businessSubdistrict = "";
        }
        if (name === "ownerCity") {
          next.businessCity = value;
          next.businessSubdistrict = "";
        }
        if (name === "ownerSubdistrict") next.businessSubdistrict = value;
        if (name === "ownerPostalCode") next.businessPostalCode = value;
      }
      
      return next;
    });
    setErrors((current) => {
      const next = { ...current };
      delete next[name];
      if (name === "phone") delete next.whatsapp;
      if (name === "ownerProvince") {
        delete next.ownerCity;
        delete next.ownerSubdistrict;
      }
      if (name === "ownerCity") delete next.ownerSubdistrict;
      if (name === "businessProvince") {
        delete next.businessCity;
        delete next.businessSubdistrict;
      }
      if (name === "businessCity") delete next.businessSubdistrict;
      return next;
    });
    setActionError("");
    setNotice("");
  }, []);

  const saveDraft = useCallback(async ({ draft = form, visualStep = step, message = "" } = {}) => {
    setActionError("");
    setNotice("");
    try {
      const saved = await saveMutation.mutateAsync({ draft, visualStep });
      setNotice(message || t("draftSavedSecurely"));
      return saved;
    } catch (error) {
      setActionError(errorMessage(error, t("draftSavedSecurely")));
      throw error;
    }
  }, [form, saveMutation, step, t]);

  const continueStep = async () => {
    const stepErrors = validateStep(form, step, lang);
    if (Object.keys(stepErrors).length) {
      setErrors(stepErrors);
      setActionError(t("completeFieldsBeforeCont"));
      return;
    }
    try {
      const nextStep = Math.min(3, step + 1);
      await saveDraft({ visualStep: nextStep, message: t("draftSavedSecurely") });
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
          (imageOnly ? t("imageTypeInvalid") : t("fileTypeInvalid")),
      }));
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setUploadErrors((current) => ({ ...current, [errorKey]: t("fileSizeLimit") }));
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
      await saveDraft({ draft: next, message: t("fileUploadedSaved").replace("{fileName}", file.name) });
    } catch (error) {
      setUploadErrors((current) => ({ ...current, [errorKey]: errorMessage(error, "Upload failed.") }));
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
    const allErrors = validateAll(form, lang);
    if (Object.keys(allErrors).length) {
      setErrors(allErrors);
      const firstInvalidStep = STEPS.findIndex((_entry, index) => Object.keys(validateStep(form, index, lang)).length > 0);
      if (firstInvalidStep >= 0) setStep(firstInvalidStep);
      setActionError(t("completeRequiredBeforeSubmit"));
      return;
    }
    setActionError("");
    setNotice("");
    try {
      const saved = await saveDraft({ visualStep: 3, message: "" });
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
      setNotice(wantsResubmit ? t("appResubmittedNotice") : t("appSubmittedNotice"));
      setForm(applicationToForm(submitted));
    } catch (error) {
      setActionError(errorMessage(error, "Unable to submit your application."));
    }
  };

  const cancelApplication = async () => {
    if (!application?.workflow?.canCancel) return;
    if (!window.confirm(t("cancelConfirm"))) return;
    setActionError("");
    try {
      await actionMutation.mutateAsync({ action: "cancel", id: application.id });
      setNotice(t("applicationCancelled"));
    } catch (error) {
      setActionError(errorMessage(error, "Unable to cancel this application."));
    }
  };

  const stepValidity = useMemo(
    () => STEPS.map((_entry, index) => Object.keys(validateStep(form, index, lang)).length === 0),
    [form, lang]
  );
  const completedCount = stepValidity.filter(Boolean).length;
  const progress = Math.round((completedCount / STEPS.length) * 100);
  const status = application?.status || "draft";
  const ActiveStepIcon = STEPS[step].icon;

  const formatStatus = (st) => {
    if (lang === "id") {
      switch (st) {
        case "draft": return "Draf";
        case "submitted": return "Dikirim";
        case "under_review": return "Sedang Ditinjau";
        case "revision_requested": return "Perlu Revisi";
        case "rejected": return "Ditolak";
        case "approved": return "Disetujui";
        case "cancelled": return "Dibatalkan";
        default: return st.replaceAll("_", " ");
      }
    }
    return st.replaceAll("_", " ");
  };

  if (applicationQuery.isLoading) {
    return <main className="ssa-loading"><Loader2 className="ssa-spin" /><p>{t("loadingApp")}</p></main>;
  }

  const common = { onChange: updateField, disabled: !isEditable };

  const renderStep = () => {
    if (step === 0) {
      return (
        <div className="ssa-section-stack">
          <section className="ssa-form-section">
            <h3><Store size={18} /> {t("storeIdentitySection")}</h3>
            <div className="ssa-form-grid ssa-form-grid--two">
              <Field label={t("storeName")} name="storeName" value={form.storeName} error={errors.storeName} required placeholder={lang === "id" ? "contoh: Studio Kerajinan Acme" : "e.g. Acme Craft Studio"} {...common} />
              <Field label={t("storeSlug")} name="storeSlug" value={form.storeSlug} error={errors.storeSlug} required hint={t("storeSlugHint")} {...common} />
            </div>
            <div className="ssa-form-grid" style={{ marginTop: 18 }}>
              <Field label={t("storeCategory")} name="category" value={form.category} error={errors.category} required as="select" options={["Fashion & Apparel", "Handmade & Crafts", "Food & Beverage", "Electronics & Gadgets", "Beauty & Care", "Home & Living"]} placeholder={t("selectCategory")} {...common} />
            </div>
          </section>

          <h3 style={{ marginTop: 24, fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}><Headphones size={18} /> {t("contactSection")}</h3>
          <div className="ssa-form-grid ssa-form-grid--two">
            <Field label={t("storeEmail")} name="email" value={form.email} error={errors.email} required type="email" placeholder="store@example.com" {...common} />
            <Field label={t("phoneWhatsapp")} name="phone" value={form.phone} error={errors.phone} required as="indonesian-phone" type="tel" autoComplete="tel" placeholder="81234567890" {...common} />
          </div>

          <h3 style={{ marginTop: 24, fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}><MapPin size={18} /> {t("publicStoreAddressSection")}</h3>
          <div className="ssa-form-grid ssa-form-grid--two">
            <Field label={t("addressLine1")} name="addressLine1" value={form.addressLine1} error={errors.addressLine1} required {...common} />
            <Field label={t("addressLine2")} name="addressLine2" value={form.addressLine2} error={errors.addressLine2} placeholder={t("optional")} {...common} />
            
            <Field label={t("province")} name="province" value={form.province} error={errors.province} required as="select" options={getProvinceOptions(form.province)} placeholder={t("selectProvince")} onChange={(name, value) => {
              common.onChange("province", value);
              common.onChange("city", "");
              common.onChange("district", "");
            }} disabled={!isEditable} />
            <Field label={t("cityRegency")} name="city" value={form.city} error={errors.city} required as="select" options={getCityOptions(form.province, form.city)} placeholder={form.province ? t("selectCity") : t("selectProvinceFirst")} onChange={(name, value) => {
              common.onChange("city", value);
              common.onChange("district", "");
            }} disabled={!isEditable || !form.province} />
            
            <Field label={t("subdistrict")} name="district" value={form.district} error={errors.district} required as="select" options={getDistrictOptions(form.province, form.city, form.district)} placeholder={form.city ? t("selectSubdistrict") : t("selectCityFirst")} {...common} disabled={!isEditable || !form.city} />
            <Field label={t("postalCode")} name="postalCode" value={form.postalCode} error={errors.postalCode} required inputMode="numeric" {...common} />
            <Field label={t("country")} name="country" value={form.country} error={errors.country} required {...common} />
          </div>
        </div>
      );
    }
    if (step === 1) {
      return (
        <div className="ssa-form-grid ssa-form-grid--three">
          <Field label={t("fullName")} name="ownerName" value={form.ownerName} error={errors.ownerName} required autoComplete="name" {...common} />
          <Field label={t("emailAddress")} name="ownerEmail" value={form.ownerEmail} error={errors.ownerEmail} required type="email" autoComplete="email" hint={t("emailHint")} {...common} />
          <Field label={t("phoneWhatsapp")} name="ownerPhone" value={form.ownerPhone} error={errors.ownerPhone} required as="indonesian-phone" type="tel" autoComplete="tel" {...common} />
          <Field label={t("dateOfBirth")} name="birthDate" value={form.birthDate} error={errors.birthDate} required type="date" {...common} />
          <Field label={t("identityType")} name="identityType" value={form.identityType} error={errors.identityType} required as="select" options={lang === "id" ? [{ value: "KTP", label: "KTP" }, { value: "Passport", label: "Paspor" }, { value: "Driver License", label: "SIM" }] : ["KTP", "Passport", "Driver License"]} {...common} />
          <Field label={t("identityNumber")} name="identityNumber" value={form.identityNumber} error={errors.identityNumber} required {...common} />
          <Field label={t("taxIdNpwp")} name="taxNumber" value={form.taxNumber} error={errors.taxNumber} hint={t("taxHint")} {...common} />
          <Field label={t("residentialAddress")} name="residentialAddress" value={form.residentialAddress} error={errors.residentialAddress} required className="ssa-span-two" autoComplete="street-address" {...common} />
          <Field label={t("country")} name="ownerCountry" value={form.ownerCountry || "Indonesia"} error={errors.ownerCountry} required {...common} disabled hint={t("countryHint")} />
          <Field label={t("province")} name="ownerProvince" value={form.ownerProvince} error={errors.ownerProvince} required as="select" options={ownerProvinceOptions} placeholder={t("selectProvince")} {...common} />
          <Field label={t("cityRegency")} name="ownerCity" value={form.ownerCity} error={errors.ownerCity} required as="select" options={ownerCityOptions} placeholder={form.ownerProvince ? t("selectCity") : t("selectProvinceFirst")} {...common} disabled={!isEditable || !form.ownerProvince} />
          <Field label={t("subdistrict")} name="ownerSubdistrict" value={form.ownerSubdistrict} error={errors.ownerSubdistrict} required as="select" options={ownerSubdistrictOptions} placeholder={form.ownerCity ? t("selectSubdistrict") : t("selectCityFirst")} {...common} disabled={!isEditable || !form.ownerCity} />
          <Field label={t("postalCode")} name="ownerPostalCode" value={form.ownerPostalCode} error={errors.ownerPostalCode} required inputMode="numeric" {...common} />
        </div>
      );
    }
    if (step === 2) {
      return (
        <div className="ssa-section-stack">
          <section className="ssa-form-section">
            <h3><Building2 size={18} /> {t("businessInfoSection")}</h3>
            <div className="ssa-form-grid ssa-form-grid--three">
              <Field
                label={t("businessType")}
                name="businessType"
                value={form.businessType}
                error={errors.businessType}
                required
                as="select"
                options={lang === "id" ? [
                  { value: "Individual / Sole Proprietor", label: "Individu / Usaha Perorangan" },
                  { value: "Partnership", label: "Kemitraan" },
                  { value: "Limited Company", label: "Perseroan Terbatas (PT)" },
                  { value: "Cooperative", label: "Koperasi" },
                ] : [
                  "Individual / Sole Proprietor",
                  "Partnership",
                  "Limited Company",
                  "Cooperative",
                ]}
                {...common}
              />
              <Field
                label={t("legalEntity")}
                name="legalEntity"
                value={form.legalEntity}
                error={errors.legalEntity}
                required
                as="select"
                options={lang === "id" ? [
                  { value: "Sole Proprietorship", label: "Usaha Perorangan" },
                  { value: "CV", label: "CV" },
                  { value: "PT", label: "PT" },
                  { value: "Cooperative", label: "Koperasi" },
                  { value: "Other", label: "Lainnya" },
                ] : [
                  "Sole Proprietorship",
                  "CV",
                  "PT",
                  "Cooperative",
                  "Other",
                ]}
                {...common}
              />
              <Field label={t("countryRegion")} name="businessCountry" value={form.businessCountry || "Indonesia"} error={errors.businessCountry} required {...common} disabled hint={t("countryHint")} />

              <div className="ssa-same-address-card ssa-span-three">
                <label className="ssa-same-address-label">
                  <input
                    type="checkbox"
                    checked={Boolean(form.sameAsOwnerAddress)}
                    disabled={!isEditable}
                    onChange={(event) => handleToggleSameAsOwner(event.target.checked)}
                  />
                  <div>
                    <strong>{t("sameAsOwnerTitle")}</strong>
                    <small>{t("sameAsOwnerDesc")}</small>
                  </div>
                </label>
              </div>

              <Field
                label={t("businessAddress")}
                name="businessAddress"
                value={form.businessAddress}
                error={errors.businessAddress}
                required
                className="ssa-span-three"
                autoComplete="street-address"
                disabled={!isEditable || Boolean(form.sameAsOwnerAddress)}
                {...common}
              />
              <Field
                label={t("provinceState")}
                name="businessProvince"
                value={form.businessProvince}
                error={errors.businessProvince}
                required
                as="select"
                options={businessProvinceOptions}
                placeholder={t("selectProvince")}
                disabled={!isEditable || Boolean(form.sameAsOwnerAddress)}
                {...common}
              />
              <Field
                label={t("cityRegency")}
                name="businessCity"
                value={form.businessCity}
                error={errors.businessCity}
                required
                as="select"
                options={businessCityOptions}
                placeholder={form.businessProvince ? t("selectCity") : t("selectProvinceFirst")}
                disabled={!isEditable || !form.businessProvince || Boolean(form.sameAsOwnerAddress)}
                {...common}
              />
              <Field
                label={t("subdistrict")}
                name="businessSubdistrict"
                value={form.businessSubdistrict}
                error={errors.businessSubdistrict}
                required
                as="select"
                options={businessSubdistrictOptions}
                placeholder={form.businessCity ? t("selectSubdistrict") : t("selectCityFirst")}
                disabled={!isEditable || !form.businessCity || Boolean(form.sameAsOwnerAddress)}
                {...common}
              />
              <Field
                label={t("postalCode")}
                name="businessPostalCode"
                value={form.businessPostalCode}
                error={errors.businessPostalCode}
                required
                inputMode="numeric"
                disabled={!isEditable || Boolean(form.sameAsOwnerAddress)}
                {...common}
              />
            </div>
          </section>
        </div>
      );
    }
    return (
      <div className="ssa-review-step">
        <section>
          <h3><UploadCloud size={19} /> {t("uploadDocumentsSection")}</h3>
          <p>{t("uploadDocumentsDesc")}</p>
          <div className="ssa-document-grid">
            {DOCUMENTS.map((document) => {
              const file = form.documents?.[document.key];
              const key = `documents.${document.key}`;
              const docLabel = t(document.labelKey);
              return (
                <div className={`ssa-document-card ${file ? "ssa-document-card--done" : ""}`} key={document.key}>
                  <FileText size={27} />
                  <div><strong>{docLabel}{!document.required && t("optionalTag")}</strong><span>{file?.fileName || t("noFileUploaded")}</span></div>
                  {file ? <button type="button" onClick={() => removeDocument(document.key)} disabled={!isEditable} aria-label={`${t("removeFile")} ${docLabel}`}><X size={16} /></button> : null}
                  <label>
                    {uploading[key] ? <Loader2 className="ssa-spin" size={17} /> : file ? <CheckCircle2 size={17} /> : <UploadCloud size={17} />}
                    {uploading[key] ? t("uploading") : file ? t("replaceFile") : t("chooseFile")}
                    <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" disabled={!isEditable || uploading[key]} onChange={(event) => uploadFile(document.key, event.target.files?.[0] || null, { document: true })} />
                  </label>
                  {(uploadErrors[key] || errors[key]) && <span className="ssa-field-error" role="alert">{uploadErrors[key] || errors[key]}</span>}
                </div>
              );
            })}
          </div>
        </section>
        <section className="ssa-final-checklist">
          <h3><FileCheck2 size={19} /> {t("finalChecklistSection")}</h3>
          <p>{t("finalChecklistDesc")}</p>
          <div>
            {STEPS.slice(0, 3).map((entry, index) => (
              <button type="button" key={entry.key} onClick={() => setStep(index)}>
                {stepValidity[index] ? <CheckCircle2 size={18} /> : <span className="ssa-empty-dot" />}
                <span><strong>{t(entry.titleKey)}</strong><small>{stepValidity[index] ? t("completedStatus") : t("needsAttentionStatus")}</small></span>
              </button>
            ))}
            <span className="ssa-check-item"><CheckCircle2 size={18} /><span><strong>{t("adminReviewCheck")}</strong><small>{t("adminReviewDesc")}</small></span></span>
          </div>
        </section>
        <label className={`ssa-confirm ${errors.confirmAccuracy ? "ssa-confirm--error" : ""}`}>
          <input type="checkbox" checked={form.confirmAccuracy} disabled={!isEditable} onChange={(event) => updateField("confirmAccuracy", event.target.checked)} />
          <span><strong>{t("confirmAccuracyLabel")}</strong><small>{t("confirmAccuracySublabel")}</small></span>
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
        <div className="ssa-sidebar-copy">
          <i />
          <p>
            {t("sidebarSlogan1")}<br />
            {t("sidebarSlogan2")}<br />
            <strong>{t("sidebarSlogan3")}</strong>
          </p>
        </div>
        <SellerIllustration />
        <div className="ssa-help-card">
          <Headphones size={28} />
          <div>
            <strong>{t("needHelp")}</strong>
            <span>{t("supportTeamDesc")}</span>
          </div>
          <a href="mailto:support@tpreneurs.com">{t("contactSupport")} <ArrowRight size={16} /></a>
        </div>
      </aside>

      <section className="ssa-main">
        <header className="ssa-topbar">
          <div className="ssa-journey" aria-label="Seller onboarding progress">
            {[t("accountCreated"), t("emailVerified"), t("storeApplication"), t("review")].map((label, index) => {
              const isAccountOrEmail = index < 2;
              const isStoreApp = index === 2;
              const isReview = index === 3;

              let stepClass = "";
              if (isAccountOrEmail) {
                stepClass = "is-done";
              } else if (isStoreApp) {
                stepClass = status && status !== "draft" ? "is-done" : "is-active";
              } else if (isReview) {
                if (status === "approved") {
                  stepClass = "is-done";
                } else if (status && status !== "draft") {
                  stepClass = "is-active";
                }
              }

              const isChecked =
                isAccountOrEmail ||
                (isStoreApp && Boolean(status && status !== "draft")) ||
                (isReview && status === "approved");

              return (
                <div className={`ssa-journey-step ${stepClass}`} key={index}>
                  <span>{isChecked ? <Check size={16} /> : index + 1}</span>
                  <small>{label}</small>
                </div>
              );
            })}
          </div>
          <div className="ssa-top-actions">
            <div className="ssa-theme-switch" aria-label="Color theme">
              <button type="button" className={resolvedTheme === "light" ? "is-active" : ""} onClick={() => setTheme("light")}><Sun size={16} /> {t("light")}</button>
              <button type="button" className={resolvedTheme === "dark" ? "is-active" : ""} onClick={() => setTheme("dark")}><Moon size={16} /> {t("dark")}</button>
            </div>
            <button type="button" className="ssa-logout-btn" onClick={handleLogout} aria-label={t("logout")}><LogOut size={14} /> {t("logout")}</button>
            <div className="ssa-language-wrap">
              <select
                className="ssa-language-select"
                value={lang}
                onChange={(e) => handleLanguageChange(e.target.value)}
                aria-label="Pilih Bahasa / Select Language"
              >
                <option value="en">EN</option>
                <option value="id">ID</option>
              </select>
              <ChevronDown size={14} className="ssa-language-arrow" aria-hidden="true" />
            </div>
          </div>
        </header>

        <div className="ssa-content-grid">
          <div className="ssa-workspace">
            <div className="ssa-page-heading">
              <div>
                <h1>{t("storeApplication")}</h1>
                <p>
                  {t("stepOf")} {step + 1} {t("of")} {STEPS.length} <b>·</b> {t(STEPS[step].titleKey)}
                  {!isEditable && status !== "approved" ? (
                    <span style={{ marginLeft: 8, padding: "2px 8px", borderRadius: 9999, fontSize: 10, fontWeight: 700, backgroundColor: "rgba(56, 189, 248, 0.15)", color: "#38bdf8", border: "1px solid rgba(56, 189, 248, 0.3)" }}>
                      {t("underReviewBadge")}
                    </span>
                  ) : null}
                </p>
                <span>{[t("step1Subtitle"), t("step2Subtitle"), t("step3Subtitle"), t("step4Subtitle")][step]}</span>
              </div>
              <div className="ssa-heading-icon"><ActiveStepIcon size={42} /></div>
            </div>

            {application?.revisionNote && (
              <div className="ssa-workflow-message ssa-workflow-message--warning" role="alert">
                <strong>{t("revisionRequested")}</strong>
                <span>{application.revisionNote}</span>
              </div>
            )}
            {application?.rejectReason && (
              <div className="ssa-workflow-message ssa-workflow-message--danger" role="alert">
                <strong>{t("applicationRejected")}</strong>
                <span>{application.rejectReason}</span>
              </div>
            )}
            {!isEditable && status !== "approved" && (
              <div className="ssa-workflow-message" style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Clock3 size={22} className="shrink-0" style={{ color: "#38bdf8" }} />
                <div>
                  <strong>{application?.statusMeta?.label || t("appUnderReview")}</strong>
                  <span style={{ display: "block", marginTop: 2 }}>
                    {application?.statusMeta?.description || t("appUnderReviewDesc")}
                  </span>
                </div>
              </div>
            )}
            {status === "approved" && (
              <div className="ssa-workflow-message ssa-workflow-message--success" role="status">
                <strong>{t("appApprovedTitle")}</strong>
                <span>{workspaceSlug ? t("appApprovedReady") : t("appApprovedFinishing")}</span>
                {workspaceSlug && (
                  <Link to={`/seller/stores/${encodeURIComponent(workspaceSlug)}`}>
                    {t("openSellerWorkspace")} <ArrowRight size={16} />
                  </Link>
                )}
              </div>
            )}

            <form className="ssa-form-card" onSubmit={(event) => event.preventDefault()}>
              <div className="ssa-card-title"><ActiveStepIcon size={20} /><strong>{t(STEPS[step].titleKey)}</strong>{application?.statusMeta && <span>{application.statusMeta.label}</span>}</div>
              {renderStep()}

              {(actionError || notice) && <div className={`ssa-action-message ${actionError ? "is-error" : "is-success"}`} role={actionError ? "alert" : "status"}>{actionError || notice}</div>}

              {!isEditable && status !== "approved" ? (
                <div className="ssa-form-actions ssa-form-actions--readonly" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                  <button
                    type="button"
                    className="ssa-button ssa-button--secondary"
                    onClick={() => setStep((current) => Math.max(0, current - 1))}
                    disabled={step === 0}
                  >
                    <ArrowLeft size={18} /> {t("previousStep")}
                  </button>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "var(--tp-muted, #94a3b8)", display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <ShieldCheck size={16} style={{ color: "#38bdf8" }} /> {t("readOnlyMode")}
                  </span>
                  <button
                    type="button"
                    className="ssa-button ssa-button--secondary"
                    onClick={() => setStep((current) => Math.min(STEPS.length - 1, current + 1))}
                    disabled={step === STEPS.length - 1}
                  >
                    {t("nextStep")} <ArrowRight size={18} />
                  </button>
                </div>
              ) : (
                <div className="ssa-form-actions">
                  <button type="button" className="ssa-button ssa-button--secondary" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0 || isBusy}><ArrowLeft size={18} /> {t("back")}</button>
                  <button type="button" className="ssa-button ssa-button--secondary" onClick={() => saveDraft().catch(() => {})} disabled={!isEditable || isBusy}>{saveMutation.isPending ? <Loader2 className="ssa-spin" size={18} /> : <Save size={18} />} {t("saveDraft")}</button>
                  {step < STEPS.length - 1 ? (
                    <button type="button" className="ssa-button ssa-button--primary" onClick={continueStep} disabled={!isEditable || isBusy}>{t("continue")} <ArrowRight size={18} /></button>
                  ) : (
                    <button type="button" className="ssa-button ssa-button--submit" onClick={submitApplication} disabled={!isEditable || isBusy}>{actionMutation.isPending ? <Loader2 className="ssa-spin" size={18} /> : <Send size={18} />}{status === "revision_requested" ? t("resubmitApplication") : t("submitApplication")}</button>
                  )}
                </div>
              )}
              {application?.workflow?.canCancel && <button type="button" className="ssa-cancel-link" onClick={cancelApplication} disabled={isBusy}>{t("cancelApplication")}</button>}
            </form>
          </div>

          <aside className="ssa-summary">
            <section className="ssa-summary-card">
              <h2>{t("applicationSummary")}</h2>
              <div className="ssa-progress-row">
                <div className="ssa-progress-ring" style={{ "--ssa-progress": `${progress * 3.6}deg` }}>
                  <span><strong>{progress}%</strong><small>{progress === 100 ? t("progressReady") : t("progressCompleted")}</small></span>
                </div>
                <p>
                  {progress === 100
                    ? t("allCompletedMsg")
                    : t("remainingStepsMsg")
                        .replace("{count}", String(STEPS.length - completedCount))
                        .replace("{plural}", STEPS.length - completedCount === 1 ? "" : (lang === "id" ? "" : "s"))}
                  <b>{formatStatus(status)}</b>
                </p>
              </div>
            </section>
            <section className="ssa-summary-card">
              <h2>{t("verificationStatus")}</h2>
              <div className="ssa-verification">
                <CheckCircle2 size={43} />
                <div>
                  <strong>{t("emailVerifiedBadge")}</strong>
                  <span>{form.ownerEmail || application?.applicant?.email || t("verifiedAccount")}</span>
                  <small>{t("identityLinked")}</small>
                </div>
              </div>
            </section>
            <section className="ssa-summary-card">
              <h2>{t("requirementsChecklist")}</h2>
              <div className="ssa-requirements">
                {STEPS.map((entry, index) => (
                  <button type="button" className={step === index ? "is-active" : ""} key={entry.key} onClick={() => setStep(index)}>
                    {stepValidity[index] ? <CheckCircle2 size={16} /> : <span />}
                    {t(entry.titleKey)}
                  </button>
                ))}
              </div>
            </section>
            <section className="ssa-summary-card">
              <h2>{t("reviewTimeline")}</h2>
              <div className="ssa-timeline">
                <span className={status !== "draft" ? "is-done" : "is-active"}>
                  <i>{status !== "draft" ? <Check size={13} /> : "1"}</i>
                  <b>{t("timelineSubmitted")}</b>
                  <small>
                    {application?.submittedAt
                      ? t("timelineSubmittedOn").replace("{date}", new Date(application.submittedAt).toLocaleDateString(lang === "id" ? "id-ID" : "en-US", { month: "short", day: "numeric", year: "numeric" }))
                      : t("timelineEnteredQueue")}
                  </small>
                </span>
                <span className={["submitted", "under_review", "revision_requested"].includes(status) ? (status === "revision_requested" ? "is-active is-warning" : "is-active") : status === "approved" || status === "rejected" ? "is-done" : ""}>
                  <i>{status === "approved" ? <Check size={13} /> : "2"}</i>
                  <b>{t("timelineAdminReview")}</b>
                  <small>
                    {status === "revision_requested"
                      ? t("timelineRevisionNeeded")
                      : ["submitted", "under_review"].includes(status)
                        ? t("timelineUnderReview")
                        : t("timelineUsuallyCompleted")}
                  </small>
                </span>
                <span className={status === "approved" ? "is-done" : ""}>
                  <i>{status === "approved" ? <Check size={13} /> : "3"}</i>
                  <b>{t("timelineActivation")}</b>
                  <small>{status === "approved" ? t("timelineWorkspaceActive") : t("timelinePublishApproved")}</small>
                </span>
              </div>
            </section>
            <section className="ssa-summary-card ssa-summary-help">
              <Headphones size={27} />
              <div>
                <h2>{t("needHelpSide")}</h2>
                <p>{t("supportTeamReady")}</p>
              </div>
              <a href="mailto:support@tpreneurs.com">{t("contactSupport")} <ArrowRight size={16} /></a>
            </section>
          </aside>
        </div>
        <footer className="ssa-footer">
          <span>{t("copyright")}</span>
          <nav>
            <a href="/terms">{t("termsOfService")}</a>
            <a href="/privacy">{t("privacyPolicy")}</a>
          </nav>
        </footer>
      </section>
    </main>
  );
}
