export type GapInput = {
  competency: string;
  description?: string;
  type?: string;
  currentLevel: number;
  requiredLevel: number;
  mandatory: boolean;
};

export type RecommendationInput = {
  employee: string;
  position?: string;
  department?: string;
  opportunity: string;
  opportunityDescription?: string;
  opportunityType?: string;
  vacancies?: number;
  openDate?: string;
  deadline?: string;
  gaps: GapInput[];
};

export type ActivitySuggestion = {
  orden: number;
  descripcion: string;
  fase?: string;
  titulo?: string;
  herramientas?: string;
  entregable?: string;
  criterio?: string;
};

export type AiRecommendation = {
  text: string;
  activities: ActivitySuggestion[];
  modelVersion: string;
  source: "ia" | "plantilla";
};

export type ProviderConfig = {
  baseUrl: string;
  apiKey: string;
  model: string;
  name: string;
};

export function getProviders(): { primary: ProviderConfig; secondary: ProviderConfig } {
  return {
    primary: {
      baseUrl: process.env.AI_BASE_URL?.trim() || "https://open.bigmodel.cn/api/coding/paas/v4",
      apiKey: process.env.AI_API_KEY?.trim() || "",
      model: process.env.AI_MODEL?.trim() || "glm-4.5",
      name: "Proveedor 1 (Principal)",
    },
    secondary: {
      baseUrl:
        process.env.AI_BASE_URL_2?.trim() ||
        process.env.AI_BASE_URL_SECONDARY?.trim() ||
        "https://openrouter.ai/api/v1",
      apiKey:
        process.env.AI_API_KEY_2?.trim() ||
        process.env.AI_API_KEY_SECONDARY?.trim() ||
        "",
      model:
        process.env.AI_MODEL_2?.trim() ||
        process.env.AI_MODEL_SECONDARY?.trim() ||
        "zhipu/glm-4-9b-chat",
      name: "Proveedor 2 (Respaldo)",
    },
  };
}

export function aiConfigured(): boolean {
  const { primary, secondary } = getProviders();
  return primary.apiKey.length > 0 || secondary.apiKey.length > 0;
}

export function formatActivityFullText(act: ActivitySuggestion): string {
  const prefix = act.fase ? `[${act.fase}] ` : "";
  const title = act.titulo ? `${act.titulo}: ` : "";
  const base = `${prefix}${title}${act.descripcion}`;
  const extras: string[] = [];
  if (act.herramientas) extras.push(`Herramientas: ${act.herramientas}`);
  if (act.entregable) extras.push(`Entregable: ${act.entregable}`);
  if (act.criterio) extras.push(`Criterio: ${act.criterio}`);
  return extras.length > 0 ? `${base} (${extras.join(" | ")})` : base;
}

