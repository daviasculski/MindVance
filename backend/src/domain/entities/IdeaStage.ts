export const ideaStages = [
  "IDEACAO",
  "ESCOPO",
  "PLANO_DE_NEGOCIOS",
  "DESENVOLVIMENTO",
  "TESTE_E_VALIDACAO",
  "LANCAMENTO",
] as const;

export type IdeaStage = (typeof ideaStages)[number];

export function isIdeaStage(value: unknown): value is IdeaStage {
  return (
    typeof value === "string" &&
    ideaStages.some((stage) => stage === value)
  );
}
  