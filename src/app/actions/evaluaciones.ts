"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, ROLES } from "@/lib/db";
import { calcCompatibility } from "@/lib/compatibility";
import { createNotification } from "@/lib/notifications";
import { logAudit } from "@/lib/audit";
import { requireRole } from "@/lib/session";
import { num, str } from "./_helpers";
/* RH y Supervisor pueden realizar evaluaciones iniciales y post-capacitación. */

export async function createEvaluation(formData: FormData) {
  const session = await requireRole([ROLES.ADMIN, ROLES.RH, ROLES.SUPERVISOR]);
  const employeeId = num(formData.get("employeeId"));
  if (!employeeId) redirect("/evaluaciones?error=datos");

  const employee = await db.employee.findUnique({
    where: { id: employeeId },
    include: { department: true },
  });
  if (!employee) redirect("/evaluaciones?error=noexiste");

  // PRD 5.2: el supervisor solo puede evaluar a sus colaboradores directos
  if (session.user.role === "SUPERVISOR") {
    const supervisorEmployee = await db.employee.findUnique({
      where: { userId: Number(session.user.id) },
      select: { id: true },
    });
    if (!supervisorEmployee || employee.supervisorId !== supervisorEmployee.id) {
      redirect("/evaluaciones?error=nosubordinado");
    }
  }

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


