import type { Stage } from "../types";

export const STAGES: Stage[] = [
  "Ideação",
  "Escopo",
  "Plano de Negócios",
  "Desenvolvimento",
  "Teste e Validação",
  "Lançamento",
];

export interface Gate {
  n: number;
  from: Stage;
  to: Stage;
  label: string;
}

export const GATES: Gate[] = STAGES.slice(0, -1).map((from, i) => ({
  n: i + 1,
  from,
  to: STAGES[i + 1],
  label: `Gate ${i + 1} — ${from} → ${STAGES[i + 1]}`,
}));

export function stageIndex(stage: Stage): number {
  return STAGES.indexOf(stage);
}

export function gateForStage(stage: Stage): Gate | null {
  const idx = stageIndex(stage);
  return idx < GATES.length ? GATES[idx] : null;
}

export function isFinalStage(stage: Stage): boolean {
  return stageIndex(stage) === STAGES.length - 1;
}
