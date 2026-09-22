const base = "http://localhost:3000";

// Reiniciar estado del plan
const { PrismaClient } = await import("@prisma/client");
const db = new PrismaClient();
const target = await db.application.findFirst({ orderBy: { id: "desc" } });
const appId = target.id;
await db.planActivity.deleteMany({ where: { plan: { applicationId: appId } } });
await db.developmentPlan.deleteMany({ where: { applicationId: appId } });

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

// Encuentra el formulario (action id + campos) cercano a un texto ancla
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

async function submit(cookie, url, form, extra = {}) {
  const fd = new FormData();
  fd.set(form.actionId, "");
  for (const [k, v] of Object.entries({ ...form.fields, ...extra })) {
    fd.set(k, v);
  }
  return fetch(url, {
    method: "POST",
    headers: { cookie, origin: base },
    body: fd,
    redirect: "manual",
  });
}

const detailUrl = `${base}/postulaciones/${appId}`;

// 1. RH crea el plan
const rhCookie = await login("rh@demo.mx", "Demo1234!");
let page = await fetch(detailUrl, { headers: { cookie: rhCookie } });
let html = await page.text();
let form = formNear(html, "Crear plan (PROPUESTO)");
if (!form) {
  console.error("No se encontró el formulario de crear plan");
  process.exit(1);
}
let res = await submit(rhCookie, detailUrl, form, {
  applicationId: String(appId),
  title: "Plan de cierre de brechas",
  objective: "Alcanzar nivel requerido en Python y SQL",
  activities: "Curso de SQL intermedio\nProyecto práctico de analítica\nReevaluación",
});
console.log("crear plan:", res.status === 303 && res.headers.get("location")?.includes("?plan=") ? "OK" : `FALLO (${res.status})`);

// 2. RH aprueba el plan
page = await fetch(detailUrl, { headers: { cookie: rhCookie } });
html = await page.text();
form = formNear(html, "Aprobar plan");
if (!form) {
  console.error("No se encontró el botón de aprobar");
  process.exit(1);
}
res = await submit(rhCookie, detailUrl, form);
console.log("aprobar plan:", res.status === 200 ? "OK" : `FALLO (${res.status})`);

// 3. Empleado completa la primera actividad
const empCookie = await login("empleado@demo.mx", "Demo1234!");
page = await fetch(detailUrl, { headers: { cookie: empCookie } });
html = await page.text();
form = formNear(html, "Actualizar");
if (!form) {
  console.error("No se encontró el control de actividad");
  process.exit(1);
}
res = await submit(empCookie, detailUrl, form, { status: "COMPLETADA" });
console.log("actualizar actividad:", res.status === 200 ? "OK" : `FALLO (${res.status})`);

// 4. Verificar en BD
const plan = await db.developmentPlan.findUnique({
  where: { applicationId: appId },
  include: { activities: { orderBy: { order: "asc" } } },
});
console.log("BD — estado del plan:", plan.status, "(esperado APROBADO)");
console.log("BD — actividades:", plan.activities.map((a) => a.status).join(","));
console.log("BD — aprobado por RH:", plan.approvedById !== null ? "sí" : "no");
await db.$disconnect();
