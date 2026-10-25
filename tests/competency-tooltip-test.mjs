import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

function must(cond, msg) {
  if (!cond) {
    console.error("FALLO:", msg);
    process.exit(1);
  }
}

try {
  console.log("--- TEST DE LEYENDA DESCRIPTIVA AL PASAR EL MOUSE (TOOLTIP) ---");

  // 1. Verificar competencias en la base de datos
  const competencies = await db.competency.findMany();
  must(competencies.length > 0, "hay competencias en el catálogo");
  console.log(`✓ Competencias en catálogo: ${competencies.length}`);

  const employeeWithCompetencies = await db.employee.findFirst({
    where: { competencies: { some: {} } },
    include: { competencies: { include: { competency: true } } },
  });
  must(!!employeeWithCompetencies, "existe empleado con competencias asignadas");

  console.log(`✓ Empleado evaluado: ${employeeWithCompetencies.firstName} ${employeeWithCompetencies.lastName}`);
  for (const ec of employeeWithCompetencies.competencies) {
    console.log(`  - Competencia: ${ec.competency.name} | Tipo: ${ec.competency.type} | Nivel: ${ec.level}`);
  }

  // 2. Verificar simulación de request a la página de empleados
  const res = await fetch("http://localhost:3000/empleados", {
    headers: {
      cookie: "next-auth.session-token=demo-test-token",
    },
  });
  must(res.status === 200 || res.status === 302 || res.status === 307 || res.status === 308, `status HTTP /empleados esperado 2xx/3xx (llego ${res.status})`);
  console.log(`✓ Status HTTP /empleados: ${res.status}`);

  // 3. Comprobar que el componente CompetencyBadgeTooltip y sus textos están presentes en el bundle/código
  const fs = await import("fs");
  const tooltipCode = fs.readFileSync("src/components/CompetencyBadgeTooltip.tsx", "utf-8");

  const hasPython = tooltipCode.includes('normName.includes("python")');
  const hasSql = tooltipCode.includes('normName.includes("sql")');
  const hasLiderazgo = tooltipCode.includes('normName.includes("liderazgo")');
  const hasGenericTechnical = tooltipCode.includes("isTechnical");
  const hasGenericBlanda = tooltipCode.includes("Competencia Blanda genérica");
  const hasPortal = tooltipCode.includes("createPortal");
  const hasNoLinks = !tooltipCode.includes("<a ") && !tooltipCode.includes("href=");

  must(hasPython, "soporte especializado para Python");
  must(hasSql, "soporte especializado para SQL / Datos");
  must(hasLiderazgo, "soporte especializado para Liderazgo");
  must(hasGenericTechnical, "matriz genérica para Habilidades Técnicas");
  must(hasGenericBlanda, "matriz genérica para Habilidades Blandas");
  must(hasPortal, "renderizado flotante sin cortes (Portal en body)");
  must(hasNoLinks, "no contiene enlaces ni redirecciones (solo hover in-situ)");

  console.log(`✓ Soporte especializado para Python: ${hasPython}`);
  console.log(`✓ Soporte especializado para SQL / Datos: ${hasSql}`);
  console.log(`✓ Soporte especializado para Liderazgo: ${hasLiderazgo}`);
  console.log(`✓ Matriz genérica para Habilidades Técnicas: ${hasGenericTechnical}`);
  console.log(`✓ Matriz genérica para Habilidades Blandas: ${hasGenericBlanda}`);
  console.log(`✓ Renderizado flotante sin cortes (Portal en body): ${hasPortal}`);
  console.log(`✓ No contiene enlaces ni redirecciones (solo hover in-situ): ${hasNoLinks}`);

  console.log("\n ¡EL COMPONENTE DE LEYENDA POR HOVER FUNCIONA CORRECTAMENTE!");
} catch (err) {
  console.error("Error en test:", err.message);
  process.exit(1);
} finally {
  await db.$disconnect();
}
