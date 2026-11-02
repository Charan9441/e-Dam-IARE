import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  PlusCircle,
  Search,
  Download,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  X,
} from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminFooter } from "@/components/admin/AdminFooter";
import { useAdminAuth } from "@/context/AdminAuthContext";
import {
  getStoredCertificates,
  getStoredEvents,
  issueNewCertificate,
  toggleCertificateStatus,
} from "@/lib/edam-store";
import type { IssuedCertificate, CertificateType } from "@/types";
import { renderCertificatePdf, downloadCertificateBuffer } from "@/lib/certificate-generator";
import { Button } from "@/components/ui/Button";

export const AdminCertificatesPage: React.FC = () => {
  const { canIssueCertificates } = useAdminAuth();
  const [certs, setCerts] = useState<IssuedCertificate[]>([]);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    recipientName: "",
    recipientEmail: "",
    recipientRollNumber: "",
    recipientDepartment: "Computer Science & Engineering",
    eventId: "edam-evt-01",
    eventTitle: "Design Sprint 2026: 48-Hour UI/UX Challenge",
    certificateType: "participation" as CertificateType,
    eventDate: new Date().toISOString().split("T")[0],
  });

  const events = getStoredEvents();

  useEffect(() => {
    setCerts(getStoredCertificates());
  }, []);

  const handleIssue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.recipientName.trim()) return;

    issueNewCertificate({
      recipientName: formData.recipientName.trim(),
      recipientEmail: formData.recipientEmail.trim() || `${formData.recipientRollNumber.toLowerCase()}@iare.ac.in`,
      recipientRollNumber: formData.recipientRollNumber.trim().toUpperCase(),
      recipientDepartment: formData.recipientDepartment,
      eventId: formData.eventId,
      eventTitle: formData.eventTitle,
      eventDate: formData.eventDate,
      certificateType: formData.certificateType,
    });

    setCerts(getStoredCertificates());
    setIsModalOpen(false);
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

  const handleToggleStatus = (certId: string) => {
    toggleCertificateStatus(certId);
    setCerts(getStoredCertificates());
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
            <Button variant="primary" size="md" onClick={() => setIsModalOpen(true)}>
              <PlusCircle className="w-4 h-4" />
              <span>Issue New Certificate</span>
            </Button>
          )}
        </div>

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
                      <button
                        onClick={() => handleToggleStatus(cert.id)}
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
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleDownloadPdf(cert)}
                        disabled={downloadingId === cert.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-white transition-colors cursor-pointer"
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
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-2xl font-bold font-heading mb-6">
              Issue Official e-DAM Certificate
            </h2>

            <form onSubmit={handleIssue} className="space-y-4">
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
                <select
                  value={formData.eventTitle}
                  onChange={(e) => {
                    const selected = events.find((evt) => evt.title === e.target.value);
                    setFormData({
                      ...formData,
                      eventTitle: e.target.value,
                      eventId: selected ? selected.id : "edam-evt",
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
                <Button type="submit" variant="primary">
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
