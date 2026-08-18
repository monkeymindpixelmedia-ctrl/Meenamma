import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Crown, Copy, Check } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api, formatApiErrorDetail, haptic } from "../lib/api";

const PLANS = [1, 5, 10];

export default function Profile() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || "");
  const [plan, setPlan] = useState(user?.daily_plan || 5);
  const [pincode, setPincode] = useState(user?.pincode || "");
  const [upi, setUpi] = useState(user?.upi_id || "");
  const [locale, setLocale] = useState(user?.locale || "en");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const setLang = async (lang) => {
    haptic();
    setLocale(lang);
    setMsg("");
    try {
      const { data } = await api.patch("/me", { locale: lang });
      updateUser(data);
      setMsg(lang === "ta" ? "மொழி மாற்றப்பட்டது." : "Language set to English.");
    } catch (err) {
      setMsg(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    }
  };

  const save = async (e) => {
    e.preventDefault();
    haptic();
    setBusy(true);
    setMsg("");
    try {
      const { data } = await api.patch("/me", { name, daily_plan: Number(plan), pincode, upi_id: upi });
      updateUser(data);
      setMsg("Profile saved.");
    } catch (err) {
      setMsg(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    } finally {
      setBusy(false);
    }
  };

  const doLogout = async () => {
    await logout();
    navigate("/home");
  };

  const referralLink = user?.referral_code ? `${window.location.origin}/register?ref=${user.referral_code}` : "";
  const [copied, setCopied] = useState(false);
  const copyReferral = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    haptic();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-alabaster-paper paper-texture pb-24 md:pb-16" data-testid="profile-page">
      <div className="max-w-xl mx-auto px-4 md:px-8 pt-10">
        <p className="text-gold-dim text-[10px] uppercase" style={{ letterSpacing: "0.4em" }}>Your household</p>
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-obsidian text-3xl md:text-4xl font-medium">Profile</h1>
          {user?.role === "admin" && (
            <span className="flex items-center gap-1 text-gold-dim text-[10px] uppercase" style={{ letterSpacing: "0.2em" }}>
              <Crown size={14} /> Store Admin
            </span>
          )}
        </div>

        {user?.referral_code && (
          <motion.div
            className="mt-8 p-6 relative overflow-hidden rounded-sm"
            style={{
              background: "linear-gradient(135deg, rgba(197, 160, 89, 0.05) 0%, rgba(197, 160, 89, 0.15) 100%)",
              border: "1px solid rgba(197, 160, 89, 0.3)",
              boxShadow: "0 8px 32px rgba(197, 160, 89, 0.05)"
            }}
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.1 }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gold/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
            <h2 className="font-serif text-obsidian text-2xl mb-1">Refer & Earn</h2>
            <p className="text-obsidian/70 text-xs mb-5 font-serif italic">Invite friends to build their Kudam.</p>
            
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-white/70 backdrop-blur-sm border border-gold/20 px-4 py-3 text-obsidian/80 text-xs truncate font-mono">
                {referralLink}
              </div>
              <button
                onClick={copyReferral}
                className="bg-gold text-white p-3 hover:bg-gold-dim transition-colors"
                aria-label="Copy referral link"
              >
                <AnimatePresence mode="wait">
                  {copied ? (
                    <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                      <Check size={16} />
                    </motion.div>
                  ) : (
                    <motion.div key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                      <Copy size={16} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </div>
            
            <div className="mt-5 flex items-end justify-between border-t border-gold/20 pt-4">
              <span className="text-obsidian/60 text-[10px] uppercase tracking-widest">Total Referred</span>
              <span className="font-serif text-obsidian text-2xl leading-none">{user?.referral_count || 0}</span>
            </div>
          </motion.div>
        )}

        <motion.form
          onSubmit={save}
          className="card-white p-6 md:p-8 mt-8 space-y-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <label className="text-obsidian/70 text-[10px] uppercase" style={{ letterSpacing: "0.25em" }}>Name</label>
            <input className="input-minimal" value={name} onChange={(e) => setName(e.target.value)} required data-testid="profile-name-input" />
          </div>
          <div>
            <label className="text-obsidian/70 text-[10px] uppercase" style={{ letterSpacing: "0.25em" }}>Email</label>
            <p className="text-obsidian/80 text-sm py-3 border-b border-gold/25" data-testid="profile-email">{user?.email}</p>
          </div>
          <div>
            <label className="text-obsidian/70 text-[10px] uppercase" style={{ letterSpacing: "0.25em" }}>Daily savings plan</label>
            <div className="flex gap-3 mt-3">
              {PLANS.map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => { haptic(); setPlan(p); }}
                  data-testid={`profile-plan-${p}`}
                  className={`flex-1 py-3 border transition-all duration-300 ${
                    Number(plan) === p ? "border-gold bg-alabaster/70 shadow-[0_0_0_1px_#C5A059]" : "border-gold/30 bg-white"
                  }`}
                >
                  <span className="num-lg text-obsidian text-xl"><span className="rupee">₹</span>{p}</span>
                  <span className="text-obsidian/60 text-[10px] block">per day</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-obsidian/70 text-[10px] uppercase" style={{ letterSpacing: "0.25em" }}>PIN code</label>
            <input className="input-minimal num" value={pincode} onChange={(e) => setPincode(e.target.value)} maxLength={6} data-testid="profile-pincode-input" />
          </div>
          <div>
            <label className="text-obsidian/70 text-[10px] uppercase" style={{ letterSpacing: "0.25em" }}>UPI ID</label>
            <input className="input-minimal" value={upi} onChange={(e) => setUpi(e.target.value)} placeholder="yourname@upi" data-testid="profile-upi-input" />
          </div>
          <div>
            <label className="text-obsidian/70 text-[10px] uppercase" style={{ letterSpacing: "0.25em" }}>Language</label>
            <div className="flex gap-3 mt-3">
              {[["en", "English"], ["ta", "தமிழ்"]].map(([code, label]) => (
                <button
                  type="button"
                  key={code}
                  onClick={() => setLang(code)}
                  data-testid={`profile-lang-${code}`}
                  className={`flex-1 py-3 border transition-all duration-300 ${
                    locale === code ? "border-gold bg-alabaster/70 shadow-[0_0_0_1px_#C5A059]" : "border-gold/30 bg-white"
                  }`}
                >
                  <span className={`text-obsidian text-sm ${code === "ta" ? "tamil" : "font-serif"}`}>{label}</span>
                  <span className="text-obsidian/60 text-[10px] block mt-0.5">{code === "ta" ? "தமிழ்" : "English"}</span>
                </button>
              ))}
            </div>
          </div>
          {msg && <p className="text-obsidian text-sm italic font-serif" data-testid="profile-msg">{msg}</p>}
          <button className="btn-obsidian w-full" disabled={busy} data-testid="profile-save-btn">
            {busy ? "Saving…" : "Save changes"}
          </button>
        </motion.form>

        <button className="w-full flex items-center justify-center gap-2 mt-6 py-3 text-obsidian/70 hover:text-obsidian text-xs uppercase transition-colors" style={{ letterSpacing: "0.2em" }} onClick={doLogout} data-testid="profile-logout-btn">
          <LogOut size={14} /> Sign out
        </button>
      </div>
    </div>
  );
}
