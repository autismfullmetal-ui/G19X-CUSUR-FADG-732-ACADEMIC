"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import PlanActivityCard, { PlanActivityData } from "@/components/PlanActivityCard";

export type PlanItem = {
  id: number;
  title: string;
  objective: string;
  targetDate: Date | string | null;
  status: string;
  applicationId: number | null;
  employee: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    department?: { name: string } | null;
  };
  application?: {
    id: number;
    opportunity?: {
      id: number;
      title: string;
    } | null;
  } | null;
  activities: PlanActivityData[];
};

function normalizeText(text: string): string {
  return (text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export default function PlanesList({
  planes,
  soyEmpleado,
  puedeGestionar,
  userRole,
}: {
  planes: PlanItem[];
  soyEmpleado: boolean;
  puedeGestionar: boolean;
  userRole?: string;
}) {
  const puedeCalificar = puedeGestionar && userRole !== "RH";
  // Estado para controlar qué planes están expandidos (por defecto todos colapsados)
  const [expandedMap, setExpandedMap] = useState<Record<number, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("TODOS");

  const togglePlan = (id: number) => {
    setExpandedMap((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const expandAll = () => {
    const next: Record<number, boolean> = {};
    for (const p of planes) {
      next[p.id] = true;
    }
    setExpandedMap(next);
  };

  const collapseAll = () => {
    setExpandedMap({});
  };

  const filteredPlanes = useMemo(() => {
    return planes.filter((p) => {
      // Filtro por estado
      if (statusFilter !== "TODOS" && p.status !== statusFilter) {
        return false;
      }

      // Buscador por nombre de colaborador, título del plan u oportunidad
      if (searchQuery.trim()) {
        const q = normalizeText(searchQuery);
        const empName = normalizeText(`${p.employee.firstName} ${p.employee.lastName}`);
        const planTitle = normalizeText(p.title);
        const oppTitle = normalizeText(p.application?.opportunity?.title || "");
        const objective = normalizeText(p.objective);

        if (
          !empName.includes(q) &&
          !planTitle.includes(q) &&
          !oppTitle.includes(q) &&
          !objective.includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [planes, searchQuery, statusFilter]);

  const hasActiveFilters = Boolean(searchQuery.trim() || statusFilter !== "TODOS");

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("TODOS");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETADO":
        return "bg-red-950/80 text-rose-200 border border-red-800/60 shadow-[0_0_8px_rgba(140,37,52,0.25)]";
      case "EN_PROGRESO":
        return "bg-blue-950/60 text-blue-300 border border-blue-800/50";
      case "APROBADO":
        return "bg-red-950/70 text-red-300 border border-red-800/60";
      case "PROPUESTO":
        return "bg-amber-950/60 text-amber-300 border border-amber-800/50";
      default:
        return "bg-zinc-800 text-zinc-400 border border-zinc-700/60";
    }
  };

  return (
    <div className="space-y-4">
      {/* Barra de Filtros y Control de Expansión Global */}
      <div className="rounded-2xl border border-zinc-800/80 bg-[#121217] p-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Buscador de planes */}
          <div className="flex-1 min-w-[240px] max-w-md relative flex items-center">
            <span className="absolute left-3 text-zinc-500 pointer-events-none text-xs">
              🔍
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por colaborador, título u oportunidad..."
              className="w-full rounded-xl border border-zinc-800 bg-[#161622] pl-8 pr-8 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-[#ad4251] focus:outline-none transition shadow-inner"
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

          {/* Filtro por estado y botones expandir/colapsar */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-zinc-800 bg-[#161622] px-3 py-2 text-xs text-zinc-100 focus:border-[#ad4251] focus:outline-none transition cursor-pointer"
            >
              <option value="TODOS">Todos los estados</option>
              <option value="EN_PROGRESO">⚡ En progreso</option>
              <option value="APROBADO">📝 Aprobado</option>
              <option value="COMPLETADO">✓ Completado</option>
              <option value="PROPUESTO">📋 Propuesto</option>
            </select>

            <button
              type="button"
              onClick={expandAll}
              className="rounded-xl border border-zinc-800 bg-[#161622] hover:bg-zinc-800/80 px-2.5 py-2 text-xs font-medium text-zinc-300 hover:text-white transition cursor-pointer flex items-center gap-1"
              title="Expandir todas las actividades"
            >
              <span>▼</span>
              <span className="hidden sm:inline">Expandir todo</span>
            </button>

            <button
              type="button"
              onClick={collapseAll}
              className="rounded-xl border border-zinc-800 bg-[#161622] hover:bg-zinc-800/80 px-2.5 py-2 text-xs font-medium text-zinc-300 hover:text-white transition cursor-pointer flex items-center gap-1"
              title="Colapsar todas las actividades"
            >
              <span>▲</span>
              <span className="hidden sm:inline">Colapsar todo</span>
            </button>
          </div>
        </div>

        {/* Resumen de resultados */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-zinc-800/60 text-xs text-zinc-400">
          <span>
            Mostrando <strong className="text-zinc-100 font-bold">{filteredPlanes.length}</strong> de{" "}
            <strong>{planes.length}</strong> planes en total
          </span>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-red-300 hover:text-white underline text-xs cursor-pointer"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Lista de Tarjetas de Planes (Colapsables) */}
      <div className="space-y-4">
        {filteredPlanes.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800/80 bg-[#121217] p-10 text-center shadow-xl">
            <span className="text-3xl mb-2 block">📋</span>
            <h3 className="text-sm font-bold text-zinc-200">No se encontraron planes</h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
              No hay planes de desarrollo que coincidan con los filtros de búsqueda aplicados.
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="mt-3 rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-red-700 transition cursor-pointer"
              >
                Restablecer filtros
              </button>
            )}
          </div>
        ) : (
          filteredPlanes.map((p) => {
            const isExpanded = Boolean(expandedMap[p.id]);
            const completedCount = p.activities.filter((a) => a.status === "COMPLETADA").length;
            const submittedCount = p.activities.filter((a) => a.status === "ENTREGADA").length;
            const inProgressCount = p.activities.filter((a) => a.status === "EN_PROGRESO").length;
            const pendingCount = p.activities.filter((a) => a.status === "PENDIENTE").length;
            const totalCount = p.activities.length;
            const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

            const initials = `${p.employee.firstName?.[0] || ""}${p.employee.lastName?.[0] || ""}`.toUpperCase();

            return (
              <div
                key={p.id}
                className="rounded-2xl border border-zinc-800/80 bg-[#121217] shadow-xl transition-all hover:border-zinc-700/80 overflow-hidden"
              >
                {/* Resumen Ejecutivo del Plan (Siempre Visible) */}
                <div className="p-5 sm:p-6 space-y-4">
                  {/* Fila 1: Título, Colaborador, Oportunidad y Estado */}
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base sm:text-lg font-bold text-zinc-100 tracking-tight">
                          {p.title}
                        </h2>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${getStatusBadge(
                            p.status
                          )}`}
                        >
                          {p.status}
                        </span>
                      </div>

                      {/* Colaborador & Oportunidad */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                        <span className="inline-flex items-center gap-1.5 font-medium text-zinc-200">
                          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-zinc-800 border border-zinc-700 text-[10px] font-bold text-white">
                            {initials || "U"}
                          </span>
                          <span>
                            {p.employee.firstName} {p.employee.lastName}
                          </span>
                        </span>

                        {p.employee.department && (
                          <span className="text-zinc-500">
                            · 🏢 {p.employee.department.name}
                          </span>
                        )}

                        {p.application?.opportunity && (
                          <>
                            <span className="text-zinc-600">·</span>
                            <span className="text-zinc-300">
                              💼 Oportunidad:{" "}
                              <strong className="text-zinc-100 font-semibold">
                                {p.application.opportunity.title}
                              </strong>
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Fecha Objetivo */}
                    {p.targetDate && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-zinc-900 border border-zinc-800 px-3 py-1 text-xs text-zinc-300 shrink-0">
                        <span>📅 Meta:</span>
                        <strong className="text-zinc-100 font-semibold">
                          {new Date(p.targetDate).toLocaleDateString("es-MX", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </strong>
                      </span>
                    )}
                  </div>

                  {/* Fila 2: Objetivo del Plan */}
                  <div className="rounded-xl border border-zinc-800/60 bg-[#161622]/80 p-3 text-xs text-zinc-300">
                    <strong className="text-zinc-400 block uppercase text-[10px] font-bold tracking-wider mb-0.5">
                      🎯 Objetivo del Plan:
                    </strong>
                    <p className="line-clamp-2 leading-relaxed">{p.objective}</p>
                  </div>

                  {/* Fila 3: Barra de Progreso y Métricas Rápidas */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
                      <span className="font-medium text-zinc-300">Progreso de actividades</span>
                      <span className="font-bold text-zinc-100">
                        {completedCount} de {totalCount} completadas ({percent}%)
                      </span>
                    </div>

                    {/* Barra de progreso con gradiente carmesí/vino */}
                    <div className="w-full bg-[#181824] rounded-full h-2.5 overflow-hidden border border-zinc-800/80">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          percent === 100
                            ? "bg-gradient-to-r from-red-700 via-rose-600 to-red-500 shadow-[0_0_10px_rgba(173,66,81,0.5)]"
                            : "bg-gradient-to-r from-red-900 via-red-700 to-rose-600 shadow-[0_0_8px_rgba(140,37,52,0.35)]"
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    {/* Pastillas de desglose rápido de estados */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                      {completedCount > 0 && (
                        <span className="rounded-md bg-red-950/60 border border-red-800/50 px-2 py-0.5 text-rose-200 font-medium">
                          ✓ {completedCount} completada{completedCount > 1 ? "s" : ""}
                        </span>
                      )}
                      {submittedCount > 0 && (
                        <span className="rounded-md bg-red-950/60 border border-red-800/50 px-2 py-0.5 text-red-200 font-medium">
                          📦 {submittedCount} en revisión
                        </span>
                      )}
                      {inProgressCount > 0 && (
                        <span className="rounded-md bg-blue-950/50 border border-blue-800/40 px-2 py-0.5 text-blue-300 font-medium">
                          ⚡ {inProgressCount} en progreso
                        </span>
                      )}
                      {pendingCount > 0 && (
                        <span className="rounded-md bg-zinc-800/60 border border-zinc-700/50 px-2 py-0.5 text-zinc-400 font-medium">
                          ⏳ {pendingCount} pendiente{pendingCount > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Aviso de Plan 100% Completado y Próximo Paso */}
                  {percent === 100 && (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-900/60 bg-gradient-to-r from-red-950/40 via-[#181116] to-[#121118] p-3 text-xs text-rose-200 shadow-sm">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-800 text-white font-bold text-[10px]">
                          ✓
                        </span>
                        <div>
                          <strong className="text-rose-100 font-semibold block">Plan completado al 100%</strong>
                          <span className="text-zinc-400 text-[11px]">
                            Todas las actividades aprobadas. Siguiente paso: Registrar la Evaluación Post-Capacitación para cerrar brechas.
                          </span>
                        </div>
                      </div>
                      {puedeGestionar && (
                        <Link
                          href={`/evaluaciones?empleado=${p.employee.id}&tipo=POST_CAPACITACION${
                            p.applicationId ? `&returnTo=/postulaciones/${p.applicationId}` : ""
                          }`}
                          className="rounded-lg bg-red-700 hover:bg-red-600 px-3 py-1.5 text-xs font-bold text-white transition cursor-pointer shrink-0"
                        >
                          Evaluar Post-Capacitación →
                        </Link>
                      )}
                    </div>
                  )}

                  {/* Fila 4: Pestaña / Botón Desplegable para ver fases y retroalimentación */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => togglePlan(p.id)}
                      className={`w-full flex items-center justify-between rounded-xl px-4 py-2.5 text-xs font-semibold transition cursor-pointer border ${
                        isExpanded
                          ? "bg-red-950/50 border-red-800/60 text-white shadow-[inset_0_0_12px_rgba(140,37,52,0.15)]"
                          : "bg-[#161622] border-zinc-800 text-zinc-300 hover:text-white hover:bg-[#1a1a28] hover:border-zinc-700"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>📑</span>
                        <span>
                          {isExpanded
                            ? "Ocultar fases y retroalimentación"
                            : `Ver fases, entregables y retroalimentación (${totalCount} actividad${
                                totalCount === 1 ? "" : "es"
                              })`}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-red-400 flex items-center gap-1">
                        <span>{isExpanded ? "▲ Colapsar" : "▼ Desplegar"}</span>
                      </span>
                    </button>
                  </div>
                </div>

                {/* Sección Desplegable con Fases, Actividades, Entregables y Retroalimentación */}
                {isExpanded && (
                  <div className="border-t border-zinc-800/80 bg-[#0e0e14] p-5 sm:p-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Hito de Reevaluación si el plan está finalizando */}
                    {percent >= 75 && (
                      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-900/60 bg-gradient-to-r from-red-950/40 via-[#181016] to-[#121217] p-3.5 text-xs text-rose-200 shadow-[0_0_15px_rgba(140,37,52,0.12)]">
                        <div>
                          <strong className="text-rose-200 font-bold block mb-0.5">
                            🎯 Hito de Reevaluación Disponible:
                          </strong>
                          <p className="text-zinc-300 leading-relaxed">
                            El plan tiene un avance del {percent}%. El supervisor puede registrar la
                            evaluación Post-Capacitación para verificar la superación de las brechas de competencias.
                          </p>
                        </div>
                        {puedeGestionar && (
                          <Link
                            href={`/evaluaciones?empleado=${p.employee.id}&tipo=POST_CAPACITACION${
                              p.applicationId ? `&returnTo=/postulaciones/${p.applicationId}` : ""
                            }`}
                            className="rounded-xl bg-gradient-to-r from-[#8c2534] to-[#ad4251] hover:from-[#9d2c3c] hover:to-[#be4b5b] border border-red-700/60 px-3.5 py-1.5 text-xs font-bold text-white transition shadow-[0_0_10px_rgba(140,37,52,0.3)] shrink-0"
                          >
                            Realizar Evaluación →
                          </Link>
                        )}
                      </div>
                    )}

                    {/* Título de la sección de actividades */}
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500 shadow-[0_0_6px_rgba(173,66,81,0.6)]" />
                        <span>Fases, Actividades y Entregables ({totalCount})</span>
                      </h3>
                      <span className="text-[11px] text-zinc-500 font-medium">
                        Calificaciones y evidencias
                      </span>
                    </div>

                    {/* Lista interactiva de tarjetas de actividades */}
                    <div className="space-y-3">
                      {p.activities.map((a) => (
                        <PlanActivityCard
                          key={a.id}
                          activity={a}
                          planStatus={p.status}
                          isEmployee={soyEmpleado}
                          canManage={puedeGestionar}
                          canEvaluate={puedeCalificar}
                          userRole={userRole}
                        />
                      ))}
                    </div>

                    {/* Pie de detalles desplegados */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-800/80">
                      {p.applicationId ? (
                        <Link
                          href={`/postulaciones/${p.applicationId}`}
                          className="text-xs font-medium text-red-300 hover:text-white underline transition"
                        >
                          Ver análisis de brechas y postulación vinculada →
                        </Link>
                      ) : (
                        <span />
                      )}

                      <button
                        type="button"
                        onClick={() => togglePlan(p.id)}
                        className="text-xs font-medium text-zinc-400 hover:text-white transition cursor-pointer flex items-center gap-1"
                      >
                        <span>▲ Colapsar detalle</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
