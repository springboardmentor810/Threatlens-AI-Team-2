import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  UploadCloud,
  ShieldHalf,
  Radar,
  BrainCircuit,
  BellRing,
  BarChart3,
  Users,
  ShieldCheck,
  Settings as SettingsIcon,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const NAV = [
  { to: "/app", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/app/file-analysis", label: "File Analysis", icon: UploadCloud },
  { to: "/app/classification", label: "Classification", icon: ShieldHalf },
  { to: "/app/threat-monitoring", label: "Threat Monitoring", icon: Radar },
  { to: "/app/ai-prediction", label: "AI Prediction", icon: BrainCircuit },
  { to: "/app/alerts", label: "Alerts", icon: BellRing },
  { to: "/app/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/app/users", label: "User Management", icon: Users, adminOnly: true },
  { to: "/app/settings", label: "Settings", icon: SettingsIcon },
];

export default function Sidebar() {
  const { user } = useAuth();

  return (
    <aside className="fixed inset-y-0 left-0 z-20 flex w-64 flex-col border-r border-line bg-paper">
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-line">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500">
          <ShieldCheck className="h-5 w-5 text-white" strokeWidth={2.25} />
        </div>
        <div>
          <p className="font-display text-[15px] font-bold leading-tight text-ink">ThreatLens</p>
          <p className="font-mono text-[10px] uppercase tracking-widest text-orange-500 leading-tight">AI Security</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {NAV.filter((item) => !item.adminOnly || user?.roleId === "admin").map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-orange-50 text-orange-700"
                  : "text-ink-soft hover:bg-surface hover:text-ink"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={`h-4.5 w-4.5 ${isActive ? "text-orange-500" : "text-ink-faint group-hover:text-ink-soft"}`}
                  strokeWidth={2}
                />
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-line px-4 py-4">
        <div className="flex items-center gap-2 rounded-lg bg-surface px-3 py-2.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500" />
          </span>
          <p className="font-mono text-[11px] text-ink-soft">Engine status: <span className="text-ink">nominal</span></p>
        </div>
      </div>
    </aside>
  );
}
