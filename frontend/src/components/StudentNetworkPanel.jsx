import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import {
  GraduationCap,
  Sparkles,
  Search,
  Filter,
  Download,
  Copy,
  Check,
  ExternalLink,
  Phone,
  Mail,
  Instagram,
  Linkedin,
  Youtube,
  Github,
  Twitter,
  Globe,
  Video,
  Code2,
  Film,
  Building2,
  BookOpen,
  Calendar,
  Trash2,
  CheckCircle2,
  Clock,
  Send,
  RefreshCw,
  QrCode,
  FileSpreadsheet,
  X,
  MessageCircle,
} from "lucide-react";
import { api, formatApiErrorDetail } from "../lib/api";

const STATUS_CONFIG = {
  new: { label: "New", color: "bg-blue-950/60 text-blue-400 border-blue-500/40" },
  contacted: { label: "Contacted", color: "bg-amber-950/60 text-amber-400 border-amber-500/40" },
  shortlisted: { label: "Shortlisted", color: "bg-purple-950/60 text-purple-400 border-purple-500/40" },
  enrolled: { label: "Enrolled", color: "bg-emerald-950/60 text-emerald-400 border-emerald-500/40" },
  rejected: { label: "Archived", color: "bg-zinc-800 text-zinc-400 border-zinc-600/40" },
};

const ROLE_CONFIG = {
  creator: { label: "Creator", icon: Video, color: "text-amber-400 border-amber-500/40 bg-amber-500/10" },
  developer: { label: "Developer", icon: Code2, color: "text-cyan-400 border-cyan-500/40 bg-cyan-500/10" },
  editor: { label: "Editor", icon: Film, color: "text-purple-400 border-purple-500/40 bg-purple-500/10" },
};

