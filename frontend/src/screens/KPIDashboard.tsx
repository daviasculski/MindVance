import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { kpiData } from "../data";
import { TrendingUp, Clock, Layers, Target } from "lucide-react";

const AMBER = "#F59E0B";

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="px-3 py-2 rounded-xl card-elevated"
      style={{ background: "#FFFFFF", fontSize: 12 }}
    >
      <div style={{ color: "#6E6E73" }}>{label}</div>
      <div style={{ color: "#B6790A", fontWeight: 600 }}>{payload[0].value}</div>
    </div>
  );
}

function RoundDot(props: any) {
  const { cx, cy } = props;
  if (cx == null || cy == null) return null;
  return <circle cx={cx} cy={cy} r={4} fill={AMBER} stroke="#FFFFFF" strokeWidth={2} />;
}

function TickMeter({ pct, color = AMBER }: { pct: number; color?: string }) {
  const filled = Math.round((pct / 100) * 12);
  return (
    <div className="flex-1 flex gap-[3px]">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="rounded-full" style={{ height: 6, flex: 1, background: i < filled ? color : "#E5E5EA" }} />
      ))}
    </div>
  );
}

export default function KPIDashboard() {
  const totalIdeas = kpiData.submissionsByMonth.reduce((a, b) => a + b.count, 0);
  const conversionRate = Math.round(
    (kpiData.funnelConversion[kpiData.funnelConversion.length - 1].count /
      kpiData.funnelConversion[0].count) *
      100
  );
  const avgDays = Math.round(
    kpiData.avgTimeByStage.reduce((a, b) => a + b.days, 0) /
      kpiData.avgTimeByStage.length
  );
  const bottleneckIdx = kpiData.avgTimeByStage.reduce(
    (best, r, i, arr) => (r.days > arr[best].days ? i : best),
    0
  );

  return (
    <div className="flex-1 overflow-y-auto p-8" style={{ background: "#F5F5F7" }}>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1
            style={{
              fontWeight: 700,
              fontSize: 24,
              color: "#1D1D1F",
              letterSpacing: "-0.02em",
            }}
          >
            Indicadores de Inovação
          </h1>
          <p style={{ color: "#AEAEB2", fontSize: 13, marginTop: 4 }}>
            Dados acumulados · Jan – Set 2026
          </p>
        </div>

        {/* KPI cards */}
        <div className="grid gap-4 mb-8" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          {[
            {
              icon: <Target size={18} style={{ color: "#F59E0B" }} />,
              label: "Ideias Submetidas",
              value: totalIdeas,
              sub: "últimos 7 meses",
            },
            {
              icon: <TrendingUp size={18} style={{ color: "#34C759" }} />,
              label: "Taxa de Conversão",
              value: `${conversionRate}%`,
              sub: "Ideação → Lançamento",
            },
            {
              icon: <Clock size={18} style={{ color: "#3B82F6" }} />,
              label: "Tempo Médio/Estágio",
              value: `${avgDays}d`,
              sub: "média dos 6 estágios",
            },
            {
              icon: <Layers size={18} style={{ color: "#8B7CF6" }} />,
              label: "Em Desenvolvimento",
              value: 14,
              sub: "projetos ativos",
            },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="p-5 rounded-2xl card-soft"
              style={{ background: "#FFFFFF" }}
            >
              <div className="flex items-center gap-2 mb-3">
                {kpi.icon}
                <span style={{ color: "#AEAEB2", fontSize: 10.5, fontWeight: 600, letterSpacing: "0.02em" }}>
                  {kpi.label.toUpperCase()}
                </span>
              </div>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 32,
                  color: "#1D1D1F",
                  letterSpacing: "-0.02em",
                  lineHeight: 1,
                }}
              >
                {kpi.value}
              </div>
              <div style={{ color: "#AEAEB2", fontSize: 11, marginTop: 4 }}>
                {kpi.sub}
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-6 mb-6" style={{ gridTemplateColumns: "1fr 1fr" }}>
          {/* Submissions over time */}
          <div
            className="p-5 rounded-2xl card-soft"
            style={{ background: "#FFFFFF" }}
          >
            <div style={{ color: "#AEAEB2", fontSize: 11, fontWeight: 600, marginBottom: 16 }}>
              SUBMISSÕES POR MÊS
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={kpiData.submissionsByMonth}>
                <XAxis dataKey="month" tick={{ fill: "#AEAEB2", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#AEAEB2", fontSize: 11 }} axisLine={false} tickLine={false} width={25} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="count" stroke={AMBER} strokeWidth={2.5} dot={<RoundDot />} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Funnel conversion */}
          <div
            className="p-5 rounded-2xl card-soft"
            style={{ background: "#FFFFFF" }}
          >
            <div style={{ color: "#AEAEB2", fontSize: 11, fontWeight: 600, marginBottom: 16 }}>
              CONVERSÃO DO FUNIL
            </div>
            <div className="flex flex-col gap-2.5">
              {kpiData.funnelConversion.map((row, i) => {
                const pct = Math.round((row.count / kpiData.funnelConversion[0].count) * 100);
                return (
                  <div key={row.stage} className="flex items-center gap-3">
                    <div style={{ color: "#6E6E73", fontSize: 10.5, width: 90, flexShrink: 0, textAlign: "right" }}>
                      {row.stage}
                    </div>
                    <TickMeter pct={pct} color={i === kpiData.funnelConversion.length - 1 ? "#34C759" : AMBER} />
                    <div style={{ color: "#1D1D1F", fontSize: 11, fontWeight: 700, width: 30, textAlign: "right" }}>
                      {row.count}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid gap-6" style={{ gridTemplateColumns: "1fr 1fr" }}>
          {/* Avg time by stage */}
          <div
            className="p-5 rounded-2xl card-soft"
            style={{ background: "#FFFFFF" }}
          >
            <div style={{ color: "#AEAEB2", fontSize: 11, fontWeight: 600, marginBottom: 16 }}>
              TEMPO MÉDIO POR ESTÁGIO (dias)
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={kpiData.avgTimeByStage} barSize={22}>
                <XAxis dataKey="stage" tick={{ fill: "#AEAEB2", fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#AEAEB2", fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="days" radius={[6, 6, 0, 0]}>
                  {kpiData.avgTimeByStage.map((_, i) => (
                    <Cell key={i} fill={i === bottleneckIdx ? "#FF9500" : AMBER} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* By department */}
          <div
            className="p-5 rounded-2xl card-soft"
            style={{ background: "#FFFFFF" }}
          >
            <div style={{ color: "#AEAEB2", fontSize: 11, fontWeight: 600, marginBottom: 16 }}>
              IDEIAS POR DEPARTAMENTO
            </div>
            <div className="flex flex-col gap-3">
              {kpiData.byDepartment.map((row) => {
                const max = kpiData.byDepartment[0].count;
                const pct = Math.round((row.count / max) * 100);
                return (
                  <div key={row.dept} className="flex items-center gap-3">
                    <div style={{ color: "#6E6E73", fontSize: 11, width: 110, flexShrink: 0 }}>
                      {row.dept}
                    </div>
                    <TickMeter pct={pct} />
                    <div style={{ color: "#1D1D1F", fontSize: 12, fontWeight: 700, width: 22, textAlign: "right" }}>
                      {row.count}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
