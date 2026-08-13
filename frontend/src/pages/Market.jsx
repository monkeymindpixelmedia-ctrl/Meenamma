import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { api, payWithRazorpay } from "../lib/api";
import { useAuth } from "../context/AuthContext";

function tomorrow() {
  const d = new Date(Date.now() + 86400000);
  return d.toISOString().slice(0, 10);
}

export default function Market() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [qty, setQty] = useState(1);
  const [date, setDate] = useState(tomorrow());
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api.get("/products").then(({ data }) => setProducts(data));
  }, []);

  const book = async (p) => {
    if (!user) {
      navigate("/login");
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      const amount = Math.round(p.price_per_kg * qty);
      await payWithRazorpay(
        { purpose: "booking", amount, product_id: p.id, qty_kg: Number(qty), pickup_date: date },
        user
      );
      setMsg(`${p.name} claimed. It will be waiting for you on ${date}.`);
    } catch (err) {
      setMsg(err.message || "Booking failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-henna silk-texture pb-28" data-testid="market-page">
      <header className="glass-henna sticky top-0 z-30 px-6 py-4">
        <p className="text-gold/60 text-[9px] uppercase" style={{ letterSpacing: "0.4em" }}>
          The Artisan Storefront
        </p>
        <h1 className="font-serif text-sandalwood text-2xl leading-tight">Today's Catch</h1>
      </header>

      {msg && (
        <p className="text-gold-shimmer text-xs italic font-serif text-center px-8 mt-4" data-testid="market-msg">
          {msg}
        </p>
      )}

      <div className="px-6 pt-8 space-y-8">
        {products === null ? (
          <p className="text-center text-sandalwood/50 font-serif italic mt-20">Reading the tide…</p>
        ) : (
          products.map((p, idx) => (
            <motion.article
              key={p.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.7, delay: (idx % 2) * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="gold-border bg-henna-deep/40 p-5"
              data-testid={`product-card-${p.name.toLowerCase()}`}
            >
              <div className="flex gap-5 items-center">
                <div className="oval-cameo w-24 h-28 flex-shrink-0">
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="min-w-0">
                  <p className="tamil text-gold-shimmer text-sm">{p.tamil_name}</p>
                  <h2 className="font-serif text-sandalwood text-2xl font-medium leading-tight">{p.name}</h2>
                  <p className="text-gold text-sm mt-1">
                    ₹{p.price_per_kg.toLocaleString("en-IN")}
                    <span className="text-sandalwood/40 text-xs"> / kg</span>
                  </p>
                  <p className="text-sandalwood/50 text-[10px] uppercase mt-1" style={{ letterSpacing: "0.2em" }}>
                    {p.origin}
                  </p>
                </div>
              </div>

              <button
                className="text-gold/80 text-[10px] uppercase mt-4 underline underline-offset-4"
                style={{ letterSpacing: "0.25em" }}
                onClick={() => setOpenId(openId === p.id ? null : p.id)}
                data-testid={`story-toggle-${p.name.toLowerCase()}`}
              >
                {openId === p.id ? "Fold the story" : "Source story"}
              </button>

              <AnimatePresence>
                {openId === p.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="border-l border-gold/40 pl-4 mt-4">
                      <p className="text-sandalwood/70 text-xs leading-6 italic font-serif text-sm">{p.story}</p>
                      <p className="text-gold/70 text-[10px] mt-2 uppercase" style={{ letterSpacing: "0.15em" }}>
                        {p.handling}
                      </p>
                    </div>
                    <div className="flex gap-3 mt-5">
                      <div className="flex-1">
                        <label className="text-sandalwood/40 text-[9px] uppercase" style={{ letterSpacing: "0.25em" }}>
                          Kilograms
                        </label>
                        <input
                          className="input-ritual mt-1"
                          type="number"
                          min="0.5"
                          step="0.5"
                          value={qty}
                          onChange={(e) => setQty(e.target.value)}
                          data-testid="booking-qty-input"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-sandalwood/40 text-[9px] uppercase" style={{ letterSpacing: "0.25em" }}>
                          Pickup
                        </label>
                        <input
                          className="input-ritual mt-1"
                          type="date"
                          value={date}
                          min={tomorrow()}
                          onChange={(e) => setDate(e.target.value)}
                          data-testid="booking-date-input"
                        />
                      </div>
                    </div>
                    <button
                      className="btn-solid-gold w-full mt-4"
                      onClick={() => book(p)}
                      disabled={busy}
                      data-testid={`book-btn-${p.name.toLowerCase()}`}
                    >
                      {busy ? "Speaking to the boat…" : `Claim ${qty} kg · ₹${Math.round(p.price_per_kg * qty).toLocaleString("en-IN")}`}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.article>
          ))
        )}
      </div>
    </div>
  );
}
