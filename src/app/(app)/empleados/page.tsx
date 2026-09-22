import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";

export default async function EmpleadosPage() {
  await requireSession();
  const empleados = await db.employee.findMany({
    include: { department: true, position: true },
    orderBy: { lastName: "asc" },
  });
  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">Empleados</h1>
      <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Correo</th>
              <th className="px-4 py-3">Departamento</th>
              <th className="px-4 py-3">Puesto</th>
              <th className="px-4 py-3">Estado</th>
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
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                    {e.status}
                  </span>
                </td>
              </tr>
            ))}
            {empleados.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zinc-400">
                  Sin empleados registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
