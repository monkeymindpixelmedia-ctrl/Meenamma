import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy,
  Check,
  Share2,
  Users,
  Gift,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock3,
  Award,
  Coins,
  GraduationCap,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api, haptic } from "../lib/api";

const STEPS_NORMAL = [
  {
    num: "01",
    title: "Share your link",
    desc: "Send your personal link to family & friends who appreciate pristine fresh catch.",
    icon: Share2,
  },
  {
    num: "02",
    title: "They shop fresh catch",
    desc: "Whenever an invited friend places a market order, your account is credited.",
    icon: Users,
  },
  {
    num: "03",
    title: "Earn 1 Royalty Point",
    desc: "Collect 1 Royalty Point per order to redeem for discounts on your own fresh catch.",
    icon: Coins,
  },
];

const STEPS_STUDENT = [
  {
    num: "01",
    title: "Share with your Serial ID",
    desc: "Your unique Student Serial ID links every referred student and household directly to you.",
    icon: GraduationCap,
  },
  {
    num: "02",
    title: "Complete 60-Day Kudam",
    desc: "Save towards the ₹5,050 target over 60 days to keep full partner commission privileges.",
    icon: TrendingUp,
  },
  {
    num: "03",
    title: "Receive Direct Commissions",
    desc: "Earn cash commissions on every order and savings subscription in your network.",
    icon: Gift,
  },
];

