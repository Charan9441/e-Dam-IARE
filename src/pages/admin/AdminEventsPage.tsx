import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  PlusCircle,
  Search,
  Trash2,
  Edit2,
  ExternalLink,
  X,
  Sparkles,
} from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminFooter } from "@/components/admin/AdminFooter";
import { useAdminAuth } from "@/context/AdminAuthContext";
import {
  getStoredEvents,
  addEvent,
  updateEvent,
  deleteEvent,
} from "@/lib/edam-store";
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

  useEffect(() => {
    setEvents(getStoredEvents());
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
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
    setEditingId(evt.id);
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

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      deleteEvent(id);
      setEvents(getStoredEvents());
    }
  };

  const handleToggleReg = (evt: ChapterEvent) => {
    updateEvent(evt.id, { registrationOpen: !evt.registrationOpen });
    setEvents(getStoredEvents());
  };

  const handleAutoGenerateForm = async () => {
    if (!formData.title.trim()) {
      alert("Please enter an Event Title first before generating the Google Form.");
      return;
    }

    setIsGeneratingForm(true);
    try {
      const res = await createGoogleFormViaAppsScript({
        eventId: editingId || `evt_${Date.now().toString(36)}`,
        title: formData.title,
        description: formData.description || formData.tagline || "Official event registration for e-DAM IARE.",
        date: formData.date,
        time: formData.time,
        venue: formData.venue,
        registrationOpen: formData.registrationOpen,
      });

      if (res.success && res.formUrl) {
        setFormData((prev) => ({ ...prev, googleFormUrl: res.formUrl || "" }));
        alert(`Google Form created successfully via Apps Script!\n\nForm URL: ${res.formUrl}`);
      } else {
        alert(`Google Apps Script response: ${res.error || "Could not generate form. Check Apps Script permissions."}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Error calling Apps Script: ${msg}`);
    } finally {
      setIsGeneratingForm(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const slug =
      formData.slug.trim() ||
      formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");

    if (editingId) {
      updateEvent(editingId, {
        title: formData.title,
        slug,
        tagline: formData.tagline,
        category: formData.category,
        date: formData.date,
        time: formData.time,
        venue: formData.venue,
        mode: formData.mode,
        description: formData.description,
        googleFormUrl: formData.googleFormUrl.trim() || undefined,
        registrationOpen: formData.registrationOpen,
      });
    } else {
      addEvent({
        title: formData.title,
        slug,
        tagline: formData.tagline,
        category: formData.category,
        status: "upcoming",
        date: formData.date,
        time: formData.time,
        venue: formData.venue,
        mode: formData.mode,
        description: formData.description,
        detailedOverview: [formData.description],
        prerequisites: ["Curiosity and passion for building."],
        takeaways: ["Official Certificate of Participation from e-DAM."],
        speakers: [
          {
            name: "e-DAM Lead Facilitators",
            role: "Domain Leads",
            organization: "e-DAM IARE",
          },
        ],
        registrationDeadline: formData.date,
        registrationOpen: formData.registrationOpen,
        googleFormUrl: formData.googleFormUrl.trim() || undefined,
      });
    }

    setEvents(getStoredEvents());
    setIsModalOpen(false);
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
                {filteredEvents.map((evt) => (
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
                      <button
                        onClick={() => handleToggleReg(evt)}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold cursor-pointer transition-colors ${
                          evt.registrationOpen
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30"
                            : "bg-white/5 text-white/50 border border-white/10 hover:bg-white/10"
                        }`}
                      >
                        {evt.registrationOpen ? "● Open" : "Closed"}
                      </button>
                    </td>
                    <td className="py-3.5 px-4">
                      {evt.googleFormUrl ? (
                        <a
                          href={evt.googleFormUrl}
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
                          onClick={() => handleOpenEdit(evt)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
                          title="Edit Event"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {canDeleteEvents && (
                        <button
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
                ))}
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
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-2xl font-bold font-heading mb-6">
              {editingId ? "Edit Event" : "Create New Event"}
            </h2>

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
                  <button
                    type="button"
                    onClick={handleAutoGenerateForm}
                    disabled={isGeneratingForm}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#C4B5FD] hover:text-white px-2.5 py-1 rounded-md bg-[#8B5CF6]/20 hover:bg-[#8B5CF6]/40 border border-[#8B5CF6]/40 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#A855F7]" />
                    <span>{isGeneratingForm ? "Provisioning Form..." : "⚡ Auto-Generate via Apps Script"}</span>
                  </button>
                </div>
                <input
                  type="url"
                  placeholder="https://docs.google.com/forms/d/e/.../viewform"
                  value={formData.googleFormUrl}
                  onChange={(e) => setFormData({ ...formData, googleFormUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 focus:border-[#8B5CF6] focus:outline-none text-xs text-[#F5F3FF]"
                />
                <p className="text-[11px] text-[#928A9F] mt-1">
                  Click the button above to automatically generate a real Google Form linked to your Google Sheet!
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
                <Button type="submit" variant="primary">
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
