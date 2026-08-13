import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, ArrowLeft, X } from "lucide-react";
import { api, formatApiErrorDetail } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const TABS = ["Overview", "Catch", "Bookings", "Kudams", "Patrons"];
const EMPTY = { name: "", tamil_name: "", price_per_kg: "", image: "", origin: "", story: "", handling: "", available: true };
const STATUSES = ["confirmed", "ready", "collected", "cancelled"];

function Stat({ label, value }) {
  return (
    <div className="filigree-card p-5 text-center">
      <p className="font-serif text-henna text-3xl font-semibold">{value}</p>
      <p className="text-henna/60 text-[9px] uppercase mt-1" style={{ letterSpacing: "0.3em" }}>{label}</p>
    </div>
  );
}

function ProductForm({ initial, onSave, onCancel, busy }) {
  const [form, setForm] = useState(initial);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSave({ ...form, price_per_kg: Number(form.price_per_kg) }); }}
      className="gold-border p-5 bg-henna-deep/60 space-y-3 mt-4"
      data-testid="product-form"
    >
      <div className="flex gap-3">
        <input className="input-ritual" placeholder="Name" value={form.name} onChange={set("name")} required data-testid="product-name-input" />
        <input className="input-ritual tamil" placeholder="தமிழ்" value={form.tamil_name} onChange={set("tamil_name")} />
      </div>
      <div className="flex gap-3">
        <input className="input-ritual" type="number" min="1" placeholder="₹ / kg" value={form.price_per_kg} onChange={set("price_per_kg")} required data-testid="product-price-input" />
        <input className="input-ritual" placeholder="Origin" value={form.origin} onChange={set("origin")} />
      </div>
      <input className="input-ritual" placeholder="Image URL" value={form.image} onChange={set("image")} />
      <textarea className="input-ritual" rows={2} placeholder="Source story" value={form.story} onChange={set("story")} />
      <input className="input-ritual" placeholder="Handling note" value={form.handling} onChange={set("handling")} />
      <label className="flex items-center gap-2 text-sandalwood/70 text-xs">
        <input type="checkbox" checked={form.available} onChange={(e) => setForm({ ...form, available: e.target.checked })} className="accent-gold" data-testid="product-available-checkbox" />
        Available today
      </label>
      <div className="flex gap-3">
        <button className="btn-solid-gold flex-1" disabled={busy} data-testid="product-save-btn">Save</button>
        <button type="button" className="btn-ritual flex-1" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("Overview");
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [kudams, setKudams] = useState([]);
  const [users, setUsers] = useState([]);
  const [editing, setEditing] = useState(null); // null | "new" | product obj
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
    if (!window.confirm("Remove this catch from the storefront?")) return;
    await api.delete(`/admin/products/${id}`);
    await load();
  };

  const setStatus = async (id, status) => {
    await api.patch(`/admin/bookings/${id}/status`, { status });
    await load();
  };

  return (
    <div className="min-h-screen bg-henna silk-texture pb-16" data-testid="admin-page">
      <header className="glass-henna sticky top-0 z-30 px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate("/dashboard")} className="text-gold/70" data-testid="admin-back-btn">
          <ArrowLeft size={18} strokeWidth={1.5} />
        </button>
        <div>
          <p className="text-gold/60 text-[9px] uppercase" style={{ letterSpacing: "0.4em" }}>The Curator</p>
          <p className="font-serif text-sandalwood text-lg leading-tight">{user?.name}</p>
        </div>
      </header>

      <div className="flex gap-1 px-4 pt-5 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            data-testid={`admin-tab-${t.toLowerCase()}`}
            className={`px-4 py-2 text-[10px] uppercase whitespace-nowrap border-b transition-colors duration-300 ${
              tab === t ? "text-gold-shimmer border-gold" : "text-sandalwood/40 border-transparent"
            }`}
            style={{ letterSpacing: "0.22em" }}
          >
            {t}
          </button>
        ))}
      </div>

      {msg && <p className="text-gold-shimmer text-xs italic font-serif text-center mt-4">{msg}</p>}

      <div className="px-6 pt-6">
        {tab === "Overview" && stats && (
          <div className="grid grid-cols-2 gap-4" data-testid="admin-stats">
            <Stat label="Patrons" value={stats.users} />
            <Stat label="Catches Listed" value={stats.products} />
            <Stat label="Bookings" value={stats.bookings} />
            <Stat label="Booking Revenue" value={`₹${stats.booking_revenue.toLocaleString("en-IN")}`} />
            <div className="col-span-2">
              <Stat label="Gold held in Kudams" value={`₹${stats.total_saved.toLocaleString("en-IN")}`} />
            </div>
          </div>
        )}

        {tab === "Catch" && (
          <div>
            <button className="btn-ritual w-full flex items-center justify-center gap-2" onClick={() => setEditing("new")} data-testid="admin-add-product-btn">
              <Plus size={14} /> Add a catch
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
                  <div className="gold-border p-4 flex items-center gap-4 bg-henna-deep/40">
                    <img src={p.image} alt={p.name} className="w-12 h-12 object-cover rounded-full border border-gold/50" />
                    <div className="flex-1 min-w-0">
                      <p className="font-serif text-sandalwood text-lg leading-tight">{p.name}</p>
                      <p className="text-gold text-xs">₹{p.price_per_kg}/kg · {p.available ? "Available" : "Off the boat"}</p>
                    </div>
                    <button onClick={() => setEditing(p)} className="text-gold/70 p-1" data-testid={`admin-edit-${p.name.toLowerCase()}`}><Pencil size={15} /></button>
                    <button onClick={() => deleteProduct(p.id)} className="text-gold/50 p-1" data-testid={`admin-delete-${p.name.toLowerCase()}`}><Trash2 size={15} /></button>
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

        {tab === "Bookings" && (
          <div className="space-y-3" data-testid="admin-bookings-list">
            {bookings.length === 0 && <p className="text-sandalwood/50 font-serif italic text-center mt-10">No claims yet.</p>}
            {bookings.map((b) => (
              <div key={b.id} className="gold-border p-4 bg-henna-deep/40">
                <div className="flex justify-between">
                  <div>
                    <p className="font-serif text-sandalwood text-base">{b.product_name} · {b.qty_kg} kg</p>
                    <p className="text-sandalwood/50 text-[11px]">{b.user?.name} ({b.user?.email})</p>
                    <p className="text-sandalwood/50 text-[11px]">Pickup {b.pickup_date}</p>
                  </div>
                  <p className="text-gold text-sm">₹{b.amount.toLocaleString("en-IN")}</p>
                </div>
                <div className="flex gap-2 mt-3">
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatus(b.id, s)}
                      className={`flex-1 py-1.5 text-[9px] uppercase border transition-colors duration-300 ${
                        b.status === s ? "border-gold bg-gold text-henna font-semibold" : "border-gold/30 text-gold/60"
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
          <div className="space-y-3" data-testid="admin-kudams-list">
            {kudams.length === 0 && <p className="text-sandalwood/50 font-serif italic text-center mt-10">No vessels consecrated yet.</p>}
            {kudams.map((k) => (
              <div key={k.id} className="filigree-card p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-serif text-henna text-lg font-semibold">{k.name}</p>
                    <p className="text-henna/60 text-[11px]">{k.user?.name} ({k.user?.email})</p>
                  </div>
                  <div className="text-right">
                    <p className="text-henna text-sm">₹{k.saved_amount.toLocaleString("en-IN")} / ₹{k.goal_amount.toLocaleString("en-IN")}</p>
                    <p className="text-gold-dim text-[9px] uppercase" style={{ letterSpacing: "0.2em" }}>{k.status}</p>
                  </div>
                </div>
                <div className="h-1 bg-henna/10 mt-3">
                  <div className="h-full bg-gold" style={{ width: `${Math.min(k.saved_amount / k.goal_amount, 1) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "Patrons" && (
          <div className="space-y-3" data-testid="admin-users-list">
            {users.map((u) => (
              <div key={u.id} className="gold-border p-4 bg-henna-deep/40 flex justify-between items-center">
                <div>
                  <p className="font-serif text-sandalwood text-base">{u.name} {u.role === "admin" && <span className="text-gold-shimmer text-[9px] uppercase ml-1">curator</span>}</p>
                  <p className="text-sandalwood/50 text-[11px]">{u.email}</p>
                </div>
                <p className="text-gold/70 text-[10px] text-right" style={{ letterSpacing: "0.1em" }}>
                  {u.kudam_count} kudams<br />{u.booking_count} bookings
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
