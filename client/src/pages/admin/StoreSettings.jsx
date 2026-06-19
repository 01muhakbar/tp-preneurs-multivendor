import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  CreditCard,
  Eye,
  EyeOff,
  RefreshCw,
  Save,
  ShieldAlert,
} from "lucide-react";
import {
  fetchAdminStoreSettings,
  updateAdminStoreSettings,
} from "../../lib/adminApi.js";
import "./StoreSettings.css";

const STRIPE_PUBLISHABLE_KEY_REGEX = /^pk_(test|live)_[A-Za-z0-9]+$/;
const STRIPE_SECRET_KEY_REGEX = /^sk_(test|live)_[A-Za-z0-9]+$/;
const RAZORPAY_KEY_ID_REGEX = /^rzp_(test|live)_[A-Za-z0-9]+$/;
const GOOGLE_ANALYTICS_KEY_REGEX = /^(G|AW|UA)-[A-Z0-9-]+$/i;

const DEFAULT_FORM = {
  cashOnDelivery: true,
  stripeEnabled: true,
  stripeKey: "",
  stripeSecret: "",
  stripeWebhookSecret: "",
  razorpayEnabled: false,
  razorpayKeyId: "",
  razorpayKeySecret: "",
  googleLogin: true,
  googleClientId: "",
  googleSecretKey: "",
  githubLogin: true,
  githubClientId: "",
  githubSecret: "",
  facebookLogin: true,
  facebookAppId: "",
  facebookSecret: "",
  googleAnalytics: true,
  googleAnalyticKey: "",
  tawkChat: true,
  tawkPropertyId: "",
  tawkWidgetId: "",
};

const isPlainObject = (value) =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const unwrapEnvelope = (response) => response?.data?.data ?? response?.data ?? response ?? {};

const getStoreSettingsPayload = (response) => {
  const payload = unwrapEnvelope(response);
  return payload?.storeSettings ?? payload?.settings ?? payload;
};

const getDiagnosticsPayload = (response) => {
  const payload = unwrapEnvelope(response);
  return payload?.diagnostics ?? {};
};

const text = (value, fallback = "") => {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
};

const bool = (value, fallback = false) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "on"].includes(normalized)) return true;
    if (["false", "0", "no", "off"].includes(normalized)) return false;
  }
  return fallback;
};

