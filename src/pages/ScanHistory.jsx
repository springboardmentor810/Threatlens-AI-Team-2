import { useMemo, useState } from "react";
import { Search, Download, History as HistoryIcon } from "lucide-react";
import Topbar from "../components/Topbar";
import Card from "../components/Card";
import SeverityBadge from "../components/SeverityBadge";
import { useScans } from "../context/ScanContext";

const FILTERS = ["all", "critical", "high", "medium", "low"];

export default function ScanHistory() {
  const { scans } = useScans();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  const filtered = useMemo(() => {
    return scans.filter((s) => {
      const matchesFilter = filter === "all" || s.status === filter;
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q || s.file.toLowerCase().includes(q) || s.hash.toLowerCase().includes(q) || s.id.toLowerCase().includes(q);
      return matchesFilter && matchesQuery;
    });
  }, [scans, query, filter]);

  function downloadRow(row) {
    const lines = [
      "THREATLENS AI — SCAN HISTORY RECORD",
      "=".repeat(42),
      `Scan ID:     ${row.id}`,
      `File name:   ${row.file}`,
      `SHA-256:     ${row.hash}`,
      `Verdict:     ${row.verdict}`,
      `Risk score:  ${row.risk}/100`,
      `Severity:    ${row.status.toUpperCase()}`,
      `Analyst:     ${row.analyst}`,
      `Scanned at:  ${row.date} ${row.time}`,
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${row.id}_scan_record.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <Topbar title="Scan History" subtitle="Complete, searchable record of every file ThreatLens AI has analyzed." />

      <div className="px-8 py-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
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
          <div className="flex items-center gap-2 rounded-lg border border-line bg-paper px-3 py-2 sm:w-72">
            <Search className="h-4 w-4 text-ink-faint" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              type="text"
              placeholder="Search file, hash, or scan ID…"
              className="w-full bg-transparent font-mono text-xs text-ink placeholder:text-ink-faint focus:outline-none"
            />
          </div>
        </div>

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-[11px] font-mono uppercase tracking-wide text-ink-faint">
                  <th className="px-5 py-3 font-medium">Scan ID</th>
                  <th className="px-5 py-3 font-medium">File</th>
                  <th className="px-5 py-3 font-medium">Verdict</th>
                  <th className="px-5 py-3 font-medium">Risk</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Analyst</th>
                  <th className="px-5 py-3 font-medium">Scanned</th>
                  <th className="px-5 py-3 font-medium text-right">Report</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="border-b border-line last:border-0 hover:bg-surface/60">
                    <td className="px-5 py-3.5 font-mono text-xs text-ink-soft">{s.id}</td>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-ink">{s.file}</p>
                      <p className="font-mono text-[10px] text-ink-faint">{s.hash}</p>
                    </td>
                    <td className="px-5 py-3.5 text-ink-soft">{s.verdict}</td>
                    <td className="px-5 py-3.5 font-mono text-xs text-ink">{s.risk}/100</td>
                    <td className="px-5 py-3.5"><SeverityBadge severity={s.status} /></td>
                    <td className="px-5 py-3.5 text-ink-soft">{s.analyst}</td>
                    <td className="px-5 py-3.5 text-ink-faint">
                      <span className="block">{s.date}</span>
                      <span className="block font-mono text-[10px]">{s.time}</span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => downloadRow(s)}
                        title="Download report"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-faint transition-colors hover:bg-orange-50 hover:text-orange-600"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-sm text-ink-faint">
                      <HistoryIcon className="mx-auto mb-2 h-6 w-6 text-ink-faint" />
                      No scans match your search or filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-line px-5 py-3">
            <p className="text-xs text-ink-faint">Showing {filtered.length} of {scans.length} scans</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
