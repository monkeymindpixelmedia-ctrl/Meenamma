import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { redirectToThirdPartyLogin } from "supertokens-auth-react/recipe/thirdparty";
import { useAuth } from "../context/AuthContext";
import { formatApiErrorDetail, haptic } from "../lib/api";

function FiligreeLogo() {
  return (
    <svg viewBox="0 0 60 60" className="w-14 h-14">
      {[...Array(8)].map((_, i) => (
        <path key={i} transform={`rotate(${i * 45}, 30, 30)`} d="M 30 6 Q 35 12 30 18 Q 25 12 30 6" fill="none" stroke="#C5A059" strokeWidth="1" />
      ))}
      <text x="30" y="36" textAnchor="middle" fill="#4A1C17" fontSize="14" className="tamil">மீ</text>
    </svg>
  );
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const doLogin = async (em, pw) => {
    setBusy(true);
    setError("");
    try {
      const result = await login(em, pw);
      navigate(result?.verificationRequired ? "/auth/verify-email" : "/dashboard");
    } catch (err) {
      setError(formatApiErrorDetail(err.response?.data?.detail) || err.message || "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const loginWithGoogle = async () => {
    haptic();
    setBusy(true);
    setError("");
    try {
      const response = await redirectToThirdPartyLogin({ thirdPartyId: "google" });
      if (response.status !== "OK") throw new Error("Google sign-in is not available right now.");
    } catch (err) {
      setError(err.message || "Could not start Google sign-in.");
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-alabaster-paper paper-texture flex flex-col items-center justify-center px-6" data-testid="login-page">
      <motion.div
        className="w-full max-w-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex flex-col items-center mb-10">
          <FiligreeLogo />
          <h1 className="font-serif text-obsidian text-3xl font-medium mt-4">Welcome back</h1>
          <p className="text-obsidian/70 text-sm mt-2">Your kudam has been waiting.</p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); haptic(); doLogin(email, password); }} className="space-y-6">
          <input
            className="input-minimal"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            data-testid="login-email-input"
          />
          <div className="relative">
            <input
              className="input-minimal pr-10"
              type={showPw ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              data-testid="login-password-input"
            />
            <button
              type="button"
              className="absolute right-1 top-1/2 -translate-y-1/2 text-obsidian/60 p-2"
              onClick={() => setShowPw((s) => !s)}
              data-testid="password-toggle-btn"
            >
              {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {error && <p className="text-obsidian text-sm italic font-serif" data-testid="login-error">{error}</p>}
          <button className="btn-obsidian w-full" disabled={busy} data-testid="login-submit-btn">
            {busy ? "Opening…" : "Enter"}
          </button>
        </form>

        <div className="gold-rule my-8" />

        <button
          type="button"
          className="w-full flex items-center justify-center gap-3 border border-gold/60 bg-white py-3.5 text-obsidian text-xs uppercase hover:bg-gold/10 transition-colors duration-300"
          style={{ letterSpacing: "0.18em" }}
          onClick={loginWithGoogle}
          disabled={busy}
          data-testid="google-login-btn"
        >
          Continue with Google
        </button>

        <p className="text-obsidian/70 text-sm mt-8 text-center">
          New here?{" "}
          <Link to="/register" className="text-obsidian font-medium underline underline-offset-4 decoration-gold" data-testid="goto-register-link">
            Begin your Kudam
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
