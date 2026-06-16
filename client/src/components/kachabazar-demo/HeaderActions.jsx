import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import CartIconButton from "./CartIconButton.jsx";
import UserAccountMenuDropdown from "../user/UserAccountMenuDropdown.jsx";
import NotificationPreviewDropdown from "../store/NotificationPreviewDropdown.jsx";
import ThemeToggle from "../store/ThemeToggle.jsx";
import { fetchUserUnreadNotificationCount } from "../../api/userNotifications.ts";

export default function HeaderActions({
  totalQty,
  isAuthenticated,
  onCartClick,
  className = "",
}) {
  const navigate = useNavigate();
  const rootRef = useRef(null);
  const [openMenu, setOpenMenu] = useState(null);
  const unreadQuery = useQuery({
    queryKey: ["account", "notifications", "unread-count"],
    queryFn: fetchUserUnreadNotificationCount,
    enabled: Boolean(isAuthenticated),
    staleTime: 20_000,
    retry: 1,
  });
  const unreadCount = Number(unreadQuery.data || 0);

  useEffect(() => {
    if (!openMenu) return;
    const handlePointerDown = (event) => {
      if (!(event.target instanceof Node)) return;
      if (!rootRef.current?.contains(event.target)) {
        setOpenMenu(null);
      }
    };
    const handleEsc = (event) => {
      if (event.key === "Escape") {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [openMenu]);

  const handleToggleNotif = () => {
    if (!isAuthenticated) {
      navigate("/user/notifications");
      return;
    }
    setOpenMenu((prev) => (prev === "notif" ? null : "notif"));
  };

  const handleNotificationNavigate = (path) => {
    setOpenMenu(null);
    navigate(path || "/user/notifications");
  };

  const handleToggleAccount = () => {
    if (!isAuthenticated) {
      navigate("/user/my-account");
      return;
    }
    setOpenMenu((prev) => (prev === "account" ? null : "account"));
  };

  return (
    <div
      ref={rootRef}
      className={`flex shrink-0 items-center justify-end gap-1.5 sm:gap-2 ${className}`}
    >
      <div className="hidden scale-[0.94] sm:block sm:scale-100">
        <ThemeToggle
          variant="icon"
          className="border-white/35 bg-white/10 text-white shadow-none hover:bg-white/20 dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
        />
      </div>
      <div className="scale-[0.94] sm:scale-100">
        <CartIconButton totalQty={totalQty} tone="on-green" onClick={onCartClick} />
      </div>
      <div className="store-header-notification-anchor scale-[0.94] sm:scale-100">
        <button
          type="button"
          onClick={handleToggleNotif}
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/35 bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 sm:h-11 sm:w-11"
          aria-label="Notifications"
          title="Notifications"
          aria-expanded={openMenu === "notif"}
        >
          <Bell className="h-[18px] w-[18px]" />
          {isAuthenticated && unreadCount > 0 ? (
            <span className="absolute -right-1 -top-1 inline-flex min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-semibold leading-[18px] text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          ) : null}
        </button>
        <NotificationPreviewDropdown
          open={openMenu === "notif"}
          onNavigate={handleNotificationNavigate}
        />
      </div>
      <span className="hidden h-6 w-px bg-white/35 md:block" aria-hidden />
      <div className="scale-[0.94] sm:scale-100">
        <UserAccountMenuDropdown
          open={openMenu === "account"}
          onToggle={handleToggleAccount}
          onClose={() => setOpenMenu(null)}
        />
      </div>
    </div>
  );
}
