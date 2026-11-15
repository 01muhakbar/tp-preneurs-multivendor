import React from "react";

type Props = {
  children?: React.ReactNode;
  resetKey?: any;
  fallback?: React.ReactNode | ((props: { error: string; reset: () => void }) => React.ReactNode);
};

type State = {
  hasError: boolean;
  message: string;
};

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = {
    hasError: false,
    message: "",
  };

  static getDerivedStateFromError(err: unknown): State {
    const message = err instanceof Error ? err.message : String(err);
    return { hasError: true, message };
  }

  componentDidCatch(err: unknown, errorInfo: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary caught error]:", err, errorInfo);
  }

  componentDidUpdate(prevProps: Props) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.handleReset();
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, message: "" });
  };

  render() {
    if (this.state.hasError) {
      if (typeof this.props.fallback === "function") {
        return this.props.fallback({
          error: this.state.message,
          reset: this.handleReset,
        });
      }

      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isIndo = (() => {
        if (typeof window === "undefined") return false;
        try {
          const stored = JSON.parse(window.localStorage.getItem("adminLanguage") || "null");
          return (
            stored?.isoCode?.toLowerCase()?.startsWith("id") ||
            stored?.name?.toLowerCase()?.includes("indonesia") ||
            document.documentElement.lang?.toLowerCase()?.startsWith("id")
          );
        } catch {
          return false;
        }
      })();

      return (
        <div className="flex min-h-[380px] w-full items-center justify-center p-4 sm:p-8">
          <div
            className="w-full max-w-md rounded-2xl border border-slate-700/70 bg-[#0f172a]/95 p-6 sm:p-8 text-center shadow-2xl backdrop-blur-md"
            style={{ borderColor: "rgba(254, 111, 5, 0.25)" }}
          >
            <div
              className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full"
              style={{ backgroundColor: "rgba(254, 111, 5, 0.15)", color: "#fe6f05" }}
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              {isIndo ? "Kendala Memuat Halaman" : "Error Loading Page"}
            </h3>

            <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
              {isIndo
                ? "Terjadi kendala sementara saat memuat tampilan ini. Anda dapat mencoba lagi atau kembali ke navigasi lain."
                : "A temporary issue occurred while rendering this page. You can try reloading or switch to another section."}
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={this.handleReset}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md transition-all duration-150 hover:brightness-110 active:scale-95"
                style={{ backgroundColor: "#034c85" }}
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span>{isIndo ? "Coba Lagi" : "Try Again"}</span>
              </button>

              <a
                href="/admin"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-800/80 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-300 transition-all duration-150 hover:bg-slate-700 hover:text-white active:scale-95"
              >
                <span>{isIndo ? "Dashboard" : "Dashboard"}</span>
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
