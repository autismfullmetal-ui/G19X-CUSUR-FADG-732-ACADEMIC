import { calcCompatibility } from "../src/lib/compatibility.ts";

function must(cond, msg) {
  if (!cond) {
    console.error("FALLO:", msg);
    process.exit(1);
  }
}

const reqs = [
  { competencyId: 1, requiredLevel: 4, weight: 3, mandatory: false }, // Python 2 -> brecha 2
  { competencyId: 2, requiredLevel: 3, weight: 2, mandatory: true }, // Liderazgo 3 -> cumple
  { competencyId: 3, requiredLevel: 4, weight: 1, mandatory: false }, // Comunicación 4 -> cumple
];
const currents = [
  { competencyId: 1, level: 2 },
  { competencyId: 2, level: 3 },
  { competencyId: 3, level: 4 },
];

const { compatibility, gaps, mandatoryUnmet } = calcCompatibility(reqs, currents);

must(compatibility === 75, `compatibilidad esperada 75, llego ${compatibility}`);
must(gaps.length === 1, `se esperaba 1 brecha, llegaron ${gaps.length}`);
must(gaps[0].competencyId === 1 && gaps[0].currentLevel === 2, "brecha correcta (competencia 1, nivel actual 2)");
must(mandatoryUnmet === false, "ninguna obligatoria incumplida");

// score = (3*(2/4)*100 + 2*100 + 1*100) / 6 = 450/6 = 75
console.log("compatibilidad:", compatibility, "(esperado 75)");
console.log("brechas:", gaps.length, "(esperado 1)");
console.log("brecha correcta:", gaps[0].competencyId === 1 && gaps[0].currentLevel === 2);
console.log("obligatoria incumplida:", mandatoryUnmet, "(esperado false)");
console.log("OK");
