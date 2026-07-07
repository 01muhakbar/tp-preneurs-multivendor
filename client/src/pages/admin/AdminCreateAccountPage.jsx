import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { adminStaffSignupSchema } from "@ecommerce/schemas";
import {
  ArrowRight,
  BarChart3,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Headphones,
  LockKeyhole,
  Mail,
  Moon,
  Phone,
  ShieldCheck,
  Sparkles,
  Sun,
  UserPlus,
  UsersRound,
} from "lucide-react";
import { registerAdminStaffAccount } from "../../api/adminPublicAuth.ts";
import useStoreBranding from "../../hooks/useStoreBranding.js";
import { getWorkspaceLogoUrl } from "../../lib/branding.js";
import { useTheme } from "../../theme/ThemeProvider.jsx";
import { getRetryAfterSeconds } from "../../utils/authRateLimit.js";
import {
  buildCooldownButtonLabel,
  buildRetryAfterMessage,
} from "../../utils/authUi.js";
import "./admin-create-account-2026.css";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const FEATURES = [
  {
    title: "Verified Access",
    description: "Only authorized admins can access the system.",
    Icon: ShieldCheck,
  },
  {
    title: "Role-ready Setup",
    description: "Assign roles and permissions after approval.",
    Icon: UsersRound,
  },
  {
    title: "Secure Credentials",
    description: "Strong passwords and encryption keep data safe.",
    Icon: LockKeyhole,
  },
];

const EMPTY_FORM = {
  name: "",
  email: "",
  phoneNumber: "",
  password: "",
  passwordConfirm: "",
  honeypot: "",
};

const toFieldErrors = (error) => {
  const flattened =
    error?.flatten?.()?.fieldErrors ||
    error?.response?.data?.errors?.fieldErrors ||
    error?.fieldErrors ||
    {};
  return flattened && typeof flattened === "object" ? flattened : {};
};

const firstFieldError = (fieldErrors, key) => {
  const error = fieldErrors?.[key];
  if (Array.isArray(error)) return error[0] || "";
  return typeof error === "string" ? error : "";
};

const getLocalPhoneDigits = (phone) => {
  let digits = String(phone || "").replace(/\D/g, "");
  if (digits.startsWith("62")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = digits.slice(1);
  return digits;
};

const getNormalizedPhoneNumber = (phone) => `+62${getLocalPhoneDigits(phone)}`;

const validateForm = (form, termsAccepted) => {
  const errors = {};
  const name = form.name.trim();
  const email = form.email.trim();
  const phoneDigits = getLocalPhoneDigits(form.phoneNumber);

  if (!name) {
    errors.name = ["Full name is required."];
  } else if (name.length < 3) {
    errors.name = ["Use at least 3 characters for your full name."];
  }

  if (!email) {
    errors.email = ["Email is required."];
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = ["Enter a valid email address."];
  }

  if (!phoneDigits) {
    errors.phoneNumber = ["WhatsApp or phone number is required."];
  } else if (!/^8[1-9]\d{6,11}$/.test(phoneDigits)) {
    errors.phoneNumber = ["Enter a valid Indonesian mobile number."];
  }

  if (!form.password) {
    errors.password = ["Password is required."];
  } else if (form.password.length < 8) {
    errors.password = ["Password must contain at least 8 characters."];
  } else if (!/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) {
    errors.password = ["Password must contain at least 1 letter and 1 number."];
  }

  if (!form.passwordConfirm) {
    errors.passwordConfirm = ["Confirm your password."];
  } else if (form.passwordConfirm !== form.password) {
    errors.passwordConfirm = ["Passwords do not match."];
  }

  if (!termsAccepted) {
    errors.termsAccepted = ["Accept the Terms of Service and Privacy Policy to continue."];
  }

  return errors;
};

const getPasswordStrength = (password) => {
  const value = String(password || "");
  if (!value) {
    return {
      score: 0,
      label: "Not set",
      helper: "Use at least 8 characters, including at least 1 letter and 1 number.",
    };
  }

  let score = 0;
  if (value.length >= 8) score += 1;
  if (/[A-Za-z]/.test(value) && /\d/.test(value)) score += 1;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value) || value.length >= 12) score += 1;

  if (score === 1) {
    return { score, label: "Weak", helper: "Add length and mix letters with numbers." };
  }
  if (score < 4) {
    return { score, label: "Good", helper: "Good start. Uppercase letters or symbols make it stronger." };
  }
  return { score, label: "Strong", helper: "Strong password." };
};

