import { useCallback, useEffect, useRef, useState } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp, Clock, Layers, Target, AlertCircle, RotateCw } from "lucide-react";
import StatusBadge from "../components/StatusBadge";
import { ApiError } from "../lib/api";
import { getMetrics, type Metrics } from "../lib/insights";

const AMBER = "#F59E0B";
// Mesmo matiz, passo mais escuro: destaca o gargalo sem introduzir uma nova série
const AMBER_DARK = "#B6790A";
const INK = "#1D1D1F";
const INK_SECONDARY = "#6E6E73";
const INK_MUTED = "#AEAEB2";

type Preset = "30d" | "90d" | "12m" | "all" | "custom";

const presets: { id: Preset; label: string }[] = [
  { id: "30d", label: "30 dias" },
  { id: "90d", label: "90 dias" },
  { id: "12m", label: "12 meses" },
  { id: "all", label: "Tudo" },
  { id: "custom", label: "Personalizado" },
];

function isoDay(date: Date) {
  return date.toISOString().slice(0, 10);
}

function presetRange(preset: Preset): { from?: string; to?: string } {
  const today = new Date();
  const back = (days: number) => isoDay(new Date(today.getTime() - days * 24 * 60 * 60 * 1000));
  switch (preset) {
    case "30d":
      return { from: back(30), to: isoDay(today) };
    case "90d":
      return { from: back(90), to: isoDay(today) };
    case "12m":
      return { from: back(365), to: isoDay(today) };
    default:
      return {};
  }
}

function ValueTooltip({ active, payload, label, unit }: any) {
  if (!active || !payload?.length || payload[0].value == null) return null;
  return (
    <div className="px-3 py-2 rounded-xl card-elevated" style={{ background: "#FFFFFF", fontSize: 12 }}>
      <div style={{ color: INK_SECONDARY }}>{label}</div>
      <div style={{ color: INK, fontWeight: 600 }}>
        {payload[0].value.toLocaleString("pt-BR")}
        {unit}
      </div>
    </div>
  );
}

function RoundDot(props: any) {
  const { cx, cy } = props;
  if (cx == null || cy == null) return null;
  return <circle cx={cx} cy={cy} r={4} fill={AMBER} stroke="#FFFFFF" strokeWidth={2} />;
}

function TickMeter({ pct, color = AMBER, label }: { pct: number; color?: string; label: string }) {
  const filled = Math.round((pct / 100) * 12);
  return (
    <div className="flex-1 flex gap-[3px]" role="img" aria-label={label} title={label}>
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="rounded-full" style={{ height: 6, flex: 1, background: i < filled ? color : "#E5E5EA" }} />
      ))}
    </div>
  );
}

interface KPIDashboardProps {
  token: string;
  /** O Administrador acessa os indicadores só para leitura (D12) */
  readOnly?: boolean;
  onSessionExpired: () => void;
}

