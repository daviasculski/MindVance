import type { Department } from "./types";

// Departamentos fixos no frontend até existir a tabela departments (ADM-07, bloco E do roadmap)

export const departments: Department[] = [
  { id: "ti", name: "Tecnologia", color: "#3b82f6", textColor: "#2563EB" },
  { id: "mkt", name: "Marketing", color: "#8b7cf6", textColor: "#6D5CD6" },
  { id: "ops", name: "Operações", color: "#2dd4bf", textColor: "#0D9488" },
  { id: "fin", name: "Financeiro", color: "#d4a72c", textColor: "#A8791F" },
  { id: "rh", name: "Pessoas & Cultura", color: "#f472b6", textColor: "#C2418F" },
  { id: "prod", name: "Produto", color: "#fb7c47", textColor: "#C2540E" },
];
