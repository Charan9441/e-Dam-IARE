import React from "react";

export const AdminFooter: React.FC = () => {
  return (
    <footer className="mt-auto py-6 border-t border-white/5 bg-[#030305] text-xs text-[#928A9F]">
      <div className="container mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p>© 2026 e-DAM IARE Community Platform • Administrative Management Panel</p>
        <p className="text-[11px] text-white/40">Secure Role-Based Access • Neon PostgreSQL &amp; Cloudflare R2 Connected</p>
      </div>
    </footer>
  );
};

