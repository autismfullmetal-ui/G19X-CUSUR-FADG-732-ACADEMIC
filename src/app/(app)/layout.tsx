import Link from "next/link";
import { requireSession } from "@/lib/session";
import { signOut } from "@/lib/auth";

const NAV: Record<string, { href: string; label: string }[]> = {
  ADMIN: [
    { href: "/dashboard", label: "Inicio" },
    { href: "/empleados", label: "Empleados" },
    { href: "/competencias", label: "Competencias" },
    { href: "/evaluaciones", label: "Evaluaciones" },
    { href: "/oportunidades", label: "Oportunidades" },
    { href: "/postulaciones", label: "Postulaciones" },
    { href: "/planes", label: "Planes" },
  ],
  RH: [
    { href: "/dashboard", label: "Inicio" },
    { href: "/empleados", label: "Empleados" },
    { href: "/competencias", label: "Competencias" },
    { href: "/evaluaciones", label: "Evaluaciones" },
    { href: "/oportunidades", label: "Oportunidades" },
    { href: "/postulaciones", label: "Postulaciones" },
    { href: "/planes", label: "Planes" },
  ],
  SUPERVISOR: [
    { href: "/dashboard", label: "Inicio" },
    { href: "/evaluaciones", label: "Evaluaciones" },
    { href: "/oportunidades", label: "Oportunidades" },
    { href: "/planes", label: "Planes" },
  ],
  EMPLEADO: [
    { href: "/dashboard", label: "Inicio" },
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

  return (
    <div className="min-h-screen bg-zinc-100">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <span className="font-bold text-zinc-900">Plataforma PDP</span>
          <nav className="flex flex-wrap items-center gap-3 text-sm text-zinc-600">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="hover:text-zinc-900"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-zinc-500">{session.user.name}</span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button className="rounded-lg border border-zinc-300 px-3 py-1 hover:bg-zinc-50">
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
