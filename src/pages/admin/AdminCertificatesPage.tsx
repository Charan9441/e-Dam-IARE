import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  PlusCircle,
  Search,
  Download,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  X,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminFooter } from "@/components/admin/AdminFooter";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { ApiClient } from "@/lib/api-client";
import { mapApiCertificate, mapApiEvent } from "@/lib/edam-store";
import type { IssuedCertificate, CertificateType, ChapterEvent } from "@/types";
import { renderCertificatePdf, downloadCertificateBuffer } from "@/lib/certificate-generator";
import { Button } from "@/components/ui/Button";

export const AdminCertificatesPage: React.FC = () => {
  const { canIssueCertificates } = useAdminAuth();
  const [certs, setCerts] = useState<IssuedCertificate[]>([]);
  const [events, setEvents] = useState<ChapterEvent[]>([]);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    recipientName: "",
    recipientEmail: "",
    recipientRollNumber: "",
    recipientDepartment: "Computer Science & Engineering",
    eventId: "",
    eventTitle: "e-DAM Community Workshop",
    certificateType: "participation" as CertificateType,
    eventDate: new Date().toISOString().split("T")[0],
  });

  const loadData = useCallback(async () => {
    const [certsRes, eventsRes] = await Promise.all([
      ApiClient.getCertificates(),
      ApiClient.getEvents(),
    ]);

    if (certsRes.success && Array.isArray(certsRes.certificates)) {
      setCerts(certsRes.certificates.map(mapApiCertificate));
    } else if (!certsRes.success) {
      setErrorMsg(certsRes.error || "Unable to fetch certificates.");
    }

    if (eventsRes.success && Array.isArray(eventsRes.events)) {
      const mapped = eventsRes.events.map(mapApiEvent);
      setEvents(mapped);
      if (mapped.length > 0) {
        setFormData((prev) => ({
          ...prev,
          eventId: prev.eventId || mapped[0].id,
          eventTitle: prev.eventTitle === "e-DAM Community Workshop" ? mapped[0].title : prev.eventTitle,
        }));
      }
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canIssueCertificates) return;
    setModalError(null);
    setErrorMsg(null);
    setStatusMsg(null);

    if (!formData.recipientName.trim()) {
      setModalError("Recipient full name is required.");
      return;
    }

    const email =
      formData.recipientEmail.trim() ||
      (formData.recipientRollNumber.trim()
        ? `${formData.recipientRollNumber.trim().toLowerCase()}@iare.ac.in`
        : "");

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setModalError("Please provide a valid recipient email address or roll number.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await ApiClient.issueCertificate({
        recipientName: formData.recipientName.trim(),
        recipientEmail: email.toLowerCase(),
        recipientRollNumber: formData.recipientRollNumber.trim().toUpperCase(),
        recipientDepartment: formData.recipientDepartment.trim(),
        eventId: formData.eventId || null,
        eventTitle: formData.eventTitle.trim(),
        eventDate: formData.eventDate,
        certificateType: formData.certificateType,
      });

      if (res.success) {
        setStatusMsg(`Issued official credential: ${res.certificateNumber}`);
        setIsModalOpen(false);
        setFormData((prev) => ({
          ...prev,
          recipientName: "",
          recipientEmail: "",
          recipientRollNumber: "",
        }));
        await loadData();
      } else {
        setModalError(res.error || "Failed to issue certificate.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadPdf = async (cert: IssuedCertificate) => {
    setDownloadingId(cert.id);
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
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleToggleStatus = async (cert: IssuedCertificate) => {
    if (!canIssueCertificates) return;
    setErrorMsg(null);
    setStatusMsg(null);
    const nextStatus = cert.status === "valid" ? "revoked" : "valid";
    const res = await ApiClient.updateCertificateStatus(
      cert.certificateNumber,
      nextStatus,
      nextStatus === "revoked" ? "Administrative revocation" : undefined
    );
    if (res.success) {
      setStatusMsg(`Certificate ${cert.certificateNumber} marked as ${nextStatus}.`);
      await loadData();
    } else {
      setErrorMsg(res.error || "Unable to update certificate status.");
    }
  };

  const filteredCerts = certs.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.recipientName.toLowerCase().includes(q) ||
      (c.recipientRollNumber || "").toLowerCase().includes(q) ||
      c.certificateNumber.toLowerCase().includes(q) ||
      c.eventTitle.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[#030305] text-[#F5F3FF] flex flex-col">
      <AdminHeader />

      <main className="flex-1 container mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-white tracking-tight">
              Certificate &amp; Credential Registry
            </h1>
            <p className="text-xs sm:text-sm text-[#928A9F] mt-1">
              Issue high-resolution vector PDF certificates accredited by e-DAM IARE with public QR verification.
            </p>
          </div>

          {canIssueCertificates && (
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                setModalError(null);
                setIsModalOpen(true);
              }}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Issue New Certificate</span>
            </Button>
          )}
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {statusMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{statusMsg}</span>
          </div>
        )}

        {/* Filter bar */}
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-white/40 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by recipient name, roll number, or credential ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-[#8B5CF6] focus:outline-none text-xs text-[#F5F3FF] placeholder:text-white/30 transition-colors"
          />
        </div>

        {/* Certificates Table */}
        <div className="rounded-2xl bg-[#0B0614] border border-white/10 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 text-[#928A9F] uppercase tracking-wider font-semibold border-b border-white/10">
                <tr>
                  <th className="py-3 px-4">Credential ID</th>
                  <th className="py-3 px-4">Recipient Name</th>
                  <th className="py-3 px-4">Roll Number</th>
                  <th className="py-3 px-4">Event Title</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-[#F5F3FF]">
                {filteredCerts.map((cert) => (
                  <tr key={cert.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#C4B5FD]">
                      {cert.certificateNumber}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-white">
                      {cert.recipientName}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-white/80">
                      {cert.recipientRollNumber || "—"}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate text-[#928A9F]">
                      {cert.eventTitle}
                    </td>
                    <td className="py-3.5 px-4 capitalize font-medium text-white/90">
                      {cert.certificateType}
                    </td>
                    <td className="py-3.5 px-4">
                      {canIssueCertificates ? (
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(cert)}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border cursor-pointer ${
                            cert.status === "valid"
                              ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                              : "bg-rose-500/15 text-rose-300 border-rose-500/30"
                          }`}
                          title="Click to toggle Revocation"
                        >
                          {cert.status === "valid" ? (
                            <>
                              <ShieldCheck className="w-3 h-3" />
                              <span>Valid</span>
                            </>
                          ) : (
                            <>
                              <ShieldAlert className="w-3 h-3" />
                              <span>Revoked</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                            cert.status === "valid"
                              ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                              : "bg-rose-500/15 text-rose-300 border-rose-500/30"
                          }`}
                        >
                          {cert.status === "valid" ? (
                            <>
                              <ShieldCheck className="w-3 h-3" />
                              <span>Valid</span>
                            </>
                          ) : (
                            <>
                              <ShieldAlert className="w-3 h-3" />
                              <span>Revoked</span>
                            </>
                          )}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => handleDownloadPdf(cert)}
                        disabled={downloadingId === cert.id || cert.status !== "valid"}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-white transition-colors cursor-pointer disabled:opacity-40"
                        title="Download Vector PDF"
                      >
                        <Download className="w-3.5 h-3.5 text-[#8B5CF6]" />
                        <span>{downloadingId === cert.id ? "PDF..." : "PDF"}</span>
                      </button>
                      <Link
                        to={`/verify/${cert.certificateNumber}`}
                        target="_blank"
                        className="p-1.5 inline-block rounded-lg bg-white/5 hover:bg-white/10 text-[#8B5CF6] hover:text-white transition-colors"
                        title="Public Verification Page"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
                {filteredCerts.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[#928A9F]">
                      No issued certificates found in the registry.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Issue Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-xl bg-[#0B0614] border border-[#8B5CF6]/30 rounded-2xl p-6 sm:p-8 shadow-2xl text-[#F5F3FF]">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-2xl font-bold font-heading mb-6">
              Issue Official e-DAM Certificate
            </h2>

            {modalError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleIssue} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#928A9F] uppercase tracking-wider mb-1">
                    Recipient Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. K. Sai Charan"
                    value={formData.recipientName}
                    onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 focus:border-[#8B5CF6] focus:outline-none text-sm text-[#F5F3FF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#928A9F] uppercase tracking-wider mb-1">
                    Recipient Email *
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. rollno@iare.ac.in"
                    value={formData.recipientEmail}
                    onChange={(e) => setFormData({ ...formData, recipientEmail: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 focus:border-[#8B5CF6] focus:outline-none text-sm text-[#F5F3FF]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#928A9F] uppercase tracking-wider mb-1">
                    Student Roll Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 22951A0501"
                    value={formData.recipientRollNumber}
                    onChange={(e) => setFormData({ ...formData, recipientRollNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 focus:border-[#8B5CF6] focus:outline-none text-xs text-[#F5F3FF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#928A9F] uppercase tracking-wider mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Computer Science & Engineering"
                    value={formData.recipientDepartment}
                    onChange={(e) => setFormData({ ...formData, recipientDepartment: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 focus:border-[#8B5CF6] focus:outline-none text-xs text-[#F5F3FF]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#928A9F] uppercase tracking-wider mb-1">
                  Event / Workshop
                </label>
                {events.length > 0 ? (
                  <select
                    value={formData.eventTitle}
                    onChange={(e) => {
                      const selected = events.find((evt) => evt.title === e.target.value);
                      setFormData({
                        ...formData,
                        eventTitle: e.target.value,
                        eventId: selected ? selected.id : "",
                        eventDate: selected ? selected.date : formData.eventDate,
                      });
                    }}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#14101F] border border-white/10 focus:border-[#8B5CF6] focus:outline-none text-xs text-[#F5F3FF]"
                  >
                    {events.map((evt) => (
                      <option key={evt.id} value={evt.title}>
                        {evt.title} ({evt.date})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    value={formData.eventTitle}
                    onChange={(e) => setFormData({ ...formData, eventTitle: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 focus:border-[#8B5CF6] focus:outline-none text-xs text-[#F5F3FF]"
                  />
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#928A9F] uppercase tracking-wider mb-1">
                    Certificate Type
                  </label>
                  <select
                    value={formData.certificateType}
                    onChange={(e) => setFormData({ ...formData, certificateType: e.target.value as CertificateType })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#14101F] border border-white/10 focus:border-[#8B5CF6] focus:outline-none text-xs text-[#F5F3FF]"
                  >
                    <option value="participation">Participation</option>
                    <option value="merit">Merit</option>
                    <option value="excellence">Excellence</option>
                    <option value="appreciation">Appreciation</option>
                    <option value="speaker">Speaker Commendation</option>
                    <option value="coordinator">Leadership &amp; Coordination</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#928A9F] uppercase tracking-wider mb-1">
                    Issue Date
                  </label>
                  <input
                    type="date"
                    value={formData.eventDate}
                    onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#14101F] border border-white/10 focus:border-[#8B5CF6] focus:outline-none text-xs text-[#F5F3FF]"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/10">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={isSubmitting}>
                  Generate &amp; Issue Credential
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AdminFooter />
    </div>
  );
};
