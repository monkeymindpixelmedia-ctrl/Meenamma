import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { api, payWithRazorpay, imgUrl, haptic } from "../lib/api";
import { useAuth } from "../context/AuthContext";

function tomorrow() {
  const d = new Date(Date.now() + 86400000);
  return d.toISOString().slice(0, 10);
}

export default function Market() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState(null);
  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState("book");
  const [qty, setQty] = useState(1);
  const [date, setDate] = useState(tomorrow());
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [reward, setReward] = useState(null);

  useEffect(() => {
    api.get("/products").then(({ data }) => setProducts(data));
  }, []);

  useEffect(() => {
    if (user) api.get("/rewards/status").then(({ data }) => setReward(data)).catch(() => {});
  }, [user]);

  const discount = reward?.discount_percent || 0;
  const priceFor = (p) => {
    const base = p.price_per_kg * qty;
    return discount ? Math.round(base * (1 - discount / 100)) : Math.round(base);
  };

  const book = async (p) => {
    if (!user) {
      navigate("/login");
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      await payWithRazorpay(
        { purpose: "booking", product_id: p.id, qty_kg: Number(qty), pickup_date: date },
        user
      );
      setMsg(`${p.name} pre-booked — it will be at your door by 6 AM on ${date}.`);
      setSelected(null);
      if (user) api.get("/rewards/status").then(({ data }) => setReward(data)).catch(() => {});
    } catch (err) {
      setMsg(err.message || "Booking failed");
    } finally {
      setBusy(false);
    }
  };

  const reserve = async (p) => {
    if (!user) {
      navigate("/login");
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      await payWithRazorpay({ product_id: p.id, qty_kg: Number(qty) }, user, "/reservations/create-order");
      setMsg(`${p.name} reserved with a 25% advance — you'll be the first to know when it lands. Track it on your dashboard.`);
      setSelected(null);
    } catch (err) {
      setMsg(err.message || "Reservation failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-alabaster paper-texture pb-24 md:pb-16" data-testid="market-page">
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 lg:px-16 pt-8 lg:pt-16">
        <p className="text-gold-dim text-[10px] uppercase tracking-[0.4em]">The Fresh Catch</p>
        <div className="flex items-end justify-between flex-wrap gap-3 mt-3">
          <h1 className="font-serif text-obsidian text-4xl md:text-6xl font-medium">Today's Catch</h1>
          {discount > 0 && (
            <div className="bg-gold text-white text-[10px] uppercase px-4 py-2 tracking-[0.2em]" data-testid="market-discount-badge">
              {discount}% Kudam discount applies
            </div>
          )}
        </div>
        <p className="text-obsidian/60 text-base md:text-lg mt-4 max-w-xl leading-relaxed">
          Pre-book tonight, receive by 6 AM. Straight off the dawn boats.
        </p>

        {msg && (
          <p className="text-obsidian text-sm italic font-serif mt-6" data-testid="market-msg">{msg}</p>
        )}

        {/* Editorial masonry */}
        <div className="columns-1 md:columns-2 xl:columns-3 gap-8 mt-12 [column-fill:balance]">
          {products === null ? (
            <p className="text-obsidian/40 font-serif italic mt-12">Reading the tide…</p>
          ) : (
            products.map((p, idx) => (
              <motion.article
                key={p.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.7, delay: (idx % 3) * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="card-white mb-8 break-inside-avoid overflow-hidden group"
                data-testid={`product-card-${p.name.toLowerCase()}`}
              >
                <div className={`w-full overflow-hidden relative ${idx % 3 === 0 ? "h-72" : idx % 3 === 1 ? "h-56" : "h-64"}`}>
                  <img 
                    src={imgUrl(p.image)} 
                    alt={p.name} 
                    className="w-full h-full object-cover transform group-hover:scale-[1.03] transition-transform duration-1000 ease-[0.16,1,0.3,1] filter brightness-[0.95]" 
                    loading="lazy" 
                  />
                  {!p.available && (
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 text-[9px] uppercase tracking-luxury text-obsidian">
                      Off-Season
                    </div>
                  )}
                </div>
                <div className="p-8">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="tamil text-gold-dim text-sm">{p.tamil_name}</p>
                      <h2 className="font-serif text-obsidian text-3xl font-medium leading-tight mt-1">{p.name}</h2>
                    </div>
                    <p className="num-lg text-obsidian text-xl whitespace-nowrap">
                      <span className="rupee">₹</span>{p.price_per_kg.toLocaleString("en-IN")}<span className="text-obsidian/40 text-xs font-sans font-normal"> / kg</span>
                    </p>
                  </div>
                  <p className="text-obsidian/40 text-[9px] uppercase mt-4 tracking-[0.2em]">{p.origin}</p>
                  <p className="text-obsidian/70 text-sm leading-relaxed mt-4 font-serif italic">{p.story}</p>
                  <p className="text-gold-dim text-[10px] mt-4 uppercase tracking-[0.12em]">{p.handling}</p>
                  <button
                    className={`w-full mt-8 ${p.available ? "btn-obsidian" : "btn-gold-outline"}`}
                    onClick={() => { haptic(); setSelected(p); setMode(p.available ? "book" : "reserve"); setMsg(""); }}
                    data-testid={p.available ? `book-btn-${p.name.toLowerCase()}` : `reserve-btn-${p.name.toLowerCase()}`}
                  >
                    {p.available ? "Pre-Book" : "Reserve with 25%"}
                  </button>
                </div>
              </motion.article>
            ))
          )}
        </div>
      </div>

      {/* Slide-up booking sheet (mobile) / modal (desktop) */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              className="fixed inset-0 bg-obsidian/30 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              onClick={() => setSelected(null)}
            />
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 70, damping: 20, mass: 1 }}
              className="fixed bottom-0 inset-x-0 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:max-w-lg w-full bg-alabaster border-[0.5px] border-obsidian/10 z-50 p-8 shadow-2xl"
              data-testid="booking-sheet"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="tamil text-gold-dim text-sm">{selected.tamil_name}</p>
                  <h3 className="font-serif text-obsidian text-3xl font-medium mt-1">{selected.name}</h3>
                </div>
                <button onClick={() => setSelected(null)} className="text-obsidian/40 hover:text-obsidian transition-colors p-2 -mr-2 -mt-2" data-testid="sheet-close-btn">
                  <X size={20} strokeWidth={1.5} />
                </button>
              </div>
              
              <div className="flex gap-6 mt-8">
                <div className="flex-1">
                  <label className="text-obsidian/40 text-[9px] uppercase tracking-[0.25em]">Kilograms</label>
                  <input className="input-minimal mt-2" type="number" min="0.5" step="0.5" value={qty} onChange={(e) => setQty(e.target.value)} data-testid="booking-qty-input" />
                </div>
                {mode === "book" && (
                  <div className="flex-1">
                    <label className="text-obsidian/40 text-[9px] uppercase tracking-[0.25em]">Delivery date</label>
                    <input className="input-minimal mt-2" type="date" value={date} min={tomorrow()} onChange={(e) => setDate(e.target.value)} data-testid="booking-date-input" />
                  </div>
                )}
              </div>

              {mode === "reserve" && (
                <p className="text-obsidian/60 text-xs leading-relaxed mt-6 font-serif italic" data-testid="reserve-explainer">
                  This catch is off-season. Pay 25% now to hold your slot — the moment it lands,
                  you get first access to complete the booking at today's price.
                </p>
              )}

              <div className="flex justify-between items-center mt-8 border-t-[0.5px] border-obsidian/10 pt-6">
                <p className="text-obsidian/60 text-sm uppercase tracking-luxury text-[10px]">
                  {mode === "reserve" ? "Pay now · 25% advance" : <>Total {discount > 0 && <span className="text-gold-dim">({discount}% off)</span>}</>}
                </p>
                <p className="num-lg text-obsidian text-3xl" data-testid="booking-total">
                  {mode === "reserve" ? (
                    <>
                      <span className="text-obsidian/30 text-lg mr-3 num">₹{Math.round(selected.price_per_kg * qty).toLocaleString("en-IN")}</span>
                      <span className="rupee">₹</span>{Math.max(1, Math.round(selected.price_per_kg * qty * 0.25)).toLocaleString("en-IN")}
                    </>
                  ) : (
                    <>
                      {discount > 0 && (
                        <span className="text-obsidian/30 line-through text-lg mr-3 num">₹{Math.round(selected.price_per_kg * qty).toLocaleString("en-IN")}</span>
                      )}
                      <span className="rupee">₹</span>{priceFor(selected).toLocaleString("en-IN")}
                    </>
                  )}
                </p>
              </div>
              <button
                className={`w-full mt-8 ${mode === "reserve" ? "btn-gold-outline" : "btn-obsidian"}`}
                onClick={() => { haptic(); mode === "reserve" ? reserve(selected) : book(selected); }}
                disabled={busy}
                data-testid="confirm-book-btn"
              >
                {busy ? "Speaking to the boat…" : mode === "reserve" ? `Reserve · Pay ₹${Math.max(1, Math.round(selected.price_per_kg * qty * 0.25)).toLocaleString("en-IN")}` : "Confirm & Pay"}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
