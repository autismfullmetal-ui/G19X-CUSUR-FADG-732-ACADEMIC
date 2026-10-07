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

const DEFAULT_PASSWORD = "Demo1234!";

async function requireRole(roles: string[]) {
  const session = await auth();
  if (!session?.user || !roles.includes(session.user.role)) {
    throw new Error("No autorizado");
  }
  return session;
}

function num(v: FormDataEntryValue | null): number {
  return Number(v ?? 0);
}

function str(v: FormDataEntryValue | null): string {
  return String(v ?? "").trim();
}

/* ============ EMPLEADOS (RH/ADMIN) ============ */

export async function createEmployee(formData: FormData) {
  const session = await requireRole([ROLES.ADMIN, ROLES.RH]);
  const email = str(formData.get("email")).toLowerCase();
  const firstName = str(formData.get("firstName"));
  const lastName = str(formData.get("lastName"));
  if (!email || !firstName) {
    redirect("/empleados?error=datos");
  }

  const existingUser = await db.user.findUnique({ where: { email } });
  let userId: number | null = existingUser?.id ?? null;
  if (!userId) {
    const user = await db.user.create({
      data: {
        email,
        passwordHash: bcrypt.hashSync(DEFAULT_PASSWORD, 10),
        name: `${firstName} ${lastName}`.trim(),
        role: ROLES.EMPLEADO,
      },
    });
    userId = user.id;
  }

  let employee;
  try {
    employee = await db.employee.create({
      data: {
        firstName,
        lastName,
        email,
        departmentId: num(formData.get("departmentId")),
        positionId: num(formData.get("positionId")),
        supervisorId: num(formData.get("supervisorId")) || null,
        userId,
      },
    });
  } catch {
    redirect("/empleados?error=duplicado");
  }

  // Competencias iniciales seleccionadas por RH (RF-006, RF-036)
  const rawCompIds = formData.getAll("empCompetencyId").map((v) => num(v));
  const rawLevels = formData.getAll("empLevel").map((v) => num(v));

  const validEntries: { competencyId: number; level: number }[] = [];
  const seenComps = new Set<number>();

  for (let i = 0; i < rawCompIds.length; i++) {
    const cid = rawCompIds[i];
    const lvl = rawLevels[i] || 1;
    if (cid > 0 && lvl >= 1 && lvl <= 5 && !seenComps.has(cid)) {
      seenComps.add(cid);
      validEntries.push({ competencyId: cid, level: lvl });
    }
  }

  if (validEntries.length > 0) {
    const evaluatorId = session?.user?.id ? Number(session.user.id) : null;
    let evalId: number | null = null;

    if (evaluatorId) {
      const evaluation = await db.evaluation.create({
        data: {
          employeeId: employee.id,
          evaluatorId,
          type: "INICIAL",
          status: "FINALIZADA",
          comment: "Evaluación diagnóstica inicial registrada al dar de alta al empleado por RH.",
          finalizedAt: new Date(),
        },
      });
      evalId = evaluation.id;
    }

    for (const item of validEntries) {
      if (evalId) {
        await db.evaluationScore.create({
          data: {
            evaluationId: evalId,
            competencyId: item.competencyId,
            level: item.level,
          },
        });
      }

      await db.employeeCompetency.upsert({
        where: {
          employeeId_competencyId: {
            employeeId: employee.id,
            competencyId: item.competencyId,
          },
        },
        update: { level: item.level },
        create: {
          employeeId: employee.id,
          competencyId: item.competencyId,
          level: item.level,
        },
      });
    }
  }

  // RF-026: Auditoría
  await logAudit({
    userId: Number(session.user.id),
    action: "CREAR_EMPLEADO",
    entity: "Empleado",
    entityId: employee.id,
    details: `Alta de empleado ${firstName} ${lastName} (${email}) con ${validEntries.length} competencias iniciales.`,
  });

  revalidatePath("/empleados");
  revalidatePath("/evaluaciones");
  redirect("/empleados?ok=1");
}

