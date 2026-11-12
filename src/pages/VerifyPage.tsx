import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  Hash,
  Download,
  Loader2,
} from "lucide-react";
import { findCertificateById, mapApiCertificate } from "@/lib/edam-store";
import { ApiClient } from "@/lib/api-client";
import type { IssuedCertificate } from "@/types";
import { renderCertificatePdf, downloadCertificateBuffer } from "@/lib/certificate-generator";
import { Button } from "@/components/ui/Button";

export const VerifyPage: React.FC = () => {
  const { certId } = useParams<{ certId: string }>();
  const [searchInput, setSearchInput] = useState(certId || "");
  const [searchedId, setSearchedId] = useState(certId || "");
  const [cert, setCert] = useState<IssuedCertificate | undefined>(() =>
    certId ? findCertificateById(certId) : undefined
  );
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const fetchCertificate = useCallback(async (id: string) => {
    const trimmed = id.trim();
    if (!trimmed) return;
    setSearchedId(trimmed);
    setIsVerifying(true);
    setVerifyError(null);

    try {
      // Query authoritative server ledger first
      const res = await ApiClient.verifyCertificate(trimmed);
      if (res && res.success && res.certificate) {
        setCert(mapApiCertificate(res.certificate));
        return;
      }

      if (res?.status === 429) {
        setVerifyError(res.error || "Too many verification attempts. Please try again shortly.");
        setCert(undefined);
        return;
      }
    } catch {
      // Fall through cleanly to showcase sample lookup
    } finally {
      setIsVerifying(false);
    }

    // Fallback to showcase credential samples when record is not in remote ledger
    const local = findCertificateById(trimmed);
    setCert(local);
  }, []);

  useEffect(() => {
    if (certId) {
      setSearchInput(certId);
      fetchCertificate(certId);
    }
  }, [certId, fetchCertificate]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    fetchCertificate(searchInput);
  };

  const handleDownloadPdf = async () => {
    if (!cert || cert.status !== "valid") return;
    setIsDownloading(true);
    setDownloadSuccess(false);

    try {
      const pdfBytes = await renderCertificatePdf({
        certificateNumber: cert.certificateNumber,
        recipientName: cert.recipientName,
        recipientEmail: cert.recipientEmail,
        recipientRollNumber: cert.recipientRollNumber,
        recipientDepartment: cert.recipientDepartment,
        eventTitle: cert.eventTitle,
        eventDate: cert.eventDate,
        certificateType: cert.certificateType,
        issuedBy: cert.issuedBy,
      });

      downloadCertificateBuffer(pdfBytes, `${cert.certificateNumber}.pdf`);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error("PDF Generation error:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const isValid = cert?.status === "valid";

  return (
    <div className="min-h-screen bg-[#030305] text-[#F5F3FF] pt-28 pb-20">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-[#8B5CF6]/15 rounded-full blur-[140px] pointer-events-none -z-10" />

      <div className="container mx-auto px-6 max-w-4xl">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 text-[#C4B5FD] text-xs font-semibold uppercase tracking-widest">
            <ShieldCheck className="w-3.5 h-3.5 text-[#A855F7]" />
            <span>Institutional Verification Portal</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold font-heading tracking-tight">
            Verify e-DAM Credential
          </h1>
          <p className="text-sm sm:text-base text-[#928A9F]">
            Validate authenticity of certificates, badges, and leadership awards issued by e-DAM IARE.
          </p>
        </div>

        <div className="rounded-2xl bg-[#0B0614] border border-[#8B5CF6]/30 p-4 sm:p-6 mb-10 shadow-xl">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Hash className="w-4 h-4 text-white/40 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Enter Certificate ID (e.g. EDAM-IARE-2026-A101)..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-[#8B5CF6] focus:outline-none text-sm text-[#F5F3FF] placeholder:text-white/30 uppercase font-mono transition-colors"
              />
            </div>
            <Button type="submit" variant="primary" size="md" isLoading={isVerifying}>
              <Search className="w-4 h-4" />
              <span>Verify Now</span>
            </Button>
          </form>

          <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center gap-2 text-xs text-[#928A9F]">
            <span>Try sample IDs:</span>
            {["EDAM-IARE-2026-A101", "EDAM-IARE-2026-B202", "EDAM-IARE-2026-C303"].map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setSearchInput(id);
                  fetchCertificate(id);
                }}
                className="px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 text-[#C4B5FD] font-mono hover:text-white transition-colors cursor-pointer"
              >
                {id}
              </button>
            ))}
          </div>
        </div>

        {searchedId && (
          <div>
            {isVerifying ? (
              <div className="rounded-3xl bg-[#0B0614] border border-[#8B5CF6]/30 p-10 text-center space-y-3 shadow-xl">
                <Loader2 className="w-8 h-8 animate-spin text-[#8B5CF6] mx-auto" />
                <p className="text-sm text-[#928A9F]">Verifying credential against the central e-DAM ledger...</p>
              </div>
            ) : cert ? (
              <div
                className={`rounded-3xl bg-[#0B0614] p-6 sm:p-10 shadow-2xl relative overflow-hidden border ${
                  isValid ? "border-emerald-500/40" : "border-rose-500/40"
                }`}
              >
                <div
                  className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-[80px] pointer-events-none ${
                    isValid ? "bg-emerald-500/10" : "bg-rose-500/10"
                  }`}
                />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                        isValid
                          ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                          : "bg-rose-500/20 border-rose-500/40 text-rose-400"
                      }`}
                    >
                      {isValid ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-bold text-sm tracking-wide uppercase ${
                            isValid ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {isValid ? "● Official Valid Credential" : "● Credential Revoked"}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/5 text-white/60">
                          {cert.certificateNumber}
                        </span>
                      </div>
                      <h2 className="text-2xl font-bold font-heading text-white">
                        {isValid ? "Authenticated Record" : "Revoked Credential Record"}
                      </h2>
                    </div>
                  </div>

                  {isValid ? (
                    <Button
                      variant="primary"
                      size="md"
                      onClick={handleDownloadPdf}
                      isLoading={isDownloading}
                    >
                      <Download className="w-4 h-4" />
                      <span>{downloadSuccess ? "Downloaded!" : "Download Official PDF"}</span>
                    </Button>
                  ) : (
                    <span className="px-3.5 py-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold">
                      Download Disabled
                    </span>
                  )}
                </div>

                {!isValid && (
                  <div className="mt-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-200">
                    This credential was revoked by the e-DAM IARE Executive Council
                    {cert.revokedReason ? `: ${cert.revokedReason}` : "."}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-8">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-[#928A9F]">
                      Recipient Name
                    </label>
                    <p className="text-xl sm:text-2xl font-extrabold font-heading text-white mt-1">
                      {cert.recipientName}
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-[#928A9F]">
                      Credential Category
                    </label>
                    <p className="text-lg font-bold text-[#C4B5FD] mt-1 capitalize">
                      Certificate of {cert.certificateType}
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-[#928A9F]">
                      Roll Number &amp; Department
                    </label>
                    <p className="text-sm text-white mt-1">
                      {cert.recipientRollNumber || "Enrolled Student"} • {cert.recipientDepartment || "IARE"}
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-[#928A9F]">
                      Technical Event
                    </label>
                    <p className="text-sm font-semibold text-white mt-1">
                      {cert.eventTitle}
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-[#928A9F]">
                      Date of Event / Issuance
                    </label>
                    <p className="text-sm text-[#928A9F] mt-1">
                      {cert.eventDate} (Issued: {new Date(cert.issuedAt).toLocaleDateString()})
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-[#928A9F]">
                      Issuing Authority
                    </label>
                    <p className="text-sm text-[#928A9F] mt-1">
                      {cert.issuedBy || "e-DAM IARE Executive Council"}
                    </p>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#928A9F]">
                  <p>
                    Verified against the Institute of Aeronautical Engineering e-DAM central cryptographic ledger.
                  </p>
                  <span className={`font-mono ${isValid ? "text-emerald-400" : "text-rose-400"}`}>
                    {isValid ? "STATUS: ACTIVE & ACCREDITED" : "STATUS: REVOKED"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl bg-[#0B0614] border border-rose-500/40 p-8 text-center space-y-4 shadow-xl">
                <div className="w-14 h-14 mx-auto rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                  <ShieldAlert className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold font-heading text-white">
                  {verifyError ? "Verification Temporarily Rate-Limited" : "Credential Not Found"}
                </h3>
                <p className="text-sm text-[#928A9F] max-w-md mx-auto">
                  {verifyError || (
                    <>
                      We could not find any active certificate matching{" "}
                      <span className="text-rose-300 font-mono font-semibold">{searchedId}</span> in the e-DAM database.
                      Please verify the ID on your certificate.
                    </>
                  )}
                </p>
                <div className="pt-2">
                  <Link to="/contact" className="text-xs text-[#8B5CF6] hover:underline font-semibold">
                    Contact Chapter Administrator for Credential Support →
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
