import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2 } from "lucide-react";
import { SavingsMandala } from "../components/SavingsMandala";
import { useAuth } from "../context/AuthContext";
import { api, payWithRazorpay, setupAutopay, createAutopayPaymentLink, formatApiErrorDetail, imgUrl, haptic } from "../lib/api";

const QUICK = [100, 250, 500, 1000];

function tomorrowStr() {
  return new Date(Date.now() + 86400000).toISOString().slice(0, 10);
}

function SuccessGlow({ text, onDone }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed bottom-24 md:bottom-10 left-1/2 -translate-x-1/2 z-50 bg-obsidian text-gold-shimmer px-8 py-4 shadow-2xl flex items-center gap-3"
      data-testid="success-toast"
      onAnimationComplete={() => setTimeout(onDone, 2200)}
    >
      <motion.span
        className="w-2 h-2 rounded-full bg-gold"
        animate={{ scale: [1, 1.6, 1], opacity: [1, 0.5, 1] }}
        transition={{ duration: 1.2, repeat: Infinity }}
      />
      <span className="font-serif text-base">{text}</span>
    </motion.div>
  );
}

function Celebration({ kudamName, onClose }) {
  const flakes = [...Array(34)];
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-obsidian/95 backdrop-blur-sm px-6 overflow-hidden"
      onClick={onClose}
      data-testid="kudam-celebration"
    >
      {/* radial gold glow pulses */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={`ring-${i}`}
          className="absolute rounded-full border border-gold/40"
          style={{ width: 300 + i * 130, height: 300 + i * 130 }}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: [0.6, 1.15], opacity: [0, 0.7, 0] }}
          transition={{ duration: 2.8, repeat: Infinity, delay: i * 0.7, ease: "easeOut" }}
        />
      ))}
      {/* falling gold flakes */}
      {flakes.map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            left: `${(i * 61) % 100}%`,
            top: "-4%",
            width: 4 + (i % 4) * 2,
            height: 8 + (i % 3) * 4,
            background: i % 3 === 0 ? "#E5C17A" : i % 3 === 1 ? "#C5A059" : "#F4EBD0",
            opacity: 0.9,
          }}
          initial={{ y: -40, rotate: 0, opacity: 0 }}
          animate={{
            y: ["0vh", "110vh"],
            x: [0, (i % 2 ? 1 : -1) * (20 + (i % 5) * 14)],
            rotate: [0, (i % 2 ? 1 : -1) * (360 + (i % 4) * 180)],
            opacity: [0, 1, 1, 0.6],
          }}
          transition={{ duration: 3.6 + (i % 5) * 0.7, repeat: Infinity, delay: (i * 0.17) % 2.4, ease: "linear" }}
        />
      ))}
      {/* shimmer sweep */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(115deg, transparent 30%, rgba(229,193,122,0.16) 50%, transparent 70%)" }}
        animate={{ x: ["-100%", "100%"] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="text-center relative"
      >
        <motion.div
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          className="inline-block"
          style={{ filter: "drop-shadow(0 0 42px rgba(197,160,89,0.55))" }}
        >
          <SavingsMandala progress={1} size={230} />
        </motion.div>
        <motion.h2
          className="font-serif text-3xl md:text-4xl font-medium mt-8"
          style={{
            background: "linear-gradient(90deg, #C5A059, #F4EBD0, #E5C17A, #C5A059)",
            backgroundSize: "220% auto",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
          animate={{ backgroundPosition: ["0% center", "220% center"] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "linear" }}
        >
          The Kudam is full.
        </motion.h2>
        <p className="text-alabaster/85 text-sm mt-3 max-w-xs mx-auto">
          "{kudamName}" is complete — a <span className="text-gold font-semibold">20% feast discount</span> now awaits you at the Fresh Catch.
        </p>
        <button className="btn-obsidian !bg-gold !text-obsidian font-semibold mt-8" onClick={onClose} data-testid="celebration-close-btn">Claim the Feast</button>
      </motion.div>
    </motion.div>
  );
}

export default function Dashboard() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [kudams, setKudams] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [amount, setAmount] = useState(100);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newGoal, setNewGoal] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [resDate, setResDate] = useState({});
  const [products, setProducts] = useState([]);
  const [reward, setReward] = useState(null);
  const [celebrate, setCelebrate] = useState(null);
  const [success, setSuccess] = useState("");

  const [stepAmount, setStepAmount] = useState(user?.step_amount || 5);
  const [customStepOpen, setCustomStepOpen] = useState(false);
  const [customStepVal, setCustomStepVal] = useState("");
  const [cadence, setCadence] = useState(user?.autopay_cadence || "weekly");
  const [autopay, setAutopay] = useState(null);

  const load = useCallback(async () => {
    // 1. Fetch essential dashboard data first to make page load feel instantaneous
    try {
      const [{ data: ks }, { data: bs }, { data: ap }] = await Promise.all([
        api.get("/kudams"),
        api.get("/bookings"),
        api.get("/autopay")
      ]);
      setKudams(ks);
      setBookings(bs);
      setAutopay(ap);
      setActiveId((prev) => prev || (ks[0] && ks[0].id));
    } catch (err) {
      console.error("Essential dashboard load failed:", err);
    }

    // 2. Fetch secondary data in the background without blocking the UI
    try {
      const [{ data: ps }, { data: rw }, { data: rs }] = await Promise.all([
        api.get("/products"),
        api.get("/rewards/status"),
        api.get("/reservations")
      ]);
      setProducts(ps.slice(0, 3));
      setReward(rw);
      setReservations(rs);
    } catch (err) {
      console.error("Secondary dashboard load failed:", err);
    }
  }, []);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  const active = kudams?.find((k) => k.id === activeId);
  const progress = active ? Math.min(active.saved_amount / active.goal_amount, 1) : 0;
  const plan = user?.daily_plan || 5;
  const hasActiveKudam = kudams?.some((k) => k.status === "active");

  const createKudam = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      const { data } = await api.post("/kudams", { name: newName, goal_amount: Number(newGoal) });
      setKudams((ks) => [data, ...(ks || [])]);
      setActiveId(data.id);
      setShowCreate(false);
      setNewName("");
      setNewGoal("");
    } catch (err) {
      setMsg(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    } finally {
      setBusy(false);
    }
  };

  const deleteKudam = async (k) => {
    haptic();
    if (user?.autopay_status === "active" && kudams?.filter((x) => x.status === "active").length <= 1) {
      alert("Cannot delete the last vessel while an active savings ladder is running. Stop the savings ladder first.");
      return;
    }
    if (!window.confirm(`Delete "${k.name}" forever? This cannot be undone.`)) return;
    setBusy(true);
    setMsg("");
    try {
      await api.delete(`/kudams/${k.id}`);
      setKudams((ks) => ks.filter((x) => x.id !== k.id));
      if (activeId === k.id) setActiveId((kudams || []).find((x) => x.id !== k.id)?.id || null);
      setSuccess(`"${k.name}" laid to rest.`);
    } catch (err) {
      setMsg(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    } finally {
      setBusy(false);
    }
  };

  const deposit = async (amt) => {
    if (!active || !amt) return;
    haptic();
    setBusy(true);
    setMsg("");
    try {
      const res = await payWithRazorpay({ purpose: "deposit", amount: Number(amt), kudam_id: active.id }, user);
      if (res.kudam && res.kudam.status === "complete") setCelebrate(res.kudam.name);
      else setSuccess(`₹${Number(amt).toLocaleString("en-IN")} poured into ${active.name}.`);
      await load();
    } catch (err) {
      setMsg(err.message || "Payment failed");
    } finally {
      setBusy(false);
    }
  };


  const enableAutopay = async () => {
    haptic();
    setBusy(true);
    setMsg("");
    try {
      const updated = await setupAutopay(user, { stepAmount, cadence });
      updateUser(updated);
      setAutopay(updated.autopay);
      setSuccess(cadence === "manual"
        ? "Manual savings selected — pay the accrued balance whenever you are ready."
        : `Automatic savings active — settled ${cadence}.`);
    } catch (err) {
      setMsg(err.message || "Autopay setup failed");
    } finally {
      setBusy(false);
    }
  };

  const cancelAutopay = async () => {
    if (!window.confirm("Stop this savings ladder? Any unsettled amount will remain due.")) return;
    haptic();
    setBusy(true);
    setMsg("");
    try {
      const { data: updated } = await api.post("/autopay/cancel");
      const { data: state } = await api.get("/autopay");
      updateUser(updated);
      setAutopay(state);
      setCadence("manual");
      setSuccess("Savings ladder stopped. Your accrued balance remains available to settle.");
    } catch (err) {
      setMsg(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    } finally {
      setBusy(false);
    }
  };

  const payAccruedBalance = async () => {
    haptic();
    setBusy(true);
    setMsg("");
    try {
      const link = await createAutopayPaymentLink();
      window.location.assign(link.url);
    } catch (err) {
      setMsg(err.message || "Unable to create the payment link");
      setBusy(false);
    }
  };

  const handleCustomStepChange = (val) => {
    const parsed = parseInt(val, 10);
    setCustomStepVal(val);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 100) {
      setStepAmount(parsed);
    }
  };

  const selectPredefinedStep = (amt) => {
    haptic();
    setCustomStepOpen(false);
    setStepAmount(amt);
  };

  const previewStep = stepAmount;
  const previewCadence = cadence;
  const savingsActive = user?.autopay_status === "active";
  const LADDER_STEPS = [1, 5, 10];
  const CADENCES = ["daily", "weekly", "monthly", "manual"];
  const cadenceLabel = (c) => {
    if (c === "daily") return "Daily";
    if (c === "weekly") return "Weekly";
    if (c === "monthly") return "Monthly";
    return "Manual";
  };
  const inr = (val) => val.toLocaleString("en-IN");

  useEffect(() => {
    if (autopay) {
      if (autopay.step_amount) {
        setStepAmount(autopay.step_amount);
        if (![1, 5, 10].includes(autopay.step_amount)) {
          setCustomStepOpen(true);
          setCustomStepVal(String(autopay.step_amount));
        }
      }
      if (autopay.cadence) {
        setCadence(autopay.cadence);
      }
    }
  }, [autopay]);

  const completeReservation = async (r) => {
    haptic();
    setBusy(true);
    setMsg("");
    try {
      await payWithRazorpay({ pickup_date: resDate[r.id] || tomorrowStr() }, user, `/reservations/${r.id}/complete-order`);
      setSuccess(`${r.product_name} confirmed — arriving with the 6 AM tide.`);
      await load();
    } catch (err) {
      setMsg(err.message || "Payment failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-alabaster-paper paper-texture pb-28 md:pb-16" data-testid="dashboard-page">
      <AnimatePresence>
        {celebrate && <Celebration kudamName={celebrate} onClose={() => setCelebrate(null)} />}
        {success && <SuccessGlow text={success} onDone={() => setSuccess("")} />}
      </AnimatePresence>

      <div className="max-w-[1600px] mx-auto px-4 md:px-8 lg:px-16 pt-8 lg:pt-12">
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <p className="text-gold-dim text-[10px] uppercase" style={{ letterSpacing: "0.4em" }}>Good day</p>
            <h1 className="font-serif text-obsidian text-3xl md:text-4xl font-medium" data-testid="dashboard-username">{user?.name || "…"}</h1>
          </div>
          {reward?.discount_percent > 0 && (
            <div className="bg-gold text-white text-[10px] uppercase px-4 py-2" style={{ letterSpacing: "0.2em" }} data-testid="reward-badge">
              20% feast discount active
            </div>
          )}
        </div>

        {kudams === null ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 animate-pulse">
            <div className="h-10 w-10 rounded-full border-t-2 border-gold border-r-2 border-transparent animate-spin"></div>
            <p className="text-center text-obsidian/50 font-serif italic" style={{ letterSpacing: "0.05em" }}>Preparing the vessel…</p>
          </div>
        ) : kudams.length === 0 && !showCreate ? (
          <div className="flex flex-col items-center mt-14 text-center">
            <SavingsMandala progress={0} size={220} />
            <h2 className="font-serif text-obsidian text-2xl mt-8">Your vessel awaits</h2>
            <p className="text-obsidian/70 text-sm leading-6 mt-3 max-w-xs">
              Name your first Kudam, set its goal, and start the daily rhythm of ₹{plan}.
            </p>
            <button className="btn-obsidian w-full max-w-xs mt-8" onClick={() => setShowCreate(true)} data-testid="create-first-kudam-btn">
              Consecrate a Kudam
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mt-8">
            {/* Path A: Daily Kudam */}
            <section className="lg:col-span-2 card-white p-6 md:p-10" data-testid="daily-kudam-card">
              <p className="text-gold-dim text-[10px] uppercase mb-1" style={{ letterSpacing: "0.4em" }}>Path A · Daily Kudam</p>
              {active && (
                <div className="flex flex-col md:flex-row items-center gap-8 mt-4">
                  <SavingsMandala progress={progress} size={250} />
                  <div className="flex-1 w-full">
                    <h2 className="font-serif text-obsidian text-3xl font-medium" data-testid="active-kudam-name">{active.name}</h2>
                    <p className="num text-obsidian/85 text-base mt-1" data-testid="active-kudam-amounts">
                      <span className="rupee">₹</span>{active.saved_amount.toLocaleString("en-IN")}
                      <span className="text-obsidian/55"> of </span><span className="rupee">₹</span><span className="text-obsidian/70">{active.goal_amount.toLocaleString("en-IN")}</span>
                    </p>
                    <div className="h-1 bg-gold/15 mt-3">
                      <div className="h-full bg-gold transition-all duration-700" style={{ width: `${progress * 100}%` }} />
                    </div>
                    <p className="text-obsidian/80 text-sm mt-5">
                      Save ₹{plan} today to keep your rhythm — a full kudam unlocks 20% off your feast.
                    </p>
                    <button className="btn-obsidian w-full md:w-auto mt-4 hidden md:inline-block" onClick={() => deposit(plan)} disabled={busy} data-testid="pay-daily-btn">
                      {busy ? "Opening the till…" : `Pay ₹${plan} today`}
                    </button>

                    <div className="flex flex-wrap gap-2 mt-5">
                      {QUICK.map((q) => (
                        <button
                          key={q}
                          onClick={() => setAmount(q)}
                          data-testid={`quick-amount-${q}`}
                          className={`px-4 py-2 text-xs border transition-colors duration-300 ${
                            Number(amount) === q ? "border-obsidian bg-obsidian text-gold-shimmer" : "border-gold/40 text-obsidian/70"
                          }`}
                        >
                          ₹{q}
                        </button>
                      ))}
                      <input
                        className="input-ritual !w-28 !py-2"
                        type="number"
                        min="1"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        data-testid="deposit-amount-input"
                      />
                      <button className="btn-gold-outline !py-2 !min-h-0" onClick={() => deposit(amount)} disabled={busy} data-testid="deposit-btn">
                        Add ₹{Number(amount || 0).toLocaleString("en-IN")}
                      </button>
                    </div>
                    {msg && <p className="text-obsidian text-xs italic font-serif mt-3" data-testid="deposit-msg">{msg}</p>}
                  </div>
                </div>
              )}
            </section>

            {/* Right column: vessels + rewards */}
            <aside className="space-y-6">
              <div className="card-white p-6" data-testid="autopay-card">
                <p className="text-gold-dim text-[10px] uppercase" style={{ letterSpacing: "0.35em" }}>Kudam savings ladder</p>
                <p className="text-obsidian/70 text-xs leading-5 mt-2 font-serif italic">
                  Your saving grows every day. Cadence changes when the balance is settled, never how it grows.
                </p>

                {!savingsActive && (
                  <>
                    <fieldset className="mt-4">
                      <legend className="text-obsidian/55 text-[9px] uppercase" style={{ letterSpacing: "0.2em" }}>Daily step</legend>
                      <div className="grid grid-cols-4 gap-2 mt-2">
                        {LADDER_STEPS.map((step) => (
                          <button
                            type="button"
                            key={step}
                            onClick={() => selectPredefinedStep(step)}
                            aria-pressed={stepAmount === step && !customStepOpen}
                            className={`py-2 text-xs border transition-colors ${stepAmount === step && !customStepOpen
                              ? "border-obsidian bg-obsidian text-gold-shimmer font-mono"
                              : "border-gold/35 text-obsidian/70"}`}
                            data-testid={`autopay-step-${step}`}
                          >
                            +₹{step}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => { haptic(); setCustomStepOpen(true); }}
                          aria-pressed={customStepOpen}
                          className={`py-2 text-xs border transition-colors ${customStepOpen
                            ? "border-obsidian bg-obsidian text-gold-shimmer font-mono"
                            : "border-gold/35 text-obsidian/70"}`}
                          data-testid="autopay-step-custom"
                        >
                          Custom
                        </button>
                      </div>
                      {customStepOpen && (
                        <div className="mt-2">
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
                    <fieldset className="mt-4">
                      <legend className="text-obsidian/55 text-[9px] uppercase" style={{ letterSpacing: "0.2em" }}>Settle</legend>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {CADENCES.map((item) => (
                          <button
                            type="button"
                            key={item}
                            onClick={() => { haptic(); setCadence(item); }}
                            aria-pressed={cadence === item}
                            className={`py-2 text-xs border transition-colors ${cadence === item
                              ? "border-gold bg-alabaster text-obsidian font-serif italic"
                              : "border-gold/25 text-obsidian/60"}`}
                            data-testid={`autopay-cadence-${item}`}
                          >
                            {cadenceLabel(item)}
                          </button>
                        ))}
                      </div>
                    </fieldset>
                  </>
                )}

                <div className="grid grid-cols-2 gap-px bg-gold/20 border border-gold/20 mt-4" data-testid="ladder-preview">
                  {[["Day 1", previewStep], ["Day 2", previewStep * 2], ["Day 30", previewStep * 30], ["30-day total", previewStep * 465]].map(([label, value]) => (
                    <div className="bg-white p-3" key={label}>
                      <p className="text-obsidian/50 text-[9px] uppercase" style={{ letterSpacing: "0.12em" }}>{label}</p>
                      <p className="num text-obsidian text-base mt-1">₹{inr(value)}</p>
                    </div>
                  ))}
                </div>

                {savingsActive && autopay ? (
                  <div className="mt-4">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-70" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-gold" />
                      </span>
                      <p className="text-obsidian text-sm" data-testid="autopay-active-label">
                        Active · {cadenceLabel(previewCadence)}
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                      <div className="bg-alabaster/60 p-2" data-testid="autopay-cycle-day">
                        <p className="text-obsidian/50 text-[8px] uppercase">Cycle day</p>
                        <p className="num text-obsidian text-sm">{autopay.cycle_day || "—"}</p>
                      </div>
                      <div className="bg-alabaster/60 p-2" data-testid="autopay-next-amount">
                        <p className="text-obsidian/50 text-[8px] uppercase">Next amount</p>
                        <p className="num text-obsidian text-sm">₹{inr(autopay.next_amount || 0)}</p>
                      </div>
                      <div className="bg-alabaster/60 p-2" data-testid="autopay-unsettled-amount">
                        <p className="text-obsidian/50 text-[8px] uppercase">Unsettled</p>
                        <p className="num text-obsidian text-sm">₹{inr(autopay.unsettled_amount || 0)}</p>
                      </div>
                    </div>
                    {(autopay.unsettled_amount || 0) > 0 && (
                      <button className="btn-obsidian w-full mt-3 !py-2.5" onClick={payAccruedBalance} disabled={busy} data-testid="manual-payment-btn">
                        Pay accrued ₹{inr(autopay.unsettled_amount)}
                      </button>
                    )}
                    <button className="w-full mt-3 text-obsidian/55 text-[9px] uppercase underline underline-offset-4" onClick={cancelAutopay} disabled={busy} data-testid="cancel-autopay-btn">
                      Stop this savings ladder
                    </button>
                  </div>
                ) : (
                  <button className="btn-gold-outline w-full mt-4 !py-2.5" onClick={enableAutopay} disabled={busy} data-testid="enable-autopay-btn">
                    {busy ? "Preparing…" : cadence === "manual" ? "Start manual savings" : "Continue to subscription"}
                  </button>
                )}
                {msg && <p className="text-obsidian text-xs italic font-serif mt-3" data-testid="autopay-msg">{msg}</p>}
              </div>
              <div className="card-white p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-gold-dim text-[10px] uppercase" style={{ letterSpacing: "0.35em" }}>Your vessels</p>
                  {!hasActiveKudam && (
                    <button onClick={() => setShowCreate((s) => !s)} className="text-obsidian flex items-center gap-1 text-[10px] uppercase" style={{ letterSpacing: "0.2em" }} data-testid="new-kudam-btn">
                      <Plus size={14} /> New
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  {kudams.map((k) => (
                    <div
                      key={k.id}
                      onClick={() => setActiveId(k.id)}
                      data-testid={`kudam-card-${k.id}`}
                      className={`w-full text-left p-4 border transition-all duration-300 cursor-pointer ${
                        k.id === activeId ? "border-gold bg-alabaster/60" : "border-gold/25 bg-white"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="min-w-0">
                          <p className="font-serif text-obsidian text-lg font-medium truncate">{k.name}</p>
                          <p className="num text-obsidian/75 text-[12px]"><span className="rupee">₹</span>{k.saved_amount.toLocaleString("en-IN")} / <span className="rupee">₹</span>{k.goal_amount.toLocaleString("en-IN")}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="num-lg text-gold-dim text-xl">{Math.round(Math.min(k.saved_amount / k.goal_amount, 1) * 100)}%</span>
                          {k.saved_amount === 0 && k.status === "active" && (
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteKudam(k); }}
                              disabled={busy}
                              title="Delete kudam"
                              data-testid={`delete-kudam-${k.id}`}
                              className="text-obsidian/35 hover:text-red-800 transition-colors p-1"
                            >
                              <Trash2 size={14} strokeWidth={1.5} />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="h-1 bg-gold/15 mt-2">
                        <div className="h-full bg-gold" style={{ width: `${Math.min(k.saved_amount / k.goal_amount, 1) * 100}%` }} />
                      </div>
                      {k.status !== "active" && (
                        <p className="text-gold-dim text-[9px] uppercase mt-2" style={{ letterSpacing: "0.25em" }}>{k.status}</p>
                      )}
                    </div>
                  ))}
                </div>
                <AnimatePresence>
                  {showCreate && (
                    <motion.form
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      onSubmit={createKudam}
                      className="overflow-hidden"
                    >
                      <div className="space-y-3 pt-4">
                        <input className="input-ritual" placeholder="Name it — e.g. Pongal Feast" value={newName} onChange={(e) => setNewName(e.target.value)} required data-testid="kudam-name-input" />
                        <input className="input-ritual" type="number" min="1" placeholder="Goal (₹)" value={newGoal} onChange={(e) => setNewGoal(e.target.value)} required data-testid="kudam-goal-input" />
                        <button className="btn-gold-outline w-full" disabled={busy} data-testid="kudam-create-submit">Consecrate</button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>

              {bookings.length > 0 ? (
                <div className="card-white p-6">
                  <p className="text-gold-dim text-[10px] uppercase mb-4" style={{ letterSpacing: "0.35em" }}>Your orders</p>
                  <div className="space-y-3">
                    {bookings.slice(0, 4).map((b) => (
                      <div key={b.id} className="flex justify-between items-center border-b border-gold/15 pb-2" data-testid={`booking-row-${b.id}`}>
                        <div>
                          <p className="font-serif text-obsidian text-base">{b.product_name}</p>
                          <p className="num text-obsidian/70 text-[12px]">{b.qty_kg} kg · {b.pickup_date} · {b.delivery_window || "6:00 AM"}</p>
                        </div>
                        <div className="text-right">
                          <p className="num text-obsidian text-sm"><span className="rupee">₹</span>{b.amount.toLocaleString("en-IN")}</p>
                          <p className="text-gold-dim text-[9px] uppercase" style={{ letterSpacing: "0.2em" }}>{b.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="card-white p-6 text-center" data-testid="empty-orders-cta">
                  <p className="font-serif text-obsidian text-lg">No orders yet?</p>
                  <p className="text-obsidian/70 text-xs mt-1">The dawn boats are already out.</p>
                  <button className="btn-gold-outline w-full mt-4" onClick={() => navigate("/market")} data-testid="empty-orders-btn">
                    View Today's Catch
                  </button>
                </div>
              )}
            </aside>

            {/* Path B: Fresh Catch highlights */}
            <section className="lg:col-span-3 mt-2" data-testid="fresh-catch-highlights">
              <div className="flex items-end justify-between mb-5">
                <div>
                  <p className="text-gold-dim text-[10px] uppercase" style={{ letterSpacing: "0.4em" }}>Path B · Fresh Catch</p>
                  <h2 className="font-serif text-obsidian text-2xl md:text-3xl font-medium">Today's Catch — pre-book for 6 AM delivery</h2>
                </div>
                <button className="text-obsidian text-[11px] uppercase underline underline-offset-4 decoration-gold whitespace-nowrap" style={{ letterSpacing: "0.2em" }} onClick={() => navigate("/market")} data-testid="see-all-catch-btn">
                  See all
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {products.map((p) => (
                  <button key={p.id} className="card-white p-5 flex items-center gap-4 text-left" onClick={() => navigate("/market")} data-testid={`highlight-${p.name.toLowerCase()}`}>
                    <div className="oval-cameo w-16 h-20 flex-shrink-0">
                      <img src={imgUrl(p.image)} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                    <div>
                      <p className="tamil text-gold-dim text-xs">{p.tamil_name}</p>
                      <p className="font-serif text-obsidian text-xl font-medium">{p.name}</p>
                      <p className="num text-obsidian/80 text-sm"><span className="rupee">₹</span>{p.price_per_kg}/kg</p>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}

        {reservations.length > 0 && (
          <section className="mt-10" data-testid="reservations-section">
            <p className="text-gold-dim text-[10px] uppercase" style={{ letterSpacing: "0.4em" }}>Reserved catches · off-season slots</p>
            <h2 className="font-serif text-obsidian text-2xl md:text-3xl font-medium">Your place in the queue</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-5">
              {reservations.map((r) => (
                <div
                  key={r.id}
                  className={`card-white p-5 ${r.status === "arrived" ? "border border-gold shadow-[0_0_0_1px_#C5A059]" : ""}`}
                  data-testid={`reservation-card-${r.id}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="oval-cameo w-14 h-[72px] flex-shrink-0">
                      <img src={imgUrl(r.image)} alt={r.product_name} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="tamil text-gold-dim text-xs">{r.tamil_name}</p>
                      <p className="font-serif text-obsidian text-xl font-medium leading-tight">{r.product_name}</p>
                      <p className="num text-obsidian/75 text-[12px] mt-1">{r.qty_kg} kg · ₹{r.total.toLocaleString("en-IN")} total</p>
                      <p className="text-gold-dim text-[10px] uppercase mt-1" style={{ letterSpacing: "0.15em" }}>₹{r.advance_paid.toLocaleString("en-IN")} advance paid</p>
                    </div>
                  </div>
                  {r.status === "reserved" && (
                    <p className="text-obsidian/70 text-xs italic font-serif mt-4" data-testid={`reservation-waiting-${r.id}`}>
                      Awaiting the boats — you'll be told first when it lands.
                    </p>
                  )}
                  {r.status === "arrived" && (
                    <div className="mt-4" data-testid={`reservation-arrived-${r.id}`}>
                      <p className="text-gold-dim text-xs font-semibold uppercase" style={{ letterSpacing: "0.15em" }}>
                        It has landed — claim your catch
                      </p>
                      <input
                        className="input-ritual mt-3"
                        type="date"
                        min={tomorrowStr()}
                        value={resDate[r.id] || tomorrowStr()}
                        onChange={(e) => setResDate((d) => ({ ...d, [r.id]: e.target.value }))}
                        data-testid={`reservation-date-input-${r.id}`}
                      />
                      <button
                        className="btn-obsidian w-full mt-3"
                        onClick={() => completeReservation(r)}
                        disabled={busy}
                        data-testid={`complete-reservation-btn-${r.id}`}
                      >
                        Complete · Pay ₹{r.balance_due.toLocaleString("en-IN")}
                      </button>
                    </div>
                  )}
                  {r.status === "completed" && (
                    <p className="text-obsidian/60 text-xs italic font-serif mt-4">Completed — it sits among your orders.</p>
                  )}
                </div>
              ))}
            </div>
            {msg && <p className="text-obsidian text-xs italic font-serif mt-3" data-testid="reservation-msg">{msg}</p>}
          </section>
        )}

        <AnimatePresence>
          {showCreate && kudams && kudams.length === 0 && (
            <motion.form
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              onSubmit={createKudam}
              className="card-white p-6 max-w-sm mx-auto mt-8 space-y-4"
            >
              <p className="text-gold-dim text-[10px] uppercase" style={{ letterSpacing: "0.35em" }}>New Kudam</p>
              <input className="input-ritual" placeholder="Name it — e.g. Pongal Feast" value={newName} onChange={(e) => setNewName(e.target.value)} required data-testid="kudam-name-input" />
              <input className="input-ritual" type="number" min="1" placeholder="Goal (₹)" value={newGoal} onChange={(e) => setNewGoal(e.target.value)} required data-testid="kudam-goal-input" />
              {msg && <p className="text-obsidian text-xs italic font-serif">{msg}</p>}
              <button className="btn-obsidian w-full" disabled={busy} data-testid="kudam-create-submit">Consecrate</button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile sticky FAB */}
      {active && (
        <div className="md:hidden fixed bottom-16 inset-x-4 z-30">
          <button className="btn-obsidian w-full shadow-xl" onClick={() => deposit(plan)} disabled={busy} data-testid="sticky-pay-daily-btn">
            Pay ₹{plan} today
          </button>
        </div>
      )}
    </div>
  );
}
