import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { ApiError } from "../lib/api";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  timeAgo,
  type AppNotification,
} from "../lib/notifications";

const POLL_MS = 30_000;

interface NotificationBellProps {
  token: string;
  /** Abre o item da notificação (NOT-05) */
  onOpen: (link: string) => void;
  onSessionExpired: () => void;
}

/** Sino com o número de não lidas e a lista de notificações (NOT-01). */
export default function NotificationBell({ token, onOpen, onSessionExpired }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [error, setError] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const sessionExpiredRef = useRef(onSessionExpired);
  sessionExpiredRef.current = onSessionExpired;

  const load = useCallback(async () => {
    try {
      const data = await listNotifications(token);
      setItems(data.items);
      setUnread(data.unreadCount);
      setError(false);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        sessionExpiredRef.current();
        return;
      }
      setError(true);
    }
  }, [token]);

  // Atualiza periodicamente e quando a janela volta ao foco
  useEffect(() => {
    load();
    const timer = setInterval(load, POLL_MS);
    window.addEventListener("focus", load);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", load);
    };
  }, [load]);

  // Fecha ao clicar fora ou apertar Esc
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function handleClick(n: AppNotification) {
    if (!n.readAt) {
      setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, readAt: new Date().toISOString() } : i)));
      setUnread((u) => Math.max(0, u - 1));
      markNotificationRead(n.id, token).catch(() => load());
    }
    setOpen(false);
    if (n.link) onOpen(n.link);
  }

  async function handleReadAll() {
    setItems((prev) => prev.map((i) => ({ ...i, readAt: i.readAt ?? new Date().toISOString() })));
    setUnread(0);
    markAllNotificationsRead(token).catch(() => load());
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => {
          setOpen((v) => !v);
          if (!open) load();
        }}
        className="relative flex items-center justify-center rounded-xl"
        style={{ width: 32, height: 32, background: open ? "#F5F5F7" : "transparent", border: "none", cursor: "pointer", color: "#6E6E73" }}
        aria-label={unread > 0 ? `Notificações: ${unread} não lidas` : "Notificações"}
        title="Notificações"
      >
        <Bell size={17} />
        {unread > 0 && (
          <span
            className="absolute flex items-center justify-center rounded-full"
            style={{
              top: 2,
              right: 1,
              minWidth: 16,
              height: 16,
              padding: "0 4px",
              background: "#F59E0B",
              color: "#FFFFFF",
              fontSize: 10,
              fontWeight: 700,
              border: "2px solid #FFFFFF",
            }}
          >
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute z-50 rounded-2xl card-elevated flex flex-col"
          style={{ left: 0, top: 40, width: 360, maxHeight: 480, background: "#FFFFFF", border: "1px solid #E5E5EA" }}
          role="dialog"
          aria-label="Notificações"
        >
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid #F0F0F2" }}>
            <span style={{ color: "#1D1D1F", fontSize: 14, fontWeight: 700 }}>Notificações</span>
            {unread > 0 && (
              <button
                onClick={handleReadAll}
                className="flex items-center gap-1.5"
                style={{ color: "#B6790A", fontSize: 12, fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}
              >
                <CheckCheck size={13} />
                Marcar todas como lidas
              </button>
            )}
          </div>

          <div className="overflow-y-auto">
            {error && items.length === 0 ? (
              <p className="p-6 text-center" style={{ color: "#AEAEB2", fontSize: 13 }}>
                Não foi possível carregar as notificações.
              </p>
            ) : items.length === 0 ? (
              <p className="p-6 text-center" style={{ color: "#AEAEB2", fontSize: 13 }}>
                Nenhuma notificação por enquanto.
              </p>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className="w-full text-left flex gap-3 px-4 py-3"
                  style={{
                    background: n.readAt ? "#FFFFFF" : "rgba(245,158,11,0.05)",
                    border: "none",
                    borderBottom: "1px solid #F5F5F7",
                    cursor: n.link ? "pointer" : "default",
                  }}
                >
                  <span
                    className="rounded-full flex-shrink-0"
                    style={{ width: 7, height: 7, marginTop: 6, background: n.readAt ? "transparent" : "#F59E0B" }}
                    aria-hidden
                  />
                  <span className="min-w-0">
                    <span className="block" style={{ color: "#1D1D1F", fontSize: 13, fontWeight: n.readAt ? 500 : 700 }}>
                      {n.title}
                    </span>
                    <span className="block" style={{ color: "#6E6E73", fontSize: 12, lineHeight: 1.5, marginTop: 2 }}>
                      {n.message}
                    </span>
                    <span className="block" style={{ color: "#AEAEB2", fontSize: 11, marginTop: 4 }}>
                      {timeAgo(n.createdAt)}
                      {!n.readAt && <span className="sr-only"> · não lida</span>}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
