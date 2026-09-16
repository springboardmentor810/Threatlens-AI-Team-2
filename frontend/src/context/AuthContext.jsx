import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  loginUser,
  registerUser,
  getCurrentUser,
  updateUserProfile,
  logoutUser,
} from "../api/api";

const AuthContext = createContext(null);

function mapUser(user) {
  return {
    id: user.id,
    name: user.full_name,
    email: user.email,
    username: user.username,
    role: user.role,
    roleId: user.role,
    isActive: user.is_active,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    restoreSession();
  }, []);

  async function login({ email, password }) {
    try {
      setLoading(true);

      const tokenData = await loginUser(
        email,
        password
      );

      localStorage.setItem(
        "threatlens_token",
        tokenData.access_token
      );

      const profile = await getCurrentUser();

      setUser(mapUser(profile));

      return {
        success: true,
      };
    } catch (error) {
      localStorage.removeItem(
        "threatlens_token"
      );

      return {
        success: false,
        error:
          error.message ||
          "Login failed. Please try again.",
      };
    } finally {
      setLoading(false);
    }
  }

  async function register({
    name,
    email,
    username,
    password,
  }) {
    try {
      setLoading(true);

      await registerUser({
        email,
        username,
        full_name: name,
        password,
      });

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error.message ||
          "Registration failed. Please try again.",
      };
    } finally {
      setLoading(false);
    }
  }

  async function restoreSession() {
    const token = localStorage.getItem(
      "threatlens_token"
    );

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const profile = await getCurrentUser();

      setUser(mapUser(profile));
    } catch {
      localStorage.removeItem(
        "threatlens_token"
      );

      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    logoutUser();
    setUser(null);
  }

  async function updateProfile({
    name,
    email,
  }) {
    try {
      const updatedUser =
        await updateUserProfile({
          full_name: name,
          email,
        });

      const mappedUser =
        mapUser(updatedUser);

      setUser(mappedUser);

      return {
        success: true,
        user: mappedUser,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error.message ||
          "Unable to update your profile.",
      };
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        register,
        updateProfile,
        restoreSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error(
      "useAuth must be used within AuthProvider"
    );
  }

  return ctx;
}