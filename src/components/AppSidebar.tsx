"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ICONS: Record<string, string> = {
  "/dashboard": "🏠",
  "/empleados": "👥",
  "/competencias": "⭐",
  "/evaluaciones": "📋",
  "/objetivos": "🎯",
  "/oportunidades": "💼",
  "/postulaciones": "📨",
  "/planes": "📝",
  "/importacion": "📥",
  "/auditoria": "🛡️",
  "/perfil": "👤",
};

export type NavItem = {
  href: string;
  label: string;
};

export default function AppSidebar({
  nav,
  userName,
  userEmail,
  userRole,
  notificationsNode,
  signOutAction,
}: {
  nav: NavItem[];
  userName: string;
  userEmail: string;
  userRole: string;
  notificationsNode: React.ReactNode;
  signOutAction: () => Promise<void>;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-950/80 text-red-400 border border-red-800/60";
      case "RH":
        return "bg-rose-950/80 text-rose-300 border border-rose-800/60";
      case "SUPERVISOR":
        return "bg-zinc-800 text-zinc-300 border border-zinc-700";
      default:
        return "bg-zinc-800/80 text-zinc-400 border border-zinc-700/60";
    }
  };

  const isItemActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Barra superior para móvil */}
      <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between border-b border-zinc-800/80 bg-[#0c0c11]/95 px-4 py-3 backdrop-blur-md">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-red-600 to-rose-800 text-xs font-black text-white shadow-[0_0_8px_rgba(140,37,52,0.3)]">
            P
          </span>
          <span className="font-bold text-sm tracking-tight text-white">Plataforma PDP</span>
        </Link>
        <div className="flex items-center gap-2">
          {notificationsNode}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white hover:border-red-900/50"
            aria-label="Abrir menú"
          >
            {mobileOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Overlay para móvil */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Sidebar Principal (Izquierda) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 xl:w-72 bg-[#0c0c11] border-r border-zinc-800/80 flex flex-col justify-between transition-transform duration-200 lg:static lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Cabecera Sidebar (Logo & Brand) */}
        <div>
          <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between">
            <Link
              href="/dashboard"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 group"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-600 via-red-700 to-rose-900 text-sm font-black text-white shadow-[0_0_10px_rgba(140,37,52,0.3)] group-hover:shadow-[0_0_14px_rgba(140,37,52,0.45)] transition-all">
                P
              </span>
              <div>
                <span className="font-extrabold text-sm tracking-tight text-white block group-hover:text-red-400 transition-colors">
                  Plataforma PDP
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 block">
                  Talento & Desempeño
                </span>
              </div>
            </Link>

            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden text-zinc-400 hover:text-white text-sm p-1 rounded-lg hover:bg-zinc-800"
            >
              ✕
            </button>
          </div>

          {/* Menú de Navegación Vertical a la Izquierda */}
          <div className="px-3 py-4">
            <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-2">
              Navegación Principal
            </span>
            <nav className="space-y-1">
              {nav.map((item) => {
                const active = isItemActive(item.href);
                const icon = NAV_ICONS[item.href] ?? "📌";

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                      active
                        ? "bg-gradient-to-r from-red-950/60 via-red-900/25 to-transparent text-white border-l-3 border-red-500 shadow-[inset_0_0_10px_rgba(140,37,52,0.12)] font-semibold"
                        : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/70 hover:border-l-3 hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-base transition-transform group-hover:scale-110 ${
                          active ? "text-red-400" : "text-zinc-400"
                        }`}
                      >
                        {icon}
                      </span>
                      <span>{item.label}</span>
                    </div>

                    {active && (
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500 shadow-[0_0_5px_rgba(173,66,81,0.5)]" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Pie del Sidebar: Usuario, Perfil y Salir */}
        <div className="p-3 border-t border-zinc-800/80 bg-[#09090d]/80 space-y-2">
          {/* Card de Usuario con enlace a Perfil */}
          <Link
            href="/perfil"
            onClick={() => setMobileOpen(false)}
            className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
              pathname === "/perfil"
                ? "bg-red-950/40 border-red-800/60 text-white"
                : "bg-zinc-900/50 border-zinc-800/70 hover:bg-zinc-900 hover:border-zinc-700 text-zinc-300"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-800 border border-zinc-700/80 font-bold text-xs text-white">
                {userName ? userName.slice(0, 2).toUpperCase() : "U"}
              </span>
              <div className="min-w-0">
                <span className="text-xs font-bold text-white block truncate leading-tight">
                  {userName}
                </span>
                <span className="text-[10px] text-zinc-500 block truncate leading-tight">
                  {userEmail}
                </span>
              </div>
            </div>

            <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold ${getRoleBadge(userRole)}`}>
              {userRole}
            </span>
          </Link>

          {/* Botones de Acción (Notificaciones + Mi Perfil + Salir) */}
          <div className="flex items-center gap-2 pt-1">
            <Link
              href="/perfil"
              onClick={() => setMobileOpen(false)}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 px-3 py-1.5 text-[11px] font-medium text-zinc-300 hover:text-white transition"
              title="Ajustes de Perfil y Contraseña"
            >
              <span>⚙️</span>
              <span>Mi Perfil</span>
            </Link>

            <form action={signOutAction} className="shrink-0">
              <button
                type="submit"
                className="flex items-center justify-center rounded-xl border border-red-900/40 bg-red-950/30 hover:bg-red-900/60 px-3 py-1.5 text-[11px] font-semibold text-red-400 hover:text-white transition cursor-pointer"
                title="Cerrar Sesión"
              >
                <span>Salir ✕</span>
              </button>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}
