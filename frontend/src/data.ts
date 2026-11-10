import type { Department } from "./types";

// Departamentos fixos no frontend até existir a tabela departments (ADM-07, bloco E do roadmap)

export const departments: Department[] = [
  { id: "ti", name: "Tecnologia", color: "#0072ce", textColor: "#0A1931" },
  { id: "mkt", name: "Marketing", color: "#00b4d8", textColor: "#0A1931" },
  { id: "ops", name: "Operações", color: "#00f58a", textColor: "#0A1931" },
  { id: "fin", name: "Financeiro", color: "#0072ce", textColor: "#0A1931" },
  { id: "rh", name: "Pessoas & Cultura", color: "#0072ce", textColor: "#0A1931" },
  { id: "prod", name: "Produto", color: "#00b4d8", textColor: "#0A1931" },
];
