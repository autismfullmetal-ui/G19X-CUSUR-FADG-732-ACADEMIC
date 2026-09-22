const base = "http://localhost:3000";

// Reiniciar estado: eliminar postulaciones previas de la oportunidad 1
const { PrismaClient } = await import("@prisma/client");
const db0 = new PrismaClient();
await db0.gap.deleteMany({ where: { application: { opportunityId: 1 } } });
await db0.application.deleteMany({ where: { opportunityId: 1 } });
await db0.$disconnect();

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

const cookie = await login("empleado@demo.mx", "Demo1234!");

// Localizar el action id del formulario "Postularme"
const page = await fetch(`${base}/oportunidades`, { headers: { cookie } });
const html = await page.text();
const before = html.slice(0, html.indexOf("Postularme") + 12);
const ids = [...before.matchAll(/name="(\$ACTION_ID_[^"]+)"/g)].map((m) => m[1]);
const actionId = ids.at(-1);
if (!actionId) {
  console.error("No se encontró el formulario de postulación (¿ya postulaste antes?)");
  process.exit(1);
}

function postForm() {
  const fd = new FormData();
  fd.set(actionId, "");
  fd.set("opportunityId", "1");
  return fetch(`${base}/oportunidades`, {
    method: "POST",
    headers: { cookie, origin: base },
    body: fd,
    redirect: "manual",
  });
}

// Enviar el formulario (POST progresivo, multipart como el navegador)
const res = await postForm();
const location = res.headers.get("location") ?? "";
console.log("postulación status:", res.status, "(esperado 303)");
console.log("redirige a detalle:", location.includes("/postulaciones/"));

// RN-001: segunda postulación debe rechazarse
await fetch(`${base}/oportunidades`, { headers: { cookie } });
const res2 = await postForm();
const loc2 = res2.headers.get("location") ?? "";
console.log("RN-001 duplicada bloqueada:", loc2.includes("error=duplicada"));

// Detalle de la postulación con brechas
const appId = location.split("/postulaciones/")[1];
const detail = await fetch(`${base}/postulaciones/${appId}`, { headers: { cookie } });
const detailHtml = await detail.text();
console.log("detalle status:", detail.status, "(esperado 200)");
console.log("muestra brecha:", detailHtml.includes("Brecha de"));
console.log(
  "muestra compatibilidad:",
  /Compatibilidad:\s*(<!-- -->)?\d+(<!-- -->)?%/.test(detailHtml)
);
console.log("muestra sección IA:", detailHtml.includes("Recomendación de IA"));

// Verificar estado en base de datos
const app = await db0.application.findFirst({
  where: { opportunityId: 1 },
  include: { gaps: true },
  orderBy: { id: "desc" },
});
console.log(
  "BD — compatibilidad:",
  app.compatibility,
 "(esperado 75) | brechas registradas:",
  app.gaps.length,
  "(esperado 2: Python y SQL)"
);
await db0.$disconnect();
