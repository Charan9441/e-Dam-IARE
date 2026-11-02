import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, MapPin, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import type { ChapterEvent } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EventRegistrationModal } from "./EventRegistrationModal";

interface EventCardProps {
  event: ChapterEvent;
  onRegistered?: () => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onRegistered }) => {
  const [showModal, setShowModal] = useState(false);

  const isUpcoming = event.status === "upcoming";

  return (
    <>
      <div className="group relative rounded-2xl bg-[#0B0614]/80 hover:bg-[#100B1C] border border-[#8B5CF6]/20 hover:border-[#8B5CF6]/50 transition-all duration-300 p-6 sm:p-7 flex flex-col justify-between overflow-hidden shadow-lg hover:shadow-[#8B5CF6]/15 hover:-translate-y-1">
        <div className="absolute top-0 right-0 w-36 h-36 bg-[#8B5CF6]/10 rounded-full blur-[60px] pointer-events-none group-hover:bg-[#8B5CF6]/20 transition-all" />

        <div>
          <div className="flex items-center justify-between gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8B5CF6]/15 text-[#C4B5FD] text-xs font-semibold tracking-wider uppercase border border-[#8B5CF6]/30">
              <Sparkles className="w-3 h-3 text-[#A855F7]" />
              {event.category}
            </span>

            {isUpcoming ? (
              <Badge variant="success" size="sm">
                ● Upcoming
              </Badge>
            ) : (
              <Badge variant="outline" size="sm">
                Archived
              </Badge>
            )}
          </div>

          <Link to={`/events/${event.slug}`} className="block group-hover:text-[#C4B5FD] transition-colors">
            <h3 className="text-xl sm:text-2xl font-bold font-heading text-[#F5F3FF] mb-2 leading-snug">
              {event.title}
            </h3>
          </Link>

          <p className="text-sm text-[#928A9F] mb-5 line-clamp-2 leading-relaxed">
            {event.tagline || event.description}
          </p>
        </div>

        <div>
          <div className="space-y-2 py-4 border-t border-white/10 text-xs text-[#928A9F]">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#8B5CF6] shrink-0" />
              <span className="text-white/80 font-medium">{event.date}</span>
              {event.time && <span>• {event.time}</span>}
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#8B5CF6] shrink-0" />
              <span className="truncate">{event.venue}</span>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between gap-3">
            <Link
              to={`/events/${event.slug}`}
              className="text-xs font-semibold text-[#C4B5FD] hover:text-white flex items-center gap-1 transition-colors py-2"
            >
              <span>View Details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            {isUpcoming && event.registrationOpen ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowModal(true)}
              >
                <span>Register Now</span>
              </Button>
            ) : isUpcoming ? (
              <span className="text-xs text-white/40 font-medium">Registrations Closed</span>
            ) : (
              <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Event Completed
              </span>
            )}
          </div>
        </div>
      </div>

      <EventRegistrationModal
        event={event}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onRegistered={onRegistered}
      />
    </>
  );
};
