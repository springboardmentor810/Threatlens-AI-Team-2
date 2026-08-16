import { createContext, useContext, useState } from "react";
import { ROLES } from "../data/mockData";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  function login({ email, roleId }) {
    const role = ROLES.find((r) => r.id === roleId) ?? ROLES[0];
    const name = email.split("@")[0].replace(/[._]/g, " ");
    setUser({
      name: name.replace(/\b\w/g, (c) => c.toUpperCase()) || "Analyst",
      email,
      role: role.label,
      roleId: role.id,
      permissions: role.permissions,
    });
  }

  function logout() {
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
