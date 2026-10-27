import { useEffect, useState } from "react";
import type { AuthSession, Idea, Screen } from "./types";
import { clearSession, loadSession } from "./lib/auth";
import { canAccess, defaultScreen } from "./lib/navigation";
import { getIdea } from "./lib/ideas";
import Login from "./screens/Login";
import NewIdea from "./screens/NewIdea";
import MyIdeas from "./screens/MyIdeas";
import KanbanFunnel from "./screens/KanbanFunnel";
import IdeaDetail from "./screens/IdeaDetail";
import GateEvaluation from "./screens/GateEvaluation";
import GateDecision from "./screens/GateDecision";
import KPIDashboard from "./screens/KPIDashboard";
import ApprovedBoard from "./screens/ApprovedBoard";
import ApprovalRequests from "./screens/ApprovalRequests";
import GateTriage from "./screens/GateTriage";
import UsersAdmin from "./screens/UsersAdmin";
import Sidebar from "./components/Sidebar";

export default function App() {
  const [session, setSession] = useState<AuthSession | null>(loadSession);
  const [screen, setScreen] = useState<Screen>(() =>
    session ? defaultScreen(session.user.role) : "new-idea",
  );
  const [openIdea, setOpenIdea] = useState<Idea | null>(null);
  // Tela para onde o "Voltar" do detalhe retorna
  const [detailBackTo, setDetailBackTo] = useState<Screen>("funnel");
  // true quando a ideia aberta veio do backend (e não dos dados de exemplo)
  const [openIdeaFromApi, setOpenIdeaFromApi] = useState(false);

  // Nenhum perfil fica numa tela que não é dele (ex.: sessão antiga ou navegação interna)
  useEffect(() => {
    if (session && !canAccess(session.user.role, screen)) {
      setScreen(defaultScreen(session.user.role));
    }
  }, [screen, session]);

  function handleLogin(s: AuthSession) {
    setSession(s);
    setScreen(defaultScreen(s.user.role));
  }

  function handleLogout() {
    clearSession();
    setSession(null);
  }

  function openDetail(idea: Idea, from: Screen, fromApi: boolean) {
    setOpenIdea(idea);
    setDetailBackTo(from);
    setOpenIdeaFromApi(fromApi);
    setScreen("idea-detail");
  }

  function handleNavigate(target: Screen) {
    if (session && !canAccess(session.user.role, target)) {
      setScreen(defaultScreen(session.user.role));
      return;
    }
    setScreen(target);
  }

  // NOT-05: a notificação leva ao item correspondente
  async function handleNotificationLink(link: string) {
    if (!session) return;
    if (link.startsWith("idea:")) {
      try {
        const idea = await getIdea(link.slice("idea:".length), session.token);
        openDetail(idea, screen === "idea-detail" ? detailBackTo : screen, true);
      } catch {
        // Ideia sem acesso ou inexistente: permanece na tela atual
      }
      return;
    }
    const target: Record<string, Screen> = { evaluate: "evaluate", triage: "triage", decision: "gate-decision" };
    if (target[link]) handleNavigate(target[link]);
  }

  if (!session) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-full" style={{ background: "#F5F5F7" }}>
      <Sidebar
        user={session.user}
        screen={screen}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        token={session.token}
        onOpenNotification={handleNotificationLink}
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
            onOpenIdea={(idea) => openDetail(idea, "my-ideas", true)}
            onNewIdea={() => setScreen("new-idea")}
            onSessionExpired={handleLogout}
          />
        )}
        {screen === "funnel" && (
          <KanbanFunnel
            token={session.token}
            onOpenIdea={(idea) => openDetail(idea, "funnel", true)}
            onSessionExpired={handleLogout}
          />
        )}
        {screen === "idea-detail" && openIdea && (
          <IdeaDetail
            idea={openIdea}
            viewerId={session.user.id}
            onBack={() => setScreen(detailBackTo)}
            live={openIdeaFromApi ? { token: session.token, onSessionExpired: handleLogout } : undefined}
          />
        )}
        {screen === "evaluate" && (
          <GateEvaluation token={session.token} onSessionExpired={handleLogout} />
        )}
        {screen === "triage" && (
          <GateTriage
            token={session.token}
            onOpenIdea={(idea) => openDetail(idea, "triage", true)}
            onSessionExpired={handleLogout}
          />
        )}
        {screen === "gate-decision" && (
          <GateDecision
            token={session.token}
            onOpenIdea={(idea) => openDetail(idea, "gate-decision", true)}
            onSessionExpired={handleLogout}
          />
        )}
        {screen === "users" && (
          <UsersAdmin token={session.token} currentUserId={session.user.id} onSessionExpired={handleLogout} />
        )}
        {screen === "dashboard" && canAccess(session.user.role, "dashboard") && (
          <KPIDashboard
            token={session.token}
            readOnly={session.user.role === "administrador"}
            onSessionExpired={handleLogout}
          />
        )}
        {screen === "approvals" && canAccess(session.user.role, "approvals") && (
            <ApprovalRequests
              token={session.token}
              onSessionExpired={handleLogout}
            />
          )}
        {screen === "approved" && (
          <ApprovedBoard
            token={session.token}
            onOpenIdea={(idea) => openDetail(idea, "approved", true)}
            onSessionExpired={handleLogout}
          />
        )}
      </main>
    </div>
  );
}
