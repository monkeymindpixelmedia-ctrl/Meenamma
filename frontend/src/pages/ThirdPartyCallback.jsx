import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInAndUp } from "supertokens-auth-react/recipe/thirdparty";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

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
        const response = await signInAndUp();
        if (response.status === "NO_EMAIL_GIVEN_BY_PROVIDER") {
          throw new Error("Google did not provide an email address for this account.");
        }
        if (response.status === "SIGN_IN_UP_NOT_ALLOWED") throw new Error(response.reason);
        if (response.status !== "OK") throw new Error("Google sign-in could not be completed.");

        const route = (u) => {
          if (!u) return "/auth/verify-email";
          if (u.role === "admin") return "/admin";
          // Send to onboarding if autopay was never set up or step not configured
          const onboarded = u.autopay_status === "active" ||
                            (u.step_paise && u.step_paise > 0) ||
                            (u.step_amount && u.step_amount > 0);
          return onboarded ? "/dashboard" : "/register";
        };

        if (response.createdNewRecipeUser) {
          await api.post("/profile/bootstrap", { name: "Meenamma Member" });
        }
        const appUser = await refreshUser();
        navigate(route(appUser), { replace: true });
      } catch (err) {
        setError(err.message || "Google sign-in could not be completed.");
      }
    };

    completeSignIn();
  }, [navigate, refreshUser]);

  return (
    <div className="min-h-screen bg-alabaster-paper paper-texture flex items-center justify-center px-6" data-testid="google-callback-page">
      <div className="w-full max-w-sm card-white p-8 text-center">
        <h1 className="font-serif text-obsidian text-3xl">Signing you in</h1>
        {error ? (
          <>
            <p className="text-obsidian/75 text-sm mt-4" data-testid="google-callback-error">{error}</p>
            <button className="btn-obsidian w-full mt-8" onClick={() => navigate("/login", { replace: true })}>
              Back to login
            </button>
          </>
        ) : (
          <p className="font-serif italic text-gold-dim mt-4">Completing your Google sign-in…</p>
        )}
      </div>
    </div>
  );
}
