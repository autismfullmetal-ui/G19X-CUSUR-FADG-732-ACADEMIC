import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";

export default async function CompetenciasPage() {
  await requireSession();
  const competencias = await db.competency.findMany({ orderBy: { name: "asc" } });
  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">Competencias</h1>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {competencias.map((c) => (
          <div
            key={c.id}
            className="rounded-xl border border-zinc-200 bg-white p-5"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-zinc-900">{c.name}</h2>
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
                {c.type}
              </span>
            </div>
            <p className="mt-2 text-sm text-zinc-500">{c.description}</p>
          </div>
        ))}
        {competencias.length === 0 && (
          <p className="text-sm text-zinc-400">Sin competencias en el catálogo</p>
        )}
      </div>
    </div>
  );
}
