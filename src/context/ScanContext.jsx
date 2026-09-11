import { createContext, useContext, useState } from "react";
import { scanHistory as SEED_SCANS } from "../data/mockData";

const ScanContext = createContext(null);

function nextId(scans) {
  const max = scans.reduce((m, s) => {
    const n = parseInt(String(s.id).replace(/\D/g, ""), 10);
    return Number.isFinite(n) ? Math.max(m, n) : m;
  }, 8841);
  return `SCN-${max + 1}`;
}

function statusForRisk(risk) {
  if (risk >= 76) return "critical";
  if (risk >= 51) return "high";
  if (risk >= 26) return "medium";
  return "low";
}

export function ScanProvider({ children }) {
  const [scans, setScans] = useState(SEED_SCANS);

  function addScan({ file, hash, risk, verdict, analyst }) {
    const now = new Date();
    const record = {
      id: nextId(scans),
      file,
      hash: hash ?? "—",
      risk,
      verdict,
      status: statusForRisk(risk),
      date: now.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }),
      time: now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
      timestamp: now.getTime(),
      analyst: analyst ?? "Auto-scan",
    };
    setScans((prev) => [record, ...prev]);
    return record;
  }

  return (
    <ScanContext.Provider value={{ scans, addScan, statusForRisk }}>
      {children}
    </ScanContext.Provider>
  );
}

export function useScans() {
  const ctx = useContext(ScanContext);
  if (!ctx) throw new Error("useScans must be used within ScanProvider");
  return ctx;
}
