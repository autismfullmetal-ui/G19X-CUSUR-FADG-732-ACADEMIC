"use client";

import { useState } from "react";
import { createObjective } from "@/app/actions";
import PeriodDateRangePicker from "@/components/PeriodDateRangePicker";

type Department = { id: number; name: string };

const CATEGORIES = [
  { value: "ESTRATEGICO", label: "Estratégico" },
  { value: "INNOVACION", label: "Innovación y Tecnología" },
  { value: "CALIDAD", label: "Calidad y Excelencia" },
  { value: "OPERATIVO", label: "Operativo y Eficiencia" },
];

export default function ObjetivoForm({
  departments,
}: {
  departments: Department[];
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-xl bg-gradient-to-r from-[#8c2534] to-[#ad4251] hover:from-[#9d2c3c] hover:to-[#be4b5b] border border-red-700/60 px-4 py-2 text-xs font-semibold text-white shadow-xs transition flex items-center gap-2 cursor-pointer"
      >
        <span>+</span>
        <span>Nuevo Objetivo Estratégico</span>
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-[#121217] p-5 sm:p-6 shadow-2xl animate-in fade-in duration-200">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 mb-4">
        <div>
          <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
            <span>Definir Nuevo Objetivo Organizacional</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Establece metas medibles que orienten los planes de desarrollo y la evaluación de desempeño.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-zinc-400 hover:text-white text-xs px-2.5 py-1 rounded-xl border border-zinc-800 bg-[#161622] hover:bg-zinc-800 transition cursor-pointer"
        >
          Cerrar ✕
        </button>
      </div>

      <form action={createObjective} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Título del Objetivo *
            </label>
            <input
              name="title"
              required
              placeholder="Ej. Aumentar la cobertura de pruebas unitarias al 85%"
              className="w-full rounded-xl border border-zinc-800 bg-[#161622] px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-[#ad4251] focus:outline-none transition shadow-inner"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Descripción y Alcance (Opcional)
            </label>
            <textarea
              name="description"
              rows={2}
              placeholder="Detalla los criterios de éxito, metodologías esperadas o impacto organizacional..."
              className="w-full rounded-xl border border-zinc-800 bg-[#161622] px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-[#ad4251] focus:outline-none resize-none transition shadow-inner"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Categoría Estratégica
            </label>
            <select
              name="category"
              defaultValue="ESTRATEGICO"
              className="w-full rounded-xl border border-zinc-800 bg-[#161622] px-3 py-2 text-xs text-zinc-100 focus:border-[#ad4251] focus:outline-none transition cursor-pointer"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Selector de Período con Calendario de Rango */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Período de Evaluación *
            </label>
            <PeriodDateRangePicker
              name="targetPeriod"
              initialStart="2026-01-01"
              initialEnd="2026-12-31"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Meta Cuantitativa *
              </label>
              <input
                type="number"
                step="any"
                name="targetValue"
                defaultValue="100"
                required
                className="w-full rounded-xl border border-zinc-800 bg-[#161622] px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-[#ad4251] focus:outline-none transition shadow-inner"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Unidad
              </label>
              <input
                name="unit"
                defaultValue="%"
                placeholder="%, pts, proy..."
                className="w-full rounded-xl border border-zinc-800 bg-[#161622] px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-[#ad4251] focus:outline-none transition shadow-inner"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Ponderación / Peso
              </label>
              <select
                name="weight"
                defaultValue="2"
                className="w-full rounded-xl border border-zinc-800 bg-[#161622] px-3 py-2 text-xs text-zinc-100 focus:border-[#ad4251] focus:outline-none transition cursor-pointer"
              >
                <option value="1">1 - Baja relevancia</option>
                <option value="2">2 - Relevancia estándar</option>
                <option value="3">3 - Alta prioridad</option>
                <option value="4">4 - Crítica / Estratégica</option>
                <option value="5">5 - Máxima prioridad</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Ámbito / Departamento
              </label>
              <select
                name="departmentId"
                defaultValue="todos"
                className="w-full rounded-xl border border-zinc-800 bg-[#161622] px-3 py-2 text-xs text-zinc-100 focus:border-[#ad4251] focus:outline-none transition cursor-pointer"
              >
                <option value="todos">Toda la organización (Global)</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-800/80">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-xl border border-zinc-700/80 bg-zinc-800/80 px-4 py-2 text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-700 transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="rounded-xl bg-gradient-to-r from-[#8c2534] to-[#ad4251] hover:from-[#9d2c3c] hover:to-[#be4b5b] border border-red-700/60 px-5 py-2 text-xs font-semibold text-white shadow-xs transition cursor-pointer"
          >
            Guardar Objetivo
          </button>
        </div>
      </form>
    </div>
  );
}
