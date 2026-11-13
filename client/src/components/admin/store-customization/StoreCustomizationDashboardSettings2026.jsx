/**
 * StoreCustomizationDashboardSettings2026.jsx
 * Modern 2026 UI/UX Redesign for Admin Store Customization: Dashboard Tab
 * Palette: #034c85 (Deep Navy) & #fe6f05 (Vibrant Orange)
 */

import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  FileText,
  UserCheck,
  Sparkles,
  RotateCcw,
  Save,
  Rocket,
  CheckCircle2,
  Printer,
  Download,
  ShoppingBag,
  Clock,
  Truck,
  ExternalLink,
  ShieldCheck,
  CreditCard,
  KeyRound,
  Eye,
  Info,
} from "lucide-react";
import StoreCustomizationTabNav2026 from "./StoreCustomizationTabNav2026.jsx";
import "./StoreCustomizationDashboardSettings2026.css";

const TP_DASHBOARD_PRESETS = {
  id: {
    dashboard: {
      sectionTitle: "Dasbor Akun",
      dashboardLabel: "Dasbor",
      totalOrdersLabel: "Total Pesanan",
      pendingOrderValue: "Menunggu Diproses",
      processingOrderValue: "Sedang Diproses",
      completeOrderValue: "Pesanan Selesai",
      recentOrderValue: "Pesanan Terbaru",
      myOrderValue: "Pesanan Saya",
      invoiceMessageFirstPartValue: "Terima Kasih Atas Pesanan Anda",
      invoiceMessageLastPartValue:
        "Simpan nomor faktur ini sebagai bukti transaksi resmi karya edupreneur di TP Preneurs.",
      printButtonValue: "Cetak Faktur",
      downloadButtonValue: "Unduh Faktur",
    },
    updateProfile: {
      sectionTitleValue: "Perbarui Profil",
      sectionTitleLabel: "Pengaturan Akun & Profil",
      fullNameLabel: "Nama Lengkap",
      addressLabel: "Alamat Pengiriman Utama",
      phoneMobileLabel: "Nomor HP / WhatsApp",
      emailAddressLabel: "Alamat Email",
      updateButtonValue: "Simpan Perubahan",
      updateButtonLabel: "Tombol Simpan",
      currentPasswordLabel: "Kata Sandi Saat Ini",
      newPasswordLabel: "Kata Sandi Baru",
      changePasswordLabel: "Ubah Kata Sandi",
    },
  },
  en: {
    dashboard: {
      sectionTitle: "Account Dashboard",
      dashboardLabel: "Dashboard",
      totalOrdersLabel: "Total Orders",
      pendingOrderValue: "Pending Orders",
      processingOrderValue: "Processing Orders",
      completeOrderValue: "Completed Orders",
      recentOrderValue: "Recent Orders",
      myOrderValue: "My Orders",
      invoiceMessageFirstPartValue: "Thank You For Your Order",
      invoiceMessageLastPartValue:
        "Keep this invoice reference for tracking and edupreneur project support.",
      printButtonValue: "Print Invoice",
      downloadButtonValue: "Download Invoice",
    },
    updateProfile: {
      sectionTitleValue: "Update Profile",
      sectionTitleLabel: "Account Profile Settings",
      fullNameLabel: "Full Name",
      addressLabel: "Primary Shipping Address",
      phoneMobileLabel: "Phone / WhatsApp",
      emailAddressLabel: "Email Address",
      updateButtonValue: "Save Changes",
      updateButtonLabel: "Save Button",
      currentPasswordLabel: "Current Password",
      newPasswordLabel: "New Password",
      changePasswordLabel: "Change Password",
    },
  },
};

