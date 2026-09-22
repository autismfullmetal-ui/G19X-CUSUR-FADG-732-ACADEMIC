import Link from "next/link";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { setEmployeeStatus, createDepartment, createPosition } from "@/app/actions";
import EmpleadoForm from "@/components/EmpleadoForm";

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

  const [empleados, departments, positions] = await Promise.all([
    db.employee.findMany({
      include: { department: true, position: true },
      orderBy: { lastName: "asc" },
    }),
    db.department.findMany({ orderBy: { name: "asc" } }),
    db.position.findMany({ orderBy: { title: "asc" } }),
  ]);
  const supervisors = empleados;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900">Empleados</h1>
        {puedeGestionar && (
          <EmpleadoForm departments={departments} positions={positions} supervisors={supervisors} />
        )}
      </div>

      {error && BANNER[error] && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{BANNER[error]}</p>
      )}
      {ok && (
        <p className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">Empleado registrado.</p>
      )}

      <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Correo</th>
              <th className="px-4 py-3">Departamento</th>
              <th className="px-4 py-3">Puesto</th>
              <th className="px-4 py-3">Estado</th>
              {puedeGestionar && <th className="px-4 py-3">Acciones</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {empleados.map((e) => (
              <tr key={e.id}>
                <td className="px-4 py-3 font-medium text-zinc-900">
                  {e.firstName} {e.lastName}
                </td>
                <td className="px-4 py-3 text-zinc-500">{e.email}</td>
                <td className="px-4 py-3">{e.department.name}</td>
                <td className="px-4 py-3">{e.position.title}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      e.status === "ACTIVO"
                        ? "bg-green-100 text-green-700"
                        : "bg-zinc-100 text-zinc-500"
                    }`}
                  >
                    {e.status}
                  </span>
                </td>
                {puedeGestionar && (
                  <td className="px-4 py-3">
                    <form action={setEmployeeStatus}>
                      <input type="hidden" name="employeeId" value={e.id} />
                      <input type="hidden" name="status" value={e.status === "ACTIVO" ? "INACTIVO" : "ACTIVO"} />
                      <button className="text-xs text-zinc-500 underline hover:text-zinc-900">
                        {e.status === "ACTIVO" ? "Desactivar" : "Activar"}
                      </button>
                    </form>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {puedeGestionar && (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <form action={createDepartment} className="flex gap-2 rounded-xl border border-zinc-200 bg-white p-4">
            <input name="name" placeholder="Nuevo departamento" required className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
            <button className="rounded-lg border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-50">Agregar</button>
          </form>
          <form action={createPosition} className="flex gap-2 rounded-xl border border-zinc-200 bg-white p-4">
            <input name="title" placeholder="Nuevo puesto" required className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
            <button className="rounded-lg border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-50">Agregar</button>
          </form>
        </div>
      )}

      <p className="mt-6 text-xs text-zinc-400">
        Los empleados con usuario pueden iniciar sesión. Ver{" "}
        <Link href="/evaluaciones" className="underline">evaluaciones</Link>.
      </p>
    </div>
  );
}
