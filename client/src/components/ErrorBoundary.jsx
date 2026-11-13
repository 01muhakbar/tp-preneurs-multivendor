import React from "react";
import {
  AlertTriangle,
  RefreshCw,
  Home,
  ArrowLeft,
  Mail,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Terminal,
  Bug,
  Globe,
} from "lucide-react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      copied: false,
      isIndo: this.getInitialLang(),
    };
  }

  getInitialLang = () => {
    try {
      if (typeof window === "undefined") return true;
      const stored =
        localStorage.getItem("store_language") ||
        localStorage.getItem("admin_locale") ||
        localStorage.getItem("i18nextLng");
      if (stored) {
        const norm = stored.toLowerCase();
        if (norm.includes("en") || norm === "english") return false;
        if (norm.includes("id") || norm === "indonesia") return true;
      }
      return true;
    } catch {
      return true;
    }
  };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[ErrorBoundary caught an error]", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    const isAdmin =
      typeof window !== "undefined" &&
      window.location.pathname.startsWith("/admin");
    window.location.href = isAdmin ? "/admin" : "/";
  };

  handleGoBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
    } else {
      this.handleGoHome();
    }
  };

  handleToggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  handleToggleLang = () => {
    this.setState((prev) => ({ isIndo: !prev.isIndo }));
  };

  buildErrorReportText = (isEmail = false) => {
    const { error, errorInfo } = this.state;
    const time = new Date().toLocaleString("id-ID", { timeZoneName: "short" });
    const url = typeof window !== "undefined" ? window.location.href : "-";
    const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "-";
    const errName = error?.name || "Error";
    const errMsg = error?.message || String(error || "Unknown Error");
    const compStack = errorInfo?.componentStack
      ? errorInfo.componentStack.trim().slice(0, 1200)
      : "";
    const errStack = error?.stack ? error.stack.slice(0, 1200) : "";

    if (isEmail) {
      return (
`Halo Tim Pengembang / Support TP Preneurs,

Saya menemukan kendala teknis saat mengakses halaman berikut:

• URL Halaman : ${url}
• Waktu Kejadian: ${time}
• Jenis Error   : ${errName}
• Pesan Error   : ${errMsg}

--- DETAIL TEKNIS (COMPONENT STACK) ---
${compStack || errStack || "Tidak ada detail stack."}

--- INFORMASI PERANGKAT & BROWSER ---
• User Agent   : ${userAgent}

Catatan Pengguna (Opsional):
[Jelaskan apa yang Anda lakukan sebelum kendala ini muncul]`
      );
    }

    return (
`TP PRENEURS BUG REPORT
URL: ${url}
Waktu: ${time}
Error: ${errName} - ${errMsg}
Stack:
${compStack || errStack || "No stack trace"}
User-Agent: ${userAgent}`
    );
  };

  handleCopyError = () => {
    const textToCopy = this.buildErrorReportText(false);
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        this.setState({ copied: true });
        setTimeout(() => this.setState({ copied: false }), 2500);
      });
    }
  };

  handleReportEmail = () => {
    const { error } = this.state;
    const pathname = typeof window !== "undefined" ? window.location.pathname : "";
    const errName = error?.name || "Error";
    const subject = encodeURIComponent(`[Bug Report TP Preneurs] ${errName} di ${pathname}`);
    const body = encodeURIComponent(this.buildErrorReportText(true));
    window.location.href = `mailto:tppreneurs@gmail.com?subject=${subject}&body=${body}`;
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorInfo, showDetails, copied, isIndo } = this.state;
      const errorName = error?.name || "ApplicationError";
      const errorMessage = error?.message || String(error || (isIndo ? "Terjadi kesalahan tidak terduga." : "An unexpected error occurred."));
      const pathname = typeof window !== "undefined" ? window.location.pathname : "";

      return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-[#081424] text-slate-100 font-sans">
          <div className="max-w-xl w-full bg-[#0d1e34] border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden relative transition-all">
            {/* Top decorative gradient bar */}
            <div className="h-2 w-full bg-gradient-to-r from-[#034c85] via-[#38bdf8] to-[#fe6f05]" />

            <div className="p-6 sm:p-8">
              {/* Header bar with icon and language toggle */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center shadow-inner">
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold tracking-wider uppercase text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20">
                      {isIndo ? "Kendala Tampilan" : "Display Issue"}
                    </span>
                    <h2 className="text-xl font-black text-white mt-1">
                      {isIndo ? "Halaman Mengalami Kendala" : "Something Went Wrong"}
                    </h2>
                  </div>
                </div>

                {/* Language Switcher Pill */}
                <button
                  type="button"
                  onClick={this.handleToggleLang}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700 transition"
                  title={isIndo ? "Ganti ke Bahasa Inggris" : "Switch to Indonesian"}
                >
                  <Globe size={13} className="text-[#38bdf8]" />
                  <span>{isIndo ? "ID" : "EN"}</span>
                </button>
              </div>

              {/* Concise, calming explanation */}
              <p className="text-sm text-slate-300 leading-relaxed mb-5">
                {isIndo
                  ? "Sistem mendeteksi adanya kendala saat memuat elemen di halaman ini. Akun dan data Anda tetap aman. Silakan muat ulang halaman atau kembali ke beranda."
                  : "We encountered an unexpected issue rendering elements on this page. Your account and data remain safe. Please refresh or return to the home page."}
              </p>

              {/* Actual Brief Error Box for Instant Diagnosis */}
              <div className="mb-6 rounded-2xl bg-[#081424] border border-slate-700/70 p-4">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Terminal size={14} className="text-[#fe6f05]" />
                    {isIndo ? "Ringkasan Error Sebenarnya:" : "Actual Error Summary:"}
                  </span>
                  <span className="font-mono text-[11px] text-[#38bdf8] truncate max-w-[180px]">
                    {pathname}
                  </span>
                </div>

                <div className="font-mono text-xs text-rose-300/90 break-words leading-relaxed bg-black/20 p-2.5 rounded-xl border border-rose-500/20">
                  <span className="font-bold text-rose-400">{errorName}: </span>
                  {errorMessage}
                </div>

                {/* Toggle & Copy buttons */}
                <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={this.handleToggleDetails}
                    className="inline-flex items-center gap-1 text-slate-400 hover:text-white transition font-medium"
                  >
                    {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    {showDetails
                      ? isIndo
                        ? "Sembunyikan Rincian Teknis"
                        : "Hide Technical Details"
                      : isIndo
                        ? "Lihat Rincian Teknis (Stack)"
                        : "View Technical Details (Stack)"}
                  </button>

                  <button
                    type="button"
                    onClick={this.handleCopyError}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition"
                  >
                    {copied ? (
                      <>
                        <Check size={13} className="text-emerald-400" />
                        <span className="text-emerald-400">{isIndo ? "Tersalin!" : "Copied!"}</span>
                      </>
                    ) : (
                      <>
                        <Copy size={13} className="text-slate-400" />
                        <span>{isIndo ? "Salin Info Error" : "Copy Error Info"}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Expandable Technical Stack for Developers */}
                {showDetails && (
                  <div className="mt-3 pt-3 border-t border-slate-800">
                    <div className="text-[11px] text-slate-400 mb-1.5 font-sans">
                      {isIndo ? "Jejak Komponen (Component Hierarchy):" : "Component Stack Trace:"}
                    </div>
                    <pre className="font-mono text-[10px] text-slate-400 bg-black/40 p-3 rounded-xl overflow-x-auto max-h-40 leading-tight border border-slate-800">
                      {errorInfo?.componentStack || error?.stack || (isIndo ? "Tidak ada stack trace tersedia." : "No stack trace available.")}
                    </pre>
                  </div>
                )}
              </div>

              {/* Main Navigation Actions (Ke mana pengguna diarahkan) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                <button
                  type="button"
                  onClick={this.handleReload}
                  className="w-full inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#034c85] to-[#023864] text-white text-sm font-bold shadow-lg shadow-[#034c85]/20 hover:opacity-95 transition"
                >
                  <RefreshCw size={16} />
                  {isIndo ? "Muat Ulang Halaman" : "Reload Page"}
                </button>

                <button
                  type="button"
                  onClick={this.handleGoHome}
                  className="w-full inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-sm font-semibold transition"
                >
                  <Home size={16} />
                  {isIndo ? "Kembali ke Beranda" : "Back to Home"}
                </button>
              </div>

              {/* Report Issue via Email Support TP Preneurs */}
              <div className="rounded-2xl border border-slate-800 bg-slate-800/30 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                <div>
                  <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-bold text-slate-300">
                    <Bug size={14} className="text-[#fe6f05]" />
                    {isIndo ? "Laporkan Bug ke Pengembang" : "Report Bug to Developers"}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {isIndo
                      ? "Kirim email otomatis dengan rincian error di atas ke tim support TP Preneurs."
                      : "Send an automated diagnostic email to the TP Preneurs support team."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={this.handleReportEmail}
                  className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-[#fe6f05]/40 bg-[#fe6f05]/15 px-4 text-xs font-bold text-[#fe6f05] hover:bg-[#fe6f05]/25 transition"
                >
                  <Mail size={14} />
                  {isIndo ? "Lapor via Email Support" : "Report via Support Email"}
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
