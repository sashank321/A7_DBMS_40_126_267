"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { User, UserRole } from "@/types";
import { api } from "./api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  quickLogin: (role: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const KNOWLEDGESPHERE_CREDENTIALS: Record<string, { email: string; pass: string; label: string; role: string }> = {
  Admin: { email: "alice.admin@knowledgesphere.ai", pass: "password123", label: "Admin", role: "Admin" },
  Manager: { email: "bob.hr@knowledgesphere.ai", pass: "password123", label: "Manager", role: "Manager" },
  Employee: { email: "hannah.hr@knowledgesphere.ai", pass: "password123", label: "Employee", role: "Employee" },
  SUPER_ADMIN: { email: "alice.admin@knowledgesphere.ai", pass: "password123", label: "Admin", role: "Admin" },
  CONFERENCE_ADMIN: { email: "bob.hr@knowledgesphere.ai", pass: "password123", label: "Manager", role: "Manager" },
  REVIEWER: { email: "diana.eng@knowledgesphere.ai", pass: "password123", label: "Employee (Eng)", role: "Employee" },
  AUTHOR: { email: "hannah.hr@knowledgesphere.ai", pass: "password123", label: "Employee (HR)", role: "Employee" },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initSession = async () => {
      const savedToken = localStorage.getItem("knowledgesphere_token") || localStorage.getItem("allocflow_token");
      const savedUser = localStorage.getItem("knowledgesphere_user") || localStorage.getItem("allocflow_user");

      if (savedToken && savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          setToken(savedToken);
          setUser({
            id: String(parsed.user_id || parsed.id || 1),
            email: parsed.email,
            fullName: parsed.name || parsed.fullName || "Alice Admin",
            role: (parsed.role as any) || "Admin",
            enabled: true
          });
          setIsLoading(false);
          return;
        } catch {
          localStorage.removeItem("knowledgesphere_token");
          localStorage.removeItem("knowledgesphere_user");
        }
      }

      // Default auto-login as Alice (Admin)
      try {
        const res = await api.knowledgesphereLogin("alice.admin@knowledgesphere.ai", "password123");
        setToken(res.access_token);
        setUser({
          id: String(res.user_id),
          email: res.email,
          fullName: res.name,
          role: res.role as any,
          enabled: true
        });
      } catch (err) {
        console.warn("Default KnowledgeSphere auto-login failed", err);
      } finally {
        setIsLoading(false);
      }
    };

    initSession();
  }, []);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await api.knowledgesphereLogin(email, pass);
      setToken(res.access_token);
      const userObj: User = {
        id: String(res.user_id),
        email: res.email,
        fullName: res.name,
        role: res.role as any,
        enabled: true
      };
      setUser(userObj);
      localStorage.setItem("knowledgesphere_token", res.access_token);
      localStorage.setItem("knowledgesphere_user", JSON.stringify(res));
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = async (role: string) => {
    const creds = KNOWLEDGESPHERE_CREDENTIALS[role];
    if (creds) {
      await login(creds.email, creds.pass);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("knowledgesphere_token");
    localStorage.removeItem("knowledgesphere_user");
    localStorage.removeItem("allocflow_token");
    localStorage.removeItem("allocflow_user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        quickLogin,
        logout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
