import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { publishOpportunity, closeOpportunity, applyToOpportunity } from "@/app/actions";
import OportunidadForm from "@/components/OportunidadForm";

const BANNER: Record<string, string> = {
  datos: "El título es obligatorio.",
  sinrequisitos: "RN-002: define al menos una competencia requerida antes de publicar.",
  duplicada: "RN-001: ya te habías postulado a esta oportunidad.",
  sempleado: "Tu usuario no tiene un perfil de empleado asociado.",
};

export default async function OportunidadesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const session = await requireSession();
  const esEmpleado = session.user.role === "EMPLEADO";
  const puedeGestionar = ["ADMIN", "RH"].includes(session.user.role);
  const { error, ok } = await searchParams;

  const [oportunidades, competencies, yo] = await Promise.all([
    db.opportunity.findMany({
      include: { requirements: { include: { competency: true } } },
      orderBy: { createdAt: "desc" },
    }),
    db.competency.findMany({ where: { status: "ACTIVA" }, orderBy: { name: "asc" } }),
    esEmpleado
      ? db.employee.findUnique({ where: { userId: Number(session.user.id) } })
      : null,
  ]);

  const misAplicaciones = yo
    ? await db.application.findMany({
        where: { employeeId: yo.id },
        select: { opportunityId: true },
      })
    : [];
  const yaAplicadas = new Set(misAplicaciones.map((a) => a.opportunityId));

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900">Oportunidades</h1>
        {puedeGestionar && <OportunidadForm competencies={competencies} />}
      </div>

      {error && BANNER[error] && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{BANNER[error]}</p>
      )}
      {ok && (
        <p className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          Oportunidad guardada como borrador. Agrega requisitos y publícala.
        </p>
      )}

      <div className="mt-6 space-y-4">
        {oportunidades.map((o) => (
          <div key={o.id} className="rounded-xl border border-zinc-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-semibold text-zinc-900">{o.title}</h2>
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  o.status === "PUBLICADA"
                    ? "bg-green-100 text-green-700"
                    : o.status === "CERRADA"
                      ? "bg-zinc-100 text-zinc-500"
                      : "bg-amber-100 text-amber-700"
                }`}
              >
                {o.type} · {o.status}
              </span>
            </div>
            <p className="mt-2 text-sm text-zinc-500">{o.description}</p>

            {o.requirements.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {o.requirements.map((r) => (
                  <span
                    key={r.id}
                    className="rounded-full border border-zinc-200 px-2 py-0.5 text-xs text-zinc-600"
                  >
                    {r.competency.name}: nivel {r.requiredLevel} (peso {r.weight})
                    {r.mandatory ? " · obligatoria" : ""}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-3">
              {esEmpleado && o.status === "PUBLICADA" && !yaAplicadas.has(o.id) && (
                <form action={applyToOpportunity}>
                  <input type="hidden" name="opportunityId" value={o.id} />
                  <button className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700">
                    Postularme
                  </button>
                </form>
              )}
              {esEmpleado && yaAplicadas.has(o.id) && (
                <span className="text-xs text-zinc-400">Ya postulaste a esta oportunidad.</span>
              )}
              {puedeGestionar && o.status === "BORRADOR" && (
                <form action={publishOpportunity}>
                  <input type="hidden" name="opportunityId" value={o.id} />
                  <button className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50">
                    Publicar
                  </button>
                </form>
              )}
              {puedeGestionar && o.status === "PUBLICADA" && (
                <form action={closeOpportunity}>
                  <input type="hidden" name="opportunityId" value={o.id} />
                  <button className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50">
                    Cerrar
                  </button>
                </form>
              )}
            </div>
          </div>
        ))}
        {oportunidades.length === 0 && (
          <p className="text-sm text-zinc-400">Sin oportunidades registradas</p>
        )}
      </div>
    </div>
  );
}
