import React, { createContext, useContext, useMemo, useState } from "react";
import { authService } from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("customer");
  const [token, setToken] = useState(() => window.localStorage.getItem("aidep.auth.token"));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function login(credentials) {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.login(credentials);
      const nextToken = response?.token || response?.accessToken;
      if (nextToken) {
        window.localStorage.setItem("aidep.auth.token", nextToken);
        setToken(nextToken);
      }
      if (response?.user) {
        setUser(response.user);
        setRole(response.user.role || role);
      }
      return response;
    } catch (loginError) {
      setError(loginError);
      throw loginError;
    } finally {
      setLoading(false);
    }
  }

  async function register(payload) {
    setLoading(true);
    setError(null);
    try {
      return await authService.register(payload);
    } catch (registerError) {
      setError(registerError);
      throw registerError;
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    window.localStorage.removeItem("aidep.auth.token");
    setToken(null);
    setUser(null);
  }

  const value = useMemo(
    () => ({ user, role, token, loading, error, setRole, login, register, logout }),
    [user, role, token, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
