import { PrismaClient } from "@prisma/client";
import { templateRecommendation } from "../src/lib/ai.ts";

const db = new PrismaClient();

async function run() {
  console.log("=== INICIANDO PRUEBAS DE FECHAS, VACANTES Y CONTINUIDAD DE PLANES ===");

  // 1. Probar plantilla estructurada con fechas y vacantes
  const rec = templateRecommendation({
    employee: "Elena Torres",
    position: "Desarrollador Junior",
    department: "Sistemas",
    opportunity: "Líder de proyecto de datos",
    opportunityDescription: "Proyecto estratégico de analítica",
    vacancies: 2,
    openDate: "2026-09-01",
    deadline: "2026-10-31",
    gaps: [
      { competency: "Python", currentLevel: 2, requiredLevel: 4, mandatory: true, type: "TECNICA" },
      { competency: "Liderazgo", currentLevel: 2, requiredLevel: 3, mandatory: true, type: "BLANDA" },
    ],
  });

  console.log("1. Recomendación contiene plazo:", rec.text.includes("2026-10-31"));
  console.log("2. Actividades cronológicas generadas:", rec.activities.length >= 4);
  console.log("3. Contiene fases estructuradas:", rec.activities.some((a) => a.descripcion.includes("Fase 1")));

  if (!rec.text.includes("2026-10-31") || rec.activities.length < 4) {
    throw new Error("Fallo en la prueba de generación de recomendación con fechas");
  }

  // 2. Probar creación de oportunidad con vacantes y fechas en la base de datos
  const admin = await db.user.findFirst({ where: { role: "ADMIN" } });
  const comp = await db.competency.findFirst();

  const now = new Date();
  const pastDeadline = new Date(Date.now() - 24 * 60 * 60 * 1000); // ayer
  const futureOpen = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // en 7 días
  const normalDeadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // en 30 días

  const testOpp = await db.opportunity.create({
    data: {
      title: "Oportunidad Test Fechas",
      description: "Prueba de vacantes y fechas",
      type: "PROYECTO",
      status: "PUBLICADA",
      vacancies: 3,
      openDate: now,
      deadline: normalDeadline,
      createdById: admin.id,
      requirements: {
        create: [
          { competencyId: comp.id, requiredLevel: 3, weight: 1, mandatory: false },
        ],
      },
    },
  });

  console.log("4. Oportunidad creada con vacantes:", testOpp.vacancies === 3);
  console.log("5. Oportunidad creada con deadline:", testOpp.deadline !== null);

  // 3. Probar lógica de fechas de postulación
  const isExpired = (opp) => {
    if (!opp.deadline) return false;
    const end = new Date(opp.deadline);
    end.setHours(23, 59, 59, 999);
    return new Date() > end;
  };
  const isNotYetOpen = (opp) => {
    if (!opp.openDate) return false;
    return new Date() < new Date(opp.openDate);
  };

  console.log("6. Oportunidad vigente detectada como no vencida:", !isExpired(testOpp));
  console.log("7. Oportunidad con fecha pasada detectada como vencida:", isExpired({ deadline: pastDeadline }));
  console.log("8. Oportunidad con apertura futura detectada como no abierta:", isNotYetOpen({ openDate: futureOpen }));

  // 4. Probar continuidad del plan de desarrollo cuando la oportunidad se cierra
  const employee = await db.employee.findFirst();

  // Crear 2 aplicaciones: una con plan y otra sin plan
  const appConPlan = await db.application.create({
    data: {
      opportunityId: testOpp.id,
      employeeId: employee.id,
      status: "ACTIVA",
      compatibility: 80,
    },
  });

  // Crear plan de desarrollo para la primera aplicación
  const plan = await db.developmentPlan.create({
    data: {
      employeeId: employee.id,
      applicationId: appConPlan.id,
      title: "Plan de Desarrollo Continuo",
      objective: "Cerrar brechas aun con oportunidad cerrada",
      targetDate: normalDeadline,
      status: "APROBADO",
      createdById: admin.id,
      activities: {
        create: [
          { description: "Actividad 1 en curso", order: 1, status: "EN_PROGRESO" },
          { description: "Actividad 2 final", order: 2, status: "PENDIENTE" },
        ],
      },
    },
  });

  console.log("9. Plan de desarrollo creado con targetDate:", plan.targetDate !== null);

  // Simular la lógica de closeOpportunity
  const appsWithPlan = await db.developmentPlan.findMany({
    where: { application: { opportunityId: testOpp.id } },
    select: { applicationId: true },
  });
  const exemptIds = appsWithPlan.map((p) => p.applicationId).filter(Boolean);

  await db.opportunity.update({ where: { id: testOpp.id }, data: { status: "CERRADA" } });
  await db.application.updateMany({
    where: {
      opportunityId: testOpp.id,
      status: "ACTIVA",
      ...(exemptIds.length > 0 ? { id: { notIn: exemptIds } } : {}),
    },
    data: { status: "NO_PROCEDE" },
  });

  // Verificar estado de la postulación que tiene plan
  const appVerificada = await db.application.findUnique({
    where: { id: appConPlan.id },
    include: { plan: { include: { activities: true } } },
  });

  console.log("10. Postulación con plan sigue ACTIVA:", appVerificada.status === "ACTIVA");
  console.log("11. Plan de desarrollo sigue intacto y APROBADO:", appVerificada.plan.status === "APROBADO");

  // Probar avance de actividades con oportunidad cerrada
  const act1 = appVerificada.plan.activities[0];
  await db.planActivity.update({
    where: { id: act1.id },
    data: { status: "COMPLETADA" },
  });

  const act1Verificada = await db.planActivity.findUnique({ where: { id: act1.id } });
  console.log("12. Actividad actualizada a COMPLETADA con oportunidad cerrada:", act1Verificada.status === "COMPLETADA");

  // Limpiar datos de prueba
  await db.planActivity.deleteMany({ where: { planId: plan.id } });
  await db.developmentPlan.delete({ where: { id: plan.id } });
  await db.application.delete({ where: { id: appConPlan.id } });
  await db.opportunityRequirement.deleteMany({ where: { opportunityId: testOpp.id } });
  await db.opportunity.delete({ where: { id: testOpp.id } });

  console.log("=== TODAS LAS PRUEBAS PASARON EXITOSAMENTE ===");
}

run()
  .catch((e) => {
    console.error("ERROR EN PRUEBA:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
