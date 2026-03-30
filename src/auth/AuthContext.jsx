/**
 * AuthContext.jsx
 *
 * Provides login state and actions to the whole app via React Context.
 * Token is persisted in localStorage so the user stays logged in on refresh.
 *
 * Usage anywhere in the app:
 *   const { user, token, login, logout } = useAuth();
 */

import { createContext, useContext, useState } from "react";
import { login as apiLogin } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("lifelens_token"));
  const [user, setUser] = useState(() => localStorage.getItem("lifelens_user"));

  async function login(username, password) {
    const data = await apiLogin(username, password);
    localStorage.setItem("lifelens_token", data.token);
    localStorage.setItem("lifelens_user", data.username);
    setToken(data.token);
    setUser(data.username);
  }

  function logout() {
    localStorage.removeItem("lifelens_token");
    localStorage.removeItem("lifelens_user");
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Convenience hook — import this instead of useContext(AuthContext) directly
export function useAuth() {
  return useContext(AuthContext);
}