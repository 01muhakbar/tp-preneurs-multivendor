import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "tp_storefront_theme";
const THEMES = new Set(["light", "dark", "system"]);
const ThemeContext = createContext(null);

const canUseDOM = () => typeof window !== "undefined" && typeof document !== "undefined";

const normalizeTheme = (value) => (THEMES.has(value) ? value : "system");

const readStoredTheme = () => {
  if (!canUseDOM()) return "system";
  try {
    return normalizeTheme(window.localStorage?.getItem(STORAGE_KEY) || "system");
  } catch {
    return "system";
  }
};

const getSystemTheme = () => {
  if (!canUseDOM() || typeof window.matchMedia !== "function") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const resolveTheme = (preference) => {
  const normalized = normalizeTheme(preference);
  if (normalized === "system") return getSystemTheme();
  return normalized;
};

const applyResolvedTheme = (preference, resolvedTheme) => {
  if (!canUseDOM()) return;
  const root = document.documentElement;
  root.classList.toggle("dark", resolvedTheme === "dark");
  root.dataset.theme = resolvedTheme;
  root.dataset.themePreference = normalizeTheme(preference);
  root.style.colorScheme = resolvedTheme;

  const themeColor = resolvedTheme === "dark" ? "#020617" : "#f8fafc";
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", themeColor);
  }
};

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(readStoredTheme);
  const [systemTheme, setSystemTheme] = useState(getSystemTheme);
  const resolvedTheme = theme === "system" ? systemTheme : theme;

  useEffect(() => {
    if (!canUseDOM() || typeof window.matchMedia !== "function") return undefined;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event) => {
      setSystemTheme(event.matches ? "dark" : "light");
    };

    setSystemTheme(media.matches ? "dark" : "light");
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", handleChange);
      return () => media.removeEventListener("change", handleChange);
    }
    media.addListener(handleChange);
    return () => media.removeListener(handleChange);
  }, []);

  useEffect(() => {
    applyResolvedTheme(theme, resolvedTheme);
  }, [theme, resolvedTheme]);

  const setTheme = useCallback((nextTheme) => {
    const normalized = normalizeTheme(nextTheme);
    setThemeState(normalized);
    if (!canUseDOM()) return;
    try {
      window.localStorage?.setItem(STORAGE_KEY, normalized);
    } catch {
      // Storage can be unavailable in private/test contexts.
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }, [resolvedTheme, setTheme]);

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      isDark: resolvedTheme === "dark",
      setTheme,
      toggleTheme,
    }),
    [theme, resolvedTheme, setTheme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}

