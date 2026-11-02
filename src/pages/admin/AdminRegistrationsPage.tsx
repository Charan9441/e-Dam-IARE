import React, { useEffect, useState } from "react";
import {
  Search,
  Download,
  Award,
  CheckCircle2,
} from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminFooter } from "@/components/admin/AdminFooter";
import { useAdminAuth } from "@/context/AdminAuthContext";
import {
  getStoredRegistrations,
  getStoredEvents,
  issueNewCertificate,
} from "@/lib/edam-store";
import type { EventRegistration } from "@/types";
import { Button } from "@/components/ui/Button";

export const AdminRegistrationsPage: React.FC = () => {
  const { canIssueCertificates } = useAdminAuth();
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("all");
  const [search, setSearch] = useState("");
  const [issuedRegIds, setIssuedRegIds] = useState<string[]>([]);

  const events = getStoredEvents();

  useEffect(() => {
    setRegistrations(getStoredRegistrations());
  }, []);

  const handleIssueCertForAttendee = (reg: EventRegistration) => {
    issueNewCertificate({
      recipientName: reg.attendeeName,
      recipientEmail: reg.email,
      recipientRollNumber: reg.rollNumber,
      recipientDepartment: reg.department,
      eventId: reg.eventId,
      eventTitle: reg.eventTitle || "e-DAM Community Workshop",
      certificateType: "participation",
    });
    setIssuedRegIds((prev) => [...prev, reg.id]);
    alert(`Certificate generated and accredited for ${reg.attendeeName}! View in Certificates tab.`);
  };

  const handleExportCsv = () => {
    const headers = ["Attendee Name,Roll Number,Email,Phone,Department,Year,Event Title,Submitted At"];
    const rows = filteredRegs.map((r) =>
      `"${r.attendeeName}","${r.rollNumber}","${r.email}","${r.phone || ""}","${r.department}","${r.yearOfStudy}","${r.eventTitle || ""}","${r.submittedAt}"`
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `edam_registrations_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredRegs = registrations.filter((reg) => {
    if (selectedEventId !== "all" && reg.eventId !== selectedEventId) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      reg.attendeeName.toLowerCase().includes(q) ||
      reg.rollNumber.toLowerCase().includes(q) ||
      reg.email.toLowerCase().includes(q) ||
      reg.department.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[#030305] text-[#F5F3FF] flex flex-col">
      <AdminHeader />

      <main className="flex-1 container mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-white tracking-tight">
              Attendee &amp; Registration Registry
            </h1>
            <p className="text-xs sm:text-sm text-[#928A9F] mt-1">
              Synchronized participants across e-DAM events, Google Forms, and community workshops.
            </p>
          </div>

          <Button variant="secondary" size="md" onClick={handleExportCsv}>
            <Download className="w-4 h-4" />
            <span>Export to CSV</span>
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-white/40 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by attendee name, roll number, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-[#8B5CF6] focus:outline-none text-xs text-[#F5F3FF] placeholder:text-white/30 transition-colors"
            />
          </div>

          <div className="sm:w-72">
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#14101F] border border-white/10 focus:border-[#8B5CF6] focus:outline-none text-xs text-[#F5F3FF]"
            >
              <option value="all">All Events ({registrations.length})</option>
              {events.map((evt) => (
                <option key={evt.id} value={evt.id}>
                  {evt.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="rounded-2xl bg-[#0B0614] border border-white/10 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 text-[#928A9F] uppercase tracking-wider font-semibold border-b border-white/10">
                <tr>
                  <th className="py-3 px-4">Attendee Name</th>
                  <th className="py-3 px-4">Roll Number</th>
                  <th className="py-3 px-4">Department &amp; Year</th>
                  <th className="py-3 px-4">Event</th>
                  <th className="py-3 px-4">Registered Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-[#F5F3FF]">
                {filteredRegs.map((reg) => {
                  const hasIssued = issuedRegIds.includes(reg.id);
                  return (
                    <tr key={reg.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-white">
                        <div>{reg.attendeeName}</div>
                        <div className="text-[11px] text-[#928A9F] font-mono">{reg.email}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-[#C4B5FD]">
                        {reg.rollNumber}
                      </td>
                      <td className="py-3.5 px-4 text-white/80">
                        {reg.department} • Year {reg.yearOfStudy}
                      </td>
                      <td className="py-3.5 px-4 max-w-xs truncate text-[#928A9F]">
                        {reg.eventTitle || "e-DAM Event"}
                      </td>
                      <td className="py-3.5 px-4 text-white/50 text-[11px]">
                        {new Date(reg.submittedAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {hasIssued ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Issued</span>
                          </span>
                        ) : canIssueCertificates ? (
                          <button
                            onClick={() => handleIssueCertForAttendee(reg)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#8B5CF6]/15 hover:bg-[#8B5CF6]/30 text-[#C4B5FD] hover:text-white border border-[#8B5CF6]/30 text-xs font-semibold transition-colors cursor-pointer"
                          >
                            <Award className="w-3.5 h-3.5 text-[#8B5CF6]" />
                            <span>Issue Cert</span>
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <AdminFooter />
    </div>
  );
};
