import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, MessageSquare, Mail, ShieldCheck } from "lucide-react";
import { api, haptic, formatApiErrorDetail } from "../lib/api";
import { supabase } from "../lib/supabase";

function tokenFromURL() {
  return (
    new URLSearchParams(window.location.search).get("token") ||
    new URLSearchParams(window.location.hash.replace(/^#/, "?")).get("access_token") ||
    ""
  );
}

export default function ResetPassword() {
  const navigate = useNavigate();
  const [hasToken, setHasToken] = useState(false);
  const [method, setMethod] = useState("whatsapp"); // 'whatsapp' or 'email'

  // Email flow
  const [email, setEmail] = useState("");

  // WhatsApp flow
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Password fields
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  // States
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setHasToken(Boolean(tokenFromURL()));
  }, []);

  useEffect(() => {
    let t;
    if (countdown > 0) {
      t = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(t);
  }, [countdown]);

  const requestEmailLink = async () => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) throw error;
      setMessage("If that email has an account, a reset link is on its way.");
    } catch (err) {
      setError(
        err.message?.includes("504") || err.status === 504
          ? "Email server timed out (504). Please switch to the 'WhatsApp OTP' tab above for instant 1-tap reset."
          : err.message || "We could not send the reset email. Please try again."
      );
    } finally {
      setBusy(false);
    }
  };

  const sendWhatsAppOtp = async () => {
    const cleanPhone = phone.trim().replace(/[^0-9]/g, "");
    if (cleanPhone.length < 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");
    try {
      const { data } = await api.post("/auth/whatsapp/otp/send", {
        phone: cleanPhone,
        purpose: "Password Reset",
      });
      if (data.ok) {
        setOtpSent(true);
        setCountdown(60);
        setMessage("Verification code sent to your WhatsApp number.");
      } else {
        setError(data.detail || "Could not deliver WhatsApp OTP.");
      }
    } catch (err) {
      setError(formatApiErrorDetail(err.response?.data?.detail) || "Failed to send WhatsApp code.");
    } finally {
      setBusy(false);
    }
  };

  const resetWithWhatsAppOtp = async () => {
    const cleanPhone = phone.trim().replace(/[^0-9]/g, "");
    if (otp.length < 4) {
      setError("Please enter the verification code received on WhatsApp.");
      return;
    }
    if (password.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");
    try {
      const { data } = await api.post("/auth/whatsapp/reset-password", {
        phone: cleanPhone,
        code: otp.trim(),
        new_password: password,
      });
      if (data.ok) {
        setMessage("Password updated successfully! Redirecting to sign in…");
        setTimeout(() => navigate("/login", { replace: true }), 1500);
      }
    } catch (err) {
      setError(formatApiErrorDetail(err.response?.data?.detail) || "Failed to reset password.");
    } finally {
      setBusy(false);
    }
  };

  const setNewPasswordFromToken = async () => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setMessage("Your password is updated. Taking you to sign in…");
      setTimeout(() => navigate("/login", { replace: true }), 1200);
    } catch (err) {
      setError(err.message || "We could not reset your password. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-alabaster-paper paper-texture flex items-center justify-center px-6"
      data-testid="reset-password-page"
    >
      <div className="w-full max-w-sm card-white p-8 shadow-xl rounded-2xl">
        <h1 className="font-serif text-obsidian text-3xl text-center">
          {hasToken ? "Choose a new password" : "Reset your password"}
        </h1>

        {!hasToken && (
          <div className="flex bg-neutral-100 p-1 rounded-xl mt-6 border border-neutral-200">
            <button
              type="button"
              onClick={() => {
                setMethod("whatsapp");
                setError("");
                setMessage("");
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg transition-all ${
                method === "whatsapp"
                  ? "bg-white text-obsidian shadow-sm"
                  : "text-obsidian/60 hover:text-obsidian"
              }`}
            >
              <MessageSquare size={14} className="text-emerald-600" /> WhatsApp OTP
            </button>
            <button
              type="button"
              onClick={() => {
                setMethod("email");
                setError("");
                setMessage("");
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg transition-all ${
                method === "email"
                  ? "bg-white text-obsidian shadow-sm"
                  : "text-obsidian/60 hover:text-obsidian"
              }`}
            >
              <Mail size={14} /> Email Link
            </button>
          </div>
        )}

        <p className="text-obsidian/70 text-xs mt-4 text-center">
          {hasToken
            ? "Pick something only you would know."
            : method === "whatsapp"
            ? "Receive a 6-digit OTP on WhatsApp to instantly reset your password."
            : "We will email you a link to set a new one."}
        </p>

        {hasToken ? (
          <form
            className="space-y-4 mt-6"
            onSubmit={(e) => {
              e.preventDefault();
              haptic();
              setNewPasswordFromToken();
            }}
          >
            <div className="relative">
              <input
                className="input-minimal pr-10"
                type={showPw ? "text" : "password"}
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                data-testid="reset-password-input"
              />
              <button
                type="button"
                className="absolute right-1 top-1/2 -translate-y-1/2 text-obsidian/60 p-2"
                onClick={() => setShowPw((s) => !s)}
                data-testid="reset-password-toggle-btn"
              >
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {error && (
              <p className="text-red-700 text-xs italic font-serif" data-testid="reset-password-error">
                {error}
              </p>
            )}
            {message && (
              <p className="text-emerald-700 text-xs font-medium" data-testid="reset-password-message">
                {message}
              </p>
            )}

            <button
              className="btn-obsidian w-full !py-3"
              disabled={busy}
              data-testid="reset-password-submit-btn"
            >
              {busy ? "Working…" : "Set new password"}
            </button>
          </form>
        ) : method === "whatsapp" ? (
          <div className="space-y-4 mt-6">
            <div>
              <label className="block text-[10px] uppercase font-mono tracking-widest text-obsidian/60 mb-1">
                WhatsApp Phone Number
              </label>
              <div className="flex gap-2">
                <input
                  className="input-minimal flex-1"
                  type="tel"
                  placeholder="e.g. 9840123456"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={otpSent && countdown > 0}
                  data-testid="reset-phone-input"
                />
                <button
                  type="button"
                  onClick={sendWhatsAppOtp}
                  disabled={busy || (otpSent && countdown > 0)}
                  className="btn-obsidian !py-2 !px-3 text-xs whitespace-nowrap"
                >
                  {otpSent && countdown > 0 ? `${countdown}s` : otpSent ? "Resend" : "Send OTP"}
                </button>
              </div>
            </div>

            {otpSent && (
              <>
                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-widest text-obsidian/60 mb-1">
                    6-Digit Verification Code
                  </label>
                  <input
                    className="input-minimal tracking-widest font-mono text-center text-lg"
                    type="text"
                    maxLength={6}
                    placeholder="• • • • • •"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    data-testid="reset-otp-input"
                  />
                </div>

                <div className="relative">
                  <label className="block text-[10px] uppercase font-mono tracking-widest text-obsidian/60 mb-1">
                    Enter New Password
                  </label>
                  <input
                    className="input-minimal pr-10"
                    type={showPw ? "text" : "password"}
                    placeholder="New password (min 6 chars)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    data-testid="reset-password-input"
                  />
                  <button
                    type="button"
                    className="absolute right-1 bottom-1 text-obsidian/60 p-2"
                    onClick={() => setShowPw((s) => !s)}
                  >
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={resetWithWhatsAppOtp}
                  disabled={busy}
                  className="btn-obsidian w-full !py-3 flex items-center justify-center gap-2"
                >
                  <ShieldCheck size={16} /> {busy ? "Verifying…" : "Save New Password"}
                </button>
              </>
            )}

            {error && (
              <p className="text-red-700 text-xs italic font-serif" data-testid="reset-password-error">
                {error}
              </p>
            )}
            {message && (
              <p className="text-emerald-700 text-xs font-medium" data-testid="reset-password-message">
                {message}
              </p>
            )}
          </div>
        ) : (
          <form
            className="space-y-4 mt-6"
            onSubmit={(e) => {
              e.preventDefault();
              haptic();
              requestEmailLink();
            }}
          >
            <input
              className="input-minimal"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              data-testid="reset-email-input"
            />

            {error && (
              <p className="text-red-700 text-xs italic font-serif" data-testid="reset-password-error">
                {error}
              </p>
            )}
            {message && (
              <p className="text-emerald-700 text-xs font-medium" data-testid="reset-password-message">
                {message}
              </p>
            )}

            <button
              className="btn-obsidian w-full !py-3"
              disabled={busy}
              data-testid="reset-password-submit-btn"
            >
              {busy ? "Working…" : "Send reset link"}
            </button>
          </form>
        )}

        <Link
          className="block text-obsidian/60 text-xs mt-6 text-center underline underline-offset-4"
          to="/login"
          data-testid="reset-back-to-login-link"
        >
          Back to login
        </Link>
      </div>
    </div>
  );
}