export async function setEmployeeStatus(formData: FormData) {
  const session = await requireRole([ROLES.ADMIN, ROLES.RH]);
  const id = num(formData.get("employeeId"));
  const status = str(formData.get("status")) === "ACTIVO" ? "ACTIVO" : "INACTIVO";
  await db.employee.update({ where: { id }, data: { status } });

  // RF-026: Auditoría
  await logAudit({
    userId: Number(session.user.id),
    action: "ACTUALIZAR_ESTADO_EMPLEADO",
    entity: "Empleado",
    entityId: id,
    details: `Estado del empleado #${id} cambiado a ${status}.`,
  });

  revalidatePath("/empleados");
}

export async function createDepartment(formData: FormData) {
  await requireRole([ROLES.ADMIN, ROLES.RH]);
  const name = str(formData.get("name"));
  if (name) await db.department.create({ data: { name } });
  revalidatePath("/empleados");
}

export async function createPosition(formData: FormData) {
  await requireRole([ROLES.ADMIN, ROLES.RH]);
  const title = str(formData.get("title"));
  if (title) await db.position.create({ data: { title } });
  revalidatePath("/empleados");
}

/* ============ COMPETENCIAS (RH/ADMIN) ============ */

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

/* ============ EVALUACIONES (RH/SUPERVISOR/ADMIN) ============ */

