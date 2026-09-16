const STYLES = {
  critical: "bg-orange-500 text-white",
  high: "bg-orange-100 text-orange-700 ring-1 ring-inset ring-orange-300",
  medium: "bg-orange-50 text-orange-600 ring-1 ring-inset ring-orange-200",
  low: "bg-surface-2 text-ink-soft ring-1 ring-inset ring-line",
  info: "bg-surface-2 text-ink-soft ring-1 ring-inset ring-line",
};

const LABELS = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
  info: "Info",
};

export default function SeverityBadge({ severity = "low", className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold font-mono uppercase tracking-wide ${STYLES[severity] ?? STYLES.low} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${severity === "critical" ? "bg-white" : "bg-current"}`} />
      {LABELS[severity] ?? severity}
    </span>
  );
}
