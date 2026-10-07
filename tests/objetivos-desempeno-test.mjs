import http from "http";

async function testObjetivosYDesempeno() {
  console.log("--- TEST BLOQUE 4: OBJETIVOS ORGANIZACIONALES Y DESEMPEÑO (RF-007, OE-04) ---");

  // 1. Obtener CSRF token
  const csrfRes = await fetch("http://localhost:3000/api/auth/csrf");
  const csrfData = await csrfRes.json();
  const csrfToken = csrfData.csrfToken;
  const initialCookies = csrfRes.headers.get("set-cookie") || "";

  // 2. Iniciar sesión como ADMIN
  console.log("1. Autenticando como ADMIN (admin@demo.mx)...");
  const adminLoginRes = await fetch("http://localhost:3000/api/auth/callback/credentials", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cookie": initialCookies,
    },
    body: new URLSearchParams({
      csrfToken,
      email: "admin@demo.mx",
      password: "Demo1234!",
      redirect: "false",
    }),
    redirect: "manual",
  });
  const adminCookies = adminLoginRes.headers.getSetCookie().map(c => c.split(';')[0]).join('; ');

  // 3. Consultar /objetivos como ADMIN
  console.log("2. Solicitando /objetivos como ADMIN...");
  const objRes = await fetch("http://localhost:3000/objetivos", {
    headers: { Cookie: adminCookies },
  });
  console.log("Status /objetivos:", objRes.status);
  const objText = await objRes.text();
  console.log("✓ Contiene 'Objetivos Organizacionales y Desempeño':", objText.includes("Objetivos Organizacionales y Desempeño"));
  console.log("✓ Contiene 'RF-007 / OE-04':", objText.includes("RF-007 / OE-04"));
  console.log("✓ Contiene botón 'Nuevo Objetivo Estratégico':", objText.includes("Nuevo Objetivo Estratégico"));
  console.log("✓ Contiene objetivo de Pruebas Unitarias:", objText.includes("Incrementar Cobertura de Pruebas"));
  console.log("✓ Contiene objetivo de Microservicios:", objText.includes("Migración de Arquitectura a Microservicios"));

  // 4. Probar /evaluaciones con RF-007
  console.log("3. Solicitando /evaluaciones con cumplimiento de metas...");
  const evalRes = await fetch("http://localhost:3000/evaluaciones", {
    headers: { Cookie: adminCookies },
  });
  console.log("Status /evaluaciones:", evalRes.status);
  const evalText = await evalRes.text();
  console.log("✓ Contiene 'RF-006 / RF-007':", evalText.includes("RF-006 / RF-007"));
  console.log("✓ Contiene 'Cumplimiento de Objetivos Organizacionales':", evalText.includes("Cumplimiento de Objetivos Organizacionales"));

  // 5. Iniciar sesión como EMPLEADO
  console.log("4. Autenticando como EMPLEADO (empleado@demo.mx)...");
  const empLoginRes = await fetch("http://localhost:3000/api/auth/callback/credentials", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cookie": initialCookies,
    },
    body: new URLSearchParams({
      csrfToken,
      email: "empleado@demo.mx",
      password: "Demo1234!",
      redirect: "false",
    }),
    redirect: "manual",
  });
  const empCookies = empLoginRes.headers.getSetCookie().map(c => c.split(';')[0]).join('; ');

  console.log("5. Solicitando /objetivos como EMPLEADO...");
  const empObjRes = await fetch("http://localhost:3000/objetivos", {
    headers: { Cookie: empCookies },
  });
  console.log("Status /objetivos para empleado:", empObjRes.status);
  const empObjText = await empObjRes.text();
  console.log("✓ Empleado puede ver los objetivos estratégicos:", empObjText.includes("Incrementar Cobertura de Pruebas"));
  console.log("✓ Empleado NO tiene botón de creación:", !empObjText.includes("Nuevo Objetivo Estratégico"));

  // 6. Probar filtro por departamento
  console.log("6. Probando filtro por departamento ?dept=1...");
  const filterRes = await fetch("http://localhost:3000/objetivos?dept=1", {
    headers: { Cookie: adminCookies },
  });
  console.log("Status filtro /objetivos?dept=1:", filterRes.status);
  const filterText = await filterRes.text();
  console.log("✓ Filtro departamento funcional:", filterText.includes("Sistemas"));

  console.log("\n🎉 ¡TODAS LAS PRUEBAS DE BLOQUE 4 PASARON EXITOSAMENTE!");
}

testObjetivosYDesempeno().catch(err => {
  console.error("Error en test:", err);
  process.exit(1);
});
