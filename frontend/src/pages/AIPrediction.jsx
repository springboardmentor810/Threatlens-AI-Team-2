import { useEffect, useMemo, useState } from "react";
import {
  BrainCircuit,
  Sparkles,
  RefreshCw,
} from "lucide-react";

import Topbar from "../components/Topbar";
import Card, { CardHeader } from "../components/Card";
import SeverityBadge from "../components/SeverityBadge";
import { getAnalysis } from "../api/api";
import { useScans } from "../context/ScanContext";

function getSeverity(risk) {
  const value = Number(risk || 0);

  if (value >= 50) return "high";
  if (value >= 20) return "medium";

  return "low";
}

function getMlAnalysis(response) {
  if (!response) {
    return null;
  }

  if (response.result?.ml_analysis) {
    return response.result.ml_analysis;
  }

  if (response.ml_analysis) {
    return response.ml_analysis;
  }

  return null;
}

function percentage(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const number = Number(value);

  if (Number.isNaN(number)) {
    return null;
  }

  return Math.round(number * 100);
}

function getPredictionDescription(ml) {
  if (!ml) {
    return "No ML prediction data is available for this analysis.";
  }

  const probability = percentage(
    ml.malware_probability
  );

  if (ml.prediction === "Malware") {
    if (ml.malware_family) {
      return `The ML engine classified this sample as malware with ${
        probability ?? "—"
      }% malware probability. The predicted family is ${ml.malware_family}.`;
    }

    return `The ML engine classified this sample as malware with ${
      probability ?? "—"
    }% malware probability.`;
  }

  return `The ML engine classified this sample as benign with ${
    probability !== null
      ? `${100 - probability}% benign confidence`
      : "no confidence value available"
  }.`;
}

