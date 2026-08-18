import React, { act } from "react";
import { Simulate } from "react-dom/test-utils";
import { createRoot } from "react-dom/client";
import Login from "./pages/Login";
import ThirdPartyCallback from "./pages/ThirdPartyCallback";
import { useAuth } from "./context/AuthContext";
import { api } from "./lib/api";
import { supabase } from "./lib/supabase";

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  Link: ({ children, ...props }) => require("react").createElement("a", props, children),
  useNavigate: () => mockNavigate,
}));
jest.mock("framer-motion", () => ({
  motion: new Proxy({}, {
    get: (_, tag) => ({ children, ...props }) => require("react").createElement(tag, props, children),
  }),
}));
jest.mock("lucide-react", () => ({ Eye: () => null, EyeOff: () => null }));
jest.mock("./context/AuthContext", () => ({ useAuth: jest.fn() }));
jest.mock("./lib/api", () => ({
  api: { get: jest.fn(), post: jest.fn() },
  formatApiErrorDetail: jest.fn(() => ""),
  haptic: jest.fn(),
}));
jest.mock("./lib/supabase", () => ({
  supabase: { auth: { getSession: jest.fn() } },
}));

let container;
let root;

global.IS_REACT_ACT_ENVIRONMENT = true;

async function render(component) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => root.render(component));
}

async function flushEffects() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe("Supabase Google authentication pages", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    api.get.mockResolvedValue({ data: { google_enabled: true } });
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    document.body.innerHTML = "";
  });

  test("starts Google OAuth from the login page", async () => {
    const loginWithGoogle = jest.fn().mockResolvedValue({});
    useAuth.mockReturnValue({ login: jest.fn(), loginWithGoogle });
    await render(<Login />);
    await flushEffects();

    await act(async () => Simulate.click(container.querySelector('[data-testid="google-login-btn"]')));

    expect(loginWithGoogle).toHaveBeenCalledTimes(1);
  });

  test("completes a Supabase Google callback and routes a new user to onboarding", async () => {
    supabase.auth.getSession.mockResolvedValue({
      data: { session: { access_token: "oauth-token" } },
      error: null,
    });
    const refreshUser = jest.fn().mockResolvedValue({ id: "user-1", step_amount: 0 });
    useAuth.mockReturnValue({ refreshUser });

    await render(<ThirdPartyCallback />);
    await flushEffects();

    expect(refreshUser).toHaveBeenCalledWith({ access_token: "oauth-token" });
    expect(mockNavigate).toHaveBeenCalledWith("/register", { replace: true });
  });

  test("shows an error when Google callback did not create a session", async () => {
    supabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    useAuth.mockReturnValue({ refreshUser: jest.fn() });

    await render(<ThirdPartyCallback />);
    await flushEffects();

    expect(container.querySelector('[data-testid="google-callback-error"]').textContent)
      .toMatch(/did not create a session/i);
  });
});
