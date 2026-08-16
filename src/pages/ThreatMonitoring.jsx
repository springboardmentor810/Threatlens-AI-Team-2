import { Activity } from "lucide-react";
import Topbar from "../components/Topbar";
import Card, { CardHeader } from "../components/Card";
import SeverityBadge from "../components/SeverityBadge";
import { detectionLogs, recentScans } from "../data/mockData";

const activeThreats = recentScans.filter((s) => s.status === "critical" || s.status === "high");

export default function ThreatMonitoring() {
  return (
    <div>
      <Topbar title="Threat Monitoring" subtitle="Live detection logs, active threats, and incident tracking." />

      <div className="grid grid-cols-1 gap-6 px-8 py-6 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader
            eyebrow="Live"
            title="Detection log"
            action={
              <span className="flex items-center gap-1.5 font-mono text-[11px] text-orange-500 blink-cursor">
                streaming
              </span>
            }
          />
          <div className="max-h-[420px] overflow-y-auto">
            <table className="w-full text-left text-sm">
              <tbody>
                {detectionLogs.map((log, i) => (
                  <tr key={i} className="border-b border-line last:border-0">
                    <td className="w-24 px-5 py-3 font-mono text-xs text-ink-faint">{log.time}</td>
                    <td className="px-5 py-3">
                      <p className="text-ink">{log.event}</p>
                      <p className="font-mono text-[11px] text-ink-soft">{log.target}</p>
                    </td>
                    <td className="px-5 py-3 text-right text-ink-soft">{log.result}</td>
                    <td className="w-8 px-4 py-3 text-right">
                      <span className={`inline-block h-2 w-2 rounded-full ${log.status === "critical" ? "bg-orange-500" : log.status === "medium" ? "bg-orange-300" : "bg-line-strong"}`} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader eyebrow="Tracking" title="Active threats" />
          <ul className="divide-y divide-line">
            {activeThreats.map((t) => (
              <li key={t.id} className="flex items-start justify-between gap-3 px-5 py-4">
                <div>
                  <p className="text-sm font-medium text-ink">{t.file}</p>
                  <p className="mt-0.5 text-xs text-ink-soft">{t.verdict}</p>
                  <p className="mt-1 flex items-center gap-1 font-mono text-[11px] text-ink-faint">
                    <Activity className="h-3 w-3" /> {t.time}
                  </p>
                </div>
                <SeverityBadge severity={t.status} />
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
