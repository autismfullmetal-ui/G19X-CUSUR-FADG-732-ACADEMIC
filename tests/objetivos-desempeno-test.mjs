const base = "http://localhost:3000";

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

async function login(email, password, initialCookies, csrfToken) {
  const res = await fetch(`${base}/api/auth/callback/credentials`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Cookie: initialCookies },
    body: new URLSearchParams({ csrfToken, email, password, redirect: "false" }),
    redirect: "manual",
  });
  return cookiesFrom(res);
}

try {
  console.log("--- TEST BLOQUE 4: OBJETIVOS ORGANIZACIONALES Y DESEMPEÑO (RF-007, OE-04) ---");

  const csrfRes = await fetch(`${base}/api/auth/csrf`);
  must(csrfRes.status === 200, `csrf endpoint responde 200 (llego ${csrfRes.status})`);
  const csrfData = await csrfRes.json();
  const csrfToken = csrfData.csrfToken;
  must(!!csrfToken, "se obtiene csrfToken");
  const initialCookies = cookiesFrom(csrfRes);

  console.log("1. Autenticando como ADMIN (admin@demo.mx)...");
  const adminCookies = await login("admin@demo.mx", "Demo1234!", initialCookies, csrfToken);
  must(adminCookies.includes("session-token"), "login de admin exitoso");

  console.log("2. Solicitando /objetivos como ADMIN...");
  const objRes = await fetch(`${base}/objetivos`, { headers: { Cookie: adminCookies } });
  console.log("Status /objetivos:", objRes.status);
  must(objRes.status === 200, `GET /objetivos responde 200 (llego ${objRes.status})`);
  const objText = await objRes.text();
  must(objText.includes("Objetivos Organizacionales y Desempeño"), "contiene 'Objetivos Organizacionales y Desempeño'");
  must(objText.includes("RF-007 / OE-04"), "contiene 'RF-007 / OE-04'");
  must(objText.includes("Nuevo Objetivo Estratégico"), "contiene botón 'Nuevo Objetivo Estratégico'");
  must(objText.includes("Incrementar Cobertura de Pruebas"), "contiene objetivo de Pruebas Unitarias");
  must(objText.includes("Migración de Arquitectura a Microservicios"), "contiene objetivo de Microservicios");

  console.log("3. Solicitando /evaluaciones con cumplimiento de metas...");
  const evalRes = await fetch(`${base}/evaluaciones`, { headers: { Cookie: adminCookies } });
  console.log("Status /evaluaciones:", evalRes.status);
  must(evalRes.status === 200, `GET /evaluaciones responde 200 (llego ${evalRes.status})`);
  const evalText = await evalRes.text();
  must(evalText.includes("RF-006 / RF-007"), "contiene 'RF-006 / RF-007'");
  must(evalText.includes("Cumplimiento de Objetivos Organizacionales"), "contiene 'Cumplimiento de Objetivos Organizacionales'");

  console.log("4. Autenticando como EMPLEADO (empleado@demo.mx)...");
  const empCookies = await login("empleado@demo.mx", "Demo1234!", initialCookies, csrfToken);
  must(empCookies.includes("session-token"), "login de empleado exitoso");

  console.log("5. Solicitando /objetivos como EMPLEADO...");
  const empObjRes = await fetch(`${base}/objetivos`, { headers: { Cookie: empCookies } });
  console.log("Status /objetivos para empleado:", empObjRes.status);
  must(empObjRes.status === 200, `GET /objetivos (empleado) responde 200 (llego ${empObjRes.status})`);
  const empObjText = await empObjRes.text();
  must(empObjText.includes("Incrementar Cobertura de Pruebas"), "empleado puede ver los objetivos estratégicos");
  must(!empObjText.includes("Nuevo Objetivo Estratégico"), "empleado NO tiene botón de creación");

  console.log("6. Probando filtro por departamento ?dept=1...");
  const filterRes = await fetch(`${base}/objetivos?dept=1`, { headers: { Cookie: adminCookies } });
  console.log("Status filtro /objetivos?dept=1:", filterRes.status);
  must(filterRes.status === 200, `GET /objetivos?dept=1 responde 200 (llego ${filterRes.status})`);
  const filterText = await filterRes.text();
  must(filterText.includes("Sistemas"), "filtro por departamento funcional");

  console.log("\n ¡TODAS LAS PRUEBAS DE BLOQUE 4 PASARON EXITOSAMENTE!");
} catch (err) {
  console.error("ERROR:", err.message);
  process.exit(1);
}
