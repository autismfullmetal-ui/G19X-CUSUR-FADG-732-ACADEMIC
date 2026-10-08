import Link from "next/link";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import PlanesList from "@/components/PlanesList";

export default async function PlanesPage() {
  const session = await requireSession();
  const soyEmpleado = session.user.role === "EMPLEADO";
  const puedeGestionar = ["ADMIN", "RH", "SUPERVISOR"].includes(session.user.role);
  const puedeEvaluar = ["ADMIN", "SUPERVISOR"].includes(session.user.role);
  const yo = await db.employee.findUnique({
    where: { userId: Number(session.user.id) },
  });

  const planes = await db.developmentPlan.findMany({
    where: soyEmpleado && yo ? { employeeId: yo.id } : {},
    include: {
      employee: { include: { department: true } },
      application: { include: { opportunity: true } },
      activities: { orderBy: { order: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
            <span>{soyEmpleado ? "Mi plan de desarrollo" : "Planes de desarrollo"}</span>
          </h1>
          <p className="mt-1 text-xs text-zinc-400">
            {soyEmpleado
              ? "Ejecuta tus actividades, entrega evidencias o proyectos y recibe retroalimentación de tu supervisor."
              : session.user.role === "RH"
                ? "Monitorea el progreso de los planes, entregables y retroalimentación emitida por los supervisores."
                : "Revisa entregables, asigna retroalimentación y evalúa el progreso de las actividades de tus colaboradores."}
          </p>
        </div>
        {puedeEvaluar && (
          <Link
            href="/evaluaciones"
            className="rounded-xl border border-zinc-700/80 bg-zinc-900/80 px-3.5 py-2 text-xs font-semibold text-zinc-200 hover:text-white hover:bg-zinc-800 transition shadow-2xs"
          >
            Registrar Evaluación
          </Link>
        )}
      </div>

      <div className="mt-6">
        <PlanesList
          planes={planes}
          soyEmpleado={soyEmpleado}
          puedeGestionar={puedeGestionar}
          userRole={session.user.role}
        />
      </div>
    </div>
  );
}
