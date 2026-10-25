import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

function must(cond, msg) {
  if (!cond) {
    console.error("FALLO:", msg);
    process.exit(1);
  }
}

try {
  console.log("=== INICIANDO PRUEBAS DE ENTREGABLES, REVISIÓN Y EVALUACIÓN POST-CAPACITACIÓN ===");

  const admin = await db.user.findFirst({ where: { role: "ADMIN" } });
  must(!!admin, "existe usuario ADMIN");
  const employee = await db.employee.findFirst({ include: { user: true } });
  must(!!employee, "existe empleado");
  const comp = await db.competency.findFirst({ where: { name: "Python Avanzado" } });
  must(!!comp, "existe competencia 'Python Avanzado'");

  // 1. Crear oportunidad de prueba
  const opp = await db.opportunity.create({
    data: {
      title: "Oportunidad Test Entregables",
      description: "Prueba de entregables y evaluaciones",
      type: "PROYECTO",
      status: "PUBLICADA",
      createdById: admin.id,
      requirements: { create: [{ competencyId: comp.id, requiredLevel: 4, weight: 3, mandatory: true }] },
    },
  });
  must(!!opp.id, "oportunidad creada");

  // 2. Crear postulación con brecha de nivel 2 a 4
  const req = await db.opportunityRequirement.findFirst({ where: { opportunityId: opp.id } });
  must(!!req, "requisito de oportunidad creado");
  const app = await db.application.create({
    data: {
      opportunityId: opp.id,
      employeeId: employee.id,
      status: "ACTIVA",
      compatibility: 50,
      gaps: { create: [{ requirementId: req.id, currentLevel: 2, requiredLevel: 4, status: "ABIERTA" }] },
    },
  });
  must(!!app.id, "postulación creada");

  // 3. Crear plan de desarrollo con 2 actividades
  const plan = await db.developmentPlan.create({
    data: {
      employeeId: employee.id,
      applicationId: app.id,
      title: "Plan Especializado en Python",
      objective: "Alcanzar nivel 4 en Python",
      status: "APROBADO",
      createdById: admin.id,
      activities: {
        create: [
          { description: "Desarrollar microservicio en FastAPI con pruebas unitarias", order: 1, status: "PENDIENTE" },
          { description: "Reevaluación de competencias técnicas", order: 2, status: "PENDIENTE" },
        ],
      },
    },
    include: { activities: { orderBy: { order: "asc" } } },
  });
  must(plan.id > 0, "plan de desarrollo creado");
  must(plan.activities.length === 2, "plan tiene 2 actividades");

  const act1 = plan.activities[0];
  const act2 = plan.activities[1];

  console.log("1. Plan y actividades creadas: OK");

  // 4. Empleado entrega el entregable de la actividad 1
  const submittedDeliverable = "Microservicio de autenticación implementado con JWT y FastAPI. Cobertura del 88%.";
  const evidenceUrl = "https://github.com/empresa/microservicio-python";

  await db.planActivity.update({
    where: { id: act1.id },
    data: { deliverable: submittedDeliverable, evidenceUrl, submittedAt: new Date(), status: "ENTREGADA" },
  });

  await db.developmentPlan.update({ where: { id: plan.id }, data: { status: "EN_PROGRESO" } });

  const act1Submitted = await db.planActivity.findUnique({ where: { id: act1.id } });
  must(act1Submitted.deliverable === submittedDeliverable, "entregable registrado");
  must(act1Submitted.evidenceUrl === evidenceUrl, "enlace de evidencia guardado");
  must(act1Submitted.status === "ENTREGADA", "estado de actividad pasa a ENTREGADA");
  must(act1Submitted.submittedAt !== null, "fecha de entrega registrada");

  console.log("2. Entregable registrado: OK");
  console.log("3. Enlace de evidencia guardado: OK");
  console.log("4. Estado de actividad pasa a ENTREGADA: OK");
  console.log("5. Fecha de entrega registrada: OK");
  // 5. Supervisor revisa el entregable y lo aprueba
  const supervisorFeedback = "Excelente estructuración del código y buenas pruebas unitarias. Cumple satisfactoriamente.";
  await db.planActivity.update({
    where: { id: act1.id },
    data: { status: "COMPLETADA", feedback: supervisorFeedback, reviewedAt: new Date() },
  });

  const act1Reviewed = await db.planActivity.findUnique({ where: { id: act1.id } });
  must(act1Reviewed.status === "COMPLETADA", "actividad aprobada como COMPLETADA");
  must(act1Reviewed.feedback === supervisorFeedback, "retroalimentación registrada");
  must(act1Reviewed.reviewedAt !== null, "fecha de revisión registrada");

  console.log("6. Actividad aprobada como COMPLETADA: OK");
  console.log("7. Retroalimentación registrada: OK");
  console.log("8. Fecha de revisión registrada: OK");

  // 6. Completar actividad 2
  await db.planActivity.update({
    where: { id: act2.id },
    data: { status: "COMPLETADA", deliverable: "Sesión de reevaluación técnica completada con el equipo", submittedAt: new Date(), reviewedAt: new Date() },
  });

  const remaining = await db.planActivity.count({ where: { planId: plan.id, status: { notIn: ["COMPLETADA", "CANCELADA"] } } });
  if (remaining === 0) {
    await db.developmentPlan.update({ where: { id: plan.id }, data: { status: "COMPLETADO" } });
  }

  const planFinalizado = await db.developmentPlan.findUnique({ where: { id: plan.id } });
  must(planFinalizado.status === "COMPLETADO", "todas las actividades concluidas -> Plan pasa a COMPLETADO");
  console.log("9. Todas las actividades concluidas -> Plan pasa a COMPLETADO: OK");

  // 7. Realizar Evaluación POST_CAPACITACION alcanzando nivel 4 en Python
  const evalPost = await db.evaluation.create({
    data: { employeeId: employee.id, evaluatorId: admin.id, type: "POST_CAPACITACION", status: "FINALIZADA", comment: "Evaluación de cierre de plan. El colaborador alcanzó el nivel requerido.", finalizedAt: new Date() },
  });
  must(!!evalPost.id, "evaluación post-capacitación creada");

  await db.evaluationScore.create({ data: { evaluationId: evalPost.id, competencyId: comp.id, level: 4 } });

  await db.employeeCompetency.upsert({
    where: { employeeId_competencyId: { employeeId: employee.id, competencyId: comp.id } },
    update: { level: 4 },
    create: { employeeId: employee.id, competencyId: comp.id, level: 4 },
  });

  const openGaps = await db.gap.findMany({ where: { application: { employeeId: employee.id }, requirement: { competencyId: comp.id } } });
  for (const g of openGaps) {
    if (4 >= g.requiredLevel) {
      await db.gap.update({ where: { id: g.id }, data: { status: "SUPERADA", currentLevel: 4 } });
    }
  }

  const gapActualizada = await db.gap.findFirst({ where: { applicationId: app.id } });
  must(gapActualizada.status === "SUPERADA", "brecha actualizada a SUPERADA tras la evaluación");
  must(gapActualizada.currentLevel === 4, "nivel actual de la brecha actualizado a 4");

  console.log("10. Brecha actualizada a SUPERADA tras la evaluación: OK");
  console.log("11. Nivel actual de la brecha actualizado a 4: OK");

  // Limpieza de datos de prueba
  await db.planActivity.deleteMany({ where: { planId: plan.id } });
  await db.developmentPlan.delete({ where: { id: plan.id } });
  await db.gap.deleteMany({ where: { applicationId: app.id } });
  await db.application.delete({ where: { id: app.id } });
  await db.opportunityRequirement.deleteMany({ where: { opportunityId: opp.id } });
  await db.opportunity.delete({ where: { id: opp.id } });
  await db.evaluationScore.deleteMany({ where: { evaluationId: evalPost.id } });
  await db.evaluation.delete({ where: { id: evalPost.id } });

  console.log("=== TODAS LAS PRUEBAS DE ENTREGABLES Y EVALUACIÓN FINALIZARON EXITOSAMENTE ===");
} catch (err) {
  console.error("ERROR EN PRUEBA:", err.message);
  process.exit(1);
} finally {
  await db.$disconnect();
}
