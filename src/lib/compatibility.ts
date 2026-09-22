export type Requisite = {
  competencyId: number;
  requiredLevel: number;
  weight: number;
  mandatory: boolean;
};

export type CurrentLevel = { competencyId: number; level: number };

export type GapDraft = {
  competencyId: number;
  currentLevel: number;
  requiredLevel: number;
};

export function calcCompatibility(
  reqs: Requisite[],
  currents: CurrentLevel[]
): {
  compatibility: number;
  gaps: GapDraft[];
  mandatoryUnmet: boolean;
} {
  const levelOf = (cid: number) =>
    currents.find((c) => c.competencyId === cid)?.level ?? 0;

  let weightSum = 0;
  let score = 0;
  const gaps: GapDraft[] = [];

  for (const r of reqs) {
    const current = levelOf(r.competencyId);
    weightSum += r.weight;
    score += r.weight * Math.min(current / r.requiredLevel, 1) * 100;
    if (current < r.requiredLevel) {
      gaps.push({
        competencyId: r.competencyId,
        currentLevel: current,
        requiredLevel: r.requiredLevel,
      });
    }
  }

  const mandatoryUnmet = reqs.some(
    (r) => r.mandatory && levelOf(r.competencyId) < r.requiredLevel
  );

  return {
    compatibility: weightSum > 0 ? Math.round(score / weightSum) : 0,
    gaps,
    mandatoryUnmet,
  };
}
