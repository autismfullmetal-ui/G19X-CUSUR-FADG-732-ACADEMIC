import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { publishOpportunity, closeOpportunity, applyToOpportunity } from "@/app/actions";
import OportunidadForm from "@/components/OportunidadForm";

const BANNER: Record<string, string> = {
  datos: "El título es obligatorio.",
  sinrequisitos: "RN-002: define al menos una competencia requerida antes de publicar.",
  duplicada: "RN-001: ya te habías postulado a esta oportunidad.",
  sempleado: "Tu usuario no tiene un perfil de empleado asociado.",
  cerrada: "Esta oportunidad se encuentra cerrada para postulaciones.",
  no_abierta: "La oportunidad aún no ha abierto su periodo de postulación.",
  vencida: "El plazo límite para postularse a esta oportunidad ya ha finalizado.",
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
  const now = new Date();

  const [oportunidades, competencies, yo, activeObjectives] = await Promise.all([
    db.opportunity.findMany({
      include: {
        requirements: { include: { competency: true } },
        applications: { select: { id: true, status: true } },
        objective: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    db.competency.findMany({ where: { status: "ACTIVA" }, orderBy: { name: "asc" } }),
    esEmpleado
      ? db.employee.findUnique({ where: { userId: Number(session.user.id) } })
      : null,
    db.organizationalObjective.findMany({
      where: { status: "ACTIVO" },
      select: { id: true, title: true, category: true, targetPeriod: true },
      orderBy: [{ weight: "desc" }, { createdAt: "desc" }],
    }),
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
        {puedeGestionar && (
          <OportunidadForm
            competencies={competencies}
            objectives={activeObjectives}
          />
        )}
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
        {oportunidades.map((o) => {
          const noAbierta = o.openDate ? now < new Date(o.openDate) : false;
          const vencida = o.deadline
            ? now > new Date(new Date(o.deadline).setHours(23, 59, 59, 999))
            : false;
          const puedePostular =
            esEmpleado &&
            o.status === "PUBLICADA" &&
            !yaAplicadas.has(o.id) &&
            !noAbierta &&
            !vencida;

          return (
            <div key={o.id} className="rounded-xl border border-zinc-200 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-3">
                    <h2 className="font-semibold text-zinc-900">{o.title}</h2>
                    <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                      {o.vacancies} {o.vacancies === 1 ? "vacante" : "vacantes"}
                    </span>
                  </div>
                  {o.objective && (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="inline-flex items-center gap-1 rounded bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700 border border-zinc-200">
                        <span>🎯</span>
                        <span>Alineado a: {o.objective.title}</span>
                        {o.objective.targetPeriod && (
                          <span className="text-zinc-500 font-normal">({o.objective.targetPeriod})</span>
                        )}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {vencida && o.status === "PUBLICADA" && (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700 font-medium">
                      Plazo vencido
                    </span>
                  )}
                  {noAbierta && o.status === "PUBLICADA" && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700 font-medium">
                      Abre el {new Date(o.openDate!).toLocaleDateString("es-MX")}
                    </span>
                  )}
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
              </div>
              <p className="mt-2 text-sm text-zinc-500">{o.description}</p>

              <div className="mt-3 flex flex-wrap gap-4 text-xs text-zinc-500">
                {o.openDate && (
                  <span>
                    📅 <strong>Apertura:</strong>{" "}
                    {new Date(o.openDate).toLocaleDateString("es-MX")}
                  </span>
                )}
                {o.deadline && (
                  <span>
                    ⏰ <strong>Fecha máxima para aplicar:</strong>{" "}
                    {new Date(o.deadline).toLocaleDateString("es-MX")}
                  </span>
                )}
                <span>
                  👥 <strong>Postulaciones registradas:</strong> {o.applications.length}
                </span>
              </div>

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
                {puedePostular && (
                  <form action={applyToOpportunity}>
                    <input type="hidden" name="opportunityId" value={o.id} />
                    <button className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700">
                      Postularme
                    </button>
                  </form>
                )}
                {esEmpleado && yaAplicadas.has(o.id) && (
                  <span className="text-xs text-zinc-500 font-medium">
                    ✓ Ya te postulaste a esta oportunidad (tu plan de desarrollo sigue activo en{" "}
                    <span className="underline">Mis planes</span>).
                  </span>
                )}
                {esEmpleado && !yaAplicadas.has(o.id) && vencida && o.status === "PUBLICADA" && (
                  <span className="text-xs text-red-500">
                    La fecha límite para postularse ya concluyó.
                  </span>
                )}
                {esEmpleado && !yaAplicadas.has(o.id) && noAbierta && o.status === "PUBLICADA" && (
                  <span className="text-xs text-amber-600">
                    La convocatoria aún no está abierta para postulaciones.
                  </span>
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
          );
        })}
        {oportunidades.length === 0 && (
          <p className="text-sm text-zinc-400">Sin oportunidades registradas</p>
        )}
      </div>
    </div>
  );
}
