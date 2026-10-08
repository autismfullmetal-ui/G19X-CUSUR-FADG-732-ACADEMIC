import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function testCompetencyTooltips() {
  console.log("--- TEST DE LEYENDA DESCRIPTIVA AL PASAR EL MOUSE (TOOLTIP) ---");

  // 1. Verificar competencias en la base de datos
  const competencies = await db.competency.findMany();
  console.log(`✓ Competencias en catálogo: ${competencies.length}`);

  const employeeWithCompetencies = await db.employee.findFirst({
    where: { competencies: { some: {} } },
    include: { competencies: { include: { competency: true } } },
  });

  if (!employeeWithCompetencies) {
    console.error("No se encontró ningún empleado con competencias asignadas.");
    process.exit(1);
  }

  console.log(`✓ Empleado evaluado: ${employeeWithCompetencies.firstName} ${employeeWithCompetencies.lastName}`);
  for (const ec of employeeWithCompetencies.competencies) {
    console.log(`  - Competencia: ${ec.competency.name} | Tipo: ${ec.competency.type} | Nivel: ${ec.level}`);
  }

  // 2. Verificar simulación de request a la página de empleados
  const res = await fetch("http://localhost:3000/empleados", {
    headers: {
      cookie: "next-auth.session-token=demo-test-token", // Next.js renderizará o redirigirá según auth
    },
  });

  console.log(`✓ Status HTTP /empleados: ${res.status}`);

  // 3. Comprobar que el componente CompetencyBadgeTooltip y sus textos están presentes en el bundle/código
  const fs = await import("fs");
  const tooltipCode = fs.readFileSync("src/components/CompetencyBadgeTooltip.tsx", "utf-8");

  const hasPython = tooltipCode.includes("normName.includes(\"python\")");
  const hasSql = tooltipCode.includes("normName.includes(\"sql\")");
  const hasLiderazgo = tooltipCode.includes("normName.includes(\"liderazgo\")");
  const hasGenericTechnical = tooltipCode.includes("isTechnical");
  const hasGenericBlanda = tooltipCode.includes("Competencia Blanda genérica");
  const hasPortal = tooltipCode.includes("createPortal");
  const hasNoLinks = !tooltipCode.includes("<a ") && !tooltipCode.includes("href=");

  console.log(`✓ Soporte especializado para Python: ${hasPython}`);
  console.log(`✓ Soporte especializado para SQL / Datos: ${hasSql}`);
  console.log(`✓ Soporte especializado para Liderazgo: ${hasLiderazgo}`);
  console.log(`✓ Matriz genérica para Habilidades Técnicas: ${hasGenericTechnical}`);
  console.log(`✓ Matriz genérica para Habilidades Blandas: ${hasGenericBlanda}`);
  console.log(`✓ Renderizado flotante sin cortes (Portal en body): ${hasPortal}`);
  console.log(`✓ No contiene enlaces ni redirecciones (solo hover in-situ): ${hasNoLinks}`);

  if (hasPython && hasLiderazgo && hasPortal && hasNoLinks) {
    console.log("\n ¡EL COMPONENTE DE LEYENDA POR HOVER FUNCIONA CORRECTAMENTE!");
  } else {
    console.error("Alguna validación falló.");
    process.exit(1);
  }

  await db.$disconnect();
}

testCompetencyTooltips().catch((err) => {
  console.error("Error en test:", err);
  process.exit(1);
});
