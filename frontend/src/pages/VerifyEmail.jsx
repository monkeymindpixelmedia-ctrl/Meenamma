import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getEmailVerificationTokenFromURL,
  sendVerificationEmail,
  verifyEmail,
} from "supertokens-auth-react/recipe/emailverification";
import Session from "supertokens-auth-react/recipe/session";
import { useAuth } from "../context/AuthContext";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const { logout, refreshUser } = useAuth();
  const started = useRef(false);
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const prepareVerification = async () => {
      try {
        if (!(await Session.doesSessionExist())) {
          setStatus("signed-out");
          setMessage("Please sign in again before verifying your email.");
          return;
        }

        const token = getEmailVerificationTokenFromURL();
        if (!token) {
          const response = await sendVerificationEmail();
          setStatus(response.status === "EMAIL_ALREADY_VERIFIED_ERROR" ? "verified" : "sent");
          setMessage(response.status === "EMAIL_ALREADY_VERIFIED_ERROR"
            ? "Your email is already verified."
            : "We sent a verification link to your email address.");
          return;
        }

        const response = await verifyEmail();
        if (response.status === "EMAIL_VERIFICATION_INVALID_TOKEN_ERROR") {
          setStatus("error");
          setMessage("This verification link is invalid or has expired. Request a new link below.");
          return;
        }
        setStatus("verified");
        setMessage("Your email is verified. Taking you to your dashboard…");
        await refreshUser();
        navigate("/dashboard", { replace: true });
      } catch (err) {
        setStatus("error");
        setMessage(err.message || "We could not verify your email. Please try again.");
      }
    };

    prepareVerification();
  }, [navigate, refreshUser]);

  const resend = async () => {
    setResending(true);
    try {
      const response = await sendVerificationEmail();
      setStatus(response.status === "EMAIL_ALREADY_VERIFIED_ERROR" ? "verified" : "sent");
      setMessage(response.status === "EMAIL_ALREADY_VERIFIED_ERROR"
        ? "Your email is already verified."
        : "A fresh verification link is on its way.");
    } catch (err) {
      setStatus("error");
      setMessage(err.message || "We could not resend the email. Please try again.");
    } finally {
      setResending(false);
    }
  };

  const signOut = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-alabaster-paper paper-texture flex items-center justify-center px-6" data-testid="verify-email-page">
      <div className="w-full max-w-sm card-white p-8 text-center">
        <h1 className="font-serif text-obsidian text-3xl">Verify your email</h1>
        <p className="text-obsidian/70 text-sm mt-4" data-testid="verify-email-message">
          {status === "loading" ? "Checking your verification link…" : message}
        </p>

        {status !== "loading" && status !== "signed-out" && (
          <button className="btn-gold-outline w-full mt-8" onClick={resend} disabled={resending} data-testid="resend-verification-btn">
            {resending ? "Sending…" : "Resend verification email"}
          </button>
        )}
        {status === "verified" && (
          <button className="btn-obsidian w-full mt-4" onClick={async () => {
            const appUser = await refreshUser();
            navigate(appUser ? "/dashboard" : "/login", { replace: true });
          }}>
            Continue
          </button>
        )}
        <button className="w-full text-obsidian/60 text-xs mt-6 underline underline-offset-4" onClick={signOut}>
          Sign out
        </button>
        <Link className="block text-obsidian/60 text-xs mt-4 underline underline-offset-4" to="/login">
          Back to login
        </Link>
      </div>
    </div>
  );
}
