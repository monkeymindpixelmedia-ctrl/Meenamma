import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, LogOut, Crown } from "lucide-react";
import { SavingsMandala } from "../components/SavingsMandala";
import { useAuth } from "../context/AuthContext";
import { api, payWithRazorpay, formatApiErrorDetail } from "../lib/api";

const QUICK = [100, 250, 500, 1000];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [kudams, setKudams] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [amount, setAmount] = useState(250);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newGoal, setNewGoal] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [bookings, setBookings] = useState([]);

  const load = useCallback(async () => {
    const [{ data: ks }, { data: bs }] = await Promise.all([
      api.get("/kudams"),
      api.get("/bookings"),
    ]);
    setKudams(ks);
    setBookings(bs);
    setActiveId((prev) => prev || (ks[0] && ks[0].id));
  }, []);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  const active = kudams?.find((k) => k.id === activeId);
  const progress = active ? Math.min(active.saved_amount / active.goal_amount, 1) : 0;

  const createKudam = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      const { data } = await api.post("/kudams", { name: newName, goal_amount: Number(newGoal) });
      setKudams((ks) => [data, ...(ks || [])]);
      setActiveId(data.id);
      setShowCreate(false);
      setNewName("");
      setNewGoal("");
    } catch (err) {
      setMsg(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    } finally {
      setBusy(false);
    }
  };

  const deposit = async () => {
    if (!active || !amount) return;
    setBusy(true);
    setMsg("");
    try {
      await payWithRazorpay(
        { purpose: "deposit", amount: Number(amount), kudam_id: active.id },
        user
      );
      setMsg("Your offering has been received.");
      await load();
    } catch (err) {
      setMsg(err.message || "Payment failed");
    } finally {
      setBusy(false);
    }
  };

  const doLogout = async () => {
    await logout();
    navigate("/home");
  };

  return (
    <div className="min-h-screen bg-henna silk-texture pb-28" data-testid="dashboard-page">
      <header className="glass-henna sticky top-0 z-30 px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-gold/60 text-[9px] uppercase" style={{ letterSpacing: "0.4em" }}>
            The Sovereign
          </p>
          <p className="font-serif text-sandalwood text-lg leading-tight" data-testid="dashboard-username">
            {user?.name || "…"}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {user?.role === "admin" && (
            <button onClick={() => navigate("/admin")} className="text-gold-shimmer" data-testid="admin-link-btn">
              <Crown size={18} strokeWidth={1.5} />
            </button>
          )}
          <button onClick={doLogout} className="text-gold/70 hover:text-gold transition-colors" data-testid="logout-btn">
            <LogOut size={18} strokeWidth={1.5} />
          </button>
        </div>
      </header>

      {kudams === null ? (
        <p className="text-center text-sandalwood/50 font-serif italic mt-24">Preparing the vessel…</p>
      ) : kudams.length === 0 && !showCreate ? (
        <div className="flex flex-col items-center px-8 mt-20 text-center">
          <SavingsMandala progress={0} size={220} />
          <h2 className="font-serif text-sandalwood text-2xl mt-8">Your vessel awaits</h2>
          <p className="text-sandalwood/60 text-xs leading-6 mt-3 max-w-xs">
            Consecrate your first Kudam — name it, set its gold mark, and begin the slow ceremony of filling.
          </p>
          <button className="btn-solid-gold w-full mt-8" onClick={() => setShowCreate(true)} data-testid="create-first-kudam-btn">
            Consecrate a Kudam
          </button>
        </div>
      ) : (
        <>
          {active && (
            <section className="flex flex-col items-center pt-10 px-8">
              <SavingsMandala progress={progress} size={272} />
              <h2 className="font-serif text-gold text-2xl mt-6" data-testid="active-kudam-name">
                {active.name}
              </h2>
              <p className="text-sandalwood/70 text-sm mt-1" data-testid="active-kudam-amounts">
                ₹{active.saved_amount.toLocaleString("en-IN")}
                <span className="text-sandalwood/40"> of ₹{active.goal_amount.toLocaleString("en-IN")}</span>
              </p>
              {active.status === "complete" && (
                <p className="text-gold-shimmer text-[10px] uppercase mt-2" style={{ letterSpacing: "0.35em" }}>
                  Kudam Complete
                </p>
              )}

              <div className="w-full mt-8 gold-border p-5 bg-henna-deep/50">
                <p className="text-gold/70 text-[9px] uppercase mb-4" style={{ letterSpacing: "0.4em" }}>
                  Pour an offering
                </p>
                <div className="flex gap-2 mb-4">
                  {QUICK.map((q) => (
                    <button
                      key={q}
                      onClick={() => setAmount(q)}
                      data-testid={`quick-amount-${q}`}
                      className={`flex-1 py-2 text-xs border transition-colors duration-300 ${
                        Number(amount) === q
                          ? "border-gold bg-gold text-henna font-semibold"
                          : "border-gold/40 text-gold"
                      }`}
                    >
                      ₹{q}
                    </button>
                  ))}
                </div>
                <input
                  className="input-ritual mb-4"
                  type="number"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  data-testid="deposit-amount-input"
                />
                <button className="btn-solid-gold w-full" onClick={deposit} disabled={busy} data-testid="deposit-btn">
                  {busy ? "Opening the till…" : `Offer ₹${Number(amount || 0).toLocaleString("en-IN")}`}
                </button>
                {msg && (
                  <p className="text-gold-shimmer text-xs italic font-serif mt-3 text-center" data-testid="deposit-msg">
                    {msg}
                  </p>
                )}
              </div>
            </section>
          )}

          <section className="px-8 mt-10">
            <div className="flex items-center justify-between mb-4">
              <p className="text-gold/70 text-[9px] uppercase" style={{ letterSpacing: "0.4em" }}>
                Your vessels
              </p>
              <button
                onClick={() => setShowCreate((s) => !s)}
                className="text-gold flex items-center gap-1 text-[10px] uppercase"
                style={{ letterSpacing: "0.2em" }}
                data-testid="new-kudam-btn"
              >
                <Plus size={14} /> New
              </button>
            </div>
            <div className="space-y-3">
              {kudams.map((k) => (
                <button
                  key={k.id}
                  onClick={() => setActiveId(k.id)}
                  data-testid={`kudam-card-${k.id}`}
                  className={`filigree-card w-full text-left p-4 transition-opacity duration-300 ${
                    k.id === activeId ? "" : "opacity-60"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-serif text-henna text-lg font-semibold">{k.name}</p>
                      <p className="text-henna/60 text-[11px] font-sans">
                        ₹{k.saved_amount.toLocaleString("en-IN")} / ₹{k.goal_amount.toLocaleString("en-IN")}
                      </p>
                    </div>
                    <span className="font-serif text-gold-dim text-2xl">
                      {Math.round(Math.min(k.saved_amount / k.goal_amount, 1) * 100)}%
                    </span>
                  </div>
                  <div className="h-1 bg-henna/10 mt-3">
                    <div
                      className="h-full bg-gold transition-all duration-700"
                      style={{ width: `${Math.min(k.saved_amount / k.goal_amount, 1) * 100}%` }}
                    />
                  </div>
                </button>
              ))}
            </div>
          </section>
        </>
      )}

      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="px-8 mt-8"
          >
            <form onSubmit={createKudam} className="gold-border p-5 bg-henna-deep/60 space-y-4">
              <p className="text-gold/70 text-[9px] uppercase" style={{ letterSpacing: "0.4em" }}>
                Consecrate a new Kudam
              </p>
              <input
                className="input-ritual"
                placeholder="Name it — e.g. Pongal Feast"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                data-testid="kudam-name-input"
              />
              <input
                className="input-ritual"
                type="number"
                min="1"
                placeholder="Gold mark (goal in ₹)"
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                required
                data-testid="kudam-goal-input"
              />
              {msg && <p className="text-gold-shimmer text-xs italic font-serif">{msg}</p>}
              <button className="btn-ritual w-full" disabled={busy} data-testid="kudam-create-submit">
                Consecrate
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {bookings.length > 0 && (
        <section className="px-8 mt-10">
          <p className="text-gold/70 text-[9px] uppercase mb-4" style={{ letterSpacing: "0.4em" }}>
            Claimed catch
          </p>
          <div className="space-y-3">
            {bookings.map((b) => (
              <div key={b.id} className="gold-border p-4 flex justify-between items-center" data-testid={`booking-row-${b.id}`}>
                <div>
                  <p className="font-serif text-sandalwood text-base">{b.product_name}</p>
                  <p className="text-sandalwood/50 text-[11px]">
                    {b.qty_kg} kg · pickup {b.pickup_date}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-gold text-sm">₹{b.amount.toLocaleString("en-IN")}</p>
                  <p className="text-gold-shimmer/70 text-[9px] uppercase" style={{ letterSpacing: "0.2em" }}>
                    {b.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
