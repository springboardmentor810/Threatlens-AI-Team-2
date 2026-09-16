import { ArrowDownRight, ArrowUpRight } from "lucide-react";

export default function StatCard({ label, value, delta, trend }) {
  const up = trend === "up";
  return (
    <div className="rounded-2xl border border-line bg-paper p-5">
      <p className="font-mono text-[11px] uppercase tracking-widest text-ink-faint">{label}</p>
      <div className="mt-3 flex items-end justify-between">
        <p className="font-display text-3xl font-semibold text-ink">{value}</p>
        {delta && (
          <span
            className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-mono font-medium ${
              up ? "bg-orange-50 text-orange-600" : "bg-surface-2 text-ink-soft"
            }`}
          >
            {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {delta}
          </span>
        )}
      </div>
    </div>
  );
}
