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

try {
  console.log("=== VERIFICANDO VISTA /planes CON RESUMEN EJECUTIVO Y ACORDEÓN DESPLEGABLE ===");
  const cookie = await login("admin@demo.mx", "Demo1234!");

  const res = await fetch(`${base}/planes`, {
    headers: { cookie },
  });
  must(res.status === 200, `GET /planes responde 200 (llego ${res.status})`);

  const html = await res.text();

  must(html.includes("Planes de desarrollo"), "contiene título principal 'Planes de desarrollo'");
  must(html.includes("Buscar por colaborador, título u oportunidad..."), "contiene buscador de planes");
  must(html.includes("Todos los estados"), "contiene filtro 'Todos los estados'");
  must(html.includes("En progreso"), "contiene filtro 'En progreso'");
  must(html.includes("Expandir todo"), "contiene botón 'Expandir todo'");
  must(html.includes("Colapsar todo"), "contiene botón 'Colapsar todo'");
  must(html.includes("Ver fases, entregables y retroalimentación"), "contiene pestaña desplegable de fases y retroalimentación");
  must(html.includes("Progreso de actividades"), "contiene barra de progreso de actividades");
  must(html.includes("Objetivo del Plan"), "contiene 'Objetivo del Plan' en el resumen");

  console.log("=== VISTA DE PLANES VERIFICADA CON ÉXITO ===");
} catch (err) {
  console.error("ERROR:", err.message);
  process.exit(1);
}
