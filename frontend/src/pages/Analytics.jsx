import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import { RefreshCw } from "lucide-react";

import Topbar from "../components/Topbar";
import Card, { CardHeader } from "../components/Card";
import StatCard from "../components/StatCard";
import { getAnalysis } from "../api/api";
import { useScans } from "../context/ScanContext";

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-lg border border-line bg-paper px-3 py-2 shadow-sm">
      <p className="font-mono text-[11px] text-ink-faint">
        {label}
      </p>

      {payload.map((item) => (
        <p
          key={item.dataKey}
          className="font-mono text-xs text-ink"
        >
          {item.name}:{" "}
          <span className="font-semibold">
            {item.value}
          </span>
        </p>
      ))}
    </div>
  );
}

function formatDay(dateValue) {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

function normalizePrediction(value) {
  const prediction = String(value || "")
    .trim()
    .toLowerCase();

  if (prediction === "malware") {
    return "Malware";
  }

  if (prediction === "benign") {
    return "Benign";
  }

  return value || "Unknown";
}

function getRisk(scan) {
  const risk = Number(scan?.risk || 0);

  return Math.max(
    0,
    Math.min(100, Number.isNaN(risk) ? 0 : risk)
  );
}

export default function Analytics() {
  const {
    scans,
    historyLoading,
    historyError,
    refreshHistory,
  } = useScans();

  const [detailedAnalyses, setDetailedAnalyses] =
    useState([]);

  const [mlLoading, setMlLoading] =
    useState(false);

  const [mlError, setMlError] =
    useState("");

  /*
   * Load detailed analysis for every unique file.
   *
   * /analysis/history gives us the summary information.
   * malware_family is stored inside the detailed analysis,
   * so we fetch /analysis/{file_id} when building ML statistics.
   */
  useEffect(() => {
    let cancelled = false;

    async function loadDetailedAnalyses() {
      if (historyLoading) {
        return;
      }

      if (!scans.length) {
        setDetailedAnalyses([]);
        setMlLoading(false);
        setMlError("");
        return;
      }

      try {
        setMlLoading(true);
        setMlError("");

        const uniqueScans = [];
        const seenFileIds = new Set();

        scans.forEach((scan) => {
          if (!scan.fileId) {
            return;
          }

          if (seenFileIds.has(scan.fileId)) {
            return;
          }

          seenFileIds.add(scan.fileId);
          uniqueScans.push(scan);
        });

        const results = await Promise.all(
          uniqueScans.map(async (scan) => {
            try {
              const response = await getAnalysis(
                scan.fileId
              );

              const analysisResult =
                response?.result || response;

              return {
                ...scan,
                analysis: response,
                mlAnalysis:
                  analysisResult?.ml_analysis ||
                  null,
              };
            } catch (error) {
              console.error(
                `Failed to load analysis for file ${scan.fileId}:`,
                error
              );

              return {
                ...scan,
                analysis: null,
                mlAnalysis: null,
              };
            }
          })
        );

        if (!cancelled) {
          setDetailedAnalyses(results);

          /*
           * A detailed request failure is handled per file.
           * We therefore don't show a global error if the
           * remaining ML data loaded successfully.
           */
          const successfulResults = results.filter(
            (item) => item.mlAnalysis
          );

          if (
            successfulResults.length === 0 &&
            results.length > 0
          ) {
            setMlError(
              "No detailed ML results are available for the stored analyses."
            );
          }
        }
      } catch (error) {
        console.error(
          "Failed to load detailed ML analyses:",
          error
        );

        if (!cancelled) {
          setMlError(
            error.message ||
              "Failed to load detailed ML analysis."
          );
          setDetailedAnalyses([]);
        }
      } finally {
        if (!cancelled) {
          setMlLoading(false);
        }
      }
    }

    loadDetailedAnalyses();

    return () => {
      cancelled = true;
    };
  }, [scans, historyLoading]);

  /*
   * Basic statistics from real backend analysis history.
   */
  const totalScans = scans.length;

  const maliciousCount = scans.filter(
    (scan) =>
      String(scan.verdict || "").toUpperCase() ===
      "MALICIOUS"
  ).length;

  const suspiciousCount = scans.filter(
    (scan) =>
      String(scan.verdict || "").toUpperCase() ===
      "SUSPICIOUS"
  ).length;

  const threatCount =
    maliciousCount + suspiciousCount;

  const averageRisk =
    totalScans > 0
      ? Math.round(
          scans.reduce(
            (sum, scan) =>
              sum + getRisk(scan),
            0
          ) / totalScans
        )
      : 0;

  const highRiskCount = scans.filter(
    (scan) => getRisk(scan) >= 51
  ).length;

  /*
   * Real threat detection trend.
   *
   * A threat is a MALICIOUS or SUSPICIOUS backend verdict.
   */
  const detectionTrend = useMemo(() => {
    const grouped = {};

    scans.forEach((scan) => {
      const date = new Date(scan.scannedAt);

      if (Number.isNaN(date.getTime())) {
        return;
      }

      const dayKey =
        date.toISOString().slice(0, 10);

      if (!grouped[dayKey]) {
        grouped[dayKey] = {
          day: formatDay(scan.scannedAt),
          threats: 0,
        };
      }

      const verdict = String(
        scan.verdict || ""
      ).toUpperCase();

      if (
        verdict === "MALICIOUS" ||
        verdict === "SUSPICIOUS"
      ) {
        grouped[dayKey].threats += 1;
      }
    });

    return Object.entries(grouped)
      .sort(([a], [b]) =>
        a.localeCompare(b)
      )
      .slice(-30)
      .map(([, value]) => value);
  }, [scans]);

  /*
   * Real risk score distribution.
   */
  /*
 * Real risk score distribution.
 */
const riskDistribution = useMemo(
  () => [
    {
      label: "Low",
      count: scans.filter(
        (scan) => getRisk(scan) >= 0 && getRisk(scan) < 20
      ).length,
    },
    {
      label: "Medium",
      count: scans.filter(
        (scan) => {
          const risk = getRisk(scan);
          return risk >= 20 && risk < 50;
        }
      ).length,
    },
    {
      label: "High",
      count: scans.filter(
        (scan) => getRisk(scan) >= 50
      ).length,
    },
  ],
  [scans]
);

  /*
   * Real malware-family statistics from ML.
   */
  const malwareFamilies = useMemo(() => {
    const familyCounts = {};

    detailedAnalyses.forEach((item) => {
      const ml = item.mlAnalysis;

      if (!ml) {
        return;
      }

      const prediction = normalizePrediction(
        ml.prediction
      );

      if (prediction !== "Malware") {
        return;
      }

      if (!ml.malware_family) {
        return;
      }

      const family = String(
        ml.malware_family
      ).trim();

      if (!family) {
        return;
      }

      familyCounts[family] =
        (familyCounts[family] || 0) + 1;
    });

    return Object.entries(familyCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([name, value]) => ({
        name,
        value,
      }));
  }, [detailedAnalyses]);

  /*
   * Real ML classification totals.
   */
  const mlMalwareCount = useMemo(
    () =>
      detailedAnalyses.filter(
        (item) =>
          normalizePrediction(
            item.mlAnalysis?.prediction
          ) === "Malware"
      ).length,
    [detailedAnalyses]
  );

  const mlBenignCount = useMemo(
    () =>
      detailedAnalyses.filter(
        (item) =>
          normalizePrediction(
            item.mlAnalysis?.prediction
          ) === "Benign"
      ).length,
    [detailedAnalyses]
  );

  return (
    <div>
      <Topbar
        title="Analytics"
        subtitle="Malware statistics, detection performance, and threat trend reporting."
      />

      <div className="space-y-6 px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-widest text-orange-500">
              Live analysis data
            </p>

            <p className="mt-1 text-sm text-ink-soft">
              Statistics calculated from stored backend analyses and ML results.
            </p>
          </div>

          <button
            type="button"
            onClick={refreshHistory}
            disabled={historyLoading}
            className="flex items-center gap-2 rounded-lg border border-line bg-paper px-4 py-2 text-sm font-semibold text-ink hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                historyLoading
                  ? "animate-spin"
                  : ""
              }`}
            />

            Refresh
          </button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <StatCard
            label="Files analyzed"
            value={String(totalScans)}
          />

          <StatCard
            label="Threats detected"
            value={String(threatCount)}
          />

          <StatCard
            label="Average risk"
            value={`${averageRisk}/100`}
          />

          <StatCard
            label="High-risk files"
            value={String(highRiskCount)}
          />
        </div>

        {/* History loading */}
        {historyLoading && (
          <Card>
            <div className="flex items-center justify-center py-10 text-sm text-ink-faint">
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Loading analytics...
            </div>
          </Card>
        )}

        {/* History error */}
        {historyError &&
          !historyLoading && (
            <Card>
              <div className="px-5 py-8 text-center text-sm text-ink-soft">
                {historyError}
              </div>
            </Card>
          )}

        {!historyLoading &&
          !historyError && (
            <>
              {/* Trend + Malware Families */}
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                {/* Threat Trend */}
                <Card>
                  <CardHeader
                    eyebrow="Trend"
                    title="Threat detection trend"
                  />

                  <div className="h-64 px-4 pb-4 pt-6">
                    {detectionTrend.length ===
                    0 ? (
                      <div className="flex h-full items-center justify-center text-sm text-ink-faint">
                        No threat history available.
                      </div>
                    ) : (
                      <ResponsiveContainer
                        width="100%"
                        height="100%"
                      >
                        <LineChart
                          data={detectionTrend}
                        >
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
                              fontFamily:
                                "JetBrains Mono",
                            }}
                          />

                          <YAxis
                            allowDecimals={false}
                            tickLine={false}
                            axisLine={false}
                            tick={{
                              fontSize: 11,
                              fill: "#a2a3ab",
                              fontFamily:
                                "JetBrains Mono",
                            }}
                            width={28}
                          />

                          <Tooltip
                            content={
                              <ChartTooltip />
                            }
                          />

                          <Line
                            type="monotone"
                            dataKey="threats"
                            name="Threats"
                            stroke="#ff5e1a"
                            strokeWidth={2.5}
                            dot={{
                              r: 3,
                              fill: "#ff5e1a",
                            }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </Card>

                {/* Malware Families */}
                <Card>
                  <CardHeader
                    eyebrow="ML Breakdown"
                    title="Malware families"
                  />

                  <div className="h-64 px-4 pb-4 pt-6">
                    {mlLoading ? (
                      <div className="flex h-full items-center justify-center text-sm text-ink-faint">
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Loading ML family data...
                      </div>
                    ) : mlError ? (
                      <div className="flex h-full items-center justify-center px-6 text-center text-sm text-ink-soft">
                        {mlError}
                      </div>
                    ) : malwareFamilies.length ===
                      0 ? (
                      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                        <p className="text-sm font-medium text-ink">
                          No malware families detected
                        </p>

                        <p className="mt-2 text-xs leading-relaxed text-ink-faint">
                          No stored ML result currently contains a malware family classification.
                        </p>
                      </div>
                    ) : (
                      <ResponsiveContainer
                        width="100%"
                        height="100%"
                      >
                        <BarChart
                          data={malwareFamilies}
                          layout="vertical"
                          margin={{
                            left: 8,
                            right: 16,
                          }}
                        >
                          <CartesianGrid
                            horizontal={false}
                            stroke="#e7e6e3"
                          />

                          <XAxis
                            type="number"
                            allowDecimals={false}
                            tickLine={false}
                            axisLine={false}
                            tick={{
                              fontSize: 11,
                              fill: "#a2a3ab",
                              fontFamily:
                                "JetBrains Mono",
                            }}
                          />

                          <YAxis
                            type="category"
                            dataKey="name"
                            tickLine={false}
                            axisLine={false}
                            width={90}
                            tick={{
                              fontSize: 12,
                              fill: "#15161a",
                            }}
                          />

                          <Tooltip
                            content={
                              <ChartTooltip />
                            }
                            cursor={{
                              fill: "#fff5ee",
                            }}
                          />

                          <Bar
                            dataKey="value"
                            name="Samples"
                            radius={[
                              0,
                              6,
                              6,
                              0,
                            ]}
                            fill="#ff5e1a"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </Card>
              </div>

              {/* Risk Distribution */}
              <Card>
                <CardHeader
                  eyebrow="Distribution"
                  title="Risk score bands"
                />

                <div className="h-56 px-4 pb-4 pt-6">
                  {totalScans === 0 ? (
                    <div className="flex h-full items-center justify-center text-sm text-ink-faint">
                      No analysis records available.
                    </div>
                  ) : (
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >
                      <BarChart
                        data={riskDistribution}
                        barCategoryGap={30}
                      >
                        <CartesianGrid
                          vertical={false}
                          stroke="#e7e6e3"
                        />

                        <XAxis
                          dataKey="label"
                          tickLine={false}
                          axisLine={false}
                          tick={{
                            fontSize: 11,
                            fill: "#a2a3ab",
                            fontFamily:
                              "JetBrains Mono",
                          }}
                        />

                        <YAxis
                          allowDecimals={false}
                          tickLine={false}
                          axisLine={false}
                          tick={{
                            fontSize: 11,
                            fill: "#a2a3ab",
                            fontFamily:
                              "JetBrains Mono",
                          }}
                          width={28}
                        />

                        <Tooltip
                          content={
                            <ChartTooltip />
                          }
                          cursor={{
                            fill: "#fff5ee",
                          }}
                        />

                        <Bar
                          dataKey="count"
                          name="Files"
                          radius={[
                            6,
                            6,
                            0,
                            0,
                          ]}
                          fill="#ffab6b"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </Card>

              {/* ML Summary */}
              <Card>
                <CardHeader
                  eyebrow="Machine learning"
                  title="Classification summary"
                />

                <div className="grid grid-cols-1 divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                  <div className="p-5">
                    <p className="font-mono text-xs text-orange-500">
                      Malware
                    </p>

                    <p className="mt-1.5 text-2xl font-semibold text-ink">
                      {mlMalwareCount}
                    </p>

                    <p className="mt-1 text-xs text-ink-faint">
                      Files classified as malware
                    </p>
                  </div>

                  <div className="p-5">
                    <p className="font-mono text-xs text-orange-500">
                      Benign
                    </p>

                    <p className="mt-1.5 text-2xl font-semibold text-ink">
                      {mlBenignCount}
                    </p>

                    <p className="mt-1 text-xs text-ink-faint">
                      Files classified as benign
                    </p>
                  </div>

                  <div className="p-5">
                    <p className="font-mono text-xs text-orange-500">
                      Families
                    </p>

                    <p className="mt-1.5 text-2xl font-semibold text-ink">
                      {malwareFamilies.length}
                    </p>

                    <p className="mt-1 text-xs text-ink-faint">
                      Distinct malware families detected
                    </p>
                  </div>
                </div>
              </Card>

              {/* Data Source */}
              <Card>
                <CardHeader
                  eyebrow="Data source"
                  title="Analytics coverage"
                />

                <div className="grid grid-cols-1 divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                  <div className="p-5">
                    <p className="font-mono text-xs text-orange-500">
                      Source
                    </p>

                    <p className="mt-1.5 text-sm text-ink">
                      Backend analysis history
                    </p>
                  </div>

                  <div className="p-5">
                    <p className="font-mono text-xs text-orange-500">
                      Records
                    </p>

                    <p className="mt-1.5 text-sm text-ink">
                      {totalScans} analyzed files
                    </p>
                  </div>

                  <div className="p-5">
                    <p className="font-mono text-xs text-orange-500">
                      Risk calculation
                    </p>

                    <p className="mt-1.5 text-sm text-ink">
                      Backend risk score, 0–100
                    </p>
                  </div>
                </div>
              </Card>
            </>
          )}
      </div>
    </div>
  );
}