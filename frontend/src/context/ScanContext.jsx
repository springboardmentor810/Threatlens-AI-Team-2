import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { getAnalysisHistory } from "../api/api";
import { useAuth } from "./AuthContext";

const ScanContext = createContext(null);

function statusForRisk(risk) {
  const value = Number(risk || 0);

  if (value >= 50) return "high";
  if (value >= 20) return "medium";

  return "low";
}

function formatHistoryRecord(item) {
  const scannedAt = item.scanned_at
    ? new Date(item.scanned_at)
    : new Date();

  const risk = Math.max(
    0,
    Math.min(
      100,
      Math.round(Number(item.risk ?? 0))
    )
  );

  return {
    id: `ANL-${item.analysis_id}`,

    analysisId: item.analysis_id ?? null,

    fileId: item.file_id ?? null,

    file: item.file ?? "Unknown file",

    hash: item.hash ?? "—",

    risk,

    verdict: item.verdict ?? "UNKNOWN",

    status:
      item.status ??
      statusForRisk(risk),

    analyst:
      item.analyst ??
      "Auto-scan",

    date: scannedAt.toLocaleDateString(
      "en-IN"
    ),

    time: scannedAt.toLocaleTimeString(
      "en-IN",
      {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }
    ),

    timestamp: scannedAt.getTime(),

    scannedAt,
  };
}

export function ScanProvider({ children }) {
  const { user } = useAuth();

  const [scans, setScans] = useState([]);

  const [historyLoading, setHistoryLoading] =
    useState(false);

  const [historyError, setHistoryError] =
    useState("");

  /*
   * Load the real scan history from the backend.
   */
  const loadHistory = useCallback(async () => {
    /*
     * Do not request protected history before
     * the user has been authenticated.
     */
    if (!user) {
      setScans([]);
      setHistoryLoading(false);
      setHistoryError("");
      return;
    }

    /*
     * Make sure a token actually exists.
     */
    const token =
      localStorage.getItem(
        "threatlens_token"
      );

    if (!token) {
      setScans([]);
      setHistoryLoading(false);
      setHistoryError("");
      return;
    }

    try {
      setHistoryLoading(true);
      setHistoryError("");

      const data =
        await getAnalysisHistory();

      if (!Array.isArray(data)) {
        setScans([]);
        return;
      }

      const formatted =
        data.map(formatHistoryRecord);

      setScans(formatted);
    } catch (error) {
      console.error(
        "Failed to load scan history:",
        error
      );

      setHistoryError(
        error.message ||
          "Failed to load scan history."
      );

      setScans([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [user]);

  /*
   * IMPORTANT:
   *
   * This runs again when the user logs in.
   *
   * Previously the context could load before the
   * login token existed and never retry.
   */
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  /*
   * Add a newly completed scan immediately to the UI.
   */
  const addScan = useCallback(
    ({
      analysisId = null,
      fileId = null,
      file,
      hash = "",
      risk = 0,
      verdict = "UNKNOWN",
      analyst = "Auto-scan",
      scannedAt = new Date(),
    }) => {
      const date =
        scannedAt instanceof Date
          ? scannedAt
          : new Date(scannedAt);

      const normalizedRisk = Math.max(
        0,
        Math.min(
          100,
          Math.round(Number(risk || 0))
        )
      );

      const record = {
        id:
          analysisId !== null
            ? `ANL-${analysisId}`
            : `LOCAL-${Date.now()}`,

        analysisId,

        fileId,

        file:
          file || "Unknown file",

        hash:
          hash || "—",

        risk:
          normalizedRisk,

        verdict:
          verdict || "UNKNOWN",

        status:
          statusForRisk(
            normalizedRisk
          ),

        analyst:
          analyst || "Auto-scan",

        date: date.toLocaleDateString(
          "en-IN"
        ),

        time: date.toLocaleTimeString(
          "en-IN",
          {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          }
        ),

        timestamp:
          date.getTime(),

        scannedAt: date,
      };

      setScans((previous) => {
        /*
         * If this analysis already exists,
         * replace it instead of creating duplicates.
         */
        if (analysisId !== null) {
          const alreadyExists =
            previous.some(
              (scan) =>
                scan.analysisId ===
                analysisId
            );

          if (alreadyExists) {
            return previous.map(
              (scan) =>
                scan.analysisId ===
                analysisId
                  ? record
                  : scan
            );
          }
        }

        return [
          record,
          ...previous,
        ];
      });

      return record;
    },
    []
  );

  /*
   * Reload history manually.
   */
  const refreshHistory =
    useCallback(async () => {
      await loadHistory();
    }, [loadHistory]);

  const value = {
    scans,

    addScan,

    statusForRisk,

    historyLoading,

    historyError,

    loadHistory,

    refreshHistory,
  };

  return (
    <ScanContext.Provider value={value}>
      {children}
    </ScanContext.Provider>
  );
}

export function useScans() {
  const context =
    useContext(ScanContext);

  if (!context) {
    throw new Error(
      "useScans must be used inside ScanProvider"
    );
  }

  return context;
}