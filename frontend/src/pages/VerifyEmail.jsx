import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
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
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!sessionData.session) {
          const pendingEmail = localStorage.getItem("meenamma_pending_email");
          setStatus(pendingEmail ? "sent" : "signed-out");
          setMessage(pendingEmail
            ? "We sent a verification link to your email address."
            : "Please sign in again before verifying your email.");
          return;
        }

        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        if (data.user?.email_confirmed_at) {
          localStorage.removeItem("meenamma_pending_email");
          setStatus("verified");
          setMessage("Your email is verified. Taking you to your dashboard…");
          await refreshUser(sessionData.session);
          navigate("/dashboard", { replace: true });
        } else {
          setStatus("sent");
          setMessage("We sent a verification link to your email address.");
        }
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
      const { data, error } = await supabase.auth.getUser();
      const email = data.user?.email || localStorage.getItem("meenamma_pending_email");
      if (error && !email) throw error;
      if (!email) throw new Error("No email address is available.");
      const response = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/verify-email` },
      });
      if (response.error) throw response.error;
      setStatus("sent");
      setMessage("A fresh verification link is on its way.");
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
