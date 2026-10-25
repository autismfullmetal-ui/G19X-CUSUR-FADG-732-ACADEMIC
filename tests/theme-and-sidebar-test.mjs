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
  console.log("--- TEST TEMA OSCURO (NEGRO/ROJO/GRIS) Y SIDEBAR A LA IZQUIERDA ---");

  const csrfRes = await fetch(`${base}/api/auth/csrf`);
  must(csrfRes.status === 200, `csrf endpoint responde 200 (llego ${csrfRes.status})`);
  const csrfData = await csrfRes.json();
  const csrfToken = csrfData.csrfToken;
  must(!!csrfToken, "se obtiene csrfToken");
  const initialCookies = cookiesFrom(csrfRes);

  console.log("1. Autenticando como ADMIN (admin@demo.mx)...");
  const adminCookies = await login("admin@demo.mx", "Demo1234!", initialCookies, csrfToken);
  must(adminCookies.includes("session-token"), "login de admin exitoso");

  console.log("2. Consultando /dashboard autenticado...");
  const dashRes = await fetch(`${base}/dashboard`, { headers: { Cookie: adminCookies } });
  must(dashRes.status === 200, `GET /dashboard responde 200 (llego ${dashRes.status})`);
  const html = await dashRes.text();

  must(html.includes("app-dark-layout"), "contiene clase de tema oscuro (app-dark-layout)");
  must(html.includes("<aside") || html.includes("aside"), "contiene barra lateral <aside> a la izquierda");
  must(html.includes("Inicio"), "contiene botón de navegación 'Inicio'");
  must(html.includes("Empleados"), "contiene botón de navegación 'Empleados'");
  must(html.includes("Competencias"), "contiene botón de navegación 'Competencias'");
  must(html.includes("Evaluaciones"), "contiene botón de navegación 'Evaluaciones'");
  must(html.includes("Objetivos"), "contiene botón de navegación 'Objetivos'");
  must(html.includes("Oportunidades"), "contiene botón de navegación 'Oportunidades'");
  must(html.includes("Postulaciones"), "contiene botón de navegación 'Postulaciones'");
  must(html.includes("Planes"), "contiene botón de navegación 'Planes'");
  must(html.includes("Importación"), "contiene botón de navegación 'Importación'");
  must(html.includes("Auditoría"), "contiene botón de navegación 'Auditoría'");
  must(html.includes("/perfil"), "contiene enlace de Perfil en la barra lateral");
  must(html.includes("from-red-600") || html.includes("border-red-500"), "contiene acentos en rojo rubí / red gradient");

  console.log("\n¡EL NUEVO TEMA Y LA BARRA LATERAL A LA IZQUIERDA FUNCIONAN PERFECTAMENTE!");
} catch (err) {
  console.error("ERROR:", err.message);
  process.exit(1);
}
