"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { db, ROLES } from "@/lib/db";
import { auth } from "@/lib/auth";
import { calcCompatibility } from "@/lib/compatibility";
import { generateAiRecommendation } from "@/lib/ai";

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
  await requireRole([ROLES.ADMIN, ROLES.RH]);
  const email = str(formData.get("email")).toLowerCase();
  if (!email || !str(formData.get("firstName"))) {
    redirect("/empleados?error=datos");
  }

  const existingUser = await db.user.findUnique({ where: { email } });
  let userId: number | null = existingUser?.id ?? null;
  if (!userId) {
    const user = await db.user.create({
      data: {
        email,
        passwordHash: bcrypt.hashSync(DEFAULT_PASSWORD, 10),
        name: `${str(formData.get("firstName"))} ${str(formData.get("lastName"))}`,
        role: ROLES.EMPLEADO,
      },
    });
    userId = user.id;
  }

  try {
    await db.employee.create({
      data: {
        firstName: str(formData.get("firstName")),
        lastName: str(formData.get("lastName")),
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
  revalidatePath("/empleados");
  redirect("/empleados?ok=1");
}

export async function setEmployeeStatus(formData: FormData) {
  await requireRole([ROLES.ADMIN, ROLES.RH]);
  const id = num(formData.get("employeeId"));
  const status = str(formData.get("status")) === "ACTIVO" ? "ACTIVO" : "INACTIVO";
  await db.employee.update({ where: { id }, data: { status } });
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
  await requireRole([ROLES.ADMIN, ROLES.RH]);
  const name = str(formData.get("name"));
  if (!name) redirect("/competencias?error=datos");
  try {
    await db.competency.create({
      data: {
        name,
        description: str(formData.get("description")),
        type: str(formData.get("type")) || "TECNICA",
      },
    });
  } catch {
    redirect("/competencias?error=duplicado");
  }
  revalidatePath("/competencias");
  redirect("/competencias?ok=1");
}

export async function toggleCompetency(formData: FormData) {
  await requireRole([ROLES.ADMIN, ROLES.RH]);
  const id = num(formData.get("competencyId"));
  const current = await db.competency.findUnique({ where: { id } });
  if (current) {
    await db.competency.update({
      where: { id },
      data: { status: current.status === "ACTIVA" ? "INACTIVA" : "ACTIVA" },
    });
  }
  revalidatePath("/competencias");
}

/* ============ EVALUACIONES (RH/SUPERVISOR/ADMIN) ============ */

export async function createEvaluation(formData: FormData) {
  const session = await requireRole([ROLES.ADMIN, ROLES.RH, ROLES.SUPERVISOR]);
  const employeeId = num(formData.get("employeeId"));
  if (!employeeId) redirect("/evaluaciones?error=datos");

  const competencies = await db.competency.findMany({
    where: { status: "ACTIVA" },
  });

  const evaluation = await db.evaluation.create({
    data: {
      employeeId,
      evaluatorId: Number(session.user.id),
      type: str(formData.get("type")) || "INICIAL",
      status: "FINALIZADA",
      comment: str(formData.get("comment")) || null,
      finalizedAt: new Date(),
    },
  });

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
  }
  revalidatePath("/evaluaciones");
  redirect("/evaluaciones?ok=1");
}

/* ============ OPORTUNIDADES (RH/ADMIN) ============ */

export async function createOpportunity(formData: FormData) {
  await requireRole([ROLES.ADMIN, ROLES.RH]);
  const title = str(formData.get("title"));
  if (!title) redirect("/oportunidades?error=datos");

  const compIds = formData.getAll("reqCompetencyId").map((v) => num(v));
  const levels = formData.getAll("reqLevel").map((v) => num(v));
  const weights = formData.getAll("reqWeight").map((v) => num(v) || 1);
  const mandatories = formData.getAll("reqMandatory").map((v) => str(v) === "si");

  const opportunity = await db.opportunity.create({
    data: {
      title,
      description: str(formData.get("description")),
      type: str(formData.get("type")) || "PROYECTO",
      createdById: Number((await auth())!.user!.id),
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
  revalidatePath("/oportunidades");
  redirect(`/oportunidades?ok=1&edit=${opportunity.id}`);
}

export async function publishOpportunity(formData: FormData) {
  await requireRole([ROLES.ADMIN, ROLES.RH]);
  const id = num(formData.get("opportunityId"));
  const count = await db.opportunityRequirement.count({
    where: { opportunityId: id },
  });
  // RN-002: al menos una competencia requerida
  if (count === 0) redirect("/oportunidades?error=sinrequisitos");
  await db.opportunity.update({ where: { id }, data: { status: "PUBLICADA" } });
  revalidatePath("/oportunidades");
}

export async function closeOpportunity(formData: FormData) {
  await requireRole([ROLES.ADMIN, ROLES.RH]);
  const id = num(formData.get("opportunityId"));
  await db.opportunity.update({ where: { id }, data: { status: "CERRADA" } });
  // RF-042 / RN-014: cancelar postulaciones activas
  await db.application.updateMany({
    where: { opportunityId: id, status: "ACTIVA" },
    data: { status: "NO_PROCEDE" },
  });
  revalidatePath("/oportunidades");
  revalidatePath("/postulaciones");
}

/* ============ POSTULACIONES (EMPLEADO) ============ */

export async function applyToOpportunity(formData: FormData) {
  const session = await requireRole([ROLES.EMPLEADO]);
  const opportunityId = num(formData.get("opportunityId"));
  const employee = await db.employee.findUnique({
    where: { userId: Number(session.user.id) },
  });
  if (!employee) redirect("/oportunidades?error=sempleado");

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

  revalidatePath("/postulaciones");
  redirect(`/postulaciones/${application.id}`);
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
      employee: true,
      opportunity: true,
      gaps: { include: { requirement: { include: { competency: true } } } },
    },
  });
  if (!app) redirect("/postulaciones");

  const recommendation = await generateAiRecommendation({
    employee: `${app.employee.firstName} ${app.employee.lastName}`,
    opportunity: app.opportunity.title,
    gaps: app.gaps.map((g) => ({
      competency: g.requirement.competency.name,
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
  const activities = str(formData.get("activities"))
    .split("\n")
    .map((a) => a.trim())
    .filter(Boolean);

  if (!title || !objective || activities.length === 0) {
    redirect(`/postulaciones/${applicationId}?error=plan`);
  }

  const app = await db.application.findUnique({
    where: { id: applicationId },
    include: { employee: true },
  });
  if (!app) redirect("/postulaciones");

  const plan = await db.developmentPlan.create({
    data: {
      employeeId: app.employeeId,
      applicationId,
      title,
      objective,
      status: "PROPUESTO",
      createdById: Number(session.user.id),
      activities: {
        create: activities.map((description, i) => ({
          description,
          order: i + 1,
        })),
      },
    },
  });
  revalidatePath(`/postulaciones/${applicationId}`);
  revalidatePath("/planes");
  redirect(`/postulaciones/${applicationId}?plan=${plan.id}`);
}

export async function approvePlan(formData: FormData) {
  const session = await requireRole([ROLES.ADMIN, ROLES.RH, ROLES.SUPERVISOR]);
  const planId = num(formData.get("planId"));
  const applicationId = num(formData.get("applicationId"));
  await db.developmentPlan.update({
    where: { id: planId },
    data: { status: "APROBADO", approvedById: Number(session.user.id) },
  });
  revalidatePath(`/postulaciones/${applicationId}`);
  revalidatePath("/planes");
}

export async function setPlanActivityStatus(formData: FormData) {
  const session = await requireSessionSafe();
  const activityId = num(formData.get("activityId"));
  const status = str(formData.get("status"));
  const valid = ["PENDIENTE", "EN_PROGRESO", "COMPLETADA", "NO_COMPLETADA", "CANCELADA"];
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
  // Si todas las actividades están completadas, marcar plan COMPLETADO
  const remaining = await db.planActivity.count({
    where: { planId: activity.planId, status: { notIn: ["COMPLETADA", "CANCELADA"] } },
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

async function requireSessionSafe() {
  const session = await auth();
  if (!session?.user) throw new Error("No autorizado");
  return session;
}
