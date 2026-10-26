import type { Role, Screen } from "../types";

export interface NavItem {
  screen: Screen;
  label: string;
}

/**
 * Menu de cada perfil, conforme a matriz de permissões (docs/mindvance-funcionalidades-e-roadmap.md):
 * - o Avaliador mantém os acessos do Colaborador (D1);
 * - funil e indicadores são só do Gestor de Inovação (D2);
 * - o Administrador fica no backoffice (D2);
 * - o Mural de aprovadas é visível a todos.
 */
export const navByRole: Record<Role, NavItem[]> = {
  colaborador: [
    { screen: "new-idea", label: "Nova Ideia" },
    { screen: "my-ideas", label: "Minhas Ideias" },
    { screen: "approved", label: "Mural de Aprovadas" },
  ],
  avaliador: [
    { screen: "evaluate", label: "Fila de Avaliações" },
    { screen: "new-idea", label: "Nova Ideia" },
    { screen: "my-ideas", label: "Minhas Ideias" },
    { screen: "approved", label: "Mural de Aprovadas" },
  ],
  gatekeeper: [
    { screen: "gate-decision", label: "Decisão de Gate" },
    { screen: "funnel", label: "Painel do Funil" },
    { screen: "dashboard", label: "Indicadores" },
    { screen: "approved", label: "Mural de Aprovadas" },
  ],
  administrador: [
    { screen: "approvals", label: "Solicitações" },
    { screen: "approved", label: "Mural de Aprovadas" },
  ],
};

/** Tela inicial de cada perfil: o primeiro item do menu. */
export function defaultScreen(role: Role): Screen {
  return navByRole[role][0].screen;
}

/** O detalhe da ideia é acessível a todos; as demais telas, só pelo menu do perfil. */
export function canAccess(role: Role, screen: Screen): boolean {
  return screen === "idea-detail" || navByRole[role].some((item) => item.screen === screen);
}
