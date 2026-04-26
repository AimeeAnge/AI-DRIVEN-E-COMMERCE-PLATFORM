import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authService } from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("customer");
  const [token, setToken] = useState(() => window.localStorage.getItem("aidep.auth.token"));
  const [loading, setLoading] = useState(() => Boolean(window.localStorage.getItem("aidep.auth.token")));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) return;

    let active = true;
    async function loadCurrentUser() {
      setLoading(true);
      setError(null);
      try {
        const response = await authService.me();
        const authData = response?.data || response || {};
        if (!active) return;
        if (authData?.user) {
          setUser(authData.user);
          setRole(authData.user.role || "customer");
        }
      } catch (meError) {
        console.log(meError);
        if (!active) return;
        window.localStorage.removeItem("aidep.auth.token");
        setToken(null);
        setUser(null);
        setError(meError);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadCurrentUser();
    return () => {
      active = false;
    };
  }, [token]);

  async function login(credentials) {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.login(credentials);
      const authData = response?.data || response || {};
      const nextToken = authData.access_token || authData.token || authData.accessToken;
      if (nextToken) {
        window.localStorage.setItem("aidep.auth.token", nextToken);
        setToken(nextToken);
      }
      let nextUser = authData?.user;
      if (!nextUser?.role && nextToken) {
        const currentUserResponse = await authService.me();
        const currentUserData = currentUserResponse?.data || currentUserResponse || {};
        nextUser = currentUserData?.user || nextUser;
      }
      if (nextUser) {
        window.localStorage.setItem("aidep.auth.user", JSON.stringify(nextUser));
        window.localStorage.setItem("aidep.auth.role", nextUser.role || role);
        setUser(nextUser);
        setRole(nextUser.role || role);
      }
      return nextUser ? { ...response, data: { ...authData, user: nextUser } } : response;
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
      const response = await authService.register(payload);
      const authData = response?.data || response || {};
      const nextToken = authData.access_token || authData.token || authData.accessToken;
      if (nextToken) {
        window.localStorage.setItem("aidep.auth.token", nextToken);
        setToken(nextToken);
      }
      if (authData?.user) {
        window.localStorage.setItem("aidep.auth.user", JSON.stringify(authData.user));
        window.localStorage.setItem("aidep.auth.role", authData.user.role || role);
        setUser(authData.user);
        setRole(authData.user.role || role);
      }
      return response;
    } catch (registerError) {
      setError(registerError);
      throw registerError;
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    authService.logout();
    setToken(null);
    setUser(null);
    setRole("customer");
    setError(null);
  }

  const value = useMemo(
    () => ({ user, role, token, loading, error, setRole, login, register, logout, isAuthenticated: Boolean(token) }),
    [user, role, token, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
