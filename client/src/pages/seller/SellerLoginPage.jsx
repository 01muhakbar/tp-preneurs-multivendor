import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BadgeDollarSign,
  BarChart3,
  Boxes,
  Check,
  ClipboardCheck,
  Eye,
  EyeOff,
  LockKeyhole,
  Moon,
  PackageCheck,
  ShieldCheck,
  ShoppingBag,
  Store,
  Sun,
  Truck,
  UserRound,
  WalletCards,
} from "lucide-react";
import { api } from "../../api/axios.ts";
import { sellerLogin } from "../../api/auth.service.js";
import { useSellerAuth } from "../../auth/authDomainHooks.js";
import { useTheme } from "../../theme/ThemeProvider.jsx";
import useStoreBranding from "../../hooks/useStoreBranding.js";
import { getWorkspaceLogoUrl, hasCustomBrandingLogo } from "../../lib/branding.js";
import { getRetryAfterSeconds } from "../../utils/authRateLimit.js";
import { buildRetryAfterMessage, buildCooldownButtonLabel } from "../../utils/authUi.js";
import "./seller-login-2026.css";

const REMEMBERED_EMAIL_KEY = "seller_login_remembered_email";
const ADMIN_WORKSPACE_ROLES = new Set(["admin", "staff", "super_admin", "superadmin"]);

const FEATURES = [
  {
    title: "Catalog Control",
    description: "Manage products, stock, and storefront readiness.",
    Icon: Boxes,
  },
  {
    title: "Order Fulfillment",
    description: "Track orders and keep every delivery moving.",
    Icon: ClipboardCheck,
  },
  {
    title: "Payment Review",
    description: "Review payment activity and payout readiness.",
    Icon: WalletCards,
  },
  {
    title: "Live Insights",
    description: "See store performance from one focused view.",
    Icon: BarChart3,
  },
];

const TRUST_ITEMS = [
  {
    title: "Secure Access",
    description: "Protected seller sessions",
    Icon: ShieldCheck,
  },
  {
    title: "Catalog Ready",
    description: "Products and stock aligned",
    Icon: PackageCheck,
  },
  {
    title: "Finance Flow",
    description: "Payment visibility built in",
    Icon: BadgeDollarSign,
  },
  {
    title: "Fulfillment",
    description: "Orders stay on track",
    Icon: Truck,
  },
];

const normalizeRole = (value) => String(value || "").trim().toLowerCase();

const getResponseRole = (payload) =>
  normalizeRole(
    payload?.data?.user?.role ||
      payload?.user?.role ||
      payload?.data?.role ||
      payload?.role
  );

const normalizeStores = (payload) => {
  const candidates = [
    payload?.stores,
    payload?.data?.stores,
    payload?.data?.items,
    payload?.items,
    payload?.data,
  ];
  return candidates.find(Array.isArray) || [];
};

const getStoreStatus = (entry) =>
  String(entry?.status || entry?.storeStatus || entry?.store?.status || "")
    .trim()
    .toUpperCase();

const getStoreSlug = (entry) => {
  const value =
    entry?.slug ||
    entry?.storeSlug ||
    entry?.canonicalSlug ||
    entry?.store?.slug ||
    entry?.id ||
    entry?.storeId ||
    entry?.store?.id;
  return String(value ?? "").trim();
};

const getPreferredStore = (stores) =>
  stores.find((entry) => getStoreStatus(entry) === "ACTIVE") || stores[0] || null;

const getSafeNextPath = (search) => {
  const value = new URLSearchParams(search).get("next");
  if (!value) return null;
  const normalized = value.trim();
  if (
    !normalized.startsWith("/seller/stores/") ||
    normalized.startsWith("//") ||
    normalized.includes("://")
  ) {
    return null;
  }
  return normalized;
};

const readRememberedEmail = () => {
  try {
    return String(window.localStorage.getItem(REMEMBERED_EMAIL_KEY) || "").trim();
  } catch {
    return "";
  }
};

const persistRememberedEmail = (remember, email) => {
  try {
    if (remember) {
      window.localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
    } else {
      window.localStorage.removeItem(REMEMBERED_EMAIL_KEY);
    }
  } catch {
    // Storage may be unavailable in private or test contexts.
  }
};

