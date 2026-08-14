import React, { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, Upload } from "lucide-react";
import { api, formatApiErrorDetail, imgUrl } from "../lib/api";

const TABS = ["Overview", "Products", "Orders", "Kudams", "Customers", "WhatsApp"];
const EMPTY = { name: "", tamil_name: "", price_per_kg: "", image: "", origin: "", story: "", handling: "", available: true };
const STATUSES = ["confirmed", "ready", "delivered", "cancelled"];

function Stat({ label, value }) {
  return (
    <div className="filigree-card p-6 text-center">
      <p className="num-lg text-obsidian text-3xl">{value}</p>
      <p className="text-obsidian/60 text-[9px] uppercase mt-1" style={{ letterSpacing: "0.3em" }}>{label}</p>
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
      className="card-white p-6 space-y-4 mt-4"
      data-testid="product-form"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <input className="input-ritual" placeholder="Name" value={form.name} onChange={set("name")} required data-testid="product-name-input" />
        <input className="input-ritual tamil" placeholder="தமிழ் பெயர்" value={form.tamil_name} onChange={set("tamil_name")} />
        <input className="input-ritual" type="number" min="1" placeholder="₹ / kg" value={form.price_per_kg} onChange={set("price_per_kg")} required data-testid="product-price-input" />
        <input className="input-ritual" placeholder="Origin" value={form.origin} onChange={set("origin")} />
      </div>

      <div className="flex items-center gap-4">
        {form.image && (
          <img src={imgUrl(form.image)} alt="preview" className="w-16 h-16 object-cover border border-gold/50" data-testid="product-image-preview" />
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={upload} data-testid="product-image-file" />
        <button type="button" className="btn-gold-outline !py-2 !min-h-0 flex items-center gap-2" onClick={() => fileRef.current?.click()} disabled={uploading} data-testid="product-upload-btn">
          <Upload size={14} /> {uploading ? "Uploading…" : "Upload photo"}
        </button>
        <input className="input-ritual flex-1" placeholder="…or paste image URL" value={form.image} onChange={set("image")} data-testid="product-image-input" />
      </div>

      <textarea className="input-ritual" rows={2} placeholder="Source story" value={form.story} onChange={set("story")} />
      <input className="input-ritual" placeholder="Handling note" value={form.handling} onChange={set("handling")} />
      <label className="flex items-center gap-2 text-obsidian/70 text-xs">
        <input type="checkbox" checked={form.available} onChange={(e) => setForm({ ...form, available: e.target.checked })} className="accent-gold" data-testid="product-available-checkbox" />
        Available today
      </label>
      <div className="flex gap-3">
        <button className="btn-obsidian flex-1" disabled={busy} data-testid="product-save-btn">Save</button>
        <button type="button" className="btn-gold-outline flex-1" onClick={onCancel}>Cancel</button>
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
    <div className="bg-[#FCF9F2] border border-[#C5A059]/40 p-8 rounded-xl max-w-md mx-auto text-center shadow-lg" data-testid="whatsapp-panel">
      <h2 className="font-serif italic text-2xl text-[#4A1C17] mb-2">WhatsApp Device Manager</h2>
      <p className="text-xs text-obsidian/60 mb-6 font-light">Link your device to dispatch automations and catch alerts directly to customers.</p>
      
      {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}
      
      <div className="bg-white p-6 rounded-lg inline-block border border-gold/15 mb-6 shadow-inner">
        {status === "CONNECTED" && (
          <div className="flex flex-col items-center justify-center h-48 w-48 text-emerald-600">
            <svg className="w-16 h-16 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-serif italic text-base">Device Connected</span>
          </div>
        )}
        {status === "PAIRING" && qrCode ? (
          <img src={qrCode} alt="WhatsApp QR code" className="w-48 h-48 object-contain" />
        ) : null}
        {status === "DISCONNECTED" && (
          <div className="flex flex-col items-center justify-center h-48 w-48 text-obsidian/45">
            <div className="w-8 h-8 border-2 border-gold/45 border-t-gold rounded-full animate-spin mb-3"></div>
            <span className="text-xs italic font-serif">Connecting sidecar...</span>
          </div>
        )}
      </div>
      
      <div className="text-xs uppercase tracking-widest text-[#4A1C17] font-semibold mb-6" style={{ letterSpacing: "0.15em" }}>
        Status: <span className={status === "CONNECTED" ? "text-emerald-600 font-bold" : "text-amber-500"}>{status}</span>
      </div>
      
      {status === "CONNECTED" && (
        <button 
          onClick={handleLogout} 
          disabled={busy} 
          className="btn-gold-outline w-full !py-2.5 !min-h-0 text-[10px] uppercase tracking-widest"
          style={{ letterSpacing: "0.15em" }}
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
    <div className="min-h-screen bg-alabaster-paper paper-texture pb-24 md:pb-16" data-testid="admin-page">
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 lg:px-16 pt-8">
        <p className="text-gold-dim text-[10px] uppercase" style={{ letterSpacing: "0.4em" }}>Store Manager</p>
        <h1 className="font-serif text-obsidian text-3xl md:text-4xl font-medium">Meenamma Store</h1>

        <div className="flex gap-1 mt-6 overflow-x-auto border-b border-gold/25">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              data-testid={`admin-tab-${t.toLowerCase()}`}
              className={`px-5 py-3 text-[10px] uppercase whitespace-nowrap border-b-2 -mb-px transition-colors duration-300 ${
                tab === t ? "text-obsidian font-semibold border-gold" : "text-obsidian/40 border-transparent"
              }`}
              style={{ letterSpacing: "0.22em" }}
            >
              {t}
            </button>
          ))}
        </div>

        {msg && <p className="text-obsidian text-xs italic font-serif mt-4">{msg}</p>}

        <div className="pt-8">
          {tab === "Overview" && stats && (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4" data-testid="admin-stats">
              <Stat label="Customers" value={stats.users} />
              <Stat label="Products" value={stats.products} />
              <Stat label="Orders" value={stats.bookings} />
              <Stat label="Order Revenue" value={`₹${stats.booking_revenue.toLocaleString("en-IN")}`} />
              <Stat label="Held in Kudams" value={`₹${stats.total_saved.toLocaleString("en-IN")}`} />
            </div>
          )}

          {tab === "Products" && (
            <div className="max-w-3xl">
              <button className="btn-gold-outline w-full flex items-center justify-center gap-2" onClick={() => setEditing("new")} data-testid="admin-add-product-btn">
                <Plus size={14} /> Add a product
              </button>
              <AnimatePresence>
                {editing === "new" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <ProductForm initial={EMPTY} onSave={saveProduct} onCancel={() => setEditing(null)} busy={busy} />
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="space-y-3 mt-5">
                {products.map((p) => (
                  <div key={p.id} data-testid={`admin-product-${p.name.toLowerCase()}`}>
                    <div className="card-white p-4 flex items-center gap-4">
                      <img src={imgUrl(p.image)} alt={p.name} className="w-14 h-14 object-cover rounded-full border border-gold/50" />
                      <div className="flex-1 min-w-0">
                        <p className="font-serif text-obsidian text-lg leading-tight">{p.name}</p>
                        <p className="num text-obsidian/75 text-xs"><span className="rupee">₹</span>{p.price_per_kg}/kg</p>
                      </div>
                      <button
                        onClick={() => toggleAvailable(p)}
                        data-testid={`admin-toggle-${p.name.toLowerCase()}`}
                        className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${p.available ? "bg-gold" : "bg-obsidian/20"}`}
                        title={p.available ? "Available — click to hide" : "Hidden — click to show"}
                      >
                        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-300 ${p.available ? "left-[22px]" : "left-0.5"}`} />
                      </button>
                      <button onClick={() => setEditing(p)} className="text-gold-dim p-2" data-testid={`admin-edit-${p.name.toLowerCase()}`}><Pencil size={16} /></button>
                      <button onClick={() => deleteProduct(p.id)} className="text-obsidian/40 p-2" data-testid={`admin-delete-${p.name.toLowerCase()}`}><Trash2 size={16} /></button>
                    </div>
                    <AnimatePresence>
                      {editing && editing !== "new" && editing.id === p.id && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
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
            <div className="space-y-3 max-w-3xl" data-testid="admin-bookings-list">
              {bookings.length === 0 && <p className="text-obsidian/50 font-serif italic mt-8">No orders yet.</p>}
              {bookings.map((b) => (
                <div key={b.id} className="card-white p-5">
                  <div className="flex justify-between flex-wrap gap-2">
                    <div>
                      <p className="font-serif text-obsidian text-lg">{b.product_name} · {b.qty_kg} kg</p>
                      <p className="text-obsidian/50 text-[11px]">{b.user?.name} ({b.user?.email})</p>
                      <p className="text-obsidian/50 text-[11px]">Delivery {b.pickup_date} · {b.delivery_window || "6:00 AM"}{b.discount_percent > 0 && ` · ${b.discount_percent}% kudam discount`}</p>
                    </div>
                    <p className="text-obsidian text-base">₹{b.amount.toLocaleString("en-IN")}</p>
                  </div>
                  <div className="flex gap-2 mt-4">
                    {STATUSES.map((s) => (
                      <button
                        key={s}
                        onClick={() => setStatus(b.id, s)}
                        className={`flex-1 py-2 text-[9px] uppercase border transition-colors duration-300 ${
                          b.status === s ? "border-obsidian bg-obsidian text-gold-shimmer font-semibold" : "border-gold/30 text-obsidian/50"
                        }`}
                        style={{ letterSpacing: "0.12em" }}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl" data-testid="admin-kudams-list">
              {kudams.length === 0 && <p className="text-obsidian/50 font-serif italic mt-8">No kudams yet.</p>}
              {kudams.map((k) => (
                <div key={k.id} className="filigree-card p-5">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-serif text-obsidian text-lg font-medium">{k.name}</p>
                      <p className="text-obsidian/50 text-[11px]">{k.user?.name} ({k.user?.email})</p>
                    </div>
                    <div className="text-right">
                      <p className="text-obsidian text-sm">₹{k.saved_amount.toLocaleString("en-IN")} / ₹{k.goal_amount.toLocaleString("en-IN")}</p>
                      <p className="text-gold-dim text-[9px] uppercase" style={{ letterSpacing: "0.2em" }}>{k.status}</p>
                    </div>
                  </div>
                  <div className="h-1 bg-gold/15 mt-3">
                    <div className="h-full bg-gold" style={{ width: `${Math.min(k.saved_amount / k.goal_amount, 1) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "Customers" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl" data-testid="admin-users-list">
              {users.map((u) => (
                <div key={u.id} className="card-white p-5 flex justify-between items-center">
                  <div>
                    <p className="font-serif text-obsidian text-lg">{u.name} {u.role === "admin" && <span className="text-gold-dim text-[9px] uppercase ml-1">admin</span>}</p>
                    <p className="text-obsidian/50 text-[11px]">{u.email}</p>
                  </div>
                  <p className="text-obsidian/60 text-[10px] text-right" style={{ letterSpacing: "0.1em" }}>
                    {u.kudam_count} kudams<br />{u.booking_count} orders
                  </p>
                </div>
              ))}
            </div>
          )}

          {tab === "WhatsApp" && <WhatsAppPanel />}
        </div>
      </div>
    </div>
  );
}
