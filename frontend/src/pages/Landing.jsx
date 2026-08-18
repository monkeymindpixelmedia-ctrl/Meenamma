import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, animate, useInView } from "framer-motion";
import { SavingsMandala } from "../components/SavingsMandala";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { Sparkles, ShieldCheck, Zap, ArrowRight, Coins, Compass } from "lucide-react";

{/*
THESIS: Cyberpunk Tamil Neo-Traditional micro-savings experience. Replaces generic fintech cards with an interactive Cyberpunk Kudam Mandala, live harbour telemetry, and neon-gold filigree glass canvas.
OWN-WORLD: Palette of deep obsidian (#070605), translucent amber glass, glowing neon gold (#FFD700), and custom Tamil typography watermarks.
STORY: Visitors experience ancient Tamil Kudam savings ceremonies reimagined for the digital age, calculate daily step returns interactively, and unlock harvest rewards.
FIRST VIEWPORT: Cinematic full-bleed obsidian dark canvas with ambient Tamil calligraphy watermark, glowing hero title, live telemetry pill, and interactive Live Savings Simulator.
FORM: Cyberpunk South-Asian Neo-Traditional surface.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.
*/}

const IMG = "https://static.prod-images.emergentagent.com/jobs/950ac656-d06c-4ab1-9af2-57dae3ef9785/images";
const HERO = `${IMG}/fe8342a2b725ef62b5f2e9a8c3638fb2731e039a6481f64a9c67b6f73e830578.jpeg`;
const CATCH_ICE = `${IMG}/ae4c4282d8794d9f15846339bae42cde0f556c2d2d530686933efd850b6f58da.jpeg`;
const CLAY_KUDAM = `${IMG}/f6829c8557f0cc646b967426a647783117dacf37a36ce0192c0223facf950a9b.jpeg`;
const FEAST = `${IMG}/880d5ee129a9829ef575043fe6d11de04df38d6a5f2a89093d9adbbb94d00b02.jpeg`;

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { type: "spring", stiffness: 120, damping: 22, mass: 1 },
};

function CountUp({ value, prefix = "", suffix = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  useEffect(() => {
    if (!inView || ref.current == null) return;
    const controls = animate(0, value, {
      duration: 1.4,
      ease: [0.16, 1, 0.3, 1], // Emil Kowalski signature ease
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = `${prefix}${Math.round(v).toLocaleString("en-IN")}${suffix}`;
      },
    });
    return () => controls.stop();
  }, [inView, value, prefix, suffix]);
  return <span ref={ref}>{prefix}0{suffix}</span>;
}

