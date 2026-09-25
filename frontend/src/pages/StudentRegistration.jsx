import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  GraduationCap,
  Sparkles,
  Send,
  CheckCircle2,
  Instagram,
  Linkedin,
  Youtube,
  Github,
  Twitter,
  Globe,
  Video,
  Code2,
  Film,
  Phone,
  Mail,
  Building2,
  BookOpen,
  ArrowRight,
  Share2,
  Copy,
  Check,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { api, formatApiErrorDetail } from "../lib/api";

const POPULAR_COLLEGES = [
  "Anna University (CEG / MIT)",
  "Loyola College, Chennai",
  "SRM Institute of Science & Tech",
  "IIT Madras",
  "SSN College of Engineering",
  "Sathyabama University",
  "Madras Christian College (MCC)",
  "PSG Tech, Coimbatore",
  "Stella Maris College",
  "Vellore Institute of Tech (VIT)",
];

const ROLES = [
  {
    id: "creator",
    title: "Content Creator",
    tamil: "உள்ளடக்க உருவாக்குநர்",
    icon: Video,
    color: "from-amber-500/20 to-orange-500/10 border-amber-500/40 text-amber-300",
    desc: "Create engaging harbour dawn reels, food vlogs, dockside stories, and campus marketing campaigns.",
    skills: ["Reels & Shorts", "Storytelling", "Campus Ambassador", "Photography"],
  },
  {
    id: "developer",
    title: "Software Developer",
    tamil: "மென்பொருள் உருவாக்குநர்",
    icon: Code2,
    color: "from-cyan-500/20 to-blue-500/10 border-cyan-500/40 text-cyan-300",
    desc: "Build modern web experiences, mobile apps, real-time logistics sync, and automation pipelines.",
    skills: ["React / Frontend", "Python / FastAPI", "Flutter Mobile", "Supabase & APIs"],
  },
  {
    id: "editor",
    title: "Video & Visual Editor",
    tamil: "காணொளி தொகுப்பாளர்",
    icon: Film,
    color: "from-purple-500/20 to-pink-500/10 border-purple-500/40 text-purple-300",
    desc: "Craft cinematic harbour dawn edits, color-graded recipe cuts, motion graphics, and promotional posters.",
    skills: ["Premiere Pro / DaVinci", "CapCut / After Effects", "Motion Graphics", "Poster Design"],
  },
];

const SOCIAL_PLATFORMS = [
  { id: "instagram", name: "Instagram", icon: Instagram, placeholder: "@username or instagram.com/..." },
  { id: "linkedin", name: "LinkedIn", icon: Linkedin, placeholder: "linkedin.com/in/..." },
  { id: "youtube", name: "YouTube", icon: Youtube, placeholder: "youtube.com/@channel or link" },
  { id: "github", name: "GitHub", icon: Github, placeholder: "github.com/username (for devs)" },
  { id: "twitter", name: "X / Twitter", icon: Twitter, placeholder: "@handle or x.com/..." },
  { id: "portfolio", name: "Portfolio / Other", icon: Globe, placeholder: "Behance, Dribbble, Website, Drive" },
];

