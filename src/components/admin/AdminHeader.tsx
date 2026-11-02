import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Calendar, Award, Users, LogOut, ArrowLeft, Shield, UserCheck } from "lucide-react";
import { EdamLogo } from "@/components/EdamLogo";
import { useAdminAuth } from "@/context/AdminAuthContext";

export const AdminHeader: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAdminAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login");
  };

  const navItems = [
    { label: "Dashboard", href: "/admin", icon: Shield },
    { label: "Events", href: "/admin/events", icon: Calendar },
    { label: "Certificates", href: "/admin/certificates", icon: Award },
    { label: "Registrations", href: "/admin/registrations", icon: Users },
  ];

  const roleBadgeColor =
    user?.role === "SUPER_ADMIN"
      ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
      : user?.role === "ADMIN"
      ? "bg-blue-500/20 text-blue-300 border-blue-500/40"
      : user?.role === "EDITOR"
      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
      : "bg-slate-500/20 text-slate-300 border-slate-500/40";

  return (
    <header className="bg-[#0B0614] border-b border-[#8B5CF6]/20 sticky top-0 z-40">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2.5 group">
              <EdamLogo size={28} />
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-[#F5F3FF] tracking-wider text-sm sm:text-base">e-DAM</span>
                <span className="text-xs px-2 py-0.5 rounded bg-[#8B5CF6]/20 text-[#C4B5FD] font-mono border border-[#8B5CF6]/30">
                  ADMIN CONSOLE
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1 text-xs font-semibold">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? "bg-[#8B5CF6]/20 text-[#C4B5FD] border border-[#8B5CF6]/40"
                        : "text-[#928A9F] hover:text-[#F5F3FF] hover:bg-white/5"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {/* Authenticated User & Role Badge */}
            {user && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs">
                <UserCheck className="w-3.5 h-3.5 text-[#8B5CF6]" />
                <span className="font-medium text-white/90">{user.username}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold uppercase border ${roleBadgeColor}`}>
                  {user.role}
                </span>
              </div>
            )}

            <Link
              to="/"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs text-[#928A9F] hover:text-white transition-colors px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Site</span>
            </Link>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Mobile secondary bar */}
        <div className="flex md:hidden items-center justify-between py-2 border-t border-white/5 text-xs">
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md ${
                    isActive ? "text-[#C4B5FD] font-bold bg-[#8B5CF6]/20" : "text-[#928A9F]"
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {user && (
            <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase border ${roleBadgeColor}`}>
              {user.role}
            </span>
          )}
        </div>
      </div>
    </header>
  );
};
