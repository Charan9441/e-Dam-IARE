import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { ApiClient } from "@/lib/api-client";

export type AdminRole = "SUPER_ADMIN" | "ADMIN" | "EDITOR" | "VIEWER";

export interface AuthenticatedUser {
  id: string;
  username: string;
  email: string;
  role: AdminRole;
  fullName: string;
}

interface AdminAuthContextType {
  user: AuthenticatedUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  hasRole: (roles: AdminRole[]) => boolean;
  canCreateEvents: boolean;
  canEditEvents: boolean;
  canDeleteEvents: boolean;
  canManageRegistrations: boolean;
  canIssueCertificates: boolean;
  canManageUsers: boolean;
  refetchUser: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const checkAuth = useCallback(async () => {
    setIsChecking(true);
    try {
      const res = await ApiClient.getMe();
      if (res && res.authenticated && res.user) {
        setUser(res.user);
        return;
      }
      setUser(null);
    } catch {
      setUser(null);
    } finally {
      setAuthChecked(true);
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    if (isAdminRoute && !authChecked && !isChecking) {
      void checkAuth();
    }
  }, [isAdminRoute, authChecked, isChecking, checkAuth]);

  const login = async (username: string, password: string) => {
    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    try {
      const res = await ApiClient.login({ username: cleanUser, password: cleanPass });
      if (res && res.success && res.user) {
        setUser(res.user);
        setAuthChecked(true);
        return { success: true };
      }

      return { success: false, error: res?.error || "Invalid username or password." };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication failed.";
      return { success: false, error: msg };
    }
  };

  const logout = async () => {
    try {
      await ApiClient.logout();
    } finally {
      try {
        localStorage.removeItem("edam_admin_session_user");
      } catch {
        // Ignore storage cleanup error
      }
      setUser(null);
      setAuthChecked(true);
    }
  };

  const hasRole = (roles: AdminRole[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const role = user?.role;
  const canCreateEvents = role === "SUPER_ADMIN" || role === "ADMIN";
  const canEditEvents = role === "SUPER_ADMIN" || role === "ADMIN" || role === "EDITOR";
  const canDeleteEvents = role === "SUPER_ADMIN" || role === "ADMIN";
  const canManageRegistrations = role === "SUPER_ADMIN" || role === "ADMIN";
  const canIssueCertificates = role === "SUPER_ADMIN" || role === "ADMIN";
  const canManageUsers = role === "SUPER_ADMIN";
  const isLoading = isChecking || (isAdminRoute && !authChecked);

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: Boolean(user),
        login,
        logout,
        hasRole,
        canCreateEvents,
        canEditEvents,
        canDeleteEvents,
        canManageRegistrations,
        canIssueCertificates,
        canManageUsers,
        refetchUser: checkAuth,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export function useAdminAuth(): AdminAuthContextType {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
}

