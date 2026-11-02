import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Calendar,
  Clock,
  MapPin,
  ArrowLeft,
  CheckCircle2,
  Users,
  Award,
  Sparkles,
  ExternalLink,
  Share2,
} from "lucide-react";
import { getEventBySlug } from "@/lib/edam-store";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EventRegistrationModal } from "@/components/events/EventRegistrationModal";

export const EventDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const event = slug ? getEventBySlug(slug) : undefined;

  if (!event) {
    return (
      <div className="min-h-screen bg-[#030305] text-[#F5F3FF] pt-32 pb-20 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md mx-auto p-6">
          <h2 className="text-3xl font-bold font-heading">Event Not Found</h2>
          <p className="text-sm text-[#928A9F]">
            The event you are looking for may have concluded or the link may be outdated.
          </p>
          <Link to="/events">
            <Button variant="primary">
              <ArrowLeft className="w-4 h-4" />
              <span>Browse All Events</span>
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isUpcoming = event.status === "upcoming";

  return (
    <div className="min-h-screen bg-[#030305] text-[#F5F3FF] pt-28 pb-20">
      {/* Background glow */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[400px] bg-[#8B5CF6]/15 rounded-full blur-[140px] pointer-events-none -z-10" />

      <div className="container mx-auto px-6 max-w-6xl">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between mb-8">
          <Link
            to="/events"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#928A9F] hover:text-[#C4B5FD] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Events</span>
          </Link>

          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-white/70 hover:text-white transition-colors border border-white/10"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{copied ? "Link Copied!" : "Share Event"}</span>
          </button>
        </div>

        {/* Hero Card */}
        <div className="rounded-3xl bg-[#0B0614] border border-[#8B5CF6]/30 p-8 sm:p-12 mb-12 shadow-2xl relative overflow-hidden">
          <div className="max-w-3xl space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#8B5CF6]/20 text-[#C4B5FD] text-xs font-semibold tracking-wider uppercase border border-[#8B5CF6]/40">
                <Sparkles className="w-3.5 h-3.5" />
                {event.category}
              </span>

              {isUpcoming ? (
                <Badge variant="success">● Registrations Active</Badge>
              ) : (
                <Badge variant="outline">Event Concluded</Badge>
              )}

              {event.mode && (
                <span className="text-xs text-white/50 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
                  {event.mode}
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-heading tracking-tight leading-tight">
              {event.title}
            </h1>

            <p className="text-base sm:text-lg text-[#928A9F] leading-relaxed">
              {event.tagline || event.description}
            </p>

            {/* Event Key Details Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/10 text-xs text-[#F5F3FF]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#8B5CF6]">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] text-[#928A9F] uppercase tracking-wider font-semibold">Date</div>
                  <div className="font-semibold text-sm">{event.date}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#8B5CF6]">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] text-[#928A9F] uppercase tracking-wider font-semibold">Time</div>
                  <div className="font-semibold text-sm">{event.time}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#8B5CF6]">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] text-[#928A9F] uppercase tracking-wider font-semibold">Venue</div>
                  <div className="font-semibold text-sm truncate max-w-[200px]">{event.venue}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Layout: 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Description */}
          <div className="lg:col-span-8 space-y-10">
            {/* Overview */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold font-heading">Event Overview</h2>
              <p className="text-sm sm:text-base text-[#928A9F] leading-relaxed">
                {event.description}
              </p>
              {event.detailedOverview && event.detailedOverview.length > 0 && (
                <div className="space-y-2.5 pt-2">
                  {event.detailedOverview.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-sm text-[#F5F3FF]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] mt-2 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Prerequisites */}
            {event.prerequisites && event.prerequisites.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-2xl font-bold font-heading">Prerequisites &amp; Preparation</h2>
                <div className="rounded-2xl bg-[#0B0614] border border-white/10 p-6 space-y-3">
                  {event.prerequisites.map((req, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-sm text-[#928A9F]">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{req}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Takeaways */}
            {event.takeaways && event.takeaways.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-2xl font-bold font-heading">What You Will Gain</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {event.takeaways.map((takeaway, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl bg-[#0B0614] border border-[#8B5CF6]/20 p-5 flex items-start gap-3"
                    >
                      <Award className="w-5 h-5 text-[#8B5CF6] shrink-0 mt-0.5" />
                      <span className="text-sm text-[#F5F3FF] leading-relaxed">{takeaway}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Speakers / Mentors */}
            {event.speakers && event.speakers.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-2xl font-bold font-heading">Speakers &amp; Facilitators</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {event.speakers.map((speaker, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl bg-[#0B0614] border border-white/10 p-5 flex items-center gap-4"
                    >
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#8B5CF6]/30 to-[#C026FF]/30 border border-[#8B5CF6]/40 flex items-center justify-center font-heading font-bold text-lg text-white">
                        {speaker.name[0]}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white">{speaker.name}</h4>
                        <p className="text-xs text-[#8B5CF6] font-medium">{speaker.role}</p>
                        <p className="text-[11px] text-[#928A9F]">{speaker.organization}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Action Sidebar */}
          <div className="lg:col-span-4">
            <div className="sticky top-28 rounded-3xl bg-[#0B0614] border border-[#8B5CF6]/30 p-6 sm:p-7 space-y-6 shadow-xl">
              <div>
                <span className="text-[11px] uppercase tracking-wider font-semibold text-[#8B5CF6]">
                  Participation Status
                </span>
                <h3 className="text-2xl font-bold font-heading text-white mt-1">
                  {isUpcoming && event.registrationOpen ? "Open for Registration" : "Registration Closed"}
                </h3>
              </div>

              {event.capacity && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-[#928A9F]">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#8B5CF6]" />
                      Seat Capacity
                    </span>
                    <span className="font-semibold text-white">{event.capacity} seats limit</span>
                  </div>
                </div>
              )}

              {isUpcoming && event.registrationOpen ? (
                <div className="space-y-3">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    onClick={() => setShowModal(true)}
                  >
                    <span>Register for Event</span>
                  </Button>

                  {event.googleFormUrl && (
                    <a
                      href={event.googleFormUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-white/80 hover:text-white transition-colors border border-white/10"
                    >
                      <span>Register via Google Form</span>
                      <ExternalLink className="w-3.5 h-3.5 text-[#8B5CF6]" />
                    </a>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs text-[#928A9F] text-center">
                  Registrations for this session have officially concluded. Stay tuned for upcoming workshops!
                </div>
              )}

              <div className="pt-4 border-t border-white/10 space-y-2 text-xs text-[#928A9F]">
                <p>• Official Participation Certificate issued upon attendance.</p>
                <p>• Accessible to all registered IARE engineering students.</p>
                <p>• No registration fee required for chapter community events.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <EventRegistrationModal
        event={event}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </div>
  );
};

