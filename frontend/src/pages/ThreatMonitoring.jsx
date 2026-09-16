import { useEffect, useMemo, useState } from "react";
import { Activity, RefreshCw } from "lucide-react";
import Topbar from "../components/Topbar";
import Card, { CardHeader } from "../components/Card";
import SeverityBadge from "../components/SeverityBadge";
import { getAlerts } from "../api/api";
import { useScans } from "../context/ScanContext";

function formatTime(dateValue) {
  if (!dateValue) return "—";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function formatRelativeTime(dateValue) {
  if (!dateValue) return "—";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return "—";

  const difference = Date.now() - date.getTime();

  if (difference < 0) return "just now";

  const minutes = Math.floor(difference / 60000);

  if (minutes < 1) return "just now";
  if (minutes === 1) return "1 min ago";

  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours === 1) return "1 hr ago";

  if (hours < 24) {
    return `${hours} hrs ago`;
  }

  const days = Math.floor(hours / 24);

  if (days === 1) return "1 day ago";

  return `${days} days ago`;
}

function getAlertEvent(alert) {
  const message = alert.message || "";

  if (message.includes("YARA rule matched")) {
    const yaraMatch = message.match(
      /YARA rule matched:\s*(.+)/
    );

    return {
      event: "YARA match",
      result: yaraMatch?.[1] || "YARA rule matched",
      status: "critical",
    };
  }

  if (
    message.toLowerCase().includes(
      "malware signature detected"
    )
  ) {
    const signatureMatch = message.match(
      /Known malware signature detected:\s*(.+?)(?:;|$)/i
    );

    return {
      event: "Signature match",
      result:
        signatureMatch?.[1] ||
        "Known malware signature detected",
      status: "critical",
    };
  }

  return {
    event: "Threat alert generated",
    result: alert.severity || "Threat detected",
    status:
      String(alert.severity || "").toUpperCase() === "HIGH"
        ? "critical"
        : "medium",
  };
}

function getScanEvent(scan) {
  const verdict = String(
    scan.verdict || ""
  ).toUpperCase();

  if (verdict === "MALICIOUS") {
    return {
      event: "Malware detection completed",
      result: `Malicious · Risk ${scan.risk}/100`,
      status: "critical",
    };
  }

  if (verdict === "SUSPICIOUS") {
    return {
      event: "Static scan completed",
      result: `Suspicious · Risk ${scan.risk}/100`,
      status: "medium",
    };
  }

  return {
    event: "Static scan completed",
    result: "Clean",
    status: "normal",
  };
}

