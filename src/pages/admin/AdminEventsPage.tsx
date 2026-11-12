import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  PlusCircle,
  Search,
  Trash2,
  Edit2,
  ExternalLink,
  X,
  Sparkles,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminFooter } from "@/components/admin/AdminFooter";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { ApiClient } from "@/lib/api-client";
import { mapApiEvent } from "@/lib/edam-store";
import { safeExternalHttpUrl } from "@/lib/utils";
import type { ChapterEvent, EventCategory } from "@/types";
import { Button } from "@/components/ui/Button";
import { createGoogleFormViaAppsScript } from "@/lib/google-apps-script";

export const AdminEventsPage: React.FC = () => {
  const { canCreateEvents, canEditEvents, canDeleteEvents } = useAdminAuth();
  const [events, setEvents] = useState<ChapterEvent[]>([]);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isGeneratingForm, setIsGeneratingForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    tagline: "",
    category: "Design" as EventCategory,
    date: new Date().toISOString().split("T")[0],
    time: "10:00 AM – 04:00 PM IST",
    venue: "Design Studio & Innovation Lab, Block IV, IARE Campus",
    mode: "In-Person" as "In-Person" | "Virtual" | "Hybrid",
    description: "",
    googleFormUrl: "",
    registrationOpen: true,
  });

  const loadEvents = useCallback(async () => {
    const res = await ApiClient.getEvents();
    if (res.success && Array.isArray(res.events)) {
      setEvents(res.events.map(mapApiEvent));
    } else if (!res.success) {
      setErrorMsg(res.error || "Unable to fetch events from the server.");
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleOpenCreate = () => {
    if (!canCreateEvents) return;
    setEditingId(null);
    setModalError(null);
    setFormData({
      title: "",
      slug: "",
      tagline: "",
      category: "Design",
      date: new Date().toISOString().split("T")[0],
      time: "10:00 AM – 04:00 PM IST",
      venue: "Design Studio & Innovation Lab, Block IV, IARE Campus",
      mode: "In-Person",
      description: "",
      googleFormUrl: "",
      registrationOpen: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (evt: ChapterEvent) => {
    if (!canEditEvents) return;
    setEditingId(evt.id);
    setModalError(null);
    setFormData({
      title: evt.title,
      slug: evt.slug,
      tagline: evt.tagline,
      category: evt.category,
      date: evt.date,
      time: evt.time,
      venue: evt.venue,
      mode: evt.mode,
      description: evt.description,
      googleFormUrl: evt.googleFormUrl || "",
      registrationOpen: evt.registrationOpen,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!canDeleteEvents) return;
    if (!window.confirm("Are you sure you want to archive/delete this event?")) return;
    setErrorMsg(null);
    setStatusMsg(null);
    const res = await ApiClient.deleteEvent(id);
    if (res.success) {
      setStatusMsg("Event archived successfully.");
      await loadEvents();
    } else {
      setErrorMsg(res.error || "Failed to archive event.");
    }
  };

  const handleToggleReg = async (evt: ChapterEvent) => {
    if (!canEditEvents) return;
    setErrorMsg(null);
    const res = await ApiClient.updateEvent(evt.id, {
      registrationOpen: !evt.registrationOpen,
    });
    if (res.success) {
      await loadEvents();
    } else {
      setErrorMsg(res.error || "Failed to update registration status.");
    }
  };

  const handleAutoGenerateForm = async () => {
    if (!canCreateEvents) return;
    setModalError(null);
    if (!formData.title.trim()) {
      setModalError("Please enter an Event Title first before generating the Google Form.");
      return;
    }

    setIsGeneratingForm(true);
    try {
      const res = await createGoogleFormViaAppsScript({
        eventId: editingId || `evt_${Date.now().toString(36)}`,
        title: formData.title.trim(),
        description:
          formData.description.trim() ||
          formData.tagline.trim() ||
          "Official event registration for e-DAM IARE.",
        date: formData.date,
        time: formData.time,
        venue: formData.venue,
        registrationOpen: formData.registrationOpen,
      });

      const validFormUrl = safeExternalHttpUrl(res.formUrl);
      if (res.success && validFormUrl) {
        setFormData((prev) => ({ ...prev, googleFormUrl: validFormUrl }));
        setStatusMsg("Google Form created and linked securely via server proxy.");
      } else {
        setModalError(res.error || "Could not generate form. Verify Apps Script configuration.");
      }
    } catch {
      setModalError("Unable to reach Google Apps Script integration service.");
    } finally {
      setIsGeneratingForm(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setErrorMsg(null);

    const canSubmit = editingId ? canEditEvents : canCreateEvents;
    if (!canSubmit) {
      setModalError("You do not have permission to perform this action.");
      return;
    }

    if (!formData.title.trim()) {
      setModalError("Event title is required.");
      return;
    }

    let cleanedFormUrl: string | undefined;
    if (formData.googleFormUrl.trim()) {
      const checked = safeExternalHttpUrl(formData.googleFormUrl);
      if (!checked) {
        setModalError("Google Form URL must be a valid https:// or http:// link.");
        return;
      }
      cleanedFormUrl = checked;
    }

    const slug =
      formData.slug.trim() ||
      formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");

    const payload = {
      title: formData.title.trim(),
      slug,
      tagline: formData.tagline.trim(),
      category: formData.category,
      status: "upcoming",
      date: formData.date,
      time: formData.time.trim(),
      venue: formData.venue.trim(),
      mode:
        formData.mode === "Virtual"
          ? "online"
          : formData.mode === "Hybrid"
          ? "hybrid"
          : "offline",
      description: formData.description.trim(),
      googleFormUrl: cleanedFormUrl || "",
      registrationUrl: cleanedFormUrl || "",
      registrationOpen: formData.registrationOpen,
    };

    setIsSaving(true);
    try {
      const res = editingId
        ? await ApiClient.updateEvent(editingId, payload)
        : await ApiClient.createEvent(payload);

      if (res.success) {
        setStatusMsg(editingId ? "Event updated successfully." : "Event created successfully.");
        setIsModalOpen(false);
        await loadEvents();
      } else {
        setModalError(res.error || "Failed to save event.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const filteredEvents = events.filter((e) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      e.title.toLowerCase().includes(q) ||
      e.venue.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[#030305] text-[#F5F3FF] flex flex-col">
      <AdminHeader />

      <main className="flex-1 container mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-white tracking-tight">
              Event Management
            </h1>
            <p className="text-xs sm:text-sm text-[#928A9F] mt-1">
              Create, configure, and synchronize technical workshops and Google Forms registration links.
            </p>
          </div>

          {canCreateEvents && (
            <Button variant="primary" size="md" onClick={handleOpenCreate}>
              <PlusCircle className="w-4 h-4" />
              <span>Add New Event</span>
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

        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-white/40 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search events by title or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-[#8B5CF6] focus:outline-none text-xs text-[#F5F3FF] placeholder:text-white/30 transition-colors"
          />
        </div>

        <div className="rounded-2xl bg-[#0B0614] border border-white/10 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 text-[#928A9F] uppercase tracking-wider font-semibold border-b border-white/10">
                <tr>
                  <th className="py-3 px-4">Title &amp; Venue</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Date &amp; Time</th>
                  <th className="py-3 px-4">Registration</th>
                  <th className="py-3 px-4">Google Form</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-[#F5F3FF]">
                {filteredEvents.map((evt) => {
                  const safeLink = safeExternalHttpUrl(evt.googleFormUrl);
                  return (
                    <tr key={evt.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-white max-w-xs">
                        <div className="truncate">{evt.title}</div>
                        <div className="text-[11px] text-[#928A9F] font-mono truncate">{evt.venue}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#8B5CF6]/15 text-[#C4B5FD] text-[10px] font-semibold border border-[#8B5CF6]/30">
                          {evt.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-white/90">{evt.date}</div>
                        <div className="text-[11px] text-white/50">{evt.time}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        {canEditEvents ? (
                          <button
                            type="button"
                            onClick={() => handleToggleReg(evt)}
                            className={`px-2.5 py-1 rounded-md text-[10px] font-bold cursor-pointer transition-colors ${
                              evt.registrationOpen
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30"
                                : "bg-white/5 text-white/50 border border-white/10 hover:bg-white/10"
                            }`}
                          >
                            {evt.registrationOpen ? "● Open" : "Closed"}
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
                      <td className="py-3.5 px-4">
                        {safeLink ? (
                          <a
                            href={safeLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-purple-300 hover:text-white"
                          >
                            <span>Linked Form</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-[11px] text-white/30">None</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        {canEditEvents && (
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(evt)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
                            title="Edit Event"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canDeleteEvents && (
                          <button
                            type="button"
                            onClick={() => handleDelete(evt.id)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 transition-colors cursor-pointer"
                            title="Delete Event"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <Link
                          to={`/events/${evt.slug}`}
                          target="_blank"
                          className="p-1.5 inline-block rounded-lg bg-white/5 hover:bg-white/10 text-[#8B5CF6] hover:text-white transition-colors"
                          title="Preview Public Page"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
                {filteredEvents.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#928A9F]">
                      No events match the current filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-[#0B0614] border border-[#8B5CF6]/30 rounded-2xl p-6 sm:p-8 shadow-2xl text-[#F5F3FF] max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-2xl font-bold font-heading mb-6">
              {editingId ? "Edit Event" : "Create New Event"}
            </h2>

            {modalError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#928A9F] uppercase tracking-wider mb-1">
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Design Sprint 2026: UI/UX Challenge"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 focus:border-[#8B5CF6] focus:outline-none text-sm text-[#F5F3FF]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#928A9F] uppercase tracking-wider mb-1">
                    Slug (URL identifier)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. design-sprint-2026"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 focus:border-[#8B5CF6] focus:outline-none text-xs text-[#F5F3FF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#928A9F] uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as EventCategory })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#14101F] border border-white/10 focus:border-[#8B5CF6] focus:outline-none text-xs text-[#F5F3FF]"
                  >
                    <option value="Design">Design</option>
                    <option value="Development">Development</option>
                    <option value="Cybersecurity">Cybersecurity</option>
                    <option value="Data Science">Data Science</option>
                    <option value="AI & ML">AI & ML</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Hackathon">Hackathon</option>
                    <option value="Workshop">Workshop</option>
                    <option value="All Domains">All Domains</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#928A9F] uppercase tracking-wider mb-1">
                  Tagline / Short Summary
                </label>
                <input
                  type="text"
                  placeholder="e.g. A 48-hour intensive UI/UX design challenge"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 focus:border-[#8B5CF6] focus:outline-none text-xs text-[#F5F3FF]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#928A9F] uppercase tracking-wider mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#14101F] border border-white/10 focus:border-[#8B5CF6] focus:outline-none text-xs text-[#F5F3FF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#928A9F] uppercase tracking-wider mb-1">
                    Time
                  </label>
                  <input
                    type="text"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 focus:border-[#8B5CF6] focus:outline-none text-xs text-[#F5F3FF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#928A9F] uppercase tracking-wider mb-1">
                    Mode
                  </label>
                  <select
                    value={formData.mode}
                    onChange={(e) => setFormData({ ...formData, mode: e.target.value as "In-Person" | "Virtual" | "Hybrid" })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#14101F] border border-white/10 focus:border-[#8B5CF6] focus:outline-none text-xs text-[#F5F3FF]"
                  >
                    <option value="In-Person">In-Person</option>
                    <option value="Virtual">Virtual</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#928A9F] uppercase tracking-wider mb-1">
                  Venue
                </label>
                <input
                  type="text"
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 focus:border-[#8B5CF6] focus:outline-none text-xs text-[#F5F3FF]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#928A9F] uppercase tracking-wider mb-1">
                  Detailed Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 focus:border-[#8B5CF6] focus:outline-none text-xs text-[#F5F3FF] resize-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[#928A9F] uppercase tracking-wider">
                    Google Form URL
                  </label>
                  {canCreateEvents && (
                    <button
                      type="button"
                      onClick={handleAutoGenerateForm}
                      disabled={isGeneratingForm}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#C4B5FD] hover:text-white px-2.5 py-1 rounded-md bg-[#8B5CF6]/20 hover:bg-[#8B5CF6]/40 border border-[#8B5CF6]/40 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#A855F7]" />
                      <span>{isGeneratingForm ? "Provisioning Form..." : "⚡ Auto-Generate via Apps Script"}</span>
                    </button>
                  )}
                </div>
                <input
                  type="url"
                  placeholder="https://docs.google.com/forms/d/e/.../viewform"
                  value={formData.googleFormUrl}
                  onChange={(e) => setFormData({ ...formData, googleFormUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 focus:border-[#8B5CF6] focus:outline-none text-xs text-[#F5F3FF]"
                />
                <p className="text-[11px] text-[#928A9F] mt-1">
                  Click the button above to automatically generate a real Google Form linked to your Google Sheet via server proxy.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="regOpen"
                  checked={formData.registrationOpen}
                  onChange={(e) => setFormData({ ...formData, registrationOpen: e.target.checked })}
                  className="w-4 h-4 rounded text-[#8B5CF6] bg-white/5 border-white/10"
                />
                <label htmlFor="regOpen" className="text-xs text-white/80 font-medium">
                  Allow student registrations immediately upon save
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/10">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={isSaving}>
                  {editingId ? "Save Changes" : "Create Event"}
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
