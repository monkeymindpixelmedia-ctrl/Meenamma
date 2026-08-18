import React, { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, Upload, Sparkles, Shield, RefreshCw } from "lucide-react";
import { api, formatApiErrorDetail, imgUrl } from "../lib/api";

const TABS = ["Overview", "Products", "Orders", "Kudams", "Customers", "WhatsApp"];
const EMPTY = { name: "", tamil_name: "", price_per_kg: "", image: "", origin: "", story: "", handling: "", available: true };
const STATUSES = ["confirmed", "ready", "delivered", "cancelled"];

function Stat({ label, value }) {
  return (
    <div className="glass-card-dark border-filigree-gold p-6 text-center rounded-xl relative overflow-hidden group hover:border-gold/60 transition-all duration-300 shadow-2xl">
      <div className="absolute -top-10 -right-10 w-24 h-24 bg-gold/5 rounded-full blur-xl group-hover:bg-gold/10 transition-all duration-500 pointer-events-none" />
      <p className="num-lg text-gold-gradient text-3xl font-light tracking-wide">{value}</p>
      <p className="text-[#A8A090] text-[9px] uppercase mt-2 tracking-[0.3em] font-medium">{label}</p>
    </div>
  );
}

function ProductForm({ initial, onSave, onCancel, busy }) {
  const [form, setForm] = useState(initial);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const upload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post("/admin/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setForm((f) => ({ ...f, image: data.url }));
    } catch (err) {
      alert(formatApiErrorDetail(err.response?.data?.detail) || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSave({ ...form, price_per_kg: Number(form.price_per_kg) }); }}
      className="glass-card-dark border-filigree-gold p-6 space-y-4 mt-4 rounded-xl shadow-2xl relative"
      data-testid="product-form"
    >
      <div className="flex items-center justify-between border-b border-gold/15 pb-3">
        <h3 className="font-serif text-gold-gradient text-lg font-medium flex items-center gap-2">
          <Sparkles size={16} className="text-gold" /> {initial?.id ? "Edit Product" : "New Artisanal Product"}
        </h3>
        <span className="tamil text-gold-dim text-xs">மீனம்மை பொருள்</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] uppercase tracking-widest text-[#A8A090] block mb-1">Product Name</label>
          <input className="input-cyberpunk w-full" placeholder="Name" value={form.name} onChange={set("name")} required data-testid="product-name-input" />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-widest text-[#A8A090] block mb-1">Tamil Title (தமிழ்)</label>
          <input className="input-cyberpunk tamil w-full" placeholder="தமிழ் பெயர்" value={form.tamil_name} onChange={set("tamil_name")} />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-widest text-[#A8A090] block mb-1">Price / kg (₹)</label>
          <input className="input-cyberpunk num w-full" type="number" min="1" placeholder="₹ / kg" value={form.price_per_kg} onChange={set("price_per_kg")} required data-testid="product-price-input" />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-widest text-[#A8A090] block mb-1">Source Origin</label>
          <input className="input-cyberpunk w-full" placeholder="Origin" value={form.origin} onChange={set("origin")} />
        </div>
      </div>

      <div className="flex items-center gap-4 bg-obsidian-canvas/60 p-3 rounded-lg border border-gold/15">
        {form.image && (
          <img src={imgUrl(form.image)} alt="preview" className="w-16 h-16 object-cover rounded-md border border-gold/50 shadow-md" data-testid="product-image-preview" />
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={upload} data-testid="product-image-file" />
        <button type="button" className="btn-cyber-outline !py-2 flex items-center gap-2 text-xs" onClick={() => fileRef.current?.click()} disabled={uploading} data-testid="product-upload-btn">
          <Upload size={14} /> {uploading ? "Uploading…" : "Upload photo"}
        </button>
        <input className="input-cyberpunk flex-1 text-xs" placeholder="…or paste image URL" value={form.image} onChange={set("image")} data-testid="product-image-input" />
      </div>

      <div>
        <label className="text-[10px] uppercase tracking-widest text-[#A8A090] block mb-1">Artisanal Story</label>
        <textarea className="input-cyberpunk w-full" rows={2} placeholder="Source story & ritual origins" value={form.story} onChange={set("story")} />
      </div>
      
      <div>
        <label className="text-[10px] uppercase tracking-widest text-[#A8A090] block mb-1">Handling Notes</label>
        <input className="input-cyberpunk w-full" placeholder="Handling and storage recommendation" value={form.handling} onChange={set("handling")} />
      </div>

      <label className="flex items-center gap-3 text-xs text-[#F5F2EB]/80 cursor-pointer pt-1">
        <input type="checkbox" checked={form.available} onChange={(e) => setForm({ ...form, available: e.target.checked })} className="accent-[#FFD700] w-4 h-4 rounded" data-testid="product-available-checkbox" />
        <span>Available for today's market sweeps</span>
      </label>

      <div className="flex gap-3 pt-2">
        <button className="btn-gold-cyber flex-1" disabled={busy} data-testid="product-save-btn">Save Product</button>
        <button type="button" className="btn-cyber-outline flex-1" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

function WhatsAppPanel() {
  const [status, setStatus] = useState("DISCONNECTED");
  const [qrCode, setQrCode] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const checkStatus = useCallback(async () => {
    try {
      const { data } = await api.get("/admin/whatsapp/status");
      setStatus(data.status);
      setQrCode(data.qr);
    } catch (err) {
      setStatus("DISCONNECTED");
      setQrCode(null);
    }
  }, []);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  const handleLogout = async () => {
    setBusy(true);
    setError("");
    try {
      await api.post("/admin/whatsapp/logout");
      setStatus("DISCONNECTED");
      setQrCode(null);
    } catch (err) {
      setError("Failed to log out device.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="glass-card-dark border-filigree-gold p-8 max-w-md mx-auto text-center shadow-2xl rounded-2xl relative overflow-hidden" data-testid="whatsapp-panel">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-full blur-3xl pointer-events-none" />
      <h2 className="font-serif italic text-2xl text-gold-gradient mb-2">WhatsApp Device Manager</h2>
      <p className="text-xs text-[#A8A090] mb-6 font-light">Link your device to dispatch automations and catch alerts directly to customers.</p>
      
      {error && <p className="text-red-400 text-xs italic mb-4">{error}</p>}
      
      <div className="bg-[#070605] p-6 rounded-xl inline-block border border-gold/25 mb-6 shadow-inner relative">
        {status === "CONNECTED" && (
          <div className="flex flex-col items-center justify-center h-48 w-48 text-emerald-400">
            <svg className="w-16 h-16 mb-2 drop-shadow-[0_0_12px_rgba(16,185,129,0.4)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-serif italic text-base text-emerald-400">Device Connected</span>
          </div>
        )}
        {status === "PAIRING" && qrCode ? (
          <img src={qrCode} alt="WhatsApp QR code" className="w-48 h-48 object-contain rounded-lg border border-gold/30" />
        ) : null}
        {status === "DISCONNECTED" && (
          <div className="flex flex-col items-center justify-center h-48 w-48 text-gold/50">
            <div className="w-8 h-8 border-2 border-gold/45 border-t-gold rounded-full animate-spin mb-3"></div>
            <span className="text-xs italic font-serif text-[#A8A090]">Connecting sidecar...</span>
          </div>
        )}
      </div>
      
      <div className="text-xs uppercase tracking-[0.2em] text-[#F5F2EB] font-medium mb-6">
        Status: <span className={status === "CONNECTED" ? "badge-emerald ml-2" : "badge-gold ml-2"}>{status}</span>
      </div>
      
      {status === "CONNECTED" && (
        <button 
          onClick={handleLogout} 
          disabled={busy} 
          className="btn-cyber-outline w-full !py-3 text-[10px] uppercase tracking-[0.2em]"
        >
          {busy ? "Disconnecting…" : "Disconnect Device"}
        </button>
      )}
    </div>
  );
}

export default function Admin() {
  const [tab, setTab] = useState("Overview");
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [kudams, setKudams] = useState([]);
  const [users, setUsers] = useState([]);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const [s, p, b, k, u] = await Promise.all([
      api.get("/admin/stats"), api.get("/products"), api.get("/admin/bookings"),
      api.get("/admin/kudams"), api.get("/admin/users"),
    ]);
    setStats(s.data); setProducts(p.data); setBookings(b.data); setKudams(k.data); setUsers(u.data);
  }, []);

  useEffect(() => { load().catch((e) => setMsg(formatApiErrorDetail(e.response?.data?.detail))); }, [load]);

  const saveProduct = async (form) => {
    setBusy(true); setMsg("");
    try {
      if (editing === "new") await api.post("/admin/products", form);
      else await api.put(`/admin/products/${editing.id}`, form);
      setEditing(null);
      await load();
    } catch (e) { setMsg(formatApiErrorDetail(e.response?.data?.detail)); }
    finally { setBusy(false); }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("Remove this product from the store?")) return;
    await api.delete(`/admin/products/${id}`);
    await load();
  };

  const setStatus = async (id, status) => {
    await api.patch(`/admin/bookings/${id}/status`, { status });
    await load();
  };

  const toggleAvailable = async (p) => {
    await api.put(`/admin/products/${p.id}`, {
      name: p.name, tamil_name: p.tamil_name, price_per_kg: p.price_per_kg,
      image: p.image, origin: p.origin, story: p.story, handling: p.handling,
      available: !p.available,
    });
    await load();
  };

  return (
    <div className="min-h-screen bg-obsidian-canvas text-[#F5F2EB] pb-24 md:pb-16" data-testid="admin-page">
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 lg:px-16 pt-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-gold/20 pb-6">
          <div>
            <p className="text-gold-bright text-[10px] uppercase font-mono tracking-[0.4em] mb-1">Store Control Hub · நிர்வாக மையம்</p>
            <h1 className="font-serif text-gold-gradient text-3xl md:text-5xl font-medium tracking-tight">Meenamma Store</h1>
          </div>
          <div className="mt-4 md:mt-0 flex items-center gap-3">
            <span className="tamil text-gold-dim text-sm">மீனம்மை நிர்வாகம்</span>
            <button onClick={() => load().catch(() => {})} className="btn-cyber-outline !py-2 !px-3 flex items-center gap-1.5 text-[10px]" title="Refresh data">
              <RefreshCw size={12} /> Refresh
            </button>
          </div>
        </div>

        <div className="flex gap-2 mt-6 overflow-x-auto border-b border-gold/20 pb-px scrollbar-none">
          {TABS.map((t) => (
            <motion.button
              key={t}
              whileTap={{ scale: 0.96 }}
              onClick={() => setTab(t)}
              data-testid={`admin-tab-${t.toLowerCase()}`}
              className={`px-6 py-3 text-[10px] uppercase whitespace-nowrap border-b-2 transition-all duration-300 rounded-t-lg ${
                tab === t
                  ? "text-gold-bright font-semibold border-[#FFD700] bg-gold/10 shadow-[0_0_15px_rgba(255,215,0,0.15)]"
                  : "text-[#A8A090] border-transparent hover:text-gold-bright hover:bg-gold/5"
              }`}
              style={{ letterSpacing: "0.22em" }}
            >
              {t}
            </motion.button>
          ))}
        </div>

        {msg && <p className="text-amber-400 text-xs italic font-serif mt-4 bg-amber-950/40 p-3 rounded-lg border border-amber-500/30">{msg}</p>}

        <div className="pt-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              {tab === "Overview" && stats && (
                <div className="space-y-8" data-testid="admin-stats">
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <Stat label="Customers" value={stats.users} />
                    <Stat label="Products" value={stats.products} />
                    <Stat label="Orders" value={stats.bookings} />
                    <Stat label="Order Revenue" value={`₹${stats.booking_revenue.toLocaleString("en-IN")}`} />
                    <Stat label="Held in Kudams" value={`₹${stats.total_saved.toLocaleString("en-IN")}`} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    <div className="glass-card-dark border-filigree-gold p-6 rounded-xl relative overflow-hidden">
                      <div className="flex justify-between items-center mb-4 border-b border-gold/15 pb-3">
                        <h3 className="font-serif text-gold-gradient text-lg">System Pulse & Status</h3>
                        <span className="badge-emerald">OPERATIONAL</span>
                      </div>
                      <div className="space-y-3 text-xs text-[#A8A090]">
                        <div className="flex justify-between py-1 border-b border-gold/10">
                          <span>UPI Sweeps Engine</span>
                          <span className="text-emerald-400 font-mono">Active Mandate Mode</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-gold/10">
                          <span>Database Sync</span>
                          <span className="text-emerald-400 font-mono">Supabase Realtime</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span>Razorpay Autopay Mandates</span>
                          <span className="text-gold-bright font-mono">Live Cadence</span>
                        </div>
                      </div>
                    </div>

                    <div className="glass-card-dark border-filigree-gold p-6 rounded-xl relative overflow-hidden">
                      <div className="flex justify-between items-center mb-4 border-b border-gold/15 pb-3">
                        <h3 className="font-serif text-gold-gradient text-lg">Kudam Heritage Summary</h3>
                        <span className="tamil text-gold-bright text-xs">மீனம்மை குடம்</span>
                      </div>
                      <p className="text-xs text-[#A8A090] font-light leading-relaxed">
                        Total daily micro-savings accumulated across Tamil micro-mandates. All funds settled through periodic sweeps to preserve financial prosperity.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {tab === "Products" && (
                <div className="max-w-4xl">
                  <button className="btn-gold-cyber w-full flex items-center justify-center gap-2 shadow-lg" onClick={() => setEditing("new")} data-testid="admin-add-product-btn">
                    <Plus size={16} /> Add New Artisanal Product
                  </button>
                  <AnimatePresence>
                    {editing === "new" && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                        <ProductForm initial={EMPTY} onSave={saveProduct} onCancel={() => setEditing(null)} busy={busy} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className="space-y-4 mt-6">
                    {products.map((p) => (
                      <div key={p.id} data-testid={`admin-product-${p.name.toLowerCase()}`}>
                        <div className="glass-card-dark border-filigree-gold p-5 flex items-center gap-5 rounded-xl hover:border-gold/50 transition-all duration-300">
                          <img src={imgUrl(p.image)} alt={p.name} className="w-16 h-16 object-cover rounded-xl border border-gold/40 shadow-md" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-serif text-[#F5F2EB] text-xl font-medium leading-tight">{p.name}</p>
                              {p.tamil_name && <span className="tamil text-gold-dim text-xs font-normal">({p.tamil_name})</span>}
                            </div>
                            <p className="num text-gold-bright text-sm mt-1 font-mono">
                              <span className="rupee">₹</span>{p.price_per_kg} / kg
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => toggleAvailable(p)}
                              data-testid={`admin-toggle-${p.name.toLowerCase()}`}
                              className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${p.available ? "bg-[#FFD700] shadow-[0_0_12px_rgba(255,215,0,0.4)]" : "bg-neutral-800 border border-gold/20"}`}
                              title={p.available ? "Available — click to hide" : "Hidden — click to show"}
                            >
                              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-[#070605] shadow transition-all duration-300 ${p.available ? "left-[25px]" : "left-0.5"}`} />
                            </button>
                            <button onClick={() => setEditing(p)} className="text-gold-bright hover:text-white p-2 transition-colors" data-testid={`admin-edit-${p.name.toLowerCase()}`} title="Edit"><Pencil size={18} /></button>
                            <button onClick={() => deleteProduct(p.id)} className="text-red-400/70 hover:text-red-400 p-2 transition-colors" data-testid={`admin-delete-${p.name.toLowerCase()}`} title="Delete"><Trash2 size={18} /></button>
                          </div>
                        </div>
                        <AnimatePresence>
                          {editing && editing !== "new" && editing.id === p.id && (
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                              <ProductForm initial={{ ...EMPTY, ...p }} onSave={saveProduct} onCancel={() => setEditing(null)} busy={busy} />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {tab === "Orders" && (
                <div className="space-y-4 max-w-4xl" data-testid="admin-bookings-list">
                  {bookings.length === 0 && <p className="text-[#A8A090] font-serif italic mt-8 text-center">No orders registered yet.</p>}
                  {bookings.map((b) => (
                    <div key={b.id} className="glass-card-dark border-filigree-gold p-6 rounded-xl space-y-4 hover:border-gold/40 transition-all">
                      <div className="flex justify-between flex-wrap items-start gap-4">
                        <div>
                          <div className="flex items-center gap-3">
                            <p className="font-serif text-gold-gradient text-xl font-medium">{b.product_name} · {b.qty_kg} kg</p>
                            {b.discount_percent > 0 && (
                              <span className="badge-gold">{b.discount_percent}% Kudam Discount Applied</span>
                            )}
                          </div>
                          <p className="text-[#A8A090] text-xs font-mono mt-1">{b.user?.name} ({b.user?.email})</p>
                          <p className="text-[#A8A090]/80 text-xs mt-1">Delivery Window: {b.pickup_date} · {b.delivery_window || "6:00 AM Dawn Delivery"}</p>
                        </div>
                        <p className="num text-gold-bright text-2xl font-mono">₹{b.amount.toLocaleString("en-IN")}</p>
                      </div>

                      <div className="flex gap-2 pt-2">
                        {STATUSES.map((s) => (
                          <button
                            key={s}
                            onClick={() => setStatus(b.id, s)}
                            className={`flex-1 py-2.5 text-[9px] uppercase border rounded-md transition-all duration-300 ${
                              b.status === s 
                                ? "border-[#FFD700] bg-[#FFD700] text-[#070605] font-bold shadow-[0_0_12px_rgba(255,215,0,0.3)]" 
                                : "border-gold/20 text-[#A8A090] hover:border-gold/40 hover:text-[#F5F2EB]"
                            }`}
                            style={{ letterSpacing: "0.15em" }}
                            data-testid={`booking-status-${s}-${b.id}`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {tab === "Kudams" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-5xl" data-testid="admin-kudams-list">
                  {kudams.length === 0 && <p className="text-[#A8A090] font-serif italic mt-8 text-center col-span-2">No kudams registered yet.</p>}
                  {kudams.map((k) => (
                    <div key={k.id} className="glass-card-dark border-filigree-gold p-6 rounded-xl relative overflow-hidden">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-serif text-gold-gradient text-xl font-medium">{k.name}</p>
                          <p className="text-[#A8A090] text-xs font-mono mt-0.5">{k.user?.name} ({k.user?.email})</p>
                        </div>
                        <div className="text-right">
                          <p className="text-gold-bright text-sm font-mono font-semibold">₹{k.saved_amount.toLocaleString("en-IN")} / ₹{k.goal_amount.toLocaleString("en-IN")}</p>
                          <span className="badge-gold mt-1 inline-block">{k.status}</span>
                        </div>
                      </div>
                      <div className="h-2 bg-obsidian-canvas rounded-full mt-4 border border-gold/20 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-[#C59B27] via-[#FFD700] to-[#FFE44D] shadow-[0_0_10px_rgba(255,215,0,0.6)]" 
                          style={{ width: `${Math.min(k.saved_amount / k.goal_amount, 1) * 100}%` }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {tab === "Customers" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-5xl" data-testid="admin-users-list">
                  {users.map((u) => (
                    <div key={u.id} className="glass-card-dark border-filigree-gold p-6 rounded-xl flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-serif text-[#F5F2EB] text-xl font-medium">{u.name}</p>
                          {u.role === "admin" && <span className="badge-gold">ADMIN</span>}
                        </div>
                        <p className="text-[#A8A090] text-xs font-mono mt-1">{u.email}</p>
                      </div>
                      <div className="text-right text-[#A8A090] text-xs font-mono bg-obsidian-canvas/60 p-3 rounded-lg border border-gold/15">
                        <p className="text-gold-bright">{u.kudam_count} active kudams</p>
                        <p>{u.booking_count} orders</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {tab === "WhatsApp" && <WhatsAppPanel />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
