import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { api, formatApiErrorDetail, haptic } from "../lib/api";

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
    <div className="min-h-screen bg-alabaster-paper paper-texture flex flex-col items-center justify-center px-6 py-12" data-testid="register-page">
      <motion.div
        className="w-full max-w-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex flex-col items-center mb-10">
          <h1 className="font-serif text-obsidian text-3xl font-medium">Create your account</h1>
          <p className="text-obsidian/70 text-sm mt-2">Sign up to continue.</p>
        </div>

        <form onSubmit={submit} className="space-y-6">
          <input
            className="input-minimal"
            placeholder="Your name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            data-testid="register-name-input"
          />
          <input
            className="input-minimal"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            data-testid="register-email-input"
          />
          {!existingUser && (
            <div>
              <input
                className="input-minimal"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(event) => { setPassword(event.target.value); setPwTouched(true); }}
                required
                data-testid="register-password-input"
              />
              {pwTouched && (
                <ul className="mt-2 space-y-1">
                  {pwRules.map((rule) => (
                    <li key={rule.label} className={`flex items-center gap-1.5 text-xs font-serif ${rule.ok ? "text-green-700" : "text-obsidian/60"}`}>
                      <span>{rule.ok ? "✓" : "·"}</span>
                      {rule.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <input
            className="input-minimal num"
            placeholder="PIN code (optional)"
            value={pincode}
            onChange={(event) => setPincode(event.target.value)}
            pattern="[0-9]{6}"
            maxLength={6}
            data-testid="register-pincode-input"
          />
          {error && <p className="text-obsidian text-sm italic font-serif" data-testid="register-error">{error}</p>}
          <button className="btn-obsidian w-full" disabled={busy || (!existingUser && !pwValid)} data-testid="register-submit-btn">
            {busy ? "Creating account…" : "Sign up"}
          </button>
        </form>

        {!existingUser && (
          <>
            <div className="gold-rule my-6" />
            <button
              type="button"
              className="w-full flex items-center justify-center gap-3 border border-gold/60 bg-white py-3.5 text-obsidian text-xs uppercase hover:bg-gold/10 transition-colors duration-300"
              style={{ letterSpacing: "0.18em" }}
              onClick={doGoogleSignup}
              disabled={busy || googleEnabled !== true}
              data-testid="google-register-btn"
            >
              {googleEnabled === false ? "Google sign-in unavailable" : "Sign up with Google"}
            </button>
            {googleEnabled === false && (
              <p className="text-obsidian/60 text-xs mt-2 text-center" data-testid="google-register-unavailable">
                Google sign-in is not configured.
              </p>
            )}
          </>
        )}

        <p className="text-obsidian/70 text-sm mt-8 text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-obsidian font-medium underline underline-offset-4 decoration-gold" data-testid="goto-login-link">Log in</Link>
        </p>
      </motion.div>
    </div>
  );
}
