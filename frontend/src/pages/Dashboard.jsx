import { useEffect, useState } from "react";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import Topbar from "../components/Topbar";
import StatCard from "../components/StatCard";
import Card, { CardHeader } from "../components/Card";
import SeverityBadge from "../components/SeverityBadge";
import { useAuth } from "../context/AuthContext";
import { useScans } from "../context/ScanContext";
import { getAlerts } from "../api/api";

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-line bg-paper px-3 py-2 shadow-sm">
      <p className="font-mono text-[11px] text-ink-faint">{label}</p>

      {payload.map((p) => (
        <p key={p.dataKey} className="font-mono text-xs text-ink">
          {p.name}:{" "}
          <span className="font-semibold">
            {p.value}
          </span>
        </p>
      ))}
    </div>
  );
}

function getStartOfDay(date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function getRiskDistribution(scans) {
  return [
    {
      band: "0–19",
      label: "Low",
      count: scans.filter(
        (scan) => scan.risk >= 0 && scan.risk < 20
      ).length,
    },
    {
      band: "20–49",
      label: "Medium",
      count: scans.filter(
        (scan) => scan.risk >= 20 && scan.risk < 50
      ).length,
    },
    {
      band: "50–100",
      label: "High",
      count: scans.filter(
        (scan) => scan.risk >= 50 && scan.risk <= 100
      ).length,
    },
  ];
}

function getDetectionTrend(scans) {
  const today = getStartOfDay(new Date());

  const days = [];

  for (let i = 6; i >= 0; i -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);

    days.push({
      date,
      day: date.toLocaleDateString("en-US", {
        weekday: "short",
      }),
      scans: 0,
      threats: 0,
    });
  }

  scans.forEach((scan) => {
    if (!scan.timestamp) return;

    const scanDate = getStartOfDay(new Date(scan.timestamp));

    const matchingDay = days.find(
      (day) => day.date.getTime() === scanDate.getTime()
    );

    if (!matchingDay) return;

    matchingDay.scans += 1;

    if (
      scan.verdict === "MALICIOUS" ||
      scan.verdict === "SUSPICIOUS"
    ) {
      matchingDay.threats += 1;
    }
  });

  return days.map(({ date, day, scans: scanCount, threats }) => ({
    day,
    scans: scanCount,
    threats,
  }));
}

function getLast24HoursCount(scans) {
  const now = Date.now();
  const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;

  return scans.filter(
    (scan) =>
      scan.timestamp &&
      scan.timestamp >= twentyFourHoursAgo &&
      scan.timestamp <= now
  ).length;
}

function getThreatCount(scans) {
  return scans.filter(
    (scan) =>
      scan.verdict === "MALICIOUS" ||
      scan.verdict === "SUSPICIOUS"
  ).length;
}

function getAverageRisk(scans) {
  if (!scans.length) return 0;

  const total = scans.reduce(
    (sum, scan) => sum + Number(scan.risk || 0),
    0
  );

  return Math.round(total / scans.length);
}