export default function SellerLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshSession, logout } = useSellerAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const { branding } = useStoreBranding();
  const emailRef = useRef(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [showAdminLink, setShowAdminLink] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCooldownSeconds((current) => Math.max(0, current - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  const safeNextPath = useMemo(
    () => getSafeNextPath(location.search),
    [location.search]
  );

  useEffect(() => {
    const rememberedEmail = readRememberedEmail();
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRemember(true);
    }
    emailRef.current?.focus();
  }, []);

  const validate = () => {
    const errors = {};
    if (!email.trim()) {
      errors.email = "Enter your email or username.";
    }
    if (!password) {
      errors.password = "Enter your password.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
    if (fieldErrors.email) {
      setFieldErrors((current) => ({ ...current, email: "" }));
    }
  };

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
    if (fieldErrors.password) {
      setFieldErrors((current) => ({ ...current, password: "" }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError("");
    setShowAdminLink(false);

    if (!validate()) return;

    const normalizedEmail = email.trim();
    persistRememberedEmail(remember, normalizedEmail);
    setIsSubmitting(true);

    try {
      const loginResponse = await sellerLogin({
        email: normalizedEmail,
        password,
      });
      const authenticatedRole = getResponseRole(loginResponse);

      if (ADMIN_WORKSPACE_ROLES.has(authenticatedRole)) {
        setSubmitError(
          "This account belongs to Admin Workspace. Please use Admin Login."
        );
        setShowAdminLink(true);
        return;
      }

      await refreshSession({}, "seller");

      try {
        localStorage.setItem("seller_login_path", "/seller/login");
      } catch {}

      const storesResponse = await api.get("/seller/stores");
      const storesData = storesResponse?.data;
      const stores = normalizeStores(storesData);
      const selectedStore = getPreferredStore(stores);

      if (!selectedStore) {
        await logout?.();
        navigate("/auth/login", { 
          replace: true,
          state: { authNotice: "Akses ditolak. Silakan login melalui halaman utama." }
        });
        return;
      }

      if (safeNextPath) {
        navigate(safeNextPath, { replace: true });
        return;
      }

      const storeSlug = getStoreSlug(selectedStore);
      if (!storeSlug) {
        await logout?.();
        navigate("/auth/login", { replace: true });
        return;
      }

      navigate(`/seller/stores/${encodeURIComponent(storeSlug)}`, { replace: true });
    } catch (error) {
      const responseData = error?.response?.data;
      const responseRole = getResponseRole(responseData);
      const isAdminAccount =
        ADMIN_WORKSPACE_ROLES.has(responseRole) ||
        responseData?.code === "ADMIN_WORKSPACE_LOGIN_REQUIRED";

      if (isAdminAccount) {
        setSubmitError(
          "This account belongs to Admin Workspace. Please use Admin Login."
        );
        setShowAdminLink(true);
      } else {
        setSubmitError(
          error?.response?.status === 429 && getRetryAfterSeconds(error) > 0
            ? buildRetryAfterMessage(getRetryAfterSeconds(error))
            : responseData?.message ||
                "We couldn't sign you in. Check your credentials and try again."
        );
        const retryAfterSeconds = getRetryAfterSeconds(error);
        if (retryAfterSeconds > 0) {
          setCooldownSeconds(retryAfterSeconds);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="seller-login-page">
      <section className="seller-login-shell" aria-labelledby="seller-login-title">
        <div className="seller-login-hero">
          <div className="seller-login-hero__rings" aria-hidden="true" />

          <div className="seller-login-brand">
            <span 
              className="seller-login-brand__mark" 
              aria-hidden="true"
              style={hasCustomBrandingLogo(branding?.sellerLogoUrl) ? { background: "transparent", boxShadow: "none" } : undefined}
            >
              {hasCustomBrandingLogo(branding?.sellerLogoUrl) ? (
                <img 
                  src={getWorkspaceLogoUrl("seller", branding?.sellerLogoUrl)} 
                  alt="Seller Workspace Logo" 
                  className="h-full w-full object-contain" 
                />
              ) : (
                <ShoppingBag size={24} strokeWidth={2.2} />
              )}
            </span>
            <span>
              <strong>
                TP <b>Preneurs</b>
              </strong>
              <small>Seller Workspace</small>
            </span>
          </div>

          <div className="seller-login-hero__content">
            <p className="seller-login-eyebrow">Built for modern merchants</p>
            <h1>Run your store, orders, and payouts from one clean dashboard.</h1>
            <p className="seller-login-hero__intro">
              Stay close to the work that grows your business, with store-scoped
              access and a workspace designed for daily operations.
            </p>

            <div className="seller-login-feature-list">
              {FEATURES.map(({ title, description, Icon }) => (
                <div className="seller-login-feature" key={title}>
                  <span className="seller-login-feature__icon" aria-hidden="true">
                    <Icon size={19} strokeWidth={2} />
                  </span>
                  <span>
                    <strong>{title}</strong>
                    <small>{description}</small>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="seller-login-illustration" aria-hidden="true">
            <div className="seller-login-illustration__signal">
              <BarChart3 size={19} />
            </div>
            <div className="seller-login-illustration__shop">
              <div className="seller-login-illustration__sign">Your Store</div>
              <div className="seller-login-illustration__awning">
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>
              <div className="seller-login-illustration__building">
                <div className="seller-login-illustration__window">
                  <i />
                  <i />
                  <i />
                </div>
                <div className="seller-login-illustration__door" />
              </div>
            </div>
            <div className="seller-login-illustration__plant">
              <span />
              <span />
              <span />
              <i />
            </div>
            <div className="seller-login-illustration__boxes">
              <span />
              <span />
              <span />
            </div>
          </div>
        </div>

        <div className="seller-login-form-panel">
          <div className="seller-login-theme" role="group" aria-label="Choose appearance">
            <button
              type="button"
              className={resolvedTheme === "light" ? "is-active" : ""}
              onClick={() => setTheme("light")}
              aria-pressed={resolvedTheme === "light"}
            >
              <Sun size={16} aria-hidden="true" />
              Light
            </button>
            <button
              type="button"
              className={resolvedTheme === "dark" ? "is-active" : ""}
              onClick={() => setTheme("dark")}
              aria-pressed={resolvedTheme === "dark"}
            >
              <Moon size={16} aria-hidden="true" />
              Dark
            </button>
          </div>

          <div className="seller-login-card">
            <div className="seller-login-card__heading">
              <span className="seller-login-card__icon" aria-hidden="true">
                <Store size={30} strokeWidth={2.2} />
              </span>
              <p className="seller-login-eyebrow">Seller access</p>
              <h2 id="seller-login-title">Welcome back</h2>
              <p>Sign in to continue to your Seller Workspace.</p>
            </div>

            <form className="seller-login-form" onSubmit={handleSubmit} noValidate>
              <div className="seller-login-field">
                <label htmlFor="seller-login-email">Email or Username</label>
                <div
                  className={`seller-login-input ${
                    fieldErrors.email ? "seller-login-input--error" : ""
                  }`}
                >
                  <UserRound size={19} aria-hidden="true" />
                  <input
                    id="seller-login-email"
                    ref={emailRef}
                    type="text"
                    value={email}
                    onChange={handleEmailChange}
                    placeholder="Enter your email or username"
                    autoComplete="username"
                    aria-invalid={Boolean(fieldErrors.email)}
                    aria-describedby={
                      fieldErrors.email ? "seller-login-email-error" : undefined
                    }
                  />
                </div>
                {fieldErrors.email ? (
                  <p className="seller-login-field__error" id="seller-login-email-error">
                    {fieldErrors.email}
                  </p>
                ) : null}
              </div>

              <div className="seller-login-field">
                <div className="seller-login-field__label-row">
                  <label htmlFor="seller-login-password">Password</label>
                  <Link to="/seller/forgot-password">Forgot password?</Link>
                </div>
                <div
                  className={`seller-login-input ${
                    fieldErrors.password ? "seller-login-input--error" : ""
                  }`}
                >
                  <LockKeyhole size={19} aria-hidden="true" />
                  <input
                    id="seller-login-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={handlePasswordChange}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    aria-invalid={Boolean(fieldErrors.password)}
                    aria-describedby={
                      fieldErrors.password ? "seller-login-password-error" : undefined
                    }
                  />
                  <button
                    className="seller-login-password-toggle"
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff size={19} aria-hidden="true" />
                    ) : (
                      <Eye size={19} aria-hidden="true" />
                    )}
                  </button>
                </div>
                {fieldErrors.password ? (
                  <p
                    className="seller-login-field__error"
                    id="seller-login-password-error"
                  >
                    {fieldErrors.password}
                  </p>
                ) : null}
              </div>

              <label className="seller-login-remember">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                />
                <span aria-hidden="true">
                  <Check size={13} strokeWidth={3} />
                </span>
                Remember me
              </label>

              {submitError ? (
                <div className="seller-login-alert" role="alert">
                  <ShieldCheck size={18} aria-hidden="true" />
                  <span>
                    {submitError}
                    {showAdminLink ? (
                      <>
                        {" "}
                        <Link to="/admin/login">Open Admin Login</Link>
                      </>
                    ) : null}
                  </span>
                </div>
              ) : null}

              <button
                className={`seller-login-submit ${
                  isSubmitting || cooldownSeconds > 0 ? "is-loading" : ""
                }`}
                type="submit"
                disabled={isSubmitting || cooldownSeconds > 0}
                aria-busy={isSubmitting}
              >
                {isSubmitting ? (
                  "Signing in..."
                ) : (
                  <>
                    <span>{buildCooldownButtonLabel(cooldownSeconds, "Sign In")}</span>
                    <ArrowRight size={19} aria-hidden="true" />
                  </>
                )}
              </button>
            </form>

            <div className="seller-login-card__links">
              <p>
                New to selling? <Link to="/seller/create-account">Create an account</Link>
              </p>
              <p>
                Admin team? <Link to="/admin/login">Admin Login</Link>
              </p>
            </div>

            <div className="seller-login-security">
              <LockKeyhole size={16} aria-hidden="true" />
              <p>
                Your session is protected and store access is verified before the
                workspace opens.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="seller-login-trust" aria-label="Seller workspace benefits">
        {TRUST_ITEMS.map(({ title, description, Icon }) => (
          <div className="seller-login-trust__item" key={title}>
            <span aria-hidden="true">
              <Icon size={21} strokeWidth={2} />
            </span>
            <p>
              <strong>{title}</strong>
              <small>{description}</small>
            </p>
          </div>
        ))}
      </section>

      <footer className="seller-login-footer">
        © 2026 TP Preneurs. All rights reserved.
      </footer>
    </main>
  );
}
