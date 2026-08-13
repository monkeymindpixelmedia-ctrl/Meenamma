import React, { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, Upload } from "lucide-react";
import { api, formatApiErrorDetail, imgUrl } from "../lib/api";

const TABS = ["Overview", "Products", "Orders", "Kudams", "Customers"];
const EMPTY = { name: "", tamil_name: "", price_per_kg: "", image: "", origin: "", story: "", handling: "", available: true };
const STATUSES = ["confirmed", "ready", "collected", "cancelled"];

function Stat({ label, value }) {
  return (
    <div className="filigree-card p-6 text-center">
      <p className="num-lg text-henna text-3xl">{value}</p>
      <p className="text-henna/60 text-[9px] uppercase mt-1" style={{ letterSpacing: "0.3em" }}>{label}</p>
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
      <label className="flex items-center gap-2 text-henna/70 text-xs">
        <input type="checkbox" checked={form.available} onChange={(e) => setForm({ ...form, available: e.target.checked })} className="accent-gold" data-testid="product-available-checkbox" />
        Available today
      </label>
      <div className="flex gap-3">
        <button className="btn-henna flex-1" disabled={busy} data-testid="product-save-btn">Save</button>
        <button type="button" className="btn-gold-outline flex-1" onClick={onCancel}>Cancel</button>
      </div>
    </form>
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
    <div className="min-h-screen bg-sandalwood-paper paper-texture pb-24 md:pb-16" data-testid="admin-page">
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 lg:px-16 pt-8">
        <p className="text-gold-dim text-[10px] uppercase" style={{ letterSpacing: "0.4em" }}>Store Manager</p>
        <h1 className="font-serif text-henna text-3xl md:text-4xl font-medium">Meenamma Store</h1>

        <div className="flex gap-1 mt-6 overflow-x-auto border-b border-gold/25">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              data-testid={`admin-tab-${t.toLowerCase()}`}
              className={`px-5 py-3 text-[10px] uppercase whitespace-nowrap border-b-2 -mb-px transition-colors duration-300 ${
                tab === t ? "text-henna font-semibold border-gold" : "text-henna/40 border-transparent"
              }`}
              style={{ letterSpacing: "0.22em" }}
            >
              {t}
            </button>
          ))}
        </div>

        {msg && <p className="text-henna text-xs italic font-serif mt-4">{msg}</p>}

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
                        <p className="font-serif text-henna text-lg leading-tight">{p.name}</p>
                        <p className="num text-henna/75 text-xs"><span className="rupee">₹</span>{p.price_per_kg}/kg</p>
                      </div>
                      <button
                        onClick={() => toggleAvailable(p)}
                        data-testid={`admin-toggle-${p.name.toLowerCase()}`}
                        className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${p.available ? "bg-gold" : "bg-henna/20"}`}
                        title={p.available ? "Available — click to hide" : "Hidden — click to show"}
                      >
                        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-300 ${p.available ? "left-[22px]" : "left-0.5"}`} />
                      </button>
                      <button onClick={() => setEditing(p)} className="text-gold-dim p-2" data-testid={`admin-edit-${p.name.toLowerCase()}`}><Pencil size={16} /></button>
                      <button onClick={() => deleteProduct(p.id)} className="text-henna/40 p-2" data-testid={`admin-delete-${p.name.toLowerCase()}`}><Trash2 size={16} /></button>
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
              {bookings.length === 0 && <p className="text-henna/50 font-serif italic mt-8">No orders yet.</p>}
              {bookings.map((b) => (
                <div key={b.id} className="card-white p-5">
                  <div className="flex justify-between flex-wrap gap-2">
                    <div>
                      <p className="font-serif text-henna text-lg">{b.product_name} · {b.qty_kg} kg</p>
                      <p className="text-henna/50 text-[11px]">{b.user?.name} ({b.user?.email})</p>
                      <p className="text-henna/50 text-[11px]">Delivery {b.pickup_date}{b.discount_percent > 0 && ` · ${b.discount_percent}% kudam discount`}</p>
                    </div>
                    <p className="text-henna text-base">₹{b.amount.toLocaleString("en-IN")}</p>
                  </div>
                  <div className="flex gap-2 mt-4">
                    {STATUSES.map((s) => (
                      <button
                        key={s}
                        onClick={() => setStatus(b.id, s)}
                        className={`flex-1 py-2 text-[9px] uppercase border transition-colors duration-300 ${
                          b.status === s ? "border-henna bg-henna text-gold-shimmer font-semibold" : "border-gold/30 text-henna/50"
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
              {kudams.length === 0 && <p className="text-henna/50 font-serif italic mt-8">No kudams yet.</p>}
              {kudams.map((k) => (
                <div key={k.id} className="filigree-card p-5">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-serif text-henna text-lg font-medium">{k.name}</p>
                      <p className="text-henna/50 text-[11px]">{k.user?.name} ({k.user?.email})</p>
                    </div>
                    <div className="text-right">
                      <p className="text-henna text-sm">₹{k.saved_amount.toLocaleString("en-IN")} / ₹{k.goal_amount.toLocaleString("en-IN")}</p>
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
                    <p className="font-serif text-henna text-lg">{u.name} {u.role === "admin" && <span className="text-gold-dim text-[9px] uppercase ml-1">admin</span>}</p>
                    <p className="text-henna/50 text-[11px]">{u.email}</p>
                  </div>
                  <p className="text-henna/60 text-[10px] text-right" style={{ letterSpacing: "0.1em" }}>
                    {u.kudam_count} kudams<br />{u.booking_count} orders
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
