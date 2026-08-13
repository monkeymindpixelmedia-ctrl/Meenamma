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

  return (
    <div className="min-h-screen bg-sandalwood-paper paper-texture pb-24 md:pb-16" data-testid="market-page">
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 lg:px-16 pt-8 lg:pt-12">
        <p className="text-gold-dim text-[10px] uppercase" style={{ letterSpacing: "0.4em" }}>The Fresh Catch</p>
        <div className="flex items-end justify-between flex-wrap gap-3">
          <h1 className="font-serif text-henna text-3xl md:text-5xl font-medium">Today's Catch</h1>
          {discount > 0 && (
            <div className="bg-gold text-white text-[10px] uppercase px-4 py-2" style={{ letterSpacing: "0.2em" }} data-testid="market-discount-badge">
              {discount}% Kudam discount applies
            </div>
          )}
        </div>
        <p className="text-henna/75 text-base mt-2">Pre-book tonight, receive by 6 AM. Straight off the dawn boats.</p>

        {msg && (
          <p className="text-henna text-sm italic font-serif mt-5" data-testid="market-msg">{msg}</p>
        )}

        {/* Editorial masonry */}
        <div className="columns-1 md:columns-2 xl:columns-3 gap-6 mt-8 [column-fill:balance]">
          {products === null ? (
            <p className="text-henna/50 font-serif italic mt-12">Reading the tide…</p>
          ) : (
            products.map((p, idx) => (
              <motion.article
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.55, delay: (idx % 3) * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="card-white mb-6 break-inside-avoid overflow-hidden"
                data-testid={`product-card-${p.name.toLowerCase()}`}
              >
                <div className={`w-full overflow-hidden ${idx % 3 === 0 ? "h-64" : idx % 3 === 1 ? "h-48" : "h-56"}`}>
                  <img src={imgUrl(p.image)} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="tamil text-gold-dim text-sm">{p.tamil_name}</p>
                      <h2 className="font-serif text-henna text-2xl font-medium leading-tight">{p.name}</h2>
                    </div>
                    <p className="num-lg text-henna text-lg whitespace-nowrap">
                      <span className="rupee">₹</span>{p.price_per_kg.toLocaleString("en-IN")}<span className="text-henna/55 text-xs font-sans font-normal"> / kg</span>
                    </p>
                  </div>
                  <p className="text-henna/65 text-[10px] uppercase mt-2" style={{ letterSpacing: "0.2em" }}>{p.origin}</p>
                  <p className="text-henna/85 text-sm leading-6 mt-3 font-serif italic">{p.story}</p>
                  <p className="text-gold-dim text-[10px] mt-2 uppercase" style={{ letterSpacing: "0.12em" }}>{p.handling}</p>
                  <button
                    className="btn-henna w-full mt-5"
                    onClick={() => { haptic(); setSelected(p); setMsg(""); }}
                    disabled={!p.available}
                    data-testid={`book-btn-${p.name.toLowerCase()}`}
                  >
                    {p.available ? "Pre-Book" : "Off the boat today"}
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
              className="fixed inset-0 bg-henna/40 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
            />
            <motion.div
              initial={{ y: "100%", opacity: 0.6 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="fixed bottom-0 inset-x-0 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:max-w-md w-full bg-white border-t md:border border-gold/50 z-50 p-6 md:p-8"
              data-testid="booking-sheet"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="tamil text-gold-dim text-sm">{selected.tamil_name}</p>
                  <h3 className="font-serif text-henna text-2xl font-medium">{selected.name}</h3>
                </div>
                <button onClick={() => setSelected(null)} className="text-henna/50 p-1" data-testid="sheet-close-btn"><X size={20} /></button>
              </div>
              <div className="flex gap-4 mt-6">
                <div className="flex-1">
                  <label className="text-henna/50 text-[9px] uppercase" style={{ letterSpacing: "0.25em" }}>Kilograms</label>
                  <input className="input-ritual mt-1" type="number" min="0.5" step="0.5" value={qty} onChange={(e) => setQty(e.target.value)} data-testid="booking-qty-input" />
                </div>
                <div className="flex-1">
                  <label className="text-henna/50 text-[9px] uppercase" style={{ letterSpacing: "0.25em" }}>Delivery date</label>
                  <input className="input-ritual mt-1" type="date" value={date} min={tomorrow()} onChange={(e) => setDate(e.target.value)} data-testid="booking-date-input" />
                </div>
              </div>
              <div className="flex justify-between items-center mt-6 border-t border-gold/20 pt-4">
                <p className="text-henna/75 text-sm">Total {discount > 0 && <span className="text-gold-dim">({discount}% off)</span>}</p>
                <p className="num-lg text-henna text-2xl" data-testid="booking-total">
                  {discount > 0 && (
                    <span className="text-henna/40 line-through text-base mr-2 num">₹{Math.round(selected.price_per_kg * qty).toLocaleString("en-IN")}</span>
                  )}
                  <span className="rupee">₹</span>{priceFor(selected).toLocaleString("en-IN")}
                </p>
              </div>
              <button className="btn-henna w-full mt-5" onClick={() => { haptic(); book(selected); }} disabled={busy} data-testid="confirm-book-btn">
                {busy ? "Speaking to the boat…" : "Confirm & Pay"}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