export default function StudentRegistration() {
  const [form, setForm] = useState({
    name: "",
    college: "",
    department: "",
    year_of_study: "3rd Year",
    phone: "",
    email: "",
    has_social_media: false,
    role_preference: "creator",
    social_links: {
      instagram: "",
      linkedin: "",
      youtube: "",
      github: "",
      twitter: "",
      portfolio: "",
    },
    portfolio_url: "",
    notes: "",
  });

  const [activeSocialTabs, setActiveSocialTabs] = useState(["instagram"]);
  const [submitting, setSubmitting] = useState(false);
  const [submittedApp, setSubmittedApp] = useState(null);
  const [error, setError] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);

  const handleInputChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (error) setError("");
  };

  const handleSocialLinkChange = (platform, value) => {
    setForm((prev) => ({
      ...prev,
      social_links: {
        ...prev.social_links,
        [platform]: value,
      },
    }));
  };

  const toggleSocialTab = (platformId) => {
    setActiveSocialTabs((prev) =>
      prev.includes(platformId)
        ? prev.filter((p) => p !== platformId)
        : [...prev, platformId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!form.college.trim()) {
      setError("Please enter your college name.");
      return;
    }
    if (!form.department.trim()) {
      setError("Please enter your department.");
      return;
    }
    const cleanPhone = form.phone.replace(/[^0-9]/g, "");
    if (cleanPhone.length < 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    setSubmitting(true);
    try {
      const activePlatforms = form.has_social_media
        ? Object.entries(form.social_links)
            .filter(([_, url]) => url && url.trim().length > 0)
            .map(([plat]) => plat)
        : [];

      const payload = {
        name: form.name.trim(),
        college: form.college.trim(),
        department: form.department.trim(),
        year_of_study: form.year_of_study,
        phone: cleanPhone,
        email: form.email.trim(),
        has_social_media: Boolean(form.has_social_media),
        social_platforms: activePlatforms,
        social_links: form.has_social_media ? form.social_links : {},
        role_preference: form.role_preference,
        portfolio_url: form.portfolio_url.trim(),
        notes: form.notes.trim(),
      };

      const res = await api.post("/students/register", payload);
      setSubmittedApp({
        application_id: res.data?.application_id || "MSN-2026-REGISTERED",
        name: form.name,
        role: form.role_preference,
        college: form.college,
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(
        formatApiErrorDetail(err.response?.data?.detail) ||
          "Could not submit registration. Please check your connection and try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const resetForm = () => {
    setSubmittedApp(null);
    setForm({
      name: "",
      college: "",
      department: "",
      year_of_study: "3rd Year",
      phone: "",
      email: "",
      has_social_media: false,
      role_preference: "creator",
      social_links: {
        instagram: "",
        linkedin: "",
        youtube: "",
        github: "",
        twitter: "",
        portfolio: "",
      },
      portfolio_url: "",
      notes: "",
    });
  };

  return (
    <div className="min-h-screen bg-[#070A0E] text-[#F3EFE6] selection:bg-gold selection:text-black relative overflow-x-hidden font-sans pb-16">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-gold/10 rounded-full blur-3xl opacity-60" />
        <div className="absolute top-1/3 -right-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl opacity-40" />
        <div className="absolute bottom-10 left-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl opacity-30" />
      </div>

      {/* Header bar */}
      <header className="relative z-10 border-b border-gold/15 bg-[#0B0F15]/80 backdrop-blur-md sticky top-0 px-4 py-3.5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-full bg-gold/15 border border-gold/40 flex items-center justify-center text-gold font-serif text-lg font-bold group-hover:scale-105 transition-transform">
            மீ
          </div>
          <div>
            <span className="font-serif text-base tracking-wider text-gold-shimmer font-semibold block leading-none">
              MEENAMMA
            </span>
            <span className="text-[10px] text-[#A8A090] tracking-widest uppercase block mt-0.5">
              Student Network
            </span>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={copyShareLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gold/25 bg-gold/10 text-gold-bright text-xs hover:bg-gold/20 transition-all font-mono"
            title="Copy Form Link"
          >
            {copiedLink ? <Check size={13} className="text-emerald-400" /> : <Share2 size={13} />}
            <span>{copiedLink ? "Copied" : "Share"}</span>
          </button>
        </div>
      </header>

      <main className="relative z-10 max-w-2xl mx-auto px-4 pt-6 md:pt-10">
        {submittedApp ? (
          /* ================= SUCCESS STATE ================= */
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0B0F15] border border-gold/30 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
              <CheckCircle2 size={36} />
            </div>

            <div className="space-y-2">
              <span className="badge-gold text-xs px-3 py-1 font-mono uppercase tracking-wider">
                Registration Successful
              </span>
              <h1 className="font-serif text-2xl sm:text-3xl text-gold-gradient font-medium">
                Welcome to Meenamma, {submittedApp.name}!
              </h1>
              <p className="text-sm text-[#BDB5A6] max-w-md mx-auto">
                We've received your registration as a{" "}
                <span className="text-gold-bright font-semibold capitalize">
                  {submittedApp.role}
                </span>{" "}
                from <span className="text-white font-medium">{submittedApp.college}</span>.
              </p>
            </div>

            {/* Application ID Card */}
            <div className="bg-[#121720] border border-gold/20 rounded-xl p-4 max-w-sm mx-auto space-y-1">
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#8E8675] block">
                Application Reference ID
              </span>
              <p className="font-mono text-xl sm:text-2xl text-gold font-bold tracking-wider">
                {submittedApp.application_id}
              </p>
              <p className="text-[11px] text-[#A8A090]">Save this ID for your reference</p>
            </div>

            {/* Next Steps */}
            <div className="text-left bg-[#10151D] border border-gold/10 rounded-xl p-4 sm:p-5 space-y-3">
              <h3 className="text-xs uppercase font-mono tracking-wider text-gold-bright font-semibold flex items-center gap-2">
                <Sparkles size={14} className="text-gold" /> What Happens Next?
              </h3>
              <ul className="text-xs text-[#BDB5A6] space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-gold font-mono font-bold">1.</span>
                  <span>Our core team will review your portfolio / social links within 48 hours.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gold font-mono font-bold">2.</span>
                  <span>You will receive an official onboarding message via WhatsApp/Phone.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gold font-mono font-bold">3.</span>
                  <span>
                    Get hands-on experience, project stipends, and earn certificates from Kasimedu's seafood tech platform!
                  </span>
                </li>
              </ul>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={resetForm}
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg border border-gold/25 bg-[#141A22] text-[#E0D9CC] text-xs hover:border-gold/50 transition-colors"
              >
                Submit Another Response
              </button>
              <Link
                to="/"
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-gold text-black font-semibold text-xs hover:bg-gold-shimmer transition-colors shadow-lg shadow-gold/20 flex items-center justify-center gap-1.5"
              >
                Explore Meenamma.org <ArrowRight size={14} />
              </Link>
            </div>
          </motion.div>
        ) : (
          /* ================= REGISTRATION FORM ================= */
          <div className="space-y-6">
            {/* Hero / Intro */}
            <div className="space-y-3 text-center sm:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gold/30 bg-gold/10 text-gold-bright text-xs font-mono">
                <GraduationCap size={14} />
                <span>College Student Intake 2026</span>
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl text-gold-gradient font-medium tracking-tight">
                மீனம்மை மாணவர் திட்டம்
              </h1>
              <p className="font-sans text-base text-[#D4CDC1] font-light leading-relaxed">
                Join Meenamma as a{" "}
                <span className="text-amber-300 font-medium">Creator</span>,{" "}
                <span className="text-cyan-300 font-medium">Developer</span>, or{" "}
                <span className="text-purple-300 font-medium">Video Editor</span>. Build real-world work, gain campus visibility, and collaborate on Tamil Nadu's dawn catch seafood platform.
              </p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs flex items-center gap-2"
              >
                <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* SECTION 1: PERSONAL & COLLEGE */}
              <div className="bg-[#0B0F15] border border-gold/20 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-gold/15 pb-2.5">
                  <h2 className="text-xs uppercase font-mono tracking-widest text-gold-bright font-semibold flex items-center gap-2">
                    <Building2 size={15} className="text-gold" /> 1. Student & College Info
                  </h2>
                  <span className="text-[10px] text-[#8E8675] font-mono">* Required</span>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-[#C5BEB1] block mb-1 font-medium">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      className="w-full bg-[#121720] border border-gold/25 rounded-lg px-3.5 py-2.5 text-sm text-[#F3EFE6] focus:border-gold focus:outline-none transition-colors"
                      placeholder="e.g. Rathnavel, Ananya, Karthi"
                      value={form.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs text-[#C5BEB1] block mb-1 font-medium">
                      Which College? *
                    </label>
                    <input
                      type="text"
                      className="w-full bg-[#121720] border border-gold/25 rounded-lg px-3.5 py-2.5 text-sm text-[#F3EFE6] focus:border-gold focus:outline-none transition-colors"
                      placeholder="e.g. Anna University, Loyola College, SRM, etc."
                      value={form.college}
                      onChange={(e) => handleInputChange("college", e.target.value)}
                      required
                    />
                    {/* Quick selection chips for colleges */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {POPULAR_COLLEGES.slice(0, 5).map((col) => (
                        <button
                          key={col}
                          type="button"
                          onClick={() => handleInputChange("college", col)}
                          className={`text-[10px] px-2 py-1 rounded-md border transition-all ${
                            form.college === col
                              ? "bg-gold text-black border-gold font-medium"
                              : "bg-[#141A22] text-[#9E9685] border-gold/15 hover:border-gold/40 hover:text-[#E0D9CC]"
                          }`}
                        >
                          {col.split(",")[0]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-[#C5BEB1] block mb-1 font-medium">
                        Which Department / Degree? *
                      </label>
                      <input
                        type="text"
                        className="w-full bg-[#121720] border border-gold/25 rounded-lg px-3.5 py-2.5 text-sm text-[#F3EFE6] focus:border-gold focus:outline-none transition-colors"
                        placeholder="e.g. CSE, VisCom, Media, IT, ECE"
                        value={form.department}
                        onChange={(e) => handleInputChange("department", e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs text-[#C5BEB1] block mb-1 font-medium">
                        Year of Study
                      </label>
                      <select
                        className="w-full bg-[#121720] border border-gold/25 rounded-lg px-3.5 py-2.5 text-sm text-[#F3EFE6] focus:border-gold focus:outline-none transition-colors"
                        value={form.year_of_study}
                        onChange={(e) => handleInputChange("year_of_study", e.target.value)}
                      >
                        <option value="1st Year">1st Year</option>
                        <option value="2nd Year">2nd Year</option>
                        <option value="3rd Year">3rd Year</option>
                        <option value="Final Year">Final Year</option>
                        <option value="Recent Graduate">Recent Graduate</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: CONTACT DETAILS */}
              <div className="bg-[#0B0F15] border border-gold/20 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-gold/15 pb-2.5">
                  <h2 className="text-xs uppercase font-mono tracking-widest text-gold-bright font-semibold flex items-center gap-2">
                    <Phone size={15} className="text-gold" /> 2. Contact Details
                  </h2>
                  <span className="text-[10px] text-[#8E8675] font-mono">For WhatsApp Updates</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-[#C5BEB1] block mb-1 font-medium">
                      WhatsApp / Phone Number *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs text-[#8E8675] font-mono">
                        +91
                      </span>
                      <input
                        type="tel"
                        className="w-full bg-[#121720] border border-gold/25 rounded-lg pl-12 pr-3.5 py-2.5 text-sm text-[#F3EFE6] focus:border-gold focus:outline-none transition-colors font-mono"
                        placeholder="10-digit number"
                        value={form.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        maxLength={10}
                        required
                      />
                    </div>
                    <span className="text-[10px] text-[#8E8675] mt-1 block">
                      We'll contact you on WhatsApp with next steps.
                    </span>
                  </div>

                  <div>
                    <label className="text-xs text-[#C5BEB1] block mb-1 font-medium">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail size={15} className="absolute left-3 top-3 text-[#8E8675]" />
                      <input
                        type="email"
                        className="w-full bg-[#121720] border border-gold/25 rounded-lg pl-9 pr-3.5 py-2.5 text-sm text-[#F3EFE6] focus:border-gold focus:outline-none transition-colors"
                        placeholder="yourname@gmail.com"
                        value={form.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: ROLE PREFERENCE */}
              <div className="bg-[#0B0F15] border border-gold/20 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-gold/15 pb-2.5">
                  <h2 className="text-xs uppercase font-mono tracking-widest text-gold-bright font-semibold flex items-center gap-2">
                    <Sparkles size={15} className="text-gold" /> 3. What Would You Want to Be? *
                  </h2>
                  <span className="text-[10px] text-gold-dim">Pick your primary area</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {ROLES.map((role) => {
                    const Icon = role.icon;
                    const isSelected = form.role_preference === role.id;
                    return (
                      <div
                        key={role.id}
                        onClick={() => handleInputChange("role_preference", role.id)}
                        className={`cursor-pointer rounded-xl p-4 border transition-all duration-200 relative overflow-hidden group flex flex-col justify-between ${
                          isSelected
                            ? `bg-gradient-to-b ${role.color} border-gold shadow-lg ring-1 ring-gold/40`
                            : "bg-[#121720]/80 border-gold/15 hover:border-gold/30 hover:bg-[#151B25]"
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div
                              className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                                isSelected ? "bg-white/10 text-white" : "bg-black/30 text-gold-dim"
                              }`}
                            >
                              <Icon size={18} />
                            </div>
                            <div
                              className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                                isSelected
                                  ? "border-gold bg-gold text-black"
                                  : "border-gold/20 group-hover:border-gold/40"
                              }`}
                            >
                              {isSelected && <Check size={12} className="stroke-[3]" />}
                            </div>
                          </div>
                          <div>
                            <h3 className="font-medium text-sm text-[#F5F2EB]">{role.title}</h3>
                            <span className="text-[10px] text-[#A8A090] tamil">{role.tamil}</span>
                          </div>
                          <p className="text-[11px] text-[#A8A090] leading-snug">{role.desc}</p>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-white/5 flex flex-wrap gap-1">
                          {role.skills.slice(0, 2).map((s) => (
                            <span
                              key={s}
                              className="text-[9px] px-1.5 py-0.5 rounded bg-black/40 text-[#C5BEB1] font-mono"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 4: SOCIAL MEDIA QUESTION & LINKS */}
              <div className="bg-[#0B0F15] border border-gold/20 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-gold/15 pb-2.5">
                  <h2 className="text-xs uppercase font-mono tracking-widest text-gold-bright font-semibold flex items-center gap-2">
                    <Globe size={15} className="text-gold" /> 4. Social Media Presence
                  </h2>
                </div>

                {/* Yes/No toggle question */}
                <div className="space-y-2">
                  <label className="text-xs text-[#C5BEB1] block font-medium">
                    Do you have social media? *
                  </label>
                  <div className="grid grid-cols-2 gap-3 max-w-sm">
                    <button
                      type="button"
                      onClick={() => handleInputChange("has_social_media", true)}
                      className={`py-2.5 px-4 rounded-xl border text-xs font-medium transition-all flex items-center justify-center gap-2 ${
                        form.has_social_media
                          ? "bg-gold/15 border-gold text-gold-bright shadow-sm"
                          : "bg-[#121720] border-gold/20 text-[#A8A090] hover:border-gold/40"
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${form.has_social_media ? "bg-gold" : "bg-transparent border border-gold/40"}`} />
                      Yes, I do
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInputChange("has_social_media", false)}
                      className={`py-2.5 px-4 rounded-xl border text-xs font-medium transition-all flex items-center justify-center gap-2 ${
                        !form.has_social_media
                          ? "bg-gold/15 border-gold text-gold-bright shadow-sm"
                          : "bg-[#121720] border-gold/20 text-[#A8A090] hover:border-gold/40"
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${!form.has_social_media ? "bg-gold" : "bg-transparent border border-gold/40"}`} />
                      No, not active
                    </button>
                  </div>
                </div>

                {/* If Yes: Platform chips & profile link inputs */}
                <AnimatePresence>
                  {form.has_social_media && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4 pt-2 border-t border-gold/10 overflow-hidden"
                    >
                      <div>
                        <span className="text-[11px] text-[#A8A090] block mb-2">
                          Select the platforms you're on and paste your profile links:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {SOCIAL_PLATFORMS.map((plat) => {
                            const Icon = plat.icon;
                            const isActive = activeSocialTabs.includes(plat.id);
                            return (
                              <button
                                key={plat.id}
                                type="button"
                                onClick={() => toggleSocialTab(plat.id)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-all ${
                                  isActive
                                    ? "bg-gold/20 border-gold text-gold-bright font-medium"
                                    : "bg-[#121720] border-gold/15 text-[#8E8675] hover:border-gold/30 hover:text-[#C5BEB1]"
                                }`}
                              >
                                <Icon size={14} />
                                <span>{plat.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Input fields for active platforms */}
                      <div className="space-y-3 bg-[#121720] p-4 rounded-xl border border-gold/15">
                        {activeSocialTabs.length === 0 ? (
                          <p className="text-xs text-[#8E8675] italic">
                            Click any platform above to add your profile link or handle.
                          </p>
                        ) : (
                          activeSocialTabs.map((platId) => {
                            const plat = SOCIAL_PLATFORMS.find((p) => p.id === platId);
                            if (!plat) return null;
                            const Icon = plat.icon;
                            return (
                              <div key={platId} className="space-y-1">
                                <label className="text-[11px] text-gold-bright flex items-center gap-1.5 font-medium">
                                  <Icon size={13} className="text-gold" /> {plat.name} Link or Handle
                                </label>
                                <input
                                  type="text"
                                  className="w-full bg-[#0B0F15] border border-gold/20 rounded-lg px-3 py-2 text-xs text-[#F3EFE6] focus:border-gold focus:outline-none font-mono"
                                  placeholder={plat.placeholder}
                                  value={form.social_links[platId] || ""}
                                  onChange={(e) => handleSocialLinkChange(platId, e.target.value)}
                                />
                              </div>
                            );
                          })
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* SECTION 5: PORTFOLIO & NOTES (OPTIONAL) */}
              <div className="bg-[#0B0F15] border border-gold/20 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-gold/15 pb-2.5">
                  <h2 className="text-xs uppercase font-mono tracking-widest text-gold-bright font-semibold flex items-center gap-2">
                    <BookOpen size={15} className="text-gold" /> 5. Portfolio & Extra Note (Optional)
                  </h2>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-[#C5BEB1] block mb-1 font-medium">
                      Portfolio, GitHub, Reel, or Drive Link
                    </label>
                    <input
                      type="url"
                      className="w-full bg-[#121720] border border-gold/25 rounded-lg px-3.5 py-2.5 text-xs text-[#F3EFE6] focus:border-gold focus:outline-none transition-colors font-mono"
                      placeholder="https://drive.google.com/... or github.com/... or behance.net/..."
                      value={form.portfolio_url}
                      onChange={(e) => handleInputChange("portfolio_url", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-xs text-[#C5BEB1] block mb-1 font-medium">
                      Anything you'd like to tell us?
                    </label>
                    <textarea
                      rows={3}
                      className="w-full bg-[#121720] border border-gold/25 rounded-lg px-3.5 py-2.5 text-xs text-[#F3EFE6] focus:border-gold focus:outline-none transition-colors resize-none"
                      placeholder="e.g. Tell us about your camera gear, video editing software, coding stack, or why you want to collaborate with Meenamma."
                      value={form.notes}
                      onChange={(e) => handleInputChange("notes", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* SUBMIT BUTTON */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-gold via-gold-shimmer to-gold text-black font-semibold text-sm hover:brightness-110 active:scale-[0.99] transition-all shadow-xl shadow-gold/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>Submitting Your Application…</span>
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      <span>Submit Student Registration</span>
                    </>
                  )}
                </button>
                <p className="text-center text-[11px] text-[#8E8675] mt-2.5">
                  By submitting, you agree to be contacted by Meenamma for creator, dev, or editing collaboration.
                </p>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
