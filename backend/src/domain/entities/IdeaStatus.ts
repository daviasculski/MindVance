export const ideaStatuses = [
  "AGUARDANDO_TRIAGEM",
  "AGUARDANDO_DESIGNACAO",
  "EM_AVALIACAO",
  "AGUARDANDO_DECISAO",
  "EM_ANDAMENTO",
  "EM_REVISAO",
  "APROVADA",
  "REJEITADA",
] as const;

export type IdeaStatus = (typeof ideaStatuses)[number];

export function isIdeaStatus(value: unknown): value is IdeaStatus {
  return (
    typeof value === "string" &&
    ideaStatuses.some((status) => status === value)
  );
}

/** Status em que a ideia está dentro de um gate: o conteúdo fica congelado. */
export const inGateStatuses: IdeaStatus[] = [
  "AGUARDANDO_DESIGNACAO",
  "EM_AVALIACAO",
  "AGUARDANDO_DECISAO",
];
