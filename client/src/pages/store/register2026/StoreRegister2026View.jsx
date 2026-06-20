import {
  ArrowLeft,
  ArrowRight,
  Box,
  CheckCircle2,
  Eye,
  EyeOff,
  Gift,
  LockKeyhole,
  Mail,
  MapPin,
  PackageCheck,
  Phone,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  UserRound,
  Zap,
} from "lucide-react";
import "./store-register-2026.css";

const assignRef = (fieldRefs, key) => (node) => {
  if (fieldRefs?.current) {
    fieldRefs.current[key] = node;
  }
};

const benefitItems = [
  {
    icon: ShieldCheck,
    title: "Secure Account",
    text: "Your data is safe with us",
  },
  {
    icon: Zap,
    title: "Faster Checkout",
    text: "Save time on every order",
  },
  {
    icon: PackageCheck,
    title: "Order Tracking",
    text: "Stay updated in real time",
  },
  {
    icon: MapPin,
    title: "Saved Addresses",
    text: "Keep delivery details ready",
  },
];

const mobileBenefits = [
  { icon: Box, label: "Local Products" },
  { icon: Truck, label: "Fast Delivery" },
  { icon: ShieldCheck, label: "Secure Payment" },
];

function FieldError({ id, message }) {
  if (!message) return null;
  return (
    <p className="sr26-field-error" id={id}>
      {message}
    </p>
  );
}

function StatusNotice({ status, statusRef }) {
  if (!status.message) return null;
  return (
    <div
      ref={statusRef}
      className={`sr26-status sr26-status-${status.tone || "neutral"}`}
      role={status.tone === "error" ? "alert" : "status"}
      tabIndex={-1}
    >
      <Sparkles aria-hidden="true" size={16} />
      <span>{status.message}</span>
    </div>
  );
}

function PasswordStrength({ strength }) {
  return (
    <div className="sr26-strength" aria-label={`Password strength: ${strength.label || "empty"}`}>
      <div className="sr26-strength-bars" aria-hidden="true">
        {strength.segments.map((active, index) => (
          <span
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            className={`sr26-strength-bar ${active ? `sr26-strength-bar-active sr26-strength-${strength.tone}` : ""}`}
          />
        ))}
      </div>
      <div className="sr26-strength-row">
        <span>{strength.helper}</span>
        {strength.label ? <strong>{strength.label}</strong> : null}
      </div>
    </div>
  );
}

