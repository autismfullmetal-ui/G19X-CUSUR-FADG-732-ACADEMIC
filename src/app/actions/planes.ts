"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, ROLES } from "@/lib/db";
import { auth } from "@/lib/auth";
import { generateAiRecommendation } from "@/lib/ai";
import { createNotification, notifyUsers } from "@/lib/notifications";
import { logAudit } from "@/lib/audit";
import { requireRole } from "@/lib/session";
import { num, str } from "./_helpers";
import { requireSessionSafe } from "./notificaciones";

export async function generateRecommendation(formData: FormData) {
  const session = await requireRole([
    ROLES.ADMIN,
    ROLES.RH,
    ROLES.SUPERVISOR,
  ]);
  const applicationId = num(formData.get("applicationId"));

  const app = await db.application.findUnique({
    where: { id: applicationId },
    include: {
      employee: {
        include: { department: true, position: true },
      },
      opportunity: true,
      gaps: {
        include: {
          requirement: {
            include: { competency: true },
          },
        },
      },
    },
  });
  if (!app) redirect("/postulaciones");

  const recommendation = await generateAiRecommendation({
    employee: `${app.employee.firstName} ${app.employee.lastName}`,
    position: app.employee.position?.title,
    department: app.employee.department?.name,
    opportunity: app.opportunity.title,
    opportunityDescription: app.opportunity.description,
    opportunityType: app.opportunity.type,
    vacancies: app.opportunity.vacancies,
    openDate: app.opportunity.openDate
      ? app.opportunity.openDate.toISOString().split("T")[0]
      : undefined,
    deadline: app.opportunity.deadline
      ? app.opportunity.deadline.toISOString().split("T")[0]
      : undefined,
    gaps: app.gaps.map((g) => ({
      competency: g.requirement.competency.name,
      description: g.requirement.competency.description,
      type: g.requirement.competency.type,
      currentLevel: g.currentLevel,
      requiredLevel: g.requiredLevel,
      mandatory: g.requirement.mandatory,
    })),
  });

  await db.recommendation.upsert({
    where: { applicationId },
    update: {
      text: recommendation.text,
      activities: JSON.stringify(recommendation.activities),
      modelVersion: recommendation.modelVersion,
      status: "PROPUESTA",
      reviewedById: null,
    },
    create: {
      applicationId,
      text: recommendation.text,
      activities: JSON.stringify(recommendation.activities),
      modelVersion: recommendation.modelVersion,
    },
  });

  // RN-010: queda como PROPUESTA hasta que un usuario autorizado la revise
  console.log(
    `[IA] recomendación generada por ${session.user.email} (origen: ${recommendation.source})`
  );
  revalidatePath(`/postulaciones/${applicationId}`);
  redirect(`/postulaciones/${applicationId}?recOk=1`);
}

export async function approveRecommendation(formData: FormData) {
  await requireRole([ROLES.ADMIN, ROLES.RH, ROLES.SUPERVISOR]);
  const recommendationId = num(formData.get("recommendationId"));
  const applicationId = num(formData.get("applicationId"));
  await db.recommendation.update({
    where: { id: recommendationId },
    data: { status: "APROBADA", reviewedById: Number((await auth())!.user!.id) },
  });
  revalidatePath(`/postulaciones/${applicationId}`);
  redirect(`/postulaciones/${applicationId}`);
}

