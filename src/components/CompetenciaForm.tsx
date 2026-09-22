"use client";

import { useState } from "react";
import { createCompetency } from "@/app/actions";

export default function CompetenciaForm() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700"
      >
        + Nueva competencia
      </button>
    );
  }

  return (
    <form
      action={createCompetency}
      className="grid grid-cols-1 gap-3 rounded-xl border border-zinc-200 bg-white p-5 sm:grid-cols-3"
    >
      <input name="name" placeholder="Nombre" required className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
      <select name="type" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm">
        <option value="TECNICA">Técnica</option>
        <option value="BLANDA">Blanda</option>
      </select>
      <input name="description" placeholder="Descripción" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm sm:col-span-3" />
      <div className="flex gap-2 sm:col-span-3">
        <button type="submit" className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700">
          Guardar
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50">
          Cancelar
        </button>
      </div>
    </form>
  );
}
