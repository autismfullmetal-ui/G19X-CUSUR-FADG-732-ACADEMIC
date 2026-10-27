"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, ROLES } from "@/lib/db";
import { calcCompatibility } from "@/lib/compatibility";
import { generateAiRecommendation } from "@/lib/ai";
import { createNotification, notifyUsers } from "@/lib/notifications";
import { logAudit } from "@/lib/audit";
import { requireRole } from "@/lib/session";
import { num, str } from "./_helpers";

export async function applyToOpportunity(formData: FormData) {
  const session = await requireRole([ROLES.EMPLEADO]);
  const opportunityId = num(formData.get("opportunityId"));
  const employee = await db.employee.findUnique({
    where: { userId: Number(session.user.id) },
  });
  if (!employee) redirect("/oportunidades?error=sempleado");

  // Validar vigencia y vacantes de la oportunidad
  const opportunity = await db.opportunity.findUnique({
    where: { id: opportunityId },
    include: {
      applications: { select: { id: true, status: true } },
    },
  });
  if (!opportunity || opportunity.status !== "PUBLICADA") {
    redirect("/oportunidades?error=cerrada");
  }

  const now = new Date();
  if (opportunity.openDate && now < opportunity.openDate) {
    redirect("/oportunidades?error=no_abierta");
  }

  if (opportunity.deadline) {
    const deadlineEndOfDay = new Date(opportunity.deadline);
    deadlineEndOfDay.setHours(23, 59, 59, 999);
    if (now > deadlineEndOfDay) {
      redirect("/oportunidades?error=vencida");
    }
  }

  // RN-001: no postularse dos veces
  const dup = await db.application.findFirst({
    where: { opportunityId, employeeId: employee!.id },
  });
  if (dup) redirect("/oportunidades?error=duplicada");

  const reqs = await db.opportunityRequirement.findMany({
    where: { opportunityId },
  });
  const currents = await db.employeeCompetency.findMany({
    where: { employeeId: employee!.id },
  });

  const { compatibility, gaps } = calcCompatibility(
    reqs.map((r) => ({
      competencyId: r.competencyId,
      requiredLevel: r.requiredLevel,
      weight: r.weight,
      mandatory: r.mandatory,
    })),
    currents.map((c) => ({ competencyId: c.competencyId, level: c.level }))
  );

  const application = await db.application.create({
    data: {
      opportunityId,
      employeeId: employee!.id,
      compatibility,
    },
  });

  for (const g of gaps) {
    const req = reqs.find((r) => r.competencyId === g.competencyId)!;
    await db.gap.create({
      data: {
        applicationId: application.id,
        requirementId: req.id,
        currentLevel: g.currentLevel,
        requiredLevel: g.requiredLevel,
        status: "ABIERTA",
      },
    });
  }

  // RF-025: Notificar a RH y Administradores
  const rhAndAdmins = await db.user.findMany({
    where: { role: { in: [ROLES.ADMIN, ROLES.RH] } },
    select: { id: true },
  });
  await notifyUsers({
    userIds: rhAndAdmins.map((u) => u.id),
    title: "Nueva postulación recibida",
    message: `${employee.firstName} ${employee.lastName} se postuló a "${opportunity.title}" (${compatibility}% compatibilidad).`,
    type: "INFO",
    linkUrl: `/postulaciones/${application.id}`,
  });

  // Notificar al empleado
  await createNotification({
    userId: Number(session.user.id),
    title: "Postulación registrada con éxito",
    message: `Tu postulación a "${opportunity.title}" se registró con ${compatibility}% de compatibilidad.`,
    type: "SUCCESS",
    linkUrl: `/postulaciones/${application.id}`,
  });

  // RF-026: Auditoría
  await logAudit({
    userId: Number(session.user.id),
    action: "POSTULACION",
    entity: "Postulacion",
    entityId: application.id,
    details: `${employee.firstName} ${employee.lastName} se postuló a "${opportunity.title}" (${compatibility}% compatibilidad, ${gaps.length} brechas).`,
  });

  revalidatePath("/postulaciones");
  redirect(`/postulaciones/${application.id}`);
}

export async function decideApplication(formData: FormData) {
  const session = await requireRole([ROLES.ADMIN, ROLES.RH]);
  const applicationId = num(formData.get("applicationId"));
  const decision = str(formData.get("decision")); // "ACEPTADA" | "RECHAZADA"

  if (!applicationId || !["ACEPTADA", "RECHAZADA"].includes(decision)) {
    redirect(`/postulaciones/${applicationId}?error=decision`);
  }

  const app = await db.application.findUnique({
    where: { id: applicationId },
    include: { employee: true, opportunity: true },
  });
  if (!app) redirect("/postulaciones?error=noexiste");

  await db.application.update({
    where: { id: applicationId },
    data: { status: decision },
  });

  if (app.employee.userId) {
    await createNotification({
      userId: app.employee.userId,
      title: decision === "ACEPTADA" ? "¡Felicidades! Postulación Aceptada" : "Actualización de Postulación",
      message:
        decision === "ACEPTADA"
          ? `Has sido seleccionado/a oficialmente para la vacante "${app.opportunity.title}". ¡Excelente trabajo en tu plan de desarrollo!`
          : `El proceso de evaluación para la vacante "${app.opportunity.title}" ha finalizado.`,
      type: decision === "ACEPTADA" ? "SUCCESS" : "INFO",
      linkUrl: `/postulaciones/${app.id}`,
    });
  }

  await logAudit({
    userId: Number(session.user.id),
    action: decision === "ACEPTADA" ? "ACEPTAR_POSTULACION" : "RECHAZAR_POSTULACION",
    entity: "Postulacion",
    entityId: app.id,
    details: `Postulación #${app.id} (${app.employee.firstName} ${app.employee.lastName} -> "${app.opportunity.title}") marcada como ${decision} por ${session.user.name}.`,
  });

  revalidatePath(`/postulaciones/${applicationId}`);
  revalidatePath("/postulaciones");
  revalidatePath("/dashboard");
  redirect(`/postulaciones/${applicationId}?decidida=${decision}`);
}