export default function ThreatMonitoring() {
  const {
    scans,
    historyLoading,
    historyError,
  } = useScans();

  const [alerts, setAlerts] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [alertsError, setAlertsError] = useState("");

  async function loadAlerts() {
    try {
      setAlertsLoading(true);
      setAlertsError("");

      const data = await getAlerts();

      setAlerts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(
        "Failed to load threat monitoring alerts:",
        error
      );

      setAlertsError(
        error.message || "Failed to load alerts."
      );

      setAlerts([]);
    } finally {
      setAlertsLoading(false);
    }
  }

  useEffect(() => {
    loadAlerts();
  }, []);

  /*
   * Detection Log
   *
   * Combines:
   * 1. Real scan history
   * 2. Real alert records
   *
   * This represents historical detection activity,
   * so repeated events are intentionally allowed here.
   */
  const detectionLogs = useMemo(() => {
    const logs = [];

    scans.forEach((scan) => {
      if (!scan.timestamp) return;

      const scanEvent = getScanEvent(scan);

      logs.push({
        id: `scan-${scan.analysisId || scan.id}`,
        timestamp: scan.timestamp,
        time: formatTime(scan.timestamp),
        event: scanEvent.event,
        target: scan.file || "Unknown file",
        result: scanEvent.result,
        status: scanEvent.status,
      });
    });

    alerts.forEach((alert) => {
      if (!alert.created_at) return;

      const alertEvent = getAlertEvent(alert);

      logs.push({
        id: `alert-${alert.id}`,
        timestamp: new Date(
          alert.created_at
        ).getTime(),
        time: formatTime(alert.created_at),
        event: alertEvent.event,
        target: alert.source || "Unknown file",
        result: alertEvent.result,
        status: alertEvent.status,
      });
    });

    return logs
      .filter(
        (log) => !Number.isNaN(log.timestamp)
      )
      .sort(
        (a, b) => b.timestamp - a.timestamp
      )
      .slice(0, 20);
  }, [scans, alerts]);

  /*
   * Active Threats
   *
   * A file is considered an active threat only when:
   *
   * 1. It has an unacknowledged alert
   * 2. Its LATEST scan is still SUSPICIOUS or MALICIOUS
   *
   * This prevents an old YARA alert from making a file
   * appear as an active threat after a later clean scan.
   */
  const activeThreats = useMemo(() => {
    /*
     * Get the latest scan for every file.
     */
    const latestScanByFile = new Map();

    scans.forEach((scan) => {
      if (!scan.fileId) return;

      const existing = latestScanByFile.get(
        scan.fileId
      );

      if (
        !existing ||
        Number(scan.timestamp || 0) >
          Number(existing.timestamp || 0)
      ) {
        latestScanByFile.set(
          scan.fileId,
          scan
        );
      }
    });

    /*
     * Only alerts that have not been acknowledged
     * can represent an active unresolved alert.
     */
    const unacknowledgedAlerts = alerts.filter(
      (alert) => !alert.acknowledged
    );

    /*
     * Keep only the newest alert for each file.
     */
    const latestAlertByFile = new Map();

    unacknowledgedAlerts.forEach((alert) => {
      const fileKey =
        alert.file_id ??
        alert.source ??
        alert.id;

      const existing =
        latestAlertByFile.get(fileKey);

      if (!existing) {
        latestAlertByFile.set(
          fileKey,
          alert
        );
        return;
      }

      const existingTime = new Date(
        existing.created_at
      ).getTime();

      const currentTime = new Date(
        alert.created_at
      ).getTime();

      if (currentTime > existingTime) {
        latestAlertByFile.set(
          fileKey,
          alert
        );
      }
    });

    const active = [];

    latestAlertByFile.forEach((alert) => {
      const latestScan =
        latestScanByFile.get(alert.file_id);

      /*
       * If we don't have a corresponding scan,
       * don't assume that it is an active threat.
       */
      if (!latestScan) return;

      const verdict = String(
        latestScan.verdict || ""
      ).toUpperCase();

      /*
       * CLEAN files are NOT active threats,
       * even if they have old unacknowledged alerts.
       */
      if (
        verdict !== "MALICIOUS" &&
        verdict !== "SUSPICIOUS"
      ) {
        return;
      }

      active.push({
        ...alert,
        currentVerdict:
          latestScan.verdict,
        currentRisk:
          latestScan.risk ?? 0,
        currentTimestamp:
          latestScan.timestamp,
      });
    });

    return active
      .sort(
        (a, b) =>
          new Date(
            b.created_at
          ).getTime() -
          new Date(
            a.created_at
          ).getTime()
      )
      .slice(0, 10);
  }, [alerts, scans]);

  const monitoringLoading =
    historyLoading || alertsLoading;

  return (
    <div>
      <Topbar
        title="Threat Monitoring"
        subtitle="Live detection logs, active threats, and incident tracking."
      />

      <div className="grid grid-cols-1 gap-6 px-8 py-6 xl:grid-cols-5">
        {/* Detection Log */}
        <Card className="xl:col-span-3">
          <CardHeader
            eyebrow="Live"
            title="Detection log"
            action={
              <span className="flex items-center gap-1.5 font-mono text-[11px] text-orange-500 blink-cursor">
                streaming
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-orange-400" />
              </span>
            }
          />

          {historyError && (
            <div className="border-b border-line px-5 py-3 text-sm text-ink-soft">
              Unable to load scan history:{" "}
              {historyError}
            </div>
          )}

          {alertsError && (
            <div className="border-b border-line px-5 py-3 text-sm text-ink-soft">
              Unable to load alerts:{" "}
              {alertsError}
            </div>
          )}

          {monitoringLoading ? (
            <div className="flex items-center justify-center py-12 text-sm text-ink-faint">
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Loading detection activity...
            </div>
          ) : detectionLogs.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-ink-faint">
              No detection activity available yet.
            </div>
          ) : (
            <div className="max-h-[420px] overflow-y-auto">
              <table className="w-full text-left text-sm">
                <tbody>
                  {detectionLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b border-line last:border-0"
                    >
                      <td className="w-24 px-5 py-3 font-mono text-xs text-ink-faint">
                        {log.time}
                      </td>

                      <td className="px-5 py-3">
                        <p className="text-ink">
                          {log.event}
                        </p>

                        <p className="font-mono text-[11px] text-ink-soft">
                          {log.target}
                        </p>
                      </td>

                      <td className="px-5 py-3 text-right text-ink-soft">
                        {log.result}
                      </td>

                      <td className="w-8 px-4 py-3 text-right">
                        <span
                          className={`inline-block h-2 w-2 rounded-full ${
                            log.status === "critical"
                              ? "bg-orange-500"
                              : log.status === "medium"
                                ? "bg-orange-300"
                                : "bg-line-strong"
                          }`}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Active Threats */}
        <Card className="xl:col-span-2">
          <CardHeader
            eyebrow="Tracking"
            title="Active threats"
          />

          {monitoringLoading ? (
            <div className="flex items-center justify-center py-12 text-sm text-ink-faint">
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Loading active threats...
            </div>
          ) : activeThreats.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-ink-faint">
              No active threats.
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {activeThreats.map((alert) => {
                const severity =
                  String(
                    alert.severity || "medium"
                  ).toLowerCase();

                return (
                  <li
                    key={alert.id}
                    className="flex items-start justify-between gap-3 px-5 py-4"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink">
                        {alert.source ||
                          "Unknown file"}
                      </p>

                      <p className="mt-0.5 text-xs text-ink-soft">
                        {alert.currentVerdict}{" "}
                        threat · Risk{" "}
                        {alert.currentRisk}/100
                      </p>

                      <p className="mt-1 flex items-center gap-1 font-mono text-[11px] text-ink-faint">
                        <Activity className="h-3 w-3" />
                        {formatRelativeTime(
                          alert.currentTimestamp ||
                            alert.created_at
                        )}
                      </p>
                    </div>

                    <SeverityBadge
                      severity={severity}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}