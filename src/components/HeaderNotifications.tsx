"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { markNotificationAsRead, markAllNotificationsAsRead, clearAllNotifications } from "@/app/actions";

export type NotificationItem = {
  id: number;
  title: string;
  message: string;
  type: string;
  linkUrl: string | null;
  read: boolean;
  createdAt: string | Date;
};

export default function HeaderNotifications({
  initialNotifications,
}: {
  initialNotifications: NotificationItem[];
}) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setNotifications(initialNotifications);
  }, [initialNotifications]);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = async (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    await markNotificationAsRead(id);
  };

  const handleMarkAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await markAllNotificationsAsRead();
  };

  const handleClearAll = async () => {
    setNotifications([]);
    setOpen(false);
    await clearAllNotifications();
  };

  const formatTimeAgo = (dateInput: string | Date) => {
    const date = new Date(dateInput);
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return "Ahora mismo";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `Hace ${minutes} m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Hace ${hours} h`;
    const days = Math.floor(hours / 24);
    return `Hace ${days} d`;
  };

  const getTypeStyle = (type: string) => {
    switch (type) {
      case "SUCCESS":
        return { bg: "bg-emerald-500" };
      case "WARNING":
        return { bg: "bg-amber-500" };
      case "ACTION_REQUIRED":
        return { bg: "bg-purple-500" };
      default:
        return { bg: "bg-blue-500" };
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition focus:outline-none"
        title="Notificaciones"
        aria-label="Notificaciones"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white shadow-xs animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-zinc-200 bg-white shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/80 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-zinc-900">Notificaciones</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-700">
                  {unreadCount} nuevas
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="text-xs font-medium text-zinc-500 hover:text-zinc-900 transition"
              >
                Marcar todas leídas
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-zinc-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <p className="mt-2 text-xs font-medium text-zinc-600">No tienes notificaciones</p>
                <p className="text-[11px] text-zinc-400">Te avisaremos sobre avances de tus planes y postulaciones.</p>
              </div>
            ) : (
              notifications.map((item) => {
                const style = getTypeStyle(item.type);
                const content = (
                  <div
                    key={item.id}
                    onClick={() => !item.read && handleMarkAsRead(item.id)}
                    className={`flex items-start gap-3 p-3.5 transition cursor-pointer hover:bg-zinc-50 ${
                      !item.read ? "bg-zinc-50/60 font-medium" : "opacity-80"
                    }`}
                  >
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${style.bg}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs font-semibold text-zinc-900 truncate">
                          {item.title}
                        </p>
                        <span className="text-[10px] text-zinc-400 shrink-0">
                          {formatTimeAgo(item.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-600 mt-0.5 line-clamp-2">
                        {item.message}
                      </p>
                    </div>
                    {!item.read && (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-blue-600 mt-1" />
                    )}
                  </div>
                );

                if (item.linkUrl) {
                  return (
                    <Link
                      key={item.id}
                      href={item.linkUrl}
                      onClick={() => {
                        handleMarkAsRead(item.id);
                        setOpen(false);
                      }}
                      className="block"
                    >
                      {content}
                    </Link>
                  );
                }

                return content;
              })
            )}
          </div>

          {notifications.length > 0 && (
            <div className="border-t border-zinc-100 bg-zinc-50/50 px-4 py-2 text-right">
              <button
                type="button"
                onClick={handleClearAll}
                className="text-[11px] text-zinc-400 hover:text-red-600 transition"
              >
                Limpiar historial
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
