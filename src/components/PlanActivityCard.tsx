"use client";

import { useState } from "react";
import {
  setPlanActivityStatus,
  submitActivityDeliverable,
  reviewActivityDeliverable,
} from "@/app/actions";

export type PlanActivityData = {
  id: number;
  description: string;
  order: number;
  deliverable: string | null;
  evidenceUrl: string | null;
  submittedAt: Date | string | null;
  feedback: string | null;
  reviewedAt: Date | string | null;
  status: string;
};

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string }
> = {
  PENDIENTE: {
    label: "Pendiente",
    bg: "bg-zinc-800/80",
    text: "text-zinc-300",
    border: "border-zinc-700/60",
  },
  EN_PROGRESO: {
    label: "En progreso",
    bg: "bg-blue-950/60",
    text: "text-blue-300",
    border: "border-blue-800/50",
  },
  ENTREGADA: {
    label: "Entregada / En revisión",
    bg: "bg-purple-950/60",
    text: "text-purple-300",
    border: "border-purple-800/50",
  },
  COMPLETADA: {
    label: "Completada",
    bg: "bg-red-950/80",
    text: "text-rose-200",
    border: "border-red-800/60 shadow-[0_0_8px_rgba(140,37,52,0.2)]",
  },
  NO_COMPLETADA: {
    label: "No completada",
    bg: "bg-zinc-900/90",
    text: "text-zinc-400",
    border: "border-zinc-800",
  },
  CANCELADA: {
    label: "Cancelada",
    bg: "bg-zinc-900/80",
    text: "text-zinc-500",
    border: "border-zinc-800",
  },
};

// Parser inteligente para desglosar cualquier actividad (estructurada o manual)
export function parseActivityContent(
  rawDesc: string,
  rawDeliverable?: string | null
) {
  let text = (rawDesc || "").trim();
  let fase = "";
  let titulo = "";
  let descripcion = "";
  let herramientas = "";
  let entregable = "";
  let criterio = "";

  // 1. Extraer bloques de extras al final: (Herramientas: ... | Entregable: ... | Criterio: ...)
  const extrasMatch = text.match(
    /\((?:Herramientas:[\s\S]*?|Criterio:[\s\S]*?|Entregable:[\s\S]*?)\)$/i
  );
  if (extrasMatch) {
    const extrasBlock = extrasMatch[0].slice(1, -1); // remover '(' y ')'
    text = text.slice(0, extrasMatch.index).trim();

    const hMatch = extrasBlock.match(/Herramientas:\s*([^|]+)/i);
    if (hMatch) herramientas = hMatch[1].trim();

    const eMatch = extrasBlock.match(/Entregable:\s*([^|]+)/i);
    if (eMatch) entregable = eMatch[1].trim();

    const cMatch = extrasBlock.match(/Criterio:\s*([\s\S]+)/i);
    if (cMatch) criterio = cMatch[1].trim();
  }

  // Si no se extrajo entregable de la descripción pero viene en deliverable como [Entregable esperado: ...]
  if (!entregable && rawDeliverable) {
    const delivMatch = rawDeliverable.match(
      /^\[Entregable esperado:\s*([\s\S]+)\]$/i
    );
    if (delivMatch) {
      entregable = delivMatch[1].trim();
    }
  }

  // 2. Extraer Fase inicial [Fase ... [ ... ]] o [Fase ...] o [Hito ...]
  if (text.startsWith("[")) {
    let depth = 0;
    let endIdx = -1;
    for (let i = 0; i < text.length; i++) {
      if (text[i] === "[") depth++;
      else if (text[i] === "]") {
        depth--;
        if (depth === 0) {
          endIdx = i;
          break;
        }
      }
    }
    if (endIdx > 0) {
      fase = text.slice(1, endIdx).trim();
      text = text.slice(endIdx + 1).trim();
    }
  }

  // 3. Separar Título y Descripción si hay dos puntos ':' cerca del inicio
  const colonIdx = text.indexOf(":");
  if (colonIdx > 0 && colonIdx < 140) {
    titulo = text.slice(0, colonIdx).trim();
    descripcion = text.slice(colonIdx + 1).trim();
  } else {
    if (text.length > 90) {
      descripcion = text;
    } else {
      titulo = text;
    }
  }

  return {
    fase,
    titulo,
    descripcion: descripcion || titulo,
    hasCustomTitle: Boolean(titulo && descripcion && titulo !== descripcion),
    herramientas,
    entregable,
    criterio,
  };
}

