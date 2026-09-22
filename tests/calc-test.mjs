import { calcCompatibility } from "../src/lib/compatibility.ts";

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

// score = (3*(2/4)*100 + 2*100 + 1*100) / 6 = 450/6 = 75
console.log("compatibilidad:", compatibility, "(esperado 75)");
console.log("brechas:", gaps.length, "(esperado 1)");
console.log("brecha correcta:", gaps[0].competencyId === 1 && gaps[0].currentLevel === 2);
console.log("obligatoria incumplida:", mandatoryUnmet, "(esperado false)");

if (compatibility !== 75 || gaps.length !== 1 || mandatoryUnmet !== false) {
  process.exit(1);
}
console.log("OK");
