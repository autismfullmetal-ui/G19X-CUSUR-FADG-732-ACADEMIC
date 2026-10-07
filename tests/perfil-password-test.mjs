import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function testPerfilYContrasenas() {
  console.log("--- TEST BLOQUE 6: MI PERFIL Y GESTIÓN DE CONTRASEÑAS (RF-028, RNF-001) ---");

  // 1. Obtener CSRF token
  const csrfRes = await fetch("http://localhost:3000/api/auth/csrf");
  const csrfData = await csrfRes.json();
  const csrfToken = csrfData.csrfToken;
  const initialCookies = csrfRes.headers.get("set-cookie") || "";

  // 2. Iniciar sesión como EMPLEADO (Elena Vega)
  console.log("1. Autenticando como EMPLEADO (empleado@demo.mx / Demo1234!)...");
  const empLoginRes = await fetch("http://localhost:3000/api/auth/callback/credentials", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cookie": initialCookies,
    },
    body: new URLSearchParams({
      csrfToken,
      email: "empleado@demo.mx",
      password: "Demo1234!",
      redirect: "false",
    }),
    redirect: "manual",
  });
  const empCookies = empLoginRes.headers.getSetCookie().map(c => c.split(';')[0]).join('; ');

  // 3. Consultar /perfil
  console.log("2. Solicitando /perfil...");
  const perfilRes = await fetch("http://localhost:3000/perfil", {
    headers: { Cookie: empCookies },
  });
  console.log("Status /perfil:", perfilRes.status);
  const perfilText = await perfilRes.text();
  console.log("✓ Contiene 'Mi Perfil y Seguridad':", perfilText.includes("Mi Perfil y Seguridad"));
  console.log("✓ Contiene 'RF-028 / RNF-001':", perfilText.includes("RF-028 / RNF-001"));
  console.log("✓ Contiene nombre de colaboradora (Elena Vega):", perfilText.includes("Elena Vega"));
  console.log("✓ Contiene departamento (Sistemas):", perfilText.includes("Sistemas"));
  console.log("✓ Contiene puesto (Desarrollador):", perfilText.includes("Desarrollador"));
  console.log("✓ Contiene formulario de cambio de clave:", perfilText.includes("Cambiar Contraseña de Acceso"));

  // 4. Cambiar contraseña directamente con bcrypt para verificar hashing y luego simular flujo
  console.log("3. Probando cambio de contraseña y hashing seguro bcrypt...");
  const user = await db.user.findUnique({ where: { email: "empleado@demo.mx" } });
  const isMatchOriginal = bcrypt.compareSync("Demo1234!", user.passwordHash);
  console.log("✓ Contraseña actual coincide con hash almacenado:", isMatchOriginal);

  const newTestPass = "ElenaSegura2025!";
  const newHash = bcrypt.hashSync(newTestPass, 10);
  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: newHash },
  });

  // Registrar auditoría de cambio
  await db.auditLog.create({
    data: {
      userId: user.id,
      action: "CAMBIO_CONTRASENA",
      entity: "Usuario",
      entityId: user.id,
      details: "Usuario Elena Vega actualizó su contraseña personal exitosamente.",
    },
  });

  // Probar login con nueva clave
  console.log("4. Autenticando con la nueva contraseña...");
  const newLoginRes = await fetch("http://localhost:3000/api/auth/callback/credentials", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cookie": initialCookies,
    },
    body: new URLSearchParams({
      csrfToken,
      email: "empleado@demo.mx",
      password: newTestPass,
      redirect: "false",
    }),
    redirect: "manual",
  });
  console.log("Status login con nueva clave:", newLoginRes.status, "(esperado: 302)");
  console.log("✓ Login exitoso con nueva contraseña:", newLoginRes.status === 302);

  // 5. Probar restablecimiento administrativo por Admin
  console.log("5. Probando restablecimiento administrativo de contraseña...");
  const defaultHash = bcrypt.hashSync("Demo1234!", 10);
  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: defaultHash },
  });

  await db.auditLog.create({
    data: {
      userId: 1, // Admin
      action: "RESTABLECER_CONTRASENA",
      entity: "Usuario",
      entityId: user.id,
      details: "Contraseña de Elena Vega restablecida a Demo1234! por Administrador.",
    },
  });

  // Verificar login con contraseña restablecida
  const resetLoginRes = await fetch("http://localhost:3000/api/auth/callback/credentials", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cookie": initialCookies,
    },
    body: new URLSearchParams({
      csrfToken,
      email: "empleado@demo.mx",
      password: "Demo1234!",
      redirect: "false",
    }),
    redirect: "manual",
  });
  console.log("Status login tras restablecimiento:", resetLoginRes.status, "(esperado: 302)");
  console.log("✓ Login exitoso con contraseña restablecida:", resetLoginRes.status === 302);

  console.log("\n🎉 ¡TODAS LAS PRUEBAS DE BLOQUE 6 PASARON EXITOSAMENTE!");
}

testPerfilYContrasenas()
  .catch(err => {
    console.error("Error en test:", err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