// RNF-015: plantilla estructurada rica y desglosada cuando la IA no está disponible o falla
export function templateRecommendation(input: RecommendationInput): AiRecommendation {
  const ordered = [...input.gaps].sort(
    (a, b) => Number(b.mandatory) - Number(a.mandatory)
  );

  const timeFrameNotice = input.deadline
    ? ` Plazo estimado de ejecución: hasta ${input.deadline}.`
    : "";

  const parts = ordered.map((g) => {
    const diff = g.requiredLevel - g.currentLevel;
    const desc = g.description ? ` (${g.description})` : "";
    return `Cerrar brecha en ${g.competency}${desc}: incrementar de nivel ${g.currentLevel} a ${g.requiredLevel} (+${diff} niveles)${
      g.mandatory ? " [Requisito Obligatorio]" : ""
    }.`;
  });

  const text =
    `Plan de desarrollo estructurado para ${input.employee}${
      input.position ? ` (${input.position})` : ""
    } enfocado en la oportunidad "${input.opportunity}": ` +
    (parts.length > 0
      ? parts.join(" ") +
        ` Se priorizan las competencias obligatorias mediante formación técnica aplicada, mentoría especializada y proyectos reales.${timeFrameNotice} Concluye con una reevaluación integral.`
      : "Sin brechas detectadas: el colaborador cumple satisfactoriamente con todos los requisitos del perfil.");

  const activities: ActivitySuggestion[] = [];
  let order = 1;

  for (const g of ordered) {
    const isBlanda = g.type?.toUpperCase() === "BLANDA";
    if (isBlanda) {
      activities.push({
        orden: order++,
        fase: "Fase 1: Diagnóstico y Formación Práctica (Semanas 1 a 4)",
        titulo: `Taller aplicado y resolución de casos en ${g.competency}`,
        descripcion: `Estudio y análisis de casos reales aplicados al rol "${input.opportunity}". Simulación de escenarios de comunicación asertiva, resolución de conflictos y alineación de equipos.`,
        herramientas: "Metodologías ágiles, Rúbricas de feedback situacional, Plantillas de resolución de conflictos",
        entregable: `Bitácora de resolución de 3 casos prácticos de ${g.competency} con planes de acción correctiva`,
        criterio: "Revisión satisfactoria de la bitácora por el supervisor con rúbrica de desempeño.",
      });
      activities.push({
        orden: order++,
        fase: "Fase 2: Aplicación en Puesto y Feedback 360° (Semanas 5 a 8)",
        titulo: `Facilitación activa de sesiones de trabajo y retroalimentación en ${g.competency}`,
        descripcion: `Liderar al menos 3 reuniones operativas o retrospectivas con el equipo. Implementar dinámicas participativas y solicitar evaluación 360° anónima a los pares.`,
        herramientas: "Formularios de encuesta 360°, Miro/Mural para dinámicas de equipo, Guías de facilitación",
        entregable: "Informe de retroalimentación 360° con puntaje promedio y plan de mejora continua implementado",
        criterio: "Aprobación de la facilitación por el supervisor y puntaje favorable en la encuesta 360°.",
      });
    } else {
      activities.push({
        orden: order++,
        fase: "Fase 1: Fundamentos Avanzados y Arquitectura (Semanas 1 a 4)",
        titulo: `Especialización técnica y buenas prácticas en ${g.competency} (meta: nivel ${g.requiredLevel})`,
        descripcion: `Profundizar en patrones de arquitectura, estándares de calidad, seguridad y rendimiento aplicados a ${g.competency} para los requisitos de "${input.opportunity}".`,
        herramientas: "IDE profesional, Linters, Frameworks oficiales, Documentación técnica de referencia",
        entregable: `Repositorio privado con suite de ejercicios prácticos avanzados en ${g.competency} y tests unitarios con cobertura >75%`,
        criterio: "Aprobación del código en repositorio con cero errores críticos de linter y pruebas automatizadas pasando.",
      });
      activities.push({
        orden: order++,
        fase: "Fase 2: Mentoría Técnica y Revisión de Código (Semanas 5 a 8)",
        titulo: `Pair programming y code review guiado en ${g.competency}`,
        descripcion: `Sesiones semanales de pair programming con un referente senior. Análisis crítico de decisiones técnicas, principios SOLID y optimización de código.`,
        herramientas: "Git, GitHub / GitLab (Pull Requests), SonarLint, Herramientas de perfilado de rendimiento",
        entregable: "Al menos 2 Pull Requests revisados y aprobados por el mentor senior con registro de lecciones aprendidas",
        criterio: "Visto bueno formal del mentor técnico sobre la calidad y robustez de las soluciones planteadas.",
      });
      activities.push({
        orden: order++,
        fase: "Fase 3: Proyecto Aplicado al Negocio (Previo al Cierre)",
        titulo: `Implementación de módulo funcional en entorno real con ${g.competency}`,
        descripcion: `Desarrollar una solución integral o módulo que resuelva un problema real del puesto "${input.opportunity}", documentando la arquitectura y el despliegue.`,
        herramientas: "Docker, Pipelines CI/CD, Base de datos, API REST / Swagger, Entorno de pruebas o staging",
        entregable: "Demostración funcional en video o en vivo (15 min) + código desplegado en staging con README técnico detallado",
        criterio: "Cumplimiento del 100% de los criterios de aceptación técnicos y validación funcional por el evaluador.",
      });
    }
  }

  activities.push({
    orden: order++,
    fase: "Hito Final: Validación de Cierre",
    titulo: "Reevaluación formal post-capacitación y sesión de cierre",
    descripcion: `Sesión de evaluación formal de competencias con el supervisor y RH para medir el incremento del nivel y validar el cierre definitivo de las brechas.`,
    herramientas: "Matriz de evaluación de competencias, Rúbrica de niveles 1 a 5, Historial de entregables",
    entregable: "Evaluación post-capacitación registrada en la plataforma con evidencia de superación del nivel requerido",
    criterio: "Obtención de nivel igual o superior al requerido en la oportunidad.",
  });

  return { text, activities, modelVersion: "plantilla-local", source: "plantilla" };
}

