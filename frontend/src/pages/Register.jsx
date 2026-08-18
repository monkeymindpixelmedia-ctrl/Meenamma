import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { api, formatApiErrorDetail, haptic } from "../lib/api";

function UserIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function MailIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function LockIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}

function MapPinIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function ArrowRightIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  );
}

function CheckCircleIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function CircleIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}

function FiligreeLogo() {
  return (
    <div className="relative flex items-center justify-center w-20 h-20 mb-2">
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-500/20 to-yellow-400/20 blur-xl animate-pulse" />
      <svg viewBox="0 0 60 60" className="w-16 h-16 relative z-10 filter drop-shadow-[0_0_8px_rgba(255,215,0,0.5)]">
        {[...Array(8)].map((_, i) => (
          <path
            key={i}
            transform={`rotate(${i * 45}, 30, 30)`}
            d="M 30 5 Q 36 12 30 19 Q 24 12 30 5"
            fill="none"
            stroke="#FFD700"
            strokeWidth="1.2"
            opacity="0.85"
          />
        ))}
        <circle cx="30" cy="30" r="14" fill="url(#goldGradient)" opacity="0.15" />
        <defs>
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFD700" />
            <stop offset="100%" stopColor="#C59B27" />
          </linearGradient>
        </defs>
        <text x="30" y="37" textAnchor="middle" fill="#FFD700" fontSize="16" fontWeight="bold" className="tamil">
          மீ
        </text>
      </svg>
    </div>
  );
}

function BackgroundMandala() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <svg
        className="absolute -top-32 -right-32 w-[600px] h-[600px] text-amber-500/10 animate-[spin_120s_linear_infinite]"
        viewBox="0 0 200 200"
      >
        {[...Array(12)].map((_, i) => (
          <g key={i} transform={`rotate(${i * 30} 100 100)`}>
            <circle cx="100" cy="40" r="25" fill="none" stroke="currentColor" strokeWidth="0.5" />
            <path d="M100 15 L105 35 L100 55 L95 35 Z" fill="none" stroke="currentColor" strokeWidth="0.5" />
          </g>
        ))}
      </svg>
      <svg
        className="absolute -bottom-40 -left-40 w-[700px] h-[700px] text-yellow-500/10 animate-[spin_160s_linear_infinite_reverse]"
        viewBox="0 0 200 200"
      >
        {[...Array(16)].map((_, i) => (
          <g key={i} transform={`rotate(${i * 22.5} 100 100)`}>
            <circle cx="100" cy="30" r="20" fill="none" stroke="currentColor" strokeWidth="0.5" />
          </g>
        ))}
      </svg>
    </div>
  );
}

