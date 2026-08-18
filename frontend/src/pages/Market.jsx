import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Filter, Compass } from "lucide-react";
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
  const [win, setWin] = useState("6:00 AM");
  const [redeem, setRedeem] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [reward, setReward] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [provenance, setProvenance] = useState(null);

  // Filters
  const [selectedOrigin, setSelectedOrigin] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");

  const lang = user?.locale === "ta" ? "ta" : "en";

  useEffect(() => {
    api.get(`/products?lang=${lang}`).then(({ data }) => setProducts(data));
  }, [lang]);

  useEffect(() => {
    if (user) api.get("/rewards/status").then(({ data }) => setReward(data)).catch(() => {});
  }, [user]);

  const discount = reward?.discount_percent || 0;
  const priceFor = (p) => {
    const base = p.price_per_kg * qty;
    return discount ? Math.round(base * (1 - discount / 100)) : Math.round(base);
  };
  const creditFor = (p) =>
    redeem && reward?.kudam_id ? Math.min(reward.saved_amount || 0, priceFor(p)) : 0;
  const payableFor = (p) => Math.max(priceFor(p) - creditFor(p), 1);

  const book = async (p) => {
    if (!user) {
      navigate("/login");
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      await payWithRazorpay(
        {
          purpose: "booking", product_id: p.id, qty_kg: Number(qty), pickup_date: date,
          delivery_window: win, redeem_kudam_id: redeem ? reward?.kudam_id : undefined,
        },
        user
      );
      setReceipt({ product: p, date, win, mode: "book", qty, total: payableFor(p) });
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
      setReceipt({ product: p, mode: "reserve", qty, advance: Math.max(1, Math.round(p.price_per_kg * qty * 0.25)) });
      setSelected(null);
    } catch (err) {
      setMsg(err.message || "Reservation failed");
    } finally {
      setBusy(false);
    }
  };

  const matchesOrigin = (product, origin) => {
    if (origin === "All") return true;
    if (origin === "Pazhaverkadu") {
      return product.origin?.toLowerCase().includes("pazhaverkadu") || product.origin?.toLowerCase().includes("pulicat");
    }
    return product.origin?.toLowerCase().includes(origin.toLowerCase());
  };

  const filteredProducts = products ? products.filter((p) => {
    if (!matchesOrigin(p, selectedOrigin)) return false;
    if (selectedStatus === "available" && !p.available) return false;
    if (selectedStatus === "reserve" && p.available) return false;
    return true;
  }) : [];

  const inr = (val) => val.toLocaleString("en-IN");

  return (
    <div className="min-h-screen bg-[#0D0D0C] paper-texture pb-24 md:pb-16 text-[#FAFAFA]" data-testid="market-page">
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 lg:px-16 pt-8 lg:pt-16">
        
        {/* Brand Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 border-b border-white/10 pb-8">
          <div>
            <p className="text-[#C5A059] text-[10px] uppercase tracking-[0.4em] font-medium">The Fresh Catch</p>
            <h1 className="font-serif text-[#FAFAFA] text-4xl md:text-6xl font-medium mt-2">Today's Catch</h1>
            <p className="text-white/60 text-sm md:text-base mt-4 max-w-xl leading-relaxed">
              Pre-book tonight, receive by 6 AM. Hand-selected directly from the local tide.
            </p>
          </div>
          <div className="flex flex-col gap-2 items-start md:items-end">
            {discount > 0 && (
              <div className="bg-[#C5A059] text-white text-[10px] uppercase px-4 py-2 tracking-[0.2em] font-medium" data-testid="market-discount-badge">
                {discount}% Kudam discount active
              </div>
            )}
          </div>
        </div>

        {/* Filter controls panel */}
        <div className="mt-8 bg-white/5 border border-white/10 p-6 rounded-sm">
          <div className="flex items-center gap-2 text-[#C5A059] text-xs font-semibold uppercase tracking-wider">
            <Filter size={14} />
            <span>Refine Selection</span>
          </div>

          <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Origin Filters */}
            <div>
              <p className="text-white/40 text-[9px] uppercase tracking-wider mb-2">Sea Origin</p>
              <div className="flex flex-wrap gap-2">
                {["All", "Kasimedu", "Rameswaram", "Cuddalore", "Pazhaverkadu", "Nagapattinam"].map((o) => (
                  <button
                    key={o}
                    onClick={() => { haptic(); setSelectedOrigin(o); }}
                    className={`px-3 py-1.5 text-[10px] uppercase tracking-wider border transition-all duration-300 ${
                      selectedOrigin === o
                        ? "border-[#C5A059] bg-[#C5A059]/15 text-[#C5A059]"
                        : "border-white/10 text-white/60 hover:text-[#FAFAFA] hover:border-white/30"
                    }`}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </div>

            {/* Availability Status Filters */}
            <div>
              <p className="text-white/40 text-[9px] uppercase tracking-wider mb-2">Caught Status</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "All", label: "All Catches" },
                  { id: "available", label: "Pre-Book (Available)" },
                  { id: "reserve", label: "Seasonal Reserve" }
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => { haptic(); setSelectedStatus(s.id); }}
                    className={`px-3 py-1.5 text-[10px] uppercase tracking-wider border transition-all duration-300 ${
                      selectedStatus === s.id
                        ? "border-[#C5A059] bg-[#C5A059]/15 text-[#C5A059]"
                        : "border-white/10 text-white/60 hover:text-[#FAFAFA] hover:border-white/30"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {msg && (
          <p className="text-[#C5A059] text-sm italic font-serif mt-6" data-testid="market-msg">{msg}</p>
        )}

        {/* Editorial Grids */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-10">
          {products === null ? (
            <p className="col-span-full text-center text-white/40 font-serif italic py-24">Reading the tide…</p>
          ) : filteredProducts.length === 0 ? (
            <p className="col-span-full text-center text-white/40 font-serif italic py-24">No catches match your filters today.</p>
          ) : (
            filteredProducts.map((p, idx) => (
              <motion.article
                key={p.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.7, delay: (idx % 3) * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="bg-[#FCF9F2] border-[0.5px] border-[#C5A059]/15 text-[#0A0A0A] overflow-hidden group flex flex-col justify-between"
                data-testid={`product-card-${p.name.toLowerCase()}`}
              >
                <div>
                  {/* Product Image */}
                  <div className="w-full h-64 overflow-hidden relative">
                    <img 
                      src={imgUrl(p.image)} 
                      alt={p.name} 
                      onClick={() => setProvenance(p)}
                      className="w-full h-full object-cover transform group-hover:scale-[1.03] transition-transform duration-1000 ease-[0.16,1,0.3,1] filter brightness-[0.95] cursor-pointer" 
                      loading="lazy" 
                    />
                    {!p.available ? (
                      <div className="absolute top-4 right-4 bg-[#0D0D0C]/90 backdrop-blur-sm px-3 py-1 text-[9px] uppercase tracking-widest text-[#C5A059] border-[0.5px] border-[#C5A059]/30">
                        Seasonal Reserve
                      </div>
                    ) : p.price_per_kg >= 1000 ? (
                      <div className="absolute top-4 right-4 bg-[#C5A059] px-3 py-1 text-[9px] uppercase tracking-widest text-white shadow-lg">
                        Limited Catch
                      </div>
                    ) : null}
                    
                    <button 
                      onClick={() => setProvenance(p)}
                      className="absolute bottom-4 left-4 bg-[#0D0D0C]/75 hover:bg-[#0D0D0C] backdrop-blur-sm px-2.5 py-1.5 rounded-sm flex items-center gap-1.5 text-white text-[9px] uppercase tracking-wider transition-colors"
                    >
                      <Compass size={11} className="text-[#C5A059]" />
                      <span>Trace Origin</span>
                    </button>
                  </div>

                  {/* Product Metadata */}
                  <div className="p-6 pb-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="tamil text-[#C5A059] text-xs font-semibold">{p.tamil_name}</p>
                        <h2 className="font-serif text-[#0A0A0A] text-2xl font-medium leading-tight mt-1 hover:text-[#C5A059] transition-colors cursor-pointer" onClick={() => setProvenance(p)}>{p.name}</h2>
                      </div>
                      <p className="num-lg text-[#0A0A0A] text-2xl whitespace-nowrap">
                        <span className="rupee font-serif">₹</span>{inr(p.price_per_kg)}<span className="text-black/40 text-xs font-sans font-normal"> / kg</span>
                      </p>
                    </div>
                    
                    <p className="text-black/40 text-[9px] uppercase mt-3 tracking-widest font-mono">{p.origin}</p>
                    <p className="text-black/75 text-sm leading-relaxed mt-4 font-serif italic">{p.story}</p>
                  </div>
                </div>

                {/* Buy / Reserve CTA */}
                <div className="p-6">
                  <div className="h-[0.5px] bg-[#C5A059]/20 w-full mb-6"></div>
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    className={`w-full ${p.available ? "btn-obsidian" : "btn-gold-outline"}`}
                    onClick={() => { haptic(); setSelected(p); setMode(p.available ? "book" : "reserve"); setMsg(""); }}
                    data-testid={p.available ? `book-btn-${p.name.toLowerCase()}` : `reserve-btn-${p.name.toLowerCase()}`}
                  >
                    {p.available ? "Pre-Book" : "Reserve with 25%"}
                  </motion.button>
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
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-40"
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
              className="fixed bottom-0 inset-x-0 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:max-w-lg w-full bg-[#FCF9F2] border-[0.5px] border-[#C5A059]/20 z-50 p-8 shadow-2xl text-[#0A0A0A]"
              data-testid="booking-sheet"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="tamil text-[#C5A059] text-sm font-semibold">{selected.tamil_name}</p>
                  <h3 className="font-serif text-[#0A0A0A] text-3xl font-medium mt-1">{selected.name}</h3>
                </div>
                <button onClick={() => setSelected(null)} className="text-black/40 hover:text-[#0A0A0A] transition-colors p-2 -mr-2 -mt-2" data-testid="sheet-close-btn">
                  <X size={20} strokeWidth={1.5} />
                </button>
              </div>
              
              <div className="flex gap-6 mt-8">
                <div className="flex-1">
                  <label className="text-black/40 text-[9px] uppercase tracking-widest font-semibold">Kilograms</label>
                  <input className="input-minimal mt-2" type="number" min="0.5" step="0.5" value={qty} onChange={(e) => setQty(e.target.value)} data-testid="booking-qty-input" />
                </div>
                {mode === "book" && (
                  <div className="flex-1">
                    <label className="text-black/40 text-[9px] uppercase tracking-widest font-semibold">Delivery date</label>
                    <input className="input-minimal mt-2" type="date" value={date} min={tomorrow()} onChange={(e) => setDate(e.target.value)} data-testid="booking-date-input" />
                  </div>
                )}
                {mode === "book" && (
                  <div className="flex-1">
                    <label className="text-black/40 text-[9px] uppercase tracking-widest font-semibold">Delivery slot</label>
                    <div className="flex gap-2 mt-2">
                      {["6:00 AM", "7:00 AM"].map((w) => (
                        <button
                          type="button"
                          key={w}
                          onClick={() => { haptic(); setWin(w); }}
                          data-testid={`slot-${w.replace(" ", "-")}`}
                          className={`flex-1 py-2.5 text-[11px] border transition-all duration-300 ${
                            win === w ? "border-[#C5A059] bg-[#C5A059]/10 text-[#0A0A0A] font-semibold" : "border-black/15 text-black/60"
                          }`}
                        >
                          {w}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {mode === "reserve" && (
                <p className="text-black/60 text-xs leading-relaxed mt-6 font-serif italic" data-testid="reserve-explainer">
                  This catch is off-season. Pay 25% now to hold your slot — the moment it lands,
                  you get first access to complete the booking at today's price.
                </p>
              )}

              {mode === "book" && reward?.kudam_id && (
                <label
                  className="flex items-center justify-between gap-3 mt-6 pt-4 border-t-[0.5px] border-black/10 cursor-pointer"
                  data-testid="redeem-toggle"
                >
                  <span className="text-black/70 text-[11px]">
                    Redeem my full kudam ({reward.kudam_name}) —{" "}
                    <span className="num">₹{inr(Math.min(reward.saved_amount || 0, priceFor(selected)))}</span> off
                  </span>
                  <input
                    type="checkbox"
                    checked={redeem}
                    onChange={(e) => { haptic(); setRedeem(e.target.checked); }}
                    className="accent-[#C5A059]"
                  />
                </label>
              )}

              <div className="flex justify-between items-center mt-8 border-t-[0.5px] border-black/10 pt-6">
                <p className="text-black/60 text-sm uppercase tracking-widest text-[10px]">
                  {mode === "reserve" ? "Pay now · 25% advance" : <>Total {discount > 0 && <span className="text-[#C5A059]">({discount}% off)</span>}</>}
                </p>
                <div className="num-lg text-[#0A0A0A] text-3xl" data-testid="booking-total">
                  {mode === "reserve" ? (
                    <div className="flex items-center">
                      <span className="text-black/30 line-through text-lg mr-3 num">₹{inr(Math.round(selected.price_per_kg * qty))}</span>
                      <span className="rupee">₹</span>{inr(Math.max(1, Math.round(selected.price_per_kg * qty * 0.25)))}
                    </div>
                  ) : (
                    <div>
                      {discount > 0 && (
                        <span className="text-black/30 line-through text-lg mr-3 num">₹{inr(Math.round(selected.price_per_kg * qty))}</span>
                      )}
                      <span className="rupee">₹</span>{inr(payableFor(selected))}
                      {creditFor(selected) > 0 && (
                        <span className="text-[#C5A059] text-[10px] block text-right font-sans font-normal">incl. ₹{inr(creditFor(selected))} kudam credit</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <motion.button
                whileTap={{ scale: 0.97 }}
                className={`w-full mt-8 ${mode === "reserve" ? "btn-gold-outline" : "btn-obsidian"}`}
                onClick={() => { haptic(); mode === "reserve" ? reserve(selected) : book(selected); }}
                disabled={busy}
                data-testid="confirm-book-btn"
              >
                {busy ? "Speaking to the boat…" : mode === "reserve" ? `Reserve · Pay ₹${inr(Math.max(1, Math.round(selected.price_per_kg * qty * 0.25)))}` : "Confirm & Pay"}
              </motion.button>
            </motion.div>
          </>
        )}

        {provenance && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              onClick={() => setProvenance(null)}
            />
            <motion.div
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 70, damping: 20, mass: 1 }}
              className="fixed inset-y-0 right-0 w-full md:max-w-md bg-[#FCF9F2] border-l-[0.5px] border-[#C5A059]/20 z-50 p-8 shadow-2xl overflow-y-auto flex flex-col text-[#0A0A0A]"
              data-testid="provenance-drawer"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-black/40 text-[9px] uppercase tracking-widest font-semibold">The Story of the Catch</p>
                  <h3 className="font-serif text-[#0A0A0A] text-3xl font-medium mt-1">{provenance.name}</h3>
                </div>
                <button onClick={() => setProvenance(null)} className="text-black/40 hover:text-[#0A0A0A] transition-colors p-2 -mr-2 -mt-2">
                  <X size={20} strokeWidth={1.5} />
                </button>
              </div>
              <div className="mt-8 relative aspect-[4/3] overflow-hidden">
                <img src={imgUrl(provenance.image)} alt={provenance.name} className="w-full h-full object-cover filter brightness-[0.9]" />
              </div>
              <div className="mt-8 space-y-6">
                <div>
                  <p className="text-black/40 text-[9px] uppercase tracking-widest font-semibold mb-2">Provenance</p>
                  <p className="font-serif text-black/80 text-lg italic leading-relaxed border-l-2 border-[#C5A059] pl-4">
                    Sourced from the deep waters off the Coromandel Coast. Our multi-generational artisanal fishermen set out at dusk to guarantee this catch lands at your door before dawn.
                  </p>
                </div>
                <div>
                  <p className="text-black/40 text-[9px] uppercase tracking-widest font-semibold mb-2">Flavor Profile</p>
                  <p className="text-black/70 text-sm leading-relaxed">{provenance.story || "A delicate, premium texture with a flavor that honors the sea."}</p>
                </div>
                <div>
                  <p className="text-black/40 text-[9px] uppercase tracking-widest font-semibold mb-2">Handling</p>
                  <p className="text-black/70 text-sm leading-relaxed">{provenance.handling || "Zero breaks in the cold chain. Handled with absolute respect."}</p>
                </div>
              </div>
              <button
                className="btn-obsidian w-full mt-8"
                onClick={() => { setProvenance(null); setSelected(provenance); setMode(provenance.available ? "book" : "reserve"); setMsg(""); }}
              >
                {provenance.available ? "Pre-Book" : "Reserve"}
              </button>
            </motion.div>
          </>
        )}

        {receipt && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                initial={{ y: 20, opacity: 0, scale: 0.95 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 20, opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 80, damping: 20, delay: 0.2 }}
                className="bg-[#FCF9F2] paper-texture w-full max-w-sm p-8 shadow-2xl relative overflow-hidden text-[#0A0A0A]"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-[#C5A059]"></div>
                <div className="flex justify-center mb-6 text-[#C5A059]">
                  <Check size={40} strokeWidth={1} />
                </div>
                <h3 className="font-serif text-[#0A0A0A] text-3xl font-medium text-center leading-tight mb-2">
                  {receipt.mode === "reserve" ? "Reservation Confirmed" : "Catch Confirmed"}
                </h3>
                <p className="text-black/40 text-[10px] uppercase tracking-widest text-center mb-8">
                  Meenamma &middot; The Ritual of the Sea
                </p>
                
                <div className="border-t-[0.5px] border-black/20 border-dashed py-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <span className="text-black/60 text-xs tracking-wider uppercase">Item</span>
                    <span className="text-[#0A0A0A] text-sm text-right font-medium">{receipt.product.name}<br/><span className="text-black/40 text-[10px]">{receipt.qty} kg</span></span>
                  </div>
                  {receipt.mode === "book" && (
                    <div className="flex justify-between items-start">
                      <span className="text-black/60 text-xs tracking-wider uppercase">Delivery</span>
                      <span className="text-[#0A0A0A] text-sm text-right font-medium">{receipt.win}<br/><span className="text-black/40 text-[10px]">{receipt.date}</span></span>
                    </div>
                  )}
                  <div className="flex justify-between items-start">
                    <span className="text-black/60 text-xs tracking-wider uppercase">Paid</span>
                    <span className="text-[#0A0A0A] text-sm font-medium num">
                      ₹{receipt.mode === "reserve" ? inr(receipt.advance) : inr(receipt.total)}
                    </span>
                  </div>
                </div>

                <div className="border-t-[0.5px] border-black/20 border-dashed pt-6 pb-2">
                  <p className="text-black/60 font-serif italic text-sm text-center">
                    {receipt.mode === "reserve" 
                      ? "You'll be notified the moment it lands." 
                      : "We will wake before dawn so you don't have to."}
                  </p>
                </div>
                
                <button
                  className="w-full mt-8 border border-black/10 py-3 text-[10px] uppercase tracking-wider text-black/60 hover:bg-black/5 hover:text-[#0A0A0A] transition-colors"
                  onClick={() => setReceipt(null)}
                >
                  Return to Market
                </button>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
