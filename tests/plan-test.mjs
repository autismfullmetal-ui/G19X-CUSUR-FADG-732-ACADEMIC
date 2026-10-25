// Prueba E2E del flujo de planes (RF-017, RF-018, RN-010).
// El formulario de creacion vive tras un toggle de cliente (no aparece en el
// HTML SSR), asi que la creacion se hace via Prisma replicando el efecto del
// action; la APROBACION y el AVANCE DE ACTIVIDADES se ejercitan con los
// formularios reales del servidor ($ACTION_ID).
const base = "http://localhost:3000";

const { PrismaClient } = await import("@prisma/client");
const db = new PrismaClient();

function must(cond, msg) {
  if (!cond) {
    console.error("FALLO:", msg);
    process.exit(1);
  }
}

function cookiesFrom(res) {
  const c = res.headers.getSetCookie();
  if (c && c.length) return c.map((x) => x.split(";")[0]).join("; ");
  const single = res.headers.get("set-cookie");
  return single ? single.split(";")[0] : "";
}

async function login(email, password) {
  const res1 = await fetch(`${base}/api/auth/csrf`);
  must(res1.status === 200, `csrf endpoint responde 200 (llego ${res1.status})`);
  const { csrfToken } = await res1.json();
  must(!!csrfToken, "se obtiene csrfToken");
  const cookie1 = cookiesFrom(res1);
  const res2 = await fetch(`${base}/api/auth/callback/credentials`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", cookie: cookie1 },
    body: new URLSearchParams({ csrfToken, email, password }),
    redirect: "manual",
  });
  must(res2.status === 302, `login responde 302 (llego ${res2.status})`);
  const cookie = cookiesFrom(res2);
  must(cookie.includes("session-token"), "se obtiene cookie de sesion");
  return cookie;
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

// App mas reciente = la que usaron apply-test y rec-test
const target = await db.application.findFirst({
  orderBy: { id: "desc" },
  include: { employee: true, opportunity: true, recommendation: true },
});
const appId = target.id;
const detailUrl = `${base}/postulaciones/${appId}`;
must(!!target, "existe la postulacion creada por apply-test");
must(target.recommendation && target.recommendation.status === "APROBADA",
  "la recomendacion de la postulacion esta APROBADA (rec-test la aprobo)");

try {
  // Reset: sin plan previo
await db.planActivity.deleteMany({ where: { plan: { applicationId: appId } } });
await db.developmentPlan.deleteMany({ where: { applicationId: appId } });

const admin = await db.user.findFirst({ where: { role: "ADMIN" } });
must(!!admin, "existe usuario ADMIN");

// 1. La pagina muestra el punto de entrada del plan para RH
const rhCookie = await login("rh@demo.mx", "Demo1234!");
let page = await fetch(detailUrl, { headers: { cookie: rhCookie } });
must(page.status === 200, `el detalle responde 200 para RH (llego ${page.status})`);
let html = await page.text();
must(html.includes("Crear plan de desarrollo"), "el detalle muestra el boton Crear plan de desarrollo para RH");

// 2. Crear el plan (PROPUESTO) replicando el efecto del formulario
const plan = await db.developmentPlan.create({
  data: {
    employeeId: target.employeeId,
    applicationId: appId,
    title: "Plan de cierre de brechas",
    objective: `Alcanzar los niveles requeridos para ${target.opportunity.title}`,
    status: "PROPUESTO",
    createdById: admin.id,
    activities: {
      create: [
        { description: "Curso de SQL intermedio", order: 1, status: "PENDIENTE" },
        { description: "Proyecto practico de analitica", order: 2, status: "PENDIENTE" },
        { description: "Reevaluacion de competencias", order: 3, status: "PENDIENTE" },
      ],
    },
  },
  include: { activities: { orderBy: { order: "asc" } } },
});
must(plan.status === "PROPUESTO", `el plan nace PROPUESTO (llego ${plan.status})`);
must(plan.activities.length === 3, `el plan nace con 3 actividades (llegaron ${plan.activities.length})`);
console.log(`plan creado: ${plan.title} (id ${plan.id})`);

// 3. RH ve el plan en la pagina y lo APRUEBA con el formulario real
page = await fetch(detailUrl, { headers: { cookie: rhCookie } });
must(page.status === 200, `el detalle responde 200 para RH al aprobar (llego ${page.status})`);
html = await page.text();
must(html.includes(plan.title), "el detalle muestra el plan creado");
let form = formNear(html, "Aprobar plan");
must(!!form, "existe el formulario real de Aprobar plan");
let res = await submit(rhCookie, detailUrl, form);
must(res.status === 200 || res.status === 303, `la aprobacion responde ${res.status}`);

const aprobado = await db.developmentPlan.findUnique({
  where: { applicationId: appId },
  include: { activities: { orderBy: { order: "asc" } } },
});
must(aprobado.status === "APROBADO", `el plan queda APROBADO (llego ${aprobado.status})`);
must(aprobado.approvedById !== null, `queda registrado quien aprobo (id ${aprobado.approvedById})`);
console.log("plan APROBADO por RH:", aprobado.approvedById);

// 4. El empleado INICIA la primera actividad con su formulario real (PENDIENTE -> EN_PROGRESO)
const empCookie = await login("empleado@demo.mx", "Demo1234!");
page = await fetch(detailUrl, { headers: { cookie: empCookie } });
must(page.status === 200, `el detalle responde 200 para empleado (llego ${page.status})`);
html = await page.text();
form = formNear(html, "Iniciar actividad");
must(!!form, "el empleado ve el boton Iniciar actividad");
res = await submit(empCookie, detailUrl, form);
must(res.status === 200 || res.status === 303, `la actualizacion responde ${res.status}`);

const act1 = await db.planActivity.findUnique({ where: { id: aprobado.activities[0].id } });
must(act1.status === "EN_PROGRESO", `la actividad 1 queda EN_PROGRESO (llego ${act1.status})`);
console.log("actividad 1 EN_PROGRESO iniciada por el empleado");

// 5. Verificacion final en BD
const final = await db.developmentPlan.findUnique({
  where: { applicationId: appId },
  include: { activities: { orderBy: { order: "asc" } } },
});
console.log("BD — estado del plan:", final.status, "(esperado EN_PROGRESO)");
console.log("BD — actividades:", final.activities.map((a) => a.status).join(","));
console.log("BD — aprobado por RH:", final.approvedById !== null ? "si" : "no");
must(final.status === "EN_PROGRESO", "el plan pasa a EN_PROGRESO al iniciar una actividad");

console.log("\nOK: ciclo de plan (crear -> aprobar -> avanzar actividad) verificado.");
} catch (err) {
  console.error("ERROR EN PRUEBA:", err.message);
  process.exit(1);
} finally {
  await db.$disconnect();
}
