import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const pass = bcrypt.hashSync("Demo1234!", 10);

  const admin = await db.user.upsert({
    where: { email: "admin@demo.mx" },
    update: {},
    create: { email: "admin@demo.mx", passwordHash: pass, name: "Admin Demo", role: "ADMIN" },
  });
  const rh = await db.user.upsert({
    where: { email: "rh@demo.mx" },
    update: {},
    create: { email: "rh@demo.mx", passwordHash: pass, name: "Rosa Huerta (RH)", role: "RH" },
  });
  const supervisorUser = await db.user.upsert({
    where: { email: "supervisor@demo.mx" },
    update: {},
    create: { email: "supervisor@demo.mx", passwordHash: pass, name: "Sergio Ponce (Supervisor)", role: "SUPERVISOR" },
  });
  const empleadoUser = await db.user.upsert({
    where: { email: "empleado@demo.mx" },
    update: {},
    create: { email: "empleado@demo.mx", passwordHash: pass, name: "Elena Vega (Empleado)", role: "EMPLEADO" },
  });

  const sistemas = await db.department.upsert({ where: { name: "Sistemas" }, update: {}, create: { name: "Sistemas" } });
  const rrhh = await db.department.upsert({ where: { name: "Recursos Humanos" }, update: {}, create: { name: "Recursos Humanos" } });
  const dev = await db.position.upsert({ where: { title: "Desarrollador" }, update: {}, create: { title: "Desarrollador" } });
  const analista = await db.position.upsert({ where: { title: "Analista" }, update: {}, create: { title: "Analista" } });
  const coordinador = await db.position.upsert({ where: { title: "Coordinador" }, update: {}, create: { title: "Coordinador" } });

  const supervisor = await db.employee.upsert({
    where: { email: "sergio.ponce@demo.mx" },
    update: {},
    create: {
      firstName: "Sergio", lastName: "Ponce", email: "sergio.ponce@demo.mx",
      departmentId: sistemas.id, positionId: coordinador.id, userId: supervisorUser.id,
    },
  });
  const elena = await db.employee.upsert({
    where: { email: "elena.vega@demo.mx" },
    update: {},
    create: {
      firstName: "Elena", lastName: "Vega", email: "elena.vega@demo.mx",
      departmentId: sistemas.id, positionId: dev.id, supervisorId: supervisor.id, userId: empleadoUser.id,
    },
  });
  await db.employee.upsert({
    where: { email: "rosa.huerta@demo.mx" },
    update: {},
    create: {
      firstName: "Rosa", lastName: "Huerta", email: "rosa.huerta@demo.mx",
      departmentId: rrhh.id, positionId: analista.id, userId: rh.id,
    },
  });

  const comps = await Promise.all(
    [
      ["Python", "Desarrollo de software con Python", "TECNICA"],
      ["Liderazgo", "Capacidad de guiar equipos", "BLANDA"],
      ["Comunicación", "Comunicación efectiva oral y escrita", "BLANDA"],
      ["SQL", "Consultas y modelado de bases de datos", "TECNICA"],
      ["Trabajo en equipo", "Colaboración en equipos multidisciplinarios", "BLANDA"],
    ].map(([name, description, type]) =>
      db.competency.upsert({ where: { name }, update: {}, create: { name, description, type } })
    )
  );
  const [python, liderazgo, comunicacion, sql, equipo] = comps;

  const evaluacion = await db.evaluation.create({
    data: {
      employeeId: elena.id,
      evaluatorId: supervisorUser.id,
      type: "INICIAL",
      status: "FINALIZADA",
      finalizedAt: new Date(),
      comment: "Evaluación inicial de ingreso al programa de desarrollo.",
      scores: {
        create: [
          { competencyId: python.id, level: 2, comment: "Conocimientos básicos" },
          { competencyId: liderazgo.id, level: 3 },
          { competencyId: comunicacion.id, level: 4 },
          { competencyId: sql.id, level: 3 },
          { competencyId: equipo.id, level: 4 },
        ],
      },
    },
  });

  const scoreMap: Record<number, number> = {};
  for (const s of await db.evaluationScore.findMany({ where: { evaluationId: evaluacion.id } })) {
    scoreMap[s.competencyId] = s.level;
  }
  for (const c of comps) {
    await db.employeeCompetency.upsert({
      where: { employeeId_competencyId: { employeeId: elena.id, competencyId: c.id } },
      update: { level: scoreMap[c.id] },
      create: { employeeId: elena.id, competencyId: c.id, level: scoreMap[c.id] },
    });
  }

  const oportunidad = await db.opportunity.upsert({
    where: { id: 1 },
    update: {},
    create: {
      title: "Líder de proyecto de datos",
      description:
        "Coordinar el nuevo proyecto de analítica de datos del área de Sistemas.",
      type: "PROYECTO",
      status: "PUBLICADA",
      createdById: rh.id,
      requirements: {
        create: [
          { competencyId: python.id, requiredLevel: 4, weight: 3, mandatory: false },
          { competencyId: sql.id, requiredLevel: 4, weight: 2, mandatory: false },
          { competencyId: liderazgo.id, requiredLevel: 3, weight: 2, mandatory: true },
          { competencyId: comunicacion.id, requiredLevel: 4, weight: 1, mandatory: false },
        ],
      },
    },
  });

  console.log("Seed completo:");
  console.log("- Usuarios: admin@demo.mx, rh@demo.mx, supervisor@demo.mx, empleado@demo.mx (contraseña: Demo1234!)");
  console.log(`- Empleados: 3, Competencias: ${comps.length}, Evaluación: ${evaluacion.id}, Oportunidad: ${oportunidad.id} (${oportunidad.title})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
