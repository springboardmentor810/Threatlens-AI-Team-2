import { useState } from "react";
import { Bell, Shield, User, Palette, Save, AlertCircle } from "lucide-react";
import Topbar from "../components/Topbar";
import Card, { CardHeader } from "../components/Card";
import { useAuth } from "../context/AuthContext";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 ${
        checked ? "border-orange-500 bg-orange-500" : "border-line-strong bg-line-strong"
      }`}
    >
      <span
        className={`inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-sm ring-1 ring-black/5 transition-transform duration-200 ease-out ${
          checked ? "translate-x-[22px]" : "translate-x-[3px]"
        }`}
      />
    </button>
  );
}

export default function Settings() {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [saved, setSaved] = useState(false);
  const [profileError, setProfileError] = useState("");

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
    setProfileError("");
    setSaved(false);

    if (!name.trim()) {
      setProfileError("Name can't be empty.");
      return;
    }
    if (!EMAIL_PATTERN.test(email)) {
      setProfileError("Enter a valid email address.");
      return;
    }

    const result = updateProfile({ name: name.trim(), email: email.trim() });
    if (!result.success) {
      setProfileError(result.error);
      return;
    }
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
            {profileError && (
              <div className="flex items-start gap-2 rounded-lg border border-orange-300 bg-orange-50 px-3.5 py-2.5">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" />
                <p className="text-xs text-orange-700">{profileError}</p>
              </div>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-soft">Full name</label>
                <input
                  value={name}
                  onChange={(e) => { setName(e.target.value); setProfileError(""); }}
                  className="w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-sm text-ink focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-soft">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setProfileError(""); }}
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
              {saved && <span className="text-xs font-medium text-orange-600">Saved — your name and email are updated everywhere in the app.</span>}
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
              <li key={key} className="flex items-start justify-between gap-6 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink">{title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">{desc}</p>
                </div>
                <div className="shrink-0 pt-0.5">
                  <Toggle
                    checked={notifications[key]}
                    onChange={(v) => setNotifications((prev) => ({ ...prev, [key]: v }))}
                    label={title}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader eyebrow="Protection" title="Security" action={<Shield className="h-4 w-4 text-orange-400" />} />
          <ul className="divide-y divide-line">
            <li className="flex items-start justify-between gap-6 px-5 py-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink">Two-factor authentication</p>
                <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">Require a verification code in addition to your password.</p>
              </div>
              <div className="shrink-0 pt-0.5">
                <Toggle checked={security.twoFactor} onChange={(v) => setSecurity((s) => ({ ...s, twoFactor: v }))} label="Two-factor authentication" />
              </div>
            </li>
            <li className="flex items-start justify-between gap-6 px-5 py-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink">Auto-lock idle sessions</p>
                <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">Sign out automatically after 30 minutes of inactivity.</p>
              </div>
              <div className="shrink-0 pt-0.5">
                <Toggle checked={security.autoLockSession} onChange={(v) => setSecurity((s) => ({ ...s, autoLockSession: v }))} label="Auto-lock idle sessions" />
              </div>
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
