import { useState } from "react";
import type { Role, Screen } from "./types";
import Login from "./screens/Login";
import NewIdea from "./screens/NewIdea";
import KanbanFunnel from "./screens/KanbanFunnel";
import IdeaDetail from "./screens/IdeaDetail";
import GateEvaluation from "./screens/GateEvaluation";
import GateDecision from "./screens/GateDecision";
import KPIDashboard from "./screens/KPIDashboard";
import ApprovedBoard from "./screens/ApprovedBoard";
import Sidebar from "./components/Sidebar";

const defaultScreenByRole: Record<Role, Screen> = {
  colaborador: "new-idea",
  avaliador: "evaluate",
  administrador: "funnel",
};

export default function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [role, setRole] = useState<Role>("colaborador");
  const [screen, setScreen] = useState<Screen>("new-idea");
  const [openIdeaId, setOpenIdeaId] = useState<string>("i1");

  function handleLogin(r: Role) {
    setRole(r);
    setScreen(defaultScreenByRole[r]);
    setAuthenticated(true);
  }

  function handleRoleChange(r: Role) {
    setRole(r);
    setScreen(defaultScreenByRole[r]);
  }

  function handleOpenIdea(id: string) {
    setOpenIdeaId(id);
    setScreen("idea-detail");
  }

  function handleNavigate(s: Screen) {
    if (s === "idea-detail") {
      setScreen("idea-detail");
    } else {
      setScreen(s);
    }
  }

  if (!authenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-full" style={{ background: "#F5F5F7" }}>
      <Sidebar
        role={role}
        screen={screen}
        onNavigate={handleNavigate}
        onRoleChange={handleRoleChange}
        onLogout={() => setAuthenticated(false)}
      />

      <main className="flex-1 flex overflow-hidden">
        {screen === "new-idea" && <NewIdea />}
        {screen === "funnel" && <KanbanFunnel onOpenIdea={handleOpenIdea} />}
        {screen === "idea-detail" && (
          <IdeaDetail
            ideaId={openIdeaId}
            role={role}
            onBack={() => setScreen(role === "colaborador" ? "new-idea" : "funnel")}
          />
        )}
        {screen === "evaluate" && <GateEvaluation />}
        {screen === "gate-decision" && <GateDecision />}
        {screen === "dashboard" && <KPIDashboard />}
        {screen === "approved" && (
          <ApprovedBoard onOpenIdea={handleOpenIdea} />
        )}
      </main>
    </div>
  );
}
