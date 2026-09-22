import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import EvaluacionForm from "@/components/EvaluacionForm";

export default async function EvaluacionesPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string }>;
}) {
  const session = await requireSession();
  const puedeEvaluar = ["ADMIN", "RH", "SUPERVISOR"].includes(session.user.role);
  const { ok } = await searchParams;

  const [evaluaciones, employees, competencies] = await Promise.all([
    db.evaluation.findMany({
      include: {
        employee: true,
        evaluator: true,
        scores: { include: { competency: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.employee.findMany({ where: { status: "ACTIVO" }, orderBy: { lastName: "asc" } }),
    db.competency.findMany({ where: { status: "ACTIVA" }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900">Evaluaciones</h1>
        {puedeEvaluar && <EvaluacionForm employees={employees} competencies={competencies} />}
      </div>

      {ok && (
        <p className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          Evaluación finalizada y niveles vigentes actualizados.
        </p>
      )}

      <div className="mt-6 space-y-4">
        {evaluaciones.map((ev) => (
          <div key={ev.id} className="rounded-xl border border-zinc-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-zinc-900">
                {ev.employee.firstName} {ev.employee.lastName}
              </h2>
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
                {ev.type} · {ev.status}
              </span>
            </div>
            <p className="mt-1 text-xs text-zinc-400">Evaluador: {ev.evaluator.name}</p>
            {ev.comment && <p className="mt-1 text-sm text-zinc-500">{ev.comment}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              {ev.scores.map((s) => (
                <span key={s.id} className="rounded-full border border-zinc-200 px-2 py-0.5 text-xs text-zinc-600">
                  {s.competency.name}: {s.level}/5
                </span>
              ))}
            </div>
          </div>
        ))}
        {evaluaciones.length === 0 && (
          <p className="text-sm text-zinc-400">Sin evaluaciones registradas</p>
        )}
      </div>
    </div>
  );
}
