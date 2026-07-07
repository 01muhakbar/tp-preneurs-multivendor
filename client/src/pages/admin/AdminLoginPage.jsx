import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import {
  ArrowRight,
  BarChart3,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Moon,
  ShieldCheck,
  Sun,
  UsersRound,
} from "lucide-react";
import { useAdminAuth } from "../../auth/authDomainHooks.js";
import { clearPendingAuthNotice, readPendingAuthNotice } from "../../auth/authSessionNotice.js";
import AuthNotice from "../../components/auth/AuthNotice.jsx";
import useStoreBranding from "../../hooks/useStoreBranding.js";
import { getWorkspaceLogoUrl } from "../../lib/branding.js";
import { useTheme } from "../../theme/ThemeProvider.jsx";
import "./admin-login-2026.css";

const REMEMBERED_ADMIN_EMAIL_KEY = "adminLoginRememberedEmail";
const ADMIN_LOGIN_BRAND_NAME = "TP Preneurs";
const ADMIN_LOGIN_WORKSPACE_LABEL = "Admin Workspace";

const readRememberedEmail = () => {
  try {
    return localStorage.getItem(REMEMBERED_ADMIN_EMAIL_KEY) || "";
  } catch {
    return "";
  }
};

const persistRememberedEmail = (rememberEmail, email) => {
  try {
    if (rememberEmail) {
      localStorage.setItem(REMEMBERED_ADMIN_EMAIL_KEY, email);
    } else {
      localStorage.removeItem(REMEMBERED_ADMIN_EMAIL_KEY);
    }
  } catch {
    // Ignore storage failures in private or locked-down browser contexts.
  }
};

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const getRedirectPath = (from) => {
  const fallback = "/admin/dashboard";
  const rawPath =
    typeof from === "string"
      ? from
      : [from?.pathname, from?.search, from?.hash].filter(Boolean).join("");
  if (!rawPath || !rawPath.startsWith("/admin")) return fallback;
  if (
    rawPath.startsWith("/admin/login") ||
    rawPath.startsWith("/admin/create-account") ||
    rawPath.startsWith("/admin/forgot-password") ||
    rawPath.startsWith("/admin/reset-password") ||
    rawPath.startsWith("/admin/verify-account") ||
    rawPath.startsWith("/admin/resend-verification")
  ) {
    return fallback;
  }
  return rawPath;
};

const mapLoginError = (error) => {
  const code = error?.code || error?.response?.data?.code || "";
  const message = error?.response?.data?.message || error?.message || "";
  if (code === "VERIFICATION_REQUIRED") {
    return "Please verify your email before accessing Admin Workspace.";
  }
  if (code === "APPROVAL_REQUIRED") {
    return "Your staff account is verified and waiting for approval.";
  }
  if (code === "ACCOUNT_INACTIVE") {
    return "This account is inactive. Contact Admin Workspace to restore sign-in access.";
  }
  return message || "Login failed. Check your email and password.";
};

