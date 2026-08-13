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
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
};

function CountUp({ value, prefix = "", suffix = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  useEffect(() => {
    if (!inView || ref.current == null) return;
    const controls = animate(0, value, {
      duration: 1.6,
      ease: [0.22, 1, 0.36, 1],
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
      <div className="bg-henna text-sandalwood shadow-2xl border border-gold/40">
        <div className="flex items-center gap-3 px-6 lg:px-10 pt-6">
          <motion.span
            className="w-2 h-2 rounded-full bg-gold"
            animate={{ opacity: [1, 0.3, 1], scale: [1, 1.4, 1] }}
            transition={{ duration: 1.6, repeat: Infinity }}
          />
          <p className="text-gold text-[10px] uppercase" style={{ letterSpacing: "0.45em" }}>
            The Live Ledger · counted from the harbour, not invented
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 divide-x divide-y lg:divide-y-0 divide-gold/15 mt-4 border-t border-gold/20">
          {stats === null
            ? [...Array(6)].map((_, i) => (
                <div key={i} className="px-6 py-7">
                  <div className="h-8 w-16 bg-gold/10 animate-pulse" />
                  <div className="h-2 w-24 bg-gold/10 animate-pulse mt-3" />
                </div>
              ))
            : cells.map((c) => (
                <div key={c.label} className="px-5 lg:px-6 py-7" data-testid={c.testid}>
                  <p className="num-lg text-gold text-2xl lg:text-3xl">
                    <CountUp value={c.value} prefix={c.prefix || ""} />
                  </p>
                  <p className="text-sandalwood/60 text-[9px] uppercase mt-2 leading-4" style={{ letterSpacing: "0.22em" }}>
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
    <section className="max-w-[1600px] mx-auto px-4 md:px-8 lg:px-16 py-16 lg:py-24" data-testid="narrative-journey">
      <motion.p {...fadeUp} className="text-gold-dim text-[10px] uppercase" style={{ letterSpacing: "0.45em" }}>
        The Journey · sea to table in one tide
      </motion.p>
      <motion.h2 {...fadeUp} className="font-serif text-henna text-3xl md:text-4xl lg:text-5xl font-medium mt-3 max-w-2xl">
        Follow one fish, from the dark water to your dawn table.
      </motion.h2>
      <div className="mt-12 lg:mt-16 space-y-16 lg:space-y-24">
        {CHAPTERS.map((c, i) => (
          <motion.div
            key={c.time}
            {...fadeUp}
            className={`grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center ${i % 2 ? "lg:direction-rtl" : ""}`}
            data-testid={c.testid}
          >
            <div className={`lg:col-span-7 ${i % 2 ? "lg:order-2" : ""}`}>
              <div className={`overflow-hidden border border-gold/30 ${c.portrait ? "max-h-[520px]" : ""}`}>
                <motion.img
                  src={c.image}
                  alt={c.title}
                  className={`w-full h-full object-cover ${c.portrait ? "object-bottom" : ""}`}
                  loading="lazy"
                  initial={{ scale: 1.08 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            </div>
            <div className={`lg:col-span-5 ${i % 2 ? "lg:order-1" : ""}`}>
              <div className="flex items-center gap-4">
                <span className="num-lg text-gold text-xl">{c.time}</span>
                <span className="flex-1 h-px bg-gold/30" />
              </div>
              <h3 className="font-serif text-henna text-2xl lg:text-4xl font-medium mt-4">{c.title}</h3>
              <p className="text-henna/80 text-base leading-8 mt-5 max-w-md">{c.body}</p>
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
    <div className="min-h-screen bg-sandalwood-paper paper-texture pb-24 md:pb-0" data-testid="landing-page">
      {/* Cinematic hero */}
      <section className="relative w-full overflow-hidden" data-testid="landing-hero">
        <div className="absolute inset-0">
          <img src={HERO} alt="Kasimedu boats at dawn" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#2b0f0b] via-[#2b0f0b]/70 to-[#2b0f0b]/30" />
        </div>
        <div className="relative max-w-[1600px] mx-auto px-4 md:px-8 lg:px-16 pt-24 lg:pt-36 pb-28 lg:pb-40">
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-gold text-[10px] md:text-xs uppercase mb-6"
            style={{ letterSpacing: "0.45em" }}
          >
            Kasimedu · Since the first tide
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="font-serif text-sandalwood text-4xl sm:text-5xl lg:text-6xl leading-[1.05] font-medium max-w-3xl"
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
            className="text-sandalwood/85 text-base md:text-lg leading-8 mt-7 max-w-xl"
          >
            A Daily Kudam that turns ₹5 a day into feast-day discounts, and a Fresh Catch
            market to pre-book seafood straight off the dawn boats of Tamil Nadu.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.55 }}
            className="mt-10 flex flex-col sm:flex-row gap-4"
          >
            <button
              className="btn-henna !bg-gold !text-henna sm:min-w-[240px] font-semibold"
              onClick={() => navigate(user ? "/dashboard" : "/register")}
              data-testid="begin-kudam-btn"
            >
              Begin Your Kudam
            </button>
            <button
              className="sm:min-w-[240px] border border-sandalwood/60 text-sandalwood py-3.5 px-6 text-xs uppercase hover:bg-sandalwood/10 transition-colors duration-300"
              style={{ letterSpacing: "0.18em" }}
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
      <section className="max-w-[1600px] mx-auto px-4 md:px-8 lg:px-16 pb-12 lg:pb-20">
        <motion.h2 {...fadeUp} className="font-serif text-henna text-3xl md:text-4xl font-medium mb-10">
          Two paths, one table.
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10">
          <motion.div {...fadeUp} className="card-white p-8 lg:p-12">
            <p className="text-gold-dim text-[10px] uppercase mb-3" style={{ letterSpacing: "0.4em" }}>Path A · Habit</p>
            <h3 className="font-serif text-henna text-2xl lg:text-3xl font-medium">The Daily Kudam</h3>
            <p className="text-henna/80 text-sm leading-7 mt-4">
              Save ₹1, ₹5 or ₹10 every day. When your kudam fills, you unlock a
              20% discount and a family hamper on your next fresh catch order.
            </p>
            <div className="mt-6 flex justify-center md:justify-start">
              <SavingsMandala progress={0.66} size={170} />
            </div>
            <button className="btn-henna mt-8 w-full sm:w-auto" onClick={() => navigate(user ? "/dashboard" : "/register")} data-testid="path-savings-btn">
              Start Saving
            </button>
          </motion.div>
          <motion.div {...fadeUp} className="card-white p-8 lg:p-12 flex flex-col">
            <p className="text-gold-dim text-[10px] uppercase mb-3" style={{ letterSpacing: "0.4em" }}>Path B · Today</p>
            <h3 className="font-serif text-henna text-2xl lg:text-3xl font-medium">The Fresh Catch</h3>
            <p className="text-henna/80 text-sm leading-7 mt-4">
              Pre-book Vanjaram, Iral and Vaaval for 6 AM delivery — standard
              market rates, or your Kudam discount if the vessel is full.
            </p>
            <div className="mt-6 overflow-hidden border border-gold/25 flex-1 max-h-52">
              <img src={CATCH_ICE} alt="Fresh catch on ice" className="w-full h-full object-cover" loading="lazy" />
            </div>
            <button className="btn-gold-outline mt-8 w-full sm:w-auto" onClick={() => navigate("/market")} data-testid="path-market-btn">
              Browse the Catch
            </button>
          </motion.div>
        </div>
      </section>

      <footer className="max-w-[1600px] mx-auto px-4 md:px-8 lg:px-16 pt-6 pb-10 text-center">
        <div className="gold-rule mb-6" />
        <p className="tamil text-gold-dim text-sm">கடல் தரும், குடம் காக்கும்</p>
        <p className="text-henna/40 text-[9px] uppercase mt-2" style={{ letterSpacing: "0.35em" }}>
          The sea provides, the kudam protects
        </p>
      </footer>
    </div>
  );
}
