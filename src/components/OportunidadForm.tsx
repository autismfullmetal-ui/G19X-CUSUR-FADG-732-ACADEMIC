"use client";

import { useState } from "react";
import { createOpportunity } from "@/app/actions";

type Comp = { id: number; name: string };
type ObjOpt = { id: number; title: string; category?: string; targetPeriod?: string };
type Row = { key: number; level: string; weight: string; mandatory: string; competencyId: string };

let counter = 1;

export default function OportunidadForm({
  competencies,
  objectives = [],
}: {
  competencies: Comp[];
  objectives?: ObjOpt[];
}) {
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
        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 transition cursor-pointer flex items-center gap-1.5"
      >
        <span>+</span>
        <span>Nueva oportunidad</span>
      </button>
    );
  }

  return (
    <form
      action={createOpportunity}
      className="space-y-4 rounded-xl border border-zinc-700/80 bg-[#121217] p-5 shadow-xl text-zinc-100"
    >
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div>
          <h2 className="text-base font-bold text-zinc-100">Crear Nueva Oportunidad / Convocatoria</h2>
          <p className="text-xs text-zinc-400">
            Define los datos de la vacante, fechas de aplicación y alinea con metas organizacionales.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-zinc-400 hover:text-zinc-200 text-lg leading-none cursor-pointer p-1"
          title="Cerrar formulario"
        >
          ✕
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1">Título de la vacante / proyecto *</label>
          <input
            name="title"
            placeholder="Ej. Líder Técnico de Datos"
            required
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-red-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1">Tipo de oportunidad</label>
          <select
            name="type"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-red-500 focus:outline-none"
          >
            <option value="PROYECTO">Proyecto Estratégico</option>
            <option value="PUESTO">Puesto / Vacante Laboral</option>
            <option value="DESARROLLO">Plan de Desarrollo Acelerado</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1">Descripción breve</label>
          <input
            name="description"
            placeholder="Alcance, funciones clave o entregables"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-red-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Enlace con Objetivo Organizacional (RF-007) */}
      <div className="rounded-lg border border-zinc-700 bg-[#181820] p-3 space-y-1">
        <label className="block text-xs font-bold text-zinc-200">
          🎯 Objetivo organizacional estratégico vinculado (Opcional)
        </label>
        <select
          name="objectiveId"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 focus:border-red-500 focus:outline-none"
        >
          <option value="">Ninguno / Convocatoria general independiente</option>
          {objectives.map((obj) => (
            <option key={obj.id} value={obj.id}>
              🎯 {obj.title} {obj.targetPeriod ? `(${obj.targetPeriod})` : ""} {obj.category ? `· [${obj.category}]` : ""}
            </option>
          ))}
        </select>
        <p className="text-[11px] text-zinc-400">
          Permite alinear esta oportunidad con las metas estratégicas de la empresa para que las postulaciones contribuyan al cumplimiento organizacional.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1">Vacantes disponibles</label>
          <input
            name="vacancies"
            type="number"
            min={1}
            defaultValue={1}
            required
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-red-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1">Fecha de apertura</label>
          <input
            name="openDate"
            type="date"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-red-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1">Fecha máxima para aplicar</label>
          <input
            name="deadline"
            type="date"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-red-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="rounded-xl border border-zinc-700/80 bg-[#181820] p-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-bold text-zinc-100">
              Competencias requeridas para la oportunidad
            </span>
            <p className="text-xs text-zinc-400 mt-0.5">
              Se usarán para calcular la compatibilidad % y detectar brechas de desarrollo en cada postulación.
            </p>
          </div>
          <button
            type="button"
            onClick={addRow}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 transition cursor-pointer"
          >
            + Agregar requisito
          </button>
        </div>

        {rows.length === 0 && (
          <p className="mt-2 text-xs text-amber-300 bg-amber-950/40 border border-amber-800/60 rounded-lg p-2.5">
            ⚠️ Agrega al menos un requisito de competencia para poder publicar esta oportunidad.
          </p>
        )}

        <div className="mt-3 space-y-2">
          {rows.map((row) => (
            <div
              key={row.key}
              className="grid grid-cols-1 items-center gap-2 rounded-lg border border-zinc-700/80 bg-[#121217] p-2.5 sm:grid-cols-[2fr_1fr_1fr_1fr_auto]"
            >
              <select
                name="reqCompetencyId"
                value={row.competencyId}
                onChange={(e) => updateRow(row.key, { competencyId: e.target.value })}
                required
                className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-100 focus:border-red-500 focus:outline-none"
              >
                <option value="">-- Seleccionar competencia… --</option>
                {competencies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                name="reqLevel"
                value={row.level}
                onChange={(e) => updateRow(row.key, { level: e.target.value })}
                className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-100 focus:border-red-500 focus:outline-none"
              >
                <option value="1">Nivel 1</option>
                <option value="2">Nivel 2</option>
                <option value="3">Nivel 3</option>
                <option value="4">Nivel 4</option>
                <option value="5">Nivel 5</option>
              </select>

              <select
                name="reqWeight"
                value={row.weight}
                onChange={(e) => updateRow(row.key, { weight: e.target.value })}
                className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-100 focus:border-red-500 focus:outline-none"
              >
                <option value="1">Peso 1 (Bajo)</option>
                <option value="2">Peso 2 (Medio)</option>
                <option value="3">Peso 3 (Alto)</option>
              </select>

              <select
                name="reqMandatory"
                value={row.mandatory}
                onChange={(e) => updateRow(row.key, { mandatory: e.target.value })}
                className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-100 focus:border-red-500 focus:outline-none"
              >
                <option value="no">Deseable</option>
                <option value="si">Obligatoria</option>
              </select>

              <button
                type="button"
                onClick={() => removeRow(row.key)}
                className="text-xs text-red-400 hover:text-red-300 p-1 cursor-pointer"
                title="Quitar requisito"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={rows.length === 0}
          className="rounded-lg bg-red-600 px-5 py-2 text-sm font-bold text-white shadow-sm hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
        >
          Guardar oportunidad
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition cursor-pointer"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
