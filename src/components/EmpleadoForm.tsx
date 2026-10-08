"use client";

import { useState } from "react";
import { createEmployee } from "@/app/actions";

type Opt = { id: number; name: string };
type Pos = { id: number; title: string };
type Sup = { id: number; firstName: string; lastName: string };
type Comp = { id: number; name: string; type?: string; description?: string };

type CompRow = {
  key: number;
  competencyId: string;
  level: string;
};

let counter = 1;

export default function EmpleadoForm({
  departments,
  positions,
  supervisors,
  competencies = [],
}: {
  departments: Opt[];
  positions: Pos[];
  supervisors: Sup[];
  competencies?: Comp[];
}) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<CompRow[]>([]);
  
  // Estado para el selector directo: el usuario elige EXACTAMENTE cuál agregar
  const [compToAdd, setCompToAdd] = useState<string>("");
  const [levelToAdd, setLevelToAdd] = useState<string>("3");

  const selectedCompIds = new Set(
    rows.map((r) => r.competencyId).filter(Boolean)
  );

  // Competencias que aún no han sido agregadas
  const availableCompetencies = competencies.filter(
    (c) => !selectedCompIds.has(c.id.toString())
  );

  // Agregar la competencia seleccionada específicamente por el usuario
  const handleAddSelected = () => {
    if (!compToAdd) return;
    setRows((curr) => [
      ...curr,
      {
        key: counter++,
        competencyId: compToAdd,
        level: levelToAdd,
      },
    ]);
    setCompToAdd(""); // Resetear selector
  };

  // Agregar una competencia específica directamente desde un chip
  const handleAddDirect = (compId: number) => {
    setRows((curr) => [
      ...curr,
      {
        key: counter++,
        competencyId: compId.toString(),
        level: "3",
      },
    ]);
  };

  // Agregar una fila vacía para que el usuario elija en la tabla
  const addBlankRow = () => {
    setRows((curr) => [
      ...curr,
      {
        key: counter++,
        competencyId: "", // Vacía: NO auto-selecciona Comunicación ni ninguna otra
        level: "3",
      },
    ]);
  };

  const addAllCompetencies = () => {
    setRows(
      competencies.map((c) => ({
        key: counter++,
        competencyId: c.id.toString(),
        level: "3",
      }))
    );
  };

  const updateRow = (key: number, patch: Partial<CompRow>) => {
    setRows((curr) =>
      curr.map((r) => (r.key === key ? { ...r, ...patch } : r))
    );
  };

  const removeRow = (key: number) => {
    setRows((curr) => curr.filter((r) => r.key !== key));
  };

  const clearRows = () => {
    setRows([]);
    setCompToAdd("");
  };

  const handleClose = () => {
    setOpen(false);
    setRows([]);
    setCompToAdd("");
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 transition cursor-pointer flex items-center gap-1.5"
      >
        <span>+</span>
        <span>Nuevo empleado</span>
      </button>
    );
  }

  return (
    <form
      action={createEmployee}
      className="space-y-4 rounded-xl border border-zinc-700/80 bg-[#121217] p-6 shadow-xl text-zinc-100"
    >
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div>
          <h2 className="text-base font-bold text-zinc-100">Registrar nuevo empleado</h2>
          <p className="text-xs text-zinc-400">
            Completa la información laboral y selecciona las competencias que desees asignarle.
          </p>
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="text-zinc-400 hover:text-zinc-200 text-lg leading-none cursor-pointer p-1"
          title="Cerrar formulario"
        >
          ✕
        </button>
      </div>

      {/* Datos Personales y Puesto */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-300">Nombre *</label>
          <input
            name="firstName"
            placeholder="Ej. Juan"
            required
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900/90 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500/40"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-300">Apellidos *</label>
          <input
            name="lastName"
            placeholder="Ej. Pérez Gómez"
            required
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900/90 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500/40"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-zinc-300">Correo corporativo *</label>
          <input
            name="email"
            type="email"
            placeholder="correo@empresa.com"
            required
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900/90 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500/40"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-300">Departamento *</label>
          <select
            name="departmentId"
            required
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900/90 px-3 py-2 text-sm text-zinc-100 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500/40"
          >
            <option value="">Seleccionar departamento…</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-300">Puesto *</label>
          <select
            name="positionId"
            required
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900/90 px-3 py-2 text-sm text-zinc-100 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500/40"
          >
            <option value="">Seleccionar puesto…</option>
            {positions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-zinc-300">Supervisor directo (opcional)</label>
          <select
            name="supervisorId"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900/90 px-3 py-2 text-sm text-zinc-100 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500/40"
          >
            <option value="">Sin supervisor asignado</option>
            {supervisors.map((s) => (
              <option key={s.id} value={s.id}>
                {s.firstName} {s.lastName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Sección Competencias Iniciales con Selector Preciso */}
      <div className="rounded-xl border border-zinc-700/80 bg-[#181820] p-4 space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-zinc-100">
                Competencias iniciales del colaborador
              </span>
              <span className="rounded-full bg-red-950/80 border border-red-800/60 px-2 py-0.5 text-[11px] font-bold text-red-300">
                {rows.length} {rows.length === 1 ? "asignada" : "asignadas"}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Elige exactamente qué competencia deseas agregar con su nivel de dominio inicial (1 a 5).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {competencies.length > 0 && rows.length < competencies.length && (
              <button
                type="button"
                onClick={addAllCompetencies}
                className="rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-300 hover:bg-zinc-700 transition cursor-pointer"
              >
                Cargar todas ({competencies.length})
              </button>
            )}
            {rows.length > 0 && (
              <button
                type="button"
                onClick={clearRows}
                className="rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition cursor-pointer"
              >
                Limpiar lista
              </button>
            )}
          </div>
        </div>

        {/* Panel de Selección Específica: El usuario elige exactamente qué competencia agregar */}
        {competencies.length > 0 && (
          <div className="rounded-lg border border-zinc-700 bg-[#121217] p-3 space-y-2">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Selecciona la competencia que deseas agregar:
            </span>
            <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
              <div className="flex-1">
                <select
                  value={compToAdd}
                  onChange={(e) => setCompToAdd(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500/40"
                >
                  <option value="">-- Elige qué competencia deseas agregar --</option>
                  {competencies.map((c) => {
                    const isAlreadyAdded = selectedCompIds.has(c.id.toString());
                    return (
                      <option
                        key={c.id}
                        value={c.id}
                        disabled={isAlreadyAdded}
                      >
                        {c.name} {c.type ? `(${c.type === "TECNICA" ? "Técnica" : "Blanda"})` : ""} {isAlreadyAdded ? "— (ya agregada)" : ""}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="w-full sm:w-48">
                <select
                  value={levelToAdd}
                  onChange={(e) => setLevelToAdd(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500/40"
                >
                  <option value="1">Nivel 1 - Básico</option>
                  <option value="2">Nivel 2 - En desarrollo</option>
                  <option value="3">Nivel 3 - Competente</option>
                  <option value="4">Nivel 4 - Avanzado</option>
                  <option value="5">Nivel 5 - Experto</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleAddSelected}
                disabled={!compToAdd}
                className="rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shrink-0"
              >
                + Agregar seleccionada
              </button>
            </div>

            {/* Chips rápidos de competencias disponibles para agregarlas con un clic */}
            {availableCompetencies.length > 0 && (
              <div className="pt-2 border-t border-zinc-800/80">
                <span className="text-[10px] text-zinc-400 font-medium block mb-1.5">
                  O haz clic directo en la que necesites:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {availableCompetencies.map((c) => {
                    const isTech = (c.type || "").toUpperCase() === "TECNICA";
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleAddDirect(c.id)}
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium transition cursor-pointer ${
                          isTech
                            ? "bg-cyan-950/60 text-cyan-300 border border-cyan-800/50 hover:bg-cyan-900/60"
                            : "bg-purple-950/60 text-purple-300 border border-purple-800/50 hover:bg-purple-900/60"
                        }`}
                        title={`Hacer clic para agregar ${c.name}`}
                      >
                        <span>+</span>
                        <span>{c.name}</span>
                        <span className="text-[9px] opacity-70">
                          ({isTech ? "Téc" : "Blanda"})
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Lista de Competencias Asignadas */}
        {competencies.length === 0 ? (
          <p className="mt-2 text-xs text-amber-300 bg-amber-950/40 border border-amber-800/60 rounded-lg p-3">
            No hay competencias activas en el catálogo. Puedes darlas de alta en la sección de Competencias.
          </p>
        ) : rows.length === 0 ? (
          <div className="mt-2 rounded-lg border border-dashed border-zinc-700 p-4 text-center">
            <p className="text-xs text-zinc-400">
              No has asignado competencias aún. Usa el selector arriba para elegir exactamente las que requiera este empleado, o haz clic en los chips rápidos.
            </p>
          </div>
        ) : (
          <div className="mt-2 space-y-2 max-h-72 overflow-y-auto pr-1">
            <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1 font-semibold uppercase tracking-wider">
              <span>Competencia Asignada</span>
              <span className="text-right">Nivel (1 a 5)</span>
            </div>

            {rows.map((row) => {
              const currentComp = competencies.find((c) => c.id.toString() === row.competencyId);
              const isTech = currentComp?.type === "TECNICA";

              return (
                <div
                  key={row.key}
                  className="grid grid-cols-1 items-center gap-2 rounded-lg border border-zinc-700/80 bg-[#121217] p-2.5 shadow-xs sm:grid-cols-[1fr_180px_auto]"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <select
                      name="empCompetencyId"
                      value={row.competencyId}
                      required
                      onChange={(e) => updateRow(row.key, { competencyId: e.target.value })}
                      className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-100 focus:border-red-500 focus:outline-none"
                    >
                      <option value="">-- Seleccionar competencia… --</option>
                      {competencies.map((c) => {
                        const isSelectedOther =
                          selectedCompIds.has(c.id.toString()) &&
                          c.id.toString() !== row.competencyId;
                        return (
                          <option
                            key={c.id}
                            value={c.id}
                            disabled={isSelectedOther}
                          >
                            {c.name} {c.type ? `(${c.type === "TECNICA" ? "Técnica" : "Blanda"})` : ""} {isSelectedOther ? "— ya agregada" : ""}
                          </option>
                        );
                      })}
                    </select>

                    {currentComp && (
                      <span
                        className={`hidden sm:inline-block shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                          isTech
                            ? "bg-cyan-950/80 text-cyan-300 border border-cyan-800/60"
                            : "bg-purple-950/80 text-purple-300 border border-purple-800/60"
                        }`}
                      >
                        {isTech ? "Técnica" : "Blanda"}
                      </span>
                    )}
                  </div>

                  <div>
                    <select
                      name="empLevel"
                      value={row.level}
                      onChange={(e) => updateRow(row.key, { level: e.target.value })}
                      className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-100 focus:border-red-500 focus:outline-none font-medium"
                    >
                      <option value="1">Nivel 1 - Básico</option>
                      <option value="2">Nivel 2 - En desarrollo</option>
                      <option value="3">Nivel 3 - Competente</option>
                      <option value="4">Nivel 4 - Avanzado</option>
                      <option value="5">Nivel 5 - Experto</option>
                    </select>
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={() => removeRow(row.key)}
                      className="rounded p-1 text-xs text-red-400 hover:bg-red-950/50 hover:text-red-300 transition cursor-pointer"
                      title="Quitar de la lista"
                    >
                      ✕ Quitar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-lg bg-zinc-900/60 p-3 text-xs text-zinc-400 border border-zinc-800">
        Se creará acceso al sistema con la contraseña temporal <strong>Demo1234!</strong> y rol <strong>Empleado</strong>.
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          className="rounded-lg bg-red-600 px-5 py-2 text-sm font-bold text-white shadow-sm hover:bg-red-700 transition cursor-pointer"
        >
          Guardar empleado
        </button>
        <button
          type="button"
          onClick={handleClose}
          className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition cursor-pointer"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