export default function Referral() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [shareMessage, setShareMessage] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isStudentUser = user?.account_type === "student" || Boolean(user?.student_serial_id);
  const [activeTab, setActiveTab] = useState(isStudentUser ? "student" : "normal");

  useEffect(() => {
    if (isStudentUser) {
      setActiveTab("student");
    }
  }, [isStudentUser]);

  useEffect(() => {
    let mounted = true;
    api.get("/referrals")
      .then(({ data: resp }) => {
        if (!mounted) return;
        setData(resp);
      })
      .catch(() => mounted && setError("Could not load referral details."))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  const referralCode = user?.referral_code || "";
  const studentSerialId = user?.student_serial_id || data?.student_serial_id || "MNM-STU-0001";
  const royaltyPoints = user?.royalty_points ?? data?.royalty_points ?? 0;
  const referrals = data?.referrals || [];
  const windowDays = data?.window_days || 90;
  const milestone = data?.student_milestone || user?.student_milestone || {
    cycle_days: 60,
    days_elapsed: 0,
    days_remaining: 60,
    saved_amount: 0,
    target_amount: 5050,
    is_milestone_completed: false,
    progress_percent: 0,
    commission_eligible: true,
  };
  const commissions = data?.commissions || [];
  const commSummary = data?.commission_summary || {
    total_earned_amount: 0,
    pending_amount: 0,
    paid_amount: 0,
  };
  const pointsHistory = data?.points_history || [];

  const referralLink = referralCode
    ? `${window.location.origin}/register?ref=${referralCode}${activeTab === "student" ? "&type=student" : ""}`
    : "";

  const joinedDate = (value) => {
    if (!value) return "";
    return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  const copyText = async (text) => {
    if (!text) return;
    haptic();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const shareViaWhatsApp = () => {
    haptic();
    const text = activeTab === "student"
      ? `Join Meenamma via my Student Partner link! Save daily with Kudam micro-savings and get dawn-fresh catch delivered before sunrise.\n\nStudent Serial: ${studentSerialId}\nLink: ${referralLink}`
      : `Join me on Meenamma — fresh catch delivered before dawn, with a daily Kudam savings ritual that makes every meal meaningful.\n\nUse my invitation link:\n${referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    setShareMessage("Opening WhatsApp...");
    setTimeout(() => setShareMessage(""), 2000);
  };

  const shareNative = async () => {
    haptic();
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join Meenamma",
          text: activeTab === "student"
            ? `Join through my Student Partner link (Serial: ${studentSerialId})`
            : "Fresh catch delivered before dawn, with a daily savings ritual.",
          url: referralLink,
        });
      } catch {
        // User cancelled
      }
    } else {
      copyText(referralLink);
    }
  };

  return (
    <div className="min-h-screen bg-alabaster-paper paper-texture pb-28 md:pb-16" data-testid="referral-page">
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 lg:px-16 pt-8 lg:pt-14">
        
        {/* Portal Header & Mode Switcher */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center max-w-2xl mx-auto mb-8"
        >
          <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/25 px-4 py-1.5 rounded-full mb-4">
            <Sparkles size={14} className="text-gold" />
            <span className="text-gold-dim text-[11px] font-mono uppercase tracking-[0.25em]">
              {activeTab === "student" ? "Student Partner Program" : "Member Royalty Points"}
            </span>
          </div>

          <h1 className="font-serif text-obsidian text-3xl md:text-5xl font-medium leading-tight">
            {activeTab === "student" ? (
              <>Student Partner <span className="text-gold">& Commission Hub</span></>
            ) : (
              <>Share the Catch, <span className="text-gold">Earn Royalty Points</span></>
            )}
          </h1>

          <p className="text-obsidian/70 text-sm md:text-base leading-relaxed mt-3 font-serif italic max-w-lg">
            {activeTab === "student"
              ? "Track your serial ID, 60-day Kudam milestone progress, and referral commissions."
              : "Invite friends and earn 1 Royalty Point on every shopping order they place on the Market."}
          </p>

          {/* Mode Switcher Tabs */}
          <div className="flex p-1 bg-alabaster/80 border border-gold/25 rounded-xl mt-6 shadow-sm">
            <button
              onClick={() => {
                haptic();
                setActiveTab("normal");
              }}
              className={`py-2 px-5 text-xs font-mono tracking-wider rounded-lg transition-all ${
                activeTab === "normal"
                  ? "bg-obsidian text-gold font-bold shadow-md"
                  : "text-obsidian/60 hover:text-obsidian"
              }`}
              data-testid="tab-normal-points"
            >
              🌟 Royalty Points
            </button>
            <button
              onClick={() => {
                haptic();
                setActiveTab("student");
              }}
              className={`py-2 px-5 text-xs font-mono tracking-wider rounded-lg transition-all ${
                activeTab === "student"
                  ? "bg-obsidian text-gold font-bold shadow-md"
                  : "text-obsidian/60 hover:text-obsidian"
              }`}
              data-testid="tab-student-partner"
            >
              🎓 Student Partner
            </button>
          </div>
        </motion.div>

        {/* ===================== STUDENT PARTNER VIEW ===================== */}
        {activeTab === "student" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="max-w-4xl mx-auto space-y-8"
          >
            {/* Student Serial ID & Referral Link Card */}
            <div className="card-white p-6 md:p-8 relative overflow-hidden border-2 border-gold/30 shadow-md">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-gold to-amber-500" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                {/* Serial Number Display */}
                <div className="p-5 bg-gradient-to-br from-obsidian to-zinc-900 text-amber-50 rounded-xl border border-gold/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-gold">Official Student Serial</span>
                    <span className="px-2 py-0.5 text-[9px] font-mono bg-gold/20 text-gold rounded border border-gold/40">Verified</span>
                  </div>
                  <p className="font-mono text-2xl md:text-3xl font-bold tracking-widest text-gold" data-testid="student-serial-id">
                    {studentSerialId}
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-2 font-serif italic">
                    Referral Code: <span className="font-mono font-bold text-amber-200">{referralCode}</span>
                  </p>
                </div>

                {/* Quick Link & Share */}
                <div className="space-y-3">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-obsidian/60">Your Student Affiliate Link</p>
                  <div className="flex items-center gap-2 bg-alabaster/60 border border-gold/25 px-3.5 py-2.5 rounded-lg">
                    <span className="text-xs font-mono text-obsidian/80 truncate flex-1">{referralLink}</span>
                    <button
                      onClick={() => copyText(referralLink)}
                      className="p-1.5 hover:bg-gold/15 rounded text-obsidian/70 transition-colors"
                      title="Copy Link"
                      data-testid="copy-student-link"
                    >
                      {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={shareViaWhatsApp}
                      className="flex-1 btn-gold-outline !py-2.5 text-xs flex items-center justify-center gap-2 rounded-lg"
                      data-testid="student-share-whatsapp"
                    >
                      <Share2 size={13} /> WhatsApp
                    </button>
                    <button
                      onClick={shareNative}
                      className="btn-obsidian !py-2.5 text-xs px-4 rounded-lg"
                      data-testid="student-share-native"
                    >
                      Share
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 60-Day / ₹5,050 Savings Milestone Tracker */}
            <div className="card-white p-6 md:p-8 border border-gold/25 shadow-sm" data-testid="student-milestone-card">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gold/15">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Clock3 size={16} className="text-gold" />
                    <span className="text-[11px] font-mono uppercase tracking-wider text-gold-dim font-semibold">
                      Student Savings Mandate
                    </span>
                  </div>
                  <h3 className="font-serif text-obsidian text-2xl font-medium">60-Day / ₹5,050 Milestone</h3>
                  <p className="text-obsidian/65 text-xs font-serif italic mt-1">
                    Complete minimum ₹5,050 in Kudam savings within 60 days to secure full partner commission payouts.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-[10px] font-mono uppercase text-obsidian/50">Cycle Window</p>
                    <p className="text-sm font-mono font-bold text-obsidian">
                      Day {milestone.days_elapsed} of {milestone.cycle_days}
                    </p>
                  </div>
                  <div className={`px-3 py-1.5 rounded-full text-xs font-mono font-semibold border ${
                    milestone.is_milestone_completed
                      ? "bg-green-100 text-green-800 border-green-300"
                      : milestone.cycle_active
                      ? "bg-amber-100 text-amber-800 border-amber-300"
                      : "bg-gray-100 text-gray-800 border-gray-300"
                  }`}>
                    {milestone.is_milestone_completed ? "✅ Target Achieved" : `${milestone.days_remaining} Days Left`}
                  </div>
                </div>
              </div>

              {/* Progress Bar & Numerical Metrics */}
              <div className="mt-6 space-y-3">
                <div className="flex justify-between text-xs font-mono text-obsidian/80">
                  <span>Saved: <strong>₹{milestone.saved_amount.toLocaleString("en-IN")}</strong></span>
                  <span>Target: <strong>₹{milestone.target_amount.toLocaleString("en-IN")}</strong></span>
                </div>
                <div className="w-full h-3.5 bg-gold/15 rounded-full overflow-hidden p-0.5 border border-gold/25">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(4, Math.min(100, milestone.progress_percent))}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[11px] text-obsidian/55 font-mono pt-1">
                  <span>{milestone.progress_percent}% of ₹5,050 completed</span>
                  <button
                    onClick={() => navigate("/dashboard")}
                    className="text-gold-dim hover:text-obsidian underline underline-offset-2 flex items-center gap-1 font-sans text-xs"
                  >
                    Deposit into Kudam <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            </div>

            {/* Commissions Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-testid="student-commission-stats">
              <div className="card-white p-5 border border-gold/20 text-center">
                <p className="text-[10px] font-mono uppercase tracking-wider text-obsidian/50">Total Commissions</p>
                <p className="font-serif text-3xl font-medium text-obsidian mt-1">
                  ₹{commSummary.total_earned_amount.toLocaleString("en-IN")}
                </p>
                <p className="text-[10px] font-mono text-green-700 mt-1">5% On Network Orders</p>
              </div>
              <div className="card-white p-5 border border-gold/20 text-center">
                <p className="text-[10px] font-mono uppercase tracking-wider text-obsidian/50">Pending Approval</p>
                <p className="font-serif text-3xl font-medium text-amber-700 mt-1">
                  ₹{commSummary.pending_amount.toLocaleString("en-IN")}
                </p>
                <p className="text-[10px] font-mono text-obsidian/40 mt-1">Awaiting settlement</p>
              </div>
              <div className="card-white p-5 border border-gold/20 text-center">
                <p className="text-[10px] font-mono uppercase tracking-wider text-obsidian/50">Paid to Bank / UPI</p>
                <p className="font-serif text-3xl font-medium text-green-700 mt-1">
                  ₹{commSummary.paid_amount.toLocaleString("en-IN")}
                </p>
                <p className="text-[10px] font-mono text-obsidian/40 mt-1">Direct Bank Payouts</p>
              </div>
            </div>

            {/* Student Commissions Ledger */}
            <div className="card-white p-6 border border-gold/20" data-testid="student-commissions-ledger">
              <h4 className="font-serif text-obsidian text-xl font-medium mb-4">Commission Activity</h4>
              {commissions.length === 0 ? (
                <div className="text-center py-8 text-obsidian/50 text-sm font-serif italic">
                  No commissions recorded yet. Share your student link to start earning on friend orders!
                </div>
              ) : (
                <div className="divide-y divide-gold/10">
                  {commissions.map((comm) => (
                    <div key={comm.id} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-medium text-obsidian">
                          Order Commission: {comm.referred_profiles?.display_name || "Referred Member"}
                        </p>
                        <p className="text-obsidian/40 text-[10px] font-mono mt-0.5">{joinedDate(comm.created_at)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-bold text-green-700">+₹{round(comm.amount_paise / 100)}</p>
                        <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 bg-gold/10 text-gold-dim rounded">
                          {comm.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ===================== NORMAL USER ROYALTY POINTS VIEW ===================== */}
        {activeTab === "normal" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="max-w-4xl mx-auto space-y-8"
          >
            {/* Royalty Points Wallet Banner */}
            <div className="p-8 rounded-2xl bg-gradient-to-br from-obsidian via-zinc-900 to-black text-amber-50 border-2 border-gold/30 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gold/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gold/20 text-gold border border-gold/40 rounded-full text-xs font-mono mb-3">
                    <Award size={13} /> Royalty Points Wallet
                  </div>
                  <h2 className="font-serif text-3xl md:text-4xl text-amber-100 font-medium">
                    Your Shopping Points
                  </h2>
                  <p className="text-amber-200/70 text-sm font-serif italic mt-1 max-w-md">
                    Earn <strong>1 Royalty Point</strong> whenever a friend you invite buys fresh catch. Redeem points for market checkout discounts!
                  </p>
                </div>

                <div className="text-center md:text-right bg-white/5 p-6 rounded-2xl border border-gold/25 min-w-[200px]">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-gold">Available Balance</p>
                  <p className="font-mono text-4xl md:text-5xl font-bold text-amber-300 mt-1" data-testid="royalty-points-balance">
                    {royaltyPoints}
                  </p>
                  <p className="text-[11px] text-amber-200/60 font-mono mt-1">Points</p>
                  <button
                    onClick={() => navigate("/market")}
                    className="mt-3 w-full py-2 px-3 bg-amber-400 text-black font-bold font-mono text-xs rounded-lg hover:bg-amber-300 transition-colors shadow"
                    data-testid="redeem-points-btn"
                  >
                    Redeem at Market
                  </button>
                </div>
              </div>
            </div>

            {/* Referral Link & Share Card */}
            <div className="card-white p-6 md:p-8 border border-gold/25 shadow-sm">
              <div className="text-center max-w-lg mx-auto">
                <p className="text-gold-dim text-[10px] font-mono uppercase tracking-[0.3em] mb-2">Invite Friends</p>
                <h3 className="font-serif text-obsidian text-2xl font-medium">Your Invitation Link</h3>
                
                <div className="flex items-center gap-2 bg-alabaster/70 border border-gold/25 p-3 rounded-xl my-4">
                  <p className="flex-1 text-xs font-mono text-obsidian/80 truncate">{referralLink}</p>
                  <button
                    onClick={() => copyText(referralLink)}
                    className="p-2 hover:bg-gold/15 rounded-lg text-obsidian/70 transition-colors"
                    data-testid="copy-normal-link"
                  >
                    {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                  </button>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={shareViaWhatsApp}
                    className="flex-1 btn-gold-outline !py-3 text-xs flex items-center justify-center gap-2 rounded-xl"
                    data-testid="normal-share-whatsapp"
                  >
                    Share on WhatsApp
                  </button>
                  <button
                    onClick={shareNative}
                    className="btn-obsidian !py-3 text-xs px-6 rounded-xl"
                    data-testid="normal-share-native"
                  >
                    Share
                  </button>
                </div>
              </div>
            </div>

            {/* Points History */}
            <div className="card-white p-6 border border-gold/20" data-testid="royalty-points-history">
              <h4 className="font-serif text-obsidian text-xl font-medium mb-4">Points Activity</h4>
              {pointsHistory.length === 0 ? (
                <div className="text-center py-6 text-obsidian/50 text-sm font-serif italic">
                  No points activity yet. Invite a friend and earn 1 point when they place an order!
                </div>
              ) : (
                <div className="divide-y divide-gold/10">
                  {pointsHistory.map((item) => (
                    <div key={item.id} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-medium text-obsidian">{item.note || "Referral Purchase Reward"}</p>
                        <p className="text-obsidian/40 text-[10px] font-mono mt-0.5">{joinedDate(item.created_at)}</p>
                      </div>
                      <span className="font-mono font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                        +{item.points_change} Pt
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Referred Households Community List */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-4xl mx-auto mt-12"
          data-testid="referred-households"
        >
          <div className="flex items-end justify-between mb-4">
            <div>
              <p className="text-gold-dim text-[10px] font-mono uppercase tracking-[0.3em] mb-1">Community Network</p>
              <h3 className="font-serif text-obsidian text-2xl font-medium">Referred Members ({referrals.length})</h3>
            </div>
            <p className="text-obsidian/50 text-[10px] font-mono uppercase tracking-wider">{windowDays}-day active window</p>
          </div>

          {loading ? (
            <div className="card-white p-6 text-center text-obsidian/60 text-sm font-serif italic">Loading community...</div>
          ) : referrals.length === 0 ? (
            <div className="card-white p-8 text-center text-obsidian/60 text-sm font-serif italic">
              No one has joined through your link yet. Share your invitation above!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {referrals.map((referral) => {
                const progress = Math.min(100, (referral.days_elapsed / referral.window_days) * 100);
                return (
                  <div key={referral.id} className="card-white p-5 border border-gold/20" data-testid={`referred-member-${referral.id}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-serif text-obsidian text-lg font-medium">{referral.name}</p>
                        <p className="text-obsidian/50 text-[10px] font-mono mt-0.5">Joined {joinedDate(referral.joined_at)}</p>
                      </div>
                      <span className={`px-2 py-0.5 text-[9px] font-mono rounded ${
                        referral.is_subscriber
                          ? "bg-green-100 text-green-800 border border-green-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}>
                        {referral.is_subscriber ? "Active Saver" : "Joined"}
                      </span>
                    </div>
                    <div className="mt-4 pt-3 border-t border-gold/10">
                      <div className="flex justify-between text-[10px] font-mono text-obsidian/60 mb-1">
                        <span>{referral.window_active ? `${referral.days_remaining}d remaining` : "Window ended"}</span>
                        <span>{referral.days_elapsed}/{referral.window_days}d</span>
                      </div>
                      <div className="h-1 bg-gold/15 rounded-full overflow-hidden">
                        <div className="h-full bg-gold rounded-full" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.section>

        {/* How It Works Steps */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="max-w-3xl mx-auto mt-16"
        >
          <div className="text-center mb-8">
            <p className="text-gold-dim text-[10px] font-mono uppercase tracking-[0.3em] mb-2">Process</p>
            <h3 className="font-serif text-obsidian text-2xl font-medium">
              {activeTab === "student" ? "How Student Commissions Work" : "How Royalty Points Work"}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(activeTab === "student" ? STEPS_STUDENT : STEPS_NORMAL).map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.num} className="card-white p-6 text-center border border-gold/20">
                  <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center rounded-xl bg-gold/10 text-gold border border-gold/30">
                    <Icon size={20} />
                  </div>
                  <span className="text-[9px] font-mono text-gold-dim uppercase tracking-widest">Step {step.num}</span>
                  <h4 className="font-serif text-obsidian text-base font-medium mt-1 mb-2">{step.title}</h4>
                  <p className="text-obsidian/65 text-xs leading-relaxed">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </motion.section>

      </div>
    </div>
  );
}

function round(val) {
  return Math.round(val || 0);
}
