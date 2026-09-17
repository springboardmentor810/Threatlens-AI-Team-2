import { useEffect, useMemo, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

import Topbar from "../components/Topbar";
import Card, { CardHeader } from "../components/Card";
import SeverityBadge from "../components/SeverityBadge";
import { getAnalysis } from "../api/api";
import { useScans } from "../context/ScanContext";

const ORANGE_SHADES = [
  "#ff5e1a",
  "#ff8a3d",
  "#ffab6b",
  "#ffcda5",
  "#ffe8d8",
  "#c7440a",
];

function getSeverity(risk) {
  const value = Number(risk || 0);

  if (value >= 50) return "high";
  if (value >= 20) return "medium";

  return "low";
}

function formatConfidence(value) {
  if (value === null || value === undefined) {
    return null;
  }

  const number = Number(value);

  if (Number.isNaN(number)) {
    return null;
  }

  /*
   * Backend probabilities are stored between 0 and 1.
   * Convert them to a percentage for display.
   */
  return Math.round(number * 100);
}

function getMlAnalysis(result) {
  if (!result) {
    return null;
  }

  /*
   * Normal backend structure:
   *
   * {
   *   result: {
   *     ml_analysis: {...}
   *   }
   * }
   */
  if (result.ml_analysis) {
    return result.ml_analysis;
  }

  /*
   * Fallback for a wrapped response.
   */
  if (result.result?.ml_analysis) {
    return result.result.ml_analysis;
  }

  return null;
}

function normalizePrediction(value) {
  const prediction = String(value || "").trim().toLowerCase();

  if (prediction === "malware") {
    return "Malware";
  }

  if (prediction === "benign") {
    return "Benign";
  }

  return value || "Unknown";
}

export default function Classification() {
  const { scans, historyLoading } = useScans();

  const [classificationData, setClassificationData] =
    useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadClassificationData() {
      if (historyLoading) {
        return;
      }

      if (!scans.length) {
        setClassificationData([]);
        setLoading(false);
        setError("");
        return;
      }

      try {
        setLoading(true);
        setError("");

        /*
         * Classification page focuses on samples that
         * were detected as suspicious or malicious.
         */
        const classifiedScans = scans.filter((scan) => {
          const verdict = String(
            scan.verdict || ""
          ).toUpperCase();

          return (
            verdict === "MALICIOUS" ||
            verdict === "SUSPICIOUS"
          );
        });

        /*
         * /analysis/history already gives the latest
         * analysis for each file, but this extra guard
         * prevents duplicate requests if the context
         * ever contains duplicate records.
         */
        const uniqueScans = [];
        const seenFiles = new Set();

        classifiedScans.forEach((scan) => {
          if (!scan.fileId) {
            return;
          }

          if (seenFiles.has(scan.fileId)) {
            return;
          }

          seenFiles.add(scan.fileId);
          uniqueScans.push(scan);
        });

        /*
         * The history endpoint does not currently expose
         * malware_family, so fetch the detailed analysis
         * for each classified file.
         */
        const results = await Promise.all(
          uniqueScans.map(async (scan) => {
            try {
              const response = await getAnalysis(
                scan.fileId
              );

              const analysisResult =
                response?.result || response;

              const mlAnalysis =
                getMlAnalysis(analysisResult);

              return {
                ...scan,
                mlAnalysis,
              };
            } catch (err) {
              console.error(
                `Failed to load analysis for file ${scan.fileId}:`,
                err
              );

              return {
                ...scan,
                mlAnalysis: null,
              };
            }
          })
        );

        if (!cancelled) {
          setClassificationData(results);
        }
      } catch (err) {
        console.error(
          "Failed to load classification data:",
          err
        );

        if (!cancelled) {
          setError(
            err.message ||
              "Failed to load classification data."
          );

          setClassificationData([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadClassificationData();

    return () => {
      cancelled = true;
    };
  }, [scans, historyLoading]);

  /*
   * Malware family distribution.
   *
   * Only actual malware predictions with a family
   * returned by the ML family classifier are included.
   */
  const malwareFamilies = useMemo(() => {
    const familyCounts = new Map();

    classificationData.forEach((scan) => {
      const family =
        scan.mlAnalysis?.malware_family;

      const prediction = normalizePrediction(
        scan.mlAnalysis?.prediction
      );

      if (
        !family ||
        prediction !== "Malware"
      ) {
        return;
      }

      const normalizedFamily =
        String(family).trim();

      if (!normalizedFamily) {
        return;
      }

      familyCounts.set(
        normalizedFamily,
        (familyCounts.get(normalizedFamily) || 0) + 1
      );
    });

    return Array.from(
      familyCounts.entries()
    )
      .map(([name, value]) => ({
        name,
        value,
      }))
      .sort((a, b) => b.value - a.value);
  }, [classificationData]);

  /*
   * Classified sample table.
   */
  const classified = useMemo(() => {
    return classificationData.map((scan) => {
      const ml = scan.mlAnalysis;

      const prediction = normalizePrediction(
        ml?.prediction || scan.verdict
      );

      const family =
        ml?.malware_family || null;

      const familyProbability =
        formatConfidence(
          ml?.family_probability
        );

      const malwareProbability =
        ml?.malware_probability;

      /*
       * Confidence:
       *
       * Malware -> malware probability
       * Benign  -> 1 - malware probability
       *
       * The page normally contains suspicious/malicious
       * scans, but this remains mathematically correct
       * if a Benign result appears.
       */
      let confidence = Number(
        scan.risk || 0
      );

      if (
        malwareProbability !== null &&
        malwareProbability !== undefined
      ) {
        const probability =
          Number(malwareProbability);

        if (!Number.isNaN(probability)) {
          confidence =
            prediction === "Malware"
              ? Math.round(probability * 100)
              : Math.round(
                  (1 - probability) * 100
                );
        }
      }

      /*
       * Risk is already calculated by the backend
       * and stored in scan.risk.
       *
       * Keep that value as the primary severity source.
       */
      const risk = Math.max(
        0,
        Math.min(
          100,
          Number(scan.risk || 0)
        )
      );

      return {
        ...scan,
        prediction,
        family,
        familyProbability,
        confidence: Math.max(
          0,
          Math.min(100, confidence)
        ),
        severity: getSeverity(risk),
      };
    });
  }, [classificationData]);

  return (
    <div>
      <Topbar
        title="Malware Classification"
        subtitle="Family identification, confidence scoring, and detection model output."
      />

      <div className="grid grid-cols-1 gap-6 px-8 py-6 xl:grid-cols-5">
        {/* Malware Family Breakdown */}
        <Card className="xl:col-span-2">
          <CardHeader
            eyebrow="Model output"
            title="Malware family breakdown"
          />

          {loading ? (
            <div className="flex h-72 items-center justify-center text-sm text-ink-faint">
              Loading classification results...
            </div>
          ) : error ? (
            <div className="flex h-72 items-center justify-center px-6 text-center text-sm text-ink-soft">
              {error}
            </div>
          ) : malwareFamilies.length === 0 ? (
            <div className="flex h-72 items-center justify-center px-6 text-center text-sm text-ink-faint">
              No malware family classifications available yet.
            </div>
          ) : (
            <div className="h-72 px-2 pb-4 pt-4">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <PieChart>
                  <Pie
                    data={malwareFamilies}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={58}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {malwareFamilies.map(
                      (entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={
                            ORANGE_SHADES[
                              index %
                                ORANGE_SHADES.length
                            ]
                          }
                        />
                      )
                    )}
                  </Pie>

                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      borderColor: "#e7e6e3",
                      fontFamily:
                        "JetBrains Mono",
                      fontSize: 12,
                    }}
                  />

                  <Legend
                    layout="vertical"
                    verticalAlign="middle"
                    align="right"
                    iconType="circle"
                    wrapperStyle={{
                      fontSize: 12,
                      fontFamily: "Inter",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Classified Samples */}
        <Card className="xl:col-span-3">
          <CardHeader
            eyebrow="Queue"
            title="Classified samples"
          />

          {loading ? (
            <div className="px-5 py-12 text-center text-sm text-ink-faint">
              Loading classified samples...
            </div>
          ) : error ? (
            <div className="px-5 py-12 text-center text-sm text-ink-soft">
              {error}
            </div>
          ) : classified.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-ink-faint">
              No classified samples available yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-[11px] font-mono uppercase tracking-wide text-ink-faint">
                    <th className="px-5 py-3 font-medium">
                      File
                    </th>

                    <th className="px-5 py-3 font-medium">
                      Family / verdict
                    </th>

                    <th className="px-5 py-3 font-medium">
                      Confidence
                    </th>

                    <th className="px-5 py-3 font-medium">
                      Severity
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {classified.map((scan) => (
                    <tr
                      key={
                        scan.analysisId ||
                        scan.fileId ||
                        scan.id
                      }
                      className="border-b border-line last:border-0 hover:bg-surface/60"
                    >
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-ink">
                          {scan.file}
                        </p>

                        <p className="font-mono text-[11px] text-ink-faint">
                          {scan.hash}
                        </p>
                      </td>

                      <td className="px-5 py-3.5">
                        {scan.family ? (
                          <div>
                            <p className="font-medium text-ink">
                              {scan.family}
                            </p>

                            <p className="mt-0.5 text-xs text-ink-soft">
                              {scan.prediction}

                              {scan.familyProbability !==
                                null &&
                                ` · ${scan.familyProbability}% family confidence`}
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p className="font-medium text-ink">
                              {scan.prediction}
                            </p>

                            <p className="mt-0.5 text-xs text-ink-faint">
                              Family not assigned
                            </p>
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-orange-50">
                            <div
                              className="h-full rounded-full bg-orange-500"
                              style={{
                                width: `${scan.confidence}%`,
                              }}
                            />
                          </div>

                          <span className="font-mono text-xs text-ink-soft">
                            {scan.confidence}%
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <SeverityBadge
                          severity={
                            scan.severity
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Classification Pipeline */}
      <div className="px-8 pb-8">
        <Card>
          <CardHeader
            eyebrow="Pipeline"
            title="Classification model stages"
          />

          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl bg-line sm:grid-cols-4">
            {[
              [
                "Feature engineering",
                "Extracted static features are normalized and vectorized.",
              ],
              [
                "Model inference",
                "Ensemble classifier scores the sample against known malware patterns.",
              ],
              [
                "Category mapping",
                "The malware family model maps detected malware to a family label.",
              ],
              [
                "Result generation",
                "Malware probability, family confidence, and risk level are produced.",
              ],
            ].map(
              ([title, desc], index) => (
                <div
                  key={title}
                  className="bg-paper p-4"
                >
                  <p className="font-mono text-[11px] text-orange-500">
                    0{index + 1}
                  </p>

                  <p className="mt-1 text-sm font-semibold text-ink">
                    {title}
                  </p>

                  <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                    {desc}
                  </p>
                </div>
              )
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}