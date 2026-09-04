import { createContext, useContext, useState } from "react";
import { ROLES } from "../data/mockData";

const AuthContext = createContext(null);

// Seeded so the demo is usable immediately without registering first.
const SEED_ACCOUNTS = [
  { name: "Sundar Rangan", email: "demo@threatlens.io", password: "demo123", roleId: "analyst" },
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accounts, setAccounts] = useState(SEED_ACCOUNTS);

  function findAccount(email) {
    return accounts.find((a) => a.email.toLowerCase() === email.toLowerCase());
  }

  function register({ name, email, password, roleId }) {
    if (findAccount(email)) {
      return { success: false, error: "An account with this email already exists. Please sign in instead." };
    }
    const account = { name, email, password, roleId };
    setAccounts((prev) => [...prev, account]);
    return { success: true };
  }

  function login({ email, password, roleId }) {
    const account = findAccount(email);
    if (!account) {
      return { success: false, error: "No account found for this email. Please create one first." };
    }
    if (account.password !== password) {
      return { success: false, error: "Incorrect password. Please try again." };
    }
    const role = ROLES.find((r) => r.id === (roleId || account.roleId)) ?? ROLES[0];
    setUser({
      name: account.name,
      email: account.email,
      role: role.label,
      roleId: role.id,
      permissions: role.permissions,
    });
    return { success: true };
  }

  function logout() {
    setUser(null);
  }

  function updateProfile({ name, email }) {
    if (!user) return { success: false, error: "Not signed in." };
    const nextEmail = email?.trim() || user.email;
    const nextName = name?.trim() || user.name;

    if (nextEmail.toLowerCase() !== user.email.toLowerCase() && findAccount(nextEmail)) {
      return { success: false, error: "Another account already uses that email." };
    }

    setAccounts((prev) =>
      prev.map((a) =>
        a.email.toLowerCase() === user.email.toLowerCase()
          ? { ...a, name: nextName, email: nextEmail }
          : a
      )
    );
    setUser((prev) => ({ ...prev, name: nextName, email: nextEmail }));
    return { success: true };
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, register, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
