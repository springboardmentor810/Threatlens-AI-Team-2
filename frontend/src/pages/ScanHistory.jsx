import { useMemo, useState } from "react";
import {
  Search,
  Download,
  History as HistoryIcon,
  RefreshCw,
} from "lucide-react";

import Topbar from "../components/Topbar";
import Card from "../components/Card";
import SeverityBadge from "../components/SeverityBadge";
import { useScans } from "../context/ScanContext";

const FILTERS = [
  "all",
  "critical",
  "high",
  "medium",
  "low",
];

export default function ScanHistory() {
  const {
    scans,
    historyLoading,
    historyError,
    refreshHistory,
  } = useScans();

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return scans.filter((scan) => {
      const matchesFilter =
        filter === "all" ||
        String(scan.status || "").toLowerCase() ===
          filter;

      const file = String(scan.file || "").toLowerCase();
      const hash = String(scan.hash || "").toLowerCase();
      const id = String(scan.id || "").toLowerCase();

      const matchesQuery =
        !q ||
        file.includes(q) ||
        hash.includes(q) ||
        id.includes(q);

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
      `Severity:    ${String(
        row.status || ""
      ).toUpperCase()}`,
      `Analyst:     ${row.analyst}`,
      `Scanned at:  ${row.date} ${row.time}`,
    ];

    const blob = new Blob(
      [lines.join("\n")],
      {
        type: "text/plain;charset=utf-8",
      }
    );

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
      <Topbar
        title="Scan History"
        subtitle="Complete, searchable record of every file ThreatLens AI has analyzed."
      />

      <div className="px-8 py-6">
        {/* Filters + Search + Refresh */}
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {FILTERS.map((filterOption) => (
              <button
                key={filterOption}
                type="button"
                onClick={() =>
                  setFilter(filterOption)
                }
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium font-mono uppercase tracking-wide transition-colors ${
                  filter === filterOption
                    ? "bg-orange-500 text-white"
                    : "bg-surface text-ink-soft hover:bg-orange-50 hover:text-orange-600"
                }`}
              >
                {filterOption}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            {/* Search */}
            <div className="flex items-center gap-2 rounded-lg border border-line bg-paper px-3 py-2 sm:w-72">
              <Search className="h-4 w-4 text-ink-faint" />

              <input
                value={query}
                onChange={(event) =>
                  setQuery(event.target.value)
                }
                type="text"
                placeholder="Search file, hash, or scan ID…"
                className="w-full bg-transparent font-mono text-xs text-ink placeholder:text-ink-faint focus:outline-none"
              />
            </div>

            {/* Refresh */}
            <button
              type="button"
              onClick={refreshHistory}
              disabled={historyLoading}
              title="Refresh scan history"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-line bg-paper px-3 py-2 text-xs font-semibold text-ink transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
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
        </div>

        {/* Error */}
        {historyError && (
          <div className="mb-4 rounded-lg border border-line bg-paper px-4 py-3 text-sm text-ink-soft">
            {historyError}
          </div>
        )}

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left text-sm">
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
                    Scanned
                  </th>

                  <th className="px-5 py-3 font-medium text-right">
                    Report
                  </th>
                </tr>
              </thead>

              <tbody>
                {historyLoading && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-12 text-center text-sm text-ink-faint"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Loading scan history...
                      </div>
                    </td>
                  </tr>
                )}

                {!historyLoading &&
                  filtered.map((scan) => (
                    <tr
                      key={
                        scan.analysisId ||
                        scan.fileId ||
                        scan.id
                      }
                      className="border-b border-line last:border-0 hover:bg-surface/60"
                    >
                      <td className="px-5 py-3.5 font-mono text-xs text-ink-soft">
                        {scan.id}
                      </td>

                      <td className="px-5 py-3.5">
                        <p className="font-medium text-ink">
                          {scan.file}
                        </p>

                        <p className="font-mono text-[10px] text-ink-faint">
                          {scan.hash}
                        </p>
                      </td>

                      <td className="px-5 py-3.5 text-ink-soft">
                        {scan.verdict}
                      </td>

                      <td className="px-5 py-3.5 font-mono text-xs text-ink">
                        {scan.risk}/100
                      </td>

                      <td className="px-5 py-3.5">
                        <SeverityBadge
                          severity={scan.status}
                        />
                      </td>

                      <td className="px-5 py-3.5 text-ink-soft">
                        {scan.analyst}
                      </td>

                      <td className="px-5 py-3.5 text-ink-faint">
                        <span className="block">
                          {scan.date}
                        </span>

                        <span className="block font-mono text-[10px]">
                          {scan.time}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            downloadRow(scan)
                          }
                          title="Download report"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-faint transition-colors hover:bg-orange-50 hover:text-orange-600"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}

                {!historyLoading &&
                  filtered.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-5 py-12 text-center text-sm text-ink-faint"
                      >
                        <HistoryIcon className="mx-auto mb-2 h-6 w-6 text-ink-faint" />

                        No scans match your search or
                        filter.
                      </td>
                    </tr>
                  )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-line px-5 py-3">
            <p className="text-xs text-ink-faint">
              Showing {filtered.length} of{" "}
              {scans.length} scans
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}