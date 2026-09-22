export type GapInput = {
  competency: string;
  currentLevel: number;
  requiredLevel: number;
  mandatory: boolean;
};

export type ActivitySuggestion = { descripcion: string; orden: number };

export type AiRecommendation = {
  text: string;
  activities: ActivitySuggestion[];
  modelVersion: string;
  source: "ia" | "plantilla";
};

const BASE_URL = process.env.AI_BASE_URL ?? "https://api.openai.com/v1";
const API_KEY = process.env.AI_API_KEY ?? "";
const MODEL = process.env.AI_MODEL ?? "gpt-4o-mini";

export function aiConfigured(): boolean {
  return API_KEY.trim().length > 0;
}

// RNF-015: plantillas predefinidas cuando la IA no está disponible
export function templateRecommendation(input: {
  employee: string;
  opportunity: string;
  gaps: GapInput[];
}): AiRecommendation {
  const ordered = [...input.gaps].sort(
    (a, b) => Number(b.mandatory) - Number(a.mandatory)
  );
  const parts = ordered.map(
    (g) =>
      `Fortalece ${g.competency}: pasar de nivel ${g.currentLevel} a nivel ${g.requiredLevel}${
        g.mandatory ? " (competencia obligatoria para la oportunidad)" : ""
      }.`
  );
  const text =
    `Plan sugerido para ${input.employee} orientado a la oportunidad "${input.opportunity}": ` +
    (parts.length > 0
      ? parts.join(" ") +
        " Al terminar las actividades, realizar una reevaluación para verificar la superación de las brechas."
      : "Sin brechas detectadas: la persona cubre los requisitos de la oportunidad.");

  const activities: ActivitySuggestion[] = [
    ...ordered.map((g, i) => ({
      descripcion: `Curso o práctica estructurada de ${g.competency} para alcanzar nivel ${g.requiredLevel}`,
      orden: i + 1,
    })),
    ...ordered.map((g, i) => ({
      descripcion: `Proyecto práctico aplicando ${g.competency}`,
      orden: ordered.length + i + 1,
    })),
    {
      descripcion: "Reevaluación de competencias para actualizar brechas",
      orden: ordered.length * 2 + 1,
    },
  ];

  return { text, activities, modelVersion: "plantilla-local", source: "plantilla" };
}

export async function generateAiRecommendation(input: {
  employee: string;
  opportunity: string;
  gaps: GapInput[];
}): Promise<AiRecommendation> {
  // RNF-015: si la IA no está configurada, usar plantillas sin fallar
  if (!aiConfigured()) return templateRecommendation(input);

  const system =
    "Eres un asistente de desarrollo profesional de recursos humanos. " +
    "Generas planes de desarrollo personalizados a partir de brechas de competencias. " +
    "Responde ÚNICAMENTE con un objeto JSON válido con la forma: " +
    '{"recomendacion": "texto breve del plan sugerido", "actividades": [{"descripcion": "...", "orden": 1}]}. ' +
    "Las actividades deben ser concretas, en español, ordenadas y terminar con una reevaluación. " +
    "No tomas decisiones de contratación ni modificas evaluaciones.";

  const user = [
    `Empleado: ${input.employee}`,
    `Oportunidad: ${input.opportunity}`,
    "Brechas detectadas (competencia: nivel actual -> requerido):",
    ...input.gaps.map(
      (g) =>
        `- ${g.competency}: ${g.currentLevel} -> ${g.requiredLevel}${
          g.mandatory ? " (obligatoria)" : ""
        }`
    ),
    input.gaps.length === 0
      ? "No hay brechas; sugiere actividades de consolidación breves."
      : "",
  ].join("\n");

  try {
    const res = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.4,
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(30000), // RNF-015: máximo 30 s
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content ?? "";
    const parsed = JSON.parse(content) as {
      recomendacion?: string;
      actividades?: { descripcion?: string; orden?: number }[];
    };
    if (!parsed.recomendacion) throw new Error("respuesta sin recomendacion");
    const activities: ActivitySuggestion[] = (parsed.actividades ?? [])
      .filter((a) => a.descripcion)
      .map((a, i) => ({
        descripcion: String(a.descripcion),
        orden: a.orden ?? i + 1,
      }));
    return {
      text: parsed.recomendacion,
      activities,
      modelVersion: MODEL,
      source: "ia",
    };
  } catch {
    // RNF-015: ante fallo o timeout, usar plantillas y notificar por el origen
    return templateRecommendation(input);
  }
}