/** Painel de indicadores (Módulo 6) com dados reais e filtro de período (KPI-06). */
export default function KPIDashboard({ token, readOnly, onSessionExpired }: KPIDashboardProps) {
  const [preset, setPreset] = useState<Preset>("12m");
  const [custom, setCustom] = useState<{ from: string; to: string }>({ from: "", to: "" });
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const sessionExpiredRef = useRef(onSessionExpired);
  sessionExpiredRef.current = onSessionExpired;

  const range = preset === "custom" ? { from: custom.from || undefined, to: custom.to || undefined } : presetRange(preset);

  const load = useCallback(async () => {
    setError(null);
    setMetrics(null);
    try {
      setMetrics(await getMetrics(range, token));
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        sessionExpiredRef.current();
        return;
      }
      setError(err instanceof Error ? err.message : "Erro inesperado");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, range.from, range.to]);

  useEffect(() => {
    load();
  }, [load]);

  const periodLabel =
    range.from || range.to
      ? `${range.from ? new Date(`${range.from}T00:00`).toLocaleDateString("pt-BR") : "início"} – ${
          range.to ? new Date(`${range.to}T00:00`).toLocaleDateString("pt-BR") : "hoje"
        }`
      : "Todo o período";

  return (
    <div className="flex-1 overflow-y-auto p-8" style={{ background: "#F5F5F7" }}>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 style={{ fontWeight: 700, fontSize: 24, color: INK, letterSpacing: "-0.02em" }}>Indicadores de Inovação</h1>
          <p style={{ color: INK_MUTED, fontSize: 13, marginTop: 4 }}>
            Ideias submetidas no período · {periodLabel}
            {readOnly && " · somente leitura"}
          </p>
        </div>

        {/* Filtro de período: uma linha acima dos gráficos */}
        <div className="flex items-center gap-2 mb-8 flex-wrap">
          {presets.map((p) => (
            <button
              key={p.id}
              onClick={() => setPreset(p.id)}
              className="rounded-xl px-3.5 py-2"
              style={{
                background: preset === p.id ? "rgba(245,158,11,0.12)" : "#FFFFFF",
                border: `1px solid ${preset === p.id ? AMBER : "#E5E5EA"}`,
                color: preset === p.id ? AMBER_DARK : INK_SECONDARY,
                fontSize: 12.5,
                fontWeight: preset === p.id ? 600 : 400,
                cursor: "pointer",
              }}
            >
              {p.label}
            </button>
          ))}
          {preset === "custom" && (
            <div className="flex items-center gap-2 ml-2">
              <input
                type="date"
                value={custom.from}
                max={custom.to || undefined}
                onChange={(e) => setCustom((c) => ({ ...c, from: e.target.value }))}
                style={dateStyle}
                aria-label="Data inicial"
              />
              <span style={{ color: INK_MUTED, fontSize: 12 }}>até</span>
              <input
                type="date"
                value={custom.to}
                min={custom.from || undefined}
                onChange={(e) => setCustom((c) => ({ ...c, to: e.target.value }))}
                style={dateStyle}
                aria-label="Data final"
              />
            </div>
          )}
        </div>

        {error ? (
          <div className="p-6 rounded-2xl card-soft text-center" style={{ background: "#FFFFFF" }}>
            <div className="flex items-center justify-center gap-2 mb-4" style={{ color: "#FF3B30", fontSize: 13.5 }}>
              <AlertCircle size={15} />
              {error}
            </div>
            <button
              onClick={load}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl"
              style={{ background: "#F5F5F7", color: INK, border: "none", cursor: "pointer", fontSize: 13 }}
            >
              <RotateCw size={13} />
              Tentar novamente
            </button>
          </div>
        ) : !metrics ? (
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl animate-pulse" style={{ background: "#FFFFFF", height: 112 }} />
            ))}
          </div>
        ) : metrics.totalIdeas === 0 ? (
          <div className="rounded-2xl p-12 text-center card-soft" style={{ background: "#FFFFFF" }}>
            <div style={{ color: INK, fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Nenhuma ideia submetida no período</div>
            <p style={{ color: INK_MUTED, fontSize: 13 }}>Escolha um período maior para ver os indicadores.</p>
          </div>
        ) : (
          <Dashboard metrics={metrics} />
        )}
      </div>
    </div>
  );
}

