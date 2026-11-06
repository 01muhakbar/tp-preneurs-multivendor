import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[ErrorBoundary caught an error]", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center font-bold text-xl">
              !
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Terjadi Kesalahan Tampilan
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Halaman ini mengalami kendala saat memuat data. Silakan muat ulang halaman.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={this.handleReload}
                className="px-4 py-2 rounded-lg bg-[var(--tp-primary,#034c85)] text-white text-sm font-semibold hover:opacity-90 transition"
              >
                Muat Ulang Halaman
              </button>
              <a
                href="/user/my-orders"
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                Kembali ke Pesanan
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

