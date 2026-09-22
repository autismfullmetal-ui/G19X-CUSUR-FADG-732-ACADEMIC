import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrador",
  RH: "Recursos Humanos",
  SUPERVISOR: "Supervisor",
  EMPLEADO: "Empleado",
};

export default async function DashboardPage() {
  const session = await requireSession();
  const [empleados, competencias, oportunidades, planes] = await Promise.all([
    db.employee.count(),
    db.competency.count(),
    db.opportunity.count({ where: { status: "PUBLICADA" } }),
    db.developmentPlan.count(),
  ]);

  const cards = [
    { label: "Empleados activos", value: empleados },
    { label: "Competencias en catálogo", value: competencias },
    { label: "Oportunidades publicadas", value: oportunidades },
    { label: "Planes de desarrollo", value: planes },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">
        Hola, {session.user.name}
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        Rol: {ROLE_LABEL[session.user.role] ?? session.user.role}
      </p>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-xl border border-zinc-200 bg-white p-5"
          >
            <p className="text-3xl font-bold text-zinc-900">{c.value}</p>
            <p className="mt-1 text-sm text-zinc-500">{c.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
