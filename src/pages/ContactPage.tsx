import React, { useState } from "react";
import {
  Mail,
  MapPin,
  Phone,
  Send,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { FaLinkedin as Linkedin, FaInstagram as Instagram, FaGithub as Github } from "react-icons/fa";
import { EDAM_INFO } from "@/data/edam-data";
import { Button } from "@/components/ui/Button";

export const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "Joining e-DAM Community",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#030305] text-[#F5F3FF] pt-28 pb-20">
      {/* Background Ambience */}
      <div className="absolute top-0 right-1/4 w-[700px] h-[400px] bg-[#8B5CF6]/15 rounded-full blur-[140px] pointer-events-none -z-10" />

      <div className="container mx-auto px-6 max-w-6xl">
        {/* Header */}
        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 text-[#C4B5FD] text-xs font-semibold uppercase tracking-widest mb-4">
            <Mail className="w-3.5 h-3.5" />
            <span>Connect &amp; Collaborate</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold font-heading tracking-tight mb-4">
            Get in Touch with e-DAM
          </h1>
          <p className="text-base sm:text-lg text-[#928A9F] leading-relaxed">
            Have questions about workshops, want to propose a collaboration, or eager to join our domain cohorts? Reach out directly.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Contact Details Column */}
          <div className="lg:col-span-5 space-y-8">
            <div className="rounded-3xl bg-[#0B0614] border border-[#8B5CF6]/20 p-8 space-y-6 shadow-xl">
              <h3 className="text-2xl font-bold font-heading text-white">Community Headquarters</h3>
              
              <div className="space-y-4 text-sm text-[#928A9F]">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#8B5CF6] shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">Campus Location</h4>
                    <p>{EDAM_INFO.address}</p>
                    <p className="text-xs text-white/50">{EDAM_INFO.institution}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#8B5CF6] shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">Email Communications</h4>
                    <a href={`mailto:${EDAM_INFO.contactEmail}`} className="text-[#C4B5FD] hover:underline">
                      {EDAM_INFO.contactEmail}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#8B5CF6] shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">Telephone</h4>
                    <p>{EDAM_INFO.phone}</p>
                  </div>
                </div>
              </div>

              {/* Social Channels */}
              <div className="pt-6 border-t border-white/10 space-y-3">
                <h4 className="text-xs uppercase tracking-wider font-semibold text-[#8B5CF6]">
                  Official Social Channels
                </h4>
                <div className="flex items-center gap-3">
                  <a
                    href={EDAM_INFO.socials.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-11 h-11 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#8B5CF6]/50 flex items-center justify-center text-white/70 hover:text-white transition-all"
                  >
                    <Instagram className="w-5 h-5" />
                  </a>
                  <a
                    href={EDAM_INFO.socials.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-11 h-11 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#8B5CF6]/50 flex items-center justify-center text-white/70 hover:text-white transition-all"
                  >
                    <Linkedin className="w-5 h-5" />
                  </a>
                  <a
                    href={EDAM_INFO.socials.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-11 h-11 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#8B5CF6]/50 flex items-center justify-center text-white/70 hover:text-white transition-all"
                  >
                    <Github className="w-5 h-5" />
                  </a>
                  <a
                    href={EDAM_INFO.socials.iareWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 h-11 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#8B5CF6]/50 flex items-center gap-2 text-xs font-semibold text-white/70 hover:text-white transition-all"
                  >
                    <span>IARE Portal</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Form Column */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl bg-[#0B0614] border border-[#8B5CF6]/30 p-8 sm:p-10 shadow-2xl relative">
              {submitted ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold font-heading text-white">Message Dispatched!</h3>
                  <p className="text-sm text-[#928A9F] max-w-md mx-auto">
                    Thank you for writing to e-DAM IARE. Our executive council coordinators will review your note and respond via email shortly.
                  </p>
                  <Button variant="primary" onClick={() => setSubmitted(false)}>
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <h3 className="text-2xl font-bold font-heading text-white mb-1">Send a Message</h3>
                    <p className="text-xs text-[#928A9F]">Fill in your information and let us know how we can collaborate.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#928A9F] uppercase tracking-wider mb-1.5">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. K. Sai Charan"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-[#8B5CF6] focus:outline-none text-sm text-[#F5F3FF] placeholder:text-white/20 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#928A9F] uppercase tracking-wider mb-1.5">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="e.g. rollno@iare.ac.in"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-[#8B5CF6] focus:outline-none text-sm text-[#F5F3FF] placeholder:text-white/20 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#928A9F] uppercase tracking-wider mb-1.5">
                      Subject
                    </label>
                    <select
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-[#14101F] border border-white/10 focus:border-[#8B5CF6] focus:outline-none text-sm text-[#F5F3FF] transition-colors"
                    >
                      <option value="Joining e-DAM Community">Joining e-DAM Student Community</option>
                      <option value="100 Days of Tech Query">100 Days of Tech Inquiry</option>
                      <option value="Event / Workshop Sponsorship">Workshop / Hackathon Collaboration</option>
                      <option value="Credential Verification Assistance">Credential / Certificate Assistance</option>
                      <option value="General Question">General Inquiry</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#928A9F] uppercase tracking-wider mb-1.5">
                      Message *
                    </label>
                    <textarea
                      required
                      rows={5}
                      placeholder="Share your ideas, questions, or branch details..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-[#8B5CF6] focus:outline-none text-sm text-[#F5F3FF] placeholder:text-white/20 transition-colors resize-none"
                    />
                  </div>

                  <Button type="submit" variant="primary" size="lg" className="w-full">
                    <Send className="w-4 h-4" />
                    <span>Submit Message</span>
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};



