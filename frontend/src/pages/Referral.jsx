import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, Share2, Users, Gift, ArrowRight, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { haptic } from "../lib/api";

const STEPS = [
  {
    num: "01",
    title: "Share your link",
    desc: "Send your unique referral link to friends and family who love fresh catch.",
    icon: Share2,
  },
  {
    num: "02",
    title: "They join the Kudam",
    desc: "When they sign up and start their savings journey, the connection is made.",
    icon: Users,
  },
  {
    num: "03",
    title: "You both celebrate",
    desc: "Every successful referral strengthens the Meenamma community of households.",
    icon: Gift,
  },
];

export default function Referral() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [shareMessage, setShareMessage] = useState("");

  const referralLink = user?.referral_code
    ? `${window.location.origin}/register?ref=${user.referral_code}`
    : "";

  const referralCode = user?.referral_code || "";
  const referralCount = user?.referral_count || 0;

  const copyLink = async () => {
    if (!referralLink) return;
    haptic();
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = referralLink;
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
    const text = `Join me on Meenamma — fresh catch delivered before dawn, with a savings ritual that makes every meal meaningful.\n\nUse my referral link:\n${referralLink}`;
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
          text: "Fresh catch delivered before dawn, with a savings ritual that makes every meal meaningful.",
          url: referralLink,
        });
      } catch {
        // User cancelled or error
      }
    } else {
      copyLink();
    }
  };

  return (
    <div className="min-h-screen bg-alabaster-paper paper-texture pb-28 md:pb-16" data-testid="referral-page">
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 lg:px-16 pt-8 lg:pt-16">
        
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-2xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/20 px-4 py-2 mb-8">
            <Sparkles size={14} className="text-gold" />
            <span className="text-gold-dim text-[10px] uppercase tracking-[0.3em]">Referral Programme</span>
          </div>
          
          <h1 className="font-serif text-obsidian text-4xl md:text-5xl lg:text-6xl font-medium leading-[1.1]" data-testid="referral-hero-title">
            Share the Catch,
            <br />
            <span className="text-gold">Grow the Table</span>
          </h1>
          
          <p className="text-obsidian/65 text-base md:text-lg leading-relaxed mt-6 max-w-lg mx-auto font-serif italic">
            Every household that joins through your invitation strengthens the dawn boats and deepens the Kudam ritual.
          </p>
        </motion.section>

        {/* Referral Code Card */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-xl mx-auto mt-12"
        >
          <div className="card-white p-8 md:p-10 relative overflow-hidden" data-testid="referral-code-card">
            {/* Subtle gold accent line */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent" />
            
            <div className="text-center">
              <p className="text-gold-dim text-[10px] uppercase tracking-[0.35em] mb-6">Your referral link</p>
              
              {/* Referral Code Display */}
              <div className="bg-alabaster/60 border border-gold/15 p-5 mb-6" data-testid="referral-code-display">
                <p className="text-obsidian/40 text-[9px] uppercase tracking-[0.2em] mb-2">Your Code</p>
                <p className="font-serif text-obsidian text-2xl md:text-3xl font-medium tracking-[0.15em]" data-testid="referral-code">
                  {referralCode}
                </p>
              </div>
              
              {/* Full Link */}
              <div className="flex items-center gap-2 bg-white border border-gold/20 px-4 py-3 mb-6">
                <p className="flex-1 text-obsidian/70 text-xs truncate font-mono" data-testid="referral-link">
                  {referralLink || "Link not available"}
                </p>
                <button
                  onClick={copyLink}
                  className="flex-shrink-0 p-2 hover:bg-gold/10 transition-colors duration-300"
                  aria-label="Copy referral link"
                  data-testid="copy-referral-btn"
                >
                  <AnimatePresence mode="wait">
                    {copied ? (
                      <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                        <Check size={16} className="text-green-600" />
                      </motion.div>
                    ) : (
                      <motion.div key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                        <Copy size={16} className="text-obsidian/50" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              </div>
              
              {/* Share Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={shareViaWhatsApp}
                  className="flex-1 btn-gold-outline !py-3 flex items-center justify-center gap-2"
                  data-testid="share-whatsapp-btn"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Share on WhatsApp
                </button>
                <button
                  onClick={shareNative}
                  className="btn-obsidian !py-3 flex items-center justify-center gap-2"
                  data-testid="share-native-btn"
                >
                  <Share2 size={14} />
                  Share
                </button>
              </div>
              
              {shareMessage && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-gold text-xs mt-3 font-serif italic"
                >
                  {shareMessage}
                </motion.p>
              )}
            </div>
          </div>
        </motion.section>

        {/* Stats */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-xl mx-auto mt-10"
        >
          <div className="grid grid-cols-3 gap-px bg-gold/15 border border-gold/15" data-testid="referral-stats">
            <div className="bg-white p-6 text-center">
              <p className="num-lg text-obsidian text-3xl md:text-4xl" data-testid="referral-count">
                {referralCount}
              </p>
              <p className="text-obsidian/50 text-[9px] uppercase mt-2" style={{ letterSpacing: "0.2em" }}>
                Referred
              </p>
            </div>
            <div className="bg-white p-6 text-center">
              <p className="num-lg text-obsidian text-3xl md:text-4xl">
                {referralCount > 0 ? "Active" : "—"}
              </p>
              <p className="text-obsidian/50 text-[9px] uppercase mt-2" style={{ letterSpacing: "0.2em" }}>
                Status
              </p>
            </div>
            <div className="bg-white p-6 text-center">
              <p className="num-lg text-obsidian text-3xl md:text-4xl">
                {referralCount >= 5 ? "Gold" : referralCount >= 3 ? "Silver" : referralCount >= 1 ? "Bronze" : "New"}
              </p>
              <p className="text-obsidian/50 text-[9px] uppercase mt-2" style={{ letterSpacing: "0.2em" }}>
                Tier
              </p>
            </div>
          </div>
        </motion.section>

        {/* How It Works */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl mx-auto mt-16"
        >
          <div className="text-center mb-10">
            <p className="text-gold-dim text-[10px] uppercase tracking-[0.4em] mb-3">The Ritual</p>
            <h2 className="font-serif text-obsidian text-2xl md:text-3xl font-medium">How Referrals Work</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8" data-testid="referral-steps">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 + i * 0.15 }}
                  className="text-center"
                >
                  <div className="w-16 h-16 mx-auto mb-5 flex items-center justify-center border border-gold/30 bg-alabaster/50">
                    <Icon size={24} className="text-gold" strokeWidth={1.5} />
                  </div>
                  <p className="text-gold-dim text-[9px] uppercase tracking-[0.3em] mb-2">Step {step.num}</p>
                  <h3 className="font-serif text-obsidian text-lg font-medium mb-2">{step.title}</h3>
                  <p className="text-obsidian/60 text-sm leading-relaxed">{step.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        {/* Community Banner */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl mx-auto mt-16 mb-8"
        >
          <div 
            className="relative p-8 md:p-12 overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #0A0A0A 0%, #1a1a1a 100%)",
            }}
            data-testid="referral-community-banner"
          >
            {/* Gold accent dots */}
            <div className="absolute top-6 right-6 w-2 h-2 bg-gold/40 rounded-full" />
            <div className="absolute top-6 right-10 w-1 h-1 bg-gold/20 rounded-full" />
            <div className="absolute bottom-6 left-6 w-1 h-1 bg-gold/30 rounded-full" />
            
            <div className="relative z-10 text-center">
              <p className="text-gold text-[10px] uppercase tracking-[0.4em] mb-4">The Meenamma Community</p>
              <h2 className="font-serif text-white text-2xl md:text-3xl font-medium leading-snug max-w-lg mx-auto">
                Every referral brings another household closer to the dawn boats
              </h2>
              <p className="text-white/50 text-sm mt-4 max-w-md mx-auto font-serif italic leading-relaxed">
                Together, we sustain multi-generational fishing families along the Coromandel Coast 
                while building a community that values fresh, honest catch.
              </p>
              <button
                onClick={() => navigate("/dashboard")}
                className="mt-8 inline-flex items-center gap-2 text-gold text-[10px] uppercase tracking-[0.25em] hover:text-gold-dim transition-colors duration-300"
                data-testid="referral-dashboard-link"
              >
                Return to Dashboard
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </motion.section>

        {/* FAQ */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-xl mx-auto mt-12 mb-8"
        >
          <p className="text-gold-dim text-[10px] uppercase tracking-[0.4em] text-center mb-6">Questions</p>
          
          <div className="space-y-4" data-testid="referral-faq">
            {[
              {
                q: "How do I share my referral link?",
                a: "Copy your unique link from the card above and send it via WhatsApp, SMS, or any messaging app. When your friend signs up using that link, they're connected to your referral.",
              },
              {
                q: "What happens when someone uses my link?",
                a: "When a new household joins Meenamma through your referral, they start their own Kudam savings journey. Your referral count increases and you unlock community recognition.",
              },
              {
                q: "Is there a limit to referrals?",
                a: "No limit. The more households you bring into the Meenamma community, the stronger our collective bond with the fishing families along the coast.",
              },
            ].map((item, i) => (
              <div key={i} className="card-white p-5">
                <h4 className="font-serif text-obsidian text-base font-medium mb-2">{item.q}</h4>
                <p className="text-obsidian/60 text-sm leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </motion.section>
      </div>
    </div>
  );
}
