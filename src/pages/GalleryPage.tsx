import React, { useState } from "react";
import { Image, X } from "lucide-react";
import { EDAM_GALLERY } from "@/data/edam-data";
import type { GalleryItem } from "@/types";

type GalleryCategory = "All" | "Design Sprints" | "Workshops" | "Hackathons" | "Community" | "Celebrations";

export const GalleryPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<GalleryCategory>("All");
  const [activePhoto, setActivePhoto] = useState<GalleryItem | null>(null);

  const categories: GalleryCategory[] = [
    "All",
    "Design Sprints",
    "Workshops",
    "Hackathons",
    "Community",
    "Celebrations",
  ];

  const filteredPhotos = selectedCategory === "All"
    ? EDAM_GALLERY
    : EDAM_GALLERY.filter((p) => p.category === selectedCategory);

  return (
    <div className="min-h-screen bg-[#030305] text-[#F5F3FF] pt-28 pb-20">
      {/* Background Ambience */}
      <div className="absolute top-0 left-1/4 w-[700px] h-[400px] bg-[#8B5CF6]/15 rounded-full blur-[140px] pointer-events-none -z-10" />

      <div className="container mx-auto px-6 max-w-6xl">
        {/* Header */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 text-[#C4B5FD] text-xs font-semibold uppercase tracking-widest mb-4">
            <Image className="w-3.5 h-3.5" />
            <span>Visual Chronicles</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold font-heading tracking-tight mb-4">
            Moments at e-DAM
          </h1>
          <p className="text-base sm:text-lg text-[#928A9F] leading-relaxed">
            Snapshots of collaborative hackathons, creative coding labs, jury presentations, and community milestones.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-10 scrollbar-none">
          {categories.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                  active
                    ? "bg-[#8B5CF6] text-white shadow-lg shadow-[#8B5CF6]/25 border border-[#A855F7]/40"
                    : "bg-[#0B0614] text-[#928A9F] hover:text-white hover:bg-white/5 border border-white/10"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPhotos.map((photo) => (
            <div
              key={photo.id}
              onClick={() => setActivePhoto(photo)}
              className="group relative rounded-2xl bg-[#0B0614] border border-[#8B5CF6]/20 hover:border-[#8B5CF6]/50 overflow-hidden cursor-pointer shadow-lg hover:shadow-[#8B5CF6]/20 transition-all duration-300"
            >
              <div className="aspect-[4/3] w-full overflow-hidden bg-zinc-900">
                <img
                  src={photo.imageUrl}
                  alt={photo.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              </div>

              <div className="p-5 space-y-2">
                <div className="flex items-center justify-between text-xs text-[#928A9F]">
                  <span className="text-[#8B5CF6] font-semibold uppercase tracking-wider text-[10px]">
                    {photo.category}
                  </span>
                  <span>{photo.date}</span>
                </div>
                <h3 className="font-bold text-base text-white group-hover:text-[#C4B5FD] transition-colors">
                  {photo.title}
                </h3>
                <p className="text-xs text-[#928A9F] line-clamp-2">
                  {photo.caption}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      {activePhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in"
          onClick={() => setActivePhoto(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-[#0B0614] border border-[#8B5CF6]/30 rounded-3xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActivePhoto(null)}
              className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="max-h-[70vh] w-full overflow-hidden bg-black flex items-center justify-center">
              <img
                src={activePhoto.imageUrl}
                alt={activePhoto.title}
                className="w-full h-auto max-h-[70vh] object-contain"
              />
            </div>
            <div className="p-6 space-y-2">
              <div className="flex items-center gap-2 text-xs text-[#8B5CF6] font-semibold">
                <span>{activePhoto.category}</span>
                <span>â€¢</span>
                <span>{activePhoto.date}</span>
              </div>
              <h2 className="text-2xl font-bold font-heading text-white">{activePhoto.title}</h2>
              <p className="text-sm text-[#928A9F]">{activePhoto.caption}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


