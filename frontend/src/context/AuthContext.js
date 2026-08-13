import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "../lib/api";
import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // null=checking, false=guest, object=user

  const fetchMe = async () => {
    const { data } = await api.get("/auth/me");
    setUser(data);
    return data;
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) fetchMe().catch(() => setUser(false));
      else setUser(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") setUser(false);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message === "Invalid login credentials" ? "Invalid email or password" : error.message);
    return fetchMe();
  };

  const register = async (name, email, password, daily_plan = 5, extra = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) throw new Error(error.message);
    if (!data.session) throw new Error("Please check your email to confirm your account.");
    const { data: profile } = await api.patch("/me", {
      name,
      daily_plan,
      pincode: extra.pincode || "",
      upi_id: extra.upi_id || "",
    });
    setUser(profile);
    return profile;
  };

  const updateUser = (data) => setUser(data);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(false);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
