import {
  LayoutGrid,
  Lightbulb,
  PlusCircle,
  ClipboardCheck,
  BarChart3,
  Trophy,
  LogOut,
  ChevronDown,
} from "lucide-react";
import type { Role, Screen } from "../types";
import { useState } from "react";

interface SidebarProps {
  role: Role;
  screen: Screen;
  onNavigate: (s: Screen) => void;
  onRoleChange: (r: Role) => void;
  onLogout: () => void;
}

const roleLabels: Record<Role, string> = {
  colaborador: "Colaborador",
  avaliador: "Avaliador",
  administrador: "Administrador",
};

const navByRole: Record<Role, { screen: Screen; label: string; icon: React.ReactNode }[]> = {
  colaborador: [
    { screen: "new-idea", label: "Nova Ideia", icon: <PlusCircle size={16} /> },
    { screen: "idea-detail", label: "Minhas Ideias", icon: <Lightbulb size={16} /> },
    { screen: "approved", label: "Mural de Aprovadas", icon: <Trophy size={16} /> },
  ],
  avaliador: [
    { screen: "evaluate", label: "Fila de Avaliações", icon: <ClipboardCheck size={16} /> },
    { screen: "funnel", label: "Painel do Funil", icon: <LayoutGrid size={16} /> },
  ],
  administrador: [
    { screen: "funnel", label: "Painel do Funil", icon: <LayoutGrid size={16} /> },
    { screen: "gate-decision", label: "Decisão de Gate", icon: <ClipboardCheck size={16} /> },
    { screen: "dashboard", label: "Indicadores", icon: <BarChart3 size={16} /> },
  ],
};

export default function Sidebar({ role, screen, onNavigate, onRoleChange, onLogout }: SidebarProps) {
  const [roleOpen, setRoleOpen] = useState(false);
  const nav = navByRole[role];

  return (
    <aside
      className="flex flex-col h-full"
      style={{
        width: 232,
        minWidth: 232,
        background: "#FFFFFF",
        borderRight: "1px solid #E5E5EA",
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5">
        <img src="/assets/logo-dark.svg" alt="" width={24} height={24} style={{ flexShrink: 0 }} />
        <span
          style={{
            fontWeight: 700,
            fontSize: 17,
            color: "#1D1D1F",
            letterSpacing: "-0.02em",
          }}
        >
          IMS
        </span>
        <span style={{ fontSize: 11, color: "#AEAEB2", marginLeft: 2 }}>Stage-Gate</span>
      </div>

      {/* Role switcher */}
      <div className="px-3 py-2">
        <button
          onClick={() => setRoleOpen((v) => !v)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl transition-colors"
          style={{
            background: "#F5F5F7",
            color: "#1D1D1F",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          <div className="flex items-center gap-2.5">
            <div className="rounded-full" style={{ width: 6, height: 6, background: "#F59E0B" }} />
            {roleLabels[role]}
          </div>
          <ChevronDown size={14} style={{ color: "#AEAEB2" }} />
        </button>
        {roleOpen && (
          <div
            className="mt-1 rounded-xl overflow-hidden card-elevated"
            style={{ background: "#FFFFFF" }}
          >
            {(["colaborador", "avaliador", "administrador"] as Role[]).map((r) => (
              <button
                key={r}
                onClick={() => { onRoleChange(r); setRoleOpen(false); }}
                className="w-full text-left px-3 py-2.5 transition-colors"
                style={{
                  background: r === role ? "rgba(245,158,11,0.08)" : "transparent",
                  color: r === role ? "#B6790A" : "#1D1D1F",
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                {roleLabels[r]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 flex flex-col gap-1">
        {nav.map((item) => {
          const active = screen === item.screen;
          return (
            <button
              key={item.screen}
              onClick={() => onNavigate(item.screen)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left"
              style={{
                background: active ? "rgba(245,158,11,0.1)" : "transparent",
                color: active ? "#B6790A" : "#6E6E73",
                fontSize: 13.5,
                fontWeight: active ? 600 : 400,
                cursor: "pointer",
              }}
            >
              {item.icon}
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* User / logout */}
      <div className="px-3 py-4" style={{ borderTop: "1px solid #E5E5EA" }}>
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div
            className="flex items-center justify-center flex-shrink-0 rounded-full"
            style={{ width: 30, height: 30, background: "#F5F5F7" }}
          >
            <span style={{ color: "#B6790A", fontSize: 12, fontWeight: 600 }}>AL</span>
          </div>
          <div>
            <div style={{ color: "#1D1D1F", fontSize: 12.5, fontWeight: 600 }}>
              Ana Lira
            </div>
            <div style={{ color: "#AEAEB2", fontSize: 11 }}>
              ana.lira@empresa.com
            </div>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2 rounded-xl px-3 py-2 transition-colors"
          style={{
            color: "#AEAEB2",
            fontSize: 13,
            cursor: "pointer",
            background: "transparent",
          }}
        >
          <LogOut size={14} />
          Sair
        </button>
      </div>
    </aside>
  );
}