const normalizeStoreSettings = (raw) => {
  const source = isPlainObject(raw) ? raw : {};
  const payments = isPlainObject(source.payments) ? source.payments : {};
  const paymentMethods = isPlainObject(source.paymentMethods) ? source.paymentMethods : {};
  const stripe = isPlainObject(paymentMethods.stripe) ? paymentMethods.stripe : {};
  const razorpay = isPlainObject(paymentMethods.razorpay) ? paymentMethods.razorpay : {};
  const cod = isPlainObject(paymentMethods.cashOnDelivery)
    ? paymentMethods.cashOnDelivery
    : {};
  const social = isPlainObject(source.socialLogin) ? source.socialLogin : {};
  const google = isPlainObject(social.google) ? social.google : {};
  const github = isPlainObject(social.github) ? social.github : {};
  const facebook = isPlainObject(social.facebook) ? social.facebook : {};
  const analytics = isPlainObject(source.analytics) ? source.analytics : {};
  const analyticsGoogle = isPlainObject(analytics.google) ? analytics.google : {};
  const chat = isPlainObject(source.chat) ? source.chat : {};
  const tawk = isPlainObject(chat.tawk) ? chat.tawk : {};

  return {
    cashOnDelivery: bool(
      source.cashOnDelivery ?? payments.cashOnDeliveryEnabled ?? cod.enabled,
      DEFAULT_FORM.cashOnDelivery
    ),
    stripeEnabled: bool(
      source.stripePayment ?? source.stripeEnabled ?? payments.stripeEnabled ?? stripe.enabled,
      DEFAULT_FORM.stripeEnabled
    ),
    stripeKey: text(source.stripeKey ?? payments.stripeKey ?? stripe.key),
    stripeSecret: text(source.stripeSecret ?? payments.stripeSecret ?? stripe.secret),
    stripeWebhookSecret: text(
      source.stripeWebhookSecret ?? payments.stripeWebhookSecret ?? stripe.webhookSecret
    ),
    razorpayEnabled: bool(
      source.razorpay ?? source.razorpayEnabled ?? payments.razorPayEnabled ?? razorpay.enabled,
      DEFAULT_FORM.razorpayEnabled
    ),
    razorpayKeyId: text(
      source.razorpayKeyId ?? payments.razorPayKeyId ?? razorpay.keyId
    ),
    razorpayKeySecret: text(
      source.razorpayKeySecret ?? payments.razorPayKeySecret ?? razorpay.keySecret
    ),
    googleLogin: bool(
      source.googleLogin ?? social.googleEnabled ?? google.enabled,
      DEFAULT_FORM.googleLogin
    ),
    googleClientId: text(source.googleClientId ?? social.googleClientId ?? google.clientId),
    googleSecretKey: text(source.googleSecretKey ?? social.googleSecretKey ?? google.secret),
    githubLogin: bool(
      source.githubLogin ?? social.githubEnabled ?? github.enabled,
      DEFAULT_FORM.githubLogin
    ),
    githubClientId: text(
      source.githubClientId ?? source.githubId ?? social.githubClientId ?? social.githubId ?? github.clientId
    ),
    githubSecret: text(source.githubSecret ?? social.githubSecret ?? github.secret),
    facebookLogin: bool(
      source.facebookLogin ?? social.facebookEnabled ?? facebook.enabled,
      DEFAULT_FORM.facebookLogin
    ),
    facebookAppId: text(
      source.facebookAppId ?? source.facebookId ?? social.facebookAppId ?? social.facebookId ?? facebook.appId
    ),
    facebookSecret: text(
      source.facebookAppSecret ?? source.facebookSecret ?? social.facebookAppSecret ?? social.facebookSecret ?? facebook.secret
    ),
    googleAnalytics: bool(
      source.googleAnalytics ?? analytics.googleAnalyticsEnabled ?? analyticsGoogle.enabled,
      DEFAULT_FORM.googleAnalytics
    ),
    googleAnalyticKey: text(
      source.googleAnalyticKey ?? analytics.googleAnalyticKey ?? analyticsGoogle.measurementId
    ),
    tawkChat: bool(source.tawkChat ?? chat.tawkEnabled ?? tawk.enabled, DEFAULT_FORM.tawkChat),
    tawkPropertyId: text(source.tawkPropertyId ?? chat.tawkPropertyId ?? tawk.propertyId),
    tawkWidgetId: text(source.tawkWidgetId ?? chat.tawkWidgetId ?? tawk.widgetId),
  };
};

const hasConfiguredSecret = (diagnostics, path) =>
  path.reduce((node, key) => node?.[key], diagnostics)?.secretConfigured === true;

const buildValidationIssues = (form) => {
  const issues = [];
  if (form.stripeKey && !STRIPE_PUBLISHABLE_KEY_REGEX.test(form.stripeKey)) {
    issues.push("Stripe key invalid");
  }
  if (form.stripeSecret && !STRIPE_SECRET_KEY_REGEX.test(form.stripeSecret)) {
    issues.push("Stripe secret invalid");
  }
  if (form.razorpayKeyId && !RAZORPAY_KEY_ID_REGEX.test(form.razorpayKeyId)) {
    issues.push("Razorpay key invalid");
  }
  if (
    form.googleAnalyticKey &&
    !GOOGLE_ANALYTICS_KEY_REGEX.test(form.googleAnalyticKey)
  ) {
    issues.push("Google Analytics ID invalid");
  }
  return issues;
};

const getProviderStatus = ({ enabled, missing, invalid = false }) => {
  if (!enabled) return { label: "Off", tone: "neutral" };
  if (invalid) return { label: "Invalid", tone: "danger" };
  if (missing) return { label: "Missing", tone: "warning" };
  return { label: "Ready", tone: "success" };
};

const getPaymentStatus = ({ enabled, missing, invalid = false }) => {
  if (!enabled) return { label: "Disabled", tone: "neutral" };
  if (invalid) return { label: "Invalid", tone: "danger" };
  if (missing) return { label: "Missing", tone: "warning" };
  return { label: "Ready", tone: "success" };
};

