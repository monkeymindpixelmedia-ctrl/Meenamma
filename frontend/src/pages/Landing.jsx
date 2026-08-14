import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, animate, useInView } from "framer-motion";
import { SavingsMandala } from "../components/SavingsMandala";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

const IMG = "https://static.prod-images.emergentagent.com/jobs/950ac656-d06c-4ab1-9af2-57dae3ef9785/images";
const HERO = `${IMG}/fe8342a2b725ef62b5f2e9a8c3638fb2731e039a6481f64a9c67b6f73e830578.jpeg`;
const CATCH_ICE = `${IMG}/ae4c4282d8794d9f15846339bae42cde0f556c2d2d530686933efd850b6f58da.jpeg`;
const CLAY_KUDAM = `${IMG}/f6829c8557f0cc646b967426a647783117dacf37a36ce0192c0223facf950a9b.jpeg`;
const FEAST = `${IMG}/880d5ee129a9829ef575043fe6d11de04df38d6a5f2a89093d9adbbb94d00b02.jpeg`;

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { type: "spring", stiffness: 70, damping: 20, mass: 1 },
};

function CountUp({ value, prefix = "", suffix = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  useEffect(() => {
    if (!inView || ref.current == null) return;
    const controls = animate(0, value, {
      duration: 1.6,
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
        { label: "Households at the table", value: stats.households, testid: "stat-households" },
        { label: "Resting in kudams", value: stats.saved_rupees, prefix: "₹", testid: "stat-saved" },
        { label: "Kudams filled", value: stats.kudams_filled, testid: "stat-filled" },
      ]
    : [];
  return (
    <motion.section {...fadeUp} className="max-w-[1600px] mx-auto px-4 md:px-8 lg:px-16 -mt-14 lg:-mt-20 relative z-10" data-testid="live-catch-dashboard">
      <div className="glass-paper shadow-2xl border border-obsidian/10 rounded-sm">
        <div className="flex items-center gap-3 px-6 lg:px-10 pt-6">
          <motion.span
            className="w-2 h-2 rounded-full bg-gold"
            animate={{ opacity: [1, 0.3, 1], scale: [1, 1.4, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          <p className="text-obsidian/60 text-[10px] uppercase tracking-[0.45em]">
            The Live Ledger · counted from the harbour
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 divide-x divide-y lg:divide-y-0 divide-obsidian/10 mt-4 border-t border-obsidian/10">
          {stats === null
            ? [...Array(6)].map((_, i) => (
                <div key={i} className="px-6 py-7">
                  <div className="h-8 w-16 bg-obsidian/5 animate-pulse" />
                  <div className="h-2 w-24 bg-obsidian/5 animate-pulse mt-3" />
                </div>
              ))
            : cells.map((c) => (
                <div key={c.label} className="px-5 lg:px-6 py-7" data-testid={c.testid}>
                  <p className="num-lg text-obsidian text-2xl lg:text-3xl">
                    <CountUp value={c.value} prefix={c.prefix || ""} />
                  </p>
                  <p className="text-obsidian/50 text-[9px] uppercase mt-2 leading-4 tracking-[0.25em]">
                    {c.label}
                  </p>
                </div>
              ))}
        </div>
      </div>
    </motion.section>
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
      <motion.p {...fadeUp} className="text-gold-dim text-[10px] uppercase tracking-[0.45em]">
        The Journey · sea to table in one tide
      </motion.p>
      <motion.h2 {...fadeUp} className="font-serif text-obsidian text-3xl md:text-5xl lg:text-6xl font-medium mt-4 max-w-3xl leading-[1.1]">
        Follow one fish, from the dark water to your dawn table.
      </motion.h2>
      <div className="mt-16 lg:mt-24 space-y-24 lg:space-y-32">
        {CHAPTERS.map((c, i) => (
          <motion.div
            key={c.time}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ type: "spring", stiffness: 60, damping: 20 }}
            className={`grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center ${i % 2 ? "lg:direction-rtl" : ""}`}
            data-testid={c.testid}
          >
            <div className={`lg:col-span-7 ${i % 2 ? "lg:order-2" : ""}`}>
              <div className={`overflow-hidden border-[0.5px] border-obsidian/10 ${c.portrait ? "max-h-[600px]" : ""}`}>
                <motion.img
                  src={c.image}
                  alt={c.title}
                  className={`w-full h-full object-cover filter brightness-[0.95] contrast-[1.05] ${c.portrait ? "object-bottom" : ""}`}
                  loading="lazy"
                  initial={{ scale: 1.1, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            </div>
            <div className={`lg:col-span-5 ${i % 2 ? "lg:order-1" : ""}`}>
              <div className="flex items-center gap-4">
                <span className="num-lg text-gold text-xl">{c.time}</span>
                <span className="flex-1 h-[0.5px] bg-obsidian/10" />
              </div>
              <h3 className="font-serif text-obsidian text-3xl lg:text-5xl font-medium mt-6">{c.title}</h3>
              <p className="text-obsidian/60 text-base leading-relaxed mt-6 max-w-md">{c.body}</p>
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
    <div className="min-h-screen bg-alabaster paper-texture pb-24 md:pb-0" data-testid="landing-page">
      {/* Cinematic hero */}
      <section className="relative w-full h-[85vh] lg:h-screen min-h-[600px] overflow-hidden" data-testid="landing-hero">
        <div className="absolute inset-0">
          <img src={HERO} alt="Kasimedu boats at dawn" className="w-full h-full object-cover filter brightness-[0.8] contrast-[1.1]" />
          <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/40 to-transparent" />
        </div>
        <div className="absolute inset-0 flex flex-col justify-end max-w-[1600px] mx-auto px-4 md:px-8 lg:px-16 pb-28 lg:pb-32">
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="text-alabaster/90 text-sm font-semibold uppercase tracking-[0.3em] mb-2"
            data-testid="app-name-label"
          >
            Meenamma.org
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-gold text-[10px] md:text-xs uppercase mb-6 tracking-[0.45em]"
          >
            Kasimedu · Since the first tide
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="font-serif text-alabaster text-5xl sm:text-6xl lg:text-8xl leading-[1.05] font-light max-w-4xl"
            data-testid="hero-heading"
          >
            Save a little daily.
            <br />
            <span className="text-gold italic">Feast</span> on the freshest catch.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-alabaster/70 text-lg md:text-xl leading-relaxed mt-8 max-w-2xl font-light"
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
            <button
              className="btn-gold-outline !border-gold/30 !text-gold hover:!bg-gold hover:!text-obsidian sm:min-w-[240px]"
              onClick={() => navigate(user ? "/dashboard" : "/register")}
              data-testid="begin-kudam-btn"
            >
              Begin Your Kudam
            </button>
            <button
              className="btn-obsidian !bg-transparent !border-alabaster/30 !text-alabaster hover:!bg-alabaster hover:!text-obsidian sm:min-w-[240px]"
              onClick={() => navigate("/market")}
              data-testid="view-catch-btn"
            >
              View Today's Catch
            </button>
          </motion.div>
        </div>
      </section>

      {/* Live Catch Dashboard */}
      <LiveDashboard stats={stats} />

      {/* Narrative scroll journey */}
      <Journey />

      {/* Two paths */}
      <section className="max-w-[1600px] mx-auto px-4 md:px-8 lg:px-16 pb-20 lg:pb-32">
        <motion.h2 {...fadeUp} className="font-serif text-obsidian text-4xl md:text-5xl lg:text-6xl font-medium mb-16 text-center max-w-2xl mx-auto leading-[1.1]">
          Two paths, one table.
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          <motion.div {...fadeUp} className="card-white p-10 lg:p-16 flex flex-col items-start group">
            <p className="text-gold-dim text-[10px] uppercase mb-4 tracking-[0.4em]">Path A · Habit</p>
            <h3 className="font-serif text-obsidian text-3xl lg:text-4xl font-medium">The Daily Kudam</h3>
            <p className="text-obsidian/60 text-base leading-relaxed mt-5">
              Save ₹1, ₹5 or ₹10 every day. When your kudam fills, you unlock a
              20% discount and a family hamper on your next fresh catch order.
            </p>
            <div className="mt-10 flex justify-center w-full transform group-hover:scale-105 transition-transform duration-700 ease-[0.16,1,0.3,1]">
              <SavingsMandala progress={0.66} size={200} />
            </div>
            <button className="btn-obsidian mt-12 w-full sm:w-auto" onClick={() => navigate(user ? "/dashboard" : "/register")} data-testid="path-savings-btn">
              Start Saving
            </button>
          </motion.div>
          <motion.div {...fadeUp} className="card-white p-10 lg:p-16 flex flex-col items-start group">
            <p className="text-gold-dim text-[10px] uppercase mb-4 tracking-[0.4em]">Path B · Today</p>
            <h3 className="font-serif text-obsidian text-3xl lg:text-4xl font-medium">The Fresh Catch</h3>
            <p className="text-obsidian/60 text-base leading-relaxed mt-5">
              Pre-book Vanjaram, Iral and Vaaval for 6 AM delivery — standard
              market rates, or your Kudam discount if the vessel is full.
            </p>
            <div className="mt-10 overflow-hidden border-[0.5px] border-obsidian/10 w-full flex-1 min-h-[200px]">
              <img src={CATCH_ICE} alt="Fresh catch on ice" className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-[0.16,1,0.3,1]" loading="lazy" />
            </div>
            <button className="btn-gold-outline mt-12 w-full sm:w-auto" onClick={() => navigate("/market")} data-testid="path-market-btn">
              Browse the Catch
            </button>
          </motion.div>
        </div>
      </section>

      <div className="max-w-[1600px] mx-auto px-4 md:px-8 lg:px-16 pb-20 text-center">
        <div className="gold-rule mb-8 max-w-xs mx-auto" />
        <p className="tamil text-gold text-base md:text-lg">கடல் தரும், குடம் காக்கும்</p>
        <p className="text-obsidian/40 text-[9px] uppercase mt-3 tracking-[0.4em]">
          The sea provides, the kudam protects
        </p>
      </div>
    </div>
  );
}