export default function Register() {
  const { register, user: existingUser, refreshUser, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pincode, setPincode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [pwTouched, setPwTouched] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(null);

  React.useEffect(() => {
    if (existingUser) {
      if (existingUser.name && !name) setName(existingUser.name);
      if (existingUser.email && !email) setEmail(existingUser.email);
      if (existingUser.pincode && !pincode) setPincode(existingUser.pincode);
    }
  }, [existingUser, name, email, pincode]);

  React.useEffect(() => {
    let active = true;
    api.get("/config/auth")
      .then(({ data }) => active && setGoogleEnabled(data?.google_enabled === true))
      .catch(() => active && setGoogleEnabled(false));
    return () => { active = false; };
  }, []);

  const pwRules = [
    { ok: password.length >= 8, label: "At least 8 characters" },
    { ok: /[0-9]/.test(password), label: "At least one number" },
  ];
  const pwValid = pwRules.every((rule) => rule.ok);

  const submit = async (event) => {
    event.preventDefault();
    haptic();
    setBusy(true);
    setError("");
    try {
      const referred_by_code = localStorage.getItem("meenamma_ref") || undefined;
      let loggedInUser;

      if (existingUser) {
        await api.post("/profile/bootstrap", {
          name,
          daily_plan: 5,
          pincode,
          cadence: "manual",
          referred_by_code,
        });
        localStorage.removeItem("meenamma_ref");
        loggedInUser = await refreshUser();
      } else {
        loggedInUser = await register(name, email, password, 5, {
          pincode,
          cadence: "manual",
          referred_by_code,
        });
      }

      navigate(loggedInUser?.verificationRequired ? "/auth/verify-email" : "/dashboard");
    } catch (err) {
      setError(formatApiErrorDetail(err.response?.data?.detail) || err.message || "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const doGoogleSignup = async () => {
    if (googleEnabled !== true) {
      if (googleEnabled === false) setError("Google sign-in is not configured.");
      return;
    }
    haptic();
    setBusy(true);
    setError("");
    try {
      await loginWithGoogle();
    } catch (err) {
      setError(err.message || "Could not start Google sign-in.");
      setBusy(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-obsidian-canvas flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden text-amber-50 selection:bg-amber-400 selection:text-black"
      data-testid="register-page"
    >
      <BackgroundMandala />

      <motion.div
        className="w-full max-w-md glass-card-dark rounded-2xl p-8 relative z-10 border border-amber-500/25"
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <FiligreeLogo />
          <h1 className="font-serif text-amber-100 text-3xl font-medium tracking-wide">
            MEENAMMA <span className="text-amber-400 text-xs block font-sans tracking-[0.3em] uppercase mt-1 font-semibold">Micro-Savings</span>
          </h1>
          <p className="text-amber-200/60 text-xs mt-2 font-mono uppercase tracking-wider">Start Your Daily Kudam Wealth Ritual</p>
        </div>

        {/* Tab Navigation Switcher */}
        <div className="flex border-b border-amber-500/20 mb-8 relative">
          <Link
            to="/login"
            className="w-1/2 text-center py-2 font-mono text-xs uppercase tracking-widest text-amber-100/50 hover:text-amber-200 transition-colors"
          >
            Sign In
          </Link>
          <div className="w-1/2 text-center py-2 font-mono text-xs uppercase tracking-widest text-amber-300 font-semibold border-b-2 border-amber-400">
            Sign Up
          </div>
        </div>

        {/* Form Container */}
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-amber-200/70 mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400/60 pointer-events-none" />
              <input
                className="input-cyberpunk input-minimal pl-10 w-full"
                placeholder="Your name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                data-testid="register-name-input"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-amber-200/70 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <MailIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400/60 pointer-events-none" />
              <input
                className="input-cyberpunk input-minimal pl-10 w-full"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                data-testid="register-email-input"
              />
            </div>
          </div>

          {!existingUser && (
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-amber-200/70 mb-1.5">
                Password
              </label>
              <div className="relative">
                <LockIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400/60 pointer-events-none" />
                <input
                  className="input-cyberpunk input-minimal pl-10 w-full"
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(event) => { setPassword(event.target.value); setPwTouched(true); }}
                  required
                  data-testid="register-password-input"
                />
              </div>

              {pwTouched && (
                <ul className="mt-2.5 space-y-1.5 p-2.5 rounded-lg bg-amber-950/20 border border-amber-500/15">
                  {pwRules.map((rule) => (
                    <li key={rule.label} className={`flex items-center gap-2 text-xs font-mono ${rule.ok ? "text-emerald-400 font-medium" : "text-amber-200/50"}`}>
                      {rule.ok ? <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-400" /> : <CircleIcon className="w-3.5 h-3.5 text-amber-200/40" />}
                      <span>{rule.label}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-amber-200/70 mb-1.5">
              Postal PIN Code <span className="text-amber-400/40">(Optional)</span>
            </label>
            <div className="relative">
              <MapPinIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400/60 pointer-events-none" />
              <input
                className="input-cyberpunk input-minimal num pl-10 w-full"
                placeholder="600001"
                value={pincode}
                onChange={(event) => setPincode(event.target.value)}
                pattern="[0-9]{6}"
                maxLength={6}
                data-testid="register-pincode-input"
              />
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-lg bg-red-950/40 border border-red-500/30 text-red-300 text-xs font-serif italic"
              data-testid="register-error"
            >
              {error}
            </motion.div>
          )}

          <button
            className="btn-gold-cyber btn-obsidian w-full flex items-center justify-center gap-2 group mt-4"
            disabled={busy || (!existingUser && !pwValid)}
            data-testid="register-submit-btn"
          >
            {busy ? (
              <span>Creating account…</span>
            ) : (
              <>
                <span>Sign Up</span>
                <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        {!existingUser && (
          <>
            <div className="flex items-center my-6">
              <div className="flex-1 gold-rule" />
              <span className="px-3 text-[10px] font-mono uppercase tracking-widest text-amber-300/40">or</span>
              <div className="flex-1 gold-rule" />
            </div>

            <button
              type="button"
              className="btn-google-cyber w-full py-3.5 flex items-center justify-center gap-3 text-amber-100/90 font-mono tracking-widest uppercase hover:bg-amber-400/10 transition-all duration-300"
              onClick={doGoogleSignup}
              disabled={busy || googleEnabled !== true}
              data-testid="google-register-btn"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 10.8 0 12.5s.7 2.8 1.9 5.2l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 17C3.7 20.7 7.5 24 12 24z"
                />
              </svg>
              {googleEnabled === false ? "Google sign-in unavailable" : "Sign up with Google"}
            </button>

            {googleEnabled === false && (
              <p className="text-amber-200/50 text-xs mt-3 text-center font-mono" data-testid="google-register-unavailable">
                Google sign-in is not configured.
              </p>
            )}
          </>
        )}

        <p className="text-amber-100/60 text-xs mt-8 text-center font-sans">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-amber-300 font-medium underline underline-offset-4 decoration-amber-400/40 hover:text-amber-200 transition-colors"
            data-testid="goto-login-link"
          >
            Log in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}


