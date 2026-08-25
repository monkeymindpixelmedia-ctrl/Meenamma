import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

export default function ThirdPartyCallback() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const started = useRef(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const completeSignIn = async () => {
      try {
        // 1. Check if URL contains OAuth error parameters from Google/Supabase
        const params = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const urlError =
          params.get("error_description") ||
          params.get("error") ||
          hashParams.get("error_description") ||
          hashParams.get("error");

        if (urlError) {
          throw new Error(urlError.replace(/\+/g, " "));
        }

        // 2. Exchange PKCE code if present in the URL
        const code = params.get("code");
        let activeSession = null;

        if (code && typeof supabase.auth.exchangeCodeForSession === "function") {
          try {
            const { data: exchangeData, error: exchangeError } =
              await supabase.auth.exchangeCodeForSession(code);
            if (!exchangeError && exchangeData?.session) {
              activeSession = exchangeData.session;
            }
          } catch {
            // exchangeCodeForSession may have been handled automatically by client
          }
        }

        // 3. If session not yet resolved, retrieve current session
        if (!activeSession) {
          const { data, error: sessionErr } = await supabase.auth.getSession();
          if (sessionErr) throw sessionErr;
          activeSession = data?.session;
        }

        // 4. If still waiting for auth state listener (e.g. hash fragment processing)
        if (!activeSession && typeof supabase?.auth?.onAuthStateChange === "function") {
          activeSession = await new Promise((resolve) => {
            const timeout = setTimeout(() => resolve(null), 3000);
            try {
              const { data: listener } = supabase.auth.onAuthStateChange(
                (event, session) => {
                  if (session && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
                    clearTimeout(timeout);
                    listener?.subscription?.unsubscribe?.();
                    resolve(session);
                  }
                }
              );
            } catch {
              clearTimeout(timeout);
              resolve(null);
            }
          });
        }

        if (!activeSession) {
          throw new Error(
            "Google sign-in did not create a session. Please check your Supabase Google OAuth provider configuration."
          );
        }

        // 5. Refresh user state in AuthContext & redirect
        const appUser = await refreshUser(activeSession);

        const route = (u) => {
          if (!u) return "/auth/verify-email";
          if (u.role === "admin") return "/admin";
          const onboarded =
            u.autopay_status === "active" ||
            (u.step_paise && u.step_paise > 0) ||
            (u.step_amount && u.step_amount > 0);
          return onboarded ? "/dashboard" : "/register";
        };

        navigate(route(appUser), { replace: true });
      } catch (err) {
        console.error("Google sign-in callback error:", err);
        setError(err.message || "Google sign-in could not be completed.");
      }
    };

    completeSignIn();
  }, [navigate, refreshUser]);

  return (
    <div
      className="min-h-screen bg-alabaster-paper paper-texture flex items-center justify-center px-6"
      data-testid="google-callback-page"
    >
      <div className="w-full max-w-sm card-white p-8 text-center shadow-lg">
        <h1 className="font-serif text-obsidian text-3xl">Signing you in</h1>
        {error ? (
          <>
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg mt-4 text-left">
              <p className="text-red-800 text-xs font-mono font-medium" data-testid="google-callback-error">
                {error}
              </p>
            </div>
            <button
              className="btn-obsidian w-full mt-6"
              onClick={() => navigate("/login", { replace: true })}
            >
              Back to login
            </button>
          </>
        ) : (
          <div className="py-6 flex flex-col items-center gap-3">
            <div className="h-8 w-8 rounded-full border-2 border-gold border-t-transparent animate-spin" />
            <p className="font-serif italic text-gold-dim text-sm">
              Completing your Google sign-in…
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
