import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { SavingsMandala } from "../components/SavingsMandala";
import { useAuth } from "../context/AuthContext";

const fadeUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] },
};

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-henna silk-texture pb-28" data-testid="landing-page">
      <header className="glass-henna sticky top-0 z-30 px-6 py-4 flex items-center justify-between">
        <span className="font-serif text-gold text-lg" style={{ letterSpacing: "0.25em" }}>
          MEENAMMA
        </span>
        {user ? (
          <button
            onClick={() => navigate("/dashboard")}
            className="text-[10px] uppercase text-gold-shimmer"
            style={{ letterSpacing: "0.25em" }}
            data-testid="header-dashboard-link"
          >
            My Kudam
          </button>
        ) : (
          <button
            onClick={() => navigate("/login")}
            className="text-[10px] uppercase text-gold-shimmer"
            style={{ letterSpacing: "0.25em" }}
            data-testid="header-login-link"
          >
            Enter
          </button>
        )}
      </header>

      <section className="px-8 pt-16 pb-12">
        <motion.p
          {...fadeUp}
          className="text-gold/70 text-[10px] uppercase mb-6"
          style={{ letterSpacing: "0.45em" }}
        >
          Kasimedu · Since the first tide
        </motion.p>
        <motion.h1
          {...fadeUp}
          className="font-serif text-sandalwood text-5xl leading-[1.1] font-medium"
          data-testid="hero-heading"
        >
          The Ritual of <em className="text-gold not-italic font-serif italic">the Sea</em>,<br />
          kept in <span className="text-gold">Gold</span>.
        </motion.h1>
        <motion.p {...fadeUp} className="text-sandalwood/70 text-sm leading-7 mt-8 max-w-sm">
          Meenamma is a savings ceremony for the coastal table. Fill your Kudam
          rupee by rupee, and claim the finest catch of Tamil Nadu before it
          ever reaches the market.
        </motion.p>
        <motion.div {...fadeUp} className="mt-10 flex flex-col gap-4">
          <button
            className="btn-solid-gold w-full"
            onClick={() => navigate(user ? "/dashboard" : "/register")}
            data-testid="begin-kudam-btn"
          >
            Begin Your Kudam
          </button>
          <button
            className="btn-ritual w-full"
            onClick={() => navigate("/market")}
            data-testid="view-catch-btn"
          >
            View Today's Catch
          </button>
        </motion.div>
      </section>

      <motion.section {...fadeUp} className="flex flex-col items-center py-14 px-8">
        <SavingsMandala progress={0.66} size={280} />
        <p className="font-serif text-gold text-2xl mt-8 text-center italic">
          "A kudam filled slowly<br />never runs dry."
        </p>
        <p
          className="text-sandalwood/50 text-[10px] uppercase mt-4"
          style={{ letterSpacing: "0.4em" }}
        >
          Tamil coastal proverb
        </p>
      </motion.section>

      <section className="px-8 py-10 space-y-6">
        {[
          {
            n: "I",
            t: "Set the Vessel",
            d: "Name your Kudam — a wedding feast, a festival table, the month's fish fund — and set its gold mark.",
          },
          {
            n: "II",
            t: "Pour the Offering",
            d: "Deposit any amount, any day, through UPI or card. Watch the mandala fill with liquid gold.",
          },
          {
            n: "III",
            t: "Claim the Catch",
            d: "Pre-book Vanjaram, Iral and Vaaval straight off the dawn boats of Kasimedu and Rameswaram.",
          },
        ].map((s) => (
          <motion.div key={s.n} {...fadeUp} className="filigree-card p-6">
            <div className="flex items-baseline gap-4">
              <span className="font-serif text-gold-dim text-3xl">{s.n}</span>
              <div>
                <h3 className="font-serif text-henna text-xl font-semibold">{s.t}</h3>
                <p className="text-henna/70 text-xs leading-6 mt-2 font-sans">{s.d}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </section>

      <footer className="px-8 pt-10 pb-6 text-center">
        <div className="h-px bg-gold/30 mb-6" />
        <p className="tamil text-gold/60 text-sm">கடல் தரும், குடம் காக்கும்</p>
        <p className="text-sandalwood/40 text-[9px] uppercase mt-2" style={{ letterSpacing: "0.35em" }}>
          The sea provides, the kudam protects
        </p>
      </footer>
    </div>
  );
}
