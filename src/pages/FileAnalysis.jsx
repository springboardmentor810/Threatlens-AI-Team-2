import { useRef, useState } from "react";
import { UploadCloud, FileWarning, Hash, FileCog, ShieldAlert, CheckCircle2, Loader2, Download } from "lucide-react";
import Topbar from "../components/Topbar";
import Card, { CardHeader } from "../components/Card";
import SeverityBadge from "../components/SeverityBadge";
import { staticAnalysisExample } from "../data/mockData";

export default function FileAnalysis() {
  const [status, setStatus] = useState("idle"); // idle | scanning | done
  const [fileName, setFileName] = useState(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  function runScan(name) {
    setFileName(name);
    setStatus("scanning");
    setTimeout(() => setStatus("done"), 1800);
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    runScan(f ? f.name : staticAnalysisExample.fileName);
  }

  function onPick(e) {
    const f = e.target.files?.[0];
    if (f) runScan(f.name);
  }

  const result = staticAnalysisExample;

  function downloadReport() {
    const name = fileName ?? result.fileName;
    const lines = [
      "THREATLENS AI — STATIC ANALYSIS REPORT",
      "=".repeat(42),
      `Generated: ${new Date().toLocaleString()}`,
      "",
      `File name:   ${name}`,
      `File type:   ${result.fileType}`,
      `Size:        ${result.size}`,
      `SHA-256:     ${result.sha256}`,
      `MD5:         ${result.md5}`,
      "",
      "Suspicious indicators:",
      ...result.indicators.map((i) => `  - [${i.severity.toUpperCase()}] ${i.label}`),
      "",
      `Risk score:      ${result.riskScore}/100`,
      `Classification:  ${result.classification}`,
      `Recommended action: ${result.recommendedAction}`,
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name.replace(/\.[^/.]+$/, "")}_threatlens_report.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <Topbar title="File Analysis" subtitle="Upload a suspicious file to run static analysis without executing it." />

      <div className="grid grid-cols-1 gap-6 px-8 py-6 xl:grid-cols-5">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader eyebrow="Step 1" title="Upload suspicious file" />
            <div className="p-5">
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
                className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors ${
                  dragging ? "border-orange-400 bg-orange-50" : "border-line hover:border-orange-300 hover:bg-surface"
                }`}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-50">
                  <UploadCloud className="h-6 w-6 text-orange-500" />
                </div>
                <p className="text-sm font-medium text-ink">Drop a file here, or click to browse</p>
                <p className="text-xs text-ink-faint">Executables, documents, archives, and APKs supported · max 200MB</p>
                <input ref={inputRef} type="file" className="hidden" onChange={onPick} />
              </div>

              <button
                onClick={() => runScan(staticAnalysisExample.fileName)}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-line px-4 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:border-orange-300 hover:text-orange-600"
              >
                <FileWarning className="h-4 w-4" />
                Try sample file: invoice.exe
              </button>
            </div>
          </Card>

          <Card>
            <CardHeader eyebrow="Pipeline" title="Static analysis workflow" />
            <ul className="space-y-3 p-5">
              {[
                ["File hashing (MD5 / SHA-256)", Hash],
                ["File type & metadata extraction", FileCog],
                ["PE header & import table analysis", FileCog],
                ["YARA rule matching", ShieldAlert],
                ["Signature-based malware detection", ShieldAlert],
              ].map(([label, Icon]) => (
                <li key={label} className="flex items-center gap-3 text-sm text-ink-soft">
                  <Icon className="h-4 w-4 shrink-0 text-orange-400" />
                  {label}
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="xl:col-span-3">
          <Card className="h-full">
            <CardHeader
              eyebrow="Step 2"
              title="Analysis result"
              action={status === "done" && <SeverityBadge severity={result.riskScore >= 76 ? "critical" : "medium"} />}
            />

            {status === "idle" && (
              <div className="flex h-72 flex-col items-center justify-center gap-2 px-6 text-center">
                <FileCog className="h-8 w-8 text-ink-faint" />
                <p className="text-sm text-ink-soft">Upload a file to see hashing, YARA matches, and a risk-scored verdict here.</p>
              </div>
            )}

            {status === "scanning" && (
              <div className="flex h-72 flex-col items-center justify-center gap-3 px-6 text-center">
                <Loader2 className="h-7 w-7 animate-spin text-orange-500" />
                <p className="font-mono text-sm text-ink">Scanning {fileName}…</p>
                <p className="text-xs text-ink-faint">Extracting metadata, hashing, matching YARA rules</p>
              </div>
            )}

            {status === "done" && (
              <div className="p-5 space-y-5">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <InfoRow label="File name" value={fileName ?? result.fileName} mono />
                  <InfoRow label="File type" value={result.fileType} />
                  <InfoRow label="Size" value={result.size} />
                  <InfoRow label="SHA-256" value={result.sha256} mono truncate />
                  <InfoRow label="MD5" value={result.md5} mono />
                </div>

                <div>
                  <p className="mb-2 font-mono text-[11px] uppercase tracking-widest text-ink-faint">Suspicious indicators</p>
                  <ul className="space-y-2">
                    {result.indicators.map((ind) => (
                      <li key={ind.label} className="flex items-center justify-between gap-3 rounded-lg border border-line px-3.5 py-2.5">
                        <span className="text-sm text-ink">{ind.label}</span>
                        <SeverityBadge severity={ind.severity} />
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-[11px] uppercase tracking-widest text-orange-600">Risk score</p>
                    <p className="font-display text-2xl font-bold text-orange-700">{result.riskScore}<span className="text-sm font-normal text-orange-400">/100</span></p>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-orange-100">
                    <div className="h-full rounded-full bg-orange-500" style={{ width: `${result.riskScore}%` }} />
                  </div>
                  <p className="mt-3 text-sm text-ink"><span className="font-semibold">Classification:</span> {result.classification}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-soft">
                    <ShieldAlert className="h-4 w-4 text-orange-500" />
                    {result.recommendedAction}
                  </p>
                </div>

                <div className="flex flex-col gap-2.5 sm:flex-row">
                  <button className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-600">
                    <CheckCircle2 className="h-4 w-4" />
                    Escalate to Security Analyst
                  </button>
                  <button
                    onClick={downloadReport}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-ink-soft transition-colors hover:border-orange-300 hover:text-orange-600"
                  >
                    <Download className="h-4 w-4" />
                    Download report
                  </button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono, truncate }) {
  return (
    <div className="rounded-lg border border-line px-3.5 py-2.5">
      <p className="font-mono text-[10px] uppercase tracking-widest text-ink-faint">{label}</p>
      <p className={`mt-1 text-sm text-ink ${mono ? "font-mono text-xs" : ""} ${truncate ? "truncate" : ""}`} title={value}>
        {value}
      </p>
    </div>
  );
}
