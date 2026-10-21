export const userRoles = [
  "EVALUATOR",
  "GATEKEEPER",
  "ADMIN",
  "COLLABORATOR",
] as const;

export type UserRole = (typeof userRoles)[number];

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && userRoles.some((role) => role === value);
}