function RegisterForm({
  viewModel,
  fieldRefs,
  statusRef,
  onChange,
  onSubmit,
  onSignIn,
  onTogglePassword,
  onToggleConfirmPassword,
}) {
  const { form, status, errors, passwordStrength } = viewModel;

  return (
    <form className="sr26-card sr26-register-card" onSubmit={onSubmit} noValidate>
      <div className="sr26-card-head">
        <div>
          <h1>Create your account</h1>
          <p>Join TP Preneurs and start shopping.</p>
        </div>
        <span className="sr26-secure-badge">
          <ShieldCheck aria-hidden="true" size={18} />
          100% Secure
        </span>
      </div>

      <StatusNotice status={status} statusRef={statusRef} />

      <div className="sr26-honeypot" aria-hidden="true">
        <label htmlFor="sr26-company">Company</label>
        <input
          id="sr26-company"
          tabIndex={-1}
          autoComplete="off"
          value={form.honeypot}
          onChange={(event) => onChange("honeypot", event.target.value)}
        />
      </div>

      <div className="sr26-field-grid">
        <div className="sr26-field">
          <label htmlFor="sr26-name">Full name</label>
          <div className="sr26-input-wrap">
            <UserRound aria-hidden="true" size={19} />
            <input
              id="sr26-name"
              ref={assignRef(fieldRefs, "name")}
              type="text"
              value={form.name}
              onChange={(event) => onChange("name", event.target.value)}
              placeholder="Your full name"
              autoComplete="name"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "sr26-name-error" : undefined}
              required
            />
          </div>
          <FieldError id="sr26-name-error" message={errors.name} />
        </div>

        <div className="sr26-field">
          <label htmlFor="sr26-email">Email</label>
          <div className="sr26-input-wrap">
            <Mail aria-hidden="true" size={19} />
            <input
              id="sr26-email"
              ref={assignRef(fieldRefs, "email")}
              type="email"
              value={form.email}
              onChange={(event) => onChange("email", event.target.value)}
              placeholder="you@email.com"
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "sr26-email-error" : undefined}
              required
            />
          </div>
          <FieldError id="sr26-email-error" message={errors.email} />
        </div>
      </div>

      <div className="sr26-field">
        <label htmlFor="sr26-phone">WhatsApp / Phone number</label>
        <div className="sr26-phone-wrap">
          <span className="sr26-country-pill" aria-label="Singapore country code">
            🇸🇬
            <span>⌄</span>
          </span>
          <div className="sr26-input-wrap">
            <Phone aria-hidden="true" size={18} />
            <input
              id="sr26-phone"
              ref={assignRef(fieldRefs, "phoneNumber")}
              type="tel"
              value={form.phoneNumber}
              onChange={(event) => onChange("phoneNumber", event.target.value)}
              placeholder="+65 8123 4567"
              autoComplete="tel"
              aria-invalid={Boolean(errors.phoneNumber)}
              aria-describedby={errors.phoneNumber ? "sr26-phone-error" : "sr26-phone-helper"}
              required
            />
          </div>
        </div>
        <FieldError id="sr26-phone-error" message={errors.phoneNumber} />
        {!errors.phoneNumber ? (
          <p className="sr26-field-helper" id="sr26-phone-helper">
            Use an active number for account recovery and order updates.
          </p>
        ) : null}
      </div>

      <div className="sr26-field-grid">
        <div className="sr26-field">
          <label htmlFor="sr26-password">Password</label>
          <div className="sr26-input-wrap">
            <LockKeyhole aria-hidden="true" size={18} />
            <input
              id="sr26-password"
              ref={assignRef(fieldRefs, "password")}
              type={form.showPassword ? "text" : "password"}
              value={form.password}
              onChange={(event) => onChange("password", event.target.value)}
              placeholder="••••••••••"
              autoComplete="new-password"
              minLength={8}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "sr26-password-error" : undefined}
              required
            />
            <button
              className="sr26-eye-btn"
              type="button"
              onClick={onTogglePassword}
              aria-label={form.showPassword ? "Hide password" : "Show password"}
            >
              {form.showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <FieldError id="sr26-password-error" message={errors.password} />
        </div>

        <div className="sr26-field">
          <label htmlFor="sr26-password-confirm">Confirm password</label>
          <div className="sr26-input-wrap">
            <LockKeyhole aria-hidden="true" size={18} />
            <input
              id="sr26-password-confirm"
              ref={assignRef(fieldRefs, "passwordConfirm")}
              type={form.showPasswordConfirm ? "text" : "password"}
              value={form.passwordConfirm}
              onChange={(event) => onChange("passwordConfirm", event.target.value)}
              placeholder="••••••••••"
              autoComplete="new-password"
              minLength={8}
              aria-invalid={Boolean(errors.passwordConfirm)}
              aria-describedby={
                errors.passwordConfirm
                  ? "sr26-password-confirm-error"
                  : "sr26-password-confirm-helper"
              }
              required
            />
            <button
              className="sr26-eye-btn"
              type="button"
              onClick={onToggleConfirmPassword}
              aria-label={form.showPasswordConfirm ? "Hide password confirmation" : "Show password confirmation"}
            >
              {form.showPasswordConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <FieldError id="sr26-password-confirm-error" message={errors.passwordConfirm} />
        </div>
      </div>

      <PasswordStrength strength={passwordStrength} />
      {!errors.passwordConfirm ? (
        <p className="sr26-field-helper" id="sr26-password-confirm-helper">
          {status.passwordConfirmHelper}
        </p>
      ) : null}

      <label className="sr26-terms">
        <input
          ref={assignRef(fieldRefs, "termsAccepted")}
          type="checkbox"
          checked={form.termsAccepted}
          onChange={(event) => onChange("termsAccepted", event.target.checked)}
          aria-invalid={Boolean(errors.termsAccepted)}
          required
        />
        <span>
          I agree to the{" "}
          <a href="/terms-and-conditions">terms</a> and{" "}
          <a href="/privacy-policy">privacy policy</a>.
        </span>
      </label>
      <FieldError id="sr26-terms-error" message={errors.termsAccepted} />

      <button className="sr26-primary-btn" type="submit" disabled={status.isSubmitting}>
        <span>{status.submitLabel}</span>
        <ArrowRight aria-hidden="true" size={19} />
      </button>

      <p className="sr26-switch">
        Already have an account?{" "}
        <button type="button" onClick={onSignIn}>
          Sign in
        </button>
      </p>
    </form>
  );
}

