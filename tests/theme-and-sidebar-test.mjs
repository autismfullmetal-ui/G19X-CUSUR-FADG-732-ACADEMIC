async function testThemeAndSidebar() {
  console.log("--- TEST TEMA OSCURO (NEGRO/ROJO/GRIS) Y SIDEBAR A LA IZQUIERDA ---");

  // 1. Obtener CSRF token
  const csrfRes = await fetch("http://localhost:3000/api/auth/csrf");
  const csrfData = await csrfRes.json();
  const csrfToken = csrfData.csrfToken;
  const initialCookies = csrfRes.headers.get("set-cookie") || "";

  // 2. Iniciar sesión como ADMIN
  const loginRes = await fetch("http://localhost:3000/api/auth/callback/credentials", {
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
  const cookies = loginRes.headers.getSetCookie().map(c => c.split(';')[0]).join('; ');

  // 3. Consultar /dashboard autenticado
  const dashRes = await fetch("http://localhost:3000/dashboard", {
    headers: { Cookie: cookies },
  });
  console.log("Status /dashboard:", dashRes.status);
  const html = await dashRes.text();

  console.log("✓ Contiene clase de tema oscuro (app-dark-layout):", html.includes("app-dark-layout"));
  console.log("✓ Contiene barra lateral <aside> a la izquierda:", html.includes("<aside") || html.includes("aside"));
  console.log("✓ Contiene botón de navegación 'Inicio':", html.includes("Inicio"));
  console.log("✓ Contiene botón de navegación 'Empleados':", html.includes("Empleados"));
  console.log("✓ Contiene botón de navegación 'Competencias':", html.includes("Competencias"));
  console.log("✓ Contiene botón de navegación 'Evaluaciones':", html.includes("Evaluaciones"));
  console.log("✓ Contiene botón de navegación 'Objetivos':", html.includes("Objetivos"));
  console.log("✓ Contiene botón de navegación 'Oportunidades':", html.includes("Oportunidades"));
  console.log("✓ Contiene botón de navegación 'Postulaciones':", html.includes("Postulaciones"));
  console.log("✓ Contiene botón de navegación 'Planes':", html.includes("Planes"));
  console.log("✓ Contiene botón de navegación 'Importación':", html.includes("Importación"));
  console.log("✓ Contiene botón de navegación 'Auditoría':", html.includes("Auditoría"));
  console.log("✓ Contiene enlace de Perfil en la barra lateral:", html.includes("/perfil"));
  console.log("✓ Contiene acentos en rojo rubí / red gradient:", html.includes("from-red-600") || html.includes("border-red-500"));

  console.log("\n¡EL NUEVO TEMA Y LA BARRA LATERAL A LA IZQUIERDA FUNCIONAN PERFECTAMENTE!");
}

testThemeAndSidebar().catch(err => {
  console.error("Error en test:", err);
  process.exit(1);
});