export default function StudentNetworkPanel() {
  const [students, setStudents] = useState([]);
  const [counts, setCounts] = useState({ all: 0, creator: 0, developer: 0, editor: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [qrPrintMode, setQrPrintMode] = useState(false);
  const [msg, setMsg] = useState("");

  const qrSvgRef = useRef();

  const publicUrl = "https://meenamma.org/students";

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/students");
      setStudents(data.students || []);
      setCounts(data.counts || { all: 0, creator: 0, developer: 0, editor: 0 });
    } catch (err) {
      setMsg(formatApiErrorDetail(err.response?.data?.detail) || "Failed to load student applications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleStatusChange = async (studentId, newStatus) => {
    setUpdatingId(studentId);
    try {
      await api.patch(`/admin/students/${studentId}`, { application_status: newStatus });
      setStudents((prev) =>
        prev.map((s) => (s.id === studentId ? { ...s, application_status: newStatus } : s))
      );
      if (selectedStudent && selectedStudent.id === studentId) {
        setSelectedStudent((prev) => ({ ...prev, application_status: newStatus }));
      }
    } catch (err) {
      alert("Failed to update status: " + (err.response?.data?.detail || err.message));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (studentId, name) => {
    if (!window.confirm(`Are you sure you want to delete application for ${name}?`)) return;
    try {
      await api.delete(`/admin/students/${studentId}`);
      setStudents((prev) => prev.filter((s) => s.id !== studentId));
      if (selectedStudent && selectedStudent.id === studentId) setSelectedStudent(null);
    } catch (err) {
      alert("Failed to delete application: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleExportCsv = () => {
    window.open(`${process.env.REACT_APP_API_URL || "/api"}/admin/students/export`, "_blank");
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const downloadQrCode = () => {
    const svg = document.getElementById("student-network-qr-svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    canvas.width = 600;
    canvas.height = 700;

    img.onload = () => {
      // Draw background
      ctx.fillStyle = qrPrintMode ? "#FFFFFF" : "#070A0E";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw header text
      ctx.fillStyle = qrPrintMode ? "#000000" : "#C5A059";
      ctx.font = "bold 28px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("MEENAMMA STUDENT NETWORK", canvas.width / 2, 60);

      ctx.fillStyle = qrPrintMode ? "#555555" : "#A8A090";
      ctx.font = "18px sans-serif";
      ctx.fillText("Scan to register: Creator • Developer • Editor", canvas.width / 2, 95);

      // Draw QR code image
      ctx.drawImage(img, 60, 130, 480, 480);

      // Draw footer URL
      ctx.fillStyle = qrPrintMode ? "#111111" : "#FFD700";
      ctx.font = "bold 20px monospace";
      ctx.fillText("meenamma.org/students", canvas.width / 2, 660);

      const a = document.createElement("a");
      a.download = "meenamma-student-registration-qr.png";
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  // Filter logic
  const filteredStudents = students.filter((s) => {
    if (roleFilter !== "all" && s.role_preference !== roleFilter) return false;
    if (statusFilter !== "all" && s.application_status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const match =
        s.name.toLowerCase().includes(q) ||
        s.college.toLowerCase().includes(q) ||
        s.department.toLowerCase().includes(q) ||
        s.phone.includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.application_id.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const uniqueColleges = new Set(students.map((s) => s.college).filter(Boolean)).size;

  return (
    <div className="space-y-8" data-testid="admin-students-panel">
      {msg && (
        <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-xl text-red-200 text-xs">
          {msg}
        </div>
      )}

      {/* TOP ROW: QR CODE PROMOTION WIDGET + STATS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* QR Code & Share Card (5 cols) */}
        <div className="lg:col-span-5 glass-card-dark border-filigree-gold p-6 rounded-2xl shadow-2xl relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="badge-gold text-[10px] font-mono uppercase tracking-wider flex items-center gap-1.5">
                <QrCode size={13} /> Student Registration Link
              </span>
              <button
                type="button"
                onClick={() => setQrPrintMode(!qrPrintMode)}
                className="text-[10px] text-[#A8A090] hover:text-gold transition-colors font-mono underline cursor-pointer"
              >
                {qrPrintMode ? "Dark Theme QR" : "High-Contrast Print QR"}
              </button>
            </div>
            <h3 className="font-serif text-lg text-gold-gradient font-medium">
              meenamma.org/students
            </h3>
            <p className="text-xs text-[#A8A090]">
              Students scan this QR code or click the link to register as Creators, Developers, or Video Editors.
            </p>
          </div>

          {/* QR Code Graphic */}
          <div className="my-5 flex flex-col sm:flex-row items-center justify-center gap-5">
            <div
              className={`p-3 rounded-xl border shadow-inner ${
                qrPrintMode ? "bg-white border-zinc-300" : "bg-[#070A0E] border-gold/30"
              }`}
            >
              <QRCodeSVG
                id="student-network-qr-svg"
                ref={qrSvgRef}
                value={publicUrl}
                size={140}
                bgColor={qrPrintMode ? "#FFFFFF" : "#070A0E"}
                fgColor={qrPrintMode ? "#000000" : "#FFD700"}
                level="H"
                includeMargin={false}
              />
            </div>
            <div className="space-y-2 text-center sm:text-left">
              <p className="text-[11px] text-[#C5BEB1] font-mono leading-tight">
                Scan with any smartphone camera or WhatsApp scanner
              </p>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                <button
                  onClick={downloadQrCode}
                  className="px-3 py-1.5 rounded-lg border border-gold/40 bg-gold/15 text-gold-bright text-xs hover:bg-gold/25 transition-all flex items-center gap-1.5 font-mono shadow-sm"
                >
                  <Download size={13} />
                  <span>Download QR PNG</span>
                </button>
                <button
                  onClick={copyUrl}
                  className="px-3 py-1.5 rounded-lg border border-gold/20 bg-black/40 text-[#E0D9CC] text-xs hover:border-gold/40 transition-all flex items-center gap-1.5 font-mono"
                >
                  {copiedLink ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  <span>{copiedLink ? "Copied" : "Copy Link"}</span>
                </button>
              </div>
              <a
                href="/students"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-gold-dim hover:text-gold transition-colors font-mono"
              >
                <span>Preview Student Form</span> <ExternalLink size={11} />
              </a>
            </div>
          </div>

          <div className="pt-3 border-t border-gold/10 text-[11px] text-[#8E8675] flex items-center justify-between font-mono">
            <span>Kasimedu Student Network 2026</span>
            <span>Target: 50+ Campus Partners</span>
          </div>
        </div>

        {/* Stats Grid (7 cols) */}
        <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="glass-card-dark border-filigree-gold p-4 rounded-xl flex flex-col justify-between">
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#A8A090]">
              Total Applicants
            </span>
            <p className="text-3xl font-light text-gold-gradient font-serif my-1">
              {counts.all}
            </p>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
              <CheckCircle2 size={11} /> Across TN
            </span>
          </div>

          <div className="glass-card-dark border-filigree-gold p-4 rounded-xl flex flex-col justify-between">
            <span className="text-[10px] uppercase font-mono tracking-wider text-amber-400 flex items-center gap-1">
              <Video size={12} /> Creators
            </span>
            <p className="text-3xl font-light text-amber-300 font-serif my-1">
              {counts.creator}
            </p>
            <span className="text-[10px] text-[#A8A090] font-mono">
              {counts.all > 0 ? Math.round((counts.creator / counts.all) * 100) : 0}% of pool
            </span>
          </div>

          <div className="glass-card-dark border-filigree-gold p-4 rounded-xl flex flex-col justify-between">
            <span className="text-[10px] uppercase font-mono tracking-wider text-cyan-400 flex items-center gap-1">
              <Code2 size={12} /> Developers
            </span>
            <p className="text-3xl font-light text-cyan-300 font-serif my-1">
              {counts.developer}
            </p>
            <span className="text-[10px] text-[#A8A090] font-mono">
              {counts.all > 0 ? Math.round((counts.developer / counts.all) * 100) : 0}% of pool
            </span>
          </div>

          <div className="glass-card-dark border-filigree-gold p-4 rounded-xl flex flex-col justify-between">
            <span className="text-[10px] uppercase font-mono tracking-wider text-purple-400 flex items-center gap-1">
              <Film size={12} /> Editors
            </span>
            <p className="text-3xl font-light text-purple-300 font-serif my-1">
              {counts.editor}
            </p>
            <span className="text-[10px] text-[#A8A090] font-mono">
              {counts.all > 0 ? Math.round((counts.editor / counts.all) * 100) : 0}% of pool
            </span>
          </div>

          <div className="glass-card-dark border-filigree-gold p-4 rounded-xl flex flex-col justify-between">
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#A8A090]">
              Colleges
            </span>
            <p className="text-3xl font-light text-[#F5F2EB] font-serif my-1">
              {uniqueColleges}
            </p>
            <span className="text-[10px] text-[#A8A090] font-mono">Unique Campuses</span>
          </div>

          <div className="glass-card-dark border-filigree-gold p-4 rounded-xl flex flex-col justify-between">
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#A8A090]">
              Active Review
            </span>
            <p className="text-3xl font-light text-gold font-serif my-1">
              {students.filter((s) => s.application_status === "new").length}
            </p>
            <span className="text-[10px] text-amber-400 font-mono">Pending Outreach</span>
          </div>
        </div>
      </div>

      {/* FILTER & ACTION TOOLBAR */}
      <div className="glass-card-dark border-filigree-gold p-4 rounded-2xl space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-grow max-w-md">
            <Search size={15} className="absolute left-3 top-2.5 text-[#8E8675]" />
            <input
              type="text"
              placeholder="Search by student name, college, department, phone, or ID…"
              className="w-full bg-[#070A0E] border border-gold/25 rounded-xl pl-9 pr-3.5 py-2 text-xs text-[#F5F2EB] placeholder:text-[#8E8675] focus:border-gold focus:outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-2.5 text-[#8E8675] hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="px-3.5 py-2 rounded-xl border border-gold/30 bg-gold/10 text-gold-bright text-xs hover:bg-gold/20 transition-all flex items-center gap-1.5 font-mono shadow-sm"
              title="Download formatted CSV spreadsheet for Excel / Sheets"
            >
              <FileSpreadsheet size={14} />
              <span>Export CSV</span>
            </button>
            <button
              onClick={fetchStudents}
              disabled={loading}
              className="px-3 py-2 rounded-xl border border-gold/20 bg-black/40 text-[#A8A090] hover:text-gold hover:border-gold/40 transition-all flex items-center gap-1.5 text-xs font-mono"
              title="Refresh student submissions"
            >
              <RefreshCw size={13} className={loading ? "animate-spin text-gold" : ""} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Role and Status Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gold/10">
          {/* Role Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-[10px] uppercase font-mono text-[#8E8675] mr-1">Role:</span>
            {[
              { id: "all", label: "All Roles" },
              { id: "creator", label: "Creators (🎨)" },
              { id: "developer", label: "Developers (💻)" },
              { id: "editor", label: "Editors (🎬)" },
            ].map((r) => (
              <button
                key={r.id}
                onClick={() => setRoleFilter(r.id)}
                className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                  roleFilter === r.id
                    ? "bg-gold text-black font-semibold shadow-sm"
                    : "bg-[#070A0E] text-[#A8A090] border border-gold/15 hover:border-gold/40 hover:text-white"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Status Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-[10px] uppercase font-mono text-[#8E8675] mr-1">Status:</span>
            {["all", "new", "contacted", "shortlisted", "enrolled", "rejected"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono capitalize transition-all ${
                  statusFilter === st
                    ? "bg-gold/20 border border-gold text-gold-bright font-semibold"
                    : "bg-[#070A0E] text-[#8E8675] border border-gold/10 hover:border-gold/30 hover:text-[#C5BEB1]"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* STUDENT REGISTRATIONS LIST */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-[#A8A090] font-mono">
            Showing {filteredStudents.length} of {students.length} registrations
          </span>
          {search && (
            <span className="text-xs text-gold font-mono">
              Filtered by: "{search}"
            </span>
          )}
        </div>

        {loading ? (
          <div className="glass-card-dark border-filigree-gold p-12 text-center rounded-2xl">
            <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="font-serif italic text-gold text-sm">Fetching student registrations…</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="glass-card-dark border-filigree-gold p-12 text-center rounded-2xl space-y-3">
            <GraduationCap size={36} className="text-gold/40 mx-auto" />
            <p className="text-sm text-[#A8A090]">
              {students.length === 0
                ? "No student applications yet. Share the QR code or link to begin collecting data!"
                : "No applications match your selected filters."}
            </p>
            {students.length === 0 && (
              <button
                onClick={copyUrl}
                className="px-4 py-2 rounded-xl bg-gold text-black font-semibold text-xs hover:bg-gold-shimmer transition-all inline-flex items-center gap-1.5 shadow-lg shadow-gold/20"
              >
                <Copy size={13} />
                <span>Copy Shareable Form Link</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3.5">
            {filteredStudents.map((student) => {
              const roleMeta = ROLE_CONFIG[student.role_preference] || ROLE_CONFIG.creator;
              const statusMeta = STATUS_CONFIG[student.application_status] || STATUS_CONFIG.new;
              const RoleIcon = roleMeta.icon;

              // Generate pre-filled WhatsApp message
              const cleanPhone = student.phone.replace(/[^0-9]/g, "");
              const waNumber = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
              const waText = encodeURIComponent(
                `Vanakkam ${student.name}! Greetings from Meenamma.org. We received your registration as a ${roleMeta.label} from ${student.college}. We would love to discuss collaborating with you!`
              );
              const waUrl = `https://wa.me/${waNumber}?text=${waText}`;

              return (
                <div
                  key={student.id}
                  className="glass-card-dark border-filigree-gold p-4 sm:p-5 rounded-2xl hover:border-gold/50 transition-all duration-200 relative group shadow-lg"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Identity & College */}
                    <div className="space-y-2 flex-grow">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-gold-bright">
                          {student.application_id}
                        </span>
                        <span
                          className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border flex items-center gap-1 ${roleMeta.color}`}
                        >
                          <RoleIcon size={11} />
                          <span>{roleMeta.label}</span>
                        </span>
                        <span
                          className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border ${statusMeta.color}`}
                        >
                          {statusMeta.label}
                        </span>
                        <span className="text-[10px] text-[#8E8675] font-mono ml-auto lg:ml-0">
                          {student.created_at ? new Date(student.created_at).toLocaleDateString() : ""}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-serif text-lg text-[#F5F2EB] font-medium flex items-center gap-2">
                          <span>{student.name}</span>
                          {student.year_of_study && (
                            <span className="text-[11px] text-[#A8A090] font-sans font-normal">
                              ({student.year_of_study})
                            </span>
                          )}
                        </h4>
                        <p className="text-xs text-[#C5BEB1] flex items-center gap-2 mt-0.5">
                          <Building2 size={13} className="text-gold-dim flex-shrink-0" />
                          <span className="font-medium">{student.college}</span>
                          <span className="text-[#8E8675]">•</span>
                          <span>{student.department}</span>
                        </p>
                      </div>

                      {/* Contact Badges */}
                      <div className="flex flex-wrap items-center gap-3 text-xs pt-1">
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-mono transition-colors"
                          title="Click to chat on WhatsApp"
                        >
                          <MessageCircle size={13} className="text-emerald-400" />
                          <span>+91 {cleanPhone.slice(-10)}</span>
                        </a>

                        {student.email && (
                          <a
                            href={`mailto:${student.email}`}
                            className="flex items-center gap-1.5 text-[#A8A090] hover:text-white transition-colors"
                          >
                            <Mail size={13} className="text-gold-dim" />
                            <span>{student.email}</span>
                          </a>
                        )}
                      </div>

                      {/* Social Media Links */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="text-[10px] uppercase font-mono text-[#8E8675]">
                          Social:
                        </span>
                        {student.has_social_media ? (
                          Object.entries(student.social_links || {}).map(([platform, link]) => {
                            if (!link) return null;
                            const IconMap = {
                              instagram: Instagram,
                              linkedin: Linkedin,
                              youtube: Youtube,
                              github: Github,
                              twitter: Twitter,
                              portfolio: Globe,
                            };
                            const PlatIcon = IconMap[platform] || Globe;
                            const fullUrl = link.startsWith("http")
                              ? link
                              : platform === "instagram"
                              ? `https://instagram.com/${link.replace("@", "")}`
                              : platform === "github"
                              ? `https://github.com/${link}`
                              : `https://${link}`;
                            return (
                              <a
                                key={platform}
                                href={fullUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#121720] border border-gold/15 text-[11px] text-gold-bright hover:border-gold/50 transition-colors"
                              >
                                <PlatIcon size={12} />
                                <span className="capitalize">{platform}</span>
                                <ExternalLink size={9} className="opacity-60" />
                              </a>
                            );
                          })
                        ) : (
                          <span className="text-[11px] text-[#8E8675] italic">
                            No social media profile
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Quick Status Toggles & Detail Button */}
                    <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between gap-2.5 pt-3 lg:pt-0 border-t lg:border-t-0 border-gold/10">
                      {/* Status Selector */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] uppercase font-mono text-[#8E8675]">Status:</span>
                        <select
                          className="bg-[#070A0E] border border-gold/25 text-xs text-[#F5F2EB] rounded-lg px-2.5 py-1 focus:border-gold focus:outline-none font-mono"
                          value={student.application_status}
                          disabled={updatingId === student.id}
                          onChange={(e) => handleStatusChange(student.id, e.target.value)}
                        >
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="shortlisted">Shortlisted</option>
                          <option value="enrolled">Enrolled</option>
                          <option value="rejected">Archived</option>
                        </select>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25 transition-all text-xs font-mono flex items-center gap-1 shadow-sm"
                          title="Message on WhatsApp"
                        >
                          <MessageCircle size={13} />
                          <span>WhatsApp</span>
                        </a>

                        <button
                          onClick={() => setSelectedStudent(student)}
                          className="px-3 py-1.5 rounded-lg border border-gold/25 bg-[#121720] text-[#E0D9CC] hover:border-gold/50 transition-colors text-xs font-mono"
                        >
                          View Info
                        </button>

                        <button
                          onClick={() => handleDelete(student.id, student.name)}
                          className="p-1.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/15 hover:border-red-500/40 transition-all"
                          title="Delete application"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* DETAIL MODAL DRAWER */}
      <AnimatePresence>
        {selectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0B0F15] border border-gold/30 rounded-2xl p-6 sm:p-7 max-w-xl w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-gold/15 pb-3">
                <div className="flex items-center gap-2">
                  <GraduationCap size={20} className="text-gold" />
                  <h3 className="font-serif text-xl text-gold-gradient font-medium">
                    {selectedStudent.name}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="p-1 rounded-lg border border-gold/20 text-[#A8A090] hover:text-white hover:border-gold"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-mono text-[#8E8675] block">
                    Application ID
                  </span>
                  <span className="font-mono text-gold-bright font-bold">
                    {selectedStudent.application_id}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-[#8E8675] block">
                    Role Preference
                  </span>
                  <span className="capitalize font-semibold text-white">
                    {selectedStudent.role_preference}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-[#8E8675] block">
                    College
                  </span>
                  <span className="text-[#F5F2EB]">{selectedStudent.college}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-[#8E8675] block">
                    Department & Year
                  </span>
                  <span className="text-[#F5F2EB]">
                    {selectedStudent.department} ({selectedStudent.year_of_study || "N/A"})
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-[#8E8675] block">
                    Phone / WhatsApp
                  </span>
                  <span className="font-mono text-emerald-400">{selectedStudent.phone}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-[#8E8675] block">
                    Email
                  </span>
                  <span className="text-[#F5F2EB]">{selectedStudent.email || "Not provided"}</span>
                </div>
              </div>

              {/* Social Media Details */}
              <div className="space-y-2 pt-2 border-t border-gold/10">
                <span className="text-xs uppercase font-mono text-gold-bright font-semibold block">
                  Social Media Links
                </span>
                {selectedStudent.has_social_media && selectedStudent.social_links ? (
                  <div className="space-y-1.5">
                    {Object.entries(selectedStudent.social_links).map(([plat, url]) => {
                      if (!url) return null;
                      return (
                        <div
                          key={plat}
                          className="flex items-center justify-between p-2 rounded-lg bg-[#121720] border border-gold/15 text-xs"
                        >
                          <span className="capitalize font-mono text-gold font-medium">{plat}:</span>
                          <a
                            href={url.startsWith("http") ? url : `https://${url}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-cyan-400 hover:underline flex items-center gap-1 font-mono text-[11px] truncate max-w-[280px]"
                          >
                            <span>{url}</span>
                            <ExternalLink size={10} />
                          </a>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-[#8E8675] italic">No social media links provided.</p>
                )}
              </div>

              {/* Portfolio Link */}
              {selectedStudent.portfolio_url && (
                <div className="space-y-1 pt-2 border-t border-gold/10">
                  <span className="text-xs uppercase font-mono text-gold-bright font-semibold block">
                    Portfolio / Samples URL
                  </span>
                  <a
                    href={selectedStudent.portfolio_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-cyan-400 hover:underline flex items-center gap-1 font-mono break-all"
                  >
                    <span>{selectedStudent.portfolio_url}</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              )}

              {/* Notes */}
              {selectedStudent.notes && (
                <div className="space-y-1 pt-2 border-t border-gold/10">
                  <span className="text-xs uppercase font-mono text-gold-bright font-semibold block">
                    Student Notes / Pitch
                  </span>
                  <p className="text-xs text-[#C5BEB1] bg-[#121720] p-3 rounded-lg border border-gold/10 leading-relaxed whitespace-pre-wrap">
                    {selectedStudent.notes}
                  </p>
                </div>
              )}

              {/* Status Update & Close */}
              <div className="flex items-center justify-between pt-3 border-t border-gold/15">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#A8A090] font-mono">Status:</span>
                  <select
                    className="bg-[#070A0E] border border-gold/25 text-xs text-[#F5F2EB] rounded-lg px-2.5 py-1 font-mono"
                    value={selectedStudent.application_status}
                    onChange={(e) => handleStatusChange(selectedStudent.id, e.target.value)}
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="shortlisted">Shortlisted</option>
                    <option value="enrolled">Enrolled</option>
                    <option value="rejected">Archived</option>
                  </select>
                </div>

                <button
                  onClick={() => setSelectedStudent(null)}
                  className="px-4 py-2 rounded-xl bg-gold text-black font-semibold text-xs hover:bg-gold-shimmer transition-colors"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
