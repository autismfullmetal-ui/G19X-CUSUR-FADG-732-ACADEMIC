const base = "http://localhost:3000";

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

async function run() {
  console.log("=== VERIFICANDO VISTA /planes CON RESUMEN EJECUTIVO Y ACORDEÓN DESPLEGABLE ===");
  const cookie = await login("admin@demo.mx", "Demo1234!");
  
  const res = await fetch(`${base}/planes`, {
    headers: { cookie },
  });
  
  if (res.status !== 200) {
    console.error("Error al obtener /planes:", res.status);
    process.exit(1);
  }
  
  const html = await res.text();
  
  const checks = [
    { name: "Título principal", pass: html.includes("Planes de desarrollo") },
    { name: "Buscador de planes", pass: html.includes("Buscar por colaborador, título u oportunidad...") },
    { name: "Filtro de estados", pass: html.includes("Todos los estados") && html.includes("En progreso") },
    { name: "Botones expandir/colapsar todo", pass: html.includes("Expandir todo") && html.includes("Colapsar todo") },
    { name: "Pestaña desplegable de fases y retroalimentación", pass: html.includes("Ver fases, entregables y retroalimentación") },
    { name: "Barra de progreso de actividades", pass: html.includes("Progreso de actividades") },
    { name: "Objetivo del Plan presente en el resumen", pass: html.includes("Objetivo del Plan") },
  ];
  
  let allPass = true;
  for (const c of checks) {
    console.log(`- ${c.name}: ${c.pass ? "✓ OK" : "✗ FALLÓ"}`);
    if (!c.pass) allPass = false;
  }
  
  if (!allPass) {
    console.error("Algunas verificaciones fallaron");
    process.exit(1);
  }
  
  console.log("=== VISTA DE PLANES VERIFICADA CON ÉXITO ===");
}

run();
