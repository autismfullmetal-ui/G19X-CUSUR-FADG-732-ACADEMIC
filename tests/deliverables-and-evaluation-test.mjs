import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function run() {
  console.log("=== INICIANDO PRUEBAS DE ENTREGABLES, REVISIÓN Y EVALUACIÓN POST-CAPACITACIÓN ===");

  const admin = await db.user.findFirst({ where: { role: "ADMIN" } });
  const employee = await db.employee.findFirst({
    include: { user: true },
  });
  const comp = await db.competency.findFirst({
    where: { name: "Python" },
  });

  // 1. Crear oportunidad de prueba
  const opp = await db.opportunity.create({
    data: {
      title: "Oportunidad Test Entregables",
      description: "Prueba de entregables y evaluaciones",
      type: "PROYECTO",
      status: "PUBLICADA",
      createdById: admin.id,
      requirements: {
        create: [
          { competencyId: comp.id, requiredLevel: 4, weight: 3, mandatory: true },
        ],
      },
    },
  });

  // 2. Crear postulación con brecha de nivel 2 a 4
  const app = await db.application.create({
    data: {
      opportunityId: opp.id,
      employeeId: employee.id,
      status: "ACTIVA",
      compatibility: 50,
      gaps: {
        create: [
          {
            requirementId: (
              await db.opportunityRequirement.findFirst({
                where: { opportunityId: opp.id },
              })
            ).id,
            currentLevel: 2,
            requiredLevel: 4,
            status: "ABIERTA",
          },
        ],
      },
    },
  });

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
          {
            description: "Desarrollar microservicio en FastAPI con pruebas unitarias",
            order: 1,
            status: "PENDIENTE",
          },
          {
            description: "Reevaluación de competencias técnicas",
            order: 2,
            status: "PENDIENTE",
          },
        ],
      },
    },
    include: { activities: { orderBy: { order: "asc" } } },
  });

  const act1 = plan.activities[0];
  const act2 = plan.activities[1];

  console.log("1. Plan y actividades creadas:", plan.id > 0 && plan.activities.length === 2);

  // 4. Empleado entrega el entregable de la actividad 1
  const submittedDeliverable = "Microservicio de autenticación implementado con JWT y FastAPI. Cobertura del 88%.";
  const evidenceUrl = "https://github.com/empresa/microservicio-python";

  await db.planActivity.update({
    where: { id: act1.id },
    data: {
      deliverable: submittedDeliverable,
      evidenceUrl,
      submittedAt: new Date(),
      status: "ENTREGADA",
    },
  });

  // El plan pasa a EN_PROGRESO
  await db.developmentPlan.update({
    where: { id: plan.id },
    data: { status: "EN_PROGRESO" },
  });

  const act1Submitted = await db.planActivity.findUnique({ where: { id: act1.id } });
  console.log("2. Entregable registrado:", act1Submitted.deliverable === submittedDeliverable);
  console.log("3. Enlace de evidencia guardado:", act1Submitted.evidenceUrl === evidenceUrl);
  console.log("4. Estado de actividad pasa a ENTREGADA:", act1Submitted.status === "ENTREGADA");
  console.log("5. Fecha de entrega registrada:", act1Submitted.submittedAt !== null);

  // 5. Supervisor revisa el entregable y lo aprueba
  const supervisorFeedback = "Excelente estructuración del código y buenas pruebas unitarias. Cumple satisfactoriamente.";
  await db.planActivity.update({
    where: { id: act1.id },
    data: {
      status: "COMPLETADA",
      feedback: supervisorFeedback,
      reviewedAt: new Date(),
    },
  });

  const act1Reviewed = await db.planActivity.findUnique({ where: { id: act1.id } });
  console.log("6. Actividad aprobada como COMPLETADA:", act1Reviewed.status === "COMPLETADA");
  console.log("7. Retroalimentación registrada:", act1Reviewed.feedback === supervisorFeedback);
  console.log("8. Fecha de revisión registrada:", act1Reviewed.reviewedAt !== null);

  // 6. Completar actividad 2
  await db.planActivity.update({
    where: { id: act2.id },
    data: {
      status: "COMPLETADA",
      deliverable: "Sesión de reevaluación técnica completada con el equipo",
      submittedAt: new Date(),
      reviewedAt: new Date(),
    },
  });

  const remaining = await db.planActivity.count({
    where: { planId: plan.id, status: { notIn: ["COMPLETADA", "CANCELADA"] } },
  });
  if (remaining === 0) {
    await db.developmentPlan.update({
      where: { id: plan.id },
      data: { status: "COMPLETADO" },
    });
  }

  const planFinalizado = await db.developmentPlan.findUnique({ where: { id: plan.id } });
  console.log("9. Todas las actividades concluidas -> Plan pasa a COMPLETADO:", planFinalizado.status === "COMPLETADO");

  // 7. Realizar Evaluación POST_CAPACITACION alcanzando nivel 4 en Python
  const evalPost = await db.evaluation.create({
    data: {
      employeeId: employee.id,
      evaluatorId: admin.id,
      type: "POST_CAPACITACION",
      status: "FINALIZADA",
      comment: "Evaluación de cierre de plan. El colaborador alcanzó el nivel requerido.",
      finalizedAt: new Date(),
    },
  });

  await db.evaluationScore.create({
    data: {
      evaluationId: evalPost.id,
      competencyId: comp.id,
      level: 4,
    },
  });

  // Actualizar nivel vigente del empleado
  await db.employeeCompetency.upsert({
    where: { employeeId_competencyId: { employeeId: employee.id, competencyId: comp.id } },
    update: { level: 4 },
    create: { employeeId: employee.id, competencyId: comp.id, level: 4 },
  });

  // Actualizar brecha abierta a SUPERADA
  const openGaps = await db.gap.findMany({
    where: {
      application: { employeeId: employee.id },
      requirement: { competencyId: comp.id },
    },
  });
  for (const g of openGaps) {
    if (4 >= g.requiredLevel) {
      await db.gap.update({
        where: { id: g.id },
        data: { status: "SUPERADA", currentLevel: 4 },
      });
    }
  }

  const gapActualizada = await db.gap.findFirst({
    where: { applicationId: app.id },
  });

  console.log("10. Brecha actualizada a SUPERADA tras la evaluación:", gapActualizada.status === "SUPERADA");
  console.log("11. Nivel actual de la brecha actualizado a 4:", gapActualizada.currentLevel === 4);

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
}

run()
  .catch((e) => {
    console.error("ERROR EN PRUEBA:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
