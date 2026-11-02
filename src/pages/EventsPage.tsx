import React, { useState, useMemo } from "react";
import { Search, Calendar } from "lucide-react";
import type { ChapterEvent } from "@/types";
import { getStoredEvents } from "@/lib/edam-store";
import { EventCard } from "@/components/events/EventCard";


type FilterTab = "All" | "Upcoming" | "Past" | "Design" | "Development" | "Cybersecurity" | "Data Science" | "AI & ML" | "Marketing";

export const EventsPage: React.FC = () => {
  const [events, setEvents] = useState<ChapterEvent[]>(() => getStoredEvents());
  const [selectedTab, setSelectedTab] = useState<FilterTab>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const refreshEvents = () => {
    setEvents(getStoredEvents());
  };

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      // Tab filter
      if (selectedTab === "Upcoming" && event.status !== "upcoming") return false;
      if (selectedTab === "Past" && event.status !== "past") return false;
      if (
        selectedTab !== "All" &&
        selectedTab !== "Upcoming" &&
        selectedTab !== "Past" &&
        event.category !== selectedTab
      ) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = event.title.toLowerCase().includes(q);
        const matchesTagline = (event.tagline || "").toLowerCase().includes(q);
        const matchesVenue = event.venue.toLowerCase().includes(q);
        const matchesCategory = event.category.toLowerCase().includes(q);
        return matchesTitle || matchesTagline || matchesVenue || matchesCategory;
      }

      return true;
    });
  }, [events, selectedTab, searchQuery]);

  const upcomingCount = events.filter((e) => e.status === "upcoming").length;
  const pastCount = events.filter((e) => e.status === "past").length;

  const tabs: { label: string; value: FilterTab; badge?: number }[] = [
    { label: "All Events", value: "All", badge: events.length },
    { label: "Upcoming", value: "Upcoming", badge: upcomingCount },
    { label: "Past Archive", value: "Past", badge: pastCount },
    { label: "Design", value: "Design" },
    { label: "Development", value: "Development" },
    { label: "Cybersecurity", value: "Cybersecurity" },
    { label: "Data Science", value: "Data Science" },
    { label: "AI & ML", value: "AI & ML" },
    { label: "Marketing", value: "Marketing" },
  ];

  return (
    <div className="min-h-screen bg-[#030305] text-[#F5F3FF] pt-28 pb-20">
      {/* Background Ambience */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-[#8B5CF6]/15 rounded-full blur-[140px] pointer-events-none -z-10" />

      <div className="container mx-auto px-6">
        {/* Header Section */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 text-[#C4B5FD] text-xs font-semibold uppercase tracking-widest mb-4">
            <Calendar className="w-3.5 h-3.5" />
            <span>Community Calendar</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight font-heading mb-4">
            Technical Sprints &amp; Workshops
          </h1>
          <p className="text-base sm:text-lg text-[#928A9F] leading-relaxed">
            Hands-on challenges, design hackathons, masterclasses, and coding bootcamps curated by e-DAM IARE.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="mb-10 space-y-4">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-white/40 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search events by title, venue, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-[#8B5CF6] focus:outline-none text-sm text-[#F5F3FF] placeholder:text-white/30 transition-colors"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {tabs.map((tab) => {
              const active = selectedTab === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => setSelectedTab(tab.value)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                    active
                      ? "bg-[#8B5CF6] text-white shadow-lg shadow-[#8B5CF6]/25 border border-[#A855F7]/40"
                      : "bg-[#0B0614] text-[#928A9F] hover:text-white hover:bg-white/5 border border-white/10"
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${active ? "bg-white/20 text-white" : "bg-white/10 text-white/60"}`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Events Grid */}
        {filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} onRegistered={refreshEvents} />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center rounded-2xl bg-[#0B0614]/50 border border-white/10 max-w-md mx-auto">
            <Calendar className="w-10 h-10 text-white/30 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">No events match your search</h3>
            <p className="text-xs text-[#928A9F] mb-4">Try clearing your filters or search keywords.</p>
            <button
              onClick={() => {
                setSelectedTab("All");
                setSearchQuery("");
              }}
              className="text-xs text-[#8B5CF6] font-semibold hover:underline"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};


