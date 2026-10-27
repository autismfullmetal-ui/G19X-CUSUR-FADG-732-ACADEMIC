"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, ROLES } from "@/lib/db";
import { auth } from "@/lib/auth";
import { generateAiRecommendation } from "@/lib/ai";
import { createNotification } from "@/lib/notifications";
import { logAudit } from "@/lib/audit";
import { requireRole } from "@/lib/session";
import { num, str, DEFAULT_PASSWORD } from "./_helpers";

export async function changePassword(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const currentPassword = str(formData.get("currentPassword"));
  const newPassword = str(formData.get("newPassword"));
  const confirmPassword = str(formData.get("confirmPassword"));
  // El formulario obligatorio de primer ingreso envía origen=forzado
  const forzado = str(formData.get("origen")) === "forzado";
  const errorBase = forzado ? "/cambiar-contrasena" : "/perfil";

  if (!currentPassword || !newPassword || !confirmPassword) {
    redirect(`${errorBase}?error=campos_requeridos`);
  }

  if (newPassword.length < 6) {
    redirect(`${errorBase}?error=longitud_minima`);
  }

  if (newPassword !== confirmPassword) {
    redirect(`${errorBase}?error=coincidencia`);
  }

  // No se permite conservar la clave temporal compartida ni repetir la actual
  if (newPassword === DEFAULT_PASSWORD || newPassword === currentPassword) {
    redirect(`${errorBase}?error=misma_clave`);
  }

  const userId = Number(session.user.id);
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) {
    redirect("/login");
  }

  const isValidCurrent = bcrypt.compareSync(currentPassword, user.passwordHash);
  if (!isValidCurrent) {
    redirect(`${errorBase}?error=actual_incorrecta`);
  }

  const newHash = bcrypt.hashSync(newPassword, 10);
  await db.user.update({
    where: { id: userId },
    data: { passwordHash: newHash, mustChangePassword: false },
  });

  // Notificación in-app
  await createNotification({
    userId,
    title: "Contraseña actualizada exitosamente",
    message: "Tu contraseña de acceso a la plataforma ha sido modificada correctamente.",
    type: "SUCCESS",
    linkUrl: "/perfil",
  });

  // RF-026: Auditoría
  await logAudit({
    userId,
    action: "CAMBIO_CONTRASENA",
    entity: "Usuario",
    entityId: userId,
    details: `El usuario ${user.name} (${user.email}) actualizó su contraseña personal.`,
  });

  revalidatePath("/", "layout");
  redirect(forzado ? "/dashboard" : "/perfil?ok=password_cambiada");
}

export async function adminResetPassword(formData: FormData) {
  const session = await requireRole([ROLES.ADMIN, ROLES.RH]);
  const employeeId = num(formData.get("employeeId"));
  const targetUserId = num(formData.get("userId"));

  let userToReset: { id: number; name: string; email: string } | null = null;

  if (targetUserId) {
    userToReset = await db.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, name: true, email: true },
    });
  } else if (employeeId) {
    const emp = await db.employee.findUnique({
      where: { id: employeeId },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    userToReset = emp?.user ?? null;
  }

  if (!userToReset) {
    redirect("/empleados?error=usuario_no_encontrado");
  }

  const defaultHash = bcrypt.hashSync(DEFAULT_PASSWORD, 10);
  await db.user.update({
    where: { id: userToReset.id },
    data: { passwordHash: defaultHash, mustChangePassword: true },
  });

  // Notificar al usuario
  await createNotification({
    userId: userToReset.id,
    title: "Contraseña restablecida",
    message: `Tu contraseña ha sido restablecida por ${session.user.name} a la clave temporal. Deberás definir una nueva en tu próximo ingreso.`,
    type: "WARNING",
    linkUrl: "/perfil",
  });

  // RF-026: Auditoría
  await logAudit({
    userId: Number(session.user.id),
    action: "RESTABLECER_CONTRASENA",
    entity: "Usuario",
    entityId: userToReset.id,
    details: `Contraseña de ${userToReset.name} (${userToReset.email}) restablecida a la contraseña temporal predeterminada por ${session.user.name}.`,
  });

  revalidatePath("/empleados");
  revalidatePath("/perfil");
  redirect("/empleados?ok=password_reset");
}

