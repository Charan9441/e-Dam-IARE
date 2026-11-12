import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { KeyRound, ArrowLeft, AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { EdamLogo } from "@/components/EdamLogo";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { Button } from "@/components/ui/Button";

function getSafeAdminRedirect(state: unknown): string {
  const fromPath = (state as { from?: { pathname?: string } } | null)?.from?.pathname;
  if (typeof fromPath === "string" && fromPath.startsWith("/admin") && !fromPath.startsWith("//")) {
    return fromPath;
  }
  return "/admin";
}

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isLoading } = useAdminAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already authenticated by server session, redirect directly to admin console
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate(getSafeAdminRedirect(location.state), { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, location]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanUser = username.trim();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      setError("Please provide both username and password.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await login(cleanUser, cleanPass);
      if (res.success) {
        navigate(getSafeAdminRedirect(location.state), { replace: true });
      } else {
        setError(res.error || "Invalid username or password.");
      }
    } catch {
      setError("An unexpected authentication error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030305] text-[#F5F3FF] flex flex-col justify-center items-center p-6 relative">
      {/* Background Ambience */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#8B5CF6]/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-[#928A9F] hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Public Website</span>
        </Link>

        <div className="rounded-3xl bg-[#0B0614] border border-[#8B5CF6]/30 p-8 sm:p-10 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-3">
              <EdamLogo size={36} />
            </div>
            <h1 className="text-2xl font-bold font-heading text-white">
              e-DAM Admin Portal
            </h1>
            <p className="text-xs text-[#928A9F]">
              Institutional single sign-on for authorized e-DAM executive officers.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#928A9F] uppercase tracking-wider mb-1.5">
                Username or Institutional Email
              </label>
              <input
                type="text"
                required
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isSubmitting}
                placeholder="Enter administrative username or email"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-[#8B5CF6] focus:outline-none text-sm text-[#F5F3FF] placeholder:text-white/20 transition-colors disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#928A9F] uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="Enter administrative password"
                  className="w-full px-4 py-3 pr-11 rounded-xl bg-white/5 border border-white/10 focus:border-[#8B5CF6] focus:outline-none text-sm text-[#F5F3FF] placeholder:text-white/20 transition-colors disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={isSubmitting}
              className="w-full cursor-pointer mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4 mr-2" />
                  <span>Sign In to Console</span>
                </>
              )}
            </Button>
          </form>

          <div className="pt-2 border-t border-white/5 text-center">
            <p className="text-[11px] text-[#928A9F]/70">
              Access is restricted to authorized faculty patrons and chapter council. All authentication attempts are cryptographically audited.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