export async function createPlan(formData: FormData) {
  const session = await requireRole([
    ROLES.ADMIN,
    ROLES.RH,
    ROLES.SUPERVISOR,
  ]);
  const applicationId = num(formData.get("applicationId"));
  const title = str(formData.get("title"));
  const objective = str(formData.get("objective"));
  const targetDateStr = str(formData.get("targetDate"));
  const targetDate = targetDateStr ? new Date(targetDateStr) : null;
  const activitiesJsonStr = str(formData.get("activitiesJson"));
  let activityEntries: { description: string; order: number; deliverable?: string | null }[] = [];

  if (activitiesJsonStr) {
    try {
      const parsed = JSON.parse(activitiesJsonStr) as Array<{
        orden?: number;
        fase?: string;
        titulo?: string;
        descripcion?: string;
        herramientas?: string;
        entregable?: string;
        criterio?: string;
      }>;
      if (Array.isArray(parsed) && parsed.length > 0) {
        activityEntries = parsed.map((a, i) => {
          const prefix = a.fase ? `[${a.fase}] ` : "";
          const title = a.titulo ? `${a.titulo}: ` : "";
          const desc = a.descripcion || "";
          const extras: string[] = [];
          if (a.herramientas) extras.push(`Herramientas: ${a.herramientas}`);
          if (a.entregable) extras.push(`Entregable: ${a.entregable}`);
          if (a.criterio) extras.push(`Criterio: ${a.criterio}`);
          const fullDesc = `${prefix}${title}${desc}${extras.length > 0 ? ` (${extras.join(" | ")})` : ""}`;
          return {
            description: fullDesc.trim() || desc,
            order: a.orden ?? i + 1,
            deliverable: a.entregable ? `[Entregable esperado: ${a.entregable}]` : null,
          };
        });
      }
    } catch {
      activityEntries = [];
    }
  }

  if (activityEntries.length === 0) {
    const rawActivities = str(formData.get("activities"))
      .split("\n")
      .map((a) => a.trim())
      .filter(Boolean);
    activityEntries = rawActivities.map((description, i) => ({
      description,
      order: i + 1,
      deliverable: null,
    }));
  }

  if (!title || !objective || activityEntries.length === 0) {
    redirect(`/postulaciones/${applicationId}?error=plan`);
  }

  const app = await db.application.findUnique({
    where: { id: applicationId },
    include: { employee: true, opportunity: true },
  });
  if (!app) redirect("/postulaciones");

  const plan = await db.developmentPlan.create({
    data: {
      employeeId: app.employeeId,
      applicationId,
      title,
      objective,
      targetDate,
      status: "PROPUESTO",
      strategicObjectiveId: app.opportunity?.objectiveId || undefined,
      createdById: Number(session.user.id),
      activities: {
        create: activityEntries.map((a) => ({
          description: a.description,
          order: a.order,
          deliverable: a.deliverable,
        })),
      },
    },
  });

  // RF-026: Auditoría
  await logAudit({
    userId: Number(session.user.id),
    action: "CREAR_PLAN",
    entity: "Plan",
    entityId: plan.id,
    details: `Creado plan "${plan.title}" con ${activityEntries.length} actividades para colaborador #${app.employeeId}.`,
  });

  revalidatePath(`/postulaciones/${applicationId}`);
  revalidatePath("/planes");
  redirect(`/postulaciones/${applicationId}?plan=${plan.id}`);
}

export async function approvePlan(formData: FormData) {
  const session = await requireRole([ROLES.ADMIN, ROLES.RH, ROLES.SUPERVISOR]);
  const planId = num(formData.get("planId"));
  const applicationId = num(formData.get("applicationId"));
  const plan = await db.developmentPlan.update({
    where: { id: planId },
    data: { status: "APROBADO", approvedById: Number(session.user.id) },
    include: { employee: true },
  });

  // RF-025: Notificar al empleado
  if (plan.employee.userId) {
    await createNotification({
      userId: plan.employee.userId,
      title: "Plan de desarrollo aprobado",
      message: `Tu plan "${plan.title}" ha sido aprobado por ${session.user.name}. ¡Ya puedes comenzar tus actividades!`,
      type: "SUCCESS",
      linkUrl: "/planes",
    });
  }

  // RF-026: Auditoría
  await logAudit({
    userId: Number(session.user.id),
    action: "APROBAR_PLAN",
    entity: "Plan",
    entityId: plan.id,
    details: `Plan #${plan.id} ("${plan.title}") aprobado por ${session.user.name}.`,
  });

  revalidatePath(`/postulaciones/${applicationId}`);
  revalidatePath("/planes");
}

export async function setPlanActivityStatus(formData: FormData) {
  const session = await requireSessionSafe();
  const activityId = num(formData.get("activityId"));
  const status = str(formData.get("status"));
  const valid = [
    "PENDIENTE",
    "EN_PROGRESO",
    "ENTREGADA",
    "COMPLETADA",
    "NO_COMPLETADA",
    "CANCELADA",
  ];
  if (!valid.includes(status)) return;

  const activity = await db.planActivity.findUnique({
    where: { id: activityId },
    include: { plan: { include: { employee: true } } },
  });
  if (!activity) return;

  // El empleado solo actualiza sus propias actividades; RH/Supervisor cualquiera
  if (session.user.role === ROLES.EMPLEADO) {
    if (activity.plan.employee.userId !== Number(session.user.id)) return;
  } else if (!["ADMIN", "RH", "SUPERVISOR"].includes(session.user.role)) {
    return;
  }

  await db.planActivity.update({ where: { id: activityId }, data: { status } });

  // Si pasa a EN_PROGRESO y el plan estaba en APROBADO, pasarlo a EN_PROGRESO
  if (status === "EN_PROGRESO" && activity.plan.status === "APROBADO") {
    await db.developmentPlan.update({
      where: { id: activity.planId },
      data: { status: "EN_PROGRESO" },
    });
  }

  // Si todas las actividades están completadas, marcar plan COMPLETADO
  const remaining = await db.planActivity.count({
    where: {
      planId: activity.planId,
      status: { notIn: ["COMPLETADA", "CANCELADA"] },
    },
  });
  if (remaining === 0 && status === "COMPLETADA") {
    await db.developmentPlan.update({
      where: { id: activity.planId },
      data: { status: "COMPLETADO" },
    });
  }
  revalidatePath(`/postulaciones/${activity.plan.applicationId ?? ""}`);
  revalidatePath("/planes");
}

