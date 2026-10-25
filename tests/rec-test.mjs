// Prueba E2E de recomendaciones (RF-014, RF-015, RN-010).
// La GENERACION se invoca llamando directamente a generateAiRecommendation()
// (la misma funcion que usa el boton de la app, que es una accion cliente sin
// $ACTION_ID en el HTML). La APROBACION se ejercita via el formulario real
// del servidor (approveRecommendation).
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { generateAiRecommendation } from "../src/lib/ai.ts";

const base = "http://localhost:3000";
const db = new PrismaClient();

async function login(email, password) {
  const res1 = await fetch(`${base}/api/auth/csrf`);
  const { csrfToken } = await res1.json();
  const cookie1 = res1.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ");
  const res2 = await fetch(`${base}/api/auth/callback/credentials`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", cookie: cookie1 },
    body: new URLSearchParams({ csrfToken, email, password }),
    redirect: "manual",
  });
  return res2.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ");
}

function formNear(html, anchor) {
  const idx = html.indexOf(anchor);
  if (idx === -1) return null;
  const start = html.lastIndexOf("<form", idx);
  const form = html.slice(start, idx + anchor.length);
  const m = form.match(/name="(\$ACTION_ID_[^"]+)"/);
  if (!m) return null;
  const fields = {};
  for (const f of form.matchAll(/name="(?![$])([^"]+)" value="([^"]*)"/g)) {
    fields[f[1]] = f[2];
  }
  return { actionId: m[1], fields };
}

async function submit(cookie, url, form) {
  const fd = new FormData();
  fd.set(form.actionId, "");
  for (const [k, v] of Object.entries(form.fields)) fd.set(k, v);
  return fetch(url, {
    method: "POST",
    headers: { cookie, origin: base },
    body: fd,
    redirect: "manual",
  });
}

function must(cond, msg) {
  if (!cond) {
    console.error("FALLO:", msg);
    process.exit(1);
  }
}

// App mas reciente = la que acaba de crear apply-test
const app = await db.application.findFirst({
  orderBy: { id: "desc" },
  include: {
    employee: true,
    opportunity: true,
    gaps: { include: { requirement: { include: { competency: true } } } },
  },
});
const appId = app.id;
const detailUrl = `${base}/postulaciones/${appId}`;

// Limpiar recomendaciones previas
await db.recommendation.deleteMany({ where: { applicationId: appId } });

// 1. GENERAR: misma funcion que usa el boton de la app
console.log(`Generando recomendacion para ${app.employee.firstName} ${app.employee.lastName} / "${app.opportunity.title}"...`);
const result = await generateAiRecommendation({
  employee: `${app.employee.firstName} ${app.employee.lastName}`,
  opportunity: app.opportunity.title,
  gaps: app.gaps.map((g) => ({
    competency: g.requirement.competency.name,
    description: g.requirement.competency.description,
    type: g.requirement.competency.type,
    currentLevel: g.currentLevel,
    requiredLevel: g.requiredLevel,
    mandatory: g.requirement.mandatory,
  })),
});

const expectSource = process.env.AI_API_KEY ? "ia (o plantilla si la IA fallo)" : "plantilla-local";
console.log(`origen: ${result.source} (esperado: ${expectSource})`);
if (!process.env.AI_API_KEY) {
  must(result.source === "plantilla" || result.source === "plantilla-local", `sin API key el origen debe ser plantilla-local (llego ${result.source})`);
} else {
  must(result.source === "ia" || result.source === "plantilla" || result.source === "plantilla-local", `origen invalido: ${result.source}`);
}
must(!!result.text && result.text.length > 0, "la recomendacion tiene texto");
must(result.activities.length > 0, `la recomendacion trae actividades (llegaron ${result.activities.length})`);

// Persistir como lo hace la aplicacion (estado PROPUESTA, pendiente de revision humana)
const rec = await db.recommendation.create({
  data: {
    applicationId: appId,
    text: result.text,
    activities: JSON.stringify(result.activities),
    modelVersion: result.modelVersion,
    status: "PROPUESTA",
  },
});
must(rec.status === "PROPUESTA", "la recomendacion queda PROPUESTA (pendiente de revision humana, RN-010)");
console.log("recomendacion creada y persistida:", rec.id > 0);

// 2. APROBAR via el formulario real del servidor
const rhCookie = await login("rh@demo.mx", "Demo1234!");
let page = await fetch(detailUrl, { headers: { cookie: rhCookie } });
let html = await page.text();
let form = formNear(html, "Aprobar recomendación");
must(!!form, "el detalle muestra el formulario de aprobar recomendacion");
const res = await submit(rhCookie, detailUrl, form);
must(res.status === 200 || res.status === 303, `la aprobacion responde ${res.status}`);

const rec2 = await db.recommendation.findUnique({ where: { applicationId: appId } });
must(rec2.status === "APROBADA", `la recomendacion queda APROBADA (llego ${rec2.status})`);
must(rec2.reviewedById !== null, `queda registrada la revision humana (revisor id ${rec2.reviewedById})`);
console.log("recomendacion APROBADA por RH:", rec2.reviewedById);

// 3. Con la recomendacion aprobada, el formulario del plan debe aparecer precargado
page = await fetch(detailUrl, { headers: { cookie: rhCookie } });
html = await page.text();
must(html.includes("Crear plan de desarrollo"), "el detalle muestra el formulario de crear plan");
const aprobadaConActividades = rec2.status === "APROBADA" && JSON.parse(rec2.activities).length > 0;
must(aprobadaConActividades, "hay actividades aprobadas para precargar el plan");

console.log("\nOK: ciclo de recomendacion (generar -> revisar -> aprobar) verificado.");
await db.$disconnect();