export default function AIPrediction() {
  const {
    scans,
    historyLoading,
  } = useScans();

  const [predictions, setPredictions] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  async function loadPredictions() {
    if (historyLoading) {
      return;
    }

    if (!scans.length) {
      setPredictions([]);
      setError("");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      /*
       * Only use real files from the backend
       * analysis history.
       */
      const uniqueScans = [];
      const seenFiles = new Set();

      scans.forEach((scan) => {
        if (!scan.fileId) {
          return;
        }

        if (seenFiles.has(scan.fileId)) {
          return;
        }

        seenFiles.add(scan.fileId);
        uniqueScans.push(scan);
      });

      const results =
        await Promise.all(
          uniqueScans.map(
            async (scan) => {
              try {
                const response =
                  await getAnalysis(
                    scan.fileId
                  );

                const ml =
                  getMlAnalysis(
                    response
                  );

                return {
                  ...scan,
                  mlAnalysis: ml,
                };
              } catch (err) {
                console.error(
                  `Failed to load ML analysis for file ${scan.fileId}:`,
                  err
                );

                return {
                  ...scan,
                  mlAnalysis: null,
                };
              }
            }
          )
        );

      setPredictions(results);
    } catch (err) {
      console.error(
        "Failed to load AI predictions:",
        err
      );

      setError(
        err.message ||
          "Failed to load AI predictions."
      );

      setPredictions([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPredictions();
  }, [scans, historyLoading]);

  /*
   * Convert real backend ML results into
   * display-ready prediction cards.
   */
  const predictionInsights =
    useMemo(() => {
      return predictions
        .filter(
          (item) => item.mlAnalysis
        )
        .slice(0, 6)
        .map((item) => {
          const ml =
            item.mlAnalysis;

          const malwareProbability =
            percentage(
              ml.malware_probability
            );

          /*
           * For Malware:
           * confidence = malware probability.
           *
           * For Benign:
           * confidence = benign probability.
           */
          const confidence =
            ml.prediction === "Malware"
              ? malwareProbability ?? 0
              : malwareProbability !== null
                ? 100 - malwareProbability
                : 0;

          const severity =
            getSeverity(item.risk);

          let title;

          if (
            ml.prediction === "Malware"
          ) {
            title = ml.malware_family
              ? `${item.file} — ${ml.malware_family}`
              : `${item.file} — Malware`;
          } else {
            title = `${item.file} — Benign`;
          }

          return {
            id:
              item.analysisId ||
              item.fileId ||
              item.id,

            title,

            description:
              getPredictionDescription(
                ml
              ),

            confidence,

            severity,

            prediction:
              ml.prediction,

            family:
              ml.malware_family,

            malwareProbability,

            familyProbability:
              percentage(
                ml.family_probability
              ),

            file:
              item.file,

            risk:
              item.risk,
          };
        });
    }, [predictions]);

  const latestPrediction =
    predictionInsights[0] || null;

  return (
    <div>
      <Topbar
        title="AI Prediction"
        subtitle="ML-based malware prediction, probability scoring, and family classification."
      />

      <div className="space-y-6 px-8 py-6">

        {/* ======================================================
            PREDICTION ENGINE
        ====================================================== */}

        <Card className="hex-noise bg-surface !border-orange-100">
          <div className="flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center">

            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-500">
                <BrainCircuit className="h-6 w-6 text-white" />
              </div>

              <div>
                <p className="font-mono text-[11px] uppercase tracking-widest text-orange-500">
                  Prediction engine
                </p>

                <p className="font-display text-lg font-semibold text-ink">
                  Malware classification engine
                </p>

                <p className="text-sm text-ink-soft">
                  Uses the trained ML models to
                  calculate malware probability,
                  risk level, and malware family.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={loadPredictions}
              disabled={
                loading ||
                historyLoading
              }
              className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}

              Refresh predictions
            </button>
          </div>
        </Card>

        {/* ======================================================
            LATEST PREDICTION
        ====================================================== */}

        {latestPrediction && (
          <Card>
            <CardHeader
              eyebrow="Latest model result"
              title={latestPrediction.file}
            />

            <div className="grid grid-cols-1 gap-4 px-5 pb-5 md:grid-cols-4">

              {/* Prediction */}

              <div className="rounded-lg border border-line p-4">
                <p className="font-mono text-[11px] uppercase text-ink-faint">
                  Prediction
                </p>

                <p className="mt-2 text-lg font-semibold text-ink">
                  {latestPrediction.prediction}
                </p>
              </div>

              {/* Malware probability */}

              <div className="rounded-lg border border-line p-4">
                <p className="font-mono text-[11px] uppercase text-ink-faint">
                  Malware probability
                </p>

                <p className="mt-2 text-lg font-semibold text-ink">
                  {latestPrediction.malwareProbability !==
                  null
                    ? `${latestPrediction.malwareProbability}%`
                    : "—"}
                </p>
              </div>

              {/* Risk */}

              <div className="rounded-lg border border-line p-4">
                <p className="font-mono text-[11px] uppercase text-ink-faint">
                  Risk score
                </p>

                <p className="mt-2 text-lg font-semibold text-ink">
                  {latestPrediction.risk}/100
                </p>
              </div>

              {/* Family */}

              <div className="rounded-lg border border-line p-4">
                <p className="font-mono text-[11px] uppercase text-ink-faint">
                  Malware family
                </p>

                <p className="mt-2 text-lg font-semibold text-ink">
                  {latestPrediction.family ||
                    "None"}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* ======================================================
            PREDICTION RESULTS
        ====================================================== */}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

          {loading ? (
            <Card className="lg:col-span-3">
              <div className="flex items-center justify-center py-12 text-sm text-ink-faint">
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Loading ML predictions...
              </div>
            </Card>
          ) : error ? (
            <Card className="lg:col-span-3">
              <div className="px-5 py-12 text-center text-sm text-ink-soft">
                {error}
              </div>
            </Card>
          ) : predictionInsights.length === 0 ? (
            <Card className="lg:col-span-3">
              <div className="px-5 py-12 text-center text-sm text-ink-faint">
                No ML prediction results available yet.
              </div>
            </Card>
          ) : (
            predictionInsights.map(
              (prediction) => (
                <Card
                  key={prediction.id}
                >
                  <div className="flex items-center justify-between px-5 pt-5">

                    <SeverityBadge
                      severity={
                        prediction.severity
                      }
                    />

                    <p className="font-mono text-xs text-ink-faint">
                      {prediction.confidence}%
                      confidence
                    </p>
                  </div>

                  <div className="px-5 pb-5 pt-3">

                    <p className="font-display text-[15px] font-semibold leading-snug text-ink">
                      {prediction.title}
                    </p>

                    <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                      {prediction.description}
                    </p>

                    {prediction.family && (
                      <p className="mt-2 font-mono text-[11px] text-ink-faint">
                        Family confidence:{" "}
                        {prediction.familyProbability !==
                        null
                          ? `${prediction.familyProbability}%`
                          : "—"}
                      </p>
                    )}

                    <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-orange-50">
                      <div
                        className="h-full rounded-full bg-orange-500"
                        style={{
                          width: `${Math.max(
                            0,
                            Math.min(
                              100,
                              prediction.confidence
                            )
                          )}%`,
                        }}
                      />
                    </div>

                  </div>
                </Card>
              )
            )
          )}
        </div>

        {/* ======================================================
            PIPELINE
        ====================================================== */}

        <Card>
          <CardHeader
            eyebrow="Workflow"
            title="Threat intelligence pipeline"
          />

          <div className="grid grid-cols-1 divide-y divide-line sm:grid-cols-4 sm:divide-x sm:divide-y-0">

            {[
              "Static feature extraction",
              "ML model inference",
              "Malware probability and family classification",
              "Risk and cybersecurity result generation",
            ].map(
              (step, index) => (
                <div
                  key={step}
                  className="p-5"
                >
                  <p className="font-mono text-xs text-orange-500">
                    Stage {index + 1}
                  </p>

                  <p className="mt-1.5 text-sm text-ink">
                    {step}
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