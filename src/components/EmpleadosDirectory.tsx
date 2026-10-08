"use client";

import { useState, useMemo } from "react";
import { setEmployeeStatus, adminResetPassword } from "@/app/actions";
import { CompetencyBadgeTooltip } from "@/components/CompetencyBadgeTooltip";

export type EmployeeWithRelations = {
  id: number;
  userId: number | null;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  departmentId: number;
  positionId: number;
  department: { id: number; name: string };
  position: { id: number; title: string };
  competencies: Array<{
    id: number;
    employeeId: number;
    competencyId: number;
    level: number;
    competency: {
      id: number;
      name: string;
      description: string | null;
      type: string;
    };
  }>;
};

export type DepartmentOption = { id: number; name: string };
export type PositionOption = { id: number; title: string };
export type CompetencyOption = { id: number; name: string; type: string };

function normalizeText(text: string): string {
  return (text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export default function EmpleadosDirectory({
  empleados,
  departments,
  positions,
  competencies,
  puedeGestionar,
}: {
  empleados: EmployeeWithRelations[];
  departments: DepartmentOption[];
  positions: PositionOption[];
  competencies: CompetencyOption[];
  puedeGestionar: boolean;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedPosition, setSelectedPosition] = useState("");
  const [selectedCompetency, setSelectedCompetency] = useState("");

  const filteredEmployees = useMemo(() => {
    return empleados.filter((emp) => {
      // 1. Buscador por nombre (primer nombre, apellidos o nombre completo)
      if (searchQuery.trim()) {
        const q = normalizeText(searchQuery);
        const fullName = normalizeText(`${emp.firstName} ${emp.lastName}`);
        const reverseName = normalizeText(`${emp.lastName} ${emp.firstName}`);
        const email = normalizeText(emp.email);
        if (!fullName.includes(q) && !reverseName.includes(q) && !email.includes(q)) {
          return false;
        }
      }

      // 2. Filtro por departamento
      if (selectedDepartment) {
        if (emp.departmentId !== Number(selectedDepartment)) {
          return false;
        }
      }

      // 3. Filtro por puesto
      if (selectedPosition) {
        if (emp.positionId !== Number(selectedPosition)) {
          return false;
        }
      }

      // 4. Filtro por competencias
      if (selectedCompetency) {
        const targetCompId = Number(selectedCompetency);
        const hasComp = emp.competencies.some((c) => c.competencyId === targetCompId);
        if (!hasComp) {
          return false;
        }
      }

      return true;
    });
  }, [empleados, searchQuery, selectedDepartment, selectedPosition, selectedCompetency]);

  const hasActiveFilters = Boolean(
    searchQuery.trim() || selectedDepartment || selectedPosition || selectedCompetency
  );

  const resetAllFilters = () => {
    setSearchQuery("");
    setSelectedDepartment("");
    setSelectedPosition("");
    setSelectedCompetency("");
  };

  const selectedDeptName = departments.find((d) => d.id === Number(selectedDepartment))?.name;
  const selectedPosName = positions.find((p) => p.id === Number(selectedPosition))?.title;
  const selectedCompName = competencies.find((c) => c.id === Number(selectedCompetency))?.name;

  return (
    <div className="space-y-4">
      {/* Barra de Búsqueda y Filtros */}
      <div className="rounded-2xl border border-zinc-800/80 bg-[#121217] p-4 shadow-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. Buscador por Nombre */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              Buscar por nombre
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nombre o apellido..."
                className="w-full rounded-xl border border-zinc-800 bg-[#161622] pl-3 pr-8 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-[#ad4251] focus:outline-none transition shadow-inner"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 text-zinc-400 hover:text-white text-xs cursor-pointer p-0.5"
                  title="Borrar búsqueda"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* 2. Filtro Departamento */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              Departamento
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-[#161622] px-3 py-2 text-xs text-zinc-100 focus:border-[#ad4251] focus:outline-none transition cursor-pointer"
            >
              <option value="">Todos los departamentos</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Filtro Puesto */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              Puesto
            </label>
            <select
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-[#161622] px-3 py-2 text-xs text-zinc-100 focus:border-[#ad4251] focus:outline-none transition cursor-pointer"
            >
              <option value="">Todos los puestos</option>
              {positions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Filtro Competencias */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              Competencia
            </label>
            <select
              value={selectedCompetency}
              onChange={(e) => setSelectedCompetency(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-[#161622] px-3 py-2 text-xs text-zinc-100 focus:border-[#ad4251] focus:outline-none transition cursor-pointer"
            >
              <option value="">Todas las competencias</option>
              {competencies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type === "TECNICA" ? "Técnica" : "Blanda"})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Resumen de Filtros Activos & Contador */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-zinc-800/80">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-zinc-400">
              Mostrando <strong className="text-white font-bold">{filteredEmployees.length}</strong> de{" "}
              <strong className="text-zinc-300 font-semibold">{empleados.length}</strong> empleados
            </span>

            {/* Chips de filtros activos para remover individualmente */}
            {searchQuery && (
              <span className="inline-flex items-center gap-1 rounded-full bg-zinc-800/80 border border-zinc-700/80 px-2 py-0.5 text-[11px] text-zinc-200">
                <span>Nombre: &ldquo;{searchQuery}&rdquo;</span>
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-zinc-400 hover:text-white ml-0.5 cursor-pointer"
                  title="Quitar filtro de nombre"
                >
                  ✕
                </button>
              </span>
            )}

            {selectedDeptName && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-950/60 border border-red-800/50 px-2 py-0.5 text-[11px] text-red-200">
                <span>{selectedDeptName}</span>
                <button
                  type="button"
                  onClick={() => setSelectedDepartment("")}
                  className="text-red-300 hover:text-white ml-0.5 cursor-pointer"
                  title="Quitar filtro de departamento"
                >
                  ✕
                </button>
              </span>
            )}

            {selectedPosName && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-950/60 border border-red-800/50 px-2 py-0.5 text-[11px] text-red-200">
                <span>{selectedPosName}</span>
                <button
                  type="button"
                  onClick={() => setSelectedPosition("")}
                  className="text-red-300 hover:text-white ml-0.5 cursor-pointer"
                  title="Quitar filtro de puesto"
                >
                  ✕
                </button>
              </span>
            )}

            {selectedCompName && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-950/60 border border-red-800/50 px-2 py-0.5 text-[11px] text-red-200">
                <span>{selectedCompName}</span>
                <button
                  type="button"
                  onClick={() => setSelectedCompetency("")}
                  className="text-red-300 hover:text-white ml-0.5 cursor-pointer"
                  title="Quitar filtro de competencia"
                >
                  ✕
                </button>
              </span>
            )}
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetAllFilters}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-900/60 bg-red-950/40 hover:bg-red-900/60 px-3 py-1 text-xs font-semibold text-red-300 hover:text-white transition cursor-pointer"
            >
              <span>✕</span>
              <span>Limpiar filtros</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabla de Empleados con Filtro Aplicado */}
      <div className="overflow-hidden rounded-2xl border border-zinc-800/80 bg-[#121217] shadow-xl">
        <table className="w-full text-sm">
          <thead className="bg-[#161622] text-left text-xs uppercase text-zinc-400 border-b border-zinc-800/80">
            <tr>
              <th className="px-4 py-3 font-semibold">Nombre</th>
              <th className="px-4 py-3 font-semibold">Correo</th>
              <th className="px-4 py-3 font-semibold">Departamento</th>
              <th className="px-4 py-3 font-semibold">Puesto</th>
              <th className="px-4 py-3 font-semibold">Competencias</th>
              <th className="px-4 py-3 font-semibold">Estado</th>
              {puedeGestionar && <th className="px-4 py-3 font-semibold">Acciones</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/70">
            {filteredEmployees.length === 0 ? (
              <tr>
                <td colSpan={puedeGestionar ? 7 : 6} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-2">
                    <h3 className="text-sm font-bold text-zinc-200">
                      No se encontraron empleados
                    </h3>
                    <p className="text-xs text-zinc-400">
                      No hay colaboradores que coincidan con los criterios de búsqueda y filtros seleccionados.
                    </p>
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={resetAllFilters}
                        className="mt-2 rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-red-700 transition cursor-pointer"
                      >
                        Restablecer filtros
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredEmployees.map((e) => (
                <tr key={e.id} className="hover:bg-[#181824] transition">
                  <td className="px-4 py-3 font-semibold text-zinc-100">
                    {e.firstName} {e.lastName}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{e.email}</td>
                  <td className="px-4 py-3 text-zinc-300">{e.department.name}</td>
                  <td className="px-4 py-3 text-zinc-300">{e.position.title}</td>
                  <td className="px-4 py-3">
                    {e.competencies.length === 0 ? (
                      <span className="inline-flex items-center text-xs italic text-zinc-500">
                        Sin competencias
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {e.competencies.map((ec) => (
                          <CompetencyBadgeTooltip
                            key={ec.competencyId}
                            name={ec.competency.name}
                            level={ec.level}
                            type={ec.competency.type}
                            description={ec.competency.description}
                          />
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        e.status === "ACTIVO"
                          ? "bg-red-950/60 text-rose-200 border border-red-800/50"
                          : "bg-zinc-800 text-zinc-400 border border-zinc-700/60"
                      }`}
                    >
                      {e.status}
                    </span>
                  </td>
                  {puedeGestionar && (
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <form action={setEmployeeStatus}>
                          <input type="hidden" name="employeeId" value={e.id} />
                          <input
                            type="hidden"
                            name="status"
                            value={e.status === "ACTIVO" ? "INACTIVO" : "ACTIVO"}
                          />
                          <button className="text-xs text-zinc-400 hover:text-white underline cursor-pointer text-left transition">
                            {e.status === "ACTIVO" ? "Desactivar" : "Activar"}
                          </button>
                        </form>
                        {e.userId && (
                          <form action={adminResetPassword}>
                            <input type="hidden" name="employeeId" value={e.id} />
                            <button
                              type="submit"
                              title="Restablece la contraseña a Demo1234!"
                              className="text-xs text-red-400 hover:text-red-300 underline cursor-pointer text-left transition"
                            >
                              Restablecer clave
                            </button>
                          </form>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
