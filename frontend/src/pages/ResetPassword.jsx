import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import {
  sendPasswordResetEmail,
  submitNewPassword,
} from "supertokens-auth-react/recipe/emailpassword";
import { haptic } from "../lib/api";

function tokenFromURL() {
  return new URLSearchParams(window.location.search).get("token") || "";
}

export default function ResetPassword() {
  const navigate = useNavigate();
  const [hasToken, setHasToken] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setHasToken(Boolean(tokenFromURL()));
  }, []);

  const requestLink = async () => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await sendPasswordResetEmail({
        formFields: [{ id: "email", value: email }],
      });
      if (response.status === "FIELD_ERROR") {
        setError(response.formFields.map((field) => field.error).join(" "));
        return;
      }
      // SuperTokens returns OK even for unknown emails so accounts cannot be enumerated.
      setMessage("If that email has an account, a reset link is on its way.");
    } catch (err) {
      setError(err.message || "We could not send the reset email. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const setNewPassword = async () => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await submitNewPassword({
        formFields: [{ id: "password", value: password }],
      });
      if (response.status === "FIELD_ERROR") {
        setError(response.formFields.map((field) => field.error).join(" "));
        return;
      }
      if (response.status === "RESET_PASSWORD_INVALID_TOKEN_ERROR") {
        setHasToken(false);
        setError("This reset link is invalid or has expired. Request a fresh one below.");
        return;
      }
      setMessage("Your password is updated. Taking you to sign in…");
      navigate("/login", { replace: true });
    } catch (err) {
      setError(err.message || "We could not reset your password. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-alabaster-paper paper-texture flex items-center justify-center px-6" data-testid="reset-password-page">
      <div className="w-full max-w-sm card-white p-8">
        <h1 className="font-serif text-obsidian text-3xl text-center">
          {hasToken ? "Choose a new password" : "Reset your password"}
        </h1>
        <p className="text-obsidian/70 text-sm mt-4 text-center">
          {hasToken
            ? "Pick something only you would know."
            : "We will email you a link to set a new one."}
        </p>

        <form
          className="space-y-6 mt-8"
          onSubmit={(e) => {
            e.preventDefault();
            haptic();
            if (hasToken) setNewPassword();
            else requestLink();
          }}
        >
          {hasToken ? (
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
          ) : (
            <input
              className="input-minimal"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              data-testid="reset-email-input"
            />
          )}

          {error && (
            <p className="text-obsidian text-sm italic font-serif" data-testid="reset-password-error">{error}</p>
          )}
          {message && (
            <p className="text-obsidian/70 text-sm" data-testid="reset-password-message">{message}</p>
          )}

          <button className="btn-obsidian w-full" disabled={busy} data-testid="reset-password-submit-btn">
            {busy ? "Working…" : hasToken ? "Set new password" : "Send reset link"}
          </button>
        </form>

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
