import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { api } from "./lib/api";
import { supabase } from "./lib/supabase";

jest.mock("./lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
      signInWithPassword: jest.fn(),
      signInWithOAuth: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    },
  },
}));
jest.mock("./lib/api", () => ({
  api: { get: jest.fn(), post: jest.fn() },
}));

let currentAuth;
let root;

global.IS_REACT_ACT_ENVIRONMENT = true;

function AuthProbe() {
  currentAuth = useAuth();
  return null;
}

async function renderAuthProvider() {
  const container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root.render(<AuthProvider><AuthProbe /></AuthProvider>);
  });
}

describe("AuthContext Supabase behavior", () => {
  const session = { access_token: "supabase-access-token" };

  beforeEach(async () => {
    jest.clearAllMocks();
    localStorage.clear();
    supabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    supabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    });
    supabase.auth.signOut.mockResolvedValue({ error: null });
    await renderAuthProvider();
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    document.body.innerHTML = "";
  });

  test("registers with Supabase and bootstraps the application profile", async () => {
    supabase.auth.signUp.mockResolvedValue({ data: { session }, error: null });
    api.post.mockResolvedValue({ data: {} });
    api.get.mockResolvedValue({ data: { id: "user-1", email: "meena@example.com" } });

    let result;
    await act(async () => {
      result = await currentAuth.register("Meena", "meena@example.com", "safe-password", 10, {
        pincode: "600001",
        upi_id: "meena@upi",
      });
    });

    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: "meena@example.com",
      password: "safe-password",
      options: {
        emailRedirectTo: "http://localhost/auth/verify-email",
        data: {
          display_name: "Meena",
          daily_plan: 10,
          pincode: "600001",
          upi_id: "meena@upi",
        },
      },
    });
    expect(api.post).toHaveBeenCalledWith("/profile/bootstrap", {
      name: "Meena",
      email: "meena@example.com",
      daily_plan: 10,
      pincode: "600001",
      upi_id: "meena@upi",
      cadence: "weekly",
      referred_by_code: undefined,
    });
    expect(result).toEqual({ id: "user-1", email: "meena@example.com" });
  });

  test("uses Supabase password sign-in and loads the application user", async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({ data: { session }, error: null });
    api.get.mockResolvedValue({ data: { id: "user-1", name: "Meena" } });

    let result;
    await act(async () => {
      result = await currentAuth.login("meena@example.com", "safe-password");
    });

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: "meena@example.com",
      password: "safe-password",
    });
    expect(api.get).toHaveBeenCalledWith("/auth/me");
    expect(result).toEqual({ id: "user-1", name: "Meena" });
  });

  test("keeps referral attribution until an email-confirmed signup can bootstrap", async () => {
    supabase.auth.signUp.mockResolvedValue({ data: { session: null }, error: null });

    let result;
    await act(async () => {
      result = await currentAuth.register("New Member", "new@example.com", "safe-password", 5, {
        pincode: "600001",
        cadence: "weekly",
        referred_by_code: "MEEN1234",
      });
    });

    expect(result).toEqual({ verificationRequired: true });
    expect(JSON.parse(localStorage.getItem("meenamma_pending_registration"))).toMatchObject({
      name: "New Member",
      email: "new@example.com",
      referred_by_code: "MEEN1234",
    });
  });

  test("starts Google sign-in with the application callback URL", async () => {
    supabase.auth.signInWithOAuth.mockResolvedValue({ data: {}, error: null });

    await act(async () => currentAuth.loginWithGoogle());

    expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: { redirectTo: "http://localhost/auth/callback/google" },
    });
  });
});