export async function createEvaluation(formData: FormData) {
  const session = await requireRole([ROLES.ADMIN, ROLES.RH, ROLES.SUPERVISOR]);
  const employeeId = num(formData.get("employeeId"));
  if (!employeeId) redirect("/evaluaciones?error=datos");

  const employee = await db.employee.findUnique({
    where: { id: employeeId },
    include: { department: true },
  });
  if (!employee) redirect("/evaluaciones?error=noexiste");

  const competencies = await db.competency.findMany({
    where: { status: "ACTIVA" },
  });

  const type = str(formData.get("type")) || "INICIAL";
  const planId = num(formData.get("planId"));
  const returnTo = str(formData.get("returnTo"));

  const evaluation = await db.evaluation.create({
    data: {
      employeeId,
      evaluatorId: Number(session.user.id),
      type,
      status: "FINALIZADA",
      comment: str(formData.get("comment")) || null,
      finalizedAt: new Date(),
    },
  });

  if (planId) {
    await db.developmentPlan.update({
      where: { id: planId },
      data: { postEvaluationId: evaluation.id },
    });
  }

  // RF-006: Evaluación de Competencias
  for (const c of competencies) {
    const level = num(formData.get(`level_${c.id}`));
    if (level < 1 || level > 5) continue;
    await db.evaluationScore.create({
      data: { evaluationId: evaluation.id, competencyId: c.id, level },
    });
    // RF-023: actualizar nivel vigente
    await db.employeeCompetency.upsert({
      where: {
        employeeId_competencyId: { employeeId, competencyId: c.id },
      },
      update: { level },
      create: { employeeId, competencyId: c.id, level },
    });

    // Si es post-capacitación, verificar y actualizar brechas del empleado
    if (type === "POST_CAPACITACION") {
      const openGaps = await db.gap.findMany({
        where: {
          application: { employeeId },
          requirement: { competencyId: c.id },
        },
      });
      for (const g of openGaps) {
        if (level >= g.requiredLevel) {
          await db.gap.update({
            where: { id: g.id },
            data: { status: "SUPERADA", currentLevel: level },
          });
        } else {
          await db.gap.update({
            where: { id: g.id },
            data: { currentLevel: level },
          });
        }
      }
    }
  }

  // Si fue post-capacitación, recalcular la compatibilidad de todas las postulaciones del colaborador (RF-011 a RF-013)
  if (type === "POST_CAPACITACION") {
    const apps = await db.application.findMany({
      where: { employeeId },
      include: {
        opportunity: {
          include: {
            requirements: true,
          },
        },
      },
    });

    const updatedCompetencies = await db.employeeCompetency.findMany({
      where: { employeeId },
    });

    for (const app of apps) {
      const { compatibility } = calcCompatibility(
        app.opportunity.requirements.map((r) => ({
          competencyId: r.competencyId,
          requiredLevel: r.requiredLevel,
          weight: r.weight,
          mandatory: r.mandatory,
        })),
        updatedCompetencies.map((ec) => ({
          competencyId: ec.competencyId,
          level: ec.level,
        }))
      );
      await db.application.update({
        where: { id: app.id },
        data: { compatibility },
      });
    }
  }

  // RF-007 / OE-04: Evaluación de Desempeño y Cumplimiento de Objetivos Organizacionales
  const activeObjectives = await db.organizationalObjective.findMany({
    where: {
      status: "ACTIVO",
      OR: [
        { departmentId: employee.departmentId },
        { departmentId: null },
      ],
    },
  });

  let objectivesEvaluatedCount = 0;
  for (const obj of activeObjectives) {
    const valStr = formData.get(`obj_val_${obj.id}`);
    const ratingVal = num(formData.get(`obj_rating_${obj.id}`));
    if (valStr !== null && valStr !== "" || ratingVal > 0) {
      const currentVal = num(valStr);
      const complianceRate = obj.targetValue > 0
        ? Math.min(200, Math.round((currentVal / obj.targetValue) * 100 * 10) / 10)
        : 100;
      const rating = ratingVal >= 1 && ratingVal <= 5 ? ratingVal : 3;
      const feedback = str(formData.get(`obj_feedback_${obj.id}`)) || null;

      await db.objectiveEvaluation.create({
        data: {
          evaluationId: evaluation.id,
          objectiveId: obj.id,
          currentValue: currentVal,
          complianceRate,
          rating,
          feedback,
        },
      });
      objectivesEvaluatedCount++;
    }
  }

  // Notificación in-app al colaborador si tiene cuenta de usuario (RF-025)
  if (employee.userId) {
    await createNotification({
      userId: employee.userId,
      title: "Nueva evaluación registrada",
      message: `El evaluador (${session.user.name}) ha registrado tu evaluación (${type === "INICIAL" ? "Diagnóstica" : "Post-Capacitación"}) con ${competencies.length} competencias y ${objectivesEvaluatedCount} metas de desempeño.`,
      type: "INFO",
      linkUrl: "/evaluaciones",
    });
  }

  // RF-026: Auditoría
  await logAudit({
    userId: Number(session.user.id),
    action: type === "POST_CAPACITACION" ? "EVALUACION_POST_CAPACITACION" : "EVALUACION_DIAGNOSTICA",
    entity: "Evaluacion",
    entityId: evaluation.id,
    details: `Evaluación ${type} para ${employee.firstName} ${employee.lastName} (#${employeeId}): ${competencies.length} competencias y ${objectivesEvaluatedCount} objetivos organizacionales evaluados.`,
  });

  if (objectivesEvaluatedCount > 0) {
    await logAudit({
      userId: Number(session.user.id),
      action: "EVALUAR_OBJETIVOS",
      entity: "Objetivo",
      entityId: evaluation.id,
      details: `Evaluación de desempeño: Calificadas ${objectivesEvaluatedCount} metas estratégicas para colaborador #${employeeId}.`,
    });
  }

  revalidatePath("/evaluaciones");
  revalidatePath("/objetivos");
  revalidatePath("/postulaciones");
  revalidatePath("/planes");
  revalidatePath("/dashboard");
  if (returnTo) {
    const separator = returnTo.includes("?") ? "&" : "?";
    redirect(`${returnTo}${separator}evalOk=1`);
  }
  redirect("/evaluaciones?ok=1");
}

/* ============ OBJETIVOS ORGANIZACIONALES (RF-007 / OE-04) ============ */

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

/* ============ OPORTUNIDADES (RH/ADMIN) ============ */

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

/* ============ POSTULACIONES (EMPLEADO) ============ */

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

/* ============ PLANES DE DESARROLLO ============ */

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
      title: status === "COMPLETADA" ? "✓ Entregable aprobado" : "⚠️ Ajustes solicitados en tu entregable",
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

/* ============ GESTIÓN DE NOTIFICACIONES (RF-025) ============ */

export async function markNotificationAsRead(notificationId: number) {
  const session = await auth();
  if (!session?.user?.id) return;
  await db.notification.updateMany({
    where: {
      id: notificationId,
      userId: Number(session.user.id),
    },
    data: { read: true },
  });
  revalidatePath("/", "layout");
}