export default function StoreCustomizationDashboardSettings2026({
  activeTab = "dashboardSetting",
  onTabChange,
  dashboardSetting = {},
  onChangeDashboardSettingField,
  onSave,
  onPublish,
  onReset,
  isSaving = false,
  isPublishing = false,
  isLoading = false,
  meta = {},
}) {
  const { i18n } = useTranslation();
  const isIndo = Boolean(i18n.language?.toLowerCase().startsWith("id"));

  const [activeSubTab, setActiveSubTab] = useState("overview"); // 'overview' | 'invoice' | 'profile'
  const [activePreviewMode, setActivePreviewMode] = useState("dashboard"); // 'dashboard' | 'invoice' | 'profile'

  const dashboardData = dashboardSetting.dashboard || {};
  const profileData = dashboardSetting.updateProfile || {};

  // Apply TP Preneurs Preset
  const handleApplyPreset = () => {
    const preset = isIndo ? TP_DASHBOARD_PRESETS.id : TP_DASHBOARD_PRESETS.en;
    const confirmMsg = isIndo
      ? "Terapkan preset teks resmi Dasbor & Profil TP Preneurs?"
      : "Apply official TP Preneurs Dashboard & Profile preset copy?";
    if (window.confirm(confirmMsg)) {
      Object.entries(preset.dashboard).forEach(([field, val]) => {
        onChangeDashboardSettingField("dashboard", field, val);
      });
      Object.entries(preset.updateProfile).forEach(([field, val]) => {
        onChangeDashboardSettingField("updateProfile", field, val);
      });
    }
  };

  return (
    <div className="db26-wrap">
      {/* Header & Main Navigation */}
      <div className="db26-header-bar">
        <div className="db26-header-top">
          <div className="db26-title-group">
            <div className="db26-title-icon">
              <LayoutDashboard className="h-6 w-6" />
            </div>
            <div>
              <h1 className="db26-title">
                {isIndo
                  ? "Kustomisasi Dasbor & Akun Pelanggan"
                  : "Customer Dashboard & Account Settings"}
              </h1>
              <p className="db26-subtitle">
                {isIndo
                  ? "Kelola teks antarmuka dasbor akun, kartu statistik pesanan, format faktur, dan formulir profil pelanggan."
                  : "Customize text copy for customer dashboard, order metric cards, invoice receipts, and profile forms."}
              </p>
            </div>
          </div>

          <div className="db26-header-actions">
            <button
              type="button"
              onClick={handleApplyPreset}
              className="db26-btn-preset"
              title={isIndo ? "Muat teks rekomendasi resmi" : "Load recommended preset"}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{isIndo ? "Muat Preset TP Preneurs" : "Load TP Preset"}</span>
            </button>
          </div>
        </div>

        {/* Unified Tab Navigation Bar */}
        <StoreCustomizationTabNav2026
          activeTab={activeTab}
          onTabChange={onTabChange}
        />

        {/* Sub-Tabs / Quick Jump */}
        <div className="db26-subtabs">
          <button
            type="button"
            onClick={() => {
              setActiveSubTab("overview");
              setActivePreviewMode("dashboard");
            }}
            className={`db26-subtab-btn ${activeSubTab === "overview" ? "is-active" : ""}`}
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            <span>{isIndo ? "1. Dasbor & Statistik Pesanan" : "1. Dashboard & Order Stats"}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveSubTab("invoice");
              setActivePreviewMode("invoice");
            }}
            className={`db26-subtab-btn ${activeSubTab === "invoice" ? "is-active" : ""}`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>{isIndo ? "2. Faktur & Resi Transaksi" : "2. Invoice & Receipts"}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveSubTab("profile");
              setActivePreviewMode("profile");
            }}
            className={`db26-subtab-btn ${activeSubTab === "profile" ? "is-active" : ""}`}
          >
            <UserCheck className="h-3.5 w-3.5" />
            <span>{isIndo ? "3. Formulir Profil & Kata Sandi" : "3. Profile & Passwords"}</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Grid: Form Controls (Left) & Live Simulator (Right) */}
      <div className="db26-grid">
        {/* Left Column: Form Controls */}
        <div className="space-y-6">
          {/* Section 1: Dashboard Overview & Metric Cards */}
          {(activeSubTab === "overview" || activeSubTab === "all") && (
            <div className="db26-card">
              <div className="db26-card-header">
                <div className="db26-card-title-group">
                  <div className="db26-card-icon">
                    <LayoutDashboard className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="db26-card-title">
                      {isIndo ? "Dasbor & Metrik Pesanan" : "Dashboard & Order Metrics"}
                    </h2>
                  </div>
                </div>
                <span className="db26-badge-sync">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>/user/dashboard</span>
                </span>
              </div>

              {/* Main Titles */}
              <div className="db26-form-grid db26-form-grid-2">
                <div className="db26-form-group">
                  <label htmlFor="db26-section-title" className="db26-label">
                    {isIndo ? "Judul Halaman Dasbor" : "Dashboard Section Title"}
                  </label>
                  <input
                    id="db26-section-title"
                    type="text"
                    value={dashboardData.sectionTitle || ""}
                    onChange={(e) =>
                      onChangeDashboardSettingField("dashboard", "sectionTitle", e.target.value)
                    }
                    placeholder="Dasbor Akun"
                    className="db26-input"
                  />
                  <span className="db26-hint">
                    {isIndo ? "Muncul di header utama halaman /user/dashboard" : "Appears as main header on /user/dashboard"}
                  </span>
                </div>

                <div className="db26-form-group">
                  <label htmlFor="db26-dashboard-label" className="db26-label">
                    {isIndo ? "Label Menu Navigasi 'Dashboard'" : "Dashboard Menu Label"}
                  </label>
                  <input
                    id="db26-dashboard-label"
                    type="text"
                    value={dashboardData.dashboardLabel || ""}
                    onChange={(e) =>
                      onChangeDashboardSettingField("dashboard", "dashboardLabel", e.target.value)
                    }
                    placeholder="Dasbor"
                    className="db26-input"
                  />
                  <span className="db26-hint">
                    {isIndo ? "Label menu di sidebar akun & dropdown navbar" : "Nav menu label in account sidebar & topbar"}
                  </span>
                </div>
              </div>

              {/* Order Status Stat Cards */}
              <div className="pt-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-3">
                  {isIndo ? "Label 4 Kartu Statistik Pesanan" : "4 Order Metric Cards Labels"}
                </span>

                <div className="db26-form-grid db26-form-grid-2">
                  <div className="db26-form-group">
                    <label htmlFor="db26-total-orders" className="db26-label">
                      {isIndo ? "Total Pesanan (Semua)" : "Total Orders Card"}
                    </label>
                    <input
                      id="db26-total-orders"
                      type="text"
                      value={dashboardData.totalOrdersLabel || ""}
                      onChange={(e) =>
                        onChangeDashboardSettingField("dashboard", "totalOrdersLabel", e.target.value)
                      }
                      placeholder="Total Pesanan"
                      className="db26-input"
                    />
                  </div>

                  <div className="db26-form-group">
                    <label htmlFor="db26-pending-order" className="db26-label">
                      {isIndo ? "Pesanan Menunggu Pembayaran" : "Pending Orders Card"}
                    </label>
                    <input
                      id="db26-pending-order"
                      type="text"
                      value={dashboardData.pendingOrderValue || ""}
                      onChange={(e) =>
                        onChangeDashboardSettingField("dashboard", "pendingOrderValue", e.target.value)
                      }
                      placeholder="Menunggu Diproses"
                      className="db26-input"
                    />
                  </div>

                  <div className="db26-form-group">
                    <label htmlFor="db26-processing-order" className="db26-label">
                      {isIndo ? "Pesanan Sedang Diproses" : "Processing Orders Card"}
                    </label>
                    <input
                      id="db26-processing-order"
                      type="text"
                      value={dashboardData.processingOrderValue || ""}
                      onChange={(e) =>
                        onChangeDashboardSettingField("dashboard", "processingOrderValue", e.target.value)
                      }
                      placeholder="Sedang Diproses"
                      className="db26-input"
                    />
                  </div>

                  <div className="db26-form-group">
                    <label htmlFor="db26-complete-order" className="db26-label">
                      {isIndo ? "Pesanan Selesai / Terkirim" : "Completed Orders Card"}
                    </label>
                    <input
                      id="db26-complete-order"
                      type="text"
                      value={dashboardData.completeOrderValue || ""}
                      onChange={(e) =>
                        onChangeDashboardSettingField("dashboard", "completeOrderValue", e.target.value)
                      }
                      placeholder="Pesanan Selesai"
                      className="db26-input"
                    />
                  </div>
                </div>
              </div>

              {/* Table Header & My Orders Menu */}
              <div className="db26-form-grid db26-form-grid-2 pt-1">
                <div className="db26-form-group">
                  <label htmlFor="db26-recent-order" className="db26-label">
                    {isIndo ? "Judul Tabel Pesanan Terbaru" : "Recent Orders Table Title"}
                  </label>
                  <input
                    id="db26-recent-order"
                    type="text"
                    value={dashboardData.recentOrderValue || ""}
                    onChange={(e) =>
                      onChangeDashboardSettingField("dashboard", "recentOrderValue", e.target.value)
                    }
                    placeholder="Pesanan Terbaru"
                    className="db26-input"
                  />
                </div>

                <div className="db26-form-group">
                  <label htmlFor="db26-my-order" className="db26-label">
                    {isIndo ? "Label Menu 'Pesanan Saya'" : "My Orders Menu Label"}
                  </label>
                  <input
                    id="db26-my-order"
                    type="text"
                    value={dashboardData.myOrderValue || ""}
                    onChange={(e) =>
                      onChangeDashboardSettingField("dashboard", "myOrderValue", e.target.value)
                    }
                    placeholder="Pesanan Saya"
                    className="db26-input"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section 2: Invoice & Receipt Messages */}
          {(activeSubTab === "invoice" || activeSubTab === "all") && (
            <div className="db26-card">
              <div className="db26-card-header">
                <div className="db26-card-title-group">
                  <div className="db26-card-icon" style={{ background: "rgba(254, 111, 5, 0.12)", color: "#fe6f05" }}>
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="db26-card-title">
                      {isIndo ? "Faktur & Tanda Terima Pesanan" : "Invoice & Receipt Copy"}
                    </h2>
                  </div>
                </div>
                <span className="db26-badge-sync">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>/user/order/:id</span>
                </span>
              </div>

              <div className="db26-form-group">
                <label htmlFor="db26-inv-first" className="db26-label">
                  {isIndo ? "Salam Pembuka Faktur (Baris 1)" : "Invoice Heading Greeting (Part 1)"}
                </label>
                <input
                  id="db26-inv-first"
                  type="text"
                  value={dashboardData.invoiceMessageFirstPartValue || ""}
                  onChange={(e) =>
                    onChangeDashboardSettingField("dashboard", "invoiceMessageFirstPartValue", e.target.value)
                  }
                  placeholder="Terima Kasih Atas Pesanan Anda"
                  className="db26-input"
                />
                <span className="db26-hint">
                  {isIndo ? "Contoh: 'Thank You' atau 'Terima Kasih Atas Pesanan Anda'" : "Example: 'Thank You' or 'Thank You For Shopping With Us'"}
                </span>
              </div>

              <div className="db26-form-group">
                <label htmlFor="db26-inv-last" className="db26-label">
                  {isIndo ? "Pesan Konfirmasi Faktur (Baris 2)" : "Invoice Confirmation Message (Part 2)"}
                </label>
                <input
                  id="db26-inv-last"
                  type="text"
                  value={dashboardData.invoiceMessageLastPartValue || ""}
                  onChange={(e) =>
                    onChangeDashboardSettingField("dashboard", "invoiceMessageLastPartValue", e.target.value)
                  }
                  placeholder="Pesanan Anda telah kami terima !"
                  className="db26-input"
                />
                <span className="db26-hint">
                  {isIndo ? "Tampil tepat di bawah ucapan terima kasih pada cetakan faktur" : "Displayed right below the greeting on the invoice receipt"}
                </span>
              </div>

              <div className="db26-form-grid db26-form-grid-2 pt-1">
                <div className="db26-form-group">
                  <label htmlFor="db26-print-btn" className="db26-label">
                    <Printer className="h-3.5 w-3.5 text-slate-400" />
                    <span>{isIndo ? "Teks Tombol Cetak Faktur" : "Print Invoice Button Text"}</span>
                  </label>
                  <input
                    id="db26-print-btn"
                    type="text"
                    value={dashboardData.printButtonValue || ""}
                    onChange={(e) =>
                      onChangeDashboardSettingField("dashboard", "printButtonValue", e.target.value)
                    }
                    placeholder="Cetak Faktur"
                    className="db26-input"
                  />
                </div>

                <div className="db26-form-group">
                  <label htmlFor="db26-download-btn" className="db26-label">
                    <Download className="h-3.5 w-3.5 text-slate-400" />
                    <span>{isIndo ? "Teks Tombol Unduh Faktur" : "Download Invoice Button Text"}</span>
                  </label>
                  <input
                    id="db26-download-btn"
                    type="text"
                    value={dashboardData.downloadButtonValue || ""}
                    onChange={(e) =>
                      onChangeDashboardSettingField("dashboard", "downloadButtonValue", e.target.value)
                    }
                    placeholder="Unduh Faktur"
                    className="db26-input"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section 3: Profile Form & Password Settings */}
          {(activeSubTab === "profile" || activeSubTab === "all") && (
            <div className="db26-card">
              <div className="db26-card-header">
                <div className="db26-card-title-group">
                  <div className="db26-card-icon">
                    <UserCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="db26-card-title">
                      {isIndo ? "Formulir Profil & Keamanan Akun" : "Profile Form & Account Security"}
                    </h2>
                  </div>
                </div>
                <span className="db26-badge-sync">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>/user/update-profile</span>
                </span>
              </div>

              {/* Profile Page Title & Button */}
              <div className="db26-form-grid db26-form-grid-2">
                <div className="db26-form-group">
                  <label htmlFor="db26-prof-title" className="db26-label">
                    {isIndo ? "Judul Halaman Profil" : "Profile Page Title"}
                  </label>
                  <input
                    id="db26-prof-title"
                    type="text"
                    value={profileData.sectionTitleValue || ""}
                    onChange={(e) =>
                      onChangeDashboardSettingField("updateProfile", "sectionTitleValue", e.target.value)
                    }
                    placeholder="Perbarui Profil"
                    className="db26-input"
                  />
                </div>

                <div className="db26-form-group">
                  <label htmlFor="db26-prof-btn" className="db26-label">
                    {isIndo ? "Teks Tombol Simpan Profil" : "Update Profile Button Text"}
                  </label>
                  <input
                    id="db26-prof-btn"
                    type="text"
                    value={profileData.updateButtonValue || ""}
                    onChange={(e) =>
                      onChangeDashboardSettingField("updateProfile", "updateButtonValue", e.target.value)
                    }
                    placeholder="Simpan Perubahan"
                    className="db26-input"
                  />
                </div>
              </div>

              {/* Profile Form Input Labels */}
              <div className="pt-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-3">
                  {isIndo ? "Label Input Biodata Pelanggan" : "Customer Profile Input Labels"}
                </span>

                <div className="db26-form-grid db26-form-grid-2">
                  <div className="db26-form-group">
                    <label htmlFor="db26-full-name" className="db26-label">
                      {isIndo ? "Label Kolom 'Nama Lengkap'" : "Full Name Label"}
                    </label>
                    <input
                      id="db26-full-name"
                      type="text"
                      value={profileData.fullNameLabel || ""}
                      onChange={(e) =>
                        onChangeDashboardSettingField("updateProfile", "fullNameLabel", e.target.value)
                      }
                      placeholder="Nama Lengkap"
                      className="db26-input"
                    />
                  </div>

                  <div className="db26-form-group">
                    <label htmlFor="db26-address" className="db26-label">
                      {isIndo ? "Label Kolom 'Alamat'" : "Address Label"}
                    </label>
                    <input
                      id="db26-address"
                      type="text"
                      value={profileData.addressLabel || ""}
                      onChange={(e) =>
                        onChangeDashboardSettingField("updateProfile", "addressLabel", e.target.value)
                      }
                      placeholder="Alamat Pengiriman Utama"
                      className="db26-input"
                    />
                  </div>

                  <div className="db26-form-group">
                    <label htmlFor="db26-phone" className="db26-label">
                      {isIndo ? "Label Kolom 'Nomor HP/Telepon'" : "Phone / Mobile Label"}
                    </label>
                    <input
                      id="db26-phone"
                      type="text"
                      value={profileData.phoneMobileLabel || ""}
                      onChange={(e) =>
                        onChangeDashboardSettingField("updateProfile", "phoneMobileLabel", e.target.value)
                      }
                      placeholder="Nomor HP / WhatsApp"
                      className="db26-input"
                    />
                  </div>

                  <div className="db26-form-group">
                    <label htmlFor="db26-email" className="db26-label">
                      {isIndo ? "Label Kolom 'Alamat Email'" : "Email Address Label"}
                    </label>
                    <input
                      id="db26-email"
                      type="text"
                      value={profileData.emailAddressLabel || ""}
                      onChange={(e) =>
                        onChangeDashboardSettingField("updateProfile", "emailAddressLabel", e.target.value)
                      }
                      placeholder="Alamat Email"
                      className="db26-input"
                    />
                  </div>
                </div>
              </div>

              {/* Password Labels */}
              <div className="pt-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-3">
                  {isIndo ? "Label Keamanan & Ubah Kata Sandi" : "Security & Password Labels"}
                </span>

                <div className="db26-form-grid db26-form-grid-2">
                  <div className="db26-form-group">
                    <label htmlFor="db26-curr-pass" className="db26-label">
                      <KeyRound className="h-3.5 w-3.5 text-slate-400" />
                      <span>{isIndo ? "Label 'Kata Sandi Saat Ini'" : "Current Password Label"}</span>
                    </label>
                    <input
                      id="db26-curr-pass"
                      type="text"
                      value={profileData.currentPasswordLabel || ""}
                      onChange={(e) =>
                        onChangeDashboardSettingField("updateProfile", "currentPasswordLabel", e.target.value)
                      }
                      placeholder="Kata Sandi Saat Ini"
                      className="db26-input"
                    />
                  </div>

                  <div className="db26-form-group">
                    <label htmlFor="db26-new-pass" className="db26-label">
                      <KeyRound className="h-3.5 w-3.5 text-slate-400" />
                      <span>{isIndo ? "Label 'Kata Sandi Baru'" : "New Password Label"}</span>
                    </label>
                    <input
                      id="db26-new-pass"
                      type="text"
                      value={profileData.newPasswordLabel || ""}
                      onChange={(e) =>
                        onChangeDashboardSettingField("updateProfile", "newPasswordLabel", e.target.value)
                      }
                      placeholder="Kata Sandi Baru"
                      className="db26-input"
                    />
                  </div>

                  <div className="db26-form-group sm:col-span-2">
                    <label htmlFor="db26-change-pass" className="db26-label">
                      <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
                      <span>{isIndo ? "Teks Tombol / Menu 'Ubah Kata Sandi'" : "Change Password Menu / Button"}</span>
                    </label>
                    <input
                      id="db26-change-pass"
                      type="text"
                      value={profileData.changePasswordLabel || ""}
                      onChange={(e) =>
                        onChangeDashboardSettingField("updateProfile", "changePasswordLabel", e.target.value)
                      }
                      placeholder="Ubah Kata Sandi"
                      className="db26-input"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live 1:1 Simulator & Synchronization Target Map */}
        <div className="space-y-6">
          {/* Live Simulator Card */}
          <div className="db26-card">
            <div className="db26-card-header">
              <div className="db26-card-title-group">
                <div className="db26-card-icon">
                  <Eye className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="db26-card-title">
                    {isIndo ? "Simulasi Live Antarmuka" : "Live Storefront Simulator"}
                  </h2>
                </div>
              </div>

              {/* Switch View in Simulator */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setActivePreviewMode("dashboard")}
                  className={`text-xs px-2.5 py-1 rounded-md font-semibold transition ${
                    activePreviewMode === "dashboard"
                      ? "bg-[var(--db26-navy)] text-white"
                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  {isIndo ? "Dasbor" : "Dashboard"}
                </button>
                <button
                  type="button"
                  onClick={() => setActivePreviewMode("invoice")}
                  className={`text-xs px-2.5 py-1 rounded-md font-semibold transition ${
                    activePreviewMode === "invoice"
                      ? "bg-[var(--db26-navy)] text-white"
                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  {isIndo ? "Faktur" : "Invoice"}
                </button>
                <button
                  type="button"
                  onClick={() => setActivePreviewMode("profile")}
                  className={`text-xs px-2.5 py-1 rounded-md font-semibold transition ${
                    activePreviewMode === "profile"
                      ? "bg-[var(--db26-navy)] text-white"
                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  {isIndo ? "Profil" : "Profile"}
                </button>
              </div>
            </div>

            {/* View 1: Customer Account Dashboard Simulation */}
            {activePreviewMode === "dashboard" && (
              <div className="db26-preview-container">
                <div className="db26-preview-topbar">
                  <span className="db26-preview-brand">
                    <span className="h-2 w-2 rounded-full bg-[var(--db26-orange)]" />
                    TP PRENEURS &bull; {dashboardData.dashboardLabel || "Dasbor"}
                  </span>
                  <span className="text-[11px] text-slate-400">/user/dashboard</span>
                </div>

                <div className="db26-preview-body">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {dashboardData.sectionTitle || "Dasbor Akun"}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {isIndo
                          ? "Selamat datang kembali, Mahasiswa Preneur."
                          : "Welcome back, Edupreneur Student."}
                      </p>
                    </div>
                  </div>

                  {/* 4 Stat Cards Simulation */}
                  <div className="db26-preview-stats">
                    <div className="db26-stat-card-mini">
                      <div className="db26-stat-icon-mini is-navy">
                        <ShoppingBag className="h-4 w-4" />
                      </div>
                      <div className="db26-stat-text-mini">
                        <span className="db26-stat-label-mini">
                          {dashboardData.totalOrdersLabel || "Total Pesanan"}
                        </span>
                        <strong className="db26-stat-num-mini">12</strong>
                      </div>
                    </div>

                    <div className="db26-stat-card-mini">
                      <div className="db26-stat-icon-mini is-orange">
                        <Clock className="h-4 w-4" />
                      </div>
                      <div className="db26-stat-text-mini">
                        <span className="db26-stat-label-mini">
                          {dashboardData.pendingOrderValue || "Menunggu Diproses"}
                        </span>
                        <strong className="db26-stat-num-mini">2</strong>
                      </div>
                    </div>

                    <div className="db26-stat-card-mini">
                      <div className="db26-stat-icon-mini is-navy">
                        <Truck className="h-4 w-4" />
                      </div>
                      <div className="db26-stat-text-mini">
                        <span className="db26-stat-label-mini">
                          {dashboardData.processingOrderValue || "Sedang Diproses"}
                        </span>
                        <strong className="db26-stat-num-mini">1</strong>
                      </div>
                    </div>

                    <div className="db26-stat-card-mini">
                      <div className="db26-stat-icon-mini is-emerald">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <div className="db26-stat-text-mini">
                        <span className="db26-stat-label-mini">
                          {dashboardData.completeOrderValue || "Pesanan Selesai"}
                        </span>
                        <strong className="db26-stat-num-mini">9</strong>
                      </div>
                    </div>
                  </div>

                  {/* Recent Orders Section Simulation */}
                  <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {dashboardData.recentOrderValue || "Pesanan Terbaru"}
                      </span>
                      <span className="text-[11px] font-semibold text-[var(--db26-navy)] hover:underline cursor-pointer dark:text-sky-400">
                        {dashboardData.myOrderValue || "Pesanan Saya"} &rarr;
                      </span>
                    </div>
                    <div className="pt-2 text-[11px] text-slate-500 flex items-center justify-between">
                      <span>#INV-TP-2026-0081</span>
                      <span className="text-emerald-600 font-semibold">Rp 175.000</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* View 2: Invoice Receipt Simulation */}
            {activePreviewMode === "invoice" && (
              <div className="db26-invoice-sheet">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <div className="h-6 w-6 rounded bg-[var(--db26-navy)] text-white flex items-center justify-center font-bold text-xs">
                      TP
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      FAKTUR RESMI
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">#INV-88219</span>
                </div>

                <div>
                  <h4 className="db26-invoice-msg-first">
                    {dashboardData.invoiceMessageFirstPartValue || "Terima Kasih Atas Pesanan Anda"}
                  </h4>
                  <p className="db26-invoice-msg-last mt-0.5">
                    {dashboardData.invoiceMessageLastPartValue ||
                      "Pesanan Anda telah kami terima dan sedang diproses !"}
                  </p>
                </div>

                <div className="rounded-lg bg-slate-50 p-2.5 text-xs text-slate-600 border border-slate-200/60 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300">
                  <div className="flex justify-between">
                    <span>1x Buku Inovasi Teknologi Pangan</span>
                    <span className="font-semibold">Rp 120.000</span>
                  </div>
                  <div className="flex justify-between mt-1 text-[11px] text-slate-400">
                    <span>Ongkos Kirim J&T</span>
                    <span>Rp 15.000</span>
                  </div>
                </div>

                <div className="db26-invoice-actions-row">
                  <button type="button" className="db26-invoice-btn-mini is-primary">
                    <Printer className="h-3 w-3" />
                    <span>{dashboardData.printButtonValue || "Cetak Faktur"}</span>
                  </button>
                  <button type="button" className="db26-invoice-btn-mini">
                    <Download className="h-3 w-3" />
                    <span>{dashboardData.downloadButtonValue || "Unduh Faktur"}</span>
                  </button>
                </div>
              </div>
            )}

            {/* View 3: Profile Form Simulation */}
            {activePreviewMode === "profile" && (
              <div className="db26-profile-mini-box">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {profileData.sectionTitleValue || "Perbarui Profil"}
                  </span>
                  <span className="text-[10px] text-slate-400">/user/update-profile</span>
                </div>

                <div className="db26-profile-mini-row">
                  <div className="db26-profile-mock-field">
                    <span className="db26-profile-mock-label">
                      {profileData.fullNameLabel || "Nama Lengkap"}
                    </span>
                    <span className="db26-profile-mock-val truncate">Ahmad Preneur</span>
                  </div>
                  <div className="db26-profile-mock-field">
                    <span className="db26-profile-mock-label">
                      {profileData.phoneMobileLabel || "Nomor HP"}
                    </span>
                    <span className="db26-profile-mock-val truncate">+62 821-8866-xxxx</span>
                  </div>
                </div>

                <div className="db26-profile-mock-field">
                  <span className="db26-profile-mock-label">
                    {profileData.emailAddressLabel || "Alamat Email"}
                  </span>
                  <span className="db26-profile-mock-val truncate">ahmad@tppreneurs.com</span>
                </div>

                <div className="db26-profile-mock-field">
                  <span className="db26-profile-mock-label">
                    {profileData.addressLabel || "Alamat Pengiriman"}
                  </span>
                  <span className="db26-profile-mock-val truncate">Jl. Perintis Kemerdekaan KM 10, Makassar</span>
                </div>

                <div className="pt-2 flex justify-end">
                  <button type="button" className="db26-invoice-btn-mini is-primary">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>{profileData.updateButtonValue || "Simpan Perubahan"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Architecture & Target Page Synchronization Guide Card */}
          <div className="db26-card">
            <div className="db26-card-header">
              <div className="db26-card-title-group">
                <div className="db26-card-icon">
                  <Info className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="db26-card-title">
                    {isIndo ? "Peta Sinkronisasi Halaman Klien" : "Client Storefront Sync Map"}
                  </h2>
                </div>
              </div>
            </div>

            <div className="db26-sync-guide">
              <div className="db26-sync-item">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800 dark:text-slate-100 block">
                    1. /user/dashboard (Dasbor Pelanggan)
                  </strong>
                  <span className="text-slate-500 dark:text-slate-400">
                    {isIndo
                      ? "Menyinkronkan Judul Dasbor, 4 Kartu Metrik (Total, Menunggu, Proses, Selesai), dan Tabel Pesanan Terbaru."
                      : "Syncs Dashboard Title, 4 Metric Cards (Total, Pending, Processing, Complete), and Recent Orders heading."}
                  </span>
                </div>
              </div>

              <div className="db26-sync-item">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800 dark:text-slate-100 block">
                    2. /user/* (Sidebar Akun & Dropdown Topbar)
                  </strong>
                  <span className="text-slate-500 dark:text-slate-400">
                    {isIndo
                      ? "Menyinkronkan teks tombol navigasi: Dasbor, Pesanan Saya, Perbarui Profil, dan Ubah Kata Sandi."
                      : "Syncs sidebar & topbar dropdown menu items: Dashboard, My Orders, Update Profile, and Change Password."}
                  </span>
                </div>
              </div>

              <div className="db26-sync-item">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800 dark:text-slate-100 block">
                    3. /user/order/:id & Cetak Faktur PDF
                  </strong>
                  <span className="text-slate-500 dark:text-slate-400">
                    {isIndo
                      ? "Menyinkronkan teks Salam Pembuka & Pesan Penutup Faktur, serta tombol Cetak dan Unduh Faktur."
                      : "Syncs invoice greeting header, confirmation message, and Print/Download invoice buttons."}
                  </span>
                </div>
              </div>

              <div className="db26-sync-item">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800 dark:text-slate-100 block">
                    4. /user/update-profile & /user/change-password
                  </strong>
                  <span className="text-slate-500 dark:text-slate-400">
                    {isIndo
                      ? "Menyinkronkan label Nama, Alamat, HP, Email, tombol Simpan, serta label Kata Sandi."
                      : "Syncs field labels for Name, Address, Phone, Email, Save Profile button, and Password labels."}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="db26-bottom-bar">
        <div className="db26-bottom-inner">
          <div className="db26-bottom-status">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              {meta?.updatedAt
                ? isIndo
                  ? `Terakhir diperbarui: ${new Date(meta.updatedAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}`
                  : `Last updated: ${new Date(meta.updatedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}`
                : isIndo
                ? "Draf dasbor siap disimpan atau dipublikasikan"
                : "Dashboard draft ready to save or publish"}
            </span>
          </div>

          <div className="db26-bottom-actions">
            {onReset ? (
              <button
                type="button"
                onClick={onReset}
                disabled={isLoading || isSaving || isPublishing}
                className="db26-btn-reset"
                title={isIndo ? "Kembalikan ke nilai awal" : "Reset to defaults"}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>{isIndo ? "Atur Ulang" : "Reset"}</span>
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => onSave?.({ publish: false })}
              disabled={isLoading || isSaving || isPublishing}
              className="db26-btn-save"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{isSaving ? (isIndo ? "Menyimpan..." : "Saving...") : isIndo ? "Simpan Draf" : "Save Draft"}</span>
            </button>

            <button
              type="button"
              onClick={onPublish}
              disabled={isLoading || isSaving || isPublishing}
              className="db26-btn-publish"
            >
              <Rocket className="h-3.5 w-3.5" />
              <span>{isPublishing ? (isIndo ? "Menerbitkan..." : "Publishing...") : isIndo ? "Publikasikan" : "Publish Draft"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

