"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

type SupervisorDashboardProps = {
  userName: string;
  teamMetrics: {
    totalTeamMembers: number;
    pendingReviewsCount: number;
    teamAvgPlanProgress: number;
    teamGapsSuperadas: number;
    teamGapsAbiertas: number;
  };
  teamMembers: {
    id: number;
    name: string;
    position: string;
    department: string;
    activePlanTitle: string | null;
    planProgress: number;
    competenciesCount: number;
  }[];
  pendingDeliverables: {
    activityId: number;
    activityTitle: string;
    employeeName: string;
    planTitle: string;
    deliverable: string | null;
    evidenceUrl: string | null;
    submittedAt: string;
  }[];
  gapDistributionData: { name: string; value: number; color: string }[];
};

export default function SupervisorDashboard({
  userName,
  teamMetrics,
  teamMembers,
  pendingDeliverables,
  gapDistributionData,
}: SupervisorDashboardProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const progressChartData = teamMembers.map((m) => ({
    name: m.name.split(" ")[0] || m.name,
    progreso: m.planProgress,
  }));

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
              Panel del Supervisor
            </h1>
            <span className="rounded-full bg-blue-600 px-2.5 py-0.5 text-xs font-semibold text-white">
              Supervisor de Equipo
            </span>
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            Seguimiento de desarrollo, revisión de entregables y avance formativo de tu equipo directo.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/evaluaciones"
            className="rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-white hover:bg-zinc-800 transition shadow-xs"
          >
            + Nueva Evaluación
          </Link>
          <Link
            href="/planes"
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition shadow-xs"
          >
            Supervisar Planes
          </Link>
        </div>
      </div>

      {/* Tarjetas KPI del Supervisor */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1: Mi Equipo */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
            <span>Equipo a Cargo</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-zinc-900">
              {teamMetrics.totalTeamMembers}
            </span>
            <span className="text-xs text-zinc-500">colaboradores</span>
          </div>
          <p className="mt-3 text-[11px] text-zinc-400">
            Bajo tu supervisión directa en la estructura organizacional.
          </p>
        </div>

        {/* KPI 2: Entregables por Calificar */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
            <span>Entregables por Revisar</span>
            {teamMetrics.pendingReviewsCount > 0 && (
              <span className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
            )}
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-3xl font-bold ${
              teamMetrics.pendingReviewsCount > 0 ? "text-purple-600" : "text-zinc-900"
            }`}>
              {teamMetrics.pendingReviewsCount}
            </span>
            <span className="text-xs text-zinc-500">pendientes</span>
          </div>
          <p className="mt-3 text-[11px] text-zinc-400">
            {teamMetrics.pendingReviewsCount > 0
              ? "Requieren tu evaluación y retroalimentación formal."
              : "Estás al día con las revisiones de tu equipo."}
          </p>
        </div>

        {/* KPI 3: Avance Promedio de Planes */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
            <span>Avance Promedio del Equipo</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-emerald-600">
              {teamMetrics.teamAvgPlanProgress}%
            </span>
            <span className="text-xs text-zinc-500">completado</span>
          </div>
          <div className="mt-3 w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(teamMetrics.teamAvgPlanProgress, 100)}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-zinc-400">
            Progreso consolidado de todas las actividades activas del equipo.
          </p>
        </div>

        {/* KPI 4: Brechas Superadas */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
            <span>Brechas Superadas en Equipo</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-zinc-900">
              {teamMetrics.teamGapsSuperadas}
            </span>
            <span className="text-xs text-zinc-500">
              de {teamMetrics.teamGapsSuperadas + teamMetrics.teamGapsAbiertas}
            </span>
          </div>
          <p className="mt-3 text-[11px] text-zinc-400">
            {teamMetrics.teamGapsAbiertas} brechas aún abiertas en desarrollo.
          </p>
        </div>
      </div>

      {/* Bandeja Urgente: Entregables Pendientes de Revisión */}
      {pendingDeliverables.length > 0 && (
        <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-600 text-white text-xs font-bold">
                !
              </span>
              <h2 className="text-sm font-bold text-purple-950">
                Entregables de tu equipo esperando revisión ({pendingDeliverables.length})
              </h2>
            </div>
            <Link
              href="/planes"
              className="text-xs font-semibold text-purple-700 hover:text-purple-900 underline"
            >
              Revisar en Planes →
            </Link>
          </div>

          <div className="space-y-2">
            {pendingDeliverables.map((item) => (
              <div
                key={item.activityId}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-purple-100 bg-white p-3.5 shadow-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-zinc-900">
                      {item.employeeName}
                    </span>
                    <span className="text-[11px] text-zinc-400">• {item.planTitle}</span>
                  </div>
                  <p className="text-xs text-zinc-700 mt-0.5 font-medium">
                    Actividad: {item.activityTitle}
                  </p>
                  {item.deliverable && (
                    <p className="text-xs text-zinc-500 mt-1 italic line-clamp-1">
                      &quot;{item.deliverable}&quot;
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {item.evidenceUrl && (
                    <a
                      href={item.evidenceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 transition"
                    >
                      Ver evidencia
                    </a>
                  )}
                  <Link
                    href="/planes"
                    className="rounded-lg bg-purple-700 px-3 py-1 text-xs font-semibold text-white hover:bg-purple-800 transition"
                  >
                    Calificar entrega
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gráficas de Equipo */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Gráfica 1: Progreso por Colaborador */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-zinc-900">
                Progreso de Planes por Colaborador
              </h2>
              <p className="text-xs text-zinc-500">
                % de avance en las actividades formativas de cada miembro.
              </p>
            </div>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
              % Avance
            </span>
          </div>

          <div className="h-64 w-full">
            {mounted && progressChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={progressChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#71717a" }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#71717a" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#18181b",
                      border: "none",
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                    formatter={(val) => [`${val}%`, "Avance"]}
                  />
                  <Bar dataKey="progreso" name="Progreso" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-zinc-400">
                No hay planes asignados al equipo actualmente.
              </div>
            )}
          </div>
        </div>

        {/* Gráfica 2: Estado de Brechas del Equipo */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-zinc-900">
                Cierre de Brechas del Equipo
              </h2>
              <p className="text-xs text-zinc-500">
                Proporción de brechas superadas tras capacitación vs pendientes.
              </p>
            </div>
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
              Brechas
            </span>
          </div>

          <div className="h-64 w-full">
            {mounted && gapDistributionData.some((d) => d.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={gapDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    nameKey="name"
                  >
                    {gapDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#18181b",
                      border: "none",
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    formatter={(value) => <span className="text-xs text-zinc-600">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-zinc-400">
                Tu equipo no tiene brechas registradas actualmente.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Directorio de Colaboradores Supervisados */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">
              Colaboradores a tu Cargo
            </h2>
            <p className="text-xs text-zinc-500">
              Equipo directo para evaluaciones periódicas y desarrollo.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          {teamMembers.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-400">
              No tienes colaboradores asignados como subordinados directos.
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-zinc-100 text-left uppercase text-zinc-400 font-semibold">
                  <th className="pb-2">Colaborador</th>
                  <th className="pb-2">Puesto</th>
                  <th className="pb-2">Departamento</th>
                  <th className="pb-2">Plan Activo</th>
                  <th className="pb-2">Avance</th>
                  <th className="pb-2 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {teamMembers.map((m) => (
                  <tr key={m.id} className="hover:bg-zinc-50/50 transition">
                    <td className="py-3 font-medium text-zinc-900">{m.name}</td>
                    <td className="py-3 text-zinc-600">{m.position}</td>
                    <td className="py-3 text-zinc-600">{m.department}</td>
                    <td className="py-3">
                      {m.activePlanTitle ? (
                        <span className="text-zinc-800 font-medium truncate max-w-[150px] inline-block">
                          {m.activePlanTitle}
                        </span>
                      ) : (
                        <span className="text-zinc-400 italic">Sin plan activo</span>
                      )}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-zinc-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-1.5 rounded-full"
                            style={{ width: `${m.planProgress}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-semibold text-zinc-700">
                          {m.planProgress}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href="/evaluaciones"
                          className="font-medium text-blue-600 hover:text-blue-800"
                        >
                          Evaluar
                        </Link>
                        <span>•</span>
                        <Link
                          href="/planes"
                          className="font-medium text-purple-600 hover:text-purple-800"
                        >
                          Ver plan
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
