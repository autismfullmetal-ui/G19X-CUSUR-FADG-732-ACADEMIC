import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";

export default async function PlanesPage() {
  const session = await requireSession();
  const soyEmpleado = session.user.role === "EMPLEADO";
  const yo = await db.employee.findUnique({
    where: { userId: Number(session.user.id) },
  });
  const planes = await db.developmentPlan.findMany({
    where: soyEmpleado && yo ? { employeeId: yo.id } : {},
    include: { employee: true, activities: { orderBy: { order: "asc" } } },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">
        {soyEmpleado ? "Mi plan de desarrollo" : "Planes de desarrollo"}
      </h1>
      <div className="mt-6 space-y-4">
        {planes.map((p) => (
          <div
            key={p.id}
            className="rounded-xl border border-zinc-200 bg-white p-5"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-zinc-900">{p.title}</h2>
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
                {p.status}
              </span>
            </div>
            <p className="mt-1 text-sm text-zinc-500">{p.objective}</p>
            <p className="mt-1 text-xs text-zinc-400">
              {p.employee.firstName} {p.employee.lastName}
            </p>
            <ol className="mt-3 list-inside list-decimal space-y-1 text-sm text-zinc-600">
              {p.activities.map((a) => (
                <li key={a.id}>
                  {a.description}{" "}
                  <span className="text-xs text-zinc-400">({a.status})</span>
                </li>
              ))}
            </ol>
          </div>
        ))}
        {planes.length === 0 && (
          <p className="text-sm text-zinc-400">Sin planes de desarrollo</p>
        )}
      </div>
    </div>
  );
}