export async function markAllNotificationsAsRead() {
  const session = await auth();
  if (!session?.user?.id) return;
  await db.notification.updateMany({
    where: {
      userId: Number(session.user.id),
      read: false,
    },
    data: { read: true },
  });
  revalidatePath("/", "layout");
}

export async function clearAllNotifications() {
  const session = await auth();
  if (!session?.user?.id) return;
  await db.notification.deleteMany({
    where: {
      userId: Number(session.user.id),
    },
  });
  revalidatePath("/", "layout");
}

async function requireSessionSafe() {
  const session = await auth();
  if (!session?.user) throw new Error("No autorizado");
  return session;
}

/* ============ IMPORTACIÓN MASIVA CSV (RF-027, OE-18) ============ */

function parseCsv(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  return lines.map((line) => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  });
}

export async function importEmployeesCsv(formData: FormData) {
  const session = await requireRole([ROLES.ADMIN, ROLES.RH]);
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    redirect("/importacion?error=archivo_vacio");
  }

  const text = await file.text();
  const rows = parseCsv(text);
  if (rows.length < 2) {
    redirect("/importacion?error=sin_datos");
  }

  const header = rows[0].map((h) => h.toLowerCase());
  const colIndex = {
    firstName: header.findIndex((h) => h.includes("nombre") && !h.includes("apellido")),
    lastName: header.findIndex((h) => h.includes("apellido")),
    email: header.findIndex((h) => h.includes("email") || h.includes("correo")),
    department: header.findIndex((h) => h.includes("departamento") || h.includes("depto") || h.includes("area")),
    position: header.findIndex((h) => h.includes("puesto") || h.includes("cargo")),
    role: header.findIndex((h) => h.includes("rol")),
    supervisorEmail: header.findIndex((h) => h.includes("supervisor")),
  };

  if (colIndex.firstName === -1 || colIndex.email === -1) {
    redirect("/importacion?error=cabeceras_invalidas");
  }

  const passHash = bcrypt.hashSync(DEFAULT_PASSWORD, 10);
  let createdCount = 0;
  let skippedCount = 0;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const firstName = row[colIndex.firstName] || "";
    const lastName = colIndex.lastName !== -1 ? row[colIndex.lastName] || "" : "";
    const email = (row[colIndex.email] || "").toLowerCase().trim();
    const deptName = colIndex.department !== -1 ? row[colIndex.department] || "General" : "General";
    const posTitle = colIndex.position !== -1 ? row[colIndex.position] || "Colaborador" : "Colaborador";
    const roleRaw = (colIndex.role !== -1 ? row[colIndex.role] : "EMPLEADO")?.toUpperCase().trim();
    const role = [ROLES.ADMIN, ROLES.RH, ROLES.SUPERVISOR, ROLES.EMPLEADO].includes(roleRaw as any)
      ? roleRaw
      : ROLES.EMPLEADO;
    const supEmail = colIndex.supervisorEmail !== -1 ? (row[colIndex.supervisorEmail] || "").toLowerCase().trim() : "";

    if (!firstName || !email || !email.includes("@")) {
      skippedCount++;
      continue;
    }

    // Verificar si ya existe el empleado o usuario
    const existingEmp = await db.employee.findUnique({ where: { email } });
    const existingUser = await db.user.findUnique({ where: { email } });

    if (existingEmp || existingUser) {
      skippedCount++;
      continue;
    }

    // Upsert Department y Position
    const department = await db.department.upsert({
      where: { name: deptName },
      update: {},
      create: { name: deptName },
    });

    const position = await db.position.upsert({
      where: { title: posTitle },
      update: {},
      create: { title: posTitle },
    });

    // Crear User para acceso a la plataforma
    const user = await db.user.create({
      data: {
        email,
        name: `${firstName} ${lastName}`.trim(),
        passwordHash: passHash,
        role,
      },
    });

    // Buscar supervisor si fue proporcionado
    let supervisorId: number | null = null;
    if (supEmail) {
      const supervisor = await db.employee.findUnique({ where: { email: supEmail } });
      if (supervisor) {
        supervisorId = supervisor.id;
      }
    }

    // Crear Employee
    await db.employee.create({
      data: {
        firstName,
        lastName,
        email,
        departmentId: department.id,
        positionId: position.id,
        supervisorId,
        userId: user.id,
        status: "ACTIVO",
      },
    });

    createdCount++;
  }

  // RF-026: Auditoría
  await logAudit({
    userId: Number(session.user.id),
    action: "IMPORTACION_MASIVA",
    entity: "Empleado",
    details: `Importación masiva de personal: ${createdCount} colaboradores y usuarios dados de alta, ${skippedCount} omitidos (duplicados o incompletos).`,
  });

  revalidatePath("/empleados");
  revalidatePath("/dashboard");
  revalidatePath("/importacion");
  redirect(`/importacion?ok=empleados&created=${createdCount}&skipped=${skippedCount}`);
}

