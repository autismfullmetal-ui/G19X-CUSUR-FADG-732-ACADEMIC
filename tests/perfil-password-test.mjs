import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const base = "http://localhost:3000";
const db = new PrismaClient();

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

try {
  console.log("--- TEST BLOQUE 6: MI PERFIL Y GESTIÓN DE CONTRASEÑAS (RF-028, RNF-001) ---");

  const csrfRes = await fetch(`${base}/api/auth/csrf`);
  must(csrfRes.status === 200, `csrf endpoint responde 200 (llego ${csrfRes.status})`);
  const csrfData = await csrfRes.json();
  const csrfToken = csrfData.csrfToken;
  must(!!csrfToken, "se obtiene csrfToken");
  const initialCookies = cookiesFrom(csrfRes);

  console.log("1. Autenticando como EMPLEADO (empleado@demo.mx / Demo1234!)...");
  const empLoginRes = await fetch(`${base}/api/auth/callback/credentials`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Cookie: initialCookies },
    body: new URLSearchParams({ csrfToken, email: "empleado@demo.mx", password: "Demo1234!", redirect: "false" }),
    redirect: "manual",
  });
  const empCookies = cookiesFrom(empLoginRes);
  must(empCookies.includes("session-token"), "login de empleado exitoso");

  console.log("2. Solicitando /perfil...");
  const perfilRes = await fetch(`${base}/perfil`, { headers: { Cookie: empCookies } });
  must(perfilRes.status === 200, `GET /perfil responde 200 (llego ${perfilRes.status})`);
  const perfilText = await perfilRes.text();
  must(perfilText.includes("Mi Perfil y Seguridad"), "contiene 'Mi Perfil y Seguridad'");
  must(perfilText.includes("RF-028 / RNF-001"), "contiene 'RF-028 / RNF-001'");
  must(perfilText.includes("Elena Vega"), "contiene nombre de colaboradora (Elena Vega)");
  must(perfilText.includes("Sistemas"), "contiene departamento (Sistemas)");
  must(perfilText.includes("Ingeniero de Software Full-Stack"), "contiene puesto actual");
  must(perfilText.includes("Cambiar Contraseña de Acceso"), "contiene formulario de cambio de clave");

  console.log("3. Probando cambio de contraseña y hashing seguro bcrypt...");
  const user = await db.user.findUnique({ where: { email: "empleado@demo.mx" } });
  must(!!user, "existe usuario empleado@demo.mx");
  const isMatchOriginal = bcrypt.compareSync("Demo1234!", user.passwordHash);
  must(isMatchOriginal, "contraseña actual coincide con hash almacenado");

  const newTestPass = "ElenaSegura2025!";
  const newHash = bcrypt.hashSync(newTestPass, 10);
  await db.user.update({ where: { id: user.id }, data: { passwordHash: newHash } });

  await db.auditLog.create({
    data: { userId: user.id, action: "CAMBIO_CONTRASENA", entity: "Usuario", entityId: user.id, details: "Usuario Elena Vega actualizó su contraseña personal exitosamente." },
  });

  console.log("4. Autenticando con la nueva contraseña...");
  const newLoginRes = await fetch(`${base}/api/auth/callback/credentials`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Cookie: initialCookies },
    body: new URLSearchParams({ csrfToken, email: "empleado@demo.mx", password: newTestPass, redirect: "false" }),
    redirect: "manual",
  });
  must(newLoginRes.status === 302, `login con nueva clave responde 302 (llego ${newLoginRes.status})`);

  console.log("5. Probando restablecimiento administrativo de contraseña...");
  const adminUser = await db.user.findFirst({ where: { role: "ADMIN" } });
  must(!!adminUser, "existe usuario ADMIN");
  const defaultHash = bcrypt.hashSync("Demo1234!", 10);
  await db.user.update({ where: { id: user.id }, data: { passwordHash: defaultHash } });

  await db.auditLog.create({
    data: { userId: adminUser.id, action: "RESTABLECER_CONTRASENA", entity: "Usuario", entityId: user.id, details: "Contraseña de Elena Vega restablecida a Demo1234! por Administrador." },
  });

  const resetLoginRes = await fetch(`${base}/api/auth/callback/credentials`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Cookie: initialCookies },
    body: new URLSearchParams({ csrfToken, email: "empleado@demo.mx", password: "Demo1234!", redirect: "false" }),
    redirect: "manual",
  });
  must(resetLoginRes.status === 302, `login tras restablecimiento responde 302 (llego ${resetLoginRes.status})`);

  console.log("\n ¡TODAS LAS PRUEBAS DE BLOQUE 6 PASARON EXITOSAMENTE!");
} catch (err) {
  console.error("ERROR:", err.message);
  process.exit(1);
} finally {
  await db.$disconnect();
}
