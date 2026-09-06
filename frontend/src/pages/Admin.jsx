import React, { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, Upload, Sparkles, Shield, RefreshCw, Truck, Package, CheckCircle, Clock, MapPin, Send } from "lucide-react";
import { api, formatApiErrorDetail, imgUrl } from "../lib/api";
import {
  fetchStockPoints,
  fetchStockShipments,
  dispatchStockShipment,
  fetchLiveInventories,
  fetchLogisticsAuditLogs,
} from "../lib/logisticsSync";

const TABS = ["Overview", "Products", "Orders", "Kudams", "Customers", "WhatsApp", "Logistics & Hubs"];
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

function LogisticsPanel({ products }) {
  const [stockPoints, setStockPoints] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [inventories, setInventories] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dispatching, setDispatching] = useState(false);
  const [feedback, setFeedback] = useState("");

  // Default fallback fish catalog if products empty
  const fishCatalog = products && products.length > 0
    ? products
    : [
        { name: "Vanjaram (Seer Fish)", price_per_kg: 850 },
        { name: "White Pomfret (Vavval)", price_per_kg: 750 },
        { name: "Tiger Prawns (Iral)", price_per_kg: 600 },
        { name: "Sankara (Red Snapper)", price_per_kg: 450 },
      ];

  // Multi-person allocation state
  const [selectedHubs, setSelectedHubs] = useState({});
  const [hubAllocations, setHubAllocations] = useState({});

  const refreshLogistics = useCallback(async () => {
    setLoading(true);
    try {
      const [points, ships, invs, logs] = await Promise.all([
        fetchStockPoints(),
        fetchStockShipments(),
        fetchLiveInventories(),
        fetchLogisticsAuditLogs(),
      ]);
      setStockPoints(points);
      setShipments(ships);
      setInventories(invs);
      setAuditLogs(logs);

      // Initialize default allocations for hubs
      const initialSelected = {};
      const initialAlloc = {};
      points.forEach((p, idx) => {
        initialSelected[p.id] = idx < 2; // select first two by default (e.g. Ramesh & Suresh)
        initialAlloc[p.id] = {
          fish_name: fishCatalog[0]?.name || "Vanjaram (Seer Fish)",
          count: idx === 0 ? 1 : 2, // 1 fish for Ramesh, 2 fish for Suresh
          kg: idx === 0 ? 2.5 : 4.0,
        };
      });
      setSelectedHubs((prev) => (Object.keys(prev).length ? prev : initialSelected));
      setHubAllocations((prev) => (Object.keys(prev).length ? prev : initialAlloc));
    } catch (err) {
      console.error("Failed to load logistics data:", err);
    } finally {
      setLoading(false);
    }
  }, [fishCatalog]);

  useEffect(() => {
    refreshLogistics();
  }, [refreshLogistics]);

  const toggleHubSelection = (hubId) => {
    setSelectedHubs((prev) => ({ ...prev, [hubId]: !prev[hubId] }));
  };

  const updateAllocation = (hubId, field, value) => {
    setHubAllocations((prev) => ({
      ...prev,
      [hubId]: {
        ...(prev[hubId] || { fish_name: fishCatalog[0]?.name, count: 1, kg: 1.0 }),
        [field]: value,
      },
    }));
  };

  const handleDispatch = async () => {
    const targetHubs = stockPoints.filter((p) => selectedHubs[p.id]);
    if (targetHubs.length === 0) {
      alert("Please select at least one stock owner to ship fish to.");
      return;
    }

    setDispatching(true);
    setFeedback("");
    try {
      for (const hub of targetHubs) {
        const alloc = hubAllocations[hub.id] || {
          fish_name: fishCatalog[0]?.name,
          count: 1,
          kg: 2.0,
        };
        await dispatchStockShipment({
          hubId: hub.id,
          ownerName: hub.owner_name,
          pincode: hub.pincode,
          items: [
            {
              fish_name: alloc.fish_name,
              count: Number(alloc.count),
              kg: Number(alloc.kg),
              price_per_kg: 850,
            },
          ],
          notes: `Batch Harbor Dispatch to ${hub.owner_name} (${hub.pincode})`,
        });
      }
      setFeedback(`Shipment successfully dispatched to ${targetHubs.map((h) => h.owner_name).join(", ")}!`);
      await refreshLogistics();
    } catch (err) {
      setFeedback("Failed to dispatch shipment: " + err.message);
    } finally {
      setDispatching(false);
    }
  };

  return (
    <div className="space-y-8" data-testid="logistics-panel">
      {/* Header & Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-obsidian-canvas/80 border border-gold/20 p-6 rounded-2xl shadow-2xl">
        <div>
          <div className="flex items-center gap-2 text-gold text-xs uppercase tracking-widest font-mono">
            <Truck size={16} /> Hyperlocal Logistics & Stock Hubs
          </div>
          <h2 className="font-serif text-2xl text-gold-gradient mt-1">Multi-Stock Harbor Dispatcher</h2>
          <p className="text-xs text-[#A8A090] mt-1 max-w-2xl">
            Allocate morning catch directly to local stock point owners. Live two-way sync updates stock when owners click "Yes, I got the food", matching PIN codes for customer orders and riders.
          </p>
        </div>
        <button
          onClick={refreshLogistics}
          disabled={loading}
          className="btn-cyber-outline !py-2 !px-4 flex items-center gap-2 text-xs"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh Logistics
        </button>
      </div>

      {feedback && (
        <div className="p-4 rounded-xl bg-gold/10 border border-gold/40 text-gold-bright text-xs flex items-center gap-2">
          <CheckCircle size={16} /> {feedback}
        </div>
      )}

      {/* SECTION 1: Multi-Stock Allocation Dispatcher */}
      <div className="glass-card-dark border-filigree-gold p-6 rounded-2xl shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-gold/15 pb-3">
          <div>
            <h3 className="font-serif text-lg text-gold-gradient flex items-center gap-2">
              <Package size={18} className="text-gold" /> Step 1: Select Stock Owners & Fill Inventory
            </h3>
            <p className="text-[11px] text-[#A8A090] mt-0.5">
              Select stock points (e.g. Ramesh, Suresh) and assign individual fish counts and kilograms.
            </p>
          </div>
          <span className="badge-gold text-[10px]">PIN Code Routing</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stockPoints.map((hub) => {
            const isSelected = !!selectedHubs[hub.id];
            const alloc = hubAllocations[hub.id] || {
              fish_name: fishCatalog[0]?.name,
              count: 1,
              kg: 2.0,
            };

            return (
              <div
                key={hub.id}
                className={`p-4 rounded-xl border transition-all duration-300 ${
                  isSelected
                    ? "bg-gold/10 border-gold shadow-[0_0_15px_rgba(255,215,0,0.15)]"
                    : "bg-obsidian-canvas/40 border-gold/15 opacity-70 hover:opacity-100"
                }`}
              >
                <div className="flex items-start justify-between">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleHubSelection(hub.id)}
                      className="accent-[#FFD700] w-4 h-4 rounded"
                    />
                    <div>
                      <p className="text-sm font-medium text-[#F5F2EB]">{hub.owner_name}</p>
                      <p className="text-[10px] text-[#A8A090]">{hub.name}</p>
                    </div>
                  </label>
                  <span className="badge-emerald text-[9px] font-mono flex items-center gap-1">
                    <MapPin size={10} /> PIN {hub.pincode}
                  </span>
                </div>

                {isSelected && (
                  <div className="mt-4 pt-3 border-t border-gold/15 space-y-3">
                    <div>
                      <label className="text-[9px] uppercase tracking-widest text-[#A8A090] block mb-1">
                        Select Fish Type
                      </label>
                      <select
                        value={alloc.fish_name}
                        onChange={(e) => updateAllocation(hub.id, "fish_name", e.target.value)}
                        className="input-cyberpunk w-full text-xs py-1.5"
                      >
                        {fishCatalog.map((f) => (
                          <option key={f.name} value={f.name} className="bg-[#0b0c10] text-[#F5F2EB]">
                            {f.name} (₹{f.price_per_kg}/kg)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] uppercase tracking-widest text-[#A8A090] block mb-1">
                          Fish Count (Nos)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="50"
                          value={alloc.count}
                          onChange={(e) => updateAllocation(hub.id, "count", e.target.value)}
                          className="input-cyberpunk w-full text-xs py-1.5 font-mono"
                          placeholder="1 fish"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] uppercase tracking-widest text-[#A8A090] block mb-1">
                          Weight (Kg)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0.5"
                          max="100"
                          value={alloc.kg}
                          onChange={(e) => updateAllocation(hub.id, "kg", e.target.value)}
                          className="input-cyberpunk w-full text-xs py-1.5 font-mono"
                          placeholder="2.5 kg"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleDispatch}
            disabled={dispatching}
            className="btn-gold-cyber !py-3 !px-8 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 shadow-lg"
          >
            {dispatching ? (
              <>
                <RefreshCw size={14} className="animate-spin" /> Dispatching Shipments…
              </>
            ) : (
              <>
                <Send size={14} /> Dispatch Fish Shipments
              </>
            )}
          </button>
        </div>
      </div>

      {/* SECTION 2: Live Stock Points & Live Inventory */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hubs & Live Inventory */}
        <div className="glass-card-dark border-filigree-gold p-6 rounded-2xl shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-gold/15 pb-3">
            <h3 className="font-serif text-lg text-gold-gradient flex items-center gap-2">
              <Package size={16} className="text-gold" /> Live Hub Inventory
            </h3>
            <span className="text-[10px] text-[#A8A090]">Auto-updated on receipt</span>
          </div>

          <div className="space-y-3">
            {stockPoints.map((hub) => {
              const inv = inventories.find((i) => i.hub_id === hub.id);
              const items = inv?.items || [];

              return (
                <div key={hub.id} className="p-4 rounded-xl bg-obsidian-canvas/60 border border-gold/15 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#F5F2EB]">{hub.owner_name} · {hub.name}</p>
                      <p className="text-[10px] text-[#A8A090] font-mono">{hub.phone} · {hub.address}</p>
                    </div>
                    <span className="badge-gold text-[10px] font-mono">PIN {hub.pincode}</span>
                  </div>

                  <div className="pt-2 border-t border-gold/10">
                    <p className="text-[10px] uppercase tracking-wider text-gold-bright font-medium mb-1">
                      Current Stock in Shop:
                    </p>
                    {items.length === 0 ? (
                      <p className="text-xs text-[#A8A090] italic">No active stock recorded yet. Dispatched shipments will appear once confirmed by {hub.owner_name}.</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {items.map((it, idx) => (
                          <div key={idx} className="bg-[#0b0c10] p-2 rounded-lg border border-gold/20 text-xs flex justify-between items-center">
                            <span className="text-[#F5F2EB]">{it.fish_name}</span>
                            <span className="text-gold font-mono font-medium">{it.count} pcs ({it.kg} kg)</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dispatched Shipments Queue */}
        <div className="glass-card-dark border-filigree-gold p-6 rounded-2xl shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-gold/15 pb-3">
            <h3 className="font-serif text-lg text-gold-gradient flex items-center gap-2">
              <Truck size={16} className="text-gold" /> Shipment Pipeline
            </h3>
            <span className="text-[10px] text-[#A8A090]">{shipments.length} Total</span>
          </div>

          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {shipments.length === 0 ? (
              <p className="text-xs text-[#A8A090] italic text-center py-8">No shipments dispatched yet.</p>
            ) : (
              shipments.map((s) => (
                <div key={s.id} className="p-3.5 rounded-xl bg-obsidian-canvas/60 border border-gold/15 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-gold-bright font-semibold">#{s.shipment_id || s.id}</span>
                      <span className="text-xs text-[#F5F2EB] font-medium">&rarr; {s.owner_name}</span>
                      <span className="badge-gold text-[9px] font-mono">PIN {s.pincode}</span>
                    </div>
                    <p className="text-[11px] text-[#A8A090]">
                      {(s.items || []).map((it) => `${it.count} ${it.fish_name} (${it.kg} kg)`).join(", ")}
                    </p>
                    <p className="text-[9px] text-[#A8A090]/70 font-mono">
                      Dispatched: {s.dispatched_at ? new Date(s.dispatched_at).toLocaleTimeString() : "Just now"}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-[9px] font-mono uppercase px-2.5 py-1 rounded-full border ${
                        s.status === "received_at_hub"
                          ? "bg-emerald-950/60 text-emerald-400 border-emerald-500/40"
                          : "bg-amber-950/60 text-amber-400 border-amber-500/40 animate-pulse"
                      }`}
                    >
                      {s.status === "received_at_hub" ? "Received at Hub" : "En Route to Hub"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* SECTION 3: Live Logistics Audit Trail */}
      <div className="glass-card-dark border-filigree-gold p-6 rounded-2xl shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-gold/15 pb-3">
          <div>
            <h3 className="font-serif text-lg text-gold-gradient flex items-center gap-2">
              <Clock size={16} className="text-gold" /> Real-time Logistics Audit Trail
            </h3>
            <p className="text-[11px] text-[#A8A090] mt-0.5">
              Live audit events: Admin dispatches, stock member receipts, rider pickups, and customer deliveries.
            </p>
          </div>
          <span className="text-[10px] text-[#A8A090] font-mono">{auditLogs.length} Events Logged</span>
        </div>

        <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
          {auditLogs.length === 0 ? (
            <p className="text-xs text-[#A8A090] italic text-center py-6">No audit events recorded yet.</p>
          ) : (
            auditLogs.map((ev) => (
              <div key={ev.id || ev.slug} className="p-3 rounded-lg bg-obsidian-canvas/50 border border-gold/10 flex items-start justify-between text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="badge-emerald text-[9px] font-mono">PIN {ev.pincode}</span>
                    <span className="text-gold font-semibold">{ev.actor}</span>
                    <span className="text-[10px] text-[#A8A090] font-mono">
                      {ev.timestamp ? new Date(ev.timestamp).toLocaleString() : ""}
                    </span>
                  </div>
                  <p className="text-[#F5F2EB]">{ev.description}</p>
                </div>
                <span className="font-mono text-[9px] uppercase px-2 py-0.5 rounded bg-gold/10 text-gold border border-gold/25">
                  {ev.event_type}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
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

              {tab === "Logistics & Hubs" && <LogisticsPanel products={products} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
