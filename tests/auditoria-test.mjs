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
    body: new URLSearchParams({ csrfToken, email, password, redirect: "false", callbackUrl: `${base}/auditoria` }),
    redirect: "manual",
  });
  return cookiesFrom(res);
}

try {
  console.log("1. Autenticando vía NextAuth Credentials Provider...");

  const csrfRes = await fetch(`${base}/api/auth/csrf`);
  must(csrfRes.status === 200, `csrf endpoint responde 200 (llego ${csrfRes.status})`);
  const csrfData = await csrfRes.json();
  const csrfToken = csrfData.csrfToken;
  must(!!csrfToken, "se obtiene csrfToken");
  const initialCookies = cookiesFrom(csrfRes);

  console.log("CSRF token obtenido: ✓");

  const sessionCookieHeader = await login("admin@demo.mx", "Demo1234!", initialCookies, csrfToken);
  must(sessionCookieHeader.includes("session-token"), "login de admin exitoso");

  console.log("2. Solicitando /auditoria como ADMIN...");
  const audRes = await fetch(`${base}/auditoria`, { headers: { Cookie: sessionCookieHeader } });
  must(audRes.status === 200, `GET /auditoria responde 200 (llego ${audRes.status})`);
  const text = await audRes.text();
  must(text.includes("Registro de Auditoría y Trazabilidad"), "contiene 'Registro de Auditoría y Trazabilidad'");
  must(text.includes("RF-026 / OE-17"), "contiene 'RF-026 / OE-17'");
  must(text.includes("Alta Empleado") || text.includes("CREAR_EMPLEADO"), "contiene 'CREAR_EMPLEADO' o 'Alta Empleado'");
  must(text.includes("Total de Eventos Registrados"), "contiene 'Total de Eventos Registrados'");

  console.log("4. Probando acceso como EMPLEADO (debe bloquearse)...");
  const empCookies = await login("empleado@demo.mx", "Demo1234!", initialCookies, csrfToken);
  must(empCookies.includes("session-token"), "login de empleado exitoso");
  const empAudRes = await fetch(`${base}/auditoria`, { headers: { Cookie: empCookies } });
  const empText = await empAudRes.text();
  must(empText.includes("Acceso Restringido"), "bloqueo de empleado efectivo");

  console.log("\n ¡TODAS LAS PRUEBAS DE AUDITORÍA PASARON EXITOSAMENTE!");
} catch (err) {
  console.error("ERROR:", err.message);
  process.exit(1);
}
