// Prueba E2E del flujo de postulacion (RF-010..RF-013, RN-001).
// Selecciona dinamicamente una oportunidad PUBLICADA (con brechas para el
// empleado si existe), calcula la compatibilidad esperada con la misma
// funcion que usa la aplicacion y verifica pantalla + base de datos.
import { PrismaClient } from "@prisma/client";
import { calcCompatibility } from "../src/lib/compatibility.ts";

const base = "http://localhost:3000";
const db = new PrismaClient();

function must(cond, msg) {
  if (!cond) {
    console.error("FALLO:", msg);
    process.exit(1);
  }
}

function cookiesFrom(res) {
  return res.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
}

async function login(email, password) {
  const r1 = await fetch(`${base}/api/auth/csrf`);
  const { csrfToken } = await r1.json();
  const r2 = await fetch(`${base}/api/auth/callback/credentials`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", cookie: cookiesFrom(r1) },
    body: new URLSearchParams({ csrfToken, email, password }),
    redirect: "manual",
  });
  const cookie = cookiesFrom(r2);
  return cookie.includes("session-token") ? cookie : null;
}

try {
  // 1. Elegir oportunidad PUBLICADA (preferente: una con brechas para Elena)
  const user = await db.user.findUnique({ where: { email: "empleado@demo.mx" } });
  const employee = await db.employee.findUnique({ where: { userId: user.id } });
  must(!!employee, "existe la ficha de empleado del usuario empleado@demo.mx");

  const opps = await db.opportunity.findMany({
    where: { status: "PUBLICADA" },
    include: { requirements: { include: { competency: true } } },
    orderBy: { id: "asc" },
  });
  must(opps.length > 0, "hay oportunidades PUBLICADAS en la base de datos");

  const levels = new Map(
    (await db.employeeCompetency.findMany({ where: { employeeId: employee.id } }))
      .map((ec) => [ec.competencyId, ec.level])
  );

  let chosen = null;
  let expected = null;
  for (const opp of opps) {
    const reqs = opp.requirements.map((r) => ({
      competencyId: r.competencyId,
      requiredLevel: r.requiredLevel,
      weight: r.weight,
      mandatory: r.mandatory,
    }));
    const currents = opp.requirements.map((r) => ({
      competencyId: r.competencyId,
      level: levels.get(r.competencyId) ?? 0,
    }));
    const result = calcCompatibility(reqs, currents);
    if (!chosen || (result.gaps.length > 0 && expected.gaps.length === 0)) {
      chosen = opp;
      expected = result;
      if (result.gaps.length > 0) break;
    }
  }
  console.log(`Oportunidad elegida: #${chosen.id} ${chosen.title}`);
  console.log(`Compatibilidad esperada: ${expected.compatibility}% | Brechas esperadas: ${expected.gaps.length}`);

  // 2. Limpiar postulaciones previas del empleado en ESA oportunidad
  await db.gap.deleteMany({ where: { application: { opportunityId: chosen.id, employeeId: employee.id } } });
  await db.application.deleteMany({ where: { opportunityId: chosen.id, employeeId: employee.id } });

  // 3. Login y localizacion del formulario Postularme de ESA oportunidad
  const cookie = await login("empleado@demo.mx", "Demo1234!");
  must(!!cookie, "login del empleado con Demo1234!");

  const page = await fetch(`${base}/oportunidades`, { headers: { cookie } });
  const html = await page.text();
  const escapedTitle = chosen.title.replaceAll("&", "&amp;");
  let idx = html.indexOf(escapedTitle);
  if (idx === -1) idx = html.indexOf(chosen.title);
  must(idx !== -1, `la oportunidad "${chosen.title}" aparece en /oportunidades`);
  const actionId = html.slice(idx, idx + 4000).match(/name="(\$ACTION_ID_[^"]+)"/)?.[1];
  must(!!actionId, "existe formulario Postularme para la oportunidad elegida");

  function postForm() {
    const fd = new FormData();
    fd.set(actionId, "");
    fd.set("opportunityId", String(chosen.id));
    return fetch(`${base}/oportunidades`, {
      method: "POST",
      headers: { cookie, origin: base },
      body: fd,
      redirect: "manual",
    });
  }

  // 4. Postular
  const res = await postForm();
  console.log("postulacion status:", res.status, "(esperado 303)");
  must(res.status === 303, "la postulacion responde 303");
  const location = res.headers.get("location") ?? "";
  must(location.includes("/postulaciones/"), `redirige al detalle de la postulacion (location=${location || "(vacio)"})`);

  // 5. RN-001: la segunda postulacion a la misma oportunidad se bloquea
  const res2 = await postForm();
  const loc2 = res2.headers.get("location") ?? "";
  must(loc2.includes("error="), `RN-001: la postulacion duplicada se bloquea (location=${loc2 || "(vacio)"})`);

  // 6. Detalle de la postulacion
  const appId = location.split("/postulaciones/")[1]?.split("?")[0];
  must(!!appId, "se puede extraer el id de la postulacion de la redireccion");
  const detail = await fetch(`${base}/postulaciones/${appId}`, { headers: { cookie } });
  console.log("detalle status:", detail.status, "(esperado 200)");
  must(detail.status === 200, "el detalle de la postulacion responde 200");
  const detailHtml = await detail.text();
  console.log("detalle muestra brechas:", detailHtml.includes("Brecha de"));

  // 7. Verificacion en base de datos
  const app = await db.application.findFirst({
    where: { opportunityId: chosen.id, employeeId: employee.id },
    include: { gaps: { include: { requirement: { include: { competency: true } } } } },
    orderBy: { id: "desc" },
  });
  must(!!app, "la postulacion quedo registrada en la base de datos");
  must(app.compatibility === expected.compatibility, `compatibilidad en BD = ${expected.compatibility} (llego ${app.compatibility})`);
  must(app.gaps.length === expected.gaps.length, `brechas en BD = ${expected.gaps.length} (llegaron ${app.gaps.length})`);
  for (const g of app.gaps) {
    console.log(`  brecha: ${g.requirement.competency.name} ${g.currentLevel} -> ${g.requiredLevel}`);
  }

  console.log("\nOK: flujo de postulacion verificado de extremo a extremo.");
} catch (err) {
  console.error("ERROR:", err.message);
  process.exit(1);
} finally {
  await db.$disconnect();
}