export default function Dashboard() {
  const { user } = useAuth();

  const {
    scans,
    historyLoading,
    historyError,
    loadHistory,
  } = useScans();

  const [alerts, setAlerts] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(true);

  useEffect(() => {
    async function loadAlerts() {
      try {
        setAlertsLoading(true);

        const data = await getAlerts();

        setAlerts(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(
          "Failed to load dashboard alerts:",
          error
        );

        setAlerts([]);
      } finally {
        setAlertsLoading(false);
      }
    }

    loadAlerts();
  }, []);

  const recentScans = scans.slice(0, 7);

  const filesScanned24h = getLast24HoursCount(scans);
  const threatsDetected = getThreatCount(scans);
  const averageRisk = getAverageRisk(scans);

  const openAlerts = alerts.filter(
    (alert) => !alert.acknowledged
  ).length;

  const detectionTrend = getDetectionTrend(scans);
  const riskDistribution = getRiskDistribution(scans);

  return (
    <div>
      <Topbar
        title="Dashboard"
        subtitle={`Welcome back, ${
          user?.name?.split(" ")[0] ?? "analyst"
        }. Here's the state of the fleet.`}
      />

      <div className="space-y-6 px-8 py-6">
        {historyError && (
          <div className="flex items-center justify-between rounded-lg border border-line bg-paper px-4 py-3 text-sm">
            <span className="text-ink-soft">
              Unable to load scan history: {historyError}
            </span>

            <button
              type="button"
              onClick={loadHistory}
              className="font-medium text-ink underline underline-offset-4"
            >
              Retry
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Files scanned (24h)"
            value={
              historyLoading
                ? "—"
                : String(filesScanned24h)
            }
            delta=""
            trend="up"
          />

          <StatCard
            label="Threats detected"
            value={
              historyLoading
                ? "—"
                : String(threatsDetected)
            }
            delta=""
            trend="up"
          />

          <StatCard
            label="Avg. risk score"
            value={
              historyLoading
                ? "—"
                : `${averageRisk} / 100`
            }
            delta=""
            trend="down"
          />

          <StatCard
            label="Open alerts"
            value={
              alertsLoading
                ? "—"
                : String(openAlerts)
            }
            delta=""
            trend="down"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
          <Card className="xl:col-span-3">
            <CardHeader
              eyebrow="Last 7 days"
              title="Scans vs. threats detected"
            />

            <div className="h-64 px-4 pb-4 pt-6">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <AreaChart data={detectionTrend}>
                  <defs>
                    <linearGradient
                      id="scans"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#ffab6b"
                        stopOpacity={0.4}
                      />

                      <stop
                        offset="100%"
                        stopColor="#ffab6b"
                        stopOpacity={0}
                      />
                    </linearGradient>

                    <linearGradient
                      id="threats"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#ff5e1a"
                        stopOpacity={0.55}
                      />

                      <stop
                        offset="100%"
                        stopColor="#ff5e1a"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    vertical={false}
                    stroke="#e7e6e3"
                  />

                  <XAxis
                    dataKey="day"
                    tickLine={false}
                    axisLine={false}
                    tick={{
                      fontSize: 11,
                      fill: "#a2a3ab",
                      fontFamily: "JetBrains Mono",
                    }}
                  />

                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{
                      fontSize: 11,
                      fill: "#a2a3ab",
                      fontFamily: "JetBrains Mono",
                    }}
                    width={28}
                  />

                  <Tooltip
                    content={<ChartTooltip />}
                  />

                  <Area
                    type="monotone"
                    dataKey="scans"
                    name="Scans"
                    stroke="#ffab6b"
                    fill="url(#scans)"
                    strokeWidth={2}
                  />

                  <Area
                    type="monotone"
                    dataKey="threats"
                    name="Threats"
                    stroke="#ff5e1a"
                    fill="url(#threats)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="xl:col-span-2">
            <CardHeader
              eyebrow="Distribution"
              title="Risk score bands"
            />

            <div className="h-64 px-4 pb-4 pt-6">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={riskDistribution}
                  barCategoryGap={22}
                >
                  <CartesianGrid
                    vertical={false}
                    stroke="#e7e6e3"
                  />

                  <XAxis
                    dataKey="band"
                    tickLine={false}
                    axisLine={false}
                    tick={{
                      fontSize: 11,
                      fill: "#a2a3ab",
                      fontFamily: "JetBrains Mono",
                    }}
                  />

                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{
                      fontSize: 11,
                      fill: "#a2a3ab",
                      fontFamily: "JetBrains Mono",
                    }}
                    width={28}
                  />

                  <Tooltip
                    content={<ChartTooltip />}
                    cursor={{ fill: "#fff5ee" }}
                  />

                  <Bar
                    dataKey="count"
                    name="Files"
                    radius={[6, 6, 0, 0]}
                    fill="#ff5e1a"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <Card>
          <CardHeader
            eyebrow="Live feed"
            title="Recent scans"
          />

          {historyLoading ? (
            <div className="px-5 py-8 text-center text-sm text-ink-faint">
              Loading scan history...
            </div>
          ) : recentScans.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-ink-faint">
              No scans available yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-[11px] font-mono uppercase tracking-wide text-ink-faint">
                    <th className="px-5 py-3 font-medium">
                      Scan ID
                    </th>

                    <th className="px-5 py-3 font-medium">
                      File
                    </th>

                    <th className="px-5 py-3 font-medium">
                      Verdict
                    </th>

                    <th className="px-5 py-3 font-medium">
                      Risk
                    </th>

                    <th className="px-5 py-3 font-medium">
                      Status
                    </th>

                    <th className="px-5 py-3 font-medium">
                      Analyst
                    </th>

                    <th className="px-5 py-3 font-medium">
                      When
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {recentScans.map((scan) => (
                    <tr
                      key={scan.id}
                      className="border-b border-line last:border-0 hover:bg-surface/60"
                    >
                      <td className="px-5 py-3.5 font-mono text-xs text-ink-soft">
                        {scan.id}
                      </td>

                      <td className="px-5 py-3.5 font-medium text-ink">
                        {scan.file}
                      </td>

                      <td className="px-5 py-3.5 text-ink-soft">
                        {scan.verdict}
                      </td>

                      <td className="px-5 py-3.5 font-mono text-xs text-ink">
                        {scan.risk}/100
                      </td>

                      <td className="px-5 py-3.5">
                        <SeverityBadge severity={scan.status} />
                      </td>

                      <td className="px-5 py-3.5 text-ink-soft">
                        {scan.analyst}
                      </td>

                      <td className="px-5 py-3.5 text-ink-faint">
                        {scan.date}, {scan.time}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}