export async function importCompetenciesCsv(formData: FormData) {
  const session = await requireRole([ROLES.ADMIN, ROLES.RH]);
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    redirect("/importacion?error=archivo_vacio");
  }

  const text = await file.text();
  const rows = parseCsv(text);
  if (rows.length < 2) {
    redirect("/importacion?error=sin_datos");
  }

  const header = rows[0].map((h) => h.toLowerCase());
  const colIndex = {
    name: header.findIndex((h) => h.includes("nombre") || h.includes("competencia")),
    description: header.findIndex((h) => h.includes("descripcion") || h.includes("detalle")),
    type: header.findIndex((h) => h.includes("tipo")),
  };

  if (colIndex.name === -1) {
    redirect("/importacion?error=cabeceras_invalidas");
  }

  let createdCount = 0;
  let skippedCount = 0;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const name = row[colIndex.name]?.trim();
    const description = colIndex.description !== -1 ? row[colIndex.description]?.trim() : "";
    const typeRaw = colIndex.type !== -1 ? row[colIndex.type]?.toUpperCase().trim() : "TECNICA";
    const type = typeRaw.includes("BLANDA") ? "BLANDA" : "TECNICA";

    if (!name) {
      skippedCount++;
      continue;
    }

    const existing = await db.competency.findUnique({ where: { name } });
    if (existing) {
      skippedCount++;
      continue;
    }

    await db.competency.create({
      data: {
        name,
        description: description || name,
        type,
        status: "ACTIVA",
      },
    });

    createdCount++;
  }

  // RF-026: Auditoría
  await logAudit({
    userId: Number(session.user.id),
    action: "IMPORTACION_MASIVA",
    entity: "Competencia",
    details: `Importación masiva de catálogo de competencias: ${createdCount} creadas, ${skippedCount} omitidas por existir previamente.`,
  });

  revalidatePath("/competencias");
  revalidatePath("/dashboard");
  revalidatePath("/importacion");
  redirect(`/importacion?ok=competencias&created=${createdCount}&skipped=${skippedCount}`);
}

/* ============ GESTIÓN DE PERFIL Y CONTRASEÑAS (RF-028, RNF-001) ============ */

export async function changePassword(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const currentPassword = str(formData.get("currentPassword"));
  const newPassword = str(formData.get("newPassword"));
  const confirmPassword = str(formData.get("confirmPassword"));

  if (!currentPassword || !newPassword || !confirmPassword) {
    redirect("/perfil?error=campos_requeridos");
  }

  if (newPassword.length < 6) {
    redirect("/perfil?error=longitud_minima");
  }

  if (newPassword !== confirmPassword) {
    redirect("/perfil?error=coincidencia");
  }

  const userId = Number(session.user.id);
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) {
    redirect("/login");
  }

  const isValidCurrent = bcrypt.compareSync(currentPassword, user.passwordHash);
  if (!isValidCurrent) {
    redirect("/perfil?error=actual_incorrecta");
  }

  const newHash = bcrypt.hashSync(newPassword, 10);
  await db.user.update({
    where: { id: userId },
    data: { passwordHash: newHash },
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

  revalidatePath("/perfil");
  redirect("/perfil?ok=password_cambiada");
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
    data: { passwordHash: defaultHash },
  });

  // Notificar al usuario
  await createNotification({
    userId: userToReset.id,
    title: "Contraseña restablecida",
    message: `Tu contraseña ha sido restablecida por ${session.user.name} a la clave temporal "${DEFAULT_PASSWORD}". Te recomendamos cambiarla en tu Perfil.`,
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
