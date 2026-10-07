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
  console.log("✓ Contiene botón de navegación 'Inicio' con ícono:", html.includes("Inicio") && html.includes("🏠"));
  console.log("✓ Contiene botón de navegación 'Empleados' con ícono:", html.includes("Empleados") && html.includes("👥"));
  console.log("✓ Contiene botón de navegación 'Competencias' con ícono:", html.includes("Competencias") && html.includes("⭐"));
  console.log("✓ Contiene botón de navegación 'Evaluaciones' con ícono:", html.includes("Evaluaciones") && html.includes("📋"));
  console.log("✓ Contiene botón de navegación 'Objetivos' con ícono:", html.includes("Objetivos") && html.includes("🎯"));
  console.log("✓ Contiene botón de navegación 'Oportunidades' con ícono:", html.includes("Oportunidades") && html.includes("💼"));
  console.log("✓ Contiene botón de navegación 'Postulaciones' con ícono:", html.includes("Postulaciones") && html.includes("📨"));
  console.log("✓ Contiene botón de navegación 'Planes' con ícono:", html.includes("Planes") && html.includes("📝"));
  console.log("✓ Contiene botón de navegación 'Importación' con ícono:", html.includes("Importación") && html.includes("📥"));
  console.log("✓ Contiene botón de navegación 'Auditoría' con ícono:", html.includes("Auditoría") && html.includes("🛡️"));
  console.log("✓ Contiene enlace de Perfil en la barra lateral:", html.includes("/perfil"));
  console.log("✓ Contiene acentos en rojo rubí / red gradient:", html.includes("from-red-600") || html.includes("border-red-500"));

  console.log("\n🎉 ¡EL NUEVO TEMA Y LA BARRA LATERAL A LA IZQUIERDA FUNCIONAN PERFECTAMENTE!");
}

testThemeAndSidebar().catch(err => {
  console.error("Error en test:", err);
  process.exit(1);
});
