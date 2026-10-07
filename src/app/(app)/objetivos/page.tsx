import Link from "next/link";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import ObjetivoForm from "@/components/ObjetivoForm";
import { updateObjectiveStatus } from "@/app/actions";

const CATEGORY_STYLES: Record<string, { label: string; badge: string; icon: string }> = {
  ESTRATEGICO: { label: "Estratégico", badge: "bg-blue-50 text-blue-700 border-blue-200", icon: "🎯" },
  INNOVACION: { label: "Innovación", badge: "bg-purple-50 text-purple-700 border-purple-200", icon: "💡" },
  CALIDAD: { label: "Calidad", badge: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: "✨" },
  OPERATIVO: { label: "Operativo", badge: "bg-amber-50 text-amber-700 border-amber-200", icon: "⚙️" },
};

export default async function ObjetivosPage({
  searchParams,
}: {
  searchParams: Promise<{ dept?: string; status?: string; ok?: string }>;
}) {
  const session = await requireSession();
  const puedeGestionar = ["ADMIN", "RH"].includes(session.user.role);
  const { dept, status, ok } = await searchParams;

  const whereClause: any = {};
  if (dept && dept !== "todos") {
    whereClause.departmentId = Number(dept);
  }
  if (status && status !== "todos") {
    whereClause.status = status;
  }

  const [objectives, departments, totalEvaluatedCount] = await Promise.all([
    db.organizationalObjective.findMany({
      where: whereClause,
      include: {
        department: true,
        createdBy: { select: { name: true } },
        evaluations: {
          include: {
            evaluation: {
              include: { employee: true },
            },
          },
        },
      },
      orderBy: [{ status: "asc" }, { weight: "desc" }, { createdAt: "desc" }],
    }),
    db.department.findMany({ orderBy: { name: "asc" } }),
    db.objectiveEvaluation.count(),
  ]);

  // Cálculo de estadísticas globales
  const activeObjectives = objectives.filter((o) => o.status === "ACTIVO");
  let totalComplianceSum = 0;
  let totalEvaluationsRecorded = 0;

  objectives.forEach((obj) => {
    obj.evaluations.forEach((ev) => {
      totalComplianceSum += ev.complianceRate;
      totalEvaluationsRecorded++;
    });
  });

  const avgComplianceRate =
    totalEvaluationsRecorded > 0 ? Math.round(totalComplianceSum / totalEvaluationsRecorded) : 0;

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
              Objetivos Organizacionales y Desempeño
            </h1>
            <span className="rounded-full bg-zinc-900 px-2.5 py-0.5 text-xs font-semibold text-white">
              RF-007 / OE-04
            </span>
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            Metas estratégicas y departamentales vinculadas al desarrollo del talento y la evaluación de resultados.
          </p>
        </div>

        {puedeGestionar && <ObjetivoForm departments={departments} />}
      </div>

      {ok && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-800">
          ✓ Operación realizada con éxito. Los objetivos y ponderaciones han sido actualizados.
        </div>
      )}

      {/* Tarjetas KPI */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-medium text-zinc-500">Objetivos Activos</span>
          <p className="mt-2 text-3xl font-bold text-zinc-900">{activeObjectives.length}</p>
          <p className="mt-1 text-[11px] text-zinc-400">De un total de {objectives.length} metas registradas.</p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-medium text-zinc-500">Cumplimiento Global Promedio</span>
          <p className="mt-2 text-3xl font-bold text-emerald-600">
            {avgComplianceRate > 0 ? `${avgComplianceRate}%` : "En medición"}
          </p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${Math.min(100, avgComplianceRate)}%` }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-medium text-zinc-500">Evaluaciones de Desempeño</span>
          <p className="mt-2 text-3xl font-bold text-blue-600">{totalEvaluatedCount}</p>
          <p className="mt-1 text-[11px] text-zinc-400">Calificaciones registradas por supervisores.</p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-medium text-zinc-500">Departamentos con Metas</span>
          <p className="mt-2 text-3xl font-bold text-purple-600">
            {new Set(objectives.map((o) => o.departmentId).filter(Boolean)).size || "Global"}
          </p>
          <p className="mt-1 text-[11px] text-zinc-400">Alineación estratégica transversal.</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs">
        <form method="GET" className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 mb-1">
              Departamento
            </label>
            <select
              name="dept"
              defaultValue={dept ?? "todos"}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs text-zinc-800 bg-white"
            >
              <option value="todos">🌐 Todos los departamentos</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  🏢 {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 mb-1">
              Estado
            </label>
            <select
              name="status"
              defaultValue={status ?? "todos"}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs text-zinc-800 bg-white"
            >
              <option value="todos">Todos los estados</option>
              <option value="ACTIVO">Activos</option>
              <option value="COMPLETADO">Completados</option>
              <option value="PAUSADO">Pausados</option>
            </select>
          </div>

          <div className="flex items-end gap-2 pt-4">
            <button
              type="submit"
              className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 transition"
            >
              Filtrar
            </button>
            {(dept || status) && (
              <Link
                href="/objetivos"
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
              >
                Limpiar
              </Link>
            )}
          </div>
        </form>
      </div>

      {/* Lista de Objetivos */}
      <div className="space-y-4">
        {objectives.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center text-xs text-zinc-400">
            No se encontraron objetivos organizacionales con los filtros seleccionados.
          </div>
        ) : (
          objectives.map((obj) => {
            const cat = CATEGORY_STYLES[obj.category] ?? {
              label: obj.category,
              badge: "bg-zinc-100 text-zinc-700 border-zinc-200",
              icon: "📌",
            };

            // Cálculo de avance promedio de este objetivo
            const evals = obj.evaluations;
            const avgObjCompliance =
              evals.length > 0
                ? Math.round(evals.reduce((acc, curr) => acc + curr.complianceRate, 0) / evals.length)
                : 0;

            return (
              <div
                key={obj.id}
                className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs transition hover:border-zinc-300 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${cat.badge}`}
                      >
                        <span>{cat.icon}</span>
                        <span>{cat.label}</span>
                      </span>

                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600">
                        {obj.department ? `🏢 ${obj.department.name}` : "🌐 Toda la Empresa"}
                      </span>

                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600">
                        📅 {obj.targetPeriod}
                      </span>

                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          obj.status === "ACTIVO"
                            ? "bg-emerald-100 text-emerald-800"
                            : obj.status === "COMPLETADO"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-zinc-200 text-zinc-700"
                        }`}
                      >
                        {obj.status}
                      </span>
                    </div>

                    <h2 className="text-base font-bold text-zinc-900">{obj.title}</h2>
                    {obj.description && (
                      <p className="text-xs text-zinc-600 max-w-3xl leading-relaxed">
                        {obj.description}
                      </p>
                    )}
                  </div>

                  {/* Acciones para Admin / RH */}
                  {puedeGestionar && (
                    <div className="shrink-0 flex items-center gap-2">
                      <form action={updateObjectiveStatus}>
                        <input type="hidden" name="id" value={obj.id} />
                        {obj.status === "ACTIVO" ? (
                          <button
                            type="submit"
                            name="status"
                            value="COMPLETADO"
                            className="rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition cursor-pointer"
                            title="Marcar como cumplido o cerrado"
                          >
                            ✓ Completar
                          </button>
                        ) : (
                          <button
                            type="submit"
                            name="status"
                            value="ACTIVO"
                            className="rounded-lg border border-zinc-300 bg-zinc-50 px-2.5 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 transition cursor-pointer"
                          >
                            Reactivar
                          </button>
                        )}
                      </form>
                    </div>
                  )}
                </div>

                {/* Métricas y Barra de Progreso */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-zinc-100">
                  <div className="rounded-xl bg-zinc-50 p-3">
                    <span className="text-[11px] font-medium text-zinc-500">Meta Cuantitativa</span>
                    <p className="mt-1 text-lg font-bold text-zinc-900">
                      {obj.targetValue} {obj.unit}
                    </p>
                    <span className="text-[10px] text-zinc-400">Ponderación: {obj.weight} / 5</span>
                  </div>

                  <div className="rounded-xl bg-zinc-50 p-3 sm:col-span-2 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-zinc-700">
                        Cumplimiento Registrado ({evals.length} evaluaciones)
                      </span>
                      <span className="font-bold text-emerald-700">
                        {evals.length > 0 ? `${avgObjCompliance}%` : "Sin evaluaciones aún"}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${Math.min(100, avgObjCompliance)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-zinc-400">
                      Calculado con base en las evaluaciones de desempeño formal realizadas por supervisores.
                    </p>
                  </div>
                </div>

                {/* Colaboradores Evaluados */}
                {evals.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                      Resultados individuales recientes:
                    </span>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {evals.slice(0, 5).map((ev) => (
                        <div
                          key={ev.id}
                          className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs shadow-2xs"
                        >
                          <span className="font-medium text-zinc-800">
                            {ev.evaluation.employee.firstName} {ev.evaluation.employee.lastName}:
                          </span>
                          <span className="font-semibold text-emerald-700">
                            {ev.currentValue} {obj.unit} ({ev.complianceRate}%)
                          </span>
                          <span className="rounded bg-amber-50 px-1 py-0.2 text-[10px] text-amber-700">
                            ★ {ev.rating}/5
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
