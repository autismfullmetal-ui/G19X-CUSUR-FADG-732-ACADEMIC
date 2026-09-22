import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";

export default async function OportunidadesPage() {
  await requireSession();
  const oportunidades = await db.opportunity.findMany({
    include: { requirements: { include: { competency: true } } },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">Oportunidades</h1>
      <div className="mt-6 space-y-4">
        {oportunidades.map((o) => (
          <div
            key={o.id}
            className="rounded-xl border border-zinc-200 bg-white p-5"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-zinc-900">{o.title}</h2>
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
                {o.type} · {o.status}
              </span>
            </div>
            <p className="mt-2 text-sm text-zinc-500">{o.description}</p>
            {o.requirements.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {o.requirements.map((r) => (
                  <span
                    key={r.id}
                    className="rounded-full border border-zinc-200 px-2 py-0.5 text-xs text-zinc-600"
                  >
                    {r.competency.name}: nivel {r.requiredLevel} (peso{" "}
                    {r.weight}){r.mandatory ? " · obligatoria" : ""}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
        {oportunidades.length === 0 && (
          <p className="text-sm text-zinc-400">Sin oportunidades registradas</p>
        )}
      </div>
    </div>
  );
}
