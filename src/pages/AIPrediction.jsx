import { BrainCircuit, Sparkles } from "lucide-react";
import Topbar from "../components/Topbar";
import Card, { CardHeader } from "../components/Card";
import SeverityBadge from "../components/SeverityBadge";
import { predictionInsights } from "../data/mockData";

export default function AIPrediction() {
  return (
    <div>
      <Topbar title="AI Prediction" subtitle="Behavioral analysis and unknown-threat prediction from the ML engine." />

      <div className="px-8 py-6 space-y-6">
        <Card className="hex-noise bg-surface !border-orange-100">
          <div className="flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-500">
                <BrainCircuit className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-widest text-orange-500">Prediction engine</p>
                <p className="font-display text-lg font-semibold text-ink">Behavioral pattern model v2.3</p>
                <p className="text-sm text-ink-soft">Trained on structural + behavioral features across 1.2M labeled samples.</p>
              </div>
            </div>
            <button className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600">
              <Sparkles className="h-4 w-4" />
              Run new prediction
            </button>
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {predictionInsights.map((p) => (
            <Card key={p.title}>
              <div className="flex items-center justify-between px-5 pt-5">
                <SeverityBadge severity={p.severity} />
                <p className="font-mono text-xs text-ink-faint">{p.confidence}% confidence</p>
              </div>
              <div className="px-5 pb-5 pt-3">
                <p className="font-display text-[15px] font-semibold leading-snug text-ink">{p.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{p.description}</p>
                <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-orange-50">
                  <div className="h-full rounded-full bg-orange-500" style={{ width: `${p.confidence}%` }} />
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader eyebrow="Workflow" title="Threat intelligence pipeline" />
          <div className="grid grid-cols-1 divide-y divide-line sm:grid-cols-4 sm:divide-x sm:divide-y-0">
            {[
              "Behavioral feature extraction",
              "Similarity search vs. known families",
              "Unknown-threat probability scoring",
              "Risk analytics dashboard update",
            ].map((step, i) => (
              <div key={step} className="p-5">
                <p className="font-mono text-xs text-orange-500">Stage {i + 1}</p>
                <p className="mt-1.5 text-sm text-ink">{step}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
