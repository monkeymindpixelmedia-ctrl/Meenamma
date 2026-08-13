import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { SavingsMandala } from "../components/SavingsMandala";
import { useAuth } from "../context/AuthContext";
import { formatApiErrorDetail, haptic } from "../lib/api";

const PLANS = [
  { amount: 1, reward: "5% discount on feast day", tag: "Gentle" },
  { amount: 5, reward: "20% Discount + Family Hamper", tag: "Most loved" },
  { amount: 10, reward: "20% Discount + Premium Hamper", tag: "Generous" },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pincode, setPincode] = useState("");
  const [plan, setPlan] = useState(5);
  const [upi, setUpi] = useState("");
  const [upiConnected, setUpiConnected] = useState(false);
  const [checking, setChecking] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [welcome, setWelcome] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const toStep2 = (e) => {
    e.preventDefault();
    haptic();
    setChecking(true);
    setTimeout(() => {
      setChecking(false);
      setStep(2);
    }, 1200);
  };

  const connectUpi = () => {
    haptic();
    setConnecting(true);
    setTimeout(() => {
      setConnecting(false);
      setUpiConnected(true);
    }, 1200);
  };

  const submit = async () => {
    haptic();
    setBusy(true);
    setError("");
    try {
      await register(name, email, password, plan, { pincode, upi_id: upi });
      setWelcome(true);
      setTimeout(() => navigate("/dashboard"), 2400);
    } catch (err) {
      setError(formatApiErrorDetail(err.response?.data?.detail) || err.message || "Something went wrong. Please try again.");
      setStep(1);
    } finally {
      setBusy(false);
    }
  };

  if (welcome) {
    return (
      <div className="min-h-screen bg-sandalwood-paper paper-texture flex flex-col items-center justify-center px-6 text-center" data-testid="welcome-screen">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
          <SavingsMandala progress={0} size={200} />
          <h1 className="font-serif text-henna text-3xl md:text-4xl font-medium mt-8">Welcome to the<br />Meenamma Family</h1>
          <p className="text-henna/70 text-sm mt-3">Your kudam is consecrated. The daily rhythm begins now.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sandalwood-paper paper-texture flex flex-col items-center justify-center px-6 py-12" data-testid="register-page">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`h-1 w-10 transition-colors duration-300 ${step >= s ? "bg-gold" : "bg-gold/25"}`} data-testid={`step-indicator-${s}`} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.3 }}>
              <h1 className="font-serif text-henna text-3xl font-medium text-center">Begin your Kudam</h1>
              <p className="text-henna/70 text-sm mt-2 text-center">Step 1 · Your details</p>
              <form onSubmit={toStep2} className="space-y-6 mt-10">
                <input className="input-minimal" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required data-testid="register-name-input" />
                <input className="input-minimal" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required data-testid="register-email-input" />
                <input className="input-minimal" type="password" placeholder="Password (min 6 characters)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} data-testid="register-password-input" />
                <input className="input-minimal num" placeholder="PIN code (delivery area)" value={pincode} onChange={(e) => setPincode(e.target.value)} pattern="[0-9]{6}" maxLength={6} required data-testid="register-pincode-input" />
                {error && <p className="text-henna text-sm italic font-serif" data-testid="register-error">{error}</p>}
                <button className="btn-henna w-full" disabled={checking} data-testid="register-next-btn">
                  {checking ? "Checking serviceability…" : "Continue"}
                </button>
                {checking && (
                  <motion.div className="h-0.5 bg-gold" initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 1.1 }} data-testid="serviceability-bar" />
                )}
              </form>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.3 }}>
              <h1 className="font-serif text-henna text-3xl font-medium text-center">Choose your rhythm</h1>
              <p className="text-henna/70 text-sm mt-2 text-center">Step 2 · Daily savings plan</p>
              <div className="space-y-4 mt-10">
                {PLANS.map((p) => (
                  <button
                    key={p.amount}
                    onClick={() => { haptic(); setPlan(p.amount); }}
                    data-testid={`plan-option-${p.amount}`}
                    className={`w-full text-left p-5 border transition-all duration-300 ${
                      plan === p.amount ? "border-gold bg-white shadow-[0_0_0_1px_#C5A059]" : "border-gold/30 bg-white/60"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="num-lg text-henna text-2xl"><span className="rupee">₹</span>{p.amount}<span className="text-sm text-henna/60 font-sans font-normal"> / day</span></span>
                      <span className="text-gold-dim text-[9px] uppercase" style={{ letterSpacing: "0.25em" }}>{p.tag}</span>
                    </div>
                    <p className="text-henna/75 text-xs mt-2">₹{p.amount}/day = {p.reward}</p>
                  </button>
                ))}
              </div>
              <button className="btn-henna w-full mt-8" onClick={() => { haptic(); setStep(3); }} data-testid="plan-continue-btn">Continue</button>
              <button className="w-full text-henna/60 text-xs mt-4 underline underline-offset-4" onClick={() => setStep(1)} data-testid="register-back-btn">Back</button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.3 }}>
              <h1 className="font-serif text-henna text-3xl font-medium text-center">Connect your UPI</h1>
              <p className="text-henna/70 text-sm mt-2 text-center">Step 3 · One-tap daily payments</p>
              <div className="card-white p-6 mt-10">
                <input className="input-minimal" placeholder="yourname@upi" value={upi} onChange={(e) => { setUpi(e.target.value); setUpiConnected(false); }} data-testid="register-upi-input" />
                {upiConnected ? (
                  <div className="flex items-center gap-2 mt-5 text-henna" data-testid="upi-connected">
                    <CheckCircle2 size={18} className="text-gold" />
                    <span className="text-sm">UPI connected — payments will be one tap.</span>
                  </div>
                ) : (
                  <button className="btn-gold-outline w-full mt-5" onClick={connectUpi} disabled={connecting || !upi} data-testid="connect-upi-btn">
                    {connecting ? "Connecting…" : "Connect UPI"}
                  </button>
                )}
              </div>
              {error && <p className="text-henna text-sm italic font-serif mt-4">{error}</p>}
              <button className="btn-henna w-full mt-8" onClick={submit} disabled={busy} data-testid="register-submit-btn">
                {busy ? "Consecrating…" : "Begin the Ceremony"}
              </button>
              <button className="w-full text-henna/60 text-xs mt-4 underline underline-offset-4" onClick={() => setStep(2)}>Back</button>
              <p className="text-henna/60 text-[11px] text-center mt-3">You can also skip UPI and pay per deposit via Razorpay.</p>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-henna/70 text-sm mt-8 text-center">
          Already among us?{" "}
          <Link to="/login" className="text-henna font-medium underline underline-offset-4 decoration-gold" data-testid="goto-login-link">Enter</Link>
        </p>
      </div>
    </div>
  );
}
