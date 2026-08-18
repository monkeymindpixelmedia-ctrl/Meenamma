import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { formatApiErrorDetail, haptic, setupAutopay, api } from "../lib/api";

export default function Register() {
  const { register, user: existingUser, refreshUser, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pincode, setPincode] = useState("");
  const [plan, setPlan] = useState(5);
  const [customStepOpen, setCustomStepOpen] = useState(false);
  const [customStepVal, setCustomStepVal] = useState("");
  const [cadence, setCadence] = useState("weekly");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(false);
  const [pwTouched, setPwTouched] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(null);

  React.useEffect(() => {
    let active = true;
    const request = api.get?.("/config/auth");
    if (request) {
      request
        .then(({ data }) => active && setGoogleEnabled(data?.google_enabled === true))
        .catch(() => active && setGoogleEnabled(false));
    }
    return () => { active = false; };
  }, []);

  React.useEffect(() => {
    if (existingUser) {
      if (existingUser.name && !name) setName(existingUser.name);
      if (existingUser.email && !email) setEmail(existingUser.email);
      if (existingUser.pincode && !pincode) setPincode(existingUser.pincode);
    }
  }, [existingUser]);

  const pwRules = [
    { ok: password.length >= 8, label: "At least 8 characters" },
    { ok: /[0-9]/.test(password),  label: "At least one number" },
  ];
  const pwValid = pwRules.every((r) => r.ok);

  const toStep2 = (e) => {
    e.preventDefault();
    haptic();
    setChecking(true);
    setTimeout(() => {
      setChecking(false);
      setStep(2);
    }, 1200);
  };

  const handleCustomStepChange = (val) => {
    setCustomStepVal(val);
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 100) setPlan(parsed);
  };

  const selectPredefinedPlan = (amt) => {
    haptic();
    setCustomStepOpen(false);
    setPlan(amt);
  };

  const cadenceLabel = (c) => c === "weekly" ? "Weekly" : c === "monthly" ? "Monthly" : "Manual!";

  const submit = async () => {
    haptic();
    setBusy(true);
    setError("");
    try {
      let loggedInUser;
      const referred_by_code = localStorage.getItem("meenamma_ref") || undefined;
      
      if (existingUser) {
        // Already authenticated via Google OAuth — skip email/password sign-up.
        // Bootstrap updates name, plan, pincode and handles 409 gracefully.
        await api.post("/profile/bootstrap", {
          name, daily_plan: plan, pincode, cadence, referred_by_code,
        });
        localStorage.removeItem("meenamma_ref");
        loggedInUser = await refreshUser();
      } else {
        loggedInUser = await register(name, email, password, plan, { pincode, cadence, referred_by_code });
      }

      if (cadence !== "manual") {
        await setupAutopay(loggedInUser, { stepAmount: plan, cadence });
      }

      if (loggedInUser?.verificationRequired) {
        navigate("/auth/verify-email");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setError(formatApiErrorDetail(err.response?.data?.detail) || err.message || "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const inr = (val) => val.toLocaleString("en-IN");

  return (
    <div className="min-h-screen bg-alabaster-paper paper-texture flex flex-col items-center justify-center px-6 py-12" data-testid="register-page">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`h-1 w-10 transition-colors duration-300 ${step >= s ? "bg-gold" : "bg-gold/25"}`} data-testid={`step-indicator-${s}`} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.3 }}>
              <h1 className="font-serif text-obsidian text-3xl font-medium text-center">Begin your Kudam</h1>
              <p className="text-obsidian/70 text-sm mt-2 text-center">Step 1 · Your details</p>
              <form onSubmit={toStep2} className="space-y-6 mt-10">
                <input className="input-minimal" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required data-testid="register-name-input" />
                <input className="input-minimal" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required data-testid="register-email-input" />
                {!existingUser && (
                  <div>
                    <input
                      className="input-minimal"
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setPwTouched(true); }}
                      required
                      data-testid="register-password-input"
                    />
                    {pwTouched && (
                      <motion.ul
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-2 space-y-1"
                      >
                        {pwRules.map((r) => (
                          <li key={r.label} className={`flex items-center gap-1.5 text-xs font-serif transition-colors duration-200 ${r.ok ? "text-green-700" : "text-obsidian/60"}`}>
                            <span>{r.ok ? "✓" : "·"}</span>
                            {r.label}
                          </li>
                        ))}
                      </motion.ul>
                    )}
                  </div>
                )}
                <input className="input-minimal num" placeholder="PIN code (delivery area)" value={pincode} onChange={(e) => setPincode(e.target.value)} pattern="[0-9]{6}" maxLength={6} required data-testid="register-pincode-input" />
                {error && <p className="text-obsidian text-sm italic font-serif" data-testid="register-error">{error}</p>}
                <button className="btn-obsidian w-full" disabled={checking || (!existingUser && !pwValid)} data-testid="register-next-btn">
                  {checking ? "Checking serviceability…" : "Continue"}
                </button>
                {checking && (
                  <motion.div className="h-0.5 bg-gold" initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 1.1 }} data-testid="serviceability-bar" />
                )}
              </form>

              {!existingUser && (
                <>
                  <div className="gold-rule my-6" />
                  <button
                    type="button"
                    className="w-full flex items-center justify-center gap-3 border border-gold/60 bg-white py-3.5 text-obsidian text-xs uppercase hover:bg-gold/10 transition-colors duration-300"
                    style={{ letterSpacing: "0.18em" }}
                    onClick={async () => {
                      if (googleEnabled !== true) {
                        if (googleEnabled === false) setError("Google sign-in is not configured.");
                        return;
                      }
                      haptic();
                      setBusy(true);
                      setError("");
                      try {
                        await loginWithGoogle();
                      } catch (err) {
                        setError(err.message || "Could not start Google sign-in.");
                        setBusy(false);
                      }
                    }}
                    disabled={busy || googleEnabled !== true}
                    data-testid="google-register-btn"
                  >
                    {googleEnabled === false ? "Google sign-in unavailable" : "Sign up with Google"}
                  </button>
                  {googleEnabled === false && (
                    <p className="text-obsidian/60 text-xs mt-2 text-center" data-testid="google-register-unavailable">
                      Google sign-in is not configured.
                    </p>
                  )}
                </>
              )}
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.3 }}>
              <h1 className="font-serif text-obsidian text-3xl font-medium text-center">Configure Savings</h1>
              <p className="text-obsidian/70 text-sm mt-2 text-center">Step 2 · Step amount & cadence</p>
              
              <fieldset className="mt-8">
                <legend className="text-obsidian/55 text-[9px] uppercase" style={{ letterSpacing: "0.2em" }}>Daily step</legend>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {[1, 5, 10].map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => selectPredefinedPlan(s)}
                      aria-pressed={plan === s && !customStepOpen}
                      className={`py-2 text-xs border transition-colors ${plan === s && !customStepOpen
                        ? "border-obsidian bg-obsidian text-gold-shimmer"
                        : "border-gold/35 text-obsidian/70"}`}
                      data-testid={`plan-option-${s}`}
                    >
                      +₹{s}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => { haptic(); setCustomStepOpen(true); }}
                    aria-pressed={customStepOpen}
                    className={`py-2 text-xs border transition-colors ${customStepOpen
                      ? "border-obsidian bg-obsidian text-gold-shimmer"
                      : "border-gold/35 text-obsidian/70"}`}
                    data-testid="plan-option-custom"
                  >
                    Custom
                  </button>
                </div>
                {customStepOpen && (
                  <div className="mt-3">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      className="input-minimal text-center font-mono"
                      placeholder="Enter amount (₹1 - ₹100)"
                      value={customStepVal}
                      onChange={(e) => handleCustomStepChange(e.target.value)}
                      data-testid="custom-step-input"
                    />
                  </div>
                )}
              </fieldset>

              <fieldset className="mt-6">
                <legend className="text-obsidian/55 text-[9px] uppercase" style={{ letterSpacing: "0.2em" }}>Settle Cadence</legend>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {["weekly", "monthly", "manual"].map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => { haptic(); setCadence(c); }}
                      aria-pressed={cadence === c}
                      className={`py-2 text-xs border transition-colors ${cadence === c
                        ? "border-gold bg-alabaster text-obsidian font-serif italic"
                        : "border-gold/25 text-obsidian/60"}`}
                      data-testid={`cadence-option-${c}`}
                    >
                      {cadenceLabel(c)}
                    </button>
                  ))}
                </div>
              </fieldset>

              <button className="btn-obsidian w-full mt-8" onClick={() => { haptic(); setStep(3); }} data-testid="plan-continue-btn">Continue</button>
              <button className="w-full text-obsidian/60 text-xs mt-4 underline underline-offset-4" onClick={() => setStep(1)} data-testid="register-back-btn">Back</button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.3 }}>
              <h1 className="font-serif text-obsidian text-3xl font-medium text-center">
                {cadence === "manual" ? "Ceremony Setup" : "Setup Autopay"}
              </h1>
              <p className="text-obsidian/70 text-sm mt-2 text-center">Step 3 · Confirm plan details</p>
              
              <div className="card-white p-6 mt-10 space-y-4">
                <div>
                  <p className="text-obsidian/55 text-[9px] uppercase" style={{ letterSpacing: "0.15em" }}>Daily step amount</p>
                  <p className="num text-obsidian text-2xl mt-1">₹{plan}</p>
                </div>
                <div>
                  <p className="text-obsidian/55 text-[9px] uppercase" style={{ letterSpacing: "0.15em" }}>Settlement cadence</p>
                  <p className="text-obsidian text-lg font-serif mt-1">{cadenceLabel(cadence)}</p>
                </div>
                <div className="border-t border-gold/20 pt-4">
                  <p className="text-obsidian/65 text-xs leading-5 font-serif italic">
                    {cadence === "manual"
                      ? "Your savings will accrue daily. You can settle the balance manually whenever you are ready."
                      : `A secure Razorpay mandate will be configured to automatically sweep and settle the accrued balance on a ${cadence} basis.`}
                  </p>
                </div>
              </div>
              
              {error && <p className="text-obsidian text-sm italic font-serif mt-4">{error}</p>}

              <button className="btn-obsidian w-full mt-8" onClick={submit} disabled={busy} data-testid="register-submit-btn">
                {busy ? "Activating…" : "Activate Daily Savings"}
              </button>

              <button className="w-full text-obsidian/60 text-xs mt-4 underline underline-offset-4" onClick={() => setStep(2)}>Back</button>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-obsidian/70 text-sm mt-8 text-center">
          Already among us?{" "}
          <Link to="/login" className="text-obsidian font-medium underline underline-offset-4 decoration-gold" data-testid="goto-login-link">Enter</Link>
        </p>
      </div>
    </div>
  );
}
