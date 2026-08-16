import { useState } from "react";
import { BellRing, Check } from "lucide-react";
import Topbar from "../components/Topbar";
import Card from "../components/Card";
import SeverityBadge from "../components/SeverityBadge";
import { alerts as initialAlerts } from "../data/mockData";

const FILTERS = ["all", "critical", "high", "medium", "low"];

export default function Alerts() {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [filter, setFilter] = useState("all");

  const filtered = alerts.filter((a) => filter === "all" || a.severity === filter);
  const openCount = alerts.filter((a) => !a.ack).length;

  function acknowledge(id) {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, ack: true } : a)));
  }

  return (
    <div>
      <Topbar title="Alerts" subtitle={`${openCount} unacknowledged alert${openCount === 1 ? "" : "s"} awaiting review.`} />

      <div className="px-8 py-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium font-mono uppercase tracking-wide transition-colors ${
                filter === f ? "bg-orange-500 text-white" : "bg-surface text-ink-soft hover:bg-orange-50 hover:text-orange-600"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <Card>
          <ul className="divide-y divide-line">
            {filtered.map((a) => (
              <li key={a.id} className="flex items-start justify-between gap-4 px-5 py-4">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${a.ack ? "bg-surface-2" : "bg-orange-50"}`}>
                    <BellRing className={`h-4 w-4 ${a.ack ? "text-ink-faint" : "text-orange-500"}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-ink">{a.title}</p>
                      {!a.ack && <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />}
                    </div>
                    <p className="mt-0.5 font-mono text-[11px] text-ink-faint">{a.id} · {a.source} · {a.time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <SeverityBadge severity={a.severity} />
                  {a.ack ? (
                    <span className="flex items-center gap-1 text-xs text-ink-faint"><Check className="h-3.5 w-3.5" /> Acknowledged</span>
                  ) : (
                    <button
                      onClick={() => acknowledge(a.id)}
                      className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink-soft hover:border-orange-300 hover:text-orange-600"
                    >
                      Acknowledge
                    </button>
                  )}
                </div>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-5 py-10 text-center text-sm text-ink-faint">No alerts match this filter.</li>
            )}
          </ul>
        </Card>
      </div>
    </div>
  );
}
