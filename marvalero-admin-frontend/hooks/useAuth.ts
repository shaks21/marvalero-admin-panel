'use client';

import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/navigation";
import { setCookie, deleteCookie, getCookie } from "cookies-next/client";

type AdminTokenPayload = {
  sub: string;
  isAdmin: boolean;
  exp: number;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

export function useAuth() {
  const [token, setToken] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const tokenFromCookie = getCookie('admin_token');
    if (tokenFromCookie) {
      try {
        const decoded = jwtDecode<AdminTokenPayload>(tokenFromCookie);
        
        if (decoded.exp * 1000 > Date.now()) {
          setToken(tokenFromCookie);
          setIsAdmin(decoded.isAdmin === true);
        } else {
          deleteCookie('admin_token');
        }
      } catch {
        deleteCookie('admin_token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        throw new Error("Login failed");
      }

      const { accessToken } = await res.json();
      setCookie('admin_token', accessToken, { 
        maxAge: 60 * 60 * 24 * 7 // 7 days
      });
      setToken(accessToken);

      const decoded = jwtDecode<AdminTokenPayload>(accessToken);
      setIsAdmin(decoded.isAdmin === true);
      
      // Redirect after successful login
      router.push('/admin');
    } catch (err: any) {
      throw new Error(err.message || "Login failed");
    }
  };

  const logout = () => {
    deleteCookie('admin_token');
    setToken(null);
    setIsAdmin(false);
    router.push('/admin/login');
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