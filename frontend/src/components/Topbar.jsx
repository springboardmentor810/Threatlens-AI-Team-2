import { useNavigate } from "react-router-dom";
import { Search, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Topbar({ title, subtitle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-line bg-paper/90 px-8 py-5 backdrop-blur">
      <div>
        <h1 className="font-display text-xl font-semibold text-ink">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-ink-soft">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 sm:flex">
          <Search className="h-4 w-4 text-ink-faint" />
          <input
            type="text"
            placeholder="Search hash, file, alert ID…"
            className="w-56 bg-transparent font-mono text-xs text-ink placeholder:text-ink-faint focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3 border-l border-line pl-3">
          <div className="text-right hidden md:block">
            <p className="text-sm font-medium leading-tight text-ink">{user?.name}</p>
            <p className="font-mono text-[11px] leading-tight text-orange-600">{user?.role}</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500 font-display text-sm font-semibold text-white">
            {user?.name?.[0] ?? "A"}
          </div>
          <button
            onClick={handleLogout}
            title="Log out"
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-surface hover:text-orange-600"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
