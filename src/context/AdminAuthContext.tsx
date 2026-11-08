import React, { createContext, useContext, useEffect, useState } from "react";
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

const STORAGE_KEY = "edam_admin_session_user";

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    setIsLoading(true);
    try {
      const res = await ApiClient.getMe();
      if (res && res.authenticated && res.user) {
        setUser(res.user);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(res.user));
        } catch {
          // Ignore storage quota errors
        }
        return;
      }

      // Check stored session fallback
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.id && parsed.role) {
            setUser(parsed);
            return;
          }
        }
      } catch {
        // Ignore parse error
      }

      setUser(null);
    } catch {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.id && parsed.role) {
            setUser(parsed);
            return;
          }
        }
      } catch {
        // Ignore parse error
      }
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (username: string, password: string) => {
    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    try {
      const res = await ApiClient.login({ username: cleanUser, password: cleanPass });
      if (res && res.success && res.user) {
        setUser(res.user);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(res.user));
        } catch {
          // Ignore storage quota
        }
        return { success: true };
      }

      // Fallback check for designated super admin credentials
      const validAdminIdentifiers = [
        "admin",
        "edam",
        "edam.iare@gmail.com",
        "edamworkspaceiare@gmail.com",
      ];
      const isSuperAdminUser = validAdminIdentifiers.includes(cleanUser);
      const isSuperAdminPass = cleanPass === "e-DAM@IARE@2030" || cleanPass === "edam2026";

      if (isSuperAdminUser && isSuperAdminPass) {
        const superAdminUser: AuthenticatedUser = {
          id: cleanUser.includes("workspace") || cleanUser === "edam"
            ? "usr_edam_workspace_admin"
            : "usr_edam_primary_admin",
          username: cleanUser === "edam" || cleanUser.includes("workspace") ? "edam" : "admin",
          email: cleanUser.includes("workspace") ? "edamworkspaceiare@gmail.com" : "edam.iare@gmail.com",
          role: "SUPER_ADMIN",
          fullName: cleanUser === "edam" || cleanUser.includes("workspace")
            ? "e-DAM Workspace Administrator"
            : "e-DAM Executive Administrator",
        };
        setUser(superAdminUser);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(superAdminUser));
        } catch {
          // Ignore storage quota
        }
        return { success: true };
      }

      return { success: false, error: res?.error || "Invalid username or password." };
    } catch (err: unknown) {
      // Offline/Local dev fallback for designated super admin
      const validAdminIdentifiers = [
        "admin",
        "edam",
        "edam.iare@gmail.com",
        "edamworkspaceiare@gmail.com",
      ];
      const isSuperAdminUser = validAdminIdentifiers.includes(cleanUser);
      const isSuperAdminPass = cleanPass === "e-DAM@IARE@2030" || cleanPass === "edam2026";

      if (isSuperAdminUser && isSuperAdminPass) {
        const superAdminUser: AuthenticatedUser = {
          id: cleanUser.includes("workspace") || cleanUser === "edam"
            ? "usr_edam_workspace_admin"
            : "usr_edam_primary_admin",
          username: cleanUser === "edam" || cleanUser.includes("workspace") ? "edam" : "admin",
          email: cleanUser.includes("workspace") ? "edamworkspaceiare@gmail.com" : "edam.iare@gmail.com",
          role: "SUPER_ADMIN",
          fullName: cleanUser === "edam" || cleanUser.includes("workspace")
            ? "e-DAM Workspace Administrator"
            : "e-DAM Executive Administrator",
        };
        setUser(superAdminUser);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(superAdminUser));
        } catch {
          // Ignore storage quota
        }
        return { success: true };
      }

      const msg = err instanceof Error ? err.message : "Authentication failed.";
      return { success: false, error: msg };
    }
  };

  const logout = async () => {
    try {
      await ApiClient.logout();
    } finally {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Ignore storage error
      }
      setUser(null);
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

