"use client";

import { useState } from "react";
import { createPlan } from "@/app/actions";

export default function PlanForm({
  applicationId,
  defaultActivities,
  activitiesJson,
  opportunityDeadline,
}: {
  applicationId: number;
  defaultActivities?: string;
  activitiesJson?: string;
  opportunityDeadline?: string;
}) {
  const [open, setOpen] = useState(false);
  const [useStructured, setUseStructured] = useState(Boolean(activitiesJson));

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700"
      >
        Crear plan de desarrollo
      </button>
    );
  }

  return (
    <form
      action={createPlan}
      className="space-y-3 rounded-xl border border-zinc-200 bg-white p-5"
    >
      <input type="hidden" name="applicationId" value={applicationId} />
      {useStructured && activitiesJson && (
        <input type="hidden" name="activitiesJson" value={activitiesJson} />
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <input
          name="title"
          placeholder="Título del plan"
          required
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
        <input
          name="objective"
          placeholder="Objetivo: cerrar las brechas detectadas"
          required
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
        <div>
          <input
            name="targetDate"
            type="date"
            defaultValue={opportunityDeadline}
            title="Fecha objetivo de finalización del plan"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-700"
          />
          {opportunityDeadline && (
            <span className="block text-[11px] text-zinc-400 mt-0.5">
              Ref. fecha límite: {opportunityDeadline}
            </span>
          )}
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-zinc-600">
          Actividades del plan {useStructured ? "(Estructuradas desde la recomendación aprobada)" : "(Texto manual)"}:
        </label>
        <textarea
          name="activities"
          rows={6}
          required
          defaultValue={defaultActivities}
          onChange={() => {
            if (useStructured) setUseStructured(false);
          }}
          placeholder={"Una actividad por línea, por ejemplo:\nCurso de Python intermedio\nProyecto práctico de datos\nReevaluación de competencias"}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm font-mono text-xs leading-relaxed"
        />
        {useStructured && (
          <p className="mt-1 text-[11px] text-purple-700">
            ✨ Las actividades desglosadas por la IA con sus fases, herramientas y <strong>entregables esperados</strong> se precargarán automáticamente en el plan del empleado. Si editas este cuadro, se guardará el texto manual.
          </p>
        )}
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700"
        >
          Crear plan (PROPUESTO)
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
