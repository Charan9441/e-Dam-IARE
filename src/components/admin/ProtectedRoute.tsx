import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAdminAuth, type AdminRole } from "@/context/AdminAuthContext";
import { ShieldAlert, Loader2 } from "lucide-react";
import { EdamLogo } from "@/components/EdamLogo";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AdminRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, isLoading, isAuthenticated } = useAdminAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#030305] text-[#F5F3FF] flex flex-col justify-center items-center p-6 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center animate-pulse">
          <EdamLogo size={36} />
        </div>
        <div className="flex items-center gap-2.5 text-xs text-[#928A9F]">
          <Loader2 className="w-4 h-4 animate-spin text-[#8B5CF6]" />
          <span>Verifying Secure Administrator Session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen bg-[#030305] text-[#F5F3FF] flex flex-col justify-center items-center p-6">
        <div className="max-w-md w-full rounded-2xl bg-[#0B0614] border border-rose-500/30 p-8 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 mx-auto rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold font-heading text-white">Access Restricted</h2>
          <p className="text-xs text-[#928A9F]">
            Your assigned role (<span className="text-[#C4B5FD] font-mono font-semibold">{user.role}</span>) does not possess sufficient authorization to access this administrative module.
          </p>
          <div className="pt-2">
            <a
              href="/admin"
              className="inline-block px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white transition-colors"
            >
              Return to Admin Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

