import { UserPlus } from "lucide-react";
import Topbar from "../components/Topbar";
import Card, { CardHeader } from "../components/Card";
import { users, ROLES } from "../data/mockData";

const STATUS_STYLE = {
  active: "bg-orange-50 text-orange-700",
  invited: "bg-surface-2 text-ink-soft",
  suspended: "bg-ink text-white",
};

export default function UserManagement() {
  return (
    <div>
      <Topbar title="User Management" subtitle="Manage users, roles, and platform-wide permissions." />

      <div className="px-8 py-6 space-y-6">
        <Card>
          <CardHeader
            eyebrow="Access control"
            title="Team members"
            action={
              <button className="flex items-center gap-2 rounded-lg bg-orange-500 px-3.5 py-2 text-xs font-semibold text-white hover:bg-orange-600">
                <UserPlus className="h-3.5 w-3.5" />
                Invite user
              </button>
            }
          />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-[11px] font-mono uppercase tracking-wide text-ink-faint">
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Role</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Last active</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-line last:border-0 hover:bg-surface/60">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-ink">{u.name}</p>
                      <p className="text-xs text-ink-faint">{u.email}</p>
                    </td>
                    <td className="px-5 py-3.5 text-ink-soft">{u.role}</td>
                    <td className="px-5 py-3.5">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-mono font-medium capitalize ${STATUS_STYLE[u.status]}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-ink-faint">{u.lastActive}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
          {ROLES.map((role) => (
            <Card key={role.id}>
              <div className="p-5">
                <p className="font-display text-[15px] font-semibold text-ink">{role.label}</p>
                <ul className="mt-3 space-y-2">
                  {role.permissions.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-xs text-ink-soft">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-orange-400" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
