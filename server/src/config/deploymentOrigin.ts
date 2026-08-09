const trimEnv = (key: string) => String(process.env[key] || "").trim();

const normalizeHttpOrigin = (value: string) => {
  const candidate = value.trim().replace(/\/+$/, "");
  if (!candidate) return "";
  try {
    const url = new URL(candidate);
    return `${url.protocol}//${url.host}`;
  } catch {
    return "";
  }
};

export const getRenderExternalOrigin = () => {
  const explicitUrl = normalizeHttpOrigin(trimEnv("RENDER_EXTERNAL_URL"));
  if (explicitUrl) return explicitUrl;

  const hostname = trimEnv("RENDER_EXTERNAL_HOSTNAME").replace(/^https?:\/\//i, "").replace(/\/+$/, "");
  if (!hostname) return "";
  return `https://${hostname}`;
};

export const getKoyebExternalOrigin = () => {
  const hostname = trimEnv("KOYEB_PUBLIC_DOMAIN").replace(/^https?:\/\//i, "").replace(/\/+$/, "");
  if (!hostname) return "";
  return `https://${hostname}`;
};

export const getConfiguredPublicOrigin = () =>
  normalizeHttpOrigin(
    trimEnv("PUBLIC_BASE_URL") ||
      trimEnv("CLIENT_PUBLIC_BASE_URL") ||
      trimEnv("STORE_PUBLIC_BASE_URL") ||
      trimEnv("CLIENT_URL") ||
      trimEnv("CORS_ORIGIN")
  );

export const getRuntimePublicOrigin = () =>
  getConfiguredPublicOrigin() || getRenderExternalOrigin() || getKoyebExternalOrigin();

export const applyDeploymentOriginFallbacks = () => {
  if (process.env.NODE_ENV !== "production") return;

  const runtimeOrigin = getRenderExternalOrigin() || getKoyebExternalOrigin();
  if (!runtimeOrigin) return;

  if (!trimEnv("CLIENT_URL")) process.env.CLIENT_URL = runtimeOrigin;
  if (!trimEnv("CORS_ORIGIN")) process.env.CORS_ORIGIN = runtimeOrigin;
  if (!trimEnv("PUBLIC_BASE_URL")) process.env.PUBLIC_BASE_URL = runtimeOrigin;
};

export const applyRenderExternalOriginFallbacks = applyDeploymentOriginFallbacks;
