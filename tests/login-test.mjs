const base = "http://localhost:3000";

function must(cond, msg) {
  if (!cond) {
    console.error("FALLO:", msg);
    process.exit(1);
  }
}

function cookiesFrom(res) {
  return res.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
}

try {
  const res1 = await fetch(`${base}/api/auth/csrf`);
  must(res1.status === 200, `csrf endpoint responde 200 (llego ${res1.status})`);
  const { csrfToken } = await res1.json();
  must(!!csrfToken, "se obtiene csrfToken");
  const cookie1 = cookiesFrom(res1);

  const res2 = await fetch(`${base}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      cookie: cookie1,
    },
    body: new URLSearchParams({
      csrfToken,
      email: "empleado@demo.mx",
      password: "Demo1234!",
    }),
    redirect: "manual",
  });
  console.log("login status:", res2.status, "(esperado 302)");
  must(res2.status === 302, `login responde 302 (llego ${res2.status})`);

  const sessionCookie = cookiesFrom(res2);
  must(sessionCookie.includes("session-token"), "se obtiene cookie de sesion");

  const res3 = await fetch(`${base}/dashboard`, {
    headers: { cookie: sessionCookie },
  });
  const html = await res3.text();
  console.log("dashboard status:", res3.status, "(esperado 200)");
  must(res3.status === 200, `dashboard responde 200 (llego ${res3.status})`);
  console.log("saludo del empleado visible:", html.includes("Elena Vega"));
  must(html.includes("Elena Vega"), "el saludo del empleado es visible en el dashboard");

  console.log("\nOK: flujo de login verificado.");
} catch (err) {
  console.error("ERROR:", err.message);
  process.exit(1);
}
