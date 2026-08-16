import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import Topbar from "../components/Topbar";
import Card, { CardHeader } from "../components/Card";
import SeverityBadge from "../components/SeverityBadge";
import { malwareFamilies, recentScans } from "../data/mockData";

const ORANGE_SHADES = ["#ff5e1a", "#ff8a3d", "#ffab6b", "#ffcda5", "#ffe8d8", "#c7440a"];

export default function Classification() {
  const classified = recentScans.filter((s) => s.status !== "low");

  return (
    <div>
      <Topbar title="Malware Classification" subtitle="Family identification, confidence scoring, and detection model output." />

      <div className="grid grid-cols-1 gap-6 px-8 py-6 xl:grid-cols-5">
        <Card className="xl:col-span-2">
          <CardHeader eyebrow="Model output" title="Malware family breakdown" />
          <div className="h-72 px-2 pb-4 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={malwareFamilies} dataKey="value" nameKey="name" innerRadius={58} outerRadius={90} paddingAngle={2}>
                  {malwareFamilies.map((entry, i) => (
                    <Cell key={entry.name} fill={ORANGE_SHADES[i % ORANGE_SHADES.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: 8, borderColor: "#e7e6e3", fontFamily: "JetBrains Mono", fontSize: 12 }}
                />
                <Legend
                  layout="vertical"
                  verticalAlign="middle"
                  align="right"
                  iconType="circle"
                  wrapperStyle={{ fontSize: 12, fontFamily: "Inter" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="xl:col-span-3">
          <CardHeader eyebrow="Queue" title="Classified samples" />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-[11px] font-mono uppercase tracking-wide text-ink-faint">
                  <th className="px-5 py-3 font-medium">File</th>
                  <th className="px-5 py-3 font-medium">Family / verdict</th>
                  <th className="px-5 py-3 font-medium">Confidence</th>
                  <th className="px-5 py-3 font-medium">Severity</th>
                </tr>
              </thead>
              <tbody>
                {classified.map((s) => (
                  <tr key={s.id} className="border-b border-line last:border-0 hover:bg-surface/60">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-ink">{s.file}</p>
                      <p className="font-mono text-[11px] text-ink-faint">{s.hash}</p>
                    </td>
                    <td className="px-5 py-3.5 text-ink-soft">{s.verdict}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-orange-50">
                          <div className="h-full rounded-full bg-orange-500" style={{ width: `${s.risk}%` }} />
                        </div>
                        <span className="font-mono text-xs text-ink-soft">{s.risk}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5"><SeverityBadge severity={s.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <div className="px-8 pb-8">
        <Card>
          <CardHeader eyebrow="Pipeline" title="Classification model stages" />
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl bg-line sm:grid-cols-4">
            {[
              ["Feature engineering", "Extracted static features are normalized and vectorized."],
              ["Model inference", "Ensemble classifier scores the sample against known families."],
              ["Category mapping", "Top match is mapped to a malware family label."],
              ["Result generation", "Confidence score and recommended action are produced."],
            ].map(([title, desc], i) => (
              <div key={title} className="bg-paper p-4">
                <p className="font-mono text-[11px] text-orange-500">0{i + 1}</p>
                <p className="mt-1 text-sm font-semibold text-ink">{title}</p>
                <p className="mt-1 text-xs leading-relaxed text-ink-soft">{desc}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
