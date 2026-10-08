import Link from "next/link";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { signOut } from "@/lib/auth";
import HeaderNotifications from "@/components/HeaderNotifications";
import AppSidebar from "@/components/AppSidebar";

const NAV: Record<string, { href: string; label: string }[]> = {
  ADMIN: [
    { href: "/dashboard", label: "Inicio" },
    { href: "/empleados", label: "Empleados" },
    { href: "/competencias", label: "Competencias" },
    { href: "/evaluaciones", label: "Evaluaciones" },
    { href: "/objetivos", label: "Objetivos" },
    { href: "/oportunidades", label: "Oportunidades" },
    { href: "/postulaciones", label: "Postulaciones" },
    { href: "/planes", label: "Planes" },
    { href: "/importacion", label: "Importación" },
    { href: "/auditoria", label: "Auditoría" },
  ],
  RH: [
    { href: "/dashboard", label: "Inicio" },
    { href: "/empleados", label: "Empleados" },
    { href: "/competencias", label: "Competencias" },
    { href: "/evaluaciones", label: "Evaluaciones" },
    { href: "/objetivos", label: "Objetivos" },
    { href: "/oportunidades", label: "Oportunidades" },
    { href: "/postulaciones", label: "Postulaciones" },
    { href: "/planes", label: "Planes" },
    { href: "/importacion", label: "Importación" },
    { href: "/auditoria", label: "Auditoría" },
  ],
  SUPERVISOR: [
    { href: "/dashboard", label: "Inicio" },
    { href: "/evaluaciones", label: "Evaluaciones" },
    { href: "/objetivos", label: "Objetivos" },
    { href: "/oportunidades", label: "Oportunidades" },
    { href: "/planes", label: "Planes" },
  ],
  EMPLEADO: [
    { href: "/dashboard", label: "Inicio" },
    { href: "/objetivos", label: "Objetivos" },
    { href: "/oportunidades", label: "Oportunidades" },
    { href: "/postulaciones", label: "Mis postulaciones" },
    { href: "/planes", label: "Mi plan" },
  ],
};

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  const nav = NAV[session.user.role] ?? NAV.EMPLEADO;

  const notifications = await db.notification.findMany({
    where: { userId: Number(session.user.id) },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <div className="app-dark-layout min-h-screen bg-[#09090b] text-zinc-100 flex flex-col lg:flex-row antialiased selection:bg-red-900/60 selection:text-white">
      {/* Barra de Navegación Lateral a la Izquierda con Acentos Rojos y Grises */}
      <AppSidebar
        nav={nav}
        userName={session.user.name ?? "Usuario"}
        userEmail={session.user.email ?? ""}
        userRole={session.user.role}
        notificationsNode={<HeaderNotifications initialNotifications={notifications} />}
        signOutAction={handleSignOut}
      />

      {/* Área Principal de Contenido a la Derecha */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen bg-[#09090b]">
        {/* Barra Superior en Escritorio */}
        <header className="hidden lg:flex items-center justify-between border-b border-zinc-800/80 bg-[#0c0c11]/80 px-8 py-3 sticky top-0 z-30 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="flex h-2 w-2 rounded-full bg-red-500 shadow-[0_0_6px_rgba(173,66,81,0.5)]" />
            <span className="text-xs font-semibold text-zinc-400 tracking-wide">
              Plataforma PDP · <strong className="text-zinc-200 font-medium">Gestión y Planes de Desarrollo</strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <HeaderNotifications initialNotifications={notifications} />
            <Link
              href="/perfil"
              title="Mi Perfil y Seguridad"
              className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/90 hover:bg-zinc-800 hover:border-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:text-white transition shadow-2xs"
            >
              <span>{session.user.name}</span>
            </Link>
          </div>
        </header>

        {/* Contenedor de la Vista Activa */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
