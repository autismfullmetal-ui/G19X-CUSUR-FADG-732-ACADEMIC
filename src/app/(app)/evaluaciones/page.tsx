import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";

export default async function EvaluacionesPage() {
  await requireSession();
  const evaluaciones = await db.evaluation.findMany({
    include: {
      employee: true,
      evaluator: true,
      scores: { include: { competency: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">Evaluaciones</h1>
      <div className="mt-6 space-y-4">
        {evaluaciones.map((ev) => (
          <div
            key={ev.id}
            className="rounded-xl border border-zinc-200 bg-white p-5"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-zinc-900">
                {ev.employee.firstName} {ev.employee.lastName}
              </h2>
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
                {ev.type} · {ev.status}
              </span>
            </div>
            <p className="mt-1 text-xs text-zinc-400">
              Evaluador: {ev.evaluator.name}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {ev.scores.map((s) => (
                <span
                  key={s.id}
                  className="rounded-full border border-zinc-200 px-2 py-0.5 text-xs text-zinc-600"
                >
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
