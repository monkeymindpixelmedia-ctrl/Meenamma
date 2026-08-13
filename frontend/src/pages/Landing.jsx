import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { SavingsMandala } from "../components/SavingsMandala";
import { useAuth } from "../context/AuthContext";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
};

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-sandalwood-paper paper-texture pb-24 md:pb-0" data-testid="landing-page">
      {/* Full-bleed hero */}
      <section className="w-full border-b border-gold/30">
        <div className="max-w-[1600px] mx-auto px-4 md:px-8 lg:px-16 py-16 lg:py-28 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <motion.p
              {...fadeUp}
              className="text-gold-dim text-[10px] md:text-xs uppercase mb-6"
              style={{ letterSpacing: "0.45em" }}
            >
              Kasimedu · Since the first tide
            </motion.p>
            <motion.h1
              {...fadeUp}
              className="font-serif text-henna text-5xl md:text-6xl lg:text-7xl leading-[1.05] font-medium"
              data-testid="hero-heading"
            >
              Save a little daily.<br />
              <span className="text-gold italic">Feast</span> on the freshest catch.
            </motion.h1>
            <motion.p {...fadeUp} className="text-henna/80 text-base md:text-lg leading-8 mt-8 max-w-lg">
              Meenamma is a clean household tool with two simple paths — a Daily
              Kudam that turns ₹5 a day into feast-day discounts, and a Fresh
              Catch market to pre-book seafood straight off the dawn boats.
            </motion.p>
            <motion.div {...fadeUp} className="mt-10 flex flex-col sm:flex-row gap-4">
              <button
                className="btn-henna sm:min-w-[240px]"
                onClick={() => navigate(user ? "/dashboard" : "/register")}
                data-testid="begin-kudam-btn"
              >
                Begin Your Kudam
              </button>
              <button className="btn-gold-outline sm:min-w-[240px]" onClick={() => navigate("/market")} data-testid="view-catch-btn">
                View Today's Catch
              </button>
            </motion.div>
          </div>
          <motion.div {...fadeUp} className="hidden lg:flex justify-center">
            <SavingsMandala progress={0.66} size={380} />
          </motion.div>
        </div>
      </section>

      {/* Mobile mandala */}
      <motion.section {...fadeUp} className="lg:hidden flex flex-col items-center py-12 px-6">
        <SavingsMandala progress={0.66} size={250} />
      </motion.section>

      {/* Two paths */}
      <section className="max-w-[1600px] mx-auto px-4 md:px-8 lg:px-16 py-12 lg:py-20">
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
            <button className="btn-henna mt-8 w-full sm:w-auto" onClick={() => navigate(user ? "/dashboard" : "/register")} data-testid="path-savings-btn">
              Start Saving
            </button>
          </motion.div>
          <motion.div {...fadeUp} className="card-white p-8 lg:p-12">
            <p className="text-gold-dim text-[10px] uppercase mb-3" style={{ letterSpacing: "0.4em" }}>Path B · Today</p>
            <h3 className="font-serif text-henna text-2xl lg:text-3xl font-medium">The Fresh Catch</h3>
            <p className="text-henna/80 text-sm leading-7 mt-4">
              Pre-book Vanjaram, Iral and Vaaval for 6 AM delivery — standard
              market rates, or your Kudam discount if the vessel is full.
            </p>
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
