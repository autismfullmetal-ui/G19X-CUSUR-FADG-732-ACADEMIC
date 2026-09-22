import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { toggleCompetency } from "@/app/actions";
import CompetenciaForm from "@/components/CompetenciaForm";

export default async function CompetenciasPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const session = await requireSession();
  const puedeGestionar = ["ADMIN", "RH"].includes(session.user.role);
  const { error, ok } = await searchParams;

  const competencias = await db.competency.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900">Competencias</h1>
        {puedeGestionar && <CompetenciaForm />}
      </div>

      {error === "datos" && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">El nombre es obligatorio.</p>
      )}
      {error === "duplicado" && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">Ya existe una competencia con ese nombre.</p>
      )}
      {ok && (
        <p className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">Competencia registrada.</p>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {competencias.map((c) => (
          <div key={c.id} className="rounded-xl border border-zinc-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-zinc-900">{c.name}</h2>
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  c.status === "ACTIVA" ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-500"
                }`}
              >
                {c.status}
              </span>
            </div>
            <p className="mt-2 text-sm text-zinc-500">{c.description}</p>
            <div className="mt-3 flex items-center justify-between">
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">{c.type}</span>
              {puedeGestionar && (
                <form action={toggleCompetency}>
                  <input type="hidden" name="competencyId" value={c.id} />
                  <button className="text-xs text-zinc-500 underline hover:text-zinc-900">
                    {c.status === "ACTIVA" ? "Desactivar" : "Activar"}
                  </button>
                </form>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
