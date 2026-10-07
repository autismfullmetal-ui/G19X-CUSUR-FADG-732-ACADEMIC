import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { calcCompatibility } from "../src/lib/compatibility";

const db = new PrismaClient();

async function main() {
  console.log("🧹 1. Limpiando datos existentes en la base de datos...");

  // Eliminar en orden estricto de dependencias foráneas
  await db.notification.deleteMany();
  await db.auditLog.deleteMany();
  await db.planActivity.deleteMany();
  await db.developmentPlan.deleteMany();
  await db.recommendation.deleteMany();
  await db.gap.deleteMany();
  await db.application.deleteMany();
  await db.opportunityRequirement.deleteMany();
  await db.opportunity.deleteMany();
  await db.objectiveEvaluation.deleteMany();
  await db.organizationalObjective.deleteMany();
  await db.evaluationScore.deleteMany();
  await db.evaluation.deleteMany();
  await db.employeeCompetency.deleteMany();
  await db.employee.deleteMany();
  await db.competency.deleteMany();
  await db.position.deleteMany();
  await db.department.deleteMany();
  await db.user.deleteMany();

  console.log("✅ Tablas limpiadas exitosamente.");

  // Contraseña universal para ambiente de pruebas
  const pass = bcrypt.hashSync("Demo1234!", 10);

  console.log("👤 2. Creando usuarios y roles...");
  const adminUser = await db.user.create({
    data: {
      email: "admin@demo.mx",
      name: "Admin Demo",
      passwordHash: pass,
      role: "ADMIN",
    },
  });

  const rhUser = await db.user.create({
    data: {
      email: "rh@demo.mx",
      name: "Rosa Huerta (RH)",
      passwordHash: pass,
      role: "RH",
    },
  });

  const supervisorUser = await db.user.create({
    data: {
      email: "supervisor@demo.mx",
      name: "Sergio Ponce (Supervisor)",
      passwordHash: pass,
      role: "SUPERVISOR",
    },
  });

  const empleadoElenaUser = await db.user.create({
    data: {
      email: "empleado@demo.mx",
      name: "Elena Vega (Empleado)",
      passwordHash: pass,
      role: "EMPLEADO",
    },
  });

  const empleadoSofiaUser = await db.user.create({
    data: {
      email: "sofia.ramirez@demo.mx",
      name: "Sofía Ramírez",
      passwordHash: pass,
      role: "EMPLEADO",
    },
  });

  const empleadoCarlosUser = await db.user.create({
    data: {
      email: "carlos.mendoza@demo.mx",
      name: "Carlos Mendoza",
      passwordHash: pass,
      role: "EMPLEADO",
    },
  });

  const empleadoDavidUser = await db.user.create({
    data: {
      email: "david.torres@demo.mx",
      name: "David Torres",
      passwordHash: pass,
      role: "EMPLEADO",
    },
  });

  console.log("🏢 3. Creando departamentos y puestos...");
  const depSistemas = await db.department.create({
    data: { name: "Sistemas y Tecnología" },
  });
  const depRRHH = await db.department.create({
    data: { name: "Recursos Humanos" },
  });
  const depOperaciones = await db.department.create({
    data: { name: "Operaciones y Logística" },
  });

  const posDev = await db.position.create({
    data: { title: "Ingeniero de Software Full-Stack" },
  });
  const posData = await db.position.create({
    data: { title: "Analista de Datos y BI" },
  });
  const posScrum = await db.position.create({
    data: { title: "Scrum Master & Agile Lead" },
  });
  const posCoord = await db.position.create({
    data: { title: "Coordinador de Infraestructura y Desarrollo" },
  });
  const posHR = await db.position.create({
    data: { title: "Especialista en Desarrollo Organizacional" },
  });
  const posOps = await db.position.create({
    data: { title: "Analista de Procesos Operativos" },
  });

  console.log("👥 4. Creando colaboradores y jerarquía...");
  // Sergio Ponce: Supervisor en Sistemas
  const empSergio = await db.employee.create({
    data: {
      firstName: "Sergio",
      lastName: "Ponce",
      email: "sergio.ponce@demo.mx",
      departmentId: depSistemas.id,
      positionId: posCoord.id,
      userId: supervisorUser.id,
      status: "ACTIVO",
    },
  });

  // Rosa Huerta: RH
  const empRosa = await db.employee.create({
    data: {
      firstName: "Rosa",
      lastName: "Huerta",
      email: "rosa.huerta@demo.mx",
      departmentId: depRRHH.id,
      positionId: posHR.id,
      userId: rhUser.id,
      status: "ACTIVO",
    },
  });

  // Elena Vega: Desarrolladora subordinada a Sergio
  const empElena = await db.employee.create({
    data: {
      firstName: "Elena",
      lastName: "Vega",
      email: "elena.vega@demo.mx",
      departmentId: depSistemas.id,
      positionId: posDev.id,
      supervisorId: empSergio.id,
      userId: empleadoElenaUser.id,
      status: "ACTIVO",
    },
  });

  // Sofía Ramírez: Analista de datos subordinada a Sergio
  const empSofia = await db.employee.create({
    data: {
      firstName: "Sofía",
      lastName: "Ramírez",
      email: "sofia.ramirez@demo.mx",
      departmentId: depSistemas.id,
      positionId: posData.id,
      supervisorId: empSergio.id,
      userId: empleadoSofiaUser.id,
      status: "ACTIVO",
    },
  });

  // Carlos Mendoza: Desarrollador Cloud subordinado a Sergio
  const empCarlos = await db.employee.create({
    data: {
      firstName: "Carlos",
      lastName: "Mendoza",
      email: "carlos.mendoza@demo.mx",
      departmentId: depSistemas.id,
      positionId: posDev.id,
      supervisorId: empSergio.id,
      userId: empleadoCarlosUser.id,
      status: "ACTIVO",
    },
  });

  // David Torres: Analista en Operaciones
  const empDavid = await db.employee.create({
    data: {
      firstName: "David",
      lastName: "Torres",
      email: "david.torres@demo.mx",
      departmentId: depOperaciones.id,
      positionId: posOps.id,
      userId: empleadoDavidUser.id,
      status: "ACTIVO",
    },
  });

  console.log("🎯 5. Creando catálogo de competencias...");
  const cPython = await db.competency.create({
    data: {
      name: "Python Avanzado",
      description: "Desarrollo backend con FastAPI/Django, algoritmos, testing y arquitectura modular.",
      type: "TECNICA",
      status: "ACTIVA",
    },
  });

  const cSQL = await db.competency.create({
    data: {
      name: "SQL y Modelado de Datos",
      description: "Consultas complejas, indexación, optimización relacional y diseño de bases de datos.",
      type: "TECNICA",
      status: "ACTIVA",
    },
  });

  const cScrum = await db.competency.create({
    data: {
      name: "Metodologías Ágiles y Scrum",
      description: "Facilitación de eventos ágiles, gestión del backlog, remoción de impedimentos y métricas.",
      type: "TECNICA",
      status: "ACTIVA",
    },
  });

  const cCloud = await db.competency.create({
    data: {
      name: "Arquitectura Cloud y Docker",
      description: "Contenedores Docker, orquestación, integración y despliegue continuo (CI/CD) en la nube.",
      type: "TECNICA",
      status: "ACTIVA",
    },
  });

  const cLiderazgo = await db.competency.create({
    data: {
      name: "Liderazgo y Gestión de Equipos",
      description: "Capacidad de inspirar, delegar con claridad, promover autonomía y retroalimentar constructivamente.",
      type: "BLANDA",
      status: "ACTIVA",
    },
  });

  const cComunicacion = await db.competency.create({
    data: {
      name: "Comunicación Asertiva",
      description: "Habilidad para transmitir ideas complejas, escuchar activamente y negociar acuerdos funcionales.",
      type: "BLANDA",
      status: "ACTIVA",
    },
  });

  const cResolucion = await db.competency.create({
    data: {
      name: "Resolución de Problemas Complejos",
      description: "Diagnóstico estructurado, análisis causa-raíz y diseño de soluciones eficientes ante situaciones críticas.",
      type: "BLANDA",
      status: "ACTIVA",
    },
  });

  console.log("📝 6. Creando evaluaciones diagnósticas y asignando niveles vigentes...");
  // Función auxiliar para registrar evaluación y competencias vigentes
  async function seedEmployeeEval(
    emp: { id: number; firstName: string; lastName: string },
    evaluatorUserId: number,
    scores: Array<{ competencyId: number; level: number; comment?: string }>
  ) {
    const ev = await db.evaluation.create({
      data: {
        employeeId: emp.id,
        evaluatorId: evaluatorUserId,
        type: "INICIAL",
        status: "FINALIZADA",
        comment: `Evaluación diagnóstica inicial de ingreso al PDP para ${emp.firstName} ${emp.lastName}.`,
        finalizedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        scores: {
          create: scores.map((s) => ({
            competencyId: s.competencyId,
            level: s.level,
            comment: s.comment,
          })),
        },
      },
    });

    for (const s of scores) {
      await db.employeeCompetency.create({
        data: {
          employeeId: emp.id,
          competencyId: s.competencyId,
          level: s.level,
        },
      });
    }

    return ev;
  }

  // Elena: Fuerte en Python (3) y SQL (3), pero baja en Scrum (1) y Liderazgo (2)
  const evalElena = await seedEmployeeEval(empElena, supervisorUser.id, [
    { competencyId: cPython.id, level: 3, comment: "Buen manejo en desarrollo web" },
    { competencyId: cSQL.id, level: 3, comment: "Consultas y esquemas funcionales" },
    { competencyId: cScrum.id, level: 1, comment: "Participa en dailies pero no domina facilitación formal" },
    { competencyId: cLiderazgo.id, level: 2, comment: "Interés en coordinar pero requiere práctica" },
    { competencyId: cComunicacion.id, level: 3, comment: "Comunicación fluida con su equipo" },
    { competencyId: cResolucion.id, level: 3, comment: "Resuelve incidentes técnicos con criterio" },
  ]);

  // Sofía: Fuerte en SQL (4), Media en Python (2), Cloud (1)
  await seedEmployeeEval(empSofia, supervisorUser.id, [
    { competencyId: cSQL.id, level: 4, comment: "Excelente modelado relacional y queries analíticos" },
    { competencyId: cPython.id, level: 2, comment: "Uso básico de scripts y pandas" },
    { competencyId: cCloud.id, level: 1, comment: "Sin experiencia en contenedores" },
    { competencyId: cComunicacion.id, level: 4, comment: "Presentación clara de métricas de negocio" },
    { competencyId: cResolucion.id, level: 4, comment: "Pensamiento analítico riguroso" },
  ]);

  // Carlos: Fuerte en Cloud (3) y Python (4), Liderazgo (3)
  await seedEmployeeEval(empCarlos, supervisorUser.id, [
    { competencyId: cPython.id, level: 4, comment: "Desarrollo avanzado y arquitectura limpia" },
    { competencyId: cCloud.id, level: 3, comment: "Docker y CI/CD en pipelines" },
    { competencyId: cSQL.id, level: 3, comment: "Consultas eficientes" },
    { competencyId: cLiderazgo.id, level: 3, comment: "Capacidad demostrada para guiar juniors" },
    { competencyId: cComunicacion.id, level: 3, comment: "Buena coordinación técnica" },
  ]);

  // David: Fuerte en Comunicación (4) y Resolución (3)
  await seedEmployeeEval(empDavid, rhUser.id, [
    { competencyId: cComunicacion.id, level: 4, comment: "Excelente interacción y reporte" },
    { competencyId: cResolucion.id, level: 3, comment: "Buen criterio operativo" },
    { competencyId: cScrum.id, level: 2, comment: "Nociones de tableros Kanban" },
  ]);

  console.log("📊 7. Creando objetivos organizacionales estratégicos...");
  const objCalidad = await db.organizationalObjective.create({
    data: {
      title: "Incrementar Cobertura de Pruebas Unitarias al 85%",
      description: "Garantizar calidad del código en producción mediante suites de pruebas automatizadas en todos los microservicios.",
      targetPeriod: "2026-10-01 al 2026-12-31",
      category: "CALIDAD",
      targetValue: 85,
      unit: "%",
      weight: 3,
      status: "ACTIVO",
      departmentId: depSistemas.id,
      createdById: rhUser.id,
    },
  });

  const objCloud = await db.organizationalObjective.create({
    data: {
      title: "Modernización de Infraestructura Cloud hacia Microservicios",
      description: "Migrar servicios legacy a arquitectura en contenedores Docker con pipelines de despliegue continuo.",
      targetPeriod: "2026-10-01 al 2027-03-31",
      category: "INNOVACION",
      targetValue: 100,
      unit: "%",
      weight: 4,
      status: "ACTIVO",
      departmentId: depSistemas.id,
      createdById: adminUser.id,
    },
  });

  const objTalento = await db.organizationalObjective.create({
    data: {
      title: "Programa Corporativo de Aceleración de Talento y PDP",
      description: "Lograr que al menos el 90% de colaboradores con brechas activas completen satisfactoriamente sus planes de desarrollo.",
      targetPeriod: "2026-09-01 al 2026-12-31",
      category: "ESTRATEGICO",
      targetValue: 90,
      unit: "%",
      weight: 5,
      status: "ACTIVO",
      departmentId: null, // Global
      createdById: rhUser.id,
    },
  });

  console.log("🚀 8. Creando oportunidades de crecimiento...");
  // Oportunidad 1: Scrum Master & Agile Lead (Ideal para que Elena postule y pruebe la IA)
  const oppScrum = await db.opportunity.create({
    data: {
      title: "Scrum Master & Facilitador Ágil de Células",
      description: "Liderar ceremonias ágiles, optimizar el flujo de valor y acompañar a los equipos de desarrollo en la adopción de prácticas ágiles de alto desempeño.",
      type: "DESARROLLO",
      status: "PUBLICADA",
      vacancies: 2,
      openDate: new Date(),
      deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), // En 25 días
      createdById: rhUser.id,
      objectiveId: objTalento.id,
      requirements: {
        create: [
          { competencyId: cScrum.id, requiredLevel: 4, weight: 4, mandatory: true },
          { competencyId: cLiderazgo.id, requiredLevel: 3, weight: 3, mandatory: true },
          { competencyId: cComunicacion.id, requiredLevel: 4, weight: 2, mandatory: false },
        ],
      },
    },
    include: { requirements: true },
  });

  // Oportunidad 2: Líder Técnico de Arquitectura Cloud
  const oppCloud = await db.opportunity.create({
    data: {
      title: "Líder Técnico de Arquitectura Cloud y DevOps",
      description: "Diseñar la arquitectura de microservicios, implementar observabilidad y liderar la automatización de infraestructura en la nube.",
      type: "PUESTO",
      status: "PUBLICADA",
      vacancies: 1,
      openDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      deadline: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000),
      createdById: rhUser.id,
      objectiveId: objCloud.id,
      requirements: {
        create: [
          { competencyId: cCloud.id, requiredLevel: 4, weight: 4, mandatory: true },
          { competencyId: cPython.id, requiredLevel: 4, weight: 3, mandatory: true },
          { competencyId: cLiderazgo.id, requiredLevel: 3, weight: 2, mandatory: false },
        ],
      },
    },
    include: { requirements: true },
  });

  // Oportunidad 3: Analista de Datos Senior
  const oppData = await db.opportunity.create({
    data: {
      title: "Analista de Datos y Modelado Analítico Senior",
      description: "Liderar modelos de datos analíticos, dashboards ejecutivos y optimización de pipelines de extracción y transformación de datos.",
      type: "PROYECTO",
      status: "PUBLICADA",
      vacancies: 2,
      openDate: new Date(),
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdById: rhUser.id,
      objectiveId: objCalidad.id,
      requirements: {
        create: [
          { competencyId: cSQL.id, requiredLevel: 4, weight: 3, mandatory: true },
          { competencyId: cPython.id, requiredLevel: 3, weight: 3, mandatory: true },
          { competencyId: cResolucion.id, requiredLevel: 4, weight: 2, mandatory: false },
        ],
      },
    },
    include: { requirements: true },
  });

  console.log("🤝 9. Creando postulaciones, brechas y planes de prueba...");

  // CASO 1: Elena Vega postulada a "Scrum Master & Facilitador Ágil"
  // ESTADO: Lista para generar recomendación con IA por el usuario.
  const reqsScrum = oppScrum.requirements;
  const currentsElena = await db.employeeCompetency.findMany({
    where: { employeeId: empElena.id },
  });
  const compResultElena = calcCompatibility(
    reqsScrum.map((r) => ({
      competencyId: r.competencyId,
      requiredLevel: r.requiredLevel,
      weight: r.weight,
      mandatory: r.mandatory,
    })),
    currentsElena.map((c) => ({ competencyId: c.competencyId, level: c.level }))
  );

  const appElena = await db.application.create({
    data: {
      opportunityId: oppScrum.id,
      employeeId: empElena.id,
      status: "ACTIVA",
      compatibility: compResultElena.compatibility,
    },
  });

  for (const g of compResultElena.gaps) {
    const req = reqsScrum.find((r) => r.competencyId === g.competencyId)!;
    await db.gap.create({
      data: {
        applicationId: appElena.id,
        requirementId: req.id,
        currentLevel: g.currentLevel,
        requiredLevel: g.requiredLevel,
        status: "ABIERTA",
      },
    });
  }

  // CASO 2: Carlos Mendoza postulado a "Líder Técnico de Arquitectura Cloud"
  // ESTADO: Con Plan de Desarrollo en progreso y actividades en distintos estados para verificar entregas y calificaciones.
  const reqsCloud = oppCloud.requirements;
  const currentsCarlos = await db.employeeCompetency.findMany({
    where: { employeeId: empCarlos.id },
  });
  const compResultCarlos = calcCompatibility(
    reqsCloud.map((r) => ({
      competencyId: r.competencyId,
      requiredLevel: r.requiredLevel,
      weight: r.weight,
      mandatory: r.mandatory,
    })),
    currentsCarlos.map((c) => ({ competencyId: c.competencyId, level: c.level }))
  );

  const appCarlos = await db.application.create({
    data: {
      opportunityId: oppCloud.id,
      employeeId: empCarlos.id,
      status: "ACTIVA",
      compatibility: compResultCarlos.compatibility,
    },
  });

  for (const g of compResultCarlos.gaps) {
    const req = reqsCloud.find((r) => r.competencyId === g.competencyId)!;
    await db.gap.create({
      data: {
        applicationId: appCarlos.id,
        requirementId: req.id,
        currentLevel: g.currentLevel,
        requiredLevel: g.requiredLevel,
        status: "EN_DESARROLLO",
      },
    });
  }

  // Recomendación aprobada para Carlos
  const activitiesCarlos = [
    {
      orden: 1,
      fase: "Fase 1: Fundamentos y Dockerización [Semanas 1 a 2]",
      titulo: "Arquitectura modular y contenedorización con Docker",
      descripcion: "Carlos diseñará y construirá Dockerfiles multi-stage optimizados para los microservicios principales de Sistemas, reduciendo el peso de imágenes en más de un 40%.",
      herramientas: "Docker, Docker Compose, Linux, Alpine, Hadolint",
      entregable: "Repositorio en Git con Dockerfiles analizados sin vulnerabilidades y reporte de optimización de imágenes.",
      criterio: "Imágenes de producción compilando correctamente sin vulnerabilidades críticas según linter.",
    },
    {
      orden: 2,
      fase: "Fase 2: Pipelines CI/CD y Automatización [Semanas 3 a 5]",
      titulo: "Implementación de pipeline de pruebas y despliegue automatizado",
      descripcion: "Configurar un flujo completo de integración continua con GitHub Actions que ejecute pruebas unitarias, linting y construcción de imágenes ante cada Pull Request.",
      herramientas: "GitHub Actions, Docker Hub / Registry, Bash, SonarQube",
      entregable: "Workflow de CI/CD funcional con 3 etapas (Test, Lint, Build) y ejecución exitosa verificada.",
      criterio: "Pipeline ejecutándose en menos de 5 minutos con validación obligatoria para merge a rama principal.",
    },
    {
      orden: 3,
      fase: "Fase 3: Mentoría y Liderazgo Técnico [Semanas 6 a 7]",
      titulo: "Taller interno de contenedores y sesión de code review con juniors",
      descripcion: "Carlos impartirá una sesión técnica práctica al equipo sobre buenas prácticas de Docker y revisará los Pull Requests de infraestructura de otros colaboradores.",
      herramientas: "Microsoft Teams / Miro, Git Pull Requests",
      entregable: "Grabación o diapositivas del taller interno y registro de 2 revisiones técnicas de PRs comentadas.",
      criterio: "Aprobación del supervisor Sergio Ponce sobre la claridad técnica y feedback pedagógico brindado.",
    },
    {
      orden: 4,
      fase: "Fase 4: Validación y Cierre [Semana 8]",
      titulo: "Hito Final: Reevaluación formal post-capacitación y validación de cierre de brechas",
      descripcion: "Evaluación formal entre supervisor y RRHH para medir la superación de la brecha en Arquitectura Cloud hacia nivel 4 requerido.",
      herramientas: "Rúbrica oficial de competencias del PDP, matriz de evaluación",
      entregable: "Dictamen de cierre de brechas y evaluación post-capacitación registrada en la plataforma.",
      criterio: "Alcanzar nivel 4 en Arquitectura Cloud validado por Sergio Ponce.",
    },
  ];

  await db.recommendation.create({
    data: {
      applicationId: appCarlos.id,
      text: "Plan intensivo orientado al cierre de brechas en Arquitectura Cloud (nivel actual 3 -> requerido 4) combinando práctica en contenedorización real (70%), mentoría técnica y despliegue CI/CD.",
      activities: JSON.stringify(activitiesCarlos),
      modelVersion: "glm-4.5",
      status: "APROBADA",
      reviewedById: rhUser.id,
    },
  });

  // Plan creado y en progreso para Carlos
  const planCarlos = await db.developmentPlan.create({
    data: {
      employeeId: empCarlos.id,
      applicationId: appCarlos.id,
      title: "Especialización en Arquitectura Cloud y Microservicios",
      objective: "Cerrar brecha en Arquitectura Cloud y DevOps hacia nivel 4 mediante proyectos reales de contenedorización.",
      status: "EN_PROGRESO",
      targetDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      createdById: rhUser.id,
      approvedById: supervisorUser.id,
      strategicObjectiveId: objCloud.id,
      activities: {
        create: [
          {
            order: 1,
            description: "[Fase 1] Dockerfiles multi-stage optimizados para microservicios del área.",
            deliverable: "Repositorio privado con 3 Dockerfiles optimizados y escaneo de vulnerabilidades sin fallos.",
            evidenceUrl: "https://github.com/demo/cloud-docker-templates",
            status: "COMPLETADA",
            submittedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            reviewedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
            feedback: "Excelente optimización. El tamaño de imagen se redujo en más del 50%. Actividad aprobada con honores.",
          },
          {
            order: 2,
            description: "[Fase 2] Pipeline CI/CD automatizado con GitHub Actions para testing y build.",
            deliverable: "Pipeline activo en GitHub Actions con pruebas unitarias pasando al 100%.",
            evidenceUrl: "https://github.com/demo/cloud-docker-templates/actions",
            status: "ENTREGADA",
            submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          },
          {
            order: 3,
            description: "[Fase 3] Taller interno de buenas prácticas y mentoría a desarrolladores junior.",
            status: "EN_PROGRESO",
          },
          {
            order: 4,
            description: "[Hito Final] Reevaluación formal post-capacitación con el supervisor.",
            status: "PENDIENTE",
          },
        ],
      },
    },
  });

  // CASO 3: Sofía Ramírez postulada a "Analista de Datos Senior"
  const reqsData = oppData.requirements;
  const currentsSofia = await db.employeeCompetency.findMany({
    where: { employeeId: empSofia.id },
  });
  const compResultSofia = calcCompatibility(
    reqsData.map((r) => ({
      competencyId: r.competencyId,
      requiredLevel: r.requiredLevel,
      weight: r.weight,
      mandatory: r.mandatory,
    })),
    currentsSofia.map((c) => ({ competencyId: c.competencyId, level: c.level }))
  );

  const appSofia = await db.application.create({
    data: {
      opportunityId: oppData.id,
      employeeId: empSofia.id,
      status: "ACTIVA",
      compatibility: compResultSofia.compatibility,
    },
  });

  for (const g of compResultSofia.gaps) {
    const req = reqsData.find((r) => r.competencyId === g.competencyId)!;
    await db.gap.create({
      data: {
        applicationId: appSofia.id,
        requirementId: req.id,
        currentLevel: g.currentLevel,
        requiredLevel: g.requiredLevel,
        status: "ABIERTA",
      },
    });
  }

  // Recomendación propuesta para Sofía (lista para ser aprobada por RH/Supervisor)
  await db.recommendation.create({
    data: {
      applicationId: appSofia.id,
      text: "Plan de desarrollo enfocado en elevar el dominio de Python orientado a analítica y optimización de pipelines de datos (nivel actual 2 -> requerido 3), complementado con buenas prácticas en resolución de problemas complejos.",
      activities: JSON.stringify([
        {
          orden: 1,
          fase: "Fase 1: Python para Analítica Avanzada [Semanas 1 a 3]",
          titulo: "Procesamiento y limpieza de datos a gran escala con Pandas y Polars",
          descripcion: "Sofía construirá scripts de ETL automatizados utilizando bibliotecas modernas de Python para optimizar la ingestión de fuentes de datos operativas.",
          herramientas: "Python 3.12, Pandas, Polars, JupyterLab, SQLAlchemy",
          entregable: "Notebooks documentados y repositorio modular con tests de validación de esquemas de datos.",
          criterio: "Pipeline ejecutándose con datos de muestra sin errores y cobertura de validaciones de integridad.",
        },
        {
          orden: 2,
          fase: "Fase 2: Visualización y Storytelling con Datos [Semanas 4 a 6]",
          titulo: "Dashboard ejecutivo de métricas clave con Power BI y Python",
          descripcion: "Diseñar un tablero interactivo con KPIs de negocio que integre consultas optimizadas en SQL y visualizaciones dinámicas.",
          herramientas: "Power BI, DAX, Python (Seaborn/Plotly), PostgreSQL",
          entregable: "Reporte publicado en el espacio de trabajo con documentación técnica de los modelos semánticos.",
          criterio: "Validación funcional por parte del supervisor y aprobación del tiempo de respuesta del dashboard.",
        },
        {
          orden: 3,
          fase: "Fase 3: Hito Final de Validación [Semana 7]",
          titulo: "Hito Final: Reevaluación formal post-capacitación y validación de cierre de brechas",
          descripcion: "Sesión de evaluación final para registrar el avance de nivel en Python Analítico y emitir el dictamen formal.",
          herramientas: "Plataforma PDP, rúbrica de niveles",
          entregable: "Evaluación post-capacitación firmada y registrada en el sistema.",
          criterio: "Superación del nivel 3 en Python requerido para la oportunidad.",
        },
      ]),
      modelVersion: "glm-4.5",
      status: "PROPUESTA",
      reviewedById: null,
    },
  });

  console.log("🔔 10. Creando notificaciones iniciales del sistema...");
  await db.notification.createMany({
    data: [
      {
        userId: rhUser.id,
        title: "Nueva postulación pendiente",
        message: "Elena Vega se postuló a 'Scrum Master & Facilitador Ágil de Células' y requiere análisis de brechas.",
        type: "INFO",
        linkUrl: `/postulaciones/${appElena.id}`,
        read: false,
      },
      {
        userId: supervisorUser.id,
        title: "Entregable enviado para revisión",
        message: "Carlos Mendoza ha entregado la actividad: '[Fase 2] Pipeline CI/CD automatizado'. Pendiente de revisión.",
        type: "ACTION_REQUIRED",
        linkUrl: `/planes`,
        read: false,
      },
      {
        userId: empleadoElenaUser.id,
        title: "Bienvenido al Programa de Desarrollo Profesional (PDP)",
        message: "Tu perfil y evaluación diagnóstica están listos. Explora las oportunidades disponibles y postúlate.",
        type: "SUCCESS",
        linkUrl: `/oportunidades`,
        read: false,
      },
    ],
  });

  console.log("📜 11. Registrando logs de auditoría iniciales (RF-026)...");
  await db.auditLog.createMany({
    data: [
      {
        userId: adminUser.id,
        action: "REINICIO_DATOS_SISTEMA",
        entity: "Sistema",
        entityId: 1,
        details: "Reinicio completo y generación de datos de prueba limpios para verificación funcional.",
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      },
      {
        userId: rhUser.id,
        action: "CREAR_OPORTUNIDAD",
        entity: "Oportunidad",
        entityId: oppScrum.id,
        details: `Oportunidad "${oppScrum.title}" creada y vinculada al objetivo estratégico de talento.`,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
      {
        userId: empleadoElenaUser.id,
        action: "POSTULACION",
        entity: "Postulacion",
        entityId: appElena.id,
        details: `Elena Vega se postuló a "${oppScrum.title}" con ${compResultElena.compatibility}% de compatibilidad.`,
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      },
    ],
  });

  console.log("\n========================================================");
  console.log("✨ BASE DE DATOS REINICIADA Y REPOBLADA EXITOSAMENTE ✨");
  console.log("========================================================");
  console.log("Credenciales de acceso (todas con contraseña: Demo1234!):");
  console.log("1. Administrador: admin@demo.mx");
  console.log("2. Recursos Humanos: rh@demo.mx");
  console.log("3. Supervisor: supervisor@demo.mx (Sergio Ponce)");
  console.log("4. Empleado: empleado@demo.mx (Elena Vega)");
  console.log("5. Empleados adicionales:");
  console.log("   - sofia.ramirez@demo.mx (Sofía Ramírez)");
  console.log("   - carlos.mendoza@demo.mx (Carlos Mendoza)");
  console.log("   - david.torres@demo.mx (David Torres)");
  console.log("========================================================\n");
}

main()
  .catch((e) => {
    console.error("❌ Error al ejecutar el seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
