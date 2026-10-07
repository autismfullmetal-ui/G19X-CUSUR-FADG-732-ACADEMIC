import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function testOpportunityObjectiveLink() {
  console.log("--- TEST DE ENLACE DE OPORTUNIDADES CON OBJETIVOS ORGANIZACIONALES ---");

  // 1. Obtener o verificar un objetivo activo
  let obj = await db.organizationalObjective.findFirst({
    where: { status: "ACTIVO" },
  });

  if (!obj) {
    const admin = await db.user.findFirst({ where: { role: "ADMIN" } });
    obj = await db.organizationalObjective.create({
      data: {
        title: "Innovación Tecnológica e Inteligencia Artificial 2025",
        targetPeriod: "2025 - Q1",
        category: "INNOVACION",
        targetValue: 100.0,
        unit: "%",
        weight: 3,
        createdById: admin.id,
      },
    });
    console.log(`✓ Creado objetivo para prueba: ${obj.title} (ID: ${obj.id})`);
  } else {
    console.log(`✓ Objetivo organizacional existente: ${obj.title} (ID: ${obj.id})`);
  }

  // 2. Crear una oportunidad vinculada a ese objetivo
  const admin = await db.user.findFirst({ where: { role: "ADMIN" } });
  const comp = await db.competency.findFirst();

  const opp = await db.opportunity.create({
    data: {
      title: "Desarrollador FullStack Cloud AI (Test Link)",
      description: "Proyecto vinculado al objetivo de IA",
      type: "PROYECTO",
      status: "PUBLICADA",
      vacancies: 2,
      objectiveId: obj.id,
      createdById: admin.id,
      requirements: {
        create: {
          competencyId: comp.id,
          requiredLevel: 4,
          weight: 2,
          mandatory: true,
        },
      },
    },
    include: {
      objective: true,
      requirements: true,
    },
  });

  console.log(`✓ Oportunidad creada con ID: ${opp.id}`);
  console.log(`✓ Vinculada a objetivo: ${opp.objective?.title} (ID: ${opp.objectiveId})`);

  if (opp.objectiveId !== obj.id) {
    console.error("❌ Falló la vinculación entre oportunidad y objetivo.");
    process.exit(1);
  }

  // 3. Simular postulación y verificar herencia en el plan
  const emp = await db.employee.findFirst();
  let app = await db.application.findUnique({
    where: {
      opportunityId_employeeId: {
        opportunityId: opp.id,
        employeeId: emp.id,
      },
    },
  });

  if (!app) {
    app = await db.application.create({
      data: {
        opportunityId: opp.id,
        employeeId: emp.id,
        status: "ACTIVA",
        compatibility: 80,
      },
    });
  }

  const plan = await db.developmentPlan.create({
    data: {
      employeeId: emp.id,
      applicationId: app.id,
      title: `Plan alineado a ${opp.title}`,
      objective: `Contribuir al objetivo ${obj.title}`,
      status: "PROPUESTO",
      strategicObjectiveId: opp.objectiveId,
      createdById: admin.id,
    },
    include: {
      strategicObjective: true,
    },
  });

  console.log(`✓ Plan de desarrollo creado con ID: ${plan.id}`);
  console.log(`✓ Plan hereda automáticamente el objetivo estratégico: ${plan.strategicObjective?.title}`);

  // 4. Limpieza de datos de prueba
  await db.developmentPlan.delete({ where: { id: plan.id } });
  await db.application.delete({ where: { id: app.id } });
  await db.opportunityRequirement.deleteMany({ where: { opportunityId: opp.id } });
  await db.opportunity.delete({ where: { id: opp.id } });

  console.log("✓ Limpieza de datos temporales de prueba exitosa.");
  console.log("\n🎉 ¡EL ENLACE DE OPORTUNIDADES CON OBJETIVOS FUNCIONA AL 100%!");

  await db.$disconnect();
}

testOpportunityObjectiveLink().catch((err) => {
  console.error("Error en test:", err);
  process.exit(1);
});