function AdminLoginBrand({ logoSrc, className = "" }) {
  return (
    <div
      className={`admin-login-2026__brand ${className}`.trim()}
      aria-label={`${ADMIN_LOGIN_BRAND_NAME} ${ADMIN_LOGIN_WORKSPACE_LABEL}`}
    >
      <span className="admin-login-2026__brand-mark">
        <img src={logoSrc} alt="" className="admin-login-2026__brand-image" />
      </span>
      <span className="admin-login-2026__brand-copy">
        <strong>{ADMIN_LOGIN_BRAND_NAME}</strong>
        <small>{ADMIN_LOGIN_WORKSPACE_LABEL}</small>
      </span>
    </div>
  );
}

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { login } = useAdminAuth();
  const { branding } = useStoreBranding();
  const { resolvedTheme, toggleTheme } = useTheme();
  const noticeRef = useRef(null);
  const errorRef = useRef(null);
  const emailInputRef = useRef(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberEmail, setRememberEmail] = useState(true);
  const [authNotice, setAuthNotice] = useState("");
  const [clientError, setClientError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const redirectPath = useMemo(() => getRedirectPath(location.state?.from), [location.state?.from]);
  const isDark = resolvedTheme === "dark";

  const mutation = useMutation({
    mutationFn: async () => {
      const normalizedEmail = email.trim();
      const result = await login(normalizedEmail, password);
      if (!result?.ok) {
        const nextError = new Error(result?.message || "Login failed.");
        nextError.code = result?.code || "";
        nextError.status = result?.status || null;
        throw nextError;
      }
      return result;
    },
    onSuccess: async () => {
      const normalizedEmail = email.trim();
      persistRememberedEmail(rememberEmail, normalizedEmail);
      toast.success("Login success.", {
        id: "admin-login-success",
      });
      await queryClient.invalidateQueries({ queryKey: ["admin", "me"], exact: true });
      navigate(redirectPath, { replace: true });
    },
    onError: () => {
      // The visible alert below owns user-facing error feedback.
    },
  });

  useEffect(() => {
    const rememberedEmail = readRememberedEmail();
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberEmail(true);
    }
  }, []);

  useEffect(() => {
    const nextNotice = String(location.state?.authNotice || readPendingAuthNotice() || "").trim();
    if (nextNotice) {
      setAuthNotice(nextNotice);
      clearPendingAuthNotice();
    }
  }, [location.state]);

  useEffect(() => {
    if (authNotice && noticeRef.current) {
      noticeRef.current.focus();
    }
  }, [authNotice]);

  useEffect(() => {
    if ((clientError || mutation.isError) && errorRef.current) {
      errorRef.current.focus();
    }
  }, [clientError, mutation.isError]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const normalizedEmail = email.trim();
    setClientError("");

    if (!normalizedEmail) {
      setClientError("Email is required.");
      emailInputRef.current?.focus();
      return;
    }
    if (!isValidEmail(normalizedEmail)) {
      setClientError("Enter a valid email address.");
      emailInputRef.current?.focus();
      return;
    }
    if (!password) {
      setClientError("Password is required.");
      return;
    }

    mutation.mutate();
  };

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
    if (clientError) setClientError("");
    if (mutation.isError) mutation.reset();
  };

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
    if (clientError) setClientError("");
    if (mutation.isError) mutation.reset();
  };

  const errorMessage = clientError || (mutation.isError ? mapLoginError(mutation.error) : "");
  const errorCode = mutation.error?.code || "";
  const adminLogoSrc = getWorkspaceLogoUrl("admin", branding?.adminLogoUrl);

  return (
    <main className={`admin-login-2026 ${isDark ? "admin-login-2026--dark" : ""}`}>
      <button
        type="button"
        className="admin-login-2026__theme"
        onClick={toggleTheme}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      >
        <span className="admin-login-2026__theme-knob">
          {isDark ? <Moon aria-hidden="true" /> : <Sun aria-hidden="true" />}
        </span>
        <span className="admin-login-2026__theme-icon" aria-hidden="true">
          {isDark ? <Sun /> : <Moon />}
        </span>
      </button>

      <section className="admin-login-2026__shell" aria-label="Admin login">
        <aside className="admin-login-2026__hero" aria-label="TP Preneurs admin workspace">
          <AdminLoginBrand logoSrc={adminLogoSrc} />

          <div className="admin-login-2026__hero-copy">
            <h1>Welcome back, Admin</h1>
            <p>Secure access to your workspace. Manage, monitor and grow with confidence.</p>
            <span aria-hidden="true" />
          </div>

          <div className="admin-login-2026__stage" aria-hidden="true">
            <div className="admin-login-2026__dashboard admin-login-2026__dashboard--left">
              <span>Overview</span>
              <div className="admin-login-2026__chart-line" />
              <div className="admin-login-2026__donut">72%</div>
            </div>
            <div className="admin-login-2026__shield">
              <ShieldCheck />
              <LockKeyhole />
            </div>
            <div className="admin-login-2026__dashboard admin-login-2026__dashboard--right">
              <span>Users</span>
              <strong>1,248</strong>
              <small>Active users</small>
              <em>+12%</em>
            </div>
            <div className="admin-login-2026__bulb">
              <div className="admin-login-2026__bulb-rays">
                <span />
                <span />
                <span />
              </div>
              <div className="admin-login-2026__bulb-glass">
                <span />
              </div>
              <div className="admin-login-2026__bulb-base" />
            </div>
            <div className="admin-login-2026__plant" />
          </div>

          <div className="admin-login-2026__features" aria-label="Admin capabilities">
            <div className="admin-login-2026__feature">
              <ShieldCheck aria-hidden="true" />
              <div>
                <strong>Secure &amp; Protected</strong>
                <span>Enterprise-grade security</span>
              </div>
            </div>
            <div className="admin-login-2026__feature">
              <BarChart3 aria-hidden="true" />
              <div>
                <strong>Real-time Insights</strong>
                <span>Monitor performance live</span>
              </div>
            </div>
            <div className="admin-login-2026__feature">
              <UsersRound aria-hidden="true" />
              <div>
                <strong>Team Management</strong>
                <span>Manage users and roles</span>
              </div>
            </div>
          </div>

          <p className="admin-login-2026__copyright">&copy; 2026 TP Preneurs. All rights reserved.</p>
        </aside>

        <section className="admin-login-2026__panel" aria-labelledby="admin-login-title">
          <AdminLoginBrand logoSrc={adminLogoSrc} className="admin-login-2026__mobile-brand" />

          <div className="admin-login-2026__card">
            <p className="admin-login-2026__eyebrow">
              <ShieldCheck aria-hidden="true" />
              Secure Access
            </p>
            <h2 id="admin-login-title">Admin Login</h2>
            <p className="admin-login-2026__subtitle">Sign in to access your workspace.</p>

            <AuthNotice
              id="admin-login-notice"
              tone="warning"
              focusRef={noticeRef}
              className="admin-login-2026__notice"
            >
              {authNotice}
            </AuthNotice>

            <form className="admin-login-2026__form" onSubmit={handleSubmit} noValidate>
              <div className="admin-login-2026__field">
                <label htmlFor="admin-login-email">Email</label>
                <div className="admin-login-2026__input-wrap">
                  <Mail aria-hidden="true" />
                  <input
                    id="admin-login-email"
                    ref={emailInputRef}
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    placeholder="superadmin@local.dev"
                    autoComplete="email"
                    required
                    aria-describedby={errorMessage ? "admin-login-error" : undefined}
                  />
                </div>
              </div>

              <div className="admin-login-2026__field">
                <div className="admin-login-2026__label-row">
                  <label htmlFor="admin-login-password">Password</label>
                  <Link to="/admin/forgot-password">Forgot password?</Link>
                </div>
                <div className="admin-login-2026__input-wrap">
                  <LockKeyhole aria-hidden="true" />
                  <input
                    id="admin-login-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={handlePasswordChange}
                    placeholder="************"
                    autoComplete="current-password"
                    required
                    aria-describedby={errorMessage ? "admin-login-error" : undefined}
                  />
                  <button
                    type="button"
                    className="admin-login-2026__password-toggle"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                  </button>
                </div>
              </div>

              <div className="admin-login-2026__options">
                <label className="admin-login-2026__remember">
                  <input
                    type="checkbox"
                    checked={rememberEmail}
                    onChange={(event) => setRememberEmail(event.target.checked)}
                  />
                  <span aria-hidden="true" />
                  Remember email
                </label>
              </div>

              <AuthNotice
                id="admin-login-error"
                tone="error"
                live="assertive"
                focusRef={errorRef}
                className="admin-login-2026__notice"
              >
                {errorMessage}
              </AuthNotice>

              {errorCode === "VERIFICATION_REQUIRED" ? (
                <p className="admin-login-2026__helper">
                  Need another verification email?{" "}
                  <Link to={`/admin/resend-verification?email=${encodeURIComponent(email.trim())}`}>
                    Resend verification
                  </Link>
                </p>
              ) : null}
              {errorCode === "APPROVAL_REQUIRED" ? (
                <p className="admin-login-2026__helper">
                  Your account is verified. Admin Workspace approval is still pending.
                </p>
              ) : null}
              {errorCode === "ACCOUNT_INACTIVE" ? (
                <p className="admin-login-2026__helper">
                  This account is inactive. Contact Admin Workspace if you need sign-in access restored.
                </p>
              ) : null}

              <button
                type="submit"
                className="admin-login-2026__submit"
                disabled={mutation.isPending}
              >
                <span>{mutation.isPending ? "Signing in..." : "Login"}</span>
                <ArrowRight aria-hidden="true" />
              </button>
            </form>

            <p className="admin-login-2026__create">
              Need a staff account? <Link to="/admin/create-account">Create account</Link>
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}
