import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";

export default async function PostulacionesPage() {
  const session = await requireSession();
  const soyEmpleado = session.user.role === "EMPLEADO";
  const yo = await db.employee.findUnique({
    where: { userId: Number(session.user.id) },
  });
  const postulaciones = await db.application.findMany({
    where: soyEmpleado && yo ? { employeeId: yo.id } : {},
    include: { opportunity: true, employee: true },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">
        {soyEmpleado ? "Mis postulaciones" : "Postulaciones"}
      </h1>
      <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3">Empleado</th>
              <th className="px-4 py-3">Oportunidad</th>
              <th className="px-4 py-3">Compatibilidad</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {postulaciones.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3 font-medium text-zinc-900">
                  {p.employee.firstName} {p.employee.lastName}
                </td>
                <td className="px-4 py-3">{p.opportunity.title}</td>
                <td className="px-4 py-3">
                  {p.compatibility !== null ? `${p.compatibility}%` : "—"}
                </td>
                <td className="px-4 py-3">{p.status}</td>
              </tr>
            ))}
            {postulaciones.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-zinc-400">
                  Sin postulaciones
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
