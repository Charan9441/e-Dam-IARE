import React, { useState } from "react";
import { X, CheckCircle2, Calendar, MapPin, ExternalLink, Sparkles, AlertCircle } from "lucide-react";
import type { ChapterEvent } from "@/types";
import { Button } from "@/components/ui/Button";
import { registerAttendee } from "@/lib/edam-store";
import { safeExternalHttpUrl } from "@/lib/utils";

interface EventRegistrationModalProps {
  event: ChapterEvent;
  isOpen: boolean;
  onClose: () => void;
  onRegistered?: () => void;
}

export const EventRegistrationModal: React.FC<EventRegistrationModalProps> = ({
  event,
  isOpen,
  onClose,
  onRegistered,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    rollNumber: "",
    department: "CSE",
    yearOfStudy: "III",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const safeGoogleFormUrl = safeExternalHttpUrl(event.googleFormUrl);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.rollNumber.trim()) {
      setError("Please fill in your Full Name, Email, and Roll Number.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      registerAttendee({
        eventId: event.id,
        eventTitle: event.title,
        attendeeName: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        rollNumber: formData.rollNumber.trim().toUpperCase(),
        department: formData.department,
        yearOfStudy: formData.yearOfStudy,
      });

      setIsSuccess(true);
      if (onRegistered) onRegistered();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to submit registration.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-xl bg-[#0B0614] border border-[#8B5CF6]/30 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-[#8B5CF6]/20 text-[#F5F3FF] overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-[#8B5CF6]/20 rounded-full blur-[80px] pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold font-heading text-[#F5F3FF]">
              Registration Confirmed!
            </h3>
            <p className="text-sm text-[#928A9F] max-w-md mx-auto">
              You are registered for <span className="text-[#C4B5FD] font-semibold">{event.title}</span>. We have saved your confirmation. Check in at the venue with your student Roll Number.
            </p>
            <div className="pt-4 flex justify-center">
              <Button variant="primary" onClick={onClose}>
                Done & Close
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-6 space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8B5CF6]/20 text-[#C4B5FD] text-xs font-semibold uppercase tracking-wider border border-[#8B5CF6]/40">
                <Sparkles className="w-3.5 h-3.5" />
                {event.category}
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-heading">
                Register for {event.title}
              </h2>
              <div className="flex flex-wrap items-center gap-4 text-xs text-[#928A9F] pt-1">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#8B5CF6]" />
                  {event.date} â€¢ {event.time}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#8B5CF6]" />
                  {event.venue}
                </span>
              </div>
            </div>

            {/* External Google Form Notice if linked */}
            {safeGoogleFormUrl && (
              <div className="mb-6 p-4 rounded-xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-between gap-4">
                <div className="text-xs text-purple-200">
                  <p className="font-semibold text-white">Official Google Form Available</p>
                  <p className="text-purple-300/80">You can also register directly on the official Google Form.</p>
                </div>
                <a
                  href={safeGoogleFormUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-semibold transition-colors"
                >
                  <span>Open Form</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#928A9F] uppercase tracking-wider mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. K. Sai Charan"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 focus:border-[#8B5CF6] focus:outline-none text-sm text-[#F5F3FF] placeholder:text-white/20 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#928A9F] uppercase tracking-wider mb-1.5">
                    Roll Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 22951A0501"
                    value={formData.rollNumber}
                    onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 focus:border-[#8B5CF6] focus:outline-none text-sm text-[#F5F3FF] placeholder:text-white/20 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#928A9F] uppercase tracking-wider mb-1.5">
                    Institutional / Student Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. rollno@iare.ac.in"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 focus:border-[#8B5CF6] focus:outline-none text-sm text-[#F5F3FF] placeholder:text-white/20 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#928A9F] uppercase tracking-wider mb-1.5">
                    WhatsApp Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. +91 00000 00000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 focus:border-[#8B5CF6] focus:outline-none text-sm text-[#F5F3FF] placeholder:text-white/20 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#928A9F] uppercase tracking-wider mb-1.5">
                    Department
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#14101F] border border-white/10 focus:border-[#8B5CF6] focus:outline-none text-sm text-[#F5F3FF] transition-colors"
                  >
                    <option value="CSE">Computer Science & Engineering</option>
                    <option value="IT">Information Technology</option>
                    <option value="AI/ML">CSE (AI & Machine Learning)</option>
                    <option value="Data Science">CSE (Data Science)</option>
                    <option value="ECE">Electronics & Communication</option>
                    <option value="EEE">Electrical & Electronics</option>
                    <option value="Aero">Aeronautical Engineering</option>
                    <option value="Mechanical">Mechanical Engineering</option>
                    <option value="Other">Other Department</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#928A9F] uppercase tracking-wider mb-1.5">
                    Year of Study
                  </label>
                  <select
                    value={formData.yearOfStudy}
                    onChange={(e) => setFormData({ ...formData, yearOfStudy: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#14101F] border border-white/10 focus:border-[#8B5CF6] focus:outline-none text-sm text-[#F5F3FF] transition-colors"
                  >
                    <option value="I">1st Year (B.Tech I)</option>
                    <option value="II">2nd Year (B.Tech II)</option>
                    <option value="III">3rd Year (B.Tech III)</option>
                    <option value="IV">4th Year (B.Tech IV)</option>
                  </select>
                </div>
              </div>

              <p className="text-[11px] text-[#928A9F] pt-1">
                By submitting this form, you agree to receive event communications and participation credential updates according to our student data privacy policy.
              </p>

              <div className="pt-3 flex items-center justify-end gap-3">
                <Button type="button" variant="ghost" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={isSubmitting}>
                  Complete Registration
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

