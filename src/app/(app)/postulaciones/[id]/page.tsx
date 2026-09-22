import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import {
  approvePlan,
  setPlanActivityStatus,
  generateRecommendation,
  approveRecommendation,
} from "@/app/actions";
import PlanForm from "@/components/PlanForm";

const ACTIVITY_STATES = ["PENDIENTE", "EN_PROGRESO", "COMPLETADA", "NO_COMPLETADA", "CANCELADA"];

export default async function PostulacionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; plan?: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;
  const { error, plan: planOk } = await searchParams;

  const app = await db.application.findUnique({
    where: { id: Number(id) },
    include: {
      opportunity: true,
      employee: true,
      recommendation: true,
      plan: { include: { activities: { orderBy: { order: "asc" } } } },
      gaps: { include: { requirement: { include: { competency: true } } } },
    },
  });
  if (!app) notFound();

  if (session.user.role === "EMPLEADO") {
    const yo = await db.employee.findUnique({
      where: { userId: Number(session.user.id) },
    });
    if (!yo || yo.id !== app.employeeId) notFound();
  }

  const puedeGestionar = ["ADMIN", "RH", "SUPERVISOR"].includes(session.user.role);
  const esPropietario = app.employee.userId === Number(session.user.id);

  let actividadesSugeridas: string | undefined;
  if (app.recommendation?.activities) {
    try {
      const arr = JSON.parse(app.recommendation.activities) as {
        descripcion: string;
      }[];
      actividadesSugeridas = arr.map((a) => a.descripcion).join("\n");
    } catch {
      actividadesSugeridas = undefined;
    }
  }
  const usarSugeridas =
    actividadesSugeridas && app.recommendation?.status === "APROBADA"
      ? actividadesSugeridas
      : undefined;

  return (
    <div>
      <Link href="/postulaciones" className="text-sm text-zinc-500 underline hover:text-zinc-900">
        ← Volver a postulaciones
      </Link>
      <h1 className="mt-3 text-2xl font-bold text-zinc-900">
        {app.employee.firstName} {app.employee.lastName} → {app.opportunity.title}
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        Estado: {app.status} · Compatibilidad: {app.compatibility ?? "—"}%
      </p>

      {error === "plan" && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          Título, objetivo y al menos una actividad son obligatorios.
        </p>
      )}
      {planOk && (
        <p className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          Plan creado como PROPUESTO. Apruébalo para iniciarlo.
        </p>
      )}

      <h2 className="mt-8 text-lg font-semibold text-zinc-900">
        Análisis de compatibilidad (RF-011 a RF-013)
      </h2>
      <div className="mt-3 overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3">Competencia</th>
              <th className="px-4 py-3">Nivel actual</th>
              <th className="px-4 py-3">Requerido</th>
              <th className="px-4 py-3">Peso</th>
              <th className="px-4 py-3">Resultado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {app.gaps.map((g) => (
              <tr key={g.id}>
                <td className="px-4 py-3 font-medium text-zinc-900">
                  {g.requirement.competency.name}
                  {g.requirement.mandatory && (
                    <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-600">
                      obligatoria
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">{g.currentLevel}</td>
                <td className="px-4 py-3">{g.requiredLevel}</td>
                <td className="px-4 py-3">{g.requirement.weight}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-600">
                    Brecha de {g.requiredLevel - g.currentLevel}
                  </span>
                </td>
              </tr>
            ))}
            {app.gaps.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-green-600">
                  Sin brechas: cubre todos los requisitos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h2 className="mt-8 text-lg font-semibold text-zinc-900">
        Recomendación de desarrollo (Fase 4)
      </h2>
      <div className="mt-3 rounded-xl border border-zinc-200 bg-white p-5">
        {app.recommendation ? (
          <div>
            <p className="text-sm text-zinc-700">{app.recommendation.text}</p>
            {app.recommendation.activities && (
              <ol className="mt-3 list-inside list-decimal space-y-1 text-sm text-zinc-600">
                {(
                  JSON.parse(app.recommendation.activities) as {
                    descripcion: string;
                    orden: number;
                  }[]
                )
                  .sort((a, b) => a.orden - b.orden)
                  .map((a) => (
                    <li key={a.orden}>{a.descripcion}</li>
                  ))}
              </ol>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <p className="text-xs text-zinc-400">
                Estado: {app.recommendation.status}
                {app.recommendation.modelVersion
                  ? ` · origen: ${app.recommendation.modelVersion}`
                  : ""}
              </p>
              {puedeGestionar && app.recommendation.status === "PROPUESTA" && (
                <form action={approveRecommendation}>
                  <input
                    type="hidden"
                    name="recommendationId"
                    value={app.recommendation.id}
                  />
                  <input type="hidden" name="applicationId" value={app.id} />
                  <button className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-500">
                    Aprobar recomendación
                  </button>
                </form>
              )}
              {puedeGestionar && (
                <form action={generateRecommendation}>
                  <input type="hidden" name="applicationId" value={app.id} />
                  <button className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs hover:bg-zinc-50">
                    {app.recommendation.status === "APROBADA"
                      ? "Regenerar"
                      : "Regenerar recomendación"}
                  </button>
                </form>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-zinc-400">
              Aún no hay recomendación generada para esta postulación.
            </p>
            {puedeGestionar && (
              <form action={generateRecommendation}>
                <input type="hidden" name="applicationId" value={app.id} />
                <button className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700">
                  Generar recomendación con IA
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      <h2 className="mt-8 text-lg font-semibold text-zinc-900">
        Plan de desarrollo (RF-017, RF-018)
      </h2>

      {!app.plan && puedeGestionar && (
        <div className="mt-3">
          <PlanForm applicationId={app.id} defaultActivities={usarSugeridas} />
          {usarSugeridas && (
            <p className="mt-2 text-xs text-zinc-400">
              Las actividades de la recomendación aprobada vienen precargadas.
            </p>
          )}
        </div>
      )}

      {app.plan && (
        <div className="mt-3 rounded-xl border border-zinc-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold text-zinc-900">{app.plan.title}</h3>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
                {app.plan.status}
              </span>
              {puedeGestionar && app.plan.status === "PROPUESTO" && (
                <form action={approvePlan}>
                  <input type="hidden" name="planId" value={app.plan.id} />
                  <input type="hidden" name="applicationId" value={app.id} />
                  <button className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-500">
                    Aprobar plan
                  </button>
                </form>
              )}
            </div>
          </div>
          <p className="mt-1 text-sm text-zinc-500">{app.plan.objective}</p>
          <ol className="mt-4 space-y-2">
            {app.plan.activities.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-100 px-3 py-2 text-sm"
              >
                <span>
                  {a.order}. {a.description}{" "}
                  <span className="text-xs text-zinc-400">({a.status})</span>
                </span>
                {(esPropietario || puedeGestionar) &&
                  ["APROBADO", "EN_PROGRESO"].includes(app.plan?.status ?? "") && (
                    <form action={setPlanActivityStatus} className="flex items-center gap-2">
                      <input type="hidden" name="activityId" value={a.id} />
                      <select
                        name="status"
                        defaultValue={a.status}
                        className="rounded border border-zinc-300 px-1 py-0.5 text-xs"
                      >
                        {ACTIVITY_STATES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <button className="rounded border border-zinc-300 px-2 py-0.5 text-xs hover:bg-zinc-50">
                        Actualizar
                      </button>
                    </form>
                  )}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
