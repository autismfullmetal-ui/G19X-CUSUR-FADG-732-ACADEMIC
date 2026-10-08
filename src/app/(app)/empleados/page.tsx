import Link from "next/link";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { createDepartment, createPosition } from "@/app/actions";
import EmpleadoForm from "@/components/EmpleadoForm";
import EmpleadosDirectory from "@/components/EmpleadosDirectory";

const BANNER: Record<string, string> = {
  datos: "Faltan datos obligatorios.",
  duplicado: "Ya existe un empleado con ese correo.",
};

export default async function EmpleadosPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const session = await requireSession();
  const puedeGestionar = ["ADMIN", "RH"].includes(session.user.role);
  const { error, ok } = await searchParams;

  const [empleados, departments, positions, competencies] = await Promise.all([
    db.employee.findMany({
      include: {
        department: true,
        position: true,
        competencies: {
          include: { competency: true },
          orderBy: { competency: { name: "asc" } },
        },
      },
      orderBy: { lastName: "asc" },
    }),
    db.department.findMany({ orderBy: { name: "asc" } }),
    db.position.findMany({ orderBy: { title: "asc" } }),
    db.competency.findMany({
      where: { status: "ACTIVA" },
      orderBy: { name: "asc" },
    }),
  ]);
  const supervisors = empleados;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
            <span>Empleados</span>
          </h1>
          <p className="text-sm text-zinc-400">
            Directorio general del personal, puestos y competencias vigentes.
          </p>
        </div>
        {puedeGestionar && (
          <div className="flex items-center gap-2.5">
            <Link
              href="/importacion"
              className="rounded-xl border border-zinc-700/80 bg-zinc-900/80 px-3.5 py-2 text-xs font-semibold text-zinc-200 hover:text-white hover:bg-zinc-800 transition shadow-2xs"
            >
              Importar CSV
            </Link>
            <EmpleadoForm
              departments={departments}
              positions={positions}
              supervisors={supervisors}
              competencies={competencies}
            />
          </div>
        )}
      </div>

      {error && BANNER[error] && (
        <p className="mt-4 rounded-xl bg-red-950/60 px-4 py-2.5 text-xs text-red-300 border border-red-800/60 shadow-xs">
          {BANNER[error]}
        </p>
      )}

      {ok === "password_reset" && (
        <p className="mt-4 rounded-xl bg-red-950/60 px-4 py-2.5 text-xs text-rose-200 border border-red-800/50 shadow-xs">
          ✓ Contraseña del colaborador restablecida con éxito a la clave temporal predeterminada (Demo1234!).
        </p>
      )}
      {ok && (
        <p className="mt-4 rounded-xl bg-red-950/60 px-4 py-2.5 text-xs text-rose-200 border border-red-800/50 shadow-xs">
          ✓ Empleado registrado y competencias asignadas correctamente.
        </p>
      )}

      {/* Buscador y Directorio con Filtros */}
      <div className="mt-6">
        <EmpleadosDirectory
          empleados={empleados}
          departments={departments}
          positions={positions}
          competencies={competencies}
          puedeGestionar={puedeGestionar}
        />
      </div>

      {puedeGestionar && (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <form
            action={createDepartment}
            className="flex gap-2 rounded-2xl border border-zinc-800/80 bg-[#121217] p-4 shadow-xl"
          >
            <input
              name="name"
              placeholder="Nuevo departamento..."
              required
              className="flex-1 rounded-xl border border-zinc-800 bg-[#161622] px-3.5 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-[#ad4251] focus:outline-none transition shadow-inner"
            />
            <button className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-red-700 transition cursor-pointer">
              Agregar
            </button>
          </form>
          <form
            action={createPosition}
            className="flex gap-2 rounded-2xl border border-zinc-800/80 bg-[#121217] p-4 shadow-xl"
          >
            <input
              name="title"
              placeholder="Nuevo puesto..."
              required
              className="flex-1 rounded-xl border border-zinc-800 bg-[#161622] px-3.5 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-[#ad4251] focus:outline-none transition shadow-inner"
            />
            <button className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-red-700 transition cursor-pointer">
              Agregar
            </button>
          </form>
        </div>
      )}

      <p className="mt-6 text-xs text-zinc-500">
        Los empleados con usuario pueden iniciar sesión con su correo corporativo. Ver{" "}
        <Link href="/evaluaciones" className="text-zinc-400 underline hover:text-red-400 transition">
          evaluaciones y diagnósticos
        </Link>.
      </p>
    </div>
  );
}
