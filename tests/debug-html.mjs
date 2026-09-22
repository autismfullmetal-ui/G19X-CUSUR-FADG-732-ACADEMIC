const base = "http://localhost:3000";
const res1 = await fetch(`${base}/api/auth/csrf`);
const { csrfToken } = await res1.json();
const cookie1 = res1.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
const res2 = await fetch(`${base}/api/auth/callback/credentials`, {
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded", cookie: cookie1 },
  body: new URLSearchParams({ csrfToken, email: "empleado@demo.mx", password: "Demo1234!" }),
  redirect: "manual",
});
const cookie = res2.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
const page = await fetch(`${base}/oportunidades`, { headers: { cookie } });
const html = await page.text();
const i = html.indexOf("Postularme");
console.log("indexOf Postularme:", i);
console.log(html.slice(Math.max(0, i - 600), i + 100).replace(/></g, ">\n<"));
