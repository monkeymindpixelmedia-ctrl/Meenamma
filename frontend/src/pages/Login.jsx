import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { api, formatApiErrorDetail, haptic } from "../lib/api";

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

function ArrowRightIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
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
        className="absolute -top-32 -left-32 w-[600px] h-[600px] text-amber-500/10 animate-[spin_120s_linear_infinite]"
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
        className="absolute -bottom-40 -right-40 w-[700px] h-[700px] text-yellow-500/10 animate-[spin_160s_linear_infinite_reverse]"
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

function WhatsAppIcon({ className }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
    </svg>
  );
}

export default function Login() {
  const { login, loginWithGoogle, loginWithPhoneOtp, sendPhoneOtp } = useAuth();
  const navigate = useNavigate();
  const [loginRole, setLoginRole] = useState("normal"); // "normal" | "student"
  const [method, setMethod] = useState("whatsapp"); // "whatsapp" | "password"
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(null);

  useEffect(() => {
    let active = true;
    const request = api.get?.("/config/auth");
    if (!request) return undefined;
    request
      .then(({ data }) => active && setGoogleEnabled(data?.google_enabled === true))
      .catch(() => active && setGoogleEnabled(false));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (otpTimer <= 0) return;
    const t = setInterval(() => setOtpTimer((v) => v - 1), 1000);
    return () => clearInterval(t);
  }, [otpTimer]);

  const handleSendOtp = async (e) => {
    e?.preventDefault();
    const clean = phone.replace(/[^0-9]/g, "");
    if (clean.length < 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await sendPhoneOtp(clean, "Sign In");
      setOtpSent(true);
      setOtpTimer(60);
      setSuccess("Verification code sent to your WhatsApp!");
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Failed to send WhatsApp code.");
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    if (!otp.trim()) {
      setError("Please enter the 6-digit code received on WhatsApp.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await loginWithPhoneOtp(phone, otp.trim());
      if (result?.verificationRequired) {
        navigate("/auth/verify-email");
      } else if (result?.role === "admin") {
        navigate("/admin");
      } else if (result?.account_type === "student" || loginRole === "student") {
        navigate("/referral");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Invalid or expired verification code.");
    } finally {
      setBusy(false);
    }
  };

  const doLogin = async (em, pw) => {
    setBusy(true);
    setError("");
    try {
      const result = await login(em, pw);
      if (result?.verificationRequired) {
        navigate("/auth/verify-email");
      } else if (result?.role === "admin") {
        navigate("/admin");
      } else if (result?.account_type === "student" || loginRole === "student") {
        navigate("/referral");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setError(formatApiErrorDetail(err.response?.data?.detail) || err.message || "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const doGoogleLogin = async () => {
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
      data-testid="login-page"
    >
      <BackgroundMandala />

      <motion.div
        className="w-full max-w-md glass-card-dark rounded-2xl p-8 relative z-10 border border-amber-500/25"
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex flex-col items-center mb-8 text-center">
          <FiligreeLogo />
          <h1 className="font-serif text-amber-100 text-3xl font-medium tracking-wide">
            MEENAMMA <span className="text-amber-400 text-xs block font-sans tracking-[0.3em] uppercase mt-1 font-semibold">Micro-Savings</span>
          </h1>
          <p className="text-amber-200/60 text-xs mt-2 font-mono uppercase tracking-wider">Neo-Traditional Wealth Ritual</p>
        </div>

        {/* Normal vs Student Role Selector */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-black/40 border border-amber-500/20 rounded-lg mb-6">
          <button
            type="button"
            onClick={() => {
              haptic();
              setLoginRole("normal");
            }}
            className={`py-2 px-3 text-xs font-mono tracking-wider rounded-md transition-all ${
              loginRole === "normal"
                ? "bg-amber-400 text-black font-bold shadow-[0_0_12px_rgba(255,215,0,0.3)]"
                : "text-amber-200/60 hover:text-amber-100"
            }`}
            data-testid="login-role-normal"
          >
            Normal Member
          </button>
          <button
            type="button"
            onClick={() => {
              haptic();
              setLoginRole("student");
            }}
            className={`py-2 px-3 text-xs font-mono tracking-wider rounded-md transition-all ${
              loginRole === "student"
                ? "bg-amber-400 text-black font-bold shadow-[0_0_12px_rgba(255,215,0,0.3)]"
                : "text-amber-200/60 hover:text-amber-100"
            }`}
            data-testid="login-role-student"
          >
            Student Partner
          </button>
        </div>

        {loginRole === "student" && (
          <div className="mb-6 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-left">
            <p className="text-[11px] font-mono text-amber-300 font-semibold tracking-wide">
              🎓 Student Partner Access
            </p>
            <p className="text-[11px] text-amber-100/70 mt-1 leading-relaxed">
              Log in to track your serial code, 60-day ₹5,050 Kudam milestone, and active commission payouts.
            </p>
          </div>
        )}

        <div className="flex border-b border-amber-500/20 mb-8 relative">
          <div className="w-1/2 text-center py-2 font-mono text-xs uppercase tracking-widest text-amber-300 font-semibold border-b-2 border-amber-400">
            Sign In
          </div>
          <Link
            to={`/register?role=${loginRole}`}
            className="w-1/2 text-center py-2 font-mono text-xs uppercase tracking-widest text-amber-100/50 hover:text-amber-200 transition-colors"
          >
            Sign Up
          </Link>
        </div>

        {/* Login Method Toggle: WhatsApp OTP vs Password */}
        <div className="flex rounded-lg bg-black/40 border border-amber-500/20 p-1 mb-6">
          <button
            type="button"
            onClick={() => {
              haptic();
              setMethod("whatsapp");
              setError("");
              setSuccess("");
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-mono rounded transition-all ${
              method === "whatsapp"
                ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-semibold shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                : "text-amber-200/60 hover:text-amber-100"
            }`}
          >
            <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span>WhatsApp OTP</span>
          </button>
          <button
            type="button"
            onClick={() => {
              haptic();
              setMethod("password");
              setError("");
              setSuccess("");
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-mono rounded transition-all ${
              method === "password"
                ? "bg-amber-400 text-black font-semibold shadow-[0_0_12px_rgba(255,215,0,0.3)]"
                : "text-amber-200/60 hover:text-amber-100"
            }`}
          >
            <LockIcon className="w-3.5 h-3.5" />
            <span>Password</span>
          </button>
        </div>

        {method === "whatsapp" ? (
          <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className="space-y-5">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-amber-200/70 mb-1.5">
                WhatsApp Mobile Number
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 font-mono text-xs text-amber-400/80 font-bold select-none">
                  +91
                </span>
                <input
                  className="input-cyberpunk input-minimal pl-12 pr-4 w-full font-mono text-sm tracking-widest"
                  type="tel"
                  maxLength="10"
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))}
                  required
                  data-testid="login-phone-input"
                />
              </div>
            </div>

            {otpSent && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-amber-200/70">
                    6-Digit Verification Code
                  </label>
                  {otpTimer > 0 ? (
                    <span className="text-[10px] font-mono text-amber-400/60">
                      Resend in {otpTimer}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={busy}
                      className="text-[10px] font-mono text-emerald-400 hover:underline"
                    >
                      Resend Code
                    </button>
                  )}
                </div>
                <input
                  className="input-cyberpunk input-minimal w-full font-mono text-lg text-center tracking-[0.4em]"
                  type="text"
                  maxLength="6"
                  placeholder="••••••"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
                  autoFocus
                  required
                  data-testid="login-otp-input"
                />
              </motion.div>
            )}

            {success && (
              <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-mono">
                {success}
              </div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-lg bg-red-950/40 border border-red-500/30 text-red-300 text-xs font-serif italic"
                data-testid="login-error"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              className="btn-gold-cyber btn-obsidian w-full flex items-center justify-center gap-2 group mt-2 !py-3"
              disabled={busy}
              data-testid="login-whatsapp-submit-btn"
            >
              {busy ? (
                <span>Please wait…</span>
              ) : otpSent ? (
                <>
                  <span>Verify & Log In</span>
                  <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              ) : (
                <>
                  <WhatsAppIcon className="w-4 h-4 text-emerald-400" />
                  <span>Send WhatsApp OTP</span>
                </>
              )}
            </button>
          </form>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              haptic();
              doLogin(email, password);
            }}
            className="space-y-5"
          >
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
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  data-testid="login-email-input"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-mono uppercase tracking-wider text-amber-200/70">
                  Password
                </label>
                <Link
                  to="/auth/reset-password"
                  className="text-amber-400/80 hover:text-amber-300 text-xs font-mono underline underline-offset-4 decoration-amber-400/30 transition-colors"
                  data-testid="forgot-password-link"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <LockIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400/60 pointer-events-none" />
                <input
                  className="input-cyberpunk input-minimal pl-10 pr-10 w-full"
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  data-testid="login-password-input"
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-amber-300/60 hover:text-amber-200 p-2 transition-colors"
                  onClick={() => setShowPw((s) => !s)}
                  data-testid="password-toggle-btn"
                >
                  {showPw ? (
                    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-lg bg-red-950/40 border border-red-500/30 text-red-300 text-xs font-serif italic"
                data-testid="login-error"
              >
                {error}
              </motion.div>
            )}

            <button
              className="btn-gold-cyber btn-obsidian w-full flex items-center justify-center gap-2 group mt-2"
              disabled={busy}
              data-testid="login-submit-btn"
            >
              {busy ? (
                <span>Signing in…</span>
              ) : (
                <>
                  <span>Log In</span>
                  <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        )}

        <div className="flex items-center my-6">
          <div className="flex-1 gold-rule" />
          <span className="px-3 text-[10px] font-mono uppercase tracking-widest text-amber-300/40">or</span>
          <div className="flex-1 gold-rule" />
        </div>

        <button
          type="button"
          className="btn-google-cyber w-full py-3.5 flex items-center justify-center gap-3 text-amber-100/90 font-mono tracking-widest uppercase hover:bg-amber-400/10 transition-all duration-300"
          onClick={doGoogleLogin}
          disabled={busy || googleEnabled !== true}
          data-testid="google-login-btn"
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
          {googleEnabled === false ? "Google sign-in unavailable" : "Continue with Google"}
        </button>

        {googleEnabled === false && (
          <p className="text-amber-200/50 text-xs mt-3 text-center font-mono" data-testid="google-unavailable">
            Google sign-in is not configured.
          </p>
        )}

        <p className="text-amber-100/60 text-xs mt-8 text-center font-sans">
          New to Meenamma?{" "}
          <Link
            to="/register"
            className="text-amber-300 font-medium underline underline-offset-4 decoration-amber-400/40 hover:text-amber-200 transition-colors"
            data-testid="goto-register-link"
          >
            Create an account
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
