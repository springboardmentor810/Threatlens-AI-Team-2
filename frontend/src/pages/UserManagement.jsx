import { useCallback, useEffect, useMemo, useState } from "react";
import {
  UserPlus,
  AlertCircle,
  RefreshCw,
  Users,
} from "lucide-react";

import Topbar from "../components/Topbar";
import Card, { CardHeader } from "../components/Card";
import { apiRequest } from "../api/api";
import { useAuth } from "../context/AuthContext";

const ROLES = [
  {
    id: "analyst",
    label: "Analyst",
    permissions: [
      "Upload suspicious files",
      "Run static analysis scans",
      "View malware classification reports",
      "Access threat monitoring dashboards",
      "Review alerts and security notifications",
      "Generate investigation reports",
    ],
  },
  {
    id: "security_analyst",
    label: "Security Analyst",
    permissions: [
      "Upload suspicious files",
      "Run static analysis scans",
      "View malware classification reports",
      "Access threat monitoring dashboards",
      "Review alerts and security notifications",
      "Generate investigation reports",
    ],
  },
  {
    id: "admin",
    label: "Administrator",
    permissions: [
      "Manage users and roles",
      "Configure platform settings",
      "Manage integrations and APIs",
      "Access all dashboards and reports",
      "Monitor platform activities",
      "Manage security policies",
    ],
  },
];

const STATUS_STYLE = {
  active: "bg-orange-50 text-orange-700",
  inactive: "bg-surface-2 text-ink-soft",
};

function formatRole(role) {
  if (!role) {
    return "Unknown";
  }

  const labels = {
    analyst: "Analyst",
    security_analyst: "Security Analyst",
    admin: "Administrator",
  };

  return (
    labels[role] ||
    role
      .replaceAll("_", " ")
      .replace(/\b\w/g, (character) =>
        character.toUpperCase()
      )
  );
}