export async function submitActivityDeliverable(formData: FormData) {
  const session = await requireSessionSafe();
  const activityId = num(formData.get("activityId"));
  const deliverable = str(formData.get("deliverable"));
  const evidenceUrl = str(formData.get("evidenceUrl"));

  if (!activityId || !deliverable) return;

  const activity = await db.planActivity.findUnique({
    where: { id: activityId },
    include: { plan: { include: { employee: true } } },
  });
  if (!activity) return;

  if (session.user.role === ROLES.EMPLEADO) {
    if (activity.plan.employee.userId !== Number(session.user.id)) return;
  } else if (!["ADMIN", "RH", "SUPERVISOR"].includes(session.user.role)) {
    return;
  }

  await db.planActivity.update({
    where: { id: activityId },
    data: {
      deliverable,
      evidenceUrl: evidenceUrl || null,
      submittedAt: new Date(),
      status: "ENTREGADA",
    },
  });

  if (activity.plan.status === "APROBADO") {
    await db.developmentPlan.update({
      where: { id: activity.planId },
      data: { status: "EN_PROGRESO" },
    });
  }

  // RF-025: Notificar al supervisor del empleado (o RH si no tiene)
  const employeeWithSup = await db.employee.findUnique({
    where: { id: activity.plan.employeeId },
    include: { supervisor: true },
  });
  if (employeeWithSup?.supervisor?.userId) {
    await createNotification({
      userId: employeeWithSup.supervisor.userId,
      title: "Entregable recibido para revisión",
      message: `${activity.plan.employee.firstName} ${activity.plan.employee.lastName} ha enviado el entregable de la actividad: "${activity.description.slice(0, 60)}".`,
      type: "ACTION_REQUIRED",
      linkUrl: "/planes",
    });
  }

  // RF-026: Auditoría
  await logAudit({
    userId: Number(session.user.id),
    action: "ENTREGA_ACTIVIDAD",
    entity: "Actividad",
    entityId: activityId,
    details: `Entregable enviado por ${activity.plan.employee.firstName} ${activity.plan.employee.lastName} en actividad #${activityId}.`,
  });

  revalidatePath(`/postulaciones/${activity.plan.applicationId ?? ""}`);
  revalidatePath("/planes");
}

export async function reviewActivityDeliverable(formData: FormData) {
  const session = await requireRole([ROLES.ADMIN, ROLES.SUPERVISOR]);
  const activityId = num(formData.get("activityId"));
  const status = str(formData.get("status")); // COMPLETADA o EN_PROGRESO
  const feedback = str(formData.get("feedback"));

  if (!activityId || !["COMPLETADA", "EN_PROGRESO"].includes(status)) return;

  const activity = await db.planActivity.findUnique({
    where: { id: activityId },
    include: { plan: { include: { employee: true } } },
  });
  if (!activity) return;

  await db.planActivity.update({
    where: { id: activityId },
    data: {
      status,
      feedback: feedback || null,
      reviewedAt: new Date(),
    },
  });

  // Si todas las actividades están completadas, marcar plan COMPLETADO
  const remaining = await db.planActivity.count({
    where: {
      planId: activity.planId,
      status: { notIn: ["COMPLETADA", "CANCELADA"] },
    },
  });
  if (remaining === 0 && status === "COMPLETADA") {
    await db.developmentPlan.update({
      where: { id: activity.planId },
      data: { status: "COMPLETADO" },
    });
  }

  // RF-025: Notificar al colaborador sobre la calificación/revisión
  if (activity.plan.employee.userId) {
    await createNotification({
      userId: activity.plan.employee.userId,
      title: status === "COMPLETADA" ? "✓ Entregable aprobado" : "Ajustes solicitados en tu entregable",
      message: status === "COMPLETADA"
        ? `Tu evaluador (${session.user.name}) ha aprobado tu entrega en: "${activity.description.slice(0, 50)}...".`
        : `Tu evaluador (${session.user.name}) solicitó ajustes en: "${activity.description.slice(0, 50)}...". Revisa los comentarios para corregir.`,
      type: status === "COMPLETADA" ? "SUCCESS" : "WARNING",
      linkUrl: "/planes",
    });
  }

  // RF-026: Auditoría
  await logAudit({
    userId: Number(session.user.id),
    action: "REVISION_ACTIVIDAD",
    entity: "Actividad",
    entityId: activityId,
    details: `Actividad #${activityId} calificada como ${status} por ${session.user.name}.`,
  });

  revalidatePath(`/postulaciones/${activity.plan.applicationId ?? ""}`);
  revalidatePath("/planes");
}


