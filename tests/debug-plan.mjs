const base = "http://localhost:3000";
const res1 = await fetch(`${base}/api/auth/csrf`);
const { csrfToken } = await res1.json();
const cookie1 = res1.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
const res2 = await fetch(`${base}/api/auth/callback/credentials`, {
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded", cookie: cookie1 },
  body: new URLSearchParams({ csrfToken, email: "rh@demo.mx", password: "Demo1234!" }),
  redirect: "manual",
});
const cookie = res2.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
const page = await fetch(`${base}/postulaciones/1`, { headers: { cookie } });
const html = await page.text();
console.log("status:", page.status, "len:", html.length);
console.log("Crear plan:", html.indexOf("Crear plan"));
console.log("Plan de desarrollo:", html.indexOf("Plan de desarrollo"));
console.log("Compatibilidad:", html.indexOf("Compatibilidad"));
console.log("error __next_error__:", html.includes("__next_error__"));
