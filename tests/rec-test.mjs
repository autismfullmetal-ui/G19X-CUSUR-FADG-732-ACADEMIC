const base = "http://localhost:3000";

// Reiniciar: sin recomendación previa
const { PrismaClient } = await import("@prisma/client");
const db = new PrismaClient();
const target = await db.application.findFirst({ orderBy: { id: "desc" } });
const appId = target.id;
await db.recommendation.deleteMany({ where: { applicationId: appId } });

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

const detailUrl = `${base}/postulaciones/${appId}`;
const rhCookie = await login("rh@demo.mx", "Demo1234!");

// 1. Generar recomendación (sin clave -> ruta de plantillas, RNF-015)
let page = await fetch(detailUrl, { headers: { cookie: rhCookie } });
let html = await page.text();
let form =
  formNear(html, "Generar recomendación con IA") ??
  formNear(html, "Regenerar recomendación");
if (!form) {
  console.error("No se encontró el botón de generar recomendación");
  process.exit(1);
}
await submit(rhCookie, detailUrl, form);

const rec = await db.recommendation.findUnique({ where: { applicationId: appId } });
console.log("recomendación creada:", rec !== null);
console.log("origen (sin clave = plantilla):", rec.modelVersion, "(esperado plantilla-local)");
console.log("estado PROPUESTA:", rec.status === "PROPUESTA");
console.log("actividades sugeridas:", JSON.parse(rec.activities).length > 0);

// 2. Aprobar recomendación
page = await fetch(detailUrl, { headers: { cookie: rhCookie } });
html = await page.text();
form = formNear(html, "Aprobar recomendación");
if (!form) {
  console.error("No se encontró el botón de aprobar");
  process.exit(1);
}
await submit(rhCookie, detailUrl, form);
const rec2 = await db.recommendation.findUnique({ where: { applicationId: appId } });
console.log("aprobada:", rec2.status === "APROBADA", "| revisada por:", rec2.reviewedById !== null ? "RH" : "nadie");

// 3. El formulario del plan se precargará (al abrirlo) con las actividades aprobadas
page = await fetch(detailUrl, { headers: { cookie: rhCookie } });
html = await page.text();
const aprobadaConActividades =
  rec2.status === "APROBADA" && JSON.parse(rec2.activities).length > 0;
console.log(
  "prefil de actividades listo (se muestra al abrir el formulario):",
  aprobadaConActividades
);
console.log("botón de crear plan presente:", html.includes("Crear plan de desarrollo"));

await db.$disconnect();
