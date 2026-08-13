import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { formatApiErrorDetail } from "../lib/api";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await register(name, email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-henna-deep silk-texture flex flex-col justify-center px-8" data-testid="register-page">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="text-gold/60 text-[10px] uppercase" style={{ letterSpacing: "0.45em" }}>
          The First Offering
        </p>
        <h1 className="font-serif text-sandalwood text-4xl font-medium mt-3">
          Begin your <span className="text-gold italic">Kudam</span>
        </h1>

        <form onSubmit={submit} className="mt-10 space-y-5">
          <input
            className="input-ritual"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            data-testid="register-name-input"
          />
          <input
            className="input-ritual"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            data-testid="register-email-input"
          />
          <input
            className="input-ritual"
            type="password"
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            data-testid="register-password-input"
          />
          {error && (
            <p className="text-gold-shimmer text-xs italic font-serif" data-testid="register-error">
              {error}
            </p>
          )}
          <button className="btn-solid-gold w-full" disabled={busy} data-testid="register-submit-btn">
            {busy ? "Consecrating…" : "Begin the Ceremony"}
          </button>
        </form>

        <p className="text-sandalwood/50 text-xs mt-8 text-center">
          Already among us?{" "}
          <Link to="/login" className="text-gold underline underline-offset-4" data-testid="goto-login-link">
            Enter
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
