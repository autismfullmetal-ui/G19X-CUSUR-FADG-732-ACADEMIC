"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { db, ROLES } from "@/lib/db";
import { auth } from "@/lib/auth";
import { calcCompatibility } from "@/lib/compatibility";
import { generateAiRecommendation } from "@/lib/ai";
import { createNotification, notifyUsers } from "@/lib/notifications";
import { logAudit } from "@/lib/audit";
import { requireRole } from "@/lib/session";
import { num, str, DEFAULT_PASSWORD } from "./_helpers";

export async function createObjective(formData: FormData) {
  const session = await requireRole([ROLES.ADMIN, ROLES.RH]);
  const title = str(formData.get("title"));
  if (!title) redirect("/objetivos?error=datos");

  const targetPeriod = str(formData.get("targetPeriod")) || "2025 - Anual";
  const category = str(formData.get("category")) || "ESTRATEGICO";
  const targetValue = num(formData.get("targetValue")) || 100;
  const unit = str(formData.get("unit")) || "%";
  const weight = Math.max(1, Math.min(5, num(formData.get("weight")) || 1));
  const deptIdRaw = formData.get("departmentId");
  const departmentId = deptIdRaw && deptIdRaw !== "todos" ? num(deptIdRaw) : null;
  const description = str(formData.get("description")) || null;

  const objective = await db.organizationalObjective.create({
    data: {
      title,
      description,
      targetPeriod,
      category,
      targetValue,
      unit,
      weight,
      departmentId,
      createdById: Number(session.user.id),
      status: "ACTIVO",
    },
  });

  // RF-026: Auditoría
  await logAudit({
    userId: Number(session.user.id),
    action: "CREAR_OBJETIVO",
    entity: "Objetivo",
    entityId: objective.id,
    details: `Objetivo estratégico "${objective.title}" (${objective.category}, meta: ${targetValue} ${unit}) creado por ${session.user.name}.`,
  });

  revalidatePath("/objetivos");
  revalidatePath("/evaluaciones");
  revalidatePath("/dashboard");
  redirect("/objetivos?ok=creado");
}

export async function updateObjectiveStatus(formData: FormData) {
  const session = await requireRole([ROLES.ADMIN, ROLES.RH]);
  const id = num(formData.get("id"));
  const status = str(formData.get("status")); // ACTIVO | PAUSADO | COMPLETADO | CANCELADO
  if (!id || !["ACTIVO", "PAUSADO", "COMPLETADO", "CANCELADO"].includes(status)) {
    redirect("/objetivos?error=datos");
  }

  const obj = await db.organizationalObjective.update({
    where: { id },
    data: { status },
  });

  // RF-026: Auditoría
  await logAudit({
    userId: Number(session.user.id),
    action: "ACTUALIZAR_OBJETIVO",
    entity: "Objetivo",
    entityId: id,
    details: `Estado de objetivo #${id} ("${obj.title}") actualizado a "${status}".`,
  });

  revalidatePath("/objetivos");
  revalidatePath("/evaluaciones");
  revalidatePath("/dashboard");
  redirect("/objetivos?ok=actualizado");
}


