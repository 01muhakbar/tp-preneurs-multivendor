import { Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function ThemeToggle({ theme = "light", onToggle }) {
  const { t, i18n } = useTranslation("admin");
  const isId = Boolean(i18n.language?.toLowerCase().startsWith("id"));
  const isDark = theme === "dark";
  const Icon = isDark ? Sun : Moon;
  const label = isDark
    ? isId
      ? "Beralih ke mode terang"
      : t("navbar.Switch to light mode", "Switch to light mode")
    : isId
      ? "Beralih ke mode gelap"
      : t("navbar.Switch to dark mode", "Switch to dark mode");

  return (
    <button
      type="button"
      className={`navbar__icon navbar__icon--theme ${isDark ? "is-dark" : ""}`}
      onClick={onToggle}
      aria-label={label}
      title={label}
    >
      <Icon size={18} />
    </button>
  );
}