function AdminSignupBrand({ logoSrc, compact = false }) {
  return (
    <div className={`admin-signup-2026__brand${compact ? " is-compact" : ""}`}>
      <span className="admin-signup-2026__brand-mark">
        <img src={logoSrc} alt="" />
      </span>
      <span className="admin-signup-2026__brand-copy">
        <strong>TP Preneurs</strong>
        <small>Admin Workspace</small>
      </span>
    </div>
  );
}

function FieldError({ id, message }) {
  if (!message) return null;
  return (
    <p className="admin-signup-2026__field-error" id={id} role="alert">
      {message}
    </p>
  );
}

export default function AdminCreateAccountPage() {
  const startedAtRef = useRef(Date.now());
  const statusRef = useRef(null);
  const fieldRefs = useRef({});
  const { branding } = useStoreBranding();
  const { resolvedTheme, toggleTheme } = useTheme();
  const [form, setForm] = useState(EMPTY_FORM);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [statusMessage, setStatusMessage] = useState("");
  const [statusTone, setStatusTone] = useState("neutral");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  const isDark = resolvedTheme === "dark";
  const adminLogoSrc = getWorkspaceLogoUrl("admin", branding?.adminLogoUrl);
  const passwordStrength = useMemo(
    () => getPasswordStrength(form.password),
    [form.password]
  );
  const validationErrors = useMemo(
    () => validateForm(form, termsAccepted),
    [form, termsAccepted]
  );
  const isFormValid = Object.keys(validationErrors).length === 0;

  useEffect(() => {
    if (cooldownSeconds <= 0) return undefined;
    const timer = window.setTimeout(() => {
      setCooldownSeconds((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [cooldownSeconds]);

  const focusFirstError = (errors) => {
    const firstErrorKey = Object.keys(errors).find((key) => firstFieldError(errors, key));
    if (!firstErrorKey) return false;
    window.requestAnimationFrame(() => fieldRefs.current[firstErrorKey]?.focus());
    return true;
  };

  const focusStatus = () => {
    window.requestAnimationFrame(() => statusRef.current?.focus());
  };

  const setField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const handleFieldBlur = (key) => {
    setTouched((current) => ({ ...current, [key]: true }));
    setFieldErrors((current) => {
      const next = { ...current };
      const error = validateForm(form, termsAccepted)[key];
      if (error) next[key] = error;
      else delete next[key];
      return next;
    });
  };

  const handleTermsChange = (event) => {
    const checked = event.target.checked;
    setTermsAccepted(checked);
    setTouched((current) => ({ ...current, termsAccepted: true }));
    setFieldErrors((current) => {
      const next = { ...current };
      if (checked) delete next.termsAccepted;
      else next.termsAccepted = validationErrors.termsAccepted;
      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const allTouched = {
      name: true,
      email: true,
      phoneNumber: true,
      password: true,
      passwordConfirm: true,
      termsAccepted: true,
    };
    setTouched(allTouched);
    setStatusMessage("");
    setStatusTone("neutral");

    const frontendErrors = validateForm(form, termsAccepted);
    if (Object.keys(frontendErrors).length > 0) {
      setFieldErrors(frontendErrors);
      focusFirstError(frontendErrors);
      return;
    }

    const normalizedEmail = form.email.trim().toLowerCase();
    const payload = {
      name: form.name.trim(),
      email: normalizedEmail,
      phoneNumber: getNormalizedPhoneNumber(form.phoneNumber),
      password: form.password,
      passwordConfirm: form.passwordConfirm,
      honeypot: form.honeypot,
      startedAt: startedAtRef.current,
    };
    const parsed = adminStaffSignupSchema.safeParse(payload);
    if (!parsed.success) {
      const schemaFieldErrors = toFieldErrors(parsed.error);
      setFieldErrors(schemaFieldErrors);
      focusFirstError(schemaFieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await registerAdminStaffAccount(parsed.data);
      setRegisteredEmail(normalizedEmail);
      setRegistrationComplete(true);
      setStatusMessage(
        result?.message ||
          "Check your email to verify your staff account. Admin Workspace will review access after verification."
      );
      setStatusTone("success");
      setForm((current) => ({ ...current, password: "", passwordConfirm: "" }));
      focusStatus();
    } catch (error) {
      const backendFieldErrors = toFieldErrors(error);
      setFieldErrors(backendFieldErrors);
      const retryAfterSeconds = getRetryAfterSeconds(error);
      setStatusMessage(
        error?.response?.status === 429 && retryAfterSeconds > 0
          ? buildRetryAfterMessage(retryAfterSeconds)
          : error?.response?.data?.message || "We could not create this account right now."
      );
      setStatusTone("error");
      if (retryAfterSeconds > 0) setCooldownSeconds(retryAfterSeconds);
      if (!focusFirstError(backendFieldErrors)) focusStatus();
    } finally {
      setIsSubmitting(false);
    }
  };

  const visibleError = (key) =>
    touched[key] || firstFieldError(fieldErrors, key)
      ? firstFieldError(fieldErrors, key)
      : "";

  return (
    <main
      className={`admin-signup-2026${isDark ? " admin-signup-2026--dark" : ""}`}
    >
      <button
        className="admin-signup-2026__theme-toggle"
        type="button"
        onClick={toggleTheme}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      >
        {isDark ? <Moon size={17} aria-hidden="true" /> : <Sun size={17} aria-hidden="true" />}
      </button>

      <div className="admin-signup-2026__shell">
        <section className="admin-signup-2026__hero" aria-labelledby="admin-signup-hero-title">
          <AdminSignupBrand logoSrc={adminLogoSrc} />

          <div className="admin-signup-2026__hero-copy">
            <span className="admin-signup-2026__eyebrow">
              <ShieldCheck size={15} aria-hidden="true" />
              Staff Signup
            </span>
            <h1 id="admin-signup-hero-title">
              Build your <span>admin</span> team
            </h1>
            <p>Create secure admin accounts and get your team ready to manage the platform.</p>
          </div>

          <div className="admin-signup-2026__features">
            {FEATURES.map(({ title, description, Icon }) => (
              <article className="admin-signup-2026__feature" key={title}>
                <span aria-hidden="true"><Icon size={21} strokeWidth={2.2} /></span>
                <div>
                  <strong>{title}</strong>
                  <small>{description}</small>
                </div>
              </article>
            ))}
          </div>

          <div className="admin-signup-2026__art" aria-hidden="true">
            <span className="admin-signup-2026__art-orbit is-left" />
            <span className="admin-signup-2026__art-orbit is-right" />
            <div className="admin-signup-2026__art-sidebar">
              <Sparkles size={19} />
              <UsersRound size={19} />
              <BarChart3 size={19} />
            </div>
            <div className="admin-signup-2026__identity-card">
              <div className="admin-signup-2026__avatar">
                <span />
                <i />
              </div>
              <b />
              <b />
              <div className="admin-signup-2026__identity-dots"><i /><i /><i /></div>
              <span className="admin-signup-2026__add-user"><UserPlus size={31} /></span>
            </div>
            <div className="admin-signup-2026__credential-card">
              <LockKeyhole size={17} />
              <span>••••••••</span>
              <i />
            </div>
            <div className="admin-signup-2026__chart-card">
              <BarChart3 size={44} />
            </div>
            <div className="admin-signup-2026__shield-card">
              <ShieldCheck size={54} />
            </div>
          </div>
        </section>

        <section className="admin-signup-2026__form-panel" aria-labelledby="admin-signup-title">
          <div className="admin-signup-2026__mobile-brand">
            <AdminSignupBrand logoSrc={adminLogoSrc} compact />
          </div>

          <div className="admin-signup-2026__card">
            {registrationComplete ? (
              <div className="admin-signup-2026__success">
                <span className="admin-signup-2026__success-icon" aria-hidden="true">
                  <CheckCircle2 size={36} />
                </span>
                <p className="admin-signup-2026__card-kicker">Verification required</p>
                <h2 id="admin-signup-title">Check your email</h2>
                <p className="admin-signup-2026__card-intro">
                  We sent the next step to <strong>{registeredEmail}</strong>.
                </p>
                <div
                  id="admin-create-account-status"
                  ref={statusRef}
                  className="admin-signup-2026__notice is-success"
                  tabIndex={-1}
                  role="status"
                >
                  <ShieldCheck size={18} aria-hidden="true" />
                  <span>{statusMessage}</span>
                </div>
                <Link className="admin-signup-2026__primary-link" to="/admin/login">
                  Continue to login <ArrowRight size={18} aria-hidden="true" />
                </Link>
                <Link
                  className="admin-signup-2026__secondary-link"
                  to={`/admin/resend-verification?email=${encodeURIComponent(registeredEmail)}`}
                >
                  Resend verification email
                </Link>
              </div>
            ) : (
              <>
                <div className="admin-signup-2026__card-heading">
                  <p className="admin-signup-2026__card-kicker">Admin onboarding</p>
                  <h2 id="admin-signup-title">Create account</h2>
                  <p className="admin-signup-2026__card-intro">
                    Request access to the admin workspace.
                  </p>
                </div>

                {statusMessage ? (
                  <div
                    id="admin-create-account-status"
                    ref={statusRef}
                    className={`admin-signup-2026__notice is-${statusTone}`}
                    tabIndex={-1}
                    role={statusTone === "error" ? "alert" : "status"}
                  >
                    <ShieldCheck size={18} aria-hidden="true" />
                    <span>{statusMessage}</span>
                  </div>
                ) : null}

                <form className="admin-signup-2026__form" onSubmit={handleSubmit} noValidate>
                  <div className="admin-signup-2026__honeypot" aria-hidden="true">
                    <label htmlFor="admin-create-account-company">Company</label>
                    <input
                      id="admin-create-account-company"
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      value={form.honeypot}
                      onChange={(event) => setField("honeypot", event.target.value)}
                    />
                  </div>

                  <div className="admin-signup-2026__row">
                    <div className="admin-signup-2026__field">
                      <label htmlFor="admin-create-account-name">Full name</label>
                      <div className={`admin-signup-2026__input${visibleError("name") ? " has-error" : ""}`}>
                        <UserPlus size={18} aria-hidden="true" />
                        <input
                          id="admin-create-account-name"
                          ref={(node) => { fieldRefs.current.name = node; }}
                          type="text"
                          value={form.name}
                          onChange={(event) => setField("name", event.target.value)}
                          onBlur={() => handleFieldBlur("name")}
                          placeholder="Enter full name"
                          autoComplete="name"
                          aria-invalid={Boolean(visibleError("name"))}
                          aria-describedby={visibleError("name") ? "admin-create-account-name-error" : undefined}
                          required
                        />
                      </div>
                      <FieldError id="admin-create-account-name-error" message={visibleError("name")} />
                    </div>

                    <div className="admin-signup-2026__field">
                      <label htmlFor="admin-create-account-email">Email</label>
                      <div className={`admin-signup-2026__input${visibleError("email") ? " has-error" : ""}`}>
                        <Mail size={18} aria-hidden="true" />
                        <input
                          id="admin-create-account-email"
                          ref={(node) => { fieldRefs.current.email = node; }}
                          type="email"
                          value={form.email}
                          onChange={(event) => setField("email", event.target.value)}
                          onBlur={() => handleFieldBlur("email")}
                          placeholder="Enter email address"
                          autoComplete="email"
                          aria-invalid={Boolean(visibleError("email"))}
                          aria-describedby={visibleError("email") ? "admin-create-account-email-error" : undefined}
                          required
                        />
                      </div>
                      <FieldError id="admin-create-account-email-error" message={visibleError("email")} />
                    </div>
                  </div>

                  <div className="admin-signup-2026__field">
                    <label htmlFor="admin-create-account-phone">WhatsApp / phone number</label>
                    <div className={`admin-signup-2026__phone${visibleError("phoneNumber") ? " has-error" : ""}`}>
                      <span className="admin-signup-2026__country" aria-label="Indonesia country code">
                        <i aria-hidden="true"><b /><b /></i>
                        <strong>+62</strong>
                      </span>
                      <input
                        id="admin-create-account-phone"
                        ref={(node) => { fieldRefs.current.phoneNumber = node; }}
                        type="tel"
                        inputMode="tel"
                        value={form.phoneNumber}
                        onChange={(event) => setField("phoneNumber", event.target.value)}
                        onBlur={() => handleFieldBlur("phoneNumber")}
                        placeholder="812 3456 7890"
                        autoComplete="tel"
                        aria-invalid={Boolean(visibleError("phoneNumber"))}
                        aria-describedby={visibleError("phoneNumber") ? "admin-create-account-phone-error" : undefined}
                        required
                      />
                      <Phone size={18} aria-hidden="true" />
                    </div>
                    <FieldError id="admin-create-account-phone-error" message={visibleError("phoneNumber")} />
                  </div>

                  <div className="admin-signup-2026__field">
                    <label htmlFor="admin-create-account-password">Password</label>
                    <div className={`admin-signup-2026__input${visibleError("password") ? " has-error" : ""}`}>
                      <LockKeyhole size={18} aria-hidden="true" />
                      <input
                        id="admin-create-account-password"
                        ref={(node) => { fieldRefs.current.password = node; }}
                        type={showPassword ? "text" : "password"}
                        value={form.password}
                        onChange={(event) => setField("password", event.target.value)}
                        onBlur={() => handleFieldBlur("password")}
                        placeholder="Create a strong password"
                        autoComplete="new-password"
                        aria-invalid={Boolean(visibleError("password"))}
                        aria-describedby={visibleError("password") ? "admin-create-account-password-error" : "admin-password-strength"}
                        required
                      />
                      <button
                        type="button"
                        className="admin-signup-2026__password-toggle"
                        onClick={() => setShowPassword((current) => !current)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        aria-pressed={showPassword}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    <div
                      className={`admin-signup-2026__strength is-score-${passwordStrength.score}`}
                      id="admin-password-strength"
                      role="status"
                      aria-live="polite"
                    >
                      <div><span>Password strength</span><strong>{passwordStrength.label}</strong></div>
                      <div className="admin-signup-2026__strength-bars" aria-hidden="true">
                        {[1, 2, 3, 4].map((bar) => <i className={bar <= passwordStrength.score ? "is-active" : ""} key={bar} />)}
                      </div>
                      <small>{passwordStrength.helper}</small>
                    </div>
                    <FieldError id="admin-create-account-password-error" message={visibleError("password")} />
                  </div>

                  <div className="admin-signup-2026__field">
                    <label htmlFor="admin-create-account-password-confirm">Confirm password</label>
                    <div className={`admin-signup-2026__input${visibleError("passwordConfirm") ? " has-error" : ""}`}>
                      <LockKeyhole size={18} aria-hidden="true" />
                      <input
                        id="admin-create-account-password-confirm"
                        ref={(node) => { fieldRefs.current.passwordConfirm = node; }}
                        type={showPasswordConfirm ? "text" : "password"}
                        value={form.passwordConfirm}
                        onChange={(event) => setField("passwordConfirm", event.target.value)}
                        onBlur={() => handleFieldBlur("passwordConfirm")}
                        placeholder="Repeat your password"
                        autoComplete="new-password"
                        aria-invalid={Boolean(visibleError("passwordConfirm"))}
                        aria-describedby={visibleError("passwordConfirm") ? "admin-create-account-password-confirm-error" : undefined}
                        required
                      />
                      <button
                        type="button"
                        className="admin-signup-2026__password-toggle"
                        onClick={() => setShowPasswordConfirm((current) => !current)}
                        aria-label={showPasswordConfirm ? "Hide password confirmation" : "Show password confirmation"}
                        aria-pressed={showPasswordConfirm}
                      >
                        {showPasswordConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    <FieldError id="admin-create-account-password-confirm-error" message={visibleError("passwordConfirm")} />
                  </div>

                  <label className="admin-signup-2026__terms">
                    <input
                      ref={(node) => { fieldRefs.current.termsAccepted = node; }}
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={handleTermsChange}
                      aria-invalid={Boolean(visibleError("termsAccepted"))}
                      aria-describedby={visibleError("termsAccepted") ? "admin-create-account-terms-error" : undefined}
                    />
                    <span aria-hidden="true"><Check size={13} strokeWidth={3} /></span>
                    <small>
                      I agree to the <Link to="/terms-and-conditions">Terms of Service</Link> and{" "}
                      <Link to="/privacy-policy">Privacy Policy</Link>.
                    </small>
                  </label>
                  <FieldError id="admin-create-account-terms-error" message={visibleError("termsAccepted")} />

                  <button
                    className="admin-signup-2026__submit"
                    type="submit"
                    disabled={!isFormValid || isSubmitting || cooldownSeconds > 0}
                    aria-busy={isSubmitting}
                  >
                    <span>
                      {isSubmitting
                        ? "Creating account..."
                        : buildCooldownButtonLabel(cooldownSeconds, "Create account")}
                    </span>
                    <ArrowRight size={19} aria-hidden="true" />
                  </button>
                </form>

                <div className="admin-signup-2026__card-footer">
                  <p>Already have an account? <Link to="/admin/login">Login</Link></p>
                  <a href="mailto:support@tpreneurs.com">
                    <Headphones size={16} aria-hidden="true" /> Need help? Contact support
                  </a>
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