function OtpForm({
  viewModel,
  fieldRefs,
  statusRef,
  onOtpChange,
  onVerifyOtp,
  onResendOtp,
  onBackToRegister,
}) {
  const { status, otp, errors } = viewModel;
  const destination = otp.destinationMasked || "your email";

  return (
    <form className="sr26-card sr26-otp-card" onSubmit={onVerifyOtp}>
      <div className="sr26-card-head">
        <div>
          <h1>Verify your email</h1>
          <p>Enter the code we sent to {destination}.</p>
        </div>
        <span className="sr26-secure-badge">
          <Mail aria-hidden="true" size={18} />
          {otp.channel}
        </span>
      </div>

      <StatusNotice status={status} statusRef={statusRef} />

      <div className="sr26-otp-info">
        {status.deliveryFailed ? (
          <p>
            We could not deliver the latest verification code. Request a new code when resend is
            available.
          </p>
        ) : (
          <p>
            Your code expires in <strong>{otp.expiresInSeconds || 0} seconds</strong>. Keep this
            page open until verification is complete.
          </p>
        )}
      </div>

      <div className="sr26-field">
        <label htmlFor="sr26-otp">Verification code</label>
        <input
          id="sr26-otp"
          className="sr26-otp-input"
          ref={assignRef(fieldRefs, "otpCode")}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          value={otp.code}
          onChange={(event) => onOtpChange(event.target.value)}
          placeholder="123456"
          aria-invalid={Boolean(errors.otpCode)}
          aria-describedby={errors.otpCode ? "sr26-otp-error" : "sr26-otp-helper"}
          required
        />
        <FieldError id="sr26-otp-error" message={errors.otpCode} />
        {!errors.otpCode ? (
          <p className="sr26-field-helper" id="sr26-otp-helper">
            We only activate your account after this code is verified.
          </p>
        ) : null}
      </div>

      <button
        className="sr26-primary-btn"
        type="submit"
        disabled={status.isVerifying || !status.canSubmitOtp}
      >
        <span>{status.verifyLabel}</span>
        <CheckCircle2 aria-hidden="true" size={19} />
      </button>

      <button
        className="sr26-secondary-btn"
        type="button"
        onClick={onResendOtp}
        disabled={status.isResending || status.countdown > 0}
      >
        {status.resendLabel}
      </button>

      <button className="sr26-link-btn" type="button" onClick={onBackToRegister}>
        <ArrowLeft aria-hidden="true" size={17} />
        Back to register
      </button>
    </form>
  );
}

export default function StoreRegister2026View({
  viewModel,
  fieldRefs,
  statusRef,
  onChange,
  onSubmit,
  onSignIn,
  onTogglePassword,
  onToggleConfirmPassword,
  onOtpChange,
  onVerifyOtp,
  onResendOtp,
  onBackToRegister,
}) {
  const isOtp = viewModel.mode === "verify";

  return (
    <main className="sr26-page">
      <div className="sr26-bg-orb sr26-bg-orb-left" aria-hidden="true" />
      <div className="sr26-bg-orb sr26-bg-orb-right" aria-hidden="true" />

      <section className="sr26-shell" aria-label="Create account">
        <aside className="sr26-left-card">
          <span className="sr26-kicker">Welcome to TP Preneurs</span>
          <h2>Create your account and start shopping</h2>
          <p>Join happy customers and unlock the best local products.</p>

          <div className="sr26-benefits">
            {benefitItems.map((item) => {
              const Icon = item.icon;
              return (
                <div className="sr26-benefit" key={item.title}>
                  <span>
                    <Icon aria-hidden="true" size={24} />
                  </span>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="sr26-mini-scene" aria-hidden="true">
            <ShoppingBag size={74} />
            <ShieldCheck size={62} />
            <Gift size={44} />
          </div>
        </aside>

        <section className="sr26-center">
          {isOtp ? (
            <OtpForm
              viewModel={viewModel}
              fieldRefs={fieldRefs}
              statusRef={statusRef}
              onOtpChange={onOtpChange}
              onVerifyOtp={onVerifyOtp}
              onResendOtp={onResendOtp}
              onBackToRegister={onBackToRegister}
            />
          ) : (
            <RegisterForm
              viewModel={viewModel}
              fieldRefs={fieldRefs}
              statusRef={statusRef}
              onChange={onChange}
              onSubmit={onSubmit}
              onSignIn={onSignIn}
              onTogglePassword={onTogglePassword}
              onToggleConfirmPassword={onToggleConfirmPassword}
            />
          )}
        </section>

        <aside className="sr26-visual" aria-hidden="true">
          <div className="sr26-rings">
            <span />
            <span />
            <span />
          </div>
          <div className="sr26-shield">
            <ShieldCheck size={120} strokeWidth={1.35} />
          </div>
          <div className="sr26-bag">
            <ShoppingBag size={116} strokeWidth={1.25} />
          </div>
          <div className="sr26-cube sr26-cube-one" />
          <div className="sr26-cube sr26-cube-two" />
        </aside>
      </section>

      <section className="sr26-mobile-strip" aria-label="Shopping benefits">
        {mobileBenefits.map((item) => {
          const Icon = item.icon;
          return (
            <div className="sr26-mobile-benefit" key={item.label}>
              <span>
                <Icon aria-hidden="true" size={22} />
              </span>
              <p>{item.label}</p>
            </div>
          );
        })}
      </section>
    </main>
  );
}

