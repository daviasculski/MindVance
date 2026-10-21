export const userRoles = [
  "EVALUATOR",
  "GESTOR_INOVACAO",
  "ADMIN",
  "COLLABORATOR",
] as const;

export type UserRole = (typeof userRoles)[number];

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && userRoles.some((role) => role === value);
}
