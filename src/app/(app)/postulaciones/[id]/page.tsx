import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import {
  approvePlan,
  setPlanActivityStatus,
  approveRecommendation,
  decideApplication,
} from "@/app/actions";
import PlanForm from "@/components/PlanForm";
import PlanActivityCard from "@/components/PlanActivityCard";
import GenerateRecommendationButton from "@/components/GenerateRecommendationButton";

export default async function PostulacionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    error?: string;
    plan?: string;
    recOk?: string;
    evalOk?: string;
    decidida?: string;
  }>;
}) {
  const session = await requireSession();
  const { id } = await params;
  const { error, plan: planOk, recOk, evalOk, decidida } = await searchParams;

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
  // La evaluación post-capacitación es tarea del supervisor (RH no evalúa)
  const puedeEvaluar = ["ADMIN", "SUPERVISOR"].includes(session.user.role);
  const esPropietario = app.employee.userId === Number(session.user.id);

  let actividadesSugeridas: string | undefined;
  let rawActivitiesArray: any[] = [];
  if (app.recommendation?.activities) {
    try {
      rawActivitiesArray = JSON.parse(app.recommendation.activities);
      if (Array.isArray(rawActivitiesArray)) {
        actividadesSugeridas = rawActivitiesArray
          .map((a: any) => {
            const prefix = a.fase ? `[${a.fase}] ` : "";
            const title = a.titulo ? `${a.titulo}: ` : "";
            const desc = a.descripcion || "";
            const extras: string[] = [];
            if (a.herramientas) extras.push(`Herramientas: ${a.herramientas}`);
            if (a.entregable) extras.push(`Entregable: ${a.entregable}`);
            if (a.criterio) extras.push(`Criterio: ${a.criterio}`);
            return `${prefix}${title}${desc}${extras.length > 0 ? ` (${extras.join(" | ")})` : ""}`;
          })
          .join("\n\n");
      }
    } catch {
      actividadesSugeridas = undefined;
    }
  }
  const usarSugeridas =
    actividadesSugeridas && app.recommendation?.status === "APROBADA"
      ? actividadesSugeridas
      : undefined;
  const jsonSugeridas =
    app.recommendation?.activities && app.recommendation?.status === "APROBADA"
      ? app.recommendation.activities
      : undefined;

  const plan = app.plan;
  const brechasAbiertas = app.gaps.filter((g) => g.status !== "SUPERADA");
  const todasBrechasSuperadas = app.gaps.length > 0 && brechasAbiertas.length === 0;
  const planCompletado = plan?.status === "COMPLETADO";

  return (
    <div>
      <Link href="/postulaciones" className="text-sm text-zinc-500 underline hover:text-zinc-900">
        ← Volver a postulaciones
      </Link>
      <h1 className="mt-3 text-2xl font-bold text-zinc-900">
        {app.employee.firstName} {app.employee.lastName} → {app.opportunity.title}
      </h1>
      <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-zinc-500">
        <span>Estado postulación: <strong>{app.status}</strong></span>
        <span>·</span>
        <span>Compatibilidad: <strong>{app.compatibility ?? "—"}%</strong></span>
        <span>·</span>
        <span>Oportunidad: <span className="rounded px-1.5 py-0.5 text-xs bg-zinc-100 text-zinc-700">{app.opportunity.status}</span></span>
      </div>

      {app.opportunity.status === "CERRADA" && (
        <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs text-blue-800">
          <strong>Oportunidad cerrada:</strong> La convocatoria para esta vacante ha finalizado. Sin embargo, el <strong>plan de desarrollo del colaborador continúa 100% activo y vigente</strong> para seguir avanzando y registrando el cumplimiento de sus actividades.
        </div>
      )}

      {error === "plan" && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          Título, objetivo y al menos una actividad son obligatorios.
        </p>
      )}
      {error === "decision" && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          Error al registrar la decisión de la postulación.
        </p>
      )}
      {planOk && (
        <p className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          Plan creado como PROPUESTO. Apruébalo para iniciarlo.
        </p>
      )}
      {recOk && (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-red-900/60 bg-gradient-to-r from-red-950/40 via-[#181116] to-[#121118] px-4 py-3 text-xs text-rose-200 shadow-sm animate-in fade-in duration-300">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-800 text-white font-bold text-[10px]">
            ✓
          </span>
          <div>
            <strong className="font-semibold text-rose-100">
              Recomendación generada exitosamente con IA.
            </strong>
            <p className="text-zinc-400 mt-0.5">
              Se han estructurado las fases, herramientas, entregables y criterios objetivos de evaluación.
            </p>
          </div>
        </div>
      )}
      {evalOk && (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-emerald-900/60 bg-gradient-to-r from-emerald-950/40 via-[#0e1712] to-[#121118] px-4 py-3 text-xs text-emerald-200 shadow-sm animate-in fade-in duration-300">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-white font-bold text-[10px]">
            ✓
          </span>
          <div>
            <strong className="font-semibold text-emerald-100">
              Evaluación Post-Capacitación registrada exitosamente.
            </strong>
            <p className="text-zinc-400 mt-0.5">
              Se han actualizado los niveles de competencia, acreditando formalmente las brechas y recalculando la compatibilidad al 100%.
            </p>
          </div>
        </div>
      )}
      {decidida === "ACEPTADA" && (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-emerald-600/50 bg-emerald-950/40 px-4 py-3 text-xs text-emerald-200 shadow-sm animate-in fade-in duration-300">
          <div>
            <strong className="font-bold text-emerald-100">Postulación Aceptada</strong>
            <p className="text-zinc-300 mt-0.5">
              El colaborador ha sido promovido/a formalmente a la posición de {app.opportunity.title}.
            </p>
          </div>
        </div>
      )}
      {decidida === "RECHAZADA" && (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-900/60 px-4 py-3 text-xs text-zinc-300 shadow-sm animate-in fade-in duration-300">
          <div>
            <strong className="font-bold text-zinc-200">Postulación Descartada</strong>
            <p className="text-zinc-400 mt-0.5">
              El proceso de postulación ha concluido como rechazada.
            </p>
          </div>
        </div>
      )}

      {/* Banner de Estado del Flujo y Siguiente Paso */}
      {planCompletado && brechasAbiertas.length > 0 && (
        <div className="mt-5 rounded-2xl border border-amber-600/40 bg-gradient-to-br from-[#1a130c] via-[#161217] to-[#121118] p-5 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold">
                  ✓
                </span>
                <h3 className="text-sm font-bold text-amber-200">
                  Etapa Formativa Completada al 100%
                </h3>
                <span className="rounded-full bg-amber-950/80 border border-amber-700/60 px-2.5 py-0.5 text-[10px] font-semibold text-amber-300">
                  Siguiente paso pendiente
                </span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed max-w-2xl">
                {app.employee.firstName} completó todas las actividades del plan y sus entregables fueron calificados y aprobados por el supervisor.
                En la metodología PDP, las actividades demuestran el aprendizaje, pero la acreditación oficial de las competencias para <strong>cerrar las brechas pendientes ({brechasAbiertas.length})</strong> y elevar la compatibilidad al <strong>100%</strong> requiere registrar la <strong>Evaluación Post-Capacitación</strong> (RF-006 / RF-018).
              </p>
            </div>

            {puedeEvaluar && (
              <Link
                href={`/evaluaciones?empleado=${app.employeeId}&tipo=POST_CAPACITACION&returnTo=/postulaciones/${app.id}`}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-700 via-rose-700 to-red-600 hover:from-red-600 hover:to-rose-600 border border-red-600/50 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:shadow-lg transition shrink-0 cursor-pointer"
              >
                <span>Realizar Evaluación Post-Capacitación</span>
                <span>→</span>
              </Link>
            )}
          </div>
        </div>
      )}

      {todasBrechasSuperadas && app.status === "ACTIVA" && (
        <div className="mt-5 rounded-2xl border border-emerald-600/40 bg-gradient-to-br from-[#0c1a12] via-[#101416] to-[#121118] p-5 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold">
                  ★
                </span>
                <h3 className="text-sm font-bold text-emerald-200">
                  ¡Competencias Acreditadas al 100%!
                </h3>
                <span className="rounded-full bg-emerald-950/80 border border-emerald-700/60 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-300">
                  Listo para Decisión Final
                </span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed max-w-2xl">
                {app.employee.firstName} superó todas las brechas requeridas para la posición <strong>{app.opportunity.title}</strong>. El área de Recursos Humanos o Dirección puede emitir la resolución formal de asignación de vacante (RF-014).
              </p>
            </div>

            {["ADMIN", "RH"].includes(session.user.role) && (
              <div className="flex items-center gap-2 shrink-0">
                <form action={decideApplication}>
                  <input type="hidden" name="applicationId" value={app.id} />
                  <input type="hidden" name="decision" value="ACEPTADA" />
                  <button
                    type="submit"
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-xs font-bold text-white shadow-md transition cursor-pointer flex items-center gap-1.5"
                  >
                    <span>✓</span>
                    <span>Aceptar y Asignar Vacante</span>
                  </button>
                </form>
                <form action={decideApplication}>
                  <input type="hidden" name="applicationId" value={app.id} />
                  <input type="hidden" name="decision" value="RECHAZADA" />
                  <button
                    type="submit"
                    className="rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-3.5 py-2.5 text-xs font-semibold text-zinc-300 transition cursor-pointer"
                  >
                    Descartar
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {app.status === "ACEPTADA" && (
        <div className="mt-5 rounded-2xl border border-emerald-500/50 bg-gradient-to-r from-emerald-950/40 via-[#0e1812] to-[#121118] p-4 text-xs text-emerald-200 flex flex-wrap items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <div>
              <strong className="block text-emerald-100 font-bold text-sm">
                Postulación Aceptada Oficialmente
              </strong>
              <span className="text-zinc-300">
                {app.employee.firstName} completó todo el ciclo formativo del PDP, acreditó sus competencias y la posición fue asignada formalmente.
              </span>
            </div>
          </div>
          <span className="rounded-full bg-emerald-900/60 border border-emerald-600 px-3 py-1 text-xs font-bold text-emerald-200">
            ✓ PROCESO FINALIZADO CON ÉXITO
          </span>
        </div>
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
                  {g.status === "SUPERADA" ? (
                    <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                      ✓ Brecha Superada (Nivel {g.currentLevel}/{g.requiredLevel})
                    </span>
                  ) : (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-600 font-medium">
                      Brecha de {Math.max(0, g.requiredLevel - g.currentLevel)} ({g.status})
                    </span>
                  )}
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

      <h2 className="mt-8 text-lg font-bold text-zinc-100 flex items-center gap-2">
        <span>Recomendación de desarrollo (Fase 4)</span>
      </h2>
      <div className="mt-3 rounded-2xl border border-zinc-800/80 bg-[#0e0e13] p-5 shadow-xl">
        {app.recommendation ? (
          <div>
            <p className="text-sm font-medium leading-relaxed text-zinc-200 bg-[#161622] border border-zinc-800/80 rounded-xl p-4 shadow-inner">
              {app.recommendation.text}
            </p>

            {rawActivitiesArray.length > 0 && (
              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500 shadow-[0_0_6px_rgba(173,66,81,0.6)]" />
                    Desglose Específico de Actividades ({rawActivitiesArray.length})
                  </h4>
                  <span className="text-[11px] text-zinc-500 font-medium">
                    Fases · Herramientas · Entregables · Criterios
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-3.5">
                  {rawActivitiesArray
                    .sort((a: any, b: any) => (a.orden ?? 0) - (b.orden ?? 0))
                    .map((act: any, idx: number) => (
                      <div
                        key={act.orden ?? idx}
                        className="rounded-xl border border-zinc-800/80 bg-[#121217] p-4 transition-all hover:border-red-900/50 hover:bg-[#15151c] shadow-xs"
                      >
                        {/* Header: Orden, Fase y Título con tonos vino y grafito */}
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-red-700 to-red-950 border border-red-600/40 text-[10px] font-extrabold text-white shadow-[0_0_6px_rgba(140,37,52,0.35)]">
                            {act.orden ?? idx + 1}
                          </span>
                          {act.fase && (
                            <span className="rounded-full bg-red-950/70 border border-red-800/50 px-2.5 py-0.5 text-[11px] font-semibold text-red-300 shadow-[0_0_6px_rgba(140,37,52,0.15)]">
                              {act.fase}
                            </span>
                          )}
                          <h5 className="font-bold text-sm text-zinc-100">
                            {act.titulo || act.descripcion}
                          </h5>
                        </div>

                        {/* Descripción extendida si difiere del título */}
                        {act.titulo && act.descripcion && act.titulo !== act.descripcion && (
                          <p className="mt-2 text-xs leading-relaxed text-zinc-400 pl-0.5">
                            {act.descripcion}
                          </p>
                        )}

                        {/* Grid de desglose técnico en paleta vino, grafito y carmesí */}
                        <div className="mt-3.5 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                          {/* Herramientas / Metodología (Negro Grafito con sutil borde grafito) */}
                          <div className="rounded-lg border border-zinc-800/90 bg-[#161622] p-3 transition hover:border-zinc-700">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                              Herramientas / Metodología
                            </span>
                            <p className="mt-1 text-xs text-zinc-300 leading-snug font-normal">
                              {act.herramientas || "No especificado"}
                            </p>
                          </div>

                          {/* Entregable y Evidencia (Tinte Vino / Borgoña Elegante) */}
                          <div className="rounded-lg border border-red-900/60 bg-gradient-to-br from-red-950/45 via-[#1b1218] to-[#141217] p-3 transition hover:border-red-800/70 shadow-[inset_0_0_12px_rgba(140,37,52,0.08)]">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-red-300">
                              Entregable y Evidencia
                            </span>
                            <p className="mt-1 text-xs font-semibold text-red-100 leading-snug">
                              {act.entregable || "Evidencia según rúbrica"}
                            </p>
                          </div>

                          {/* Criterio de Aprobación (Tinte Carmesí / Granate Suave) */}
                          <div className="rounded-lg border border-rose-950/80 bg-gradient-to-br from-rose-950/30 via-[#171116] to-[#141217] p-3 transition hover:border-rose-900/60 shadow-[inset_0_0_12px_rgba(173,66,81,0.06)]">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-rose-300">
                              Criterio de Aprobación
                            </span>
                            <p className="mt-1 text-xs font-medium text-zinc-200 leading-snug">
                              {act.criterio || "Validación del supervisor"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-3">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-zinc-500">
                  Estado: <strong>{app.recommendation.status}</strong>
                </span>
                <span>·</span>
                {app.recommendation.modelVersion?.includes("fallo") ||
                app.recommendation.modelVersion?.includes("plantilla") ? (
                  <span
                    className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-800 border border-amber-200"
                    title={app.recommendation.modelVersion}
                  >
                    Origen: Plantilla estructurada (Cuota GLM en límite o red)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-800 border border-emerald-200">
                    Origen: IA GLM ({app.recommendation.modelVersion || "glm-4.5"})
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {puedeGestionar && app.recommendation.status === "PROPUESTA" && (
                  <form action={approveRecommendation}>
                    <input
                      type="hidden"
                      name="recommendationId"
                      value={app.recommendation.id}
                    />
                    <input type="hidden" name="applicationId" value={app.id} />
                    <button className="rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-red-700 transition cursor-pointer">
                      Aprobar recomendación
                    </button>
                  </form>
                )}
                {puedeGestionar && (
                  <GenerateRecommendationButton
                    applicationId={app.id}
                    isRegenerate={true}
                  />
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-zinc-400">
              Aún no hay recomendación generada para esta postulación.
            </p>
            {puedeGestionar && (
              <GenerateRecommendationButton
                applicationId={app.id}
                isRegenerate={false}
              />
            )}
          </div>
        )}
      </div>

      <h2 className="mt-8 text-lg font-semibold text-zinc-900">
        Plan de desarrollo (RF-017, RF-018)
      </h2>

      {!plan && puedeGestionar && (
        <div className="mt-3">
          <PlanForm
            applicationId={app.id}
            defaultActivities={usarSugeridas}
            activitiesJson={jsonSugeridas}
            opportunityDeadline={
              app.opportunity.deadline
                ? app.opportunity.deadline.toISOString().split("T")[0]
                : undefined
            }
          />
          {usarSugeridas && (
            <p className="mt-2 text-xs text-zinc-400">
              Las actividades desglosadas de la recomendación aprobada vienen precargadas.
            </p>
          )}
        </div>
      )}

      {plan && (
        <div className="mt-3 rounded-xl border border-zinc-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold text-zinc-900">{plan.title}</h3>
            <div className="flex items-center gap-3">
              {plan.targetDate && (
                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                  Objetivo: {new Date(plan.targetDate).toLocaleDateString("es-MX")}
                </span>
              )}
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
                {plan.status}
              </span>
              {puedeGestionar && plan.status === "PROPUESTO" && (
                <form action={approvePlan}>
                  <input type="hidden" name="planId" value={plan.id} />
                  <input type="hidden" name="applicationId" value={app.id} />
                  <button className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-500">
                    Aprobar plan
                  </button>
                </form>
              )}
            </div>
          </div>
          <p className="mt-1 text-sm text-zinc-500">{plan.objective}</p>
          <div className="mt-4 space-y-3">
            {plan.activities.map((a) => (
              <PlanActivityCard
                key={a.id}
                activity={a}
                planStatus={plan.status}
                isEmployee={esPropietario}
                canManage={puedeGestionar}
                canEvaluate={["ADMIN", "SUPERVISOR"].includes(session.user.role)}
                userRole={session.user.role}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
