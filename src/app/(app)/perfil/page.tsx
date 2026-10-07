import Link from "next/link";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { changePassword } from "@/app/actions";
import { CompetencyBadgeTooltip } from "@/components/CompetencyBadgeTooltip";

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  ADMIN: { label: "Administrador del Sistema", color: "bg-zinc-900 text-white" },
  RH: { label: "Recursos Humanos / Talento", color: "bg-purple-100 text-purple-800" },
  SUPERVISOR: { label: "Supervisor de Equipo", color: "bg-blue-100 text-blue-800" },
  EMPLEADO: { label: "Colaborador / Empleado", color: "bg-emerald-100 text-emerald-800" },
};

export default async function PerfilPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const session = await requireSession();
  const { ok, error } = await searchParams;
  const userId = Number(session.user.id);

  const [user, employee] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true },
    }),
    db.employee.findUnique({
      where: { userId },
      include: {
        department: true,
        position: true,
        supervisor: true,
        competencies: {
          include: { competency: true },
          orderBy: { competency: { name: "asc" } },
        },
      },
    }),
  ]);

  const roleMeta = ROLE_LABELS[session.user.role] ?? {
    label: session.user.role,
    color: "bg-zinc-100 text-zinc-700",
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Mi Perfil y Seguridad</h1>
            <span className="rounded-full bg-zinc-900 px-2.5 py-0.5 text-xs font-semibold text-white">
              RF-028 / RNF-001
            </span>
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            Administra tus datos de cuenta, consulta tu asignación laboral y actualiza tus credenciales de acceso.
          </p>
        </div>
      </div>

      {/* Alertas */}
      {ok === "password_cambiada" && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800">
          ✓ Tu contraseña ha sido actualizada con éxito. Tus próximas sesiones deberán utilizar la nueva clave.
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800">
          {error === "actual_incorrecta" && "⚠️ La contraseña actual ingresada es incorrecta."}
          {error === "longitud_minima" && "⚠️ La nueva contraseña debe tener al menos 6 caracteres."}
          {error === "coincidencia" && "⚠️ La confirmación de contraseña no coincide con la nueva clave."}
          {error === "campos_requeridos" && "⚠️ Debes completar todos los campos del formulario."}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Tarjeta de Información de Cuenta */}
        <div className="lg:col-span-1 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900 text-lg font-bold text-white shadow-sm">
                {session.user.name ? session.user.name.split(" ").map((n) => n[0]).slice(0, 2).join("") : "U"}
              </span>
              <div>
                <h2 className="text-base font-bold text-zinc-900 leading-tight">{session.user.name}</h2>
                <p className="text-xs text-zinc-500">{session.user.email}</p>
                <span className={`inline-block mt-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${roleMeta.color}`}>
                  {roleMeta.label}
                </span>
              </div>
            </div>

            {employee && (
              <div className="pt-3 border-t border-zinc-100 space-y-2.5 text-xs text-zinc-600">
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Departamento
                  </span>
                  <p className="font-semibold text-zinc-800">{employee.department.name}</p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Puesto Asignado
                  </span>
                  <p className="font-semibold text-zinc-800">{employee.position.title}</p>
                </div>

                {employee.supervisor && (
                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                      Supervisor Directo
                    </span>
                    <p className="font-semibold text-zinc-800">
                      {employee.supervisor.firstName} {employee.supervisor.lastName}
                    </p>
                  </div>
                )}

                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Estado Laboral
                  </span>
                  <span className="inline-block rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                    Activo
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-zinc-100 text-[11px] text-zinc-400">
            ID de Usuario en Sistema: #{userId}
          </div>
        </div>

        {/* Sección de Cambio de Contraseña y Competencias */}
        <div className="lg:col-span-2 space-y-6">
          {/* Formulario de Cambio de Contraseña */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg">🔑</span>
                <h3 className="text-base font-bold text-zinc-900">Cambiar Contraseña de Acceso</h3>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                Ingresa tu clave actual para autenticar el cambio por motivos de seguridad.
              </p>
            </div>

            <form action={changePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Contraseña Actual *
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  required
                  placeholder="Tu contraseña actual"
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Nueva Contraseña *
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    required
                    placeholder="Mínimo 6 caracteres"
                    className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Confirmar Nueva Contraseña *
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    placeholder="Repite la nueva contraseña"
                    className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  />
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-zinc-100">
                <p className="text-[11px] text-zinc-400">
                  Protegida con hashing irreversible bcrypt (costo 10).
                </p>
                <button
                  type="submit"
                  className="rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-zinc-800 transition cursor-pointer text-center"
                >
                  Guardar Nueva Contraseña
                </button>
              </div>
            </form>
          </div>

          {/* Competencias vigentes del perfil (si es empleado) */}
          {employee && employee.competencies.length > 0 && (
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">⭐</span>
                  <h3 className="text-base font-bold text-zinc-900">Mis Competencias Vigentes</h3>
                </div>
                <span className="text-xs text-zinc-400">Escala de 1 a 5</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {employee.competencies.map((ec) => (
                  <div
                    key={ec.id}
                    className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50/60 px-3 py-2 text-xs"
                  >
                    <CompetencyBadgeTooltip
                      name={ec.competency.name}
                      level={ec.level}
                      type={ec.competency.type}
                      description={ec.competency.description}
                    />
                    <span className="text-[11px] text-zinc-500 font-mono font-semibold">
                      {ec.level} / 5
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
