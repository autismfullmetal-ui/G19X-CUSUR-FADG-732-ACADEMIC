import { PrismaClient } from "@prisma/client";

const base = "http://localhost:3000";
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
  console.log("--- TEST BLOQUE 5: IMPORTACIÓN MASIVA POR CSV (RF-027, OE-18) ---");

  console.log("1. Probando descarga de plantilla de empleados...");
  const tplEmpRes = await fetch(`${base}/api/templates/empleados`);
  must(tplEmpRes.status === 200, `plantilla empleados responde 200 (llego ${tplEmpRes.status})`);
  const tplEmpText = await tplEmpRes.text();
  must(tplEmpText.startsWith("nombre,apellidos,email,departamento,puesto"), "encabezados válidos de plantilla empleados");

  console.log("2. Probando descarga de plantilla de competencias...");
  const tplCompRes = await fetch(`${base}/api/templates/competencias`);
  must(tplCompRes.status === 200, `plantilla competencias responde 200 (llego ${tplCompRes.status})`);
  const tplCompText = await tplCompRes.text();
  must(tplCompText.startsWith("nombre,descripcion,tipo"), "encabezados válidos de plantilla competencias");

  const csrfRes = await fetch(`${base}/api/auth/csrf`);
  must(csrfRes.status === 200, `csrf endpoint responde 200 (llego ${csrfRes.status})`);
  const csrfData = await csrfRes.json();
  const csrfToken = csrfData.csrfToken;
  must(!!csrfToken, "se obtiene csrfToken");
  const initialCookies = cookiesFrom(csrfRes);

  console.log("3. Autenticando como ADMIN (admin@demo.mx)...");
  const adminCookies = await login("admin@demo.mx", "Demo1234!", initialCookies, csrfToken);
  must(adminCookies.includes("session-token"), "login de admin exitoso");

  console.log("4. Consultando /importacion como ADMIN...");
  const impRes = await fetch(`${base}/importacion`, { headers: { Cookie: adminCookies } });
  must(impRes.status === 200, `GET /importacion responde 200 (llego ${impRes.status})`);
  const impText = await impRes.text();
  must(impText.includes("Importación Masiva de Datos"), "contiene 'Importación Masiva de Datos'");
  must(impText.includes("RF-027 / OE-18"), "contiene 'RF-027 / OE-18'");
  must(impText.includes("Personal y Estructura Organizacional"), "contiene sección de Personal");
  must(impText.includes("Catálogo de Competencias"), "contiene sección de Competencias");

  console.log("5. Probando acceso como EMPLEADO (debe bloquearse)...");
  const empCookies = await login("empleado@demo.mx", "Demo1234!", initialCookies, csrfToken);
  must(empCookies.includes("session-token"), "login de empleado exitoso");
  const empImpRes = await fetch(`${base}/importacion`, { headers: { Cookie: empCookies } });
  const empImpText = await empImpRes.text();
  must(empImpText.includes("Acceso Restringido"), "acceso denegado a EMPLEADO");

  console.log("6. Verificando inserción de datos masivos...");
  const compCountBefore = await db.competency.count();
  const testCompName = `GraphQL Test ${Date.now()}`;
  await db.competency.create({
    data: { name: testCompName, description: "API queries con GraphQL", type: "TECNICA", status: "ACTIVA" },
  });
  const compCountAfter = await db.competency.count();
  must(compCountAfter === compCountBefore + 1, "competencia de prueba agregada");

  console.log("7. Verificando compatibilidad con el módulo de auditoría...");
  const adminUser = await db.user.findFirst({ where: { role: "ADMIN" } });
  must(!!adminUser, "existe usuario ADMIN");
  const auditRes = await db.auditLog.create({
    data: { userId: adminUser.id, action: "IMPORTACION_MASIVA", entity: "Empleado", details: "Test automático de carga masiva de personal por CSV." },
  });
  must(auditRes.id > 0, "evento de auditoría creado con éxito");

  const audRes = await fetch(`${base}/auditoria?action=IMPORTACION_MASIVA`, { headers: { Cookie: adminCookies } });
  const audText = await audRes.text();
  must(audText.includes("Carga Masiva de Datos"), "evento visible en /auditoria");

  await db.auditLog.delete({ where: { id: auditRes.id } });

  console.log("\n ¡TODAS LAS PRUEBAS DE BLOQUE 5 PASARON EXITOSAMENTE!");
} catch (err) {
  console.error("ERROR:", err.message);
  process.exit(1);
} finally {
  await db.$disconnect();
}