const buildUpdatePayload = (rawSettings, form) => {
  const source = isPlainObject(rawSettings) ? rawSettings : {};
  const payments = isPlainObject(source.payments) ? source.payments : {};
  const paymentMethods = isPlainObject(source.paymentMethods) ? source.paymentMethods : {};
  const socialLogin = isPlainObject(source.socialLogin) ? source.socialLogin : {};
  const analytics = isPlainObject(source.analytics) ? source.analytics : {};
  const chat = isPlainObject(source.chat) ? source.chat : {};

  return {
    ...source,
    cashOnDelivery: form.cashOnDelivery,
    stripePayment: form.stripeEnabled,
    stripeEnabled: form.stripeEnabled,
    stripeKey: form.stripeKey,
    stripeSecret: form.stripeSecret,
    stripeWebhookSecret: form.stripeWebhookSecret,
    razorpay: form.razorpayEnabled,
    razorpayEnabled: form.razorpayEnabled,
    razorpayKeyId: form.razorpayKeyId,
    razorpayKeySecret: form.razorpayKeySecret,
    googleLogin: form.googleLogin,
    googleClientId: form.googleClientId,
    googleSecretKey: form.googleSecretKey,
    githubLogin: form.githubLogin,
    githubId: form.githubClientId,
    githubClientId: form.githubClientId,
    githubSecret: form.githubSecret,
    facebookLogin: form.facebookLogin,
    facebookId: form.facebookAppId,
    facebookAppId: form.facebookAppId,
    facebookSecret: form.facebookSecret,
    facebookAppSecret: form.facebookSecret,
    googleAnalytics: form.googleAnalytics,
    googleAnalyticKey: form.googleAnalyticKey,
    tawkChat: form.tawkChat,
    tawkPropertyId: form.tawkPropertyId,
    tawkWidgetId: form.tawkWidgetId,
    payments: {
      ...payments,
      cashOnDeliveryEnabled: form.cashOnDelivery,
      stripeEnabled: form.stripeEnabled,
      stripeKey: form.stripeKey,
      stripeSecret: form.stripeSecret,
      stripeWebhookSecret: form.stripeWebhookSecret,
      razorPayEnabled: form.razorpayEnabled,
      razorPayKeyId: form.razorpayKeyId,
      razorPayKeySecret: form.razorpayKeySecret,
    },
    paymentMethods: {
      ...paymentMethods,
      cashOnDelivery: {
        ...(isPlainObject(paymentMethods.cashOnDelivery) ? paymentMethods.cashOnDelivery : {}),
        enabled: form.cashOnDelivery,
      },
      stripe: {
        ...(isPlainObject(paymentMethods.stripe) ? paymentMethods.stripe : {}),
        enabled: form.stripeEnabled,
        key: form.stripeKey,
        secret: form.stripeSecret,
        webhookSecret: form.stripeWebhookSecret,
      },
      razorpay: {
        ...(isPlainObject(paymentMethods.razorpay) ? paymentMethods.razorpay : {}),
        enabled: form.razorpayEnabled,
        keyId: form.razorpayKeyId,
        keySecret: form.razorpayKeySecret,
      },
    },
    socialLogin: {
      ...socialLogin,
      googleEnabled: form.googleLogin,
      googleClientId: form.googleClientId,
      googleSecretKey: form.googleSecretKey,
      githubEnabled: form.githubLogin,
      githubId: form.githubClientId,
      githubClientId: form.githubClientId,
      githubSecret: form.githubSecret,
      facebookEnabled: form.facebookLogin,
      facebookId: form.facebookAppId,
      facebookAppId: form.facebookAppId,
      facebookSecret: form.facebookSecret,
      facebookAppSecret: form.facebookSecret,
      google: {
        ...(isPlainObject(socialLogin.google) ? socialLogin.google : {}),
        enabled: form.googleLogin,
        clientId: form.googleClientId,
        secret: form.googleSecretKey,
      },
      github: {
        ...(isPlainObject(socialLogin.github) ? socialLogin.github : {}),
        enabled: form.githubLogin,
        clientId: form.githubClientId,
        secret: form.githubSecret,
      },
      facebook: {
        ...(isPlainObject(socialLogin.facebook) ? socialLogin.facebook : {}),
        enabled: form.facebookLogin,
        appId: form.facebookAppId,
        secret: form.facebookSecret,
      },
    },
    analytics: {
      ...analytics,
      googleAnalyticsEnabled: form.googleAnalytics,
      googleAnalyticKey: form.googleAnalyticKey,
      google: {
        ...(isPlainObject(analytics.google) ? analytics.google : {}),
        enabled: form.googleAnalytics,
        measurementId: form.googleAnalyticKey,
      },
    },
    chat: {
      ...chat,
      tawkEnabled: form.tawkChat,
      tawkPropertyId: form.tawkPropertyId,
      tawkWidgetId: form.tawkWidgetId,
      tawk: {
        ...(isPlainObject(chat.tawk) ? chat.tawk : {}),
        enabled: form.tawkChat,
        propertyId: form.tawkPropertyId,
        widgetId: form.tawkWidgetId,
      },
    },
  };
};

