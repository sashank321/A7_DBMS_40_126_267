"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { User } from "@/types";
import { api } from "./api";

interface AuthContextType {
  user: User | null; token: string | null; isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  requestOTP: (email: string, password: string) => Promise<{ status: string; message: string; email: string; expires_in_seconds: number; dev_otp?: string }>;
  verifyOTP: (email: string, otp: string) => Promise<void>;
  resendOTP: (email: string) => Promise<{ status: string; message: string; email: string; expires_in_seconds: number; dev_otp?: string }>;
  quickLogin: (role: string) => Promise<void>; logout: () => void; isAuthenticated: boolean;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);


const asUser = (data: any): User => ({ id: String(data.user_id), email: data.email, fullName: data.name, role: data.role_name || data.role, enabled: true, departmentId: data.department_id } as User);
const clearStorage = () => ["knowledgesphere_token", "knowledgesphere_user", "allocflow_token", "allocflow_user"].forEach(k => localStorage.removeItem(k));

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();
  useEffect(() => {
    let active = true;
    const initialize = async () => {
      const saved = localStorage.getItem("knowledgesphere_token");
      try {
        if (saved) {
          const profile = await api.getCurrentUser();
          if (active) { setToken(saved); setUser(asUser(profile)); }
        }
      } catch { clearStorage(); }
      finally { if (active) setIsLoading(false); }
    };
    initialize();
    const expired = () => { setToken(null); setUser(null); queryClient.clear(); };
    const storageChanged = (event: StorageEvent) => {
      if (event.key === "knowledgesphere_token" || event.key === null) {
        queryClient.clear(); window.location.reload();
      }
    };
    window.addEventListener("storage", storageChanged);
    window.addEventListener("knowledgesphere:unauthorized", expired);
    return () => { active = false; window.removeEventListener("storage", storageChanged); window.removeEventListener("knowledgesphere:unauthorized", expired); };
  }, [queryClient]);

  const requestOTP = async (email: string, password: string) => {
    return await api.requestOTP(email, password);
  };

  const verifyOTP = async (email: string, otp: string) => {
    setIsLoading(true);
    try {
      await queryClient.cancelQueries();
      queryClient.clear();
      const result = await api.verifyOTP(email, otp);
      setToken(result.access_token);
      setUser(asUser(result));
    } finally {
      setIsLoading(false);
    }
  };

  const resendOTP = async (email: string) => {
    return await api.resendOTP(email);
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await queryClient.cancelQueries();
      queryClient.clear();
      const result = await api.knowledgesphereLogin(email, password);
      setToken(result.access_token); setUser(asUser(result));
    } finally { setIsLoading(false); }
  };
  const quickLogin = async (role: string) => {
    const credentials = (await api.getDemoAccounts()).find(account => account.role === role);
    if (!credentials) throw new Error("This demo role is unavailable");
    const password = process.env.NEXT_PUBLIC_DEMO_PASSWORD;
    if (!password) throw new Error("Demo access is not configured");
    await login(credentials.email, password);
  };
  const logout = () => { clearStorage(); setToken(null); setUser(null); queryClient.clear(); };
  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        requestOTP,
        verifyOTP,
        resendOTP,
        quickLogin,
        logout,
        isAuthenticated: !!token
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
