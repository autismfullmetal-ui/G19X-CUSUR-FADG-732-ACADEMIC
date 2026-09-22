const base = "http://localhost:3000";

const res1 = await fetch(`${base}/api/auth/csrf`);
const { csrfToken } = await res1.json();
const cookie1 = res1.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");

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

const sessionCookie = res2.headers
  .getSetCookie()
  .map((c) => c.split(";")[0])
  .join("; ");

const res3 = await fetch(`${base}/dashboard`, {
  headers: { cookie: sessionCookie },
});
const html = await res3.text();
console.log("dashboard status:", res3.status, "(esperado 200)");
console.log("saludo del empleado visible:", html.includes("Elena Vega"));
console.log("tarjetas del panel visibles:", html.includes("Empleados activos"));