function StatusBadge({ status }) {
  return (
    <span className={`store-settings-badge store-settings-badge--${status.tone}`}>
      {status.label}
    </span>
  );
}

function KpiCard({ icon: Icon, title, value, helper, tone }) {
  return (
    <section className={`store-settings-kpi store-settings-kpi--${tone}`}>
      <div className="store-settings-kpi__icon">
        <Icon size={18} aria-hidden="true" />
      </div>
      <div>
        <span>{title}</span>
        <strong>{value}</strong>
        <small>{helper}</small>
      </div>
    </section>
  );
}

function Toggle({ value, onChange, disabled = false }) {
  return (
    <div className="store-settings-toggle" role="group" aria-label="Toggle">
      <button
        type="button"
        disabled={disabled}
        className={value ? "is-active" : ""}
        onClick={() => onChange(true)}
      >
        Yes
      </button>
      <button
        type="button"
        disabled={disabled}
        className={!value ? "is-active" : ""}
        onClick={() => onChange(false)}
      >
        No
      </button>
    </div>
  );
}

function TextField({ label, value, onChange, placeholder, disabled = false }) {
  return (
    <label className="store-settings-field">
      <span>{label}</span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function SecretField({
  label,
  value,
  onChange,
  placeholder,
  disabled = false,
  visible,
  onToggle,
}) {
  return (
    <label className="store-settings-field">
      <span>{label}</span>
      <div className="store-settings-secret">
        <input
          type={visible ? "text" : "password"}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
        />
        <button type="button" onClick={onToggle} disabled={disabled} aria-label="Toggle visibility">
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </label>
  );
}

function Panel({ title, subtitle, badge, children, className = "" }) {
  return (
    <section className={`store-settings-panel ${className}`}>
      <div className="store-settings-panel__head">
        <div>
          <h2>{title}</h2>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        {badge ? <StatusBadge status={badge} /> : null}
      </div>
      {children}
    </section>
  );
}

function LoadingState() {
  return (
    <div className="store-settings-2026">
      <div className="store-settings-state">
        <span className="store-settings-spinner" />
        <strong>Loading store settings</strong>
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="store-settings-2026">
      <div className="store-settings-state store-settings-state--error">
        <ShieldAlert size={28} aria-hidden="true" />
        <strong>Unable to load settings</strong>
        <p>{message}</p>
        <button type="button" onClick={onRetry}>
          <RefreshCw size={16} aria-hidden="true" />
          Retry
        </button>
      </div>
    </div>
  );
}

export default function StoreSettingsPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(DEFAULT_FORM);
  const [serverForm, setServerForm] = useState(DEFAULT_FORM);
  const [rawSettings, setRawSettings] = useState({});
  const [visibleSecrets, setVisibleSecrets] = useState({});

  const settingsQuery = useQuery({
    queryKey: ["admin-store-settings"],
    queryFn: fetchAdminStoreSettings,
  });

  useEffect(() => {
    if (!settingsQuery.data) return;
    const raw = getStoreSettingsPayload(settingsQuery.data);
    const normalized = normalizeStoreSettings(raw);
    setRawSettings(isPlainObject(raw) ? raw : {});
    setForm(normalized);
    setServerForm(normalized);
  }, [settingsQuery.data]);

  const diagnostics = useMemo(
    () => getDiagnosticsPayload(settingsQuery.data),
    [settingsQuery.data]
  );

  const fatalIssues = useMemo(() => buildValidationIssues(form), [form]);

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const toggleSecret = (key) => {
    setVisibleSecrets((current) => ({ ...current, [key]: !current[key] }));
  };

  const mutation = useMutation({
    mutationFn: (payload) => updateAdminStoreSettings(payload),
    onSuccess: (data) => {
      const raw = getStoreSettingsPayload(data);
      const normalized = normalizeStoreSettings(raw);
      setRawSettings(isPlainObject(raw) ? raw : {});
      setForm(normalized);
      setServerForm(normalized);
      toast.success("Store settings updated");
      queryClient.invalidateQueries({ queryKey: ["admin-store-settings"] });
      queryClient.invalidateQueries({ queryKey: ["store-settings", "public"], exact: false });
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.message || error?.message || "Failed to update store settings."
      );
    },
  });

  const stripeSecretConfigured = hasConfiguredSecret(diagnostics, [
    "payments",
    "stripe",
  ]);
  const stripeWebhookConfigured = hasConfiguredSecret(diagnostics, [
    "payments",
    "stripeWebhook",
  ]);
  const razorpaySecretConfigured = hasConfiguredSecret(diagnostics, [
    "payments",
    "razorpay",
  ]);
  const googleSecretConfigured = hasConfiguredSecret(diagnostics, [
    "socialLogin",
    "google",
  ]);
  const githubSecretConfigured = hasConfiguredSecret(diagnostics, [
    "socialLogin",
    "github",
  ]);
  const facebookSecretConfigured = hasConfiguredSecret(diagnostics, [
    "socialLogin",
    "facebook",
  ]);

  const stripeStatus = getPaymentStatus({
    enabled: form.stripeEnabled,
    invalid:
      (form.stripeKey && !STRIPE_PUBLISHABLE_KEY_REGEX.test(form.stripeKey)) ||
      (form.stripeSecret && !STRIPE_SECRET_KEY_REGEX.test(form.stripeSecret)),
    missing:
      !form.stripeKey ||
      (!form.stripeSecret && !stripeSecretConfigured) ||
      (!form.stripeWebhookSecret && !stripeWebhookConfigured),
  });
  const razorpayStatus = getPaymentStatus({
    enabled: form.razorpayEnabled,
    invalid: form.razorpayKeyId && !RAZORPAY_KEY_ID_REGEX.test(form.razorpayKeyId),
    missing:
      !form.razorpayKeyId || (!form.razorpayKeySecret && !razorpaySecretConfigured),
  });
  const googleStatus = getProviderStatus({
    enabled: form.googleLogin,
    missing: !form.googleClientId || (!form.googleSecretKey && !googleSecretConfigured),
  });
  const githubStatus = getProviderStatus({
    enabled: form.githubLogin,
    missing: !form.githubClientId || (!form.githubSecret && !githubSecretConfigured),
  });
  const facebookStatus = getProviderStatus({
    enabled: form.facebookLogin,
    missing: !form.facebookAppId || (!form.facebookSecret && !facebookSecretConfigured),
  });
  const analyticsStatus = getProviderStatus({
    enabled: form.googleAnalytics,
    invalid:
      form.googleAnalyticKey &&
      !GOOGLE_ANALYTICS_KEY_REGEX.test(form.googleAnalyticKey),
    missing: !form.googleAnalyticKey,
  });
  const tawkStatus = getProviderStatus({
    enabled: form.tawkChat,
    missing: !form.tawkPropertyId || !form.tawkWidgetId,
  });

  const checkoutActive = [
    form.cashOnDelivery,
    form.stripeEnabled && stripeStatus.label === "Ready",
    form.razorpayEnabled && razorpayStatus.label === "Ready",
  ].filter(Boolean).length;
  const enabledPayments = [
    form.cashOnDelivery,
    form.stripeEnabled,
    form.razorpayEnabled,
  ].filter(Boolean).length;
  const enabledIntegrations = [
    form.googleAnalytics,
    form.tawkChat,
  ].filter(Boolean).length;

  const submitSettings = (event) => {
    event.preventDefault();
    if (fatalIssues.length > 0) {
      toast.error("Fix validation issues before saving.");
      return;
    }
    mutation.mutate({ storeSettings: buildUpdatePayload(rawSettings, form) });
  };

  const resetForm = () => {
    setForm(serverForm);
    toast.success("Settings reset");
  };

  if (settingsQuery.isLoading) return <LoadingState />;

  if (settingsQuery.isError) {
    return (
      <ErrorState
        message={
          settingsQuery.error?.response?.data?.message ||
          settingsQuery.error?.message ||
          "Failed to load store settings."
        }
        onRetry={() => settingsQuery.refetch()}
      />
    );
  }

  return (
    <form className="store-settings-2026" onSubmit={submitSettings}>
      <section className="store-settings-hero">
        <div>
          <span className="store-settings-eyebrow">Online Store</span>
          <h1>Store Settings</h1>
          <p>Checkout, login, analytics, integrations.</p>
        </div>
        <button type="submit" className="store-settings-primary" disabled={mutation.isPending}>
          <Save size={16} aria-hidden="true" />
          {mutation.isPending ? "Updating..." : "Update"}
        </button>
      </section>

      <section className="store-settings-kpis" aria-label="Store settings summary">
        <KpiCard
          icon={CheckCircle2}
          title="Checkout"
          value={checkoutActive}
          helper="active"
          tone={checkoutActive > 0 ? "green" : "amber"}
        />
        <KpiCard
          icon={CreditCard}
          title="Payments"
          value={`${enabledPayments} / 3`}
          helper={enabledPayments === 3 ? "Ready" : "Incomplete"}
          tone={enabledPayments === 3 ? "green" : "amber"}
        />
        <KpiCard
          icon={BarChart3}
          title="Integrations"
          value={`${enabledIntegrations} / 2`}
          helper={enabledIntegrations === 2 ? "Ready" : "Incomplete"}
          tone="blue"
        />
        <KpiCard
          icon={ShieldAlert}
          title="Issues"
          value={fatalIssues.length}
          helper={fatalIssues.length > 0 ? "Needs attention" : "Clear"}
          tone={fatalIssues.length > 0 ? "red" : "green"}
        />
      </section>

      {fatalIssues.length > 0 ? (
        <section className="store-settings-validation">
          <AlertTriangle size={22} aria-hidden="true" />
          <div>
            <h2>Validation issues</h2>
            <ul>
              {fatalIssues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <Panel
        title="Payment Methods"
        subtitle="Active checkout methods."
        className="store-settings-panel--wide"
      >
        <div className="store-settings-payment-grid">
          <div className="store-settings-stack">
            <div className="store-settings-availability">
              <strong>Availability</strong>
              <StatusBadge status={{ label: `${checkoutActive} active`, tone: "success" }} />
            </div>

            <Panel title="Cash on Delivery" badge={{ label: form.cashOnDelivery ? "Ready" : "Off", tone: form.cashOnDelivery ? "success" : "neutral" }}>
              <Toggle
                value={form.cashOnDelivery}
                onChange={(value) => setField("cashOnDelivery", value)}
              />
            </Panel>

            <Panel title="Razorpay" badge={razorpayStatus}>
              <Toggle
                value={form.razorpayEnabled}
                onChange={(value) => setField("razorpayEnabled", value)}
              />
              <TextField
                label="Razorpay Key ID"
                value={form.razorpayKeyId}
                placeholder="Enter key ID"
                disabled={!form.razorpayEnabled}
                onChange={(value) => setField("razorpayKeyId", value)}
              />
              <SecretField
                label="Razorpay Secret"
                value={form.razorpayKeySecret}
                placeholder={razorpaySecretConfigured ? "Saved secret" : "Enter secret"}
                disabled={!form.razorpayEnabled}
                visible={visibleSecrets.razorpay}
                onToggle={() => toggleSecret("razorpay")}
                onChange={(value) => setField("razorpayKeySecret", value)}
              />
            </Panel>
          </div>

          <Panel title="Stripe" badge={stripeStatus}>
            <Toggle
              value={form.stripeEnabled}
              onChange={(value) => setField("stripeEnabled", value)}
            />
            <TextField
              label="Stripe Key"
              value={form.stripeKey}
              placeholder="pk_test_..."
              disabled={!form.stripeEnabled}
              onChange={(value) => setField("stripeKey", value)}
            />
            <SecretField
              label="Stripe Secret"
              value={form.stripeSecret}
              placeholder={stripeSecretConfigured ? "Saved secret" : "sk_test_..."}
              disabled={!form.stripeEnabled}
              visible={visibleSecrets.stripe}
              onToggle={() => toggleSecret("stripe")}
              onChange={(value) => setField("stripeSecret", value)}
            />
            <SecretField
              label="Webhook Secret"
              value={form.stripeWebhookSecret}
              placeholder={stripeWebhookConfigured ? "Saved secret" : "Enter secret"}
              disabled={!form.stripeEnabled}
              visible={visibleSecrets.stripeWebhook}
              onToggle={() => toggleSecret("stripeWebhook")}
              onChange={(value) => setField("stripeWebhookSecret", value)}
            />
          </Panel>
        </div>
      </Panel>

      <Panel title="Social Login" subtitle="OAuth providers.">
        <div className="store-settings-social-grid">
          <Panel title="Google" badge={googleStatus}>
            <Toggle value={form.googleLogin} onChange={(value) => setField("googleLogin", value)} />
            <TextField
              label="Client ID"
              value={form.googleClientId}
              placeholder="Enter client ID"
              disabled={!form.googleLogin}
              onChange={(value) => setField("googleClientId", value)}
            />
            <SecretField
              label="Client Secret"
              value={form.googleSecretKey}
              placeholder={googleSecretConfigured ? "Saved secret" : "Enter secret"}
              disabled={!form.googleLogin}
              visible={visibleSecrets.google}
              onToggle={() => toggleSecret("google")}
              onChange={(value) => setField("googleSecretKey", value)}
            />
          </Panel>

          <Panel title="GitHub" badge={githubStatus}>
            <Toggle value={form.githubLogin} onChange={(value) => setField("githubLogin", value)} />
            <TextField
              label="Client ID"
              value={form.githubClientId}
              placeholder="Enter client ID"
              disabled={!form.githubLogin}
              onChange={(value) => setField("githubClientId", value)}
            />
            <SecretField
              label="Client Secret"
              value={form.githubSecret}
              placeholder={githubSecretConfigured ? "Saved secret" : "Enter secret"}
              disabled={!form.githubLogin}
              visible={visibleSecrets.github}
              onToggle={() => toggleSecret("github")}
              onChange={(value) => setField("githubSecret", value)}
            />
          </Panel>

          <Panel title="Facebook" badge={facebookStatus}>
            <Toggle value={form.facebookLogin} onChange={(value) => setField("facebookLogin", value)} />
            <TextField
              label="App ID"
              value={form.facebookAppId}
              placeholder="Enter app ID"
              disabled={!form.facebookLogin}
              onChange={(value) => setField("facebookAppId", value)}
            />
            <SecretField
              label="App Secret"
              value={form.facebookSecret}
              placeholder={facebookSecretConfigured ? "Saved secret" : "Enter secret"}
              disabled={!form.facebookLogin}
              visible={visibleSecrets.facebook}
              onToggle={() => toggleSecret("facebook")}
              onChange={(value) => setField("facebookSecret", value)}
            />
          </Panel>
        </div>
      </Panel>

      <Panel title="Analytics & Chat" subtitle="Public integrations.">
        <div className="store-settings-integrations-grid">
          <Panel title="Google Analytics" badge={analyticsStatus}>
            <Toggle
              value={form.googleAnalytics}
              onChange={(value) => setField("googleAnalytics", value)}
            />
            <TextField
              label="GA ID"
              value={form.googleAnalyticKey}
              placeholder="Enter GA ID"
              disabled={!form.googleAnalytics}
              onChange={(value) => setField("googleAnalyticKey", value)}
            />
          </Panel>

          <Panel title="Tawk Chat" badge={tawkStatus}>
            <Toggle value={form.tawkChat} onChange={(value) => setField("tawkChat", value)} />
            <div className="store-settings-two-fields">
              <TextField
                label="Property ID"
                value={form.tawkPropertyId}
                placeholder="Enter property ID"
                disabled={!form.tawkChat}
                onChange={(value) => setField("tawkPropertyId", value)}
              />
              <TextField
                label="Widget ID"
                value={form.tawkWidgetId}
                placeholder="Enter widget ID"
                disabled={!form.tawkChat}
                onChange={(value) => setField("tawkWidgetId", value)}
              />
            </div>
          </Panel>
        </div>
      </Panel>

      <div className="store-settings-savebar">
        <span>Settings are validated on update.</span>
        <div>
          <button type="button" className="store-settings-secondary" onClick={resetForm}>
            Reset
          </button>
          <button type="submit" className="store-settings-primary" disabled={mutation.isPending}>
            {mutation.isPending ? "Updating..." : "Update"}
          </button>
        </div>
      </div>
    </form>
  );
}
