import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import Topbar from "../components/Topbar";
import StatCard from "../components/StatCard";
import Card, { CardHeader } from "../components/Card";
import SeverityBadge from "../components/SeverityBadge";
import { statOverview, detectionTrend, riskDistribution, recentScans } from "../data/mockData";
import { useAuth } from "../context/AuthContext";

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-line bg-paper px-3 py-2 shadow-sm">
      <p className="font-mono text-[11px] text-ink-faint">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="font-mono text-xs text-ink">
          {p.name}: <span className="font-semibold">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div>
      <Topbar title="Overview" subtitle={`Welcome back, ${user?.name?.split(" ")[0] ?? "analyst"}. Here's the state of the fleet.`} />

      <div className="space-y-6 px-8 py-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statOverview.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
          <Card className="xl:col-span-3">
            <CardHeader eyebrow="Weekly" title="Scans vs. threats detected" />
            <div className="h-64 px-4 pb-4 pt-6">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={detectionTrend}>
                  <defs>
                    <linearGradient id="scans" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ffab6b" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#ffab6b" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="threats" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ff5e1a" stopOpacity={0.55} />
                      <stop offset="100%" stopColor="#ff5e1a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#e7e6e3" />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#a2a3ab", fontFamily: "JetBrains Mono" }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#a2a3ab", fontFamily: "JetBrains Mono" }} width={28} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="scans" name="Scans" stroke="#ffab6b" fill="url(#scans)" strokeWidth={2} />
                  <Area type="monotone" dataKey="threats" name="Threats" stroke="#ff5e1a" fill="url(#threats)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="xl:col-span-2">
            <CardHeader eyebrow="Distribution" title="Risk score bands" />
            <div className="h-64 px-4 pb-4 pt-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={riskDistribution} barCategoryGap={22}>
                  <CartesianGrid vertical={false} stroke="#e7e6e3" />
                  <XAxis dataKey="band" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#a2a3ab", fontFamily: "JetBrains Mono" }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#a2a3ab", fontFamily: "JetBrains Mono" }} width={28} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "#fff5ee" }} />
                  <Bar dataKey="count" name="Files" radius={[6, 6, 0, 0]} fill="#ff5e1a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <Card>
          <CardHeader eyebrow="Live feed" title="Recent scans" />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-[11px] font-mono uppercase tracking-wide text-ink-faint">
                  <th className="px-5 py-3 font-medium">Scan ID</th>
                  <th className="px-5 py-3 font-medium">File</th>
                  <th className="px-5 py-3 font-medium">Verdict</th>
                  <th className="px-5 py-3 font-medium">Risk</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Analyst</th>
                  <th className="px-5 py-3 font-medium">When</th>
                </tr>
              </thead>
              <tbody>
                {recentScans.map((s) => (
                  <tr key={s.id} className="border-b border-line last:border-0 hover:bg-surface/60">
                    <td className="px-5 py-3.5 font-mono text-xs text-ink-soft">{s.id}</td>
                    <td className="px-5 py-3.5 font-medium text-ink">{s.file}</td>
                    <td className="px-5 py-3.5 text-ink-soft">{s.verdict}</td>
                    <td className="px-5 py-3.5 font-mono text-xs text-ink">{s.risk}/100</td>
                    <td className="px-5 py-3.5"><SeverityBadge severity={s.status} /></td>
                    <td className="px-5 py-3.5 text-ink-soft">{s.analyst}</td>
                    <td className="px-5 py-3.5 text-ink-faint">{s.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
