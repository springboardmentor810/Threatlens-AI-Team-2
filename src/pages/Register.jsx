import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ScanLine,
  AlertCircle,
  UserCog,
  Users,
  FlaskConical,
  Shield as ShieldIcon,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ROLES } from "../data/mockData";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getNameError(value) {
  if (!value) return "";
  if (value.trim().length < 2) return "Enter your full name.";
  return "";
}
function getEmailError(value) {
  if (!value) return "";
  if (!value.includes("@")) return "Email must contain an @ symbol.";
  if (!EMAIL_PATTERN.test(value)) return "Enter a valid email address, e.g. you@organization.com.";
  return "";
}
function getPasswordError(value) {
  if (!value) return "";
  if (value.length < 6) return "Password must be at least 6 characters.";
  if (!/[a-zA-Z]/.test(value)) return "Password must include at least one letter.";
  return "";
}
function getConfirmError(password, confirm) {
  if (!confirm) return "";
  if (password !== confirm) return "Passwords don't match.";
  return "";
}

const ROLE_META = {
  analyst: { icon: UserCog },
  soc: { icon: Users },
  admin: { icon: ShieldIcon },
  researcher: { icon: FlaskConical },
};

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [roleId, setRoleId] = useState("analyst");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [touched, setTouched] = useState({ name: false, email: false, password: false, confirm: false });
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Create account — ThreatLens AI";
  }, []);

  const nameError = getNameError(name);
  const emailError = getEmailError(email);
  const passwordError = getPasswordError(password);
  const confirmError = getConfirmError(password, confirm);
  const isValid =
    name.trim().length > 1 &&
    email.length > 0 &&
    password.length > 0 &&
    confirm.length > 0 &&
    !nameError && !emailError && !passwordError && !confirmError;

  function handleSubmit(e) {
    e.preventDefault();
    setTouched({ name: true, email: true, password: true, confirm: true });
    setFormError("");
    if (!isValid) return;
    setSubmitting(true);
    setTimeout(() => {
      const result = register({ name: name.trim(), email, password, roleId });
      if (!result.success) {
        setFormError(result.error);
        setSubmitting(false);
        return;
      }
      navigate("/login", { state: { justRegistered: true, registeredEmail: email } });
    }, 650);
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-white">
      {/* Corner ribbon */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-72 rotate-[32deg] bg-gradient-to-l from-ink-faint/30 via-orange-300 to-orange-500" />

      {/* Ambient background texture */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute bottom-6 right-4 h-40 w-72 opacity-40"
          style={{
            backgroundImage: "radial-gradient(#ffab6b 1px, transparent 1px)",
            backgroundSize: "18px 18px",
          }}
        />
        <svg className="absolute bottom-0 left-0 h-64 w-full" viewBox="0 0 1200 240" preserveAspectRatio="none">
          <path d="M0,160 C200,120 350,200 550,160 C750,120 900,190 1200,150 L1200,240 L0,240 Z" fill="#fff5ee" />
          <path d="M0,190 C220,150 380,220 600,185 C820,150 980,210 1200,175 L1200,240 L0,240 Z" fill="#ffe8d8" opacity="0.7" />
        </svg>
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center justify-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500">
              <ShieldCheck className="h-6 w-6 text-white" strokeWidth={2} />
            </div>
            <div>
              <p className="font-display text-xl font-bold leading-tight text-ink">
                ThreatLens <span className="text-orange-500">AI</span>
              </p>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
                Malware Classification &amp; Threat Detection
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-line bg-white p-8 shadow-[0_20px_60px_-15px_rgba(255,94,26,0.18)]">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-orange-500">
             
            </p>
            <h2 className="mt-1.5 font-display text-2xl font-semibold text-ink">Create your account</h2>
            <p className="mt-2 text-sm text-ink-soft">
              Register first, then sign in 
            </p>

            {formError && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-orange-300 bg-orange-50 px-3.5 py-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" />
                <p className="text-xs text-orange-700">
                  {formError}{" "}
                  {formError.includes("already exists") && (
                    <Link to="/login" className="font-semibold underline">Sign in</Link>
                  )}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-soft">Full name</label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                    placeholder="Jane Doe"
                    aria-invalid={touched.name && !!nameError}
                    className={`w-full rounded-xl border bg-paper py-2.5 pl-10 pr-3.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 ${
                      touched.name && nameError
                        ? "border-orange-500 focus:ring-orange-100"
                        : "border-line focus:border-orange-400 focus:ring-orange-100"
                    }`}
                  />
                </div>
                {touched.name && nameError && <p className="mt-1.5 text-xs text-orange-600">{nameError}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-soft">Work email</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                    placeholder="you@organization.com"
                    aria-invalid={touched.email && !!emailError}
                    className={`w-full rounded-xl border bg-paper py-2.5 pl-10 pr-3.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 ${
                      touched.email && emailError
                        ? "border-orange-500 focus:ring-orange-100"
                        : "border-line focus:border-orange-400 focus:ring-orange-100"
                    }`}
                  />
                </div>
                {touched.email && emailError && <p className="mt-1.5 text-xs text-orange-600">{emailError}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-soft">Password</label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                    placeholder="At least 6 characters"
                    aria-invalid={touched.password && !!passwordError}
                    className={`w-full rounded-xl border bg-paper py-2.5 pl-10 pr-10 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 ${
                      touched.password && passwordError
                        ? "border-orange-500 focus:ring-orange-100"
                        : "border-line focus:border-orange-400 focus:ring-orange-100"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-faint hover:text-orange-500"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {touched.password && passwordError ? (
                  <p className="mt-1.5 text-xs text-orange-600">{passwordError}</p>
                ) : (
                  <p className="mt-1.5 text-xs text-ink-faint">Minimum 6 characters, must include a letter.</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-soft">Confirm password</label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
                    placeholder="Re-enter your password"
                    aria-invalid={touched.confirm && !!confirmError}
                    className={`w-full rounded-xl border bg-paper py-2.5 pl-10 pr-3.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 ${
                      touched.confirm && confirmError
                        ? "border-orange-500 focus:ring-orange-100"
                        : "border-line focus:border-orange-400 focus:ring-orange-100"
                    }`}
                  />
                </div>
                {touched.confirm && confirmError && <p className="mt-1.5 text-xs text-orange-600">{confirmError}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-soft">Role</label>
                <div className="grid grid-cols-2 gap-2">
                  {ROLES.map((role) => {
                    const RoleIcon = ROLE_META[role.id]?.icon ?? UserCog;
                    const active = roleId === role.id;
                    return (
                      <button
                        type="button"
                        key={role.id}
                        onClick={() => setRoleId(role.id)}
                        className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-xs font-medium transition-colors ${
                          active
                            ? "border-orange-400 bg-orange-50 text-orange-700"
                            : "border-line text-ink-soft hover:border-line-strong hover:text-ink"
                        }`}
                      >
                        <RoleIcon className={`h-4 w-4 shrink-0 ${active ? "text-orange-500" : "text-ink-faint"}`} strokeWidth={2} />
                        {role.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:from-orange-600 hover:to-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <ScanLine className="h-4 w-4 animate-pulse" />
                    Creating account…
                  </>
                ) : (
                  <>
                    Create account
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-ink-soft">
              Already have an account?{" "}
              <Link to="/login" className="font-semibold text-orange-600 hover:text-orange-700">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
