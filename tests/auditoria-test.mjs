import http from "http";

async function testAuditoria() {
  console.log("1. Autenticando vía NextAuth Credentials Provider...");
  
  // Obtenemos CSRF token
  const csrfRes = await fetch("http://localhost:3000/api/auth/csrf");
  const csrfData = await csrfRes.json();
  const csrfToken = csrfData.csrfToken;
  const cookies = csrfRes.headers.get("set-cookie") || "";
  console.log("CSRF token obtenido:", csrfToken ? "✓" : "✗");

  // Iniciar sesión como ADMIN
  const loginRes = await fetch("http://localhost:3000/api/auth/callback/credentials", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cookie": cookies,
    },
    body: new URLSearchParams({
      csrfToken,
      email: "admin@demo.mx",
      password: "Demo1234!",
      redirect: "false",
      callbackUrl: "http://localhost:3000/auditoria",
    }),
    redirect: "manual",
  });

  const setCookies = loginRes.headers.getSetCookie();
  const sessionCookieHeader = setCookies.map(c => c.split(';')[0]).join('; ');
  console.log("Login response status:", loginRes.status);
  console.log("Cookies recibidas:", sessionCookieHeader);

  // Probar /auditoria
  console.log("2. Solicitando /auditoria como ADMIN...");
  const audRes = await fetch("http://localhost:3000/auditoria", {
    headers: {
      "Cookie": sessionCookieHeader,
    },
  });
  console.log("Status /auditoria:", audRes.status);
  const text = await audRes.text();
  console.log("Contiene 'Registro de Auditoría y Trazabilidad':", text.includes("Registro de Auditoría y Trazabilidad"));
  console.log("Contiene 'RF-026 / OE-17':", text.includes("RF-026 / OE-17"));
  console.log("Contiene 'CREAR_EMPLEADO':", text.includes("Alta Empleado") || text.includes("CREAR_EMPLEADO"));
  console.log("Contiene 'Total de Eventos Registrados':", text.includes("Total de Eventos Registrados"));

  // Probar acceso con rol EMPLEADO (debe ver Acceso Restringido)
  console.log("4. Probando acceso como EMPLEADO (debe bloquearse)...");
  const empLoginRes = await fetch("http://localhost:3000/api/auth/callback/credentials", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cookie": csrfRes.headers.get("set-cookie") || "",
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
  const empAudRes = await fetch("http://localhost:3000/auditoria", {
    headers: {
      "Cookie": empCookies,
    },
  });
  const empText = await empAudRes.text();
  console.log("Bloqueo de empleado efectivo:", empText.includes("Acceso Restringido"));
}

testAuditoria().catch(err => {
  console.error("Error en test:", err);
  process.exit(1);
});
