import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

type AdminTokenPayload = {
  sub: string;
  isAdmin: boolean;
  exp: number;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
console.log("API BASE:", import.meta.env.VITE_API_BASE_URL);
console.log("ALL ENV:", import.meta.env);

export function useAuth() {
  const [token, setToken] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("admin_token");
    if (stored) {
      try {
        const decoded = jwtDecode<AdminTokenPayload>(stored);

        if (decoded.exp * 1000 > Date.now()) {
          setToken(stored);
          setIsAdmin(decoded.isAdmin === true);
        } else {
          localStorage.removeItem("admin_token");
        }
      } catch {
        localStorage.removeItem("admin_token");
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    console.log('API_BASE_URL:', API_BASE_URL);
    const res = await fetch(`${API_BASE_URL}/admin/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) throw new Error("Login failed");

    const { accessToken } = await res.json();
    localStorage.setItem("admin_token", accessToken);
    setToken(accessToken);

    const decoded = jwtDecode<AdminTokenPayload>(accessToken);
    setIsAdmin(decoded.isAdmin === true);
  };

  const logout = () => {
    localStorage.removeItem("admin_token");
    setToken(null);
    setIsAdmin(false);
  };

  return {
    token,
    isAdmin,
    loading,
    login,
    logout,
    isAuthenticated: !!token,
  };
}
