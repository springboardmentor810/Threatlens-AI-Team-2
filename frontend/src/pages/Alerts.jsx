import { useEffect, useMemo, useState } from "react";
import { BellRing, Check, RefreshCw } from "lucide-react";
import Topbar from "../components/Topbar";
import Card from "../components/Card";
import SeverityBadge from "../components/SeverityBadge";
import { acknowledgeAlert, getAlerts } from "../api/api";

const FILTERS = ["all", "critical", "high", "medium", "low"];

function formatAlert(alert) {
  const createdAt = alert.created_at ? new Date(alert.created_at) : new Date();

  const severity = String(alert.severity || "low").toLowerCase();

  return {
    id: alert.id,
    displayId: `ALT-${alert.id}`,
    fileId: alert.file_id,
    severity,
    title:
      severity === "high"
        ? "Malicious threat detected"
        : "Suspicious threat detected",
    message: alert.message || "Security threat detected.",
    source: alert.source || "Unknown file",
    ack: Boolean(alert.acknowledged),
    time: createdAt.toLocaleString(),
    timestamp: createdAt.getTime(),
  };
}

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [acknowledgingId, setAcknowledgingId] = useState(null);

  async function loadAlerts() {
    try {
      setLoading(true);
      setError("");

      const data = await getAlerts();

      const formattedAlerts = Array.isArray(data)
        ? data.map(formatAlert)
        : [];

      setAlerts(formattedAlerts);
    } catch (err) {
      setError(err.message || "Failed to load alerts.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAlerts();
  }, []);

  const filtered = useMemo(() => {
    return alerts.filter(
      (alert) => filter === "all" || alert.severity === filter
    );
  }, [alerts, filter]);

  const openCount = alerts.filter((alert) => !alert.ack).length;

  async function acknowledge(id) {
    try {
      setAcknowledgingId(id);

      await acknowledgeAlert(id);

      setAlerts((prev) =>
        prev.map((alert) =>
          alert.id === id ? { ...alert, ack: true } : alert
        )
      );
    } catch (err) {
      setError(err.message || "Failed to acknowledge alert.");
    } finally {
      setAcknowledgingId(null);
    }
  }

  return (
    <div>
      <Topbar
        title="Alerts"
        subtitle={`${openCount} unacknowledged alert${
          openCount === 1 ? "" : "s"
        } awaiting review.`}
      />

      <div className="space-y-6">
        {/* Filters */}
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setFilter(item)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition ${
                    filter === item
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={loadAlerts}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>
        </Card>

        {/* Error */}
        {error && (
          <Card>
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-red-600">{error}</p>

              <button
                type="button"
                onClick={loadAlerts}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Retry
              </button>
            </div>
          </Card>
        )}

        {/* Loading */}
        {loading && (
          <Card>
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <RefreshCw size={18} className="animate-spin" />
                Loading alerts...
              </div>
            </div>
          </Card>
        )}

        {/* Alerts */}
        {!loading && !error && filtered.length === 0 && (
          <Card>
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <BellRing size={40} className="mb-4 text-slate-300" />

              <h3 className="text-base font-semibold text-slate-800">
                No alerts found
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                There are no alerts matching the selected filter.
              </p>
            </div>
          </Card>
        )}

        {!loading && filtered.length > 0 && (
          <div className="space-y-4">
            {filtered.map((alert) => (
              <Card key={alert.id}>
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex min-w-0 items-start gap-4">
                    <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                      <BellRing size={19} className="text-slate-600" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900">
                          {alert.title}
                        </p>

                        <SeverityBadge severity={alert.severity} />
                      </div>

                      <p className="mt-1 text-sm text-slate-600">
                        {alert.message}
                      </p>

                      <p className="mt-2 text-xs text-slate-500">
                        {alert.displayId} · {alert.source} · {alert.time}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {alert.ack ? (
                      <div className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600">
                        <Check size={16} />
                        Acknowledged
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => acknowledge(alert.id)}
                        disabled={acknowledgingId === alert.id}
                        className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {acknowledgingId === alert.id ? (
                          <>
                            <RefreshCw size={16} className="animate-spin" />
                            Acknowledging...
                          </>
                        ) : (
                          <>
                            <Check size={16} />
                            Acknowledge
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}