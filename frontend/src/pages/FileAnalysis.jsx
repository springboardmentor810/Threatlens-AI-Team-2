import { useRef, useState } from "react";
import {
  UploadCloud,
  FileWarning,
  Hash,
  FileCog,
  ShieldAlert,
  CheckCircle2,
  Loader2,
  Download,
} from "lucide-react";

import Topbar from "../components/Topbar";
import Card, { CardHeader } from "../components/Card";
import SeverityBadge from "../components/SeverityBadge";
import { useScans } from "../context/ScanContext";
import { useAuth } from "../context/AuthContext";
import { uploadFile, analyzeFile } from "../api/api";


export default function FileAnalysis() {
  const [status, setStatus] = useState("idle");
  const [fileName, setFileName] = useState(null);
  const [scanRecord, setScanRecord] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  const inputRef = useRef(null);

  const { addScan } = useScans();
  const { user } = useAuth();


  // ==========================================================
  // REAL FILE SCAN
  // ==========================================================

  async function runScan(file) {
    if (!file) {
      return;
    }

    setFileName(file.name);
    setScanRecord(null);
    setAnalysisResult(null);
    setError("");
    setStatus("scanning");

    try {
      let fileId = null;

      // ======================================================
      // STEP 1 — UPLOAD FILE
      // ======================================================

      try {
        const uploadResult = await uploadFile(file);

        fileId = uploadResult?.file_id;

        if (!fileId) {
          throw new Error(
            "Upload completed but no file ID was returned."
          );
        }

      } catch (uploadError) {
        console.error("Upload response:", uploadError);

        /*
         * If the backend says that this file already exists,
         * use the existing file ID instead of stopping.
         *
         * Backend response:
         *
         * HTTP 409
         * {
         *   "detail": {
         *     "message": "...",
         *     "file_id": 12
         *   }
         * }
         */

        if (
          uploadError?.status === 409 &&
          uploadError?.fileId
        ) {
          console.log(
            "Duplicate file detected. Using existing file ID:",
            uploadError.fileId
          );

          fileId = uploadError.fileId;
        } else {
          throw uploadError;
        }
      }


      // ======================================================
      // SAFETY CHECK
      // ======================================================

      if (!fileId) {
        throw new Error(
          "The file is already uploaded, but the backend did not provide its existing file ID."
        );
      }


      // ======================================================
      // STEP 2 — RUN CYBERSECURITY + ML ANALYSIS
      // ======================================================

      const result = await analyzeFile(fileId);

      if (!result?.result) {
        throw new Error(
          "Analysis completed but no analysis result was returned."
        );
      }

      setAnalysisResult(result);


      // ======================================================
      // STEP 3 — EXTRACT FINAL FINDING
      // ======================================================

      const finalFinding =
        result.result.final_finding || {};

      const mlAnalysis =
        result.result.ml_analysis || {};

      const riskScore = Math.max(
        0,
        Math.min(
          100,
          Math.round(
            Number(
              finalFinding.risk_score ??
              (
                mlAnalysis.malware_probability != null
                  ? mlAnalysis.malware_probability * 100
                  : 0
              )
            )
          )
        )
      );


      const verdict =
        finalFinding.verdict ||
        mlAnalysis.prediction ||
        "UNKNOWN";


      // ======================================================
      // STEP 4 — SAVE SCAN IN FRONTEND CONTEXT
      // ======================================================

      const record = addScan({
        // Use the REAL backend analysis ID.
        analysisId:
          result.analysis_id ?? null,

        // Use the REAL backend file ID.
        fileId:
          result.file_id ?? fileId,

        file:
          result.result.static_analysis?.file?.filename ||
          file.name,

        hash:
          result.result.sha256 ||
          result.result.static_analysis?.hashes?.sha256 ||
          "",

        risk:
          riskScore,

        verdict,

        analyst:
          user?.name ||
          "Auto-scan",

        // Store the time when this analysis completed.
        scannedAt:
          new Date(),
      });

      setScanRecord(record);


      // ======================================================
      // STEP 5 — COMPLETE
      // ======================================================

      setStatus("done");

    } catch (err) {
      console.error(
        "File analysis failed:",
        err
      );

      setError(
        err?.message ||
        "File analysis failed. Please try again."
      );

      setStatus("error");
    }
  }


  // ==========================================================
  // DRAG & DROP
  // ==========================================================

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);

    const file = e.dataTransfer.files?.[0];

    if (file) {
      runScan(file);
    }
  }


  // ==========================================================
  // FILE PICKER
  // ==========================================================

  function onPick(e) {
    const file = e.target.files?.[0];

    if (file) {
      runScan(file);
    }

    e.target.value = "";
  }


  // ==========================================================
  // DOWNLOAD REPORT
  // ==========================================================

  function downloadReport() {
    if (!analysisResult) {
      return;
    }

    const result = analysisResult.result || {};

    const staticAnalysis =
      result.static_analysis || {};

    const fileInfo =
      staticAnalysis.file || {};

    const hashes =
      staticAnalysis.hashes || {};

    const suspiciousAnalysis =
      result.suspicious_analysis || {};

    const yara =
      result.yara || {};

    const signature =
      result.signature || {};

    const virustotal =
      result.virustotal || {};

    const ml =
      result.ml_analysis || {};

    const finalFinding =
      result.final_finding || {};

    const suspiciousApis =
      suspiciousAnalysis.suspicious_apis || [];

    const reasons =
      finalFinding.reasons || [];


    const lines = [
      "THREATLENS AI — STATIC ANALYSIS REPORT",
      "=".repeat(50),

      `Analysis ID: ${analysisResult.analysis_id ?? "—"}`,
      `File ID:     ${analysisResult.file_id ?? "—"}`,
      `Generated:   ${new Date().toLocaleString()}`,

      "",

      "FILE INFORMATION",
      "-".repeat(50),
      `File name:   ${fileInfo.filename ?? fileName ?? "—"}`,
      `File type:   ${fileInfo.file_type ?? "—"}`,
      `Extension:   ${fileInfo.extension ?? "—"}`,
      `Size:        ${fileInfo.size ?? "—"} bytes`,

      "",

      "HASHES",
      "-".repeat(50),
      `SHA-256:     ${hashes.sha256 ?? result.sha256 ?? "—"}`,
      `MD5:         ${hashes.md5 ?? result.md5 ?? "—"}`,

      "",

      "SUSPICIOUS INDICATORS",
      "-".repeat(50),
      `Suspicious APIs: ${suspiciousApis.length}`,

      ...(
        suspiciousApis.length
          ? suspiciousApis.map(
              (api) => `  - ${api}`
            )
          : ["  - None detected"]
      ),

      "",

      "YARA",
      "-".repeat(50),
      `Matched:      ${yara.yara_matched ? "Yes" : "No"}`,
      `Rule count:   ${yara.rule_count ?? 0}`,

      ...(
        yara.matched_rules?.length
          ? yara.matched_rules.map(
              (rule) => `  - ${rule}`
            )
          : []
      ),

      "",

      "SIGNATURE DETECTION",
      "-".repeat(50),
      `Matched:      ${signature.signature_matched ? "Yes" : "No"}`,
      `Match count:  ${signature.match_count ?? 0}`,

      "",

      "VIRUSTOTAL",
      "-".repeat(50),
      `Available:    ${virustotal.available ? "Yes" : "No"}`,
      `Threat found: ${virustotal.found ? "Yes" : "No"}`,

      "",

      "MACHINE LEARNING",
      "-".repeat(50),
      `Prediction:           ${ml.prediction ?? "—"}`,
      `Malware probability:  ${
        ml.malware_probability != null
          ? `${(ml.malware_probability * 100).toFixed(2)}%`
          : "—"
      }`,
      `Risk level:           ${ml.risk_level ?? "—"}`,
      `Malware family:       ${ml.malware_family ?? "—"}`,
      `Family probability:   ${
        ml.family_probability != null
          ? `${(ml.family_probability * 100).toFixed(2)}%`
          : "—"
      }`,

      "",

      "FINAL FINDING",
      "-".repeat(50),
      `Verdict:       ${finalFinding.verdict ?? "—"}`,
      `Threat level:  ${finalFinding.threat_level ?? "—"}`,
      `Risk score:    ${finalFinding.risk_score ?? "—"}/100`,

      "",

      "Reasons:",
      ...(
        reasons.length
          ? reasons.map(
              (reason) => `  - ${reason}`
            )
          : ["  - No additional reasons provided"]
      ),
    ];


    const blob = new Blob(
      [lines.join("\n")],
      {
        type: "text/plain;charset=utf-8",
      }
    );

    const url = URL.createObjectURL(blob);

    const name =
      fileInfo.filename ||
      fileName ||
      "analysis";

    const a = document.createElement("a");

    a.href = url;

    a.download =
      `${name.replace(/\.[^/.]+$/, "")}` +
      `_threatlens_report.txt`;

    document.body.appendChild(a);

    a.click();

    a.remove();

    URL.revokeObjectURL(url);
  }


  // ==========================================================
  // REAL RESULT DATA
  // ==========================================================

  const result =
    analysisResult?.result;

  const staticAnalysis =
    result?.static_analysis || {};

  const fileInfo =
    staticAnalysis.file || {};

  const hashes =
    staticAnalysis.hashes || {};

  const suspiciousAnalysis =
    result?.suspicious_analysis || {};

  const yara =
    result?.yara || {};

  const signature =
    result?.signature || {};

  const virustotal =
    result?.virustotal || {};

  const ml =
    result?.ml_analysis || {};

  const finalFinding =
    result?.final_finding || {};


  // ==========================================================
  // INDICATORS
  // ==========================================================

  const indicators = [];

  const suspiciousApis =
    suspiciousAnalysis.suspicious_apis || [];


  suspiciousApis.forEach((api) => {
    indicators.push({
      label: `Suspicious API: ${api}`,
      severity: "medium",
    });
  });


  if (yara.yara_matched) {
    indicators.push({
      label: "YARA rule match detected",
      severity: "critical",
    });
  }


  if (signature.signature_matched) {
    indicators.push({
      label: "Known malware signature detected",
      severity: "critical",
    });
  }


  if (virustotal.found) {
    indicators.push({
      label: "VirusTotal threat detected",
      severity: "critical",
    });
  }


  if (indicators.length === 0) {
    indicators.push({
      label: "No suspicious indicators detected",
      severity: "low",
    });
  }


  // ==========================================================
  // DISPLAY VALUES
  // ==========================================================

  const riskScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        Number(
          finalFinding.risk_score ?? 0
        )
      )
    )
  );


  const classification =
    finalFinding.verdict ||
    ml.prediction ||
    "UNKNOWN";


  const threatLevel =
    finalFinding.threat_level ||
    ml.risk_level ||
    "LOW";


  const recommendedAction =
    classification === "MALICIOUS"
      ? "Escalate this file to a Security Analyst for further investigation."
      : classification === "SUSPICIOUS"
        ? "Review the suspicious indicators before allowing this file."
        : "No immediate threat identified. Continue normal security review.";


  const severity =
    threatLevel === "HIGH"
      ? "critical"
      : threatLevel === "MEDIUM"
        ? "medium"
        : "low";


  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div>

      <Topbar
        title="File Analysis"
        subtitle="Upload a suspicious file to run static analysis without executing it."
      />


      <div className="grid grid-cols-1 gap-6 px-8 py-6 xl:grid-cols-5">


        {/* =====================================================
            LEFT COLUMN
        ====================================================== */}

        <div className="space-y-6 xl:col-span-2">


          {/* ===================================================
              UPLOAD CARD
          ==================================================== */}

          <Card>

            <CardHeader
              eyebrow="Step 1"
              title="Upload suspicious file"
            />

            <div className="p-5">

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}

                onDragLeave={() => {
                  setDragging(false);
                }}

                onDrop={onDrop}

                onClick={() =>
                  inputRef.current?.click()
                }

                className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors ${
                  dragging
                    ? "border-orange-400 bg-orange-50"
                    : "border-line hover:border-orange-300 hover:bg-surface"
                }`}
              >

                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-50">

                  <UploadCloud className="h-6 w-6 text-orange-500" />

                </div>


                <p className="text-sm font-medium text-ink">
                  Drop a file here, or click to browse
                </p>


                <p className="text-xs text-ink-faint">
                  Executables, documents, and archives supported · max 100MB
                </p>


                <input
                  ref={inputRef}
                  type="file"
                  className="hidden"
                  onChange={onPick}
                />

              </div>


              {/* =================================================
                  SAMPLE BUTTON
              ================================================== */}

              <button
                type="button"
                onClick={() => {
                  setError(
                    "The sample file is not available for real backend analysis. Please upload an actual file."
                  );

                  setStatus("error");
                }}

                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-line px-4 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:border-orange-300 hover:text-orange-600"
              >

                <FileWarning className="h-4 w-4" />

                Try sample file: invoice.exe

              </button>


              {/* =================================================
                  ERROR
              ================================================== */}

              {status === "error" && error && (

                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">

                  <p className="text-sm font-medium text-red-700">
                    Analysis failed
                  </p>

                  <p className="mt-1 text-xs text-red-600">
                    {error}
                  </p>

                </div>

              )}

            </div>

          </Card>


          {/* ===================================================
              PIPELINE CARD
          ==================================================== */}

          <Card>

            <CardHeader
              eyebrow="Pipeline"
              title="Static analysis workflow"
            />

            <ul className="space-y-3 p-5">

              {[
                ["File hashing (MD5 / SHA-256)", Hash],
                ["File type & metadata extraction", FileCog],
                ["PE header & import table analysis", FileCog],
                ["YARA rule matching", ShieldAlert],
                ["Signature-based malware detection", ShieldAlert],
                ["Machine learning classification", ShieldAlert],
                ["Final threat assessment", ShieldAlert],
              ].map(([label, Icon]) => (

                <li
                  key={label}
                  className="flex items-center gap-3 text-sm text-ink-soft"
                >

                  <Icon className="h-4 w-4 shrink-0 text-orange-400" />

                  {label}

                </li>

              ))}

            </ul>

          </Card>

        </div>


        {/* =====================================================
            RIGHT COLUMN
        ====================================================== */}

        <div className="xl:col-span-3">

          <Card className="h-full">

            <CardHeader
              eyebrow="Step 2"
              title="Analysis result"
              action={
                status === "done" && (
                  <SeverityBadge severity={severity} />
                )
              }
            />


            {/* =================================================
                IDLE
            ================================================== */}

            {status === "idle" && (

              <div className="flex h-72 flex-col items-center justify-center gap-2 px-6 text-center">

                <FileCog className="h-8 w-8 text-ink-faint" />

                <p className="text-sm text-ink-soft">
                  Upload a file to see hashing, YARA matches,
                  ML classification, and a risk-scored verdict here.
                </p>

              </div>

            )}


            {/* =================================================
                SCANNING
            ================================================== */}

            {status === "scanning" && (

              <div className="flex h-72 flex-col items-center justify-center gap-3 px-6 text-center">

                <Loader2 className="h-7 w-7 animate-spin text-orange-500" />

                <p className="font-mono text-sm text-ink">
                  Scanning {fileName}…
                </p>

                <p className="text-xs text-ink-faint">
                  Uploading file, extracting features,
                  matching YARA rules and running ML classification
                </p>

              </div>

            )}


            {/* =================================================
                ERROR
            ================================================== */}

            {status === "error" && (

              <div className="flex h-72 flex-col items-center justify-center gap-3 px-6 text-center">

                <FileWarning className="h-8 w-8 text-red-400" />

                <p className="text-sm font-semibold text-ink">
                  Analysis could not be completed
                </p>

                <p className="max-w-md text-xs text-ink-faint">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setStatus("idle");
                    setError("");
                  }}

                  className="mt-2 rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink-soft hover:border-orange-300 hover:text-orange-600"
                >
                  Try another file
                </button>

              </div>

            )}


            {/* =================================================
                DONE
            ================================================== */}

            {status === "done" && (

              <div className="space-y-5 p-5">


                {/* =================================================
                    SAVED MESSAGE
                ================================================== */}

                <div className="flex items-center justify-between rounded-lg bg-surface px-3.5 py-2.5">

                  <p className="font-mono text-xs text-ink-soft">

                    Analysis ID{" "}

                    <span className="font-semibold text-ink">
                      {analysisResult?.analysis_id}
                    </span>

                    {" "}saved successfully

                  </p>

                  <CheckCircle2 className="h-4 w-4 text-orange-500" />

                </div>


                {/* =================================================
                    FILE INFORMATION
                ================================================== */}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                  <InfoRow
                    label="File name"
                    value={
                      fileInfo.filename ||
                      fileName ||
                      "—"
                    }
                    mono
                  />

                  <InfoRow
                    label="File type"
                    value={
                      fileInfo.file_type ||
                      "—"
                    }
                  />

                  <InfoRow
                    label="Size"
                    value={
                      fileInfo.size != null
                        ? `${Number(fileInfo.size).toLocaleString()} bytes`
                        : "—"
                    }
                  />

                  <InfoRow
                    label="SHA-256"
                    value={
                      hashes.sha256 ||
                      result?.sha256 ||
                      "—"
                    }
                    mono
                    truncate
                  />

                  <InfoRow
                    label="MD5"
                    value={
                      hashes.md5 ||
                      result?.md5 ||
                      "—"
                    }
                    mono
                  />

                </div>


                {/* =================================================
                    SUSPICIOUS INDICATORS
                ================================================== */}

                <div>

                  <p className="mb-2 font-mono text-[11px] uppercase tracking-widest text-ink-faint">
                    Suspicious indicators
                  </p>


                  <ul className="space-y-2">

                    {indicators.map((ind) => (

                      <li
                        key={ind.label}
                        className="flex items-center justify-between gap-3 rounded-lg border border-line px-3.5 py-2.5"
                      >

                        <span className="text-sm text-ink">
                          {ind.label}
                        </span>

                        <SeverityBadge
                          severity={ind.severity}
                        />

                      </li>

                    ))}

                  </ul>

                </div>


                {/* =================================================
                    ML DETAILS
                ================================================== */}

                <div className="rounded-lg border border-line p-4">

                  <p className="mb-3 font-mono text-[11px] uppercase tracking-widest text-ink-faint">
                    Machine learning analysis
                  </p>


                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                    <InfoRow
                      label="Prediction"
                      value={
                        ml.prediction ||
                        "—"
                      }
                    />

                    <InfoRow
                      label="Risk level"
                      value={
                        ml.risk_level ||
                        "—"
                      }
                    />

                    <InfoRow
                      label="Malware probability"
                      value={
                        ml.malware_probability != null
                          ? `${(
                              ml.malware_probability * 100
                            ).toFixed(2)}%`
                          : "—"
                      }
                    />

                    <InfoRow
                      label="Malware family"
                      value={
                        ml.malware_family ||
                        "None detected"
                      }
                    />

                    <InfoRow
                      label="Family probability"
                      value={
                        ml.family_probability != null
                          ? `${(
                              ml.family_probability * 100
                            ).toFixed(2)}%`
                          : "—"
                      }
                    />

                  </div>

                </div>


                {/* =================================================
                    FINAL FINDING
                ================================================== */}

                <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">

                  <div className="flex items-center justify-between">

                    <p className="font-mono text-[11px] uppercase tracking-widest text-orange-600">
                      Risk score
                    </p>

                    <p className="font-display text-2xl font-bold text-orange-700">

                      {riskScore}

                      <span className="text-sm font-normal text-orange-400">
                        /100
                      </span>

                    </p>

                  </div>


                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-orange-100">

                    <div
                      className="h-full rounded-full bg-orange-500 transition-all"
                      style={{
                        width: `${riskScore}%`,
                      }}
                    />

                  </div>


                  <p className="mt-3 text-sm text-ink">

                    <span className="font-semibold">
                      Classification:
                    </span>{" "}

                    {classification}

                  </p>


                  <p className="mt-1 text-sm text-ink-soft">

                    <span className="font-semibold">
                      Threat level:
                    </span>{" "}

                    {threatLevel}

                  </p>


                  <p className="mt-3 flex items-center gap-1.5 text-sm text-ink-soft">

                    <ShieldAlert className="h-4 w-4 text-orange-500" />

                    {recommendedAction}

                  </p>

                </div>


                {/* =================================================
                    ACTIONS
                ================================================== */}

                <div className="flex flex-col gap-2.5 sm:flex-row">

                  <button
                    type="button"
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
                  >

                    <CheckCircle2 className="h-4 w-4" />

                    Escalate to Security Analyst

                  </button>


                  <button
                    type="button"
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


// ============================================================
// INFO ROW
// ============================================================

function InfoRow({
  label,
  value,
  mono,
  truncate,
}) {
  return (
    <div className="rounded-lg border border-line px-3.5 py-2.5">

      <p className="font-mono text-[10px] uppercase tracking-widest text-ink-faint">
        {label}
      </p>

      <p
        className={`mt-1 text-sm text-ink ${
          mono ? "font-mono text-xs" : ""
        } ${
          truncate ? "truncate" : ""
        }`}
        title={value}
      >
        {value}
      </p>

    </div>
  );
}