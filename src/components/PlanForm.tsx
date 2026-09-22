"use client";

import { useState } from "react";
import { createPlan } from "@/app/actions";

export default function PlanForm({
  applicationId,
  defaultActivities,
}: {
  applicationId: number;
  defaultActivities?: string;
}) {
  const [open, setOpen] = useState(false);

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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
      </div>
      <textarea
        name="activities"
        rows={5}
        required
        defaultValue={defaultActivities}
        placeholder={"Una actividad por línea, por ejemplo:\nCurso de Python intermedio\nProyecto práctico de datos\nReevaluación de competencias"}
        className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
      />
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
