import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy,
  Check,
  Share2,
  Users,
  Coins,
  ArrowUpRight,
  Sparkles,
  ShoppingBag,
  Gift,
  ShieldCheck,
  ExternalLink,
  Briefcase,
  GraduationCap,
  Clock3,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api, haptic } from "../lib/api";

const REWARD_STEPS = [
  {
    num: "01",
    title: "Share your invite link",
    desc: "Send your personal invitation to neighbors, friends, and seafood connoisseurs.",
    icon: Share2,
  },
  {
    num: "02",
    title: "They shop pristine catch",
    desc: "They get harbor-fresh fish delivered before dawn with your welcome perk.",
    icon: ShoppingBag,
  },
  {
    num: "03",
    title: "Earn Royalty Points",
    desc: "Earn 1 Royalty Point for every ₹100 spent. 1 Point = ₹1 discount on your next box.",
    icon: Coins,
  },
];

export default function Referral() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    api.get("/referrals/loyalty")
      .then(({ data: resp }) => {
        if (!mounted) return;
        setData(resp);
      })
      .catch(() => {
        // Fallback to legacy endpoint if loyalty is warming up
        api.get("/referrals")
          .then(({ data: resp }) => mounted && setData(resp))
          .catch(() => mounted && setError("Could not load rewards details."));
      })
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  const referralCode = user?.referral_code || data?.referral_code || "";
  const royaltyPoints = data?.royalty_points ?? user?.royalty_points ?? 0;
  const referrals = data?.referred_members || data?.referrals || [];
  const pointsLedger = data?.points_ledger || data?.points_history || [];

  const referralLink = referralCode
    ? `${window.location.origin}/register?ref=${referralCode}`
    : "";

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
    const text = `Join me on Meenamma — fresh coastal catch delivered before dawn with zero preservatives.\n\nSign up with my link to get fresh catch perks:\n${referralLink}`;
    if (navigator.share) {
      navigator.share({ title: "Meenamma Fresh Catch", text, url: referralLink }).catch(() => {});
    } else {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
    }
  };

  const joinedDate = (value) => {
    if (!value) return "";
    return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <div className="min-h-screen bg-[#0d1b1e] text-cream pb-28 md:pb-16 selection:bg-amber-400 selection:text-black" data-testid="referral-page">
      {/* Header Banner */}
      <section className="relative pt-12 pb-16 px-4 md:px-8 border-b border-amber-400/10 bg-radial from-[#152e35] via-[#0d1b1e] to-[#0a1417] overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400/5 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="flex items-center gap-2 text-amber-300 text-xs tracking-widest uppercase font-mono mb-3">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Meenamma Kudam Loyalty Club
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-cream font-medium tracking-tight mb-4">
            Share the fresh catch.<br />
            <span className="italic text-amber-300 font-normal">Earn royalty points for every feast.</span>
          </h1>
          <p className="text-cream/70 max-w-2xl text-sm md:text-base leading-relaxed">
            Invite neighbors and friends who cherish pristine, unpreserved harbor seafood. Whenever they order, you earn 1 Royalty Point for every ₹100 they spend.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 md:px-8 mt-8 space-y-8">
        {/* Main Grid: Invite Card + Loyalty Balance Card */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Share Invitation Card */}
          <div className="md:col-span-7 bg-[#13262a] border border-amber-400/20 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono tracking-wider text-amber-300/80 uppercase">Your Personal Invite</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 font-mono">
                  Code: {referralCode || "..."}
                </span>
              </div>

              <h2 className="font-serif text-2xl text-cream font-medium mb-2">Invite Friends & Neighbors</h2>
              <p className="text-cream/60 text-xs leading-relaxed mb-6">
                Share this link directly via WhatsApp or copy it to your clipboard.
              </p>

              <div className="bg-[#0b171a] border border-cream/10 rounded-xl p-3 flex items-center gap-3 mb-5">
                <p className="flex-1 text-xs font-mono text-cream/90 truncate">{referralLink || "Generating link..."}</p>
                <button
                  onClick={() => copyText(referralLink)}
                  className="px-3 py-1.5 rounded-lg bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/40 text-amber-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  data-testid="copy-referral-link"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            <button
              onClick={shareViaWhatsApp}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 transition-all cursor-pointer"
              data-testid="share-whatsapp-btn"
            >
              <Share2 className="w-4 h-4" />
              Share on WhatsApp
            </button>
          </div>

          {/* Loyalty Points Balance Card */}
          <div className="md:col-span-5 bg-gradient-to-br from-[#1c383f] to-[#122428] border border-amber-400/30 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono tracking-wider text-amber-300/90 uppercase flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-amber-400" />
                  Royalty Balance
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                  1 pt = ₹1 INR
                </span>
              </div>

              <div className="my-3">
                <div className="font-serif text-5xl text-cream font-medium tracking-tight flex items-baseline gap-2">
                  {royaltyPoints}
                  <span className="text-sm font-sans text-cream/50">points</span>
                </div>
                <p className="text-amber-200/80 text-xs mt-1">
                  Worth <span className="font-bold text-amber-300">₹{royaltyPoints}</span> discount on your next fresh catch order.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-cream/10 space-y-2 text-xs text-cream/70">
                <div className="flex justify-between">
                  <span>Referred Friends</span>
                  <span className="font-mono text-cream font-medium">{referrals.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Reward Rate</span>
                  <span className="font-mono text-amber-300">1 pt / ₹100 spent</span>
                </div>
              </div>
            </div>

            <Link
              to="/products"
              className="mt-6 w-full py-2.5 text-center text-xs font-medium text-cream/90 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors block"
            >
              Order Fresh Catch with Points
            </Link>
          </div>
        </div>

        {/* How It Works Steps */}
        <div className="bg-[#112226] border border-cream/10 rounded-2xl p-6 md:p-8">
          <h3 className="font-serif text-xl text-cream font-medium mb-6 flex items-center gap-2">
            <Gift className="w-5 h-5 text-amber-400" />
            How Shopper Rewards Work
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {REWARD_STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.num} className="bg-[#0b171a]/60 border border-cream/5 rounded-xl p-5 relative">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-amber-400 font-mono text-xs font-bold">{step.num}</span>
                    <Icon className="w-4 h-4 text-amber-300/80" />
                  </div>
                  <h4 className="font-serif text-cream text-base font-medium mb-1">{step.title}</h4>
                  <p className="text-cream/60 text-xs leading-relaxed">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Referred Friends & Points Ledger */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Referred Friends */}
          <div className="bg-[#112226] border border-cream/10 rounded-2xl p-6">
            <h3 className="font-serif text-lg text-cream font-medium mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400" />
              Referred Friends ({referrals.length})
            </h3>
            {referrals.length === 0 ? (
              <div className="text-center py-10 px-4 border border-dashed border-cream/10 rounded-xl">
                <Users className="w-8 h-8 text-cream/20 mx-auto mb-2" />
                <p className="text-cream/60 text-xs">No invited friends yet.</p>
                <p className="text-cream/40 text-[11px] mt-1">Share your link to start earning royalty points.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {referrals.map((r) => (
                  <div
                    key={r.id}
                    className="p-3.5 rounded-xl bg-[#0b171a] border border-cream/5 flex items-center justify-between"
                    data-testid={`referred-member-${r.id}`}
                  >
                    <div>
                      <p className="font-medium text-cream text-xs">{r.name}</p>
                      <p className="text-[10px] text-cream/40 font-mono mt-0.5">Joined {joinedDate(r.joined_at)}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                      r.is_subscriber
                        ? "bg-amber-400/20 text-amber-300 border border-amber-400/30"
                        : "bg-white/5 text-cream/60"
                    }`}>
                      {r.is_subscriber ? "Kudam Saver" : "Shopper"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Points History */}
          <div className="bg-[#112226] border border-cream/10 rounded-2xl p-6">
            <h3 className="font-serif text-lg text-cream font-medium mb-4 flex items-center gap-2">
              <Coins className="w-4 h-4 text-amber-400" />
              Recent Points Activity
            </h3>
            {pointsLedger.length === 0 ? (
              <div className="text-center py-10 px-4 border border-dashed border-cream/10 rounded-xl">
                <Coins className="w-8 h-8 text-cream/20 mx-auto mb-2" />
                <p className="text-cream/60 text-xs">No points activity yet.</p>
                <p className="text-cream/40 text-[11px] mt-1">Points will show here as your referred friends make orders.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {pointsLedger.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl bg-[#0b171a] border border-cream/5 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium text-cream text-xs">{item.note || "Referral Purchase Reward"}</p>
                      <p className="text-[10px] text-cream/40 font-mono mt-0.5">{joinedDate(item.created_at)}</p>
                    </div>
                    <span className={`text-xs font-mono font-bold ${
                      item.points_change >= 0 ? "text-emerald-400" : "text-amber-400"
                    }`}>
                      {item.points_change >= 0 ? `+${item.points_change}` : item.points_change} pts
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Dedicated Portals Promotion Banners */}
        <div className="border-t border-amber-400/20 pt-8">
          <div className="mb-4">
            <h3 className="font-serif text-xl text-cream font-medium">Looking for Professional Earning Programs?</h3>
            <p className="text-cream/60 text-xs mt-1">
              We offer dedicated platforms with direct bank/UPI payouts for community partners and college student interns.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Earn Portal Banner */}
            <a
              href="https://earn.meenamma.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group p-6 rounded-2xl bg-gradient-to-br from-[#193238] to-[#0e1d21] border border-amber-400/30 hover:border-amber-400/70 transition-all shadow-lg flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-amber-400/10 text-amber-300 border border-amber-400/20">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-mono text-amber-300 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    earn.meenamma.com <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                </div>
                <h4 className="font-serif text-lg text-cream font-medium mb-1.5 group-hover:text-amber-300 transition-colors">
                  Community Partner Network
                </h4>
                <p className="text-cream/70 text-xs leading-relaxed">
                  Earn 5% recurring cash commissions on every order and ₹50 per Kudam subscriber. Includes real-time analytics, instant UPI withdrawals, and promotional kits.
                </p>
              </div>
              <div className="mt-4 flex items-center text-xs font-semibold text-amber-400 gap-1.5">
                <span>Launch Partner Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </div>
            </a>

            {/* Internships Banner */}
            <a
              href="https://referrals.meenamma.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group p-6 rounded-2xl bg-gradient-to-br from-[#172b33] to-[#0c181d] border border-emerald-500/30 hover:border-emerald-500/70 transition-all shadow-lg flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-mono text-emerald-300 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    referrals.meenamma.com <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                </div>
                <h4 className="font-serif text-lg text-cream font-medium mb-1.5 group-hover:text-emerald-300 transition-colors">
                  Student Internship & Lead Scouts
                </h4>
                <p className="text-cream/70 text-xs leading-relaxed">
                  Field scout and lead generation program for students. No personal Kudam required. Earn verified lead bounties, up to ₹3,500 monthly stipends, and certificate of excellence.
                </p>
              </div>
              <div className="mt-4 flex items-center text-xs font-semibold text-emerald-400 gap-1.5">
                <span>Launch Intern Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
