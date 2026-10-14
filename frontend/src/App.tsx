import { useState } from "react";
import type { AuthSession, Role, Screen } from "./types";
import { clearSession, loadSession } from "./lib/auth";
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
  const [session, setSession] = useState<AuthSession | null>(loadSession);
  const [screen, setScreen] = useState<Screen>(() =>
    session ? defaultScreenByRole[session.user.role] : "new-idea",
  );
  const [openIdeaId, setOpenIdeaId] = useState<string>("i1");

  function handleLogin(s: AuthSession) {
    setSession(s);
    setScreen(defaultScreenByRole[s.user.role]);
  }

  function handleLogout() {
    clearSession();
    setSession(null);
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

  if (!session) {
    return <Login onLogin={handleLogin} />;
  }

  const role: Role = session.user.role;

  return (
    <div className="flex h-full" style={{ background: "#F5F5F7" }}>
      <Sidebar
        user={session.user}
        screen={screen}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
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