async function executeAiCall(
  provider: ProviderConfig,
  system: string,
  user: string
): Promise<{ text: string; activities: ActivitySuggestion[] }> {
  const res = await fetch(`${provider.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify({
      model: provider.model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.3,
      max_tokens: 8192,
      response_format: { type: "json_object" },
    }),
    signal: AbortSignal.timeout(90000), // 90 s de timeout para modelos de razonamiento (GLM reasoning)
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${errBody || res.statusText}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content ?? "";
  const cleanContent = content
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const parsed = JSON.parse(cleanContent) as {
    recomendacion?: string;
    actividades?: Array<{
      orden?: number;
      fase?: string;
      titulo?: string;
      descripcion?: string;
      herramientas?: string;
      entregable?: string;
      criterio?: string;
    }>;
  };

  if (!parsed.recomendacion) throw new Error("Respuesta del modelo sin clave 'recomendacion'");

  // Función robusta para sanear cualquier campo cortado o con terminación trunca
  const sanitizeField = (raw: string, defaultEnding: string): string => {
    let t = (raw || "").trim();
    if (!t) return "";
    // Remover guiones o puntos suspensivos al final (ej: "con-", "de...", "con -")
    t = t.replace(/[\s-]+$/, "").replace(/\.{2,}$/, "").trim();

    if (/en un plazo m[aá]ximo de$/i.test(t)) {
      t += " 24 a 48 horas tras recibir la retroalimentación";
    } else if (/califica la facilitaci[oó]n con$/i.test(t)) {
      t += " un puntaje mínimo de 4/5 en la rúbrica de evaluación del equipo";
    } else if (/\b(con|de|en|para|a|por|sobre|un|una|el|la|los|las|del|al)$/i.test(t)) {
      t += ` ${defaultEnding}`;
    }
    if (!t.endsWith(".") && !t.endsWith("!") && !t.endsWith("?")) {
      t += ".";
    }
    return t;
  };

  const activities: ActivitySuggestion[] = (parsed.actividades ?? []).map((a, i) => {
    const orden = a.orden ?? i + 1;
    const fase = a.fase?.trim() || `Fase ${orden}`;
    const titulo = a.titulo?.trim() || "";
    const rawDesc = a.descripcion?.trim() || titulo;
    const rawHerramientas = a.herramientas?.trim() || "";
    const rawEntregable = a.entregable?.trim() || "";
    const rawCriterio = a.criterio?.trim() || "";

    return {
      orden,
      fase,
      titulo,
      descripcion: sanitizeField(rawDesc, "los estándares acordados"),
      herramientas: rawHerramientas,
      entregable: sanitizeField(rawEntregable, "evidencias documentadas en la plataforma"),
      criterio: sanitizeField(rawCriterio, "criterio de satisfacción y aprobación del evaluador"),
    };
  });

  return { text: parsed.recomendacion, activities };
}

export async function generateAiRecommendation(
  input: RecommendationInput
): Promise<AiRecommendation> {
  const { primary, secondary } = getProviders();

  // RNF-015: si la IA no está configurada, usar plantillas sin fallar
  if (!primary.apiKey && !secondary.apiKey) {
    return templateRecommendation(input);
  }

  const system =
    "Eres un consultor senior de Desarrollo Organizacional, Ingeniería de Software y Recursos Humanos especializado en diseñar Planes de Desarrollo Individual (PDI / PDP) de alto impacto.\n" +
    "Tu labor es diseñar un plan de desarrollo sumamente específico, riguroso, práctico y accionable para cerrar las brechas de competencias de un colaborador hacia una oportunidad laboral específica.\n\n" +
    "REGLAS CRÍTICAS DE CALIDAD Y DESGLOSE:\n" +
    "1. TOTALMENTE PROHIBIDO generar actividades genéricas o vagas (como 'Curso de Python', 'Aprender comunicación', 'Hacer ejercicios', 'Taller de liderazgo').\n" +
    "2. Cada actividad debe estar minuciosamente desglosada con los siguientes campos OBLIGATORIOS:\n" +
    "   - 'orden': número entero secuencial (1, 2, 3...).\n" +
    "   - 'fase': período cronológico estimado alineado al calendario de la oportunidad (ej. 'Fase 1: Fundamentos y Arquitectura [Semanas 1 a 4]').\n" +
    "   - 'titulo': título concreto, profesional y técnico de la actividad.\n" +
    "   - 'descripcion': metodología exacta y pasos prácticos que ejecutará el colaborador (redacta de 2 a 3 oraciones claras y concisas).\n" +
    "   - 'herramientas': tecnologías, librerías, estándares, frameworks o plataformas precisas (ej. 'FastAPI, PostgreSQL 16, Alembic, Docker, pytest-cov, GitHub Actions').\n" +
    "   - 'entregable': producto o evidencia tangible y verificable que el colaborador subirá a la plataforma (1 a 2 oraciones).\n" +
    "   - 'criterio': criterio objetivo de aprobación para el supervisor o evaluador técnico (1 a 2 oraciones con métrica o estándar exacto).\n" +
    "3. ENFOQUE 70-20-10: 70% proyectos y práctica real en el puesto, 20% mentoría / code reviews / retroalimentación, 10% formación técnica especializada.\n" +
    "4. CRONOGRAMA: Si se especifican fecha de apertura y fecha límite, distribuye las actividades progresivamente dentro de ese plazo.\n" +
    "5. La ÚLTIMA actividad debe ser siempre el 'Hito Final: Reevaluación formal post-capacitación y validación de cierre de brechas'.\n" +
    "6. Genera entre 3 y 4 actividades en total para asegurar profundidad sin saturar la respuesta.\n" +
    "7. COMPLETITUD Y REDACCIÓN: Cada descripción, entregable y criterio debe estar 100% redactado con oraciones completas y punto final. NUNCA cortes una oración, NUNCA termines con un guión ('-') ni dejes frases abiertas (por ejemplo 'en un plazo máximo de' o 'califica la facilitación con-'). Concluye siempre la idea con el valor numérico, plazo o métrica exacta.\n" +
    "8. Responde ÚNICAMENTE con un JSON válido con la forma:\n" +
    '{\n  "recomendacion": "Resumen ejecutivo del plan considerando plazos y metas (2-3 oraciones)",\n  "actividades": [\n    {\n      "orden": 1,\n      "fase": "...",\n      "titulo": "...",\n      "descripcion": "...",\n      "herramientas": "...",\n      "entregable": "...",\n      "criterio": "..."\n    }\n  ]\n}\n' +
    "No incluyas explicaciones ni texto fuera del bloque JSON.";

  const user = [
    `Empleado: ${input.employee}${input.position ? ` (Puesto actual: ${input.position})` : ""}${input.department ? ` [Departamento: ${input.department}]` : ""}`,
    `Oportunidad objetivo: ${input.opportunity}${input.opportunityType ? ` (Tipo: ${input.opportunityType})` : ""}`,
    input.opportunityDescription ? `Descripción de la oportunidad: ${input.opportunityDescription}` : "",
    input.openDate ? `Fecha de apertura: ${input.openDate}` : "",
    input.deadline ? `Fecha máxima para aplicar / plazo objetivo: ${input.deadline}` : "",
    input.vacancies ? `Vacantes disponibles: ${input.vacancies}` : "",
    "",
    "Brechas de competencias detectadas (nivel actual -> requerido):",
    ...input.gaps.map((g) => {
      const obligatoria = g.mandatory ? " [OBLIGATORIA]" : " [OPCIONAL]";
      const tipo = g.type ? ` (${g.type})` : "";
      const desc = g.description ? `: ${g.description}` : "";
      return `- ${g.competency}${tipo}${obligatoria}: nivel actual ${g.currentLevel} -> requerido ${g.requiredLevel}${desc}`;
    }),
    input.gaps.length === 0
      ? "No hay brechas detectadas; diseña actividades de consolidación, mentoría a otros colaboradores y optimización del perfil."
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  let lastError: Error | null = null;

  // 1. Intentar con Proveedor 1 si tiene API Key configurada
  if (primary.apiKey) {
    try {
      const result = await executeAiCall(primary, system, user);
      return {
        text: result.text,
        activities: result.activities,
        modelVersion: primary.model,
        source: "ia",
      };
    } catch (err: any) {
      lastError = err;
      console.warn(`[IA] Proveedor 1 (${primary.model}) falló: ${err?.message || err}.`);
    }
  }

  // 2. Si falló el Proveedor 1 (o no estaba configurado), intentar con Proveedor 2
  if (secondary.apiKey) {
    try {
      console.info(`[IA] Intentando con Proveedor 2 de respaldo (${secondary.model})...`);
      const result = await executeAiCall(secondary, system, user);
      return {
        text: result.text,
        activities: result.activities,
        modelVersion: `${secondary.model} (respaldo)`,
        source: "ia",
      };
    } catch (err: any) {
      console.error(`[IA Error] Proveedor 2 (${secondary.model}) falló: ${err?.message || err}.`);
      lastError = err;
    }
  }

  // 3. Si ambos fallan o se agotan las cuotas, usar plantilla estructurada de respaldo
  const fallback = templateRecommendation(input);
  fallback.modelVersion = `plantilla (fallo de IA: ${lastError?.message || "sin conexión"})`;
  return fallback;
}