function LiveDashboard({ stats }) {
  const cells = stats
    ? [
        { label: "Catches live tonight", value: stats.catches_live, testid: "stat-catches" },
        { label: "Harbours represented", value: stats.harbours, testid: "stat-harbours" },
        { label: "Kg pre-booked", value: Math.round(stats.kg_reserved), testid: "stat-kg" },
        { label: "Households at table", value: stats.households, testid: "stat-households" },
        { label: "Resting in kudams", value: stats.saved_rupees, prefix: "₹", testid: "stat-saved" },
        { label: "Kudams filled", value: stats.kudams_filled, testid: "stat-filled" },
      ]
    : [];

  return (
    <motion.section {...fadeUp} className="max-w-[1600px] mx-auto px-4 md:px-8 lg:px-16 -mt-16 lg:-mt-24 relative z-20" data-testid="live-catch-dashboard">
      <div className="bg-[#120E0A]/85 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] border border-[#FFD700]/30 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 lg:px-10 pt-6 pb-2 border-b border-[#FFD700]/15">
          <div className="flex items-center gap-3">
            <motion.span
              className="w-2.5 h-2.5 rounded-full bg-[#FFD700] shadow-[0_0_12px_#FFD700]"
              animate={{ opacity: [1, 0.3, 1], scale: [1, 1.3, 1] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            />
            <p className="text-[#FFD700]/90 text-[10px] uppercase font-mono tracking-[0.4em]">
              NEO-HARBOUR TELEMETRY · REALTIME TELEGRAM FROM KASIMEDU DOCK
            </p>
          </div>
          <span className="hidden sm:block text-[#FFD700]/50 text-[10px] font-mono">STATUS: SYNCED</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 divide-x divide-y lg:divide-y-0 divide-[#FFD700]/15">
          {stats === null
            ? [...Array(6)].map((_, i) => (
                <div key={i} className="px-6 py-7">
                  <div className="h-8 w-16 bg-[#FFD700]/10 animate-pulse rounded" />
                  <div className="h-2 w-24 bg-[#FFD700]/10 animate-pulse mt-3 rounded" />
                </div>
              ))
            : cells.map((c) => (
                <motion.div
                  key={c.label}
                  whileHover={{ backgroundColor: "rgba(255, 215, 0, 0.04)" }}
                  transition={{ duration: 0.15 }}
                  className="px-5 lg:px-6 py-7 transition-colors cursor-default"
                  data-testid={c.testid}
                >
                  <p className="num-lg text-[#F5F2EB] text-2xl lg:text-3xl font-bold tracking-tight">
                    <CountUp value={c.value} prefix={c.prefix || ""} />
                  </p>
                  <p className="text-[#FFD700]/70 text-[9px] uppercase mt-2 leading-4 font-mono tracking-[0.2em]">
                    {c.label}
                  </p>
                </motion.div>
              ))}
        </div>
      </div>
    </motion.section>
  );
}

function InteractiveSimulator() {
  const [dailyStep, setDailyStep] = useState(10);
  const annualSavings = dailyStep * 365;
  const goldEquivGrams = (annualSavings / 7200).toFixed(2);
  const fillPercentage = Math.min(dailyStep / 50, 1);

  return (
    <section className="max-w-[1600px] mx-auto px-4 md:px-8 lg:px-16 py-20 lg:py-28 relative">
      <div className="bg-[#0E0C09]/90 border border-[#FFD700]/30 rounded-2xl p-8 lg:p-14 backdrop-blur-2xl relative overflow-hidden shadow-[0_0_50px_rgba(255,215,0,0.08)]">
        <div className="absolute -right-32 -bottom-32 w-96 h-96 bg-[#FFD700]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-full text-[#FFD700] text-xs uppercase font-mono tracking-widest">
              <Sparkles size={14} /> Interactive Savings Engine
            </div>
            <h2 className="font-serif text-[#F5F2EB] text-3xl md:text-5xl font-medium leading-tight">
              Watch your small steps build <span className="text-[#FFD700] italic">enduring gold</span>.
            </h2>
            <p className="text-[#A8A090] text-base leading-relaxed">
              Select your daily step amount. Meenamma automatically sweeps your chosen step daily, building your personal Kudam without friction.
            </p>

            <div className="space-y-4 pt-4">
              <label className="text-[#FFD700] text-xs uppercase font-mono tracking-[0.25em] block">
                Choose Daily Step Amount: <span className="text-[#F5F2EB] font-bold text-lg">₹{dailyStep}/day</span>
              </label>
              <div className="flex flex-wrap gap-3">
                {[1, 5, 10, 25, 50, 100].map((amt) => (
                  <motion.button
                    key={amt}
                    type="button"
                    whileTap={{ scale: 0.94 }}
                    whileHover={{ scale: 1.04 }}
                    onClick={() => setDailyStep(amt)}
                    className={`px-5 py-2.5 text-xs font-mono rounded border transition-colors duration-200 ${
                      dailyStep === amt
                        ? "bg-[#FFD700] text-[#070605] border-[#FFD700] font-bold shadow-[0_0_15px_rgba(255,215,0,0.5)]"
                        : "bg-[#16120E] text-[#F5F2EB]/80 border-[#FFD700]/30 hover:border-[#FFD700]"
                    }`}
                  >
                    +₹{amt}
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-[#FFD700]/20">
              <div>
                <p className="text-[#FFD700]/70 text-[10px] uppercase font-mono tracking-widest">Annual Accrual</p>
                <p className="text-[#F5F2EB] text-2xl lg:text-3xl font-bold font-mono mt-1">₹{annualSavings.toLocaleString("en-IN")}</p>
              </div>
              <div>
                <p className="text-[#FFD700]/70 text-[10px] uppercase font-mono tracking-widest">Gold Weight Approx</p>
                <p className="text-[#FFD700] text-2xl lg:text-3xl font-bold font-mono mt-1">~{goldEquivGrams} g</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 flex flex-col items-center justify-center relative">
            <div className="relative p-6 bg-[#070605]/80 border border-[#FFD700]/25 rounded-2xl backdrop-blur-xl shadow-2xl flex flex-col items-center">
              <SavingsMandala progress={fillPercentage} size={280} dark={true} />
              <div className="text-center mt-6">
                <p className="tamil text-[#FFD700] text-lg font-medium">மீனம்மை டிஜிட்டல் குடம்</p>
                <p className="text-[#A8A090] text-xs font-mono uppercase tracking-widest mt-1">
                  Daily sweep ₹{dailyStep} · Automated mandate
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const CHAPTERS = [
  {
    time: "3:50 AM",
    title: "The boats leave Kasimedu",
    body: "Before the city stirs, forty wooden hulls slip past the breakwater. The Karuppan family has done this for three generations — reading the tide the way others read the newspaper.",
    image: HERO,
    testid: "chapter-boats",
  },
  {
    time: "6:10 AM",
    title: "Sorted, iced, named",
    body: "Every fish is gill-checked by hand at the auction slab and iced within twenty minutes. What you see in the app is exactly what lies on the ice — nothing more, nothing invented.",
    image: CATCH_ICE,
    testid: "chapter-sorted",
  },
  {
    time: "All day",
    title: "Your kudam fills, one rupee at a time",
    body: "₹1, ₹5 or ₹10 a day — dropped into your digital clay pot the way grandmothers saved coins for Pongal. A full kudam unlocks 20% off your feast order.",
    image: CLAY_KUDAM,
    portrait: true,
    testid: "chapter-kudam",
  },
  {
    time: "Next dawn, 6 AM",
    title: "It reaches your table",
    body: "Pre-book tonight and the catch arrives with the milk — cleaned to your comfort, wrapped in banana leaf, ready for the kuzhambu pot before the school bell.",
    image: FEAST,
    testid: "chapter-table",
  },
];

function Journey() {
  return (
    <section className="max-w-[1600px] mx-auto px-4 md:px-8 lg:px-16 py-24 lg:py-32" data-testid="narrative-journey">
      <motion.div {...fadeUp} className="flex items-center gap-3">
        <Compass className="text-[#FFD700]" size={16} />
        <p className="text-[#FFD700] text-[10px] uppercase font-mono tracking-[0.45em]">
          THE JOURNEY · SEA TO TABLE IN ONE TIDE
        </p>
      </motion.div>
      <motion.h2 {...fadeUp} className="font-serif text-[#F5F2EB] text-3xl md:text-5xl lg:text-6xl font-medium mt-4 max-w-3xl leading-[1.1]">
        Follow one fish, from the dark water to your dawn table.
      </motion.h2>
      <div className="mt-16 lg:mt-24 space-y-24 lg:space-y-32">
        {CHAPTERS.map((c, i) => (
          <motion.div
            key={c.time}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ type: "spring", stiffness: 70, damping: 22 }}
            className={`grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center ${i % 2 ? "lg:direction-rtl" : ""}`}
            data-testid={c.testid}
          >
            <div className={`lg:col-span-7 ${i % 2 ? "lg:order-2" : ""}`}>
              <div className={`overflow-hidden border border-[#FFD700]/30 rounded-lg shadow-2xl relative group ${c.portrait ? "max-h-[600px]" : ""}`}>
                <motion.img
                  src={c.image}
                  alt={c.title}
                  className={`w-full h-full object-cover filter brightness-[0.9] contrast-[1.1] transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105 ${c.portrait ? "object-bottom" : ""}`}
                  loading="lazy"
                  initial={{ scale: 1.1, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#070605] via-transparent to-transparent opacity-60 pointer-events-none" />
              </div>
            </div>
            <div className={`lg:col-span-5 ${i % 2 ? "lg:order-1" : ""}`}>
              <div className="flex items-center gap-4">
                <span className="num-lg text-[#FFD700] text-xl font-bold font-mono">{c.time}</span>
                <span className="flex-1 h-[0.5px] bg-[#FFD700]/30" />
              </div>
              <h3 className="font-serif text-[#F5F2EB] text-3xl lg:text-5xl font-medium mt-6">{c.title}</h3>
              <p className="text-[#A8A090] text-base leading-relaxed mt-6 max-w-md">{c.body}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get("/stats/live").then(({ data }) => setStats(data)).catch(() => setStats(null));
  }, []);

  return (
    <div className="min-h-screen bg-[#070605] text-[#F5F2EB] pb-24 md:pb-0 relative overflow-hidden" data-testid="landing-page">
      {/* Background Watermark Calligraphy */}
      <div className="absolute top-20 right-[-5%] opacity-[0.03] select-none pointer-events-none font-serif text-[28vw] text-[#FFD700] leading-none z-0">
        மீ
      </div>

      {/* Hero Section */}
      <section className="relative w-full min-h-[100dvh] overflow-hidden flex items-end pb-24 lg:pb-32 z-10" data-testid="landing-hero">
        <div className="absolute inset-0">
          <img src={HERO} alt="Kasimedu boats at dawn" className="w-full h-full object-cover filter brightness-[0.5] contrast-[1.2]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070605] via-[#070605]/60 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(7,6,5,0.85)_100%)]" />
        </div>

        <div className="relative max-w-[1600px] w-full mx-auto px-4 md:px-8 lg:px-16 z-10">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="inline-flex items-center gap-2 px-3.5 py-1 bg-[#FFD700]/15 border border-[#FFD700]/40 rounded-full text-[#FFD700] text-xs font-mono tracking-[0.25em] uppercase mb-4"
            data-testid="app-name-label"
          >
            <Coins size={14} /> Meenamma.org · South Asian Neo-Traditional Savings
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-[#FFD700]/80 text-[10px] md:text-xs font-mono uppercase mb-6 tracking-[0.45em]"
          >
            Kasimedu · Since the first tide
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="font-serif text-[#F5F2EB] text-5xl sm:text-6xl lg:text-8xl leading-[1.05] font-light max-w-4xl tracking-tight [text-wrap:balance]"
            data-testid="hero-heading"
          >
            Save a little daily.
            <br />
            <span className="text-[#FFD700] italic font-normal drop-shadow-[0_0_25px_rgba(255,215,0,0.4)]">Feast</span> on the freshest catch.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-[#A8A090] text-lg md:text-xl leading-relaxed mt-8 max-w-2xl font-light"
          >
            A Daily Kudam that turns ₹5 a day into feast-day discounts, and a Fresh Catch
            market to pre-book seafood straight off the dawn boats of Tamil Nadu.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.55 }}
            className="mt-12 flex flex-col sm:flex-row gap-4"
          >
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.96 }}
              className="bg-[#FFD700] text-[#070605] font-semibold font-mono text-xs uppercase px-8 py-4 rounded border border-[#FFD700] hover:bg-[#E6B800] transition-colors duration-200 shadow-[0_0_25px_rgba(255,215,0,0.4)] flex items-center justify-center gap-2 sm:min-w-[240px]"
              onClick={() => navigate(user ? "/dashboard" : "/register")}
              data-testid="begin-kudam-btn"
            >
              Begin Your Kudam <ArrowRight size={16} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.96 }}
              className="bg-[#120E0A]/80 text-[#F5F2EB] font-semibold font-mono text-xs uppercase px-8 py-4 rounded border border-[#FFD700]/40 hover:bg-[#FFD700]/10 transition-colors duration-200 flex items-center justify-center gap-2 sm:min-w-[240px]"
              onClick={() => navigate("/market")}
              data-testid="view-catch-btn"
            >
              View Today's Catch
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Telemetry Dashboard */}
      <LiveDashboard stats={stats} />

      {/* Interactive Savings Engine */}
      <InteractiveSimulator />

      {/* Narrative Scroll Journey */}
      <Journey />

      {/* Two Paths Section */}
      <section className="max-w-[1600px] mx-auto px-4 md:px-8 lg:px-16 pb-20 lg:pb-32 relative z-10">
        <motion.h2 {...fadeUp} className="font-serif text-[#F5F2EB] text-4xl md:text-5xl lg:text-6xl font-medium mb-16 text-center max-w-2xl mx-auto leading-[1.1]">
          Two paths, one table.
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          <motion.div
            {...fadeUp}
            whileHover={{ y: -6 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="bg-[#0E0C09]/90 border border-[#FFD700]/30 rounded-xl p-10 lg:p-14 flex flex-col items-start group hover:border-[#FFD700]/60 transition-colors shadow-2xl backdrop-blur-xl"
          >
            <p className="text-[#FFD700] text-[10px] uppercase font-mono mb-4 tracking-[0.4em]">PATH A · HABIT</p>
            <h3 className="font-serif text-[#F5F2EB] text-3xl lg:text-4xl font-medium">The Daily Kudam</h3>
            <p className="text-[#A8A090] text-base leading-relaxed mt-5">
              Save ₹1, ₹5 or ₹10 every day. When your kudam fills, you unlock a
              20% discount and a family hamper on your next fresh catch order.
            </p>
            <div className="mt-10 flex justify-center w-full transform group-hover:scale-105 transition-transform duration-700 ease-[0.16,1,0.3,1]">
              <SavingsMandala progress={0.66} size={220} dark={true} />
            </div>
            <motion.button
              whileTap={{ scale: 0.96 }}
              className="bg-[#FFD700] text-[#070605] font-semibold font-mono text-xs uppercase px-8 py-3.5 rounded mt-12 w-full sm:w-auto hover:bg-[#E6B800] transition-colors shadow-[0_0_20px_rgba(255,215,0,0.3)]"
              onClick={() => navigate(user ? "/dashboard" : "/register")}
              data-testid="path-savings-btn"
            >
              Start Saving
            </motion.button>
          </motion.div>

          <motion.div
            {...fadeUp}
            whileHover={{ y: -6 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="bg-[#0E0C09]/90 border border-[#FFD700]/30 rounded-xl p-10 lg:p-14 flex flex-col items-start group hover:border-[#FFD700]/60 transition-colors shadow-2xl backdrop-blur-xl"
          >
            <p className="text-[#FFD700] text-[10px] uppercase font-mono mb-4 tracking-[0.4em]">PATH B · TODAY</p>
            <h3 className="font-serif text-[#F5F2EB] text-3xl lg:text-4xl font-medium">The Fresh Catch</h3>
            <p className="text-[#A8A090] text-base leading-relaxed mt-5">
              Pre-book Vanjaram, Iral and Vaaval for 6 AM delivery — standard
              market rates, or your Kudam discount if the vessel is full.
            </p>
            <div className="mt-10 overflow-hidden border border-[#FFD700]/30 rounded-lg w-full flex-1 min-h-[220px] relative">
              <img src={CATCH_ICE} alt="Fresh catch on ice" className="w-full h-full object-cover filter brightness-90 transform group-hover:scale-105 transition-transform duration-700 ease-[0.16,1,0.3,1]" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#070605] via-transparent to-transparent opacity-50 pointer-events-none" />
            </div>
            <motion.button
              whileTap={{ scale: 0.96 }}
              className="border border-[#FFD700] text-[#FFD700] font-semibold font-mono text-xs uppercase px-8 py-3.5 rounded mt-12 w-full sm:w-auto hover:bg-[#FFD700]/10 transition-colors"
              onClick={() => navigate("/market")}
              data-testid="path-market-btn"
            >
              Browse the Catch
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Footer Tamil Quote */}
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 lg:px-16 pb-20 text-center relative z-10">
        <div className="h-[1px] bg-gradient-to-r from-transparent via-[#FFD700]/40 to-transparent mb-8 max-w-xs mx-auto" />
        <p className="tamil text-[#FFD700] text-xl md:text-2xl font-medium tracking-wide drop-shadow-[0_0_10px_rgba(255,215,0,0.4)]">
          கடல் தரும், குடம் காக்கும்
        </p>
        <p className="text-[#A8A090]/80 text-[9px] uppercase font-mono mt-3 tracking-[0.4em]">
          The sea provides, the kudam protects
        </p>
      </div>
    </div>
  );
}
