import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import Topbar from "../components/Topbar";
import Card, { CardHeader } from "../components/Card";
import StatCard from "../components/StatCard";
import { detectionTrend, malwareFamilies, riskDistribution } from "../data/mockData";

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-line bg-paper px-3 py-2 shadow-sm">
      <p className="font-mono text-[11px] text-ink-faint">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="font-mono text-xs text-ink">{p.name}: <span className="font-semibold">{p.value}</span></p>
      ))}
    </div>
  );
}

export default function Analytics() {
  return (
    <div>
      <Topbar title="Analytics" subtitle="Malware statistics, detection performance, and threat trend reporting." />

      <div className="space-y-6 px-8 py-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Classification accuracy" value="96.8%" delta="+0.6%" trend="up" />
          <StatCard label="False positive rate" value="1.4%" delta="-0.3%" trend="down" />
          <StatCard label="Avg. dashboard response" value="182ms" delta="-18ms" trend="down" />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader eyebrow="Trend" title="Threat detection efficiency" />
            <div className="h-64 px-4 pb-4 pt-6">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={detectionTrend}>
                  <CartesianGrid vertical={false} stroke="#e7e6e3" />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#a2a3ab", fontFamily: "JetBrains Mono" }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#a2a3ab", fontFamily: "JetBrains Mono" }} width={28} />
                  <Tooltip content={<ChartTooltip />} />
                  <Line type="monotone" dataKey="threats" name="Threats" stroke="#ff5e1a" strokeWidth={2.5} dot={{ r: 3, fill: "#ff5e1a" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <CardHeader eyebrow="Breakdown" title="Malware families (30d)" />
            <div className="h-64 px-4 pb-4 pt-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={malwareFamilies} layout="vertical" margin={{ left: 8 }}>
                  <CartesianGrid horizontal={false} stroke="#e7e6e3" />
                  <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#a2a3ab", fontFamily: "JetBrains Mono" }} />
                  <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={80} tick={{ fontSize: 12, fill: "#15161a" }} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "#fff5ee" }} />
                  <Bar dataKey="value" name="Samples" radius={[0, 6, 6, 0]} fill="#ff5e1a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <Card>
          <CardHeader eyebrow="Distribution" title="Risk score bands (all time)" />
          <div className="h-56 px-4 pb-4 pt-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskDistribution} barCategoryGap={30}>
                <CartesianGrid vertical={false} stroke="#e7e6e3" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#a2a3ab", fontFamily: "JetBrains Mono" }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#a2a3ab", fontFamily: "JetBrains Mono" }} width={28} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "#fff5ee" }} />
                <Bar dataKey="count" name="Files" radius={[6, 6, 0, 0]} fill="#ffab6b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
