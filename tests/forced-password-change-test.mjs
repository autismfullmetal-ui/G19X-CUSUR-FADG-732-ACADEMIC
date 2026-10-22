// Prueba E2E: cambio obligatorio de la contraseña temporal en el primer ingreso.
// Requiere el servidor en http://localhost:3000 (npm run dev).
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const base = "http://localhost:3000";
const db = new PrismaClient();
const EMAIL = "primer.ingreso.test@demo.mx";
const TEMP = "Demo1234!";
const NUEVA = "MiClaveNueva#2026";

let failures = 0;
function check(name, cond, extra = "") {
  console.log(`${cond ? "OK  " : "FALLA"} ${name}${extra ? ` (${extra})` : ""}`);
  if (!cond) failures++;
}

function cookiesFrom(res) {
  return res.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
}

async function login(email, password) {
  const r1 = await fetch(`${base}/api/auth/csrf`);
  const { csrfToken } = await r1.json();
  const r2 = await fetch(`${base}/api/auth/callback/credentials`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", cookie: cookiesFrom(r1) },
    body: new URLSearchParams({ csrfToken, email, password }),
    redirect: "manual",
  });
  const cookie = cookiesFrom(r2);
  return cookie.includes("session-token") ? cookie : null;
}

// Envía el formulario de /cambiar-contrasena como lo haría el navegador sin JS
async function submitChange(cookie, current, nueva, confirmacion) {
  const page = await fetch(`${base}/cambiar-contrasena`, { headers: { cookie } });
  const html = await page.text();
  const actionField = html.match(/name="(\$ACTION_ID_[^"]+)"/)?.[1];
  if (!actionField) throw new Error("No se encontró el ID de la server action en el formulario");
  const fd = new FormData();
  fd.append(actionField, "");
  fd.append("origen", "forzado");
  fd.append("currentPassword", current);
  fd.append("newPassword", nueva);
  fd.append("confirmPassword", confirmacion);
  const res = await fetch(`${base}/cambiar-contrasena`, {
    method: "POST",
    headers: { cookie },
    body: fd,
    redirect: "manual",
  });
  return res.headers.get("location") ?? "";
}

async function cleanup() {
  const u = await db.user.findUnique({ where: { email: EMAIL } });
  if (!u) return;
  await db.notification.deleteMany({ where: { userId: u.id } });
  await db.auditLog.deleteMany({ where: { userId: u.id } });
  await db.user.delete({ where: { id: u.id } });
}

try {
  await cleanup();
  await db.user.create({
    data: {
      email: EMAIL,
      name: "Prueba Primer Ingreso",
      role: "EMPLEADO",
      passwordHash: bcrypt.hashSync(TEMP, 10),
      mustChangePassword: true,
    },
  });

  // 1. Con la clave temporal, cualquier ruta de la app redirige a /cambiar-contrasena
  const cookie = await login(EMAIL, TEMP);
  check("login con clave temporal", !!cookie);
  const dash = await fetch(`${base}/dashboard`, { headers: { cookie }, redirect: "manual" });
  const loc = dash.headers.get("location") ?? "";
  check("/dashboard redirige a /cambiar-contrasena", loc.includes("/cambiar-contrasena"), `${dash.status} ${loc}`);

  const page = await fetch(`${base}/cambiar-contrasena`, { headers: { cookie } });
  const html = await page.text();
  check("pantalla de cambio visible", page.status === 200 && html.includes("Define tu contraseña personal"));

  // 2. No permite conservar la clave temporal
  const locSame = await submitChange(cookie, TEMP, TEMP, TEMP);
  check("rechaza reutilizar la clave temporal", locSame.includes("error=misma_clave"), locSame);

  // 3. Confirmación distinta
  const locMismatch = await submitChange(cookie, TEMP, NUEVA, NUEVA + "x");
  check("rechaza confirmación distinta", locMismatch.includes("error=coincidencia"), locMismatch);

  // 4. Cambio válido: libera el acceso
  const locOk = await submitChange(cookie, TEMP, NUEVA, NUEVA);
  check("cambio válido redirige a /dashboard", locOk.includes("/dashboard"), locOk);

  const after = await db.user.findUnique({ where: { email: EMAIL } });
  check("mustChangePassword queda en false", after?.mustChangePassword === false);
  check("hash actualizado a la nueva clave", bcrypt.compareSync(NUEVA, after.passwordHash));

  const dash2 = await fetch(`${base}/dashboard`, { headers: { cookie }, redirect: "manual" });
  check("/dashboard accesible tras el cambio", dash2.status === 200, String(dash2.status));

  const back = await fetch(`${base}/cambiar-contrasena`, { headers: { cookie }, redirect: "manual" });
  check("/cambiar-contrasena ya no aplica y redirige", (back.headers.get("location") ?? "").includes("/dashboard"));

  // 5. Credenciales finales
  check("login con la clave temporal ya no funciona", (await login(EMAIL, TEMP)) === null);
  check("login con la nueva clave funciona", !!(await login(EMAIL, NUEVA)));
} catch (e) {
  console.error("ERROR:", e.message);
  failures++;
} finally {
  await cleanup();
  await db.$disconnect();
}

console.log(failures === 0 ? "\nTodas las verificaciones pasaron." : `\n${failures} verificación(es) fallaron.`);
process.exit(failures === 0 ? 0 : 1);
