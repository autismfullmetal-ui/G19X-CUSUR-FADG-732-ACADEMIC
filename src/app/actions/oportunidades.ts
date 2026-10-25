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

export async function createOpportunity(formData: FormData) {
  const session = await requireRole([ROLES.ADMIN, ROLES.RH]);
  const title = str(formData.get("title"));
  if (!title) redirect("/oportunidades?error=datos");

  const vacancies = num(formData.get("vacancies")) || 1;
  const openDateStr = str(formData.get("openDate"));
  const deadlineStr = str(formData.get("deadline"));
  const openDate = openDateStr ? new Date(openDateStr) : null;
  const deadline = deadlineStr ? new Date(deadlineStr) : null;

  const compIds = formData.getAll("reqCompetencyId").map((v) => num(v));
  const levels = formData.getAll("reqLevel").map((v) => num(v));
  const weights = formData.getAll("reqWeight").map((v) => num(v) || 1);
  const mandatories = formData.getAll("reqMandatory").map((v) => str(v) === "si");
  const objectiveId = num(formData.get("objectiveId")) || null;

  const opportunity = await db.opportunity.create({
    data: {
      title,
      description: str(formData.get("description")),
      type: str(formData.get("type")) || "PROYECTO",
      vacancies: vacancies > 0 ? vacancies : 1,
      openDate,
      deadline,
      objectiveId: objectiveId || null,
      createdById: Number(session.user.id),
    },
  });

    for (let i = 0; i < compIds.length; i++) {
    if (!compIds[i] || levels[i] < 1 || levels[i] > 5) continue;
    await db.opportunityRequirement.create({
      data: {
        opportunityId: opportunity.id,
        competencyId: compIds[i],
        requiredLevel: levels[i],
        weight: weights[i],
        mandatory: mandatories[i] ?? false,
      },
    });
  }

  // RF-026: Auditoría
  await logAudit({
    userId: Number(session.user.id),
    action: "CREAR_OPORTUNIDAD",
    entity: "Oportunidad",
    entityId: opportunity.id,
    details: `Oportunidad "${opportunity.title}" (${opportunity.type}) creada con ${compIds.length} competencias requeridas${objectiveId ? ` vinculada al objetivo organizacional #${objectiveId}` : ""}.`,
  });

  revalidatePath("/oportunidades");
  redirect(`/oportunidades?ok=1&edit=${opportunity.id}`);
}

export async function publishOpportunity(formData: FormData) {
  const session = await requireRole([ROLES.ADMIN, ROLES.RH]);
  const id = num(formData.get("opportunityId"));
  const count = await db.opportunityRequirement.count({
    where: { opportunityId: id },
  });
  // RN-002: al menos una competencia requerida
  if (count === 0) redirect("/oportunidades?error=sinrequisitos");
  const opp = await db.opportunity.update({ where: { id }, data: { status: "PUBLICADA" } });

  // RF-026: Auditoría
  await logAudit({
    userId: Number(session.user.id),
    action: "PUBLICAR_OPORTUNIDAD",
    entity: "Oportunidad",
    entityId: id,
    details: `Oportunidad #${id} ("${opp.title}") publicada para recibir postulaciones.`,
  });

  revalidatePath("/oportunidades");
}

export async function closeOpportunity(formData: FormData) {
  const session = await requireRole([ROLES.ADMIN, ROLES.RH]);
  const id = num(formData.get("opportunityId"));
  const opp = await db.opportunity.update({ where: { id }, data: { status: "CERRADA" } });

  // Si la oportunidad se cierra, el empleado puede seguir con su plan de desarrollo.
  // Por ende, solo cancelamos postulaciones activas que NO tengan un plan de desarrollo creado.
  const appsWithPlan = await db.developmentPlan.findMany({
    where: { application: { opportunityId: id } },
    select: { applicationId: true },
  });
  const exemptIds = appsWithPlan
    .map((p) => p.applicationId)
    .filter(Boolean) as number[];

  await db.application.updateMany({
    where: {
      opportunityId: id,
      status: "ACTIVA",
      ...(exemptIds.length > 0 ? { id: { notIn: exemptIds } } : {}),
    },
    data: { status: "NO_PROCEDE" },
  });

  // RF-026: Auditoría
  await logAudit({
    userId: Number(session.user.id),
    action: "CERRAR_OPORTUNIDAD",
    entity: "Oportunidad",
    entityId: id,
    details: `Oportunidad #${id} ("${opp.title}") cerrada. Postulaciones sin plan canceladas.`,
  });

  revalidatePath("/oportunidades");
  revalidatePath("/postulaciones");
  revalidatePath("/planes");
}


