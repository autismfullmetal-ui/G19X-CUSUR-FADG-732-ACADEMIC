import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import EvaluacionForm from "@/components/EvaluacionForm";

export default async function EvaluacionesPage({
  searchParams,
}: {
  searchParams: Promise<{
    ok?: string;
    empleado?: string;
    tipo?: "INICIAL" | "POST_CAPACITACION";
    returnTo?: string;
  }>;
}) {
  const session = await requireSession();
  const puedeEvaluar = ["ADMIN", "SUPERVISOR"].includes(session.user.role);
  const { ok, empleado, tipo, returnTo } = await searchParams;

  const [evaluaciones, employees, competencies, objectives] = await Promise.all([
    db.evaluation.findMany({
      include: {
        employee: true,
        evaluator: true,
        scores: { include: { competency: true } },
        objectiveScores: { include: { objective: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.employee.findMany({
      where: { status: "ACTIVO" },
      select: { id: true, firstName: true, lastName: true, departmentId: true },
      orderBy: { lastName: "asc" },
    }),
    db.competency.findMany({
      where: { status: "ACTIVA" },
      select: { id: true, name: true, type: true },
      orderBy: { name: "asc" },
    }),
    db.organizationalObjective.findMany({
      where: { status: "ACTIVO" },
      select: {
        id: true,
        title: true,
        category: true,
        targetValue: true,
        unit: true,
        weight: true,
        departmentId: true,
      },
      orderBy: [{ weight: "desc" }, { createdAt: "desc" }],
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Evaluaciones</h1>
            <span className="rounded-full bg-zinc-900 px-2.5 py-0.5 text-xs font-semibold text-white">
              RF-006 / RF-007
            </span>
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            Diagnóstico de competencias laborales y cumplimiento de objetivos organizacionales.
          </p>
        </div>

        {puedeEvaluar && (
          <EvaluacionForm
            employees={employees}
            competencies={competencies}
            objectives={objectives}
            initialEmployeeId={empleado ? Number(empleado) : undefined}
            initialType={tipo}
            initialOpen={Boolean(empleado || tipo)}
            returnTo={returnTo}
          />
        )}
      </div>

      {ok && (
        <div className="rounded-xl border border-red-800/60 bg-red-950/60 px-4 py-2.5 text-xs font-semibold text-rose-200">
          ✓ Evaluación finalizada exitosamente. Se han actualizado los niveles vigentes y las métricas de desempeño.
        </div>
      )}

      <div className="space-y-4">
        {evaluaciones.map((ev) => (
          <div
            key={ev.id}
            className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs transition hover:border-zinc-300 space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 font-bold text-xs text-zinc-700">
                  {ev.employee.firstName[0]}
                  {ev.employee.lastName[0]}
                </span>
                <div>
                  <h2 className="text-sm font-bold text-zinc-900">
                    {ev.employee.firstName} {ev.employee.lastName}
                  </h2>
                  <p className="text-[11px] text-zinc-400">
                    Evaluado por: <strong className="text-zinc-600 font-medium">{ev.evaluator.name}</strong> ·{" "}
                    {ev.createdAt.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    ev.type === "INICIAL"
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "bg-red-950/70 text-rose-200 border border-red-800/60"
                  }`}
                >
                  {ev.type === "INICIAL" ? "Diagnóstica Inicial" : "Post-Capacitación"}
                </span>
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600">
                  {ev.status}
                </span>
              </div>
            </div>

            {ev.comment && (
              <p className="text-xs text-zinc-600 bg-zinc-50 rounded-xl p-3 leading-relaxed border border-zinc-100">
                {ev.comment}
              </p>
            )}

            {/* Competencias (RF-006) */}
            <div className="pt-2 border-t border-zinc-100">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                Competencias Evaluadas ({ev.scores.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {ev.scores.map((s) => (
                  <span
                    key={s.id}
                    className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs text-zinc-700 shadow-2xs font-medium"
                  >
                    {s.competency.name}:{" "}
                    <strong className="text-zinc-900 font-bold">{s.level}/5</strong>
                  </span>
                ))}
              </div>
            </div>

            {/* Objetivos de Desempeño (RF-007) */}
            {ev.objectiveScores.length > 0 && (
              <div className="pt-2 border-t border-zinc-100">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                  Cumplimiento de Objetivos Organizacionales ({ev.objectiveScores.length})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ev.objectiveScores.map((os) => (
                    <div
                      key={os.id}
                      className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-2.5 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-zinc-800 truncate" title={os.objective.title}>
                          {os.objective.title}
                        </span>
                        <span className="rounded bg-red-950/70 border border-red-800/50 px-1.5 py-0.5 text-[10px] font-bold text-rose-200">
                          {os.complianceRate}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-zinc-500">
                        <span>
                          Alcanzado: {os.currentValue} / {os.objective.targetValue} {os.objective.unit}
                        </span>
                        <span className="text-amber-600 font-semibold">★ {os.rating}/5</span>
                      </div>
                      {os.feedback && (
                        <p className="text-[10px] text-zinc-500 italic mt-0.5">
                          &quot;{os.feedback}&quot;
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {evaluaciones.length === 0 && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center text-xs text-zinc-400">
            No se han registrado evaluaciones de competencias ni desempeño aún.
          </div>
        )}
      </div>
    </div>
  );
}
