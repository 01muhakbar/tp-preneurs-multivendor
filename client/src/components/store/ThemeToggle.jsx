import { useEffect, useRef, useState } from "react";
import { Check, Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "../../theme/ThemeProvider.jsx";

const OPTIONS = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "System", Icon: Monitor },
];

const iconButtonClass =
  "inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-[var(--tp-primary)] hover:text-[var(--tp-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--tp-primary-rgb)/0.35)] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800";

function CurrentIcon({ resolvedTheme }) {
  const Icon = resolvedTheme === "dark" ? Moon : Sun;
  return <Icon className="h-4 w-4" />;
}

function SegmentedToggle({ className = "" }) {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className={`grid grid-cols-3 gap-1 rounded-2xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-900 ${className}`}
      role="group"
      aria-label="Choose appearance"
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            aria-pressed={active}
            className={`inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl px-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--tp-primary-rgb)/0.35)] ${
              active
                ? "bg-white text-[var(--tp-primary)] shadow-sm ring-1 ring-[rgb(var(--tp-primary-rgb)/0.22)] dark:bg-[var(--tp-primary-soft)] dark:text-sky-200 dark:ring-[rgb(var(--tp-primary-rgb)/0.55)]"
                : "text-slate-600 hover:bg-white/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

function MenuToggle({ className = "" }) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handlePointerDown = (event) => {
      if (!(event.target instanceof Node)) return;
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={iconButtonClass}
        aria-label={`Appearance: ${theme}, resolved ${resolvedTheme}`}
        aria-expanded={open}
      >
        <CurrentIcon resolvedTheme={resolvedTheme} />
      </button>
      {open ? (
        <div className="absolute right-0 top-12 z-50 w-48 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-800 dark:bg-slate-900">
          {OPTIONS.map(({ value, label, Icon }) => {
            const active = theme === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setTheme(value);
                  setOpen(false);
                }}
                aria-pressed={active}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold transition ${
                  active
                    ? "bg-[var(--tp-primary-soft)] text-[var(--tp-primary)] dark:text-sky-200"
                    : "text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {label}
                </span>
                {active ? <Check className="h-4 w-4" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export default function ThemeToggle({ variant = "icon", className = "" }) {
  const { theme, resolvedTheme, toggleTheme } = useTheme();

  if (variant === "segmented") {
    return <SegmentedToggle className={className} />;
  }

  if (variant === "menu") {
    return <MenuToggle className={className} />;
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-pressed={resolvedTheme === "dark"}
      aria-label={`Switch appearance. Current preference is ${theme}, resolved ${resolvedTheme}.`}
      title={`Appearance: ${theme}`}
      className={`${iconButtonClass} ${className}`}
    >
      <CurrentIcon resolvedTheme={resolvedTheme} />
    </button>
  );
}
