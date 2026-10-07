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
} from "recharts";

type EmployeeDashboardProps = {
  userName: string;
  employeeInfo: {
    position: string;
    department: string;
    supervisorName: string | null;
  };
  metrics: {
    planTitle: string | null;
    planStatus: string | null;
    planProgress: number;
    completedActivities: number;
    totalActivities: number;
    gapsSuperadas: number;
    gapsTotales: number;
    applicationsCount: number;
    avgCompetencyLevel: number;
  };
  competenciesChartData: { name: string; nivel: number }[];
  pendingActivities: {
    id: number;
    order: number;
    description: string;
    deliverable: string | null;
    status: string;
  }[];
  recentApplications: {
    id: number;
    opportunityTitle: string;
    compatibility: number | null;
    status: string;
    gapsCount: number;
  }[];
  availableOpportunities: {
    id: number;
    title: string;
    type: string;
    vacancies: number;
    deadline: string | null;
  }[];
};

export default function EmployeeDashboard({
  userName,
  employeeInfo,
  metrics,
  competenciesChartData,
  pendingActivities,
  recentApplications,
  availableOpportunities,
}: EmployeeDashboardProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="space-y-6">
      {/* Encabezado Personalizado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
              Hola, {userName}
            </h1>
            <span className="rounded-full bg-zinc-900 px-2.5 py-0.5 text-xs font-semibold text-white">
              Colaborador
            </span>
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            {employeeInfo.position} • {employeeInfo.department}
            {employeeInfo.supervisorName && (
              <span> • Supervisor: <strong className="text-zinc-700">{employeeInfo.supervisorName}</strong></span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/oportunidades"
            className="rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-white hover:bg-zinc-800 transition shadow-xs"
          >
            Explorar Vacantes
          </Link>
          <Link
            href="/planes"
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition shadow-xs"
          >
            Mi Plan de Desarrollo
          </Link>
        </div>
      </div>

      {/* Tarjetas KPI del Empleado */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1: Mi Plan Activo */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
            <span>Mi Plan de Desarrollo</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-purple-600 text-sm">
              🚀
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-purple-600">
              {metrics.planProgress}%
            </span>
            <span className="text-xs text-zinc-500">avance</span>
          </div>
          <div className="mt-3 w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-purple-600 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${metrics.planProgress}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-zinc-500 font-medium truncate">
            {metrics.planTitle ?? "Sin plan activo actualmente"}
          </p>
        </div>

        {/* KPI 2: Cierre de Brechas Personales */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
            <span>Brechas Superadas</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 text-sm">
              🎯
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-emerald-600">
              {metrics.gapsSuperadas}
            </span>
            <span className="text-xs text-zinc-500">de {metrics.gapsTotales} superadas</span>
          </div>
          <div className="mt-3 w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
              style={{
                width: `${
                  metrics.gapsTotales > 0
                    ? Math.round((metrics.gapsSuperadas / metrics.gapsTotales) * 100)
                    : 0
                }%`,
              }}
            />
          </div>
          <p className="mt-2 text-[11px] text-zinc-400">
            {metrics.gapsTotales - metrics.gapsSuperadas} brechas abiertas en desarrollo activo.
          </p>
        </div>

        {/* KPI 3: Mis Postulaciones */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
            <span>Mis Postulaciones</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 text-sm">
              📋
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-zinc-900">
              {metrics.applicationsCount}
            </span>
            <span className="text-xs text-zinc-500">oportunidades</span>
          </div>
          <p className="mt-3 text-[11px] text-zinc-400">
            Postulaciones a proyectos y vacantes internas registradas.
          </p>
        </div>

        {/* KPI 4: Nivel Promedio de Competencias */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
            <span>Nivel Promedio de Perfil</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600 text-sm">
              ⭐
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-zinc-900">
              {metrics.avgCompetencyLevel.toFixed(1)}
            </span>
            <span className="text-xs text-zinc-500">/ 5.0</span>
          </div>
          <p className="mt-3 text-[11px] text-zinc-400">
            Calculado sobre {competenciesChartData.length} competencias evaluadas.
          </p>
        </div>
      </div>

      {/* Fila: Gráfica de Competencias y Actividades del Plan */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Gráfica: Mis Competencias Vigentes */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-zinc-900">
                Mi Perfil de Competencias
              </h2>
              <p className="text-xs text-zinc-500">
                Nivel vigente (escala 1 a 5) evaluado formalmente por la organización.
              </p>
            </div>
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
              Escala 1–5
            </span>
          </div>

          <div className="h-64 w-full">
            {mounted && competenciesChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={competenciesChartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                >
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "#71717a" }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                  />
                  <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11, fill: "#71717a" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#18181b",
                      border: "none",
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                    formatter={(val) => [`Nivel ${val}`, "Dominio"]}
                  />
                  <Bar dataKey="nivel" name="Nivel" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-zinc-400">
                Aún no tienes competencias evaluadas registradas.
              </div>
            )}
          </div>
        </div>

        {/* Próximas Actividades / Entregables Pendientes */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-zinc-900">
                  Próximas Actividades a Entregar
                </h2>
                <p className="text-xs text-zinc-500">
                  Actividades de tu plan que requieren avance o evidencia tangible.
                </p>
              </div>
              <Link href="/planes" className="text-xs font-medium text-purple-600 hover:text-purple-800 underline">
                Ver plan completo →
              </Link>
            </div>

            {pendingActivities.length === 0 ? (
              <div className="py-12 text-center text-xs text-zinc-400">
                🎉 ¡Estás al día! No tienes actividades pendientes de entrega en este momento.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingActivities.map((act) => (
                  <div
                    key={act.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-xl border border-zinc-200 bg-zinc-50/60 p-3.5 transition"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-200 text-[10px] font-bold text-zinc-700">
                          {act.order}
                        </span>
                        <p className="text-xs font-medium text-zinc-900 line-clamp-1">
                          {act.description}
                        </p>
                      </div>
                      {act.deliverable && (
                        <p className="text-[11px] text-zinc-500 mt-1 pl-7 line-clamp-1">
                          📦 Entregable: <span className="text-zinc-700">{act.deliverable}</span>
                        </p>
                      )}
                    </div>
                    <Link
                      href="/planes"
                      className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 transition shrink-0 self-end sm:self-auto"
                    >
                      📤 Enviar entrega
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-400">
            <span>{metrics.completedActivities} de {metrics.totalActivities} actividades completadas</span>
            <span className="font-semibold text-zinc-700">{metrics.planProgress}% total</span>
          </div>
        </div>
      </div>

      {/* Fila: Mis Postulaciones y Oportunidades Disponibles */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Mis Postulaciones */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-zinc-900">
                Mis Postulaciones Recientes
              </h2>
              <p className="text-xs text-zinc-500">
                Oportunidades a las que has aplicado y tu nivel de compatibilidad.
              </p>
            </div>
            <Link href="/postulaciones" className="text-xs font-medium text-zinc-600 hover:text-zinc-900 underline">
              Ver todas
            </Link>
          </div>

          {recentApplications.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-400">
              No te has postulado a ninguna oportunidad todavía.
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentApplications.map((app) => (
                <div
                  key={app.id}
                  className="flex items-center justify-between rounded-xl border border-zinc-100 p-3 hover:bg-zinc-50 transition"
                >
                  <div>
                    <h3 className="text-xs font-semibold text-zinc-900">
                      {app.opportunityTitle}
                    </h3>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      {app.gapsCount > 0 ? `${app.gapsCount} brechas identificadas` : "Sin brechas detectadas"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`font-bold text-xs rounded-md px-2 py-0.5 ${
                        (app.compatibility ?? 0) >= 80
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-blue-50 text-blue-700"
                      }`}
                    >
                      {app.compatibility !== null ? `${app.compatibility}%` : "—"}
                    </span>
                    <Link
                      href={`/postulaciones/${app.id}`}
                      className="text-xs font-medium text-blue-600 hover:text-blue-800"
                    >
                      Ver →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Oportunidades Disponibles */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-zinc-900">
                Oportunidades Abiertas para Ti
              </h2>
              <p className="text-xs text-zinc-500">
                Puestos y proyectos activos donde puedes postularte y crecer.
              </p>
            </div>
            <Link href="/oportunidades" className="text-xs font-medium text-zinc-600 hover:text-zinc-900 underline">
              Explorar catálogo
            </Link>
          </div>

          {availableOpportunities.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-400">
              No hay nuevas oportunidades disponibles por el momento.
            </div>
          ) : (
            <div className="space-y-2.5">
              {availableOpportunities.map((opp) => (
                <div
                  key={opp.id}
                  className="flex items-center justify-between rounded-xl border border-zinc-100 p-3 hover:bg-zinc-50 transition"
                >
                  <div>
                    <h3 className="text-xs font-semibold text-zinc-900">
                      {opp.title}
                    </h3>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Tipo: {opp.type} • {opp.vacancies} {opp.vacancies === 1 ? "vacante" : "vacantes"}
                    </p>
                  </div>
                  <Link
                    href="/oportunidades"
                    className="rounded-lg border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 transition"
                  >
                    Postularme
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
