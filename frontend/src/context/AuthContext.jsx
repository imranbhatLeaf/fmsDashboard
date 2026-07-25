import { createContext, useContext, useState, useEffect } from "react";
const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:5000";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    try {
      const stored = sessionStorage.getItem("fms_auth");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (auth && auth.token) {
      fetch(`${API_BASE}/api/auth/verify`, {
        headers: { Authorization: `Bearer ${auth.token}` }
      })
      .then(res => {
        if (!res.ok) logout();
      })
      .catch(() => logout());
    }
  }, [auth?.token]);

  function login(userData) {
    sessionStorage.setItem("fms_auth", JSON.stringify(userData));
    setAuth(userData);
  }

  function logout() {
    sessionStorage.removeItem("fms_auth");
    setAuth(null);
  }

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
