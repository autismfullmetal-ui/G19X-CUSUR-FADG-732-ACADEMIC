"use client";

import { useState } from "react";
import { createOpportunity } from "@/app/actions";

type Comp = { id: number; name: string };
type Row = { key: number; level: string; weight: string; mandatory: string; competencyId: string };

let counter = 1;

export default function OportunidadForm({ competencies }: { competencies: Comp[] }) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);

  const addRow = () =>
    setRows((r) => [
      ...r,
      { key: counter++, competencyId: "", level: "3", weight: "1", mandatory: "no" },
    ]);
  const updateRow = (key: number, patch: Partial<Row>) =>
    setRows((r) => r.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  const removeRow = (key: number) => setRows((r) => r.filter((row) => row.key !== key));

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700"
      >
        + Nueva oportunidad
      </button>
    );
  }

  return (
    <form
      action={createOpportunity}
      className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <input name="title" placeholder="Título" required className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
        <select name="type" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm">
          <option value="PROYECTO">Proyecto</option>
          <option value="PUESTO">Puesto</option>
          <option value="DESARROLLO">Desarrollo</option>
        </select>
        <input name="description" placeholder="Descripción" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
      </div>

      <div className="rounded-lg border border-zinc-200 p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-700">
            Competencias requeridas
          </span>
          <button type="button" onClick={addRow} className="rounded-lg border border-zinc-300 px-3 py-1 text-xs hover:bg-zinc-50">
            + Agregar requisito
          </button>
        </div>
        {rows.length === 0 && (
          <p className="mt-2 text-xs text-zinc-400">
            Agrega al menos un requisito para poder publicar.
          </p>
        )}
        <div className="mt-2 space-y-2">
          {rows.map((row) => (
            <div key={row.key} className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[2fr_1fr_1fr_1fr_auto]">
              <select
                name="reqCompetencyId"
                value={row.competencyId}
                onChange={(e) => updateRow(row.key, { competencyId: e.target.value })}
                className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm"
              >
                <option value="">Competencia…</option>
                {competencies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <select name="reqLevel" value={row.level} onChange={(e) => updateRow(row.key, { level: e.target.value })} className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm">
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>Nivel {n}</option>
                ))}
              </select>
              <select name="reqWeight" value={row.weight} onChange={(e) => updateRow(row.key, { weight: e.target.value })} className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm">
                {[1, 2, 3].map((n) => (
                  <option key={n} value={n}>Peso {n}</option>
                ))}
              </select>
              <select name="reqMandatory" value={row.mandatory} onChange={(e) => updateRow(row.key, { mandatory: e.target.value })} className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm">
                <option value="no">Opcional</option>
                <option value="si">Obligatoria</option>
              </select>
              <button type="button" onClick={() => removeRow(row.key)} className="text-sm text-red-500 hover:text-red-700">
                Quitar
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button type="submit" className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700">
          Guardar borrador
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50">
          Cancelar
        </button>
      </div>
    </form>
  );
}
