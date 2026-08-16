import { useState } from "react";
import { Bell, Shield, User, Palette, Save } from "lucide-react";
import Topbar from "../components/Topbar";
import Card, { CardHeader } from "../components/Card";
import { useAuth } from "../context/AuthContext";

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-orange-500" : "bg-line-strong"}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

export default function Settings() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [saved, setSaved] = useState(false);

  const [notifications, setNotifications] = useState({
    criticalAlerts: true,
    weeklyDigest: true,
    scanComplete: false,
    productUpdates: false,
  });

  const [security, setSecurity] = useState({
    twoFactor: true,
    autoLockSession: true,
  });

  function handleSave(e) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  }

  return (
    <div>
      <Topbar title="Settings" subtitle="Manage your profile, notifications, and security preferences." />

      <div className="mx-auto max-w-3xl space-y-6 px-8 py-6">
        <Card>
          <CardHeader eyebrow="Account" title="Profile" action={<User className="h-4 w-4 text-orange-400" />} />
          <form onSubmit={handleSave} className="space-y-4 p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-soft">Full name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-sm text-ink focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-soft">Email</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-sm text-ink focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink-soft">Role</label>
              <input
                disabled
                value={user?.role ?? ""}
                className="w-full cursor-not-allowed rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm text-ink-soft"
              />
              <p className="mt-1.5 text-xs text-ink-faint">Roles are assigned by an administrator.</p>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
              >
                <Save className="h-4 w-4" />
                Save changes
              </button>
              {saved && <span className="text-xs font-medium text-orange-600">Saved.</span>}
            </div>
          </form>
        </Card>

        <Card>
          <CardHeader eyebrow="Preferences" title="Notifications" action={<Bell className="h-4 w-4 text-orange-400" />} />
          <ul className="divide-y divide-line">
            {[
              ["criticalAlerts", "Critical alerts", "Get notified immediately when a critical threat is detected."],
              ["weeklyDigest", "Weekly digest", "A summary of scans, threats, and analytics every Monday."],
              ["scanComplete", "Scan completion", "Notify when a file analysis job finishes."],
              ["productUpdates", "Product updates", "News about new detection models and platform features."],
            ].map(([key, title, desc]) => (
              <li key={key} className="flex items-center justify-between gap-4 px-5 py-4">
                <div>
                  <p className="text-sm font-medium text-ink">{title}</p>
                  <p className="mt-0.5 text-xs text-ink-soft">{desc}</p>
                </div>
                <Toggle
                  checked={notifications[key]}
                  onChange={(v) => setNotifications((prev) => ({ ...prev, [key]: v }))}
                />
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader eyebrow="Protection" title="Security" action={<Shield className="h-4 w-4 text-orange-400" />} />
          <ul className="divide-y divide-line">
            <li className="flex items-center justify-between gap-4 px-5 py-4">
              <div>
                <p className="text-sm font-medium text-ink">Two-factor authentication</p>
                <p className="mt-0.5 text-xs text-ink-soft">Require a verification code in addition to your password.</p>
              </div>
              <Toggle checked={security.twoFactor} onChange={(v) => setSecurity((s) => ({ ...s, twoFactor: v }))} />
            </li>
            <li className="flex items-center justify-between gap-4 px-5 py-4">
              <div>
                <p className="text-sm font-medium text-ink">Auto-lock idle sessions</p>
                <p className="mt-0.5 text-xs text-ink-soft">Sign out automatically after 30 minutes of inactivity.</p>
              </div>
              <Toggle checked={security.autoLockSession} onChange={(v) => setSecurity((s) => ({ ...s, autoLockSession: v }))} />
            </li>
          </ul>
        </Card>

        <Card>
          <CardHeader eyebrow="Interface" title="Appearance" action={<Palette className="h-4 w-4 text-orange-400" />} />
          <div className="p-5">
            <p className="text-sm text-ink-soft">
              ThreatLens AI uses a fixed white &amp; orange console theme for consistent risk signaling across the platform.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <span className="h-8 w-8 rounded-lg border border-line bg-paper" />
              <span className="h-8 w-8 rounded-lg bg-orange-500" />
              <span className="h-8 w-8 rounded-lg bg-orange-100" />
              <span className="h-8 w-8 rounded-lg bg-ink" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
