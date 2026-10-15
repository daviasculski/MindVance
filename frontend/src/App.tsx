import { useState } from "react";
import type { AuthSession, Idea, Role, Screen } from "./types";
import { clearSession, loadSession } from "./lib/auth";
import { ideas as mockIdeas } from "./data";
import Login from "./screens/Login";
import NewIdea from "./screens/NewIdea";
import MyIdeas from "./screens/MyIdeas";
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
  const [openIdea, setOpenIdea] = useState<Idea | null>(null);
  // Tela para onde o "Voltar" do detalhe retorna
  const [detailBackTo, setDetailBackTo] = useState<Screen>("funnel");

  function handleLogin(s: AuthSession) {
    setSession(s);
    setScreen(defaultScreenByRole[s.user.role]);
  }

  function handleLogout() {
    clearSession();
    setSession(null);
  }

  function openDetail(idea: Idea, from: Screen) {
    setOpenIdea(idea);
    setDetailBackTo(from);
    setScreen("idea-detail");
  }

  // Funil e Mural ainda usam dados de exemplo, identificados por id
  function handleOpenMockIdea(id: string) {
    const idea = mockIdeas.find((i) => i.id === id);
    if (idea) openDetail(idea, screen);
  }

  if (!session) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-full" style={{ background: "#F5F5F7" }}>
      <Sidebar
        user={session.user}
        screen={screen}
        onNavigate={setScreen}
        onLogout={handleLogout}
      />

      <main className="flex-1 flex overflow-hidden">
        {screen === "new-idea" && (
          <NewIdea
            token={session.token}
            onSessionExpired={handleLogout}
            onViewMyIdeas={() => setScreen("my-ideas")}
          />
        )}
        {screen === "my-ideas" && (
          <MyIdeas
            user={session.user}
            token={session.token}
            onOpenIdea={(idea) => openDetail(idea, "my-ideas")}
            onNewIdea={() => setScreen("new-idea")}
            onSessionExpired={handleLogout}
          />
        )}
        {screen === "funnel" && <KanbanFunnel onOpenIdea={handleOpenMockIdea} />}
        {screen === "idea-detail" && openIdea && (
          <IdeaDetail idea={openIdea} onBack={() => setScreen(detailBackTo)} />
        )}
        {screen === "evaluate" && <GateEvaluation />}
        {screen === "gate-decision" && <GateDecision />}
        {screen === "dashboard" && <KPIDashboard />}
        {screen === "approved" && (
          <ApprovedBoard onOpenIdea={handleOpenMockIdea} />
        )}
      </main>
    </div>
  );
}
