"use client";

import { useEffect, useState } from "react";
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

type AdminRhDashboardProps = {
  userName: string;
  role: string;
  metrics: {
    totalEmployees: number;
    activeEmployees: number;
    departmentsCount: number;
    positionsCount: number;
    evalCoveragePercent: number;
    evaluatedCount: number;
    gapClosureRate: number;
    superadasGapsCount: number;
    totalGapsCount: number;
    planAdoptionRate: number;
    totalPlansCount: number;
    totalApplicationsCount: number;
    activeOpportunitiesCount: number;
  };
  demandChartData: { name: string; demanda: number; nivelPromedio: number }[];
  planStatusData: { name: string; value: number; color: string }[];
  gapsByCompetencyData: { name: string; brechas: number }[];
  recentApplications: {
    id: number;
    employeeName: string;
    opportunityTitle: string;
    compatibility: number | null;
    gapsCount: number;
    hasPlan: boolean;
    createdAt: string;
  }[];
};

const PLAN_COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#94a3b8"];

export default function AdminRhDashboard({
  userName,
  role,
  metrics,
  demandChartData,
  planStatusData,
  gapsByCompetencyData,
  recentApplications,
}: AdminRhDashboardProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
              Panel de Control de Talento
            </h1>
            <span className="rounded-full bg-zinc-900 px-2.5 py-0.5 text-xs font-semibold text-white">
              {role === "ADMIN" ? "Administrador" : "Recursos Humanos"}
            </span>
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            Métricas ejecutivas de cobertura de evaluaciones, cierre de brechas y planes de carrera.
          </p>
        </div>

        {/* Acciones Rápidas */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/empleados"
            className="rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-white hover:bg-zinc-800 transition shadow-xs"
          >
            + Empleados
          </Link>
          <Link
            href="/oportunidades"
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition shadow-xs"
          >
            + Oportunidades
          </Link>
          <Link
            href="/evaluaciones"
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition shadow-xs"
          >
            Evaluaciones
          </Link>
        </div>
      </div>

      {/* Tarjetas KPI de Alto Impacto */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1: Cobertura */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
            <span>Cobertura de Evaluaciones</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-zinc-900">
              {metrics.evalCoveragePercent}%
            </span>
            <span className="text-xs text-zinc-500">evaluados</span>
          </div>
          <div className="mt-3 w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(metrics.evalCoveragePercent, 100)}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-zinc-400">
            {metrics.evaluatedCount} de {metrics.totalEmployees} colaboradores con perfil diagnóstico.
          </p>
        </div>

        {/* KPI 2: Cierre de Brechas */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
            <span>Tasa de Cierre de Brechas</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-emerald-600">
              {metrics.gapClosureRate}%
            </span>
            <span className="text-xs text-zinc-500">superadas</span>
          </div>
          <div className="mt-3 w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(metrics.gapClosureRate, 100)}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-zinc-400">
            {metrics.superadasGapsCount} brechas superadas tras capacitación de {metrics.totalGapsCount} totales.
          </p>
        </div>

        {/* KPI 3: Adopción de Planes */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
            <span>Adopción de Planes</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-purple-600">
              {metrics.planAdoptionRate}%
            </span>
            <span className="text-xs text-zinc-500">con plan</span>
          </div>
          <div className="mt-3 w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-purple-600 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(metrics.planAdoptionRate, 100)}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-zinc-400">
            {metrics.totalPlansCount} planes generados para {metrics.totalApplicationsCount} postulaciones.
          </p>
        </div>

        {/* KPI 4: Oportunidades y Plantilla */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
            <span>Oportunidades y Plantilla</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-zinc-900">
              {metrics.activeOpportunitiesCount}
            </span>
            <span className="text-xs text-zinc-500">activas</span>
          </div>
          <p className="mt-3 text-xs text-zinc-600 font-medium">
            {metrics.activeEmployees} colaboradores activos
          </p>
          <p className="mt-1 text-[11px] text-zinc-400">
            {metrics.departmentsCount} departamentos y {metrics.positionsCount} puestos configurados.
          </p>
        </div>
      </div>

      {/* Fila de Gráficas Recharts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Gráfica 1: Demanda de Competencias */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-zinc-900">
                Competencias Más Demandadas
              </h2>
              <p className="text-xs text-zinc-500">
                Frecuencia de requisitos en las oportunidades abiertas de la organización.
              </p>
            </div>
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
              Requisitos
            </span>
          </div>

          <div className="h-64 w-full">
            {mounted && demandChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={demandChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "#71717a" }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                  />
                  <YAxis tick={{ fontSize: 11, fill: "#71717a" }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#18181b",
                      border: "none",
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="demanda" name="Veces requerida" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-zinc-400">
                No hay suficientes datos de competencias requeridas aún.
              </div>
            )}
          </div>
        </div>

        {/* Gráfica 2: Estado de Planes de Desarrollo */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-zinc-900">
                Distribución de Planes de Desarrollo
              </h2>
              <p className="text-xs text-zinc-500">
                Estado actual del ciclo formativo de los colaboradores.
              </p>
            </div>
            <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">
              {metrics.totalPlansCount} planes
            </span>
          </div>

          <div className="h-64 w-full">
            {mounted && planStatusData.some((d) => d.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={planStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                  >
                    {planStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PLAN_COLORS[index % PLAN_COLORS.length]} />
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
                No hay planes registrados todavía para mostrar la distribución.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fila 2: Brechas por Competencia y Postulaciones Recientes */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Brechas por Competencia */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-zinc-900">
                Brechas Detectadas
              </h2>
              <p className="text-xs text-zinc-500">
                Competencias que requieren mayor capacitación en la empresa.
              </p>
            </div>
            <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
              Atención
            </span>
          </div>

          <div className="h-64 w-full">
            {mounted && gapsByCompetencyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={gapsByCompetencyData}
                  margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
                >
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#71717a" }} allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "#71717a" }}
                    width={90}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#18181b",
                      border: "none",
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="brechas" name="Brechas abiertas" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-zinc-400 text-center">
                ¡Excelente! No hay brechas abiertas acumuladas en el personal.
              </div>
            )}
          </div>
        </div>

        {/* Tabla de Postulaciones Recientes con Brechas */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-zinc-900">
                Postulaciones y Estado de Brechas
              </h2>
              <p className="text-xs text-zinc-500">
                Últimos colaboradores postulados, índice de compatibilidad y generación de plan.
              </p>
            </div>
            <Link
              href="/postulaciones"
              className="text-xs font-medium text-zinc-600 hover:text-zinc-900 underline"
            >
              Ver todas ({metrics.totalApplicationsCount})
            </Link>
          </div>

          <div className="overflow-x-auto">
            {recentApplications.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-400">
                Aún no hay postulaciones registradas en el sistema.
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-zinc-100 text-left uppercase text-zinc-400 font-semibold">
                    <th className="pb-2">Colaborador</th>
                    <th className="pb-2">Oportunidad</th>
                    <th className="pb-2">Compatibilidad</th>
                    <th className="pb-2">Brechas</th>
                    <th className="pb-2">Plan</th>
                    <th className="pb-2 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {recentApplications.map((app) => (
                    <tr key={app.id} className="hover:bg-zinc-50/50 transition">
                      <td className="py-3 font-medium text-zinc-900">{app.employeeName}</td>
                      <td className="py-3 text-zinc-600">{app.opportunityTitle}</td>
                      <td className="py-3">
                        <span
                          className={`font-semibold rounded-md px-1.5 py-0.5 text-[11px] ${
                            (app.compatibility ?? 0) >= 80
                              ? "bg-emerald-50 text-emerald-700"
                              : (app.compatibility ?? 0) >= 50
                              ? "bg-amber-50 text-amber-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {app.compatibility !== null ? `${app.compatibility}%` : "—"}
                        </span>
                      </td>
                      <td className="py-3">
                        {app.gapsCount > 0 ? (
                          <span className="text-amber-700 font-medium">
                            {app.gapsCount} {app.gapsCount === 1 ? "brecha" : "brechas"}
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-medium">✓ 100% idóneo</span>
                        )}
                      </td>
                      <td className="py-3">
                        {app.hasPlan ? (
                          <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-medium text-purple-700 border border-purple-200">
                            Plan activo
                          </span>
                        ) : (
                          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500">
                            Sin plan
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        <Link
                          href={`/postulaciones/${app.id}`}
                          className="font-medium text-blue-600 hover:text-blue-800"
                        >
                          Ver detalle →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