export default function PlanActivityCard({
  activity,
  planStatus,
  isEmployee,
  canManage,
  canEvaluate,
  userRole,
}: {
  activity: PlanActivityData;
  planStatus: string;
  isEmployee: boolean;
  canManage: boolean;
  canEvaluate?: boolean;
  userRole?: string;
}) {
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  const isRH = userRole === "RH";
  const allowEvaluation = canEvaluate !== undefined ? canEvaluate : (canManage && !isRH);

  const planIsActive = ["APROBADO", "EN_PROGRESO"].includes(planStatus);
  const cfg = STATUS_CONFIG[activity.status] ?? STATUS_CONFIG.PENDIENTE;
  const parsed = parseActivityContent(activity.description, activity.deliverable);

  // ¿Tiene un entregable real enviado por el colaborador?
  const hasActualDelivery = Boolean(
    activity.submittedAt ||
      (activity.deliverable &&
        !activity.deliverable.startsWith("[Entregable esperado:") &&
        activity.deliverable.trim().length > 0)
  );
  const actualSubmittedText = activity.deliverable
    ? activity.deliverable.replace(/^\[Entregable esperado:\s*[\s\S]+\]$/i, "").trim()
    : "";

  return (
    <div
      className={`rounded-xl border p-4 sm:p-5 transition-all ${
        activity.status === "COMPLETADA"
          ? "border-red-900/50 bg-[#141218] shadow-[inset_0_0_12px_rgba(140,37,52,0.08)]"
          : activity.status === "ENTREGADA"
            ? "border-purple-900/40 bg-[#16121a]"
            : activity.status === "EN_PROGRESO"
              ? "border-blue-900/40 bg-[#11141c]"
              : "border-zinc-800/80 bg-[#121217]"
      }`}
    >
      {/* Encabezado y acciones */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex-1 min-w-[240px]">
          {/* Fila de badges: Orden, Estado y Fase */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 border border-zinc-700/80 text-xs font-bold text-white shadow-xs">
              {activity.order}
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.bg} ${cfg.text} border ${cfg.border}`}
            >
              {cfg.label}
            </span>
            {parsed.fase && (
              <span className="rounded-full bg-red-950/70 border border-red-800/50 px-2.5 py-0.5 text-[11px] font-semibold text-red-300 shadow-[0_0_6px_rgba(140,37,52,0.15)]">
                {parsed.fase}
              </span>
            )}
          </div>

          {/* Título de la actividad destacado */}
          <h4 className="mt-2.5 text-sm sm:text-base font-bold text-zinc-100 leading-snug tracking-tight">
            {parsed.titulo || parsed.descripcion}
          </h4>

          {/* Descripción metodológica legible con espaciado */}
          {parsed.hasCustomTitle && (
            <p className="mt-2 text-xs sm:text-sm leading-relaxed text-zinc-300 font-normal pl-0.5">
              {parsed.descripcion}
            </p>
          )}

          {/* Grid de desglose técnico resaltado: Herramientas, Entregable y Criterio */}
          {(parsed.herramientas || parsed.entregable || parsed.criterio) && (
            <div className="mt-3.5 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              {/* Herramientas / Metodología (Negro Grafito elegante) */}
              <div className="rounded-lg border border-zinc-800/90 bg-[#161622] p-3 transition hover:border-zinc-700">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  🛠️ Herramientas / Metodología
                </span>
                <p className="mt-1 text-xs text-zinc-300 leading-snug font-normal">
                  {parsed.herramientas || "Metodología estándar"}
                </p>
              </div>

              {/* Entregable y Evidencia esperada (Gradiente Borgoña / Vino) */}
              <div className="rounded-lg border border-red-900/60 bg-gradient-to-br from-red-950/45 via-[#1b1218] to-[#141217] p-3 transition hover:border-red-800/70 shadow-[inset_0_0_12px_rgba(140,37,52,0.08)]">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-red-300">
                  📦 Entregable Esperado
                </span>
                <p className="mt-1 text-xs font-semibold text-red-100 leading-snug">
                  {parsed.entregable || "Evidencia según rúbrica"}
                </p>
              </div>

              {/* Criterio de Aprobación (Gradiente Carmesí / Granate) */}
              <div className="rounded-lg border border-rose-950/80 bg-gradient-to-br from-rose-950/30 via-[#171116] to-[#141217] p-3 transition hover:border-rose-900/60 shadow-[inset_0_0_12px_rgba(173,66,81,0.06)]">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-rose-300">
                  🎯 Criterio de Aprobación
                </span>
                <p className="mt-1 text-xs font-medium text-zinc-200 leading-snug">
                  {parsed.criterio || "Validación del supervisor"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Acciones principales rápidas */}
        {planIsActive && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Si es empleado y está pendiente, botón para iniciar */}
            {isEmployee && activity.status === "PENDIENTE" && (
              <form action={setPlanActivityStatus}>
                <input type="hidden" name="activityId" value={activity.id} />
                <input type="hidden" name="status" value="EN_PROGRESO" />
                <button
                  type="submit"
                  className="rounded-lg border border-blue-800/60 bg-blue-950/50 px-3 py-1.5 text-xs font-semibold text-blue-300 hover:bg-blue-900/50 transition cursor-pointer"
                >
                  ▶ Iniciar actividad
                </button>
              </form>
            )}

            {/* Si es empleado y puede entregar */}
            {isEmployee &&
              ["PENDIENTE", "EN_PROGRESO", "ENTREGADA"].includes(
                activity.status
              ) && (
                <button
                  type="button"
                  onClick={() => setShowSubmitModal((prev) => !prev)}
                  className="rounded-lg bg-gradient-to-r from-[#8c2534] to-[#ad4251] hover:from-[#9d2c3c] hover:to-[#be4b5b] border border-red-700/60 px-3.5 py-1.5 text-xs font-semibold text-white transition shadow-xs cursor-pointer"
                >
                  {actualSubmittedText
                    ? "Editar entregable / evidencia"
                    : "📤 Enviar entregable"}
                </button>
              )}

            {/* Si es supervisor/admin y puede evaluar */}
            {allowEvaluation && (
              <button
                type="button"
                onClick={() => setShowReviewModal((prev) => !prev)}
                className="rounded-lg border border-zinc-700/80 bg-zinc-900/80 px-3.5 py-1.5 text-xs font-semibold text-zinc-200 hover:text-white hover:bg-zinc-800 transition shadow-xs cursor-pointer"
              >
                {activity.feedback ? "Modificar revisión" : "🔍 Revisar y calificar"}
              </button>
            )}

            {/* Si es RH: mostrar distintivo informativo de seguimiento sin botón evaluador */}
            {!allowEvaluation && isRH && (
              <span
                className="rounded-lg border border-zinc-800/90 bg-[#161622] px-2.5 py-1.5 text-[11px] font-medium text-zinc-400 flex items-center gap-1.5 shadow-2xs"
                title="Recursos Humanos da seguimiento al plan; la calificación y retroalimentación técnica corresponde al supervisor."
              >
                <span>👁️</span>
                <span>Seguimiento RH</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Sección del Entregable enviado por el colaborador */}
      {hasActualDelivery && actualSubmittedText && (
        <div className="mt-3.5 rounded-lg border border-red-900/60 bg-gradient-to-br from-red-950/40 via-[#1b1218] to-[#141217] p-3.5 text-xs shadow-[inset_0_0_12px_rgba(140,37,52,0.08)]">
          <div className="flex flex-wrap items-center justify-between gap-1 text-red-300 font-semibold">
            <span>📦 Entregable y evidencia enviada por el colaborador:</span>
            {activity.submittedAt && (
              <span className="text-[11px] text-zinc-400 font-normal">
                Enviado:{" "}
                {new Date(activity.submittedAt).toLocaleDateString("es-MX", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
          </div>
          <p className="mt-1.5 whitespace-pre-wrap text-zinc-200 text-xs leading-relaxed">
            {actualSubmittedText}
          </p>
          {activity.evidenceUrl && (
            <div className="mt-2.5">
              <a
                href={activity.evidenceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-red-400 underline hover:text-red-300 transition"
              >
                🔗 Ver evidencia adjunta ({activity.evidenceUrl})
              </a>
            </div>
          )}
        </div>
      )}

      {/* Sección del Feedback del Supervisor */}
      {activity.feedback && (
        <div className="mt-3 rounded-lg border border-rose-950/80 bg-gradient-to-br from-rose-950/30 via-[#171116] to-[#141217] p-3 text-xs shadow-[inset_0_0_12px_rgba(173,66,81,0.06)]">
          <div className="flex flex-wrap items-center justify-between gap-1 text-rose-300 font-semibold">
            <span>💬 Retroalimentación del supervisor:</span>
            {activity.reviewedAt && (
              <span className="text-[11px] text-zinc-400 font-normal">
                Revisado:{" "}
                {new Date(activity.reviewedAt).toLocaleDateString("es-MX", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
          </div>
          <p className="mt-1 whitespace-pre-wrap text-zinc-200 text-xs leading-relaxed">
            {activity.feedback}
          </p>
        </div>
      )}

      {/* Formulario para que el empleado envíe entregable */}
      {showSubmitModal && isEmployee && (
        <form
          action={async (fd) => {
            await submitActivityDeliverable(fd);
            setShowSubmitModal(false);
          }}
          className="mt-3 space-y-3 rounded-xl border border-zinc-800 bg-[#161622] p-4 shadow-xl"
        >
          <input type="hidden" name="activityId" value={activity.id} />
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Descripción del entregable o solución desarrollada *
            </label>
            <textarea
              name="deliverable"
              rows={3}
              required
              defaultValue={activity.deliverable ?? ""}
              placeholder="Explica qué realizaste, entregables concretos, métricas alcanzadas o solución aplicada..."
              className="w-full rounded-xl border border-zinc-700/80 bg-[#121217] p-2.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-[#ad4251] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Enlace web a la evidencia o proyecto (GitHub, Drive, demo, etc.)
            </label>
            <input
              name="evidenceUrl"
              type="url"
              defaultValue={activity.evidenceUrl ?? ""}
              placeholder="https://github.com/usuario/proyecto o https://drive.google.com/..."
              className="w-full rounded-xl border border-zinc-700/80 bg-[#121217] px-2.5 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-[#ad4251] focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowSubmitModal(false)}
              className="rounded-lg border border-zinc-700/80 bg-zinc-800/80 px-3.5 py-1.5 text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-700 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-lg bg-gradient-to-r from-[#8c2534] to-[#ad4251] hover:from-[#9d2c3c] hover:to-[#be4b5b] border border-red-700/60 px-4 py-1.5 text-xs font-semibold text-white shadow-xs transition cursor-pointer"
            >
              Confirmar y Enviar Entregable
            </button>
          </div>
        </form>
      )}

      {/* Formulario para que el supervisor revise y califique */}
      {showReviewModal && canManage && (
        <form
          action={async (fd) => {
            await reviewActivityDeliverable(fd);
            setShowReviewModal(false);
          }}
          className="mt-3 space-y-3 rounded-xl border border-zinc-800 bg-[#161622] p-4 shadow-xl"
        >
          <input type="hidden" name="activityId" value={activity.id} />
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Comentarios y retroalimentación para el empleado
            </label>
            <textarea
              name="feedback"
              rows={3}
              defaultValue={activity.feedback ?? ""}
              placeholder="Excelente trabajo, o especifica los puntos que se deben mejorar..."
              className="w-full rounded-xl border border-zinc-700/80 bg-[#121217] p-2.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-[#ad4251] focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setShowReviewModal(false)}
              className="rounded-lg border border-zinc-700/80 bg-zinc-800/80 px-3.5 py-1.5 text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-700 transition cursor-pointer"
            >
              Cancelar
            </button>
            <div className="flex gap-2">
              <button
                type="submit"
                name="status"
                value="EN_PROGRESO"
                className="rounded-lg border border-amber-800/60 bg-amber-950/50 px-3.5 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-900/50 transition cursor-pointer"
              >
                ↺ Solicitar correcciones
              </button>
              <button
                type="submit"
                name="status"
                value="COMPLETADA"
                className="rounded-lg bg-gradient-to-r from-red-700 to-rose-700 hover:from-red-600 hover:to-rose-600 border border-red-600/50 px-4 py-1.5 text-xs font-semibold text-white shadow-xs transition cursor-pointer"
              >
                ✓ Aprobar entregable (Completar)
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
