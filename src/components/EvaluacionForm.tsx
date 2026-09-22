"use client";

import { useState } from "react";
import { createEvaluation } from "@/app/actions";

type Emp = { id: number; firstName: string; lastName: string };
type Comp = { id: number; name: string };

export default function EvaluacionForm({
  employees,
  competencies,
}: {
  employees: Emp[];
  competencies: Comp[];
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700"
      >
        + Nueva evaluación
      </button>
    );
  }

  return (
    <form
      action={createEvaluation}
      className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <select name="employeeId" required className="rounded-lg border border-zinc-300 px-3 py-2 text-sm">
          <option value="">Empleado a evaluar…</option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.firstName} {e.lastName}
            </option>
          ))}
        </select>
        <select name="type" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm">
          <option value="INICIAL">Inicial</option>
          <option value="POST_CAPACITACION">Post capacitación</option>
        </select>
        <input name="comment" placeholder="Comentario (opcional)" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
      </div>
      <div className="rounded-lg border border-zinc-200 p-3">
        <p className="text-sm font-medium text-zinc-700">Niveles (1–5)</p>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {competencies.map((c) => (
            <label key={c.id} className="flex items-center justify-between gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm">
              <span>{c.name}</span>
              <select name={`level_${c.id}`} defaultValue="3" className="rounded border border-zinc-300 px-1 py-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </div>
      <p className="text-xs text-zinc-400">
        La evaluación se guarda como finalizada y actualiza los niveles vigentes (RF-023).
      </p>
      <div className="flex gap-2">
        <button type="submit" className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700">
          Finalizar evaluación
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50">
          Cancelar
        </button>
      </div>
    </form>
  );
}
