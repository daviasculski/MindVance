export const ideaStatuses = [
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