function Dashboard({ metrics }: { metrics: Metrics }) {
  const totals = metrics.gateConversion.reduce(
    (acc, g) => ({ approved: acc.approved + g.approved, concluded: acc.concluded + g.approved + g.rejected }),
    { approved: 0, concluded: 0 },
  );
  const approvalRate = totals.concluded > 0 ? Math.round((totals.approved / totals.concluded) * 100) : null;
  const measured = metrics.avgDaysByStage.filter((s) => s.days !== null);
  const avgDays =
    measured.length > 0 ? Math.round(measured.reduce((a, s) => a + (s.days ?? 0), 0) / measured.length) : null;
  const bottleneck = measured.length > 1 ? measured.reduce((best, s) => ((s.days ?? 0) > (best.days ?? 0) ? s : best)) : null;
  const firstStage = metrics.reachedByStage[0]?.count ?? 0;
  const maxArea = metrics.ideasByArea[0]?.count ?? 1;

  return (
    <>
      {/* Números de destaque */}
      <div className="grid gap-4 mb-8" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        {[
          { icon: <Target size={18} style={{ color: AMBER }} />, label: "Ideias submetidas", value: metrics.totalIdeas, sub: "no período" },
          {
            icon: <TrendingUp size={18} style={{ color: "#34C759" }} />,
            label: "Aprovação nos gates",
            value: approvalRate !== null ? `${approvalRate}%` : "—",
            sub: totals.concluded > 0 ? `${totals.approved} de ${totals.concluded} decisões finais` : "sem decisões no período",
          },
          {
            icon: <Clock size={18} style={{ color: "#3B82F6" }} />,
            label: "Tempo médio/estágio",
            value: avgDays !== null ? `${avgDays}d` : "—",
            sub: "média dos estágios com gate",
          },
          {
            icon: <Layers size={18} style={{ color: "#8B7CF6" }} />,
            label: "Em desenvolvimento",
            value: metrics.inDevelopment.length,
            sub: "aprovados no Gate 3 ou além",
          },
        ].map((kpi) => (
          <div key={kpi.label} className="p-5 rounded-2xl card-soft" style={{ background: "#FFFFFF" }}>
            <div className="flex items-center gap-2 mb-3">
              {kpi.icon}
              <span style={{ color: INK_MUTED, fontSize: 10.5, fontWeight: 600, letterSpacing: "0.02em" }}>
                {kpi.label.toUpperCase()}
              </span>
            </div>
            <div style={{ fontWeight: 700, fontSize: 32, color: INK, letterSpacing: "-0.02em", lineHeight: 1 }}>{kpi.value}</div>
            <div style={{ color: INK_MUTED, fontSize: 11, marginTop: 4 }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 mb-6" style={{ gridTemplateColumns: "1fr 1fr" }}>
        {/* KPI-01 */}
        <Card title="SUBMISSÕES POR MÊS">
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={metrics.submissionsByMonth}>
              <XAxis dataKey="label" tick={{ fill: INK_MUTED, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: INK_MUTED, fontSize: 11 }} axisLine={false} tickLine={false} width={25} />
              <Tooltip content={<ValueTooltip unit=" ideias" />} cursor={{ stroke: "#E5E5EA" }} />
              <Line type="monotone" dataKey="count" stroke={AMBER} strokeWidth={2} dot={<RoundDot />} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Sobrevivência do funil */}
        <Card title="QUANTAS IDEIAS CHEGARAM A CADA ESTÁGIO">
          <div className="flex flex-col gap-2.5">
            {metrics.reachedByStage.map((row, i) => {
              const pct = firstStage > 0 ? Math.round((row.count / firstStage) * 100) : 0;
              return (
                <div key={row.stage} className="flex items-center gap-3">
                  <div style={{ color: INK_SECONDARY, fontSize: 10.5, width: 100, flexShrink: 0, textAlign: "right" }}>{row.stage}</div>
                  <TickMeter
                    pct={pct}
                    color={i === metrics.reachedByStage.length - 1 ? "#34C759" : AMBER}
                    label={`${row.stage}: ${row.count} ideias (${pct}%)`}
                  />
                  <div style={{ color: INK, fontSize: 11, fontWeight: 700, width: 30, textAlign: "right" }}>{row.count}</div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 mb-6" style={{ gridTemplateColumns: "1fr 1fr" }}>
        {/* KPI-02 */}
        <Card title="APROVAÇÃO POR GATE">
          <div className="flex flex-col gap-3">
            {metrics.gateConversion.map((g) => {
              const pct = g.approvalRate !== null ? Math.round(g.approvalRate * 100) : null;
              return (
                <div key={g.gateOrder}>
                  <div className="flex items-center gap-3">
                    <div style={{ color: INK_SECONDARY, fontSize: 11, width: 52, flexShrink: 0 }}>{g.gateName}</div>
                    <TickMeter pct={pct ?? 0} label={`${g.gateName}: ${pct ?? 0}% aprovadas`} />
                    <div style={{ color: INK, fontSize: 11, fontWeight: 700, width: 36, textAlign: "right" }}>
                      {pct !== null ? `${pct}%` : "—"}
                    </div>
                  </div>
                  <div style={{ color: INK_MUTED, fontSize: 10.5, marginLeft: 64, marginTop: 2 }}>
                    {g.decided === 0
                      ? "sem decisões"
                      : `${g.approved} aprovada${g.approved !== 1 ? "s" : ""} · ${g.revised} revisão${g.revised !== 1 ? "ões" : ""} · ${g.rejected} encerrada${g.rejected !== 1 ? "s" : ""}`}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* KPI-03 */}
        <Card title="TEMPO MÉDIO POR ESTÁGIO (dias)">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={metrics.avgDaysByStage} barSize={22}>
              <XAxis dataKey="stage" tick={{ fill: INK_MUTED, fontSize: 9 }} axisLine={false} tickLine={false} interval={0} />
              <YAxis tick={{ fill: INK_MUTED, fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
              <Tooltip content={<ValueTooltip unit=" dias" />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
              <Bar dataKey="days" radius={[4, 4, 0, 0]}>
                {metrics.avgDaysByStage.map((s) => (
                  <Cell key={s.stage} fill={bottleneck && s.stage === bottleneck.stage ? AMBER_DARK : AMBER} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p style={{ color: INK_MUTED, fontSize: 11, marginTop: 6 }}>
            {bottleneck
              ? `Gargalo: ${bottleneck.stage} (${bottleneck.days?.toLocaleString("pt-BR")} dias em média)`
              : "Inclui o tempo das ideias que ainda estão no estágio."}
          </p>
        </Card>
      </div>

      <div className="grid gap-6" style={{ gridTemplateColumns: "1fr 1fr" }}>
        {/* KPI-04 */}
        <Card title="IDEIAS POR DEPARTAMENTO">
          <div className="flex flex-col gap-3">
            {metrics.ideasByArea.map((row) => {
              const pct = Math.round((row.count / maxArea) * 100);
              return (
                <div key={row.area} className="flex items-center gap-3">
                  <div style={{ color: INK_SECONDARY, fontSize: 11, width: 110, flexShrink: 0 }}>{row.area}</div>
                  <TickMeter pct={pct} label={`${row.area}: ${row.count} ideias`} />
                  <div style={{ color: INK, fontSize: 12, fontWeight: 700, width: 22, textAlign: "right" }}>{row.count}</div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* KPI-05 */}
        <Card title="PROJETOS APROVADOS EM DESENVOLVIMENTO">
          {metrics.inDevelopment.length === 0 ? (
            <p style={{ color: INK_MUTED, fontSize: 13 }}>Nenhuma ideia passou do Gate 3 no período.</p>
          ) : (
            <table className="w-full" style={{ fontSize: 12 }}>
              <thead>
                <tr style={{ color: INK_MUTED, textAlign: "left" }}>
                  <th style={{ fontWeight: 600, paddingBottom: 8 }}>Ideia</th>
                  <th style={{ fontWeight: 600, paddingBottom: 8 }}>Estágio</th>
                  <th style={{ fontWeight: 600, paddingBottom: 8 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {metrics.inDevelopment.map((p) => (
                  <tr key={p.id} style={{ borderTop: "1px solid #F0F0F2" }}>
                    <td style={{ color: INK, padding: "8px 8px 8px 0", fontWeight: 600 }}>
                      {p.title}
                      <div style={{ color: INK_MUTED, fontWeight: 400, fontSize: 11 }}>{p.department}</div>
                    </td>
                    <td style={{ color: INK_SECONDARY, padding: "8px 8px 8px 0" }}>{p.stage}</td>
                    <td style={{ padding: "8px 0" }}>
                      <StatusBadge status={p.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-5 rounded-2xl card-soft" style={{ background: "#FFFFFF" }}>
      <div style={{ color: INK_MUTED, fontSize: 11, fontWeight: 600, marginBottom: 16 }}>{title}</div>
      {children}
    </div>
  );
}

const dateStyle: React.CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #E5E5EA",
  borderRadius: 10,
  color: INK,
  fontSize: 12.5,
  padding: "6px 10px",
  outline: "none",
};
