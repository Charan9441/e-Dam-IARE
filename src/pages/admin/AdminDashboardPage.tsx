import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  Award,
  Users,
  PlusCircle,
  ExternalLink,
  FileSpreadsheet,
  AlertCircle,
} from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminFooter } from "@/components/admin/AdminFooter";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { ApiClient } from "@/lib/api-client";
import { mapApiEvent } from "@/lib/edam-store";
import type { ChapterEvent } from "@/types";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export const AdminDashboardPage: React.FC = () => {
  const { user, canCreateEvents, canEditEvents, canIssueCertificates } = useAdminAuth();
  const [events, setEvents] = useState<ChapterEvent[]>([]);
  const [certCount, setCertCount] = useState(0);
  const [regCount, setRegCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    setErrorMsg(null);
    const [eventsRes, certsRes, regsRes] = await Promise.all([
      ApiClient.getEvents(),
      ApiClient.getCertificates(),
      ApiClient.getRegistrations(),
    ]);

    if (eventsRes.success && Array.isArray(eventsRes.events)) {
      setEvents(eventsRes.events.map(mapApiEvent));
    }
    if (certsRes.success && Array.isArray(certsRes.certificates)) {
      setCertCount(certsRes.certificates.length);
    }
    if (regsRes.success && Array.isArray(regsRes.registrations)) {
      setRegCount(regsRes.registrations.length);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const toggleEventReg = async (event: ChapterEvent) => {
    if (!canEditEvents) return;
    setErrorMsg(null);
    const res = await ApiClient.updateEvent(event.id, {
      registrationOpen: !event.registrationOpen,
    });
    if (res.success) {
      await loadDashboardData();
    } else {
      setErrorMsg(res.error || "Unable to update event registration status.");
    }
  };

  const activeFormsCount = events.filter((e) => e.registrationOpen).length;

  return (
    <div className="min-h-screen bg-[#030305] text-[#F5F3FF] flex flex-col">
      <AdminHeader />

      <main className="flex-1 container mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-[#928A9F]">Authenticated as:</span>
              <span className="text-xs font-semibold text-white">{user?.fullName || user?.username}</span>
              <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/40">
                {user?.role || "OFFICER"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-white tracking-tight">
              Event Automation &amp; Certificate Console
            </h1>
            <p className="text-xs sm:text-sm text-[#928A9F] mt-1">
              Google Apps Script form provisioning, attendee registry, and cryptographically verified PDF credentials.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {canCreateEvents && (
              <Link to="/admin/events">
                <Button variant="primary" size="sm">
                  <PlusCircle className="w-4 h-4" />
                  <span>Manage Events</span>
                </Button>
              </Link>
            )}
            {canIssueCertificates && (
              <Link to="/admin/certificates">
                <Button variant="secondary" size="sm">
                  <Award className="w-4 h-4" />
                  <span>Issue Certificate</span>
                </Button>
              </Link>
            )}
          </div>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="rounded-2xl bg-[#0B0614] border border-[#8B5CF6]/20 p-5 space-y-2">
            <div className="flex items-center justify-between text-xs text-[#928A9F]">
              <span className="font-semibold uppercase tracking-wider">Total Events</span>
              <Calendar className="w-4 h-4 text-[#8B5CF6]" />
            </div>
            <div className="text-3xl font-bold font-heading text-white">{events.length}</div>
            <p className="text-[11px] text-[#C4B5FD]">Published &amp; community workshops</p>
          </div>

          <div className="rounded-2xl bg-[#0B0614] border border-emerald-500/20 p-5 space-y-2">
            <div className="flex items-center justify-between text-xs text-[#928A9F]">
              <span className="font-semibold uppercase tracking-wider">Active Registrations</span>
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-bold font-heading text-white">{activeFormsCount}</div>
            <p className="text-[11px] text-emerald-400">Events currently accepting responses</p>
          </div>

          <div className="rounded-2xl bg-[#0B0614] border border-blue-500/20 p-5 space-y-2">
            <div className="flex items-center justify-between text-xs text-[#928A9F]">
              <span className="font-semibold uppercase tracking-wider">Registered Attendees</span>
              <Users className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-3xl font-bold font-heading text-white">{regCount}</div>
            <p className="text-[11px] text-blue-300">Synchronized student sign-ups</p>
          </div>

          <div className="rounded-2xl bg-[#0B0614] border border-[#C026FF]/20 p-5 space-y-2">
            <div className="flex items-center justify-between text-xs text-[#928A9F]">
              <span className="font-semibold uppercase tracking-wider">Issued Certificates</span>
              <Award className="w-4 h-4 text-[#C026FF]" />
            </div>
            <div className="text-3xl font-bold font-heading text-white">{certCount}</div>
            <p className="text-[11px] text-[#C4B5FD]">Verifiable PDF credentials</p>
          </div>
        </div>

        <div className="rounded-2xl bg-[#0B0614] border border-white/10 overflow-hidden shadow-xl">
          <div className="p-5 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-base font-bold font-heading text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#8B5CF6]" />
              <span>Chapter Events Directory</span>
            </h2>
            <Link to="/admin/events" className="text-xs text-[#8B5CF6] hover:underline font-semibold">
              View All Events →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 text-[#928A9F] uppercase tracking-wider font-semibold border-b border-white/10">
                <tr>
                  <th className="py-3 px-4">Event Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Registration</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-[#F5F3FF]">
                {events.map((evt) => (
                  <tr key={evt.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white">
                      <div>{evt.title}</div>
                      <div className="text-[11px] text-[#928A9F] font-mono">{evt.venue}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#8B5CF6]/15 text-[#C4B5FD] text-[10px] font-semibold border border-[#8B5CF6]/30">
                        {evt.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-white/80">{evt.date}</td>
                    <td className="py-3.5 px-4">
                      <Badge variant={evt.status === "upcoming" ? "success" : "outline"} size="sm">
                        {evt.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      {canEditEvents ? (
                        <button
                          type="button"
                          onClick={() => toggleEventReg(evt)}
                          className={`px-2.5 py-1 rounded-md text-[10px] font-bold cursor-pointer transition-colors ${
                            evt.registrationOpen
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30"
                              : "bg-white/5 text-white/50 border border-white/10 hover:bg-white/10"
                          }`}
                        >
                          {evt.registrationOpen ? "● Open (Toggle)" : "Closed (Toggle)"}
                        </button>
                      ) : (
                        <span
                          className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold border ${
                            evt.registrationOpen
                              ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                              : "bg-white/5 text-white/50 border-white/10"
                          }`}
                        >
                          {evt.registrationOpen ? "● Open" : "Closed"}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <Link
                        to={`/events/${evt.slug}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-[11px] text-[#8B5CF6] hover:text-white transition-colors"
                      >
                        <span>Preview</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
                {events.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#928A9F]">
                      No active chapter events found in the database.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <AdminFooter />
    </div>
  );
};
