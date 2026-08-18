import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { api } from "../lib/api";

const AuthContext = createContext(null);

const authError = (error) => {
  if (!error) return null;
  const message = error.message || "Authentication failed";
  return new Error(message);
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // null=checking, false=guest, object=user

  const refreshUser = async (sessionOverride) => {
    const session = sessionOverride || (await supabase.auth.getSession()).data.session;
    if (!session) {
      setUser(false);
      return false;
    }
    const { data, error } = await api.get("/auth/me");
    if (error) throw authError(error);
    setUser(data);
    return data;
  };

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;
      if (error || !data.session) {
        setUser(false);
        return;
      }
      refreshUser(data.session).catch(() => mounted && setUser(false));
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (!session) {
        setUser(false);
        return;
      }
      refreshUser(session).catch(() => mounted && setUser(false));
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw authError(error);
    return refreshUser(data.session);
  };

  const loginWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback/google` },
    });
    if (error) throw authError(error);
    return data;
  };

  const register = async (name, email, password, daily_plan = 5, extra = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/verify-email`,
        data: { display_name: name, daily_plan, ...extra },
      },
    });
    if (error) throw authError(error);
    if (!data.session) {
      localStorage.setItem("meenamma_pending_email", email);
      return { verificationRequired: true };
    }

    await api.post("/profile/bootstrap", {
      name,
      daily_plan,
      pincode: extra.pincode || "",
      upi_id: extra.upi_id || "",
      cadence: extra.cadence || "weekly",
      referred_by_code: extra.referred_by_code,
    });
    return refreshUser(data.session);
  };

  const updateUser = (data) => setUser(data);

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw authError(error);
    setUser(false);
  };

  return (
    <AuthContext.Provider value={{ user, login, loginWithGoogle, register, logout, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
