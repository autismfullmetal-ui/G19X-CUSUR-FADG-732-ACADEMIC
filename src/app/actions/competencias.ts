"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, ROLES } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { requireRole } from "@/lib/session";
import { num, str } from "./_helpers";

export async function createCompetency(formData: FormData) {
  const session = await requireRole([ROLES.ADMIN, ROLES.RH]);
  const name = str(formData.get("name"));
  const description = str(formData.get("description"));
  const type = str(formData.get("type")) || "TECNICA";
  if (!name) redirect("/competencias?error=datos");
  let comp;
  try {
    comp = await db.competency.create({
      data: {
        name,
        description,
        type,
      },
    });
  } catch {
    redirect("/competencias?error=duplicado");
  }

  // RF-026: Auditoría
  await logAudit({
    userId: Number(session.user.id),
    action: "CREAR_COMPETENCIA",
    entity: "Competencia",
    entityId: comp.id,
    details: `Competencia "${name}" creada con tipo ${type}.`,
  });

  revalidatePath("/competencias");
  redirect("/competencias?ok=1");
}

export async function toggleCompetency(formData: FormData) {
  const session = await requireRole([ROLES.ADMIN, ROLES.RH]);
  const id = num(formData.get("competencyId"));
  const current = await db.competency.findUnique({ where: { id } });
  if (current) {
    const nextStatus = current.status === "ACTIVA" ? "INACTIVA" : "ACTIVA";
    await db.competency.update({
      where: { id },
      data: { status: nextStatus },
    });

    // RF-026: Auditoría
    await logAudit({
      userId: Number(session.user.id),
      action: "CAMBIAR_ESTADO_COMPETENCIA",
      entity: "Competencia",
      entityId: id,
      details: `Competencia "${current.name}" cambiada a estado ${nextStatus}.`,
    });
  }
  revalidatePath("/competencias");
}