function formatLastActive(createdAt) {
  if (!createdAt) {
    return "—";
  }

  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function UserManagement() {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await apiRequest("/admin/users", {
        method: "GET",
      });

      setUsers(Array.isArray(data) ? data : []);
    } catch (requestError) {
      if (requestError.status === 403) {
        setError(
          "Administrator access is required to view platform users."
        );
      } else if (requestError.status === 401) {
        setError(
          "Your session is no longer valid. Please sign in again."
        );
      } else {
        setError(
          requestError.message ||
            "Unable to load users."
        );
      }

      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleRoleChange = async (userId, newRole) => {
    const selectedUser = users.find(
      (user) => user.id === userId
    );

    if (!selectedUser || selectedUser.role === newRole) {
      return;
    }

    const previousRole = selectedUser.role;

    setUpdatingUserId(userId);
    setError("");

    try {
      await apiRequest(
        `/admin/users/${userId}/role`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            role: newRole,
          }),
        }
      );

      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user.id === userId
            ? {
                ...user,
                role: newRole,
              }
            : user
        )
      );
    } catch (requestError) {
      setError(
        requestError.message ||
          "Unable to change the user's role."
      );

      // Restore the previous value visually if the request fails.
      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user.id === userId
            ? {
                ...user,
                role: previousRole,
              }
            : user
        )
      );
    } finally {
      setUpdatingUserId(null);
    }
  };

  const roleCounts = useMemo(() => {
    return {
      analyst: users.filter(
        (user) => user.role === "analyst"
      ).length,

      securityAnalyst: users.filter(
        (user) => user.role === "security_analyst"
      ).length,

      admin: users.filter(
        (user) => user.role === "admin"
      ).length,
    };
  }, [users]);

  return (
    <div>
      <Topbar
        title="User Management"
        subtitle="Manage users, roles, and platform-wide permissions."
      />

      <div className="px-8 py-6 space-y-6">

        {/* ======================================================
            TEAM MEMBERS
        ====================================================== */}

        <Card>
          <CardHeader
            eyebrow="Access control"
            title="Team members"
            action={
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={loadUsers}
                  disabled={loading}
                  className="flex items-center gap-2 rounded-lg border border-line px-3.5 py-2 text-xs font-semibold text-ink-soft transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${
                      loading ? "animate-spin" : ""
                    }`}
                  />

                  Refresh
                </button>

                <button
                  type="button"
                  disabled
                  title="User invitation is not implemented by the current backend."
                  className="flex cursor-not-allowed items-center gap-2 rounded-lg bg-orange-500 px-3.5 py-2 text-xs font-semibold text-white opacity-60"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Invite user
                </button>
              </div>
            }
          />

          {/* Error */}

          {error && (
            <div className="mx-5 mt-5 flex items-start gap-2 rounded-lg border border-orange-300 bg-orange-50 px-3.5 py-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" />

              <div>
                <p className="text-xs font-medium text-orange-700">
                  {error}
                </p>

                {error.includes(
                  "Administrator access"
                ) && (
                  <p className="mt-1 text-[11px] text-orange-600">
                    Your current account does not have the
                    administrator role.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Loading */}

          {loading ? (
            <div className="flex items-center justify-center px-5 py-16">
              <div className="flex items-center gap-2 text-sm text-ink-soft">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Loading users...
              </div>
            </div>
          ) : error && users.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
              <Users className="h-8 w-8 text-ink-faint" />

              <p className="mt-3 text-sm font-medium text-ink">
                User list unavailable
              </p>

              <p className="mt-1 text-xs text-ink-soft">
                The backend denied access to the administrator
                user list.
              </p>
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
              <Users className="h-8 w-8 text-ink-faint" />

              <p className="mt-3 text-sm font-medium text-ink">
                No users found
              </p>

              <p className="mt-1 text-xs text-ink-soft">
                There are currently no registered users.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-[11px] font-mono uppercase tracking-wide text-ink-faint">

                    <th className="px-5 py-3 font-medium">
                      Name
                    </th>

                    <th className="px-5 py-3 font-medium">
                      Role
                    </th>

                    <th className="px-5 py-3 font-medium">
                      Status
                    </th>

                    <th className="px-5 py-3 font-medium">
                      Registered
                    </th>

                    <th className="px-5 py-3 font-medium">
                      Actions
                    </th>

                  </tr>
                </thead>

                <tbody>
                  {users.map((user) => {
                    const status = user.is_active
                      ? "active"
                      : "inactive";

                    const isCurrentUser =
                      user.id === currentUser?.id;

                    const isUpdating =
                      updatingUserId === user.id;

                    return (
                      <tr
                        key={user.id}
                        className="border-b border-line last:border-0 hover:bg-surface/60"
                      >

                        {/* Name */}

                        <td className="px-5 py-3.5">
                          <p className="font-medium text-ink">
                            {user.full_name ||
                              user.username ||
                              "Unnamed user"}
                          </p>

                          <p className="text-xs text-ink-faint">
                            {user.email}
                          </p>
                        </td>

                        {/* Current role */}

                        <td className="px-5 py-3.5 text-ink-soft">
                          {formatRole(user.role)}
                        </td>

                        {/* Status */}

                        <td className="px-5 py-3.5">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-mono font-medium capitalize ${
                              STATUS_STYLE[status]
                            }`}
                          >
                            {status}
                          </span>
                        </td>

                        {/* Registered */}

                        <td className="px-5 py-3.5 text-ink-faint">
                          {formatLastActive(
                            user.created_at
                          )}
                        </td>

                        {/* Actions */}

                        <td className="px-5 py-3.5">
                          {isCurrentUser ? (
                            <span className="text-xs text-ink-faint">
                              Current account
                            </span>
                          ) : (
                            <select
                              value={user.role}
                              disabled={isUpdating}
                              onChange={(event) =>
                                handleRoleChange(
                                  user.id,
                                  event.target.value
                                )
                              }
                              className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs text-ink outline-none transition-colors focus:border-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <option value="analyst">
                                Analyst
                              </option>

                              <option value="security_analyst">
                                Security Analyst
                              </option>

                              <option value="admin">
                                Administrator
                              </option>
                            </select>
                          )}
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* ======================================================
            ROLE PERMISSIONS
        ====================================================== */}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {ROLES.map((role) => (
            <Card key={role.id}>
              <div className="p-5">

                <p className="font-display text-[15px] font-semibold text-ink">
                  {role.label}
                </p>

                <ul className="mt-3 space-y-2">
                  {role.permissions.map((permission) => (
                    <li
                      key={permission}
                      className="flex items-start gap-2 text-xs text-ink-soft"
                    >
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-orange-400" />

                      {permission}
                    </li>
                  ))}
                </ul>

              </div>
            </Card>
          ))}
        </div>

        {/* ======================================================
            ROLE SUMMARY
        ====================================================== */}

        {!error && !loading && users.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

            <Card>
              <div className="p-5">
                <p className="text-xs font-mono uppercase tracking-wide text-ink-faint">
                  Analyst accounts
                </p>

                <p className="mt-2 font-display text-2xl font-semibold text-ink">
                  {roleCounts.analyst}
                </p>
              </div>
            </Card>

            <Card>
              <div className="p-5">
                <p className="text-xs font-mono uppercase tracking-wide text-ink-faint">
                  Security Analyst accounts
                </p>

                <p className="mt-2 font-display text-2xl font-semibold text-ink">
                  {roleCounts.securityAnalyst}
                </p>
              </div>
            </Card>

            <Card>
              <div className="p-5">
                <p className="text-xs font-mono uppercase tracking-wide text-ink-faint">
                  Administrator accounts
                </p>

                <p className="mt-2 font-display text-2xl font-semibold text-ink">
                  {roleCounts.admin}
                </p>
              </div>
            </Card>

          </div>
        )}

      </div>
    </div>
  );
}