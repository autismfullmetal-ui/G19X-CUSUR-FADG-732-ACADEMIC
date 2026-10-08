import Link from "next/link";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  CREAR_EMPLEADO: { label: "Alta Empleado", color: "bg-blue-50 text-blue-700 border-blue-200" },
  ACTUALIZAR_ESTADO_EMPLEADO: { label: "Estado Empleado", color: "bg-amber-50 text-amber-700 border-amber-200" },
  CREAR_COMPETENCIA: { label: "Nueva Competencia", color: "bg-blue-50 text-blue-700 border-blue-200" },
  CAMBIAR_ESTADO_COMPETENCIA: { label: "Estado Competencia", color: "bg-amber-50 text-amber-700 border-amber-200" },
  EVALUACION_DIAGNOSTICA: { label: "Evaluación Inicial", color: "bg-purple-50 text-purple-700 border-purple-200" },
  EVALUACION_POST_CAPACITACION: { label: "Re-evaluación Post-Cap.", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  CREAR_OPORTUNIDAD: { label: "Nueva Oportunidad", color: "bg-blue-50 text-blue-700 border-blue-200" },
  PUBLICAR_OPORTUNIDAD: { label: "Publicación Vacante", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  CERRAR_OPORTUNIDAD: { label: "Cierre Oportunidad", color: "bg-zinc-100 text-zinc-700 border-zinc-200" },
  POSTULACION: { label: "Postulación", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  CREAR_PLAN: { label: "Creación Plan", color: "bg-purple-50 text-purple-700 border-purple-200" },
  APROBAR_PLAN: { label: "Aprobación Plan", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  ENTREGA_ACTIVIDAD: { label: "Envío Entregable", color: "bg-purple-50 text-purple-700 border-purple-200" },
  REVISION_ACTIVIDAD: { label: "Revisión Evaluador", color: "bg-teal-50 text-teal-700 border-teal-200" },
  CREAR_OBJETIVO: { label: "Nuevo Objetivo Estratégico", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  ACTUALIZAR_OBJETIVO: { label: "Actualizar Objetivo", color: "bg-amber-50 text-amber-700 border-amber-200" },
  EVALUAR_OBJETIVOS: { label: "Evaluación de Objetivos", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  IMPORTACION_MASIVA: { label: "Carga Masiva de Datos", color: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  CAMBIO_CONTRASENA: { label: "Cambio de Contraseña", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  RESTABLECER_CONTRASENA: { label: "Restablecimiento Clave", color: "bg-rose-50 text-rose-700 border-rose-200" },
};

export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams: Promise<{ entity?: string; action?: string; q?: string }>;
}) {
  const session = await requireSession();
  const puedeVerAuditoria = ["ADMIN", "RH"].includes(session.user.role);

  if (!puedeVerAuditoria) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
        <h2 className="text-base font-semibold">Acceso Restringido</h2>
        <p className="mt-1 text-xs">El módulo de auditoría y trazabilidad solo está disponible para Administradores y Recursos Humanos.</p>
        <Link href="/dashboard" className="mt-3 inline-block rounded-lg bg-red-700 px-3 py-1.5 text-xs font-semibold text-white">
          Volver al Inicio
        </Link>
      </div>
    );
  }

  const { entity, action, q } = await searchParams;

  const whereClause: any = {};
  if (entity) {
    whereClause.entity = entity;
  }
  if (action) {
    whereClause.action = action;
  }
  if (q) {
    whereClause.OR = [
      { details: { contains: q } },
      { user: { name: { contains: q } } },
    ];
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [logs, totalLogs, todayLogsCount] = await Promise.all([
    db.auditLog.findMany({
      where: whereClause,
      include: { user: { select: { id: true, name: true, role: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 60,
    }),
    db.auditLog.count(),
    db.auditLog.count({
      where: { createdAt: { gte: todayStart } },
    }),
  ]);

  const uniqueEntities = ["Empleado", "Usuario", "Competencia", "Evaluacion", "Oportunidad", "Postulacion", "Plan", "Actividad", "Objetivo"];

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
              Registro de Auditoría y Trazabilidad
            </h1>
            <span className="rounded-full bg-zinc-900 px-2.5 py-0.5 text-xs font-semibold text-white">
              RF-026 / OE-17
            </span>
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            Historial inmutable de operaciones críticas, cambios de estado y acciones ejecutadas por los usuarios.
          </p>
        </div>
      </div>

      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-medium text-zinc-500">Total de Eventos Registrados</span>
          <p className="mt-2 text-3xl font-bold text-zinc-900">{totalLogs}</p>
          <p className="mt-2 text-[11px] text-zinc-400">Trazabilidad completa de operaciones.</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-medium text-zinc-500">Operaciones Hoy</span>
          <p className="mt-2 text-3xl font-bold text-blue-600">{todayLogsCount}</p>
          <p className="mt-2 text-[11px] text-zinc-400">Actividad del personal en la jornada actual.</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-medium text-zinc-500">Mostrando Registros</span>
          <p className="mt-2 text-3xl font-bold text-purple-600">{logs.length}</p>
          <p className="mt-2 text-[11px] text-zinc-400">Ordenados cronológicamente (más recientes primero).</p>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs">
        <form method="GET" className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">Entidad</label>
            <select
              name="entity"
              defaultValue={entity ?? ""}
              className="w-full rounded-lg border border-zinc-300 px-3 py-1.5 text-xs text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            >
              <option value="">Todas las entidades</option>
              {uniqueEntities.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">Acción</label>
            <select
              name="action"
              defaultValue={action ?? ""}
              className="w-full rounded-lg border border-zinc-300 px-3 py-1.5 text-xs text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            >
              <option value="">Todas las acciones</option>
              {Object.entries(ACTION_LABELS).map(([key, data]) => (
                <option key={key} value={key}>
                  {data.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">Buscar texto</label>
            <input
              name="q"
              defaultValue={q ?? ""}
              placeholder="Detalle o usuario..."
              className="w-full rounded-lg border border-zinc-300 px-3 py-1.5 text-xs text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            />
          </div>

          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="rounded-lg bg-zinc-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 transition"
            >
              Filtrar
            </button>
            {(entity || action || q) && (
              <Link
                href="/auditoria"
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition text-center"
              >
                Limpiar
              </Link>
            )}
          </div>
        </form>
      </div>

      {/* Tabla de Eventos de Auditoría */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xs">
        <div className="border-b border-zinc-100 bg-zinc-50/70 px-5 py-3 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Registro Histórico de Operaciones
          </span>
          <span className="text-[11px] text-zinc-400">
            Últimos {logs.length} eventos
          </span>
        </div>

        {logs.length === 0 ? (
          <div className="py-16 text-center text-xs text-zinc-400">
            No se encontraron eventos de auditoría con los filtros aplicados.
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {logs.map((log) => {
              const meta = ACTION_LABELS[log.action] ?? {
                label: log.action,
                color: "bg-zinc-100 text-zinc-700 border-zinc-200",
              };
              return (
                <div
                  key={log.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 hover:bg-zinc-50/50 transition"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-1 h-3 w-3 shrink-0 rounded-full border shadow-2xs ${meta.color}`}
                    />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-xs text-zinc-900">
                          {meta.label}
                        </span>
                        <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600">
                          {log.entity} {log.entityId ? `#${log.entityId}` : ""}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-zinc-600 max-w-2xl font-normal leading-relaxed">
                        {log.details ?? "Sin detalle registrado."}
                      </p>
                      <div className="mt-1.5 flex items-center gap-3 text-[11px] text-zinc-400">
                        <span>
                          Ejecutado por:{" "}
                          <strong className="text-zinc-600 font-medium">
                            {log.user ? `${log.user.name} (${log.user.role})` : "Sistema / Desconocido"}
                          </strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 sm:self-center">
                    <p className="text-xs font-medium text-zinc-700">
                      {log.createdAt.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </p>
                    <p className="text-[10px] text-zinc-400">
                      {log.createdAt.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
