import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ScanLine,
  Search,
  Bug,
  Globe,
  BrainCircuit,
  BarChart3,
  Zap,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

function Hex({ icon: Icon, className = "", size = "h-14 w-14", iconSize = "h-5 w-5" }) {
  return (
    <div
      className={`flex ${size} items-center justify-center border border-orange-300/70 text-orange-500 ${className}`}
      style={{ clipPath: "polygon(25% 5%, 75% 5%, 100% 50%, 75% 95%, 25% 95%, 0% 50%)" }}
    >
      <Icon className={iconSize} strokeWidth={1.75} />
    </div>
  );
}

function DotMap() {
  // Approximate scattered "world map" dot texture in the top-right corner.
  const dots = useMemo(() => {
    const pts = [];
    for (let i = 0; i < 220; i++) {
      pts.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        r: Math.random() > 0.85 ? 1.6 : 1,
        o: 0.15 + Math.random() * 0.35,
      });
    }
    return pts;
  }, []);
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={d.r} fill="#ff8a3d" opacity={d.o} />
      ))}
    </svg>
  );
}

export default function Login() {
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.registeredEmail ?? "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });
  const [authError, setAuthError] = useState("");
  const [justRegistered, setJustRegistered] = useState(!!location.state?.justRegistered);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Sign in — ThreatLens AI";
  }, []);

  const emailError = getEmailError(email);
  const passwordError = getPasswordError(password);
  const isValid = email.length > 0 && password.length > 0 && !emailError && !passwordError;

  function handleSubmit(e) {
    e.preventDefault();
    setTouched({ email: true, password: true });
    setAuthError("");
    if (!isValid) return;
    setScanning(true);
    setTimeout(() => {
      const result = login({ email, password });
      if (!result.success) {
        setAuthError(result.error);
        setScanning(false);
        return;
      }
      navigate("/app");
    }, 650);
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-white">
      {/* Corner ribbon */}
      <div className="pointer-events-none absolute -left-16 -top-16 h-40 w-72 rotate-[-32deg] bg-gradient-to-r from-ink-faint/30 via-orange-300 to-orange-500" />

      {/* Ambient background texture */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-0 top-0 h-[46%] w-[42%] opacity-70">
          <DotMap />
        </div>
        <svg className="absolute bottom-0 left-0 h-64 w-full" viewBox="0 0 1200 240" preserveAspectRatio="none">
          <path d="M0,160 C200,120 350,200 550,160 C750,120 900,190 1200,150 L1200,240 L0,240 Z" fill="#fff5ee" />
          <path d="M0,190 C220,150 380,220 600,185 C820,150 980,210 1200,175 L1200,240 L0,240 Z" fill="#ffe8d8" opacity="0.7" />
        </svg>
        <div
          className="absolute bottom-6 left-4 h-40 w-72 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(#ffab6b 1px, transparent 1px)",
            backgroundSize: "18px 18px",
          }}
        />
      </div>

      <div className="relative z-10 grid min-h-screen grid-cols-1 lg:grid-cols-[1.15fr_1fr]">
        {/* Left: brand / illustration panel */}
        <div className="flex flex-col justify-between px-8 py-10 sm:px-14 sm:py-14">
          <div className="flex items-center gap-3">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500">
              <ShieldCheck className="h-6 w-6 text-white" strokeWidth={2} />
              <Search className="absolute h-3.5 w-3.5 translate-x-2 translate-y-2 text-white/90" strokeWidth={2.5} />
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

          <div className="my-10 flex flex-1 items-center">
            <div className="grid w-full grid-cols-1 items-center gap-10 lg:grid-cols-[1fr_auto]">
              <div className="max-w-md">
                <h1 className="font-display text-4xl font-semibold leading-[1.15] text-ink sm:text-[2.65rem]">
                  Every file tells you<br />what it's <span className="text-orange-500">hiding.</span>
                </h1>
                <p className="mt-4 text-sm leading-relaxed text-ink-soft">
                  
                </p>
              </div>

              {/* Shield / lock illustration */}
              <div className="relative mx-auto h-72 w-72 shrink-0 sm:h-80 sm:w-80">
                <div className="absolute inset-0 rounded-full bg-orange-100/70 blur-2xl" />
                <div className="absolute inset-6 rounded-full border border-orange-200" />
                <div className="absolute inset-14 rounded-full border border-dashed border-orange-200" />

                <div className="absolute inset-0 flex items-center justify-center">
                  <svg width="190" height="210" viewBox="0 0 190 210" fill="none">
                    <path
                      d="M95 4 L182 34 V96 C182 148 145 188 95 206 C45 188 8 148 8 96 V34 Z"
                      fill="white"
                      stroke="#ff5e1a"
                      strokeWidth="4"
                    />
                    <rect x="65" y="108" width="60" height="52" rx="9" fill="#ff5e1a" />
                    <path d="M77 108 V90 a18 18 0 0 1 36 0 v18" stroke="#ff5e1a" strokeWidth="8" fill="none" strokeLinecap="round" />
                    <circle cx="95" cy="130" r="6.5" fill="white" />
                    <rect x="91.5" y="134" width="7" height="14" rx="3" fill="white" />
                  </svg>
                </div>

                {/* Orbiting hex icons */}
                <Hex icon={Lock} className="absolute -right-3 -top-6 bg-white" size="h-11 w-11" iconSize="h-4.5 w-4.5" />
                <Hex icon={BrainCircuit} className="absolute -right-8 top-24 bg-white" />
                <Hex icon={Search} className="absolute right-2 bottom-14 bg-white" />
                <Hex icon={Bug} className="absolute right-16 -bottom-4 bg-white" />
                <Hex icon={Globe} className="absolute left-4 -bottom-6 bg-white" size="h-12 w-12" iconSize="h-4.5 w-4.5" />
              </div>
            </div>
          </div>

          <div className="grid max-w-lg grid-cols-3 gap-6 border-t border-line pt-6">
            {[
              [ShieldCheck, "82/100", "Sample risk score"],
              [BarChart3, "6", "Static indicators"],
              [Zap, "<1s", "Verdict latency"],
            ].map(([Icon, value, label]) => (
              <div key={label} className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-500">
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </div>
                <div>
                  <p className="font-display text-lg font-bold leading-tight text-ink">{value}</p>
                  <p className="text-[11px] leading-tight text-ink-faint">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: auth card */}
        <div className="flex items-center justify-center bg-surface/60 px-6 py-12 lg:bg-transparent">
          <div className="w-full max-w-sm rounded-3xl border border-line bg-white p-8 shadow-[0_20px_60px_-15px_rgba(255,94,26,0.18)]">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-orange-500">
              
            </p>
            <h2 className="mt-1.5 font-display text-2xl font-semibold text-ink">Sign in to your workspace</h2>
          

            {justRegistered && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-orange-200 bg-orange-50 px-3.5 py-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
                <p className="text-xs text-orange-700">Account created. Sign in with your new email and password below.</p>
              </div>
            )}
            {authError && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-orange-300 bg-orange-50 px-3.5 py-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" />
                <p className="text-xs text-orange-700">
                  {authError}{" "}
                  {authError.includes("No account") && (
                    <Link to="/register" className="font-semibold underline">Register now</Link>
                  )}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-soft">Work email</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setJustRegistered(false); setAuthError(""); }}
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
                    onChange={(e) => { setPassword(e.target.value); setAuthError(""); }}
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

              <button
                type="submit"
                disabled={scanning || (touched.email && touched.password && !isValid)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:from-orange-600 hover:to-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {scanning ? (
                  <>
                    <ScanLine className="h-4 w-4 animate-pulse" />
                    Verifying credentials…
                  </>
                ) : (
                  <>
                  Login
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-ink-soft">
              Don't have an account?{" "}
              <Link to="/register" className="font-semibold text-orange-600 hover:text-orange-700">
                Create one
              </Link>
            </p>
            <p className="mt-3 text-center text-xs text-ink-faint">
             
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
