import { Fragment } from "react";
import { Link } from "react-router-dom";
import { useAccountAuth } from "../../auth/authDomainHooks.js";

const toText = (value, fallback = "") => {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
};

const isSafeWhatsAppLink = (value) => {
  const normalized = toText(value);
  if (!normalized) return false;
  const lowered = normalized.toLowerCase();
  return (
    lowered.startsWith("https://wa.me/") ||
    lowered.startsWith("https://api.whatsapp.com/")
  );
};

export default function TopInfoBar({
  headerText = "",
  phoneNumber = "",
  whatsAppLink = "",
  menuLabels = {},
  menuEnabled = {},
  isHeaderLoading = false,
}) {
  const { isAccountSession, logout } = useAccountAuth();
  const safeHeaderText = toText(headerText);
  const safePhoneNumber = toText(phoneNumber);
  const safeWhatsAppLink = toText(whatsAppLink);
  const hasWhatsAppLink = isSafeWhatsAppLink(safeWhatsAppLink);
  const utilityItems = [];

  if (menuEnabled.showAboutUs !== false) {
    utilityItems.push({
      key: "about-us",
      type: "link",
      to: "/about-us",
      label: toText(menuLabels.aboutUs, "About Us"),
    });
  }

  if (menuEnabled.showContactUs !== false) {
    utilityItems.push({
      key: "contact-us",
      type: "link",
      to: "/contact-us",
      label: toText(menuLabels.contactUs, "Contact Us"),
    });
  }

  utilityItems.push({
    key: "my-account",
    type: "link",
    to: "/user/my-account",
    label: toText(menuLabels.myAccount, "My Account"),
  });

  if (isAccountSession) {
    utilityItems.push({
      key: "logout",
      type: "button",
      label: toText(menuLabels.logout, "Logout"),
    });
  } else {
    utilityItems.push({
      key: "login",
      type: "link",
      to: "/auth/login",
      label: toText(menuLabels.login, "Login"),
    });
  }

  return (
    <div className="border-b border-slate-200 bg-slate-100 text-[12px] text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-1.5 md:px-6">
        <div className="flex items-center gap-1.5 leading-none">
          {isHeaderLoading ? (
            <span className="inline-block h-3 w-40 rounded bg-slate-300/70 dark:bg-slate-800" />
          ) : null}
          {!isHeaderLoading && safeHeaderText ? <span>{safeHeaderText}</span> : null}
          {!isHeaderLoading && safePhoneNumber ? (
            hasWhatsAppLink ? (
              <a
                href={safeWhatsAppLink}
                target="_blank"
                rel="noreferrer"
                aria-label="Contact us on WhatsApp"
                className="cursor-pointer font-semibold text-emerald-600 hover:underline focus:outline-none focus:underline dark:text-emerald-300"
              >
                {safePhoneNumber}
              </a>
            ) : (
              <span className="font-semibold text-emerald-600 dark:text-emerald-300">{safePhoneNumber}</span>
            )
          ) : null}
        </div>
        <div className="flex flex-wrap items-center text-[12px] text-slate-500 dark:text-slate-400">
          {utilityItems.map((item, index) => (
            <Fragment key={item.key}>
              {index > 0 ? <span className="mx-2 text-slate-300 dark:text-slate-700">|</span> : null}
              {item.type === "button" ? (
                <button
                  type="button"
                  onClick={() => void logout?.()}
                  className="transition hover:text-slate-700 hover:underline dark:hover:text-slate-100"
                >
                  {item.label}
                </button>
              ) : (
                <Link
                  to={item.to}
                  className="transition hover:text-slate-700 hover:underline dark:hover:text-slate-100"
                >
                  {item.label}
                </Link>
              )}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
