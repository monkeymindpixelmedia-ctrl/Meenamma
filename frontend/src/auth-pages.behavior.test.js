import React, { act } from "react";
import { Simulate } from "react-dom/test-utils";
import { createRoot } from "react-dom/client";
import Login from "./pages/Login";
import ThirdPartyCallback from "./pages/ThirdPartyCallback";
import VerifyEmail from "./pages/VerifyEmail";
import { useAuth } from "./context/AuthContext";
import { api } from "./lib/api";
import { signInAndUp } from "supertokens-auth-react/recipe/thirdparty";
import {
  getEmailVerificationTokenFromURL,
  sendVerificationEmail,
  verifyEmail,
} from "supertokens-auth-react/recipe/emailverification";
import Session from "supertokens-auth-react/recipe/session";

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  Link: ({ children, ...props }) => <a {...props}>{children}</a>,
  useNavigate: () => mockNavigate,
}));
jest.mock("framer-motion", () => ({
  AnimatePresence: ({ children }) => children,
  motion: new Proxy({}, {
    get: (_, tag) => {
      const mockReact = require("react");
      return ({ children, ...props }) => mockReact.createElement(tag, props, children);
    },
  }),
}));
jest.mock("lucide-react", () => ({
  Crown: () => null,
  Eye: () => null,
  EyeOff: () => null,
  Sparkles: () => null,
}));
jest.mock("./context/AuthContext", () => ({ useAuth: jest.fn() }));
jest.mock("./lib/api", () => ({
  api: { post: jest.fn() },
  formatApiErrorDetail: jest.fn(() => ""),
  haptic: jest.fn(),
}));
jest.mock("supertokens-auth-react/recipe/thirdparty", () => ({
  redirectToThirdPartyLogin: jest.fn(),
  signInAndUp: jest.fn(),
}));
jest.mock("supertokens-auth-react/recipe/emailverification", () => ({
  getEmailVerificationTokenFromURL: jest.fn(),
  sendVerificationEmail: jest.fn(),
  verifyEmail: jest.fn(),
}));
jest.mock("supertokens-auth-react/recipe/session", () => ({
  __esModule: true,
  default: { doesSessionExist: jest.fn() },
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

describe("frontend authentication pages", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Session.doesSessionExist.mockResolvedValue(true);
    getEmailVerificationTokenFromURL.mockReturnValue(null);
    sendVerificationEmail.mockResolvedValue({ status: "OK" });
    verifyEmail.mockResolvedValue({ status: "OK" });
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    document.body.innerHTML = "";
  });

  test("routes unverified email login to the verification page", async () => {
    const login = jest.fn().mockResolvedValue({ verificationRequired: true });
    useAuth.mockReturnValue({ login });
    await render(<Login />);

    await act(async () => {
      Simulate.change(container.querySelector('[data-testid="login-email-input"]'), {
        target: { value: "meena@example.com" },
      });
      Simulate.change(container.querySelector('[data-testid="login-password-input"]'), {
        target: { value: "safe-password" },
      });
    });
    await act(async () => {
      Simulate.submit(container.querySelector("form"));
    });

    expect(mockNavigate).toHaveBeenCalledWith("/auth/verify-email");
  });

  test("routes verified email login to the dashboard", async () => {
    const login = jest.fn().mockResolvedValue({ id: "user-1" });
    useAuth.mockReturnValue({ login });
    await render(<Login />);

    await act(async () => {
      Simulate.change(container.querySelector('[data-testid="login-email-input"]'), {
        target: { value: "meena@example.com" },
      });
      Simulate.change(container.querySelector('[data-testid="login-password-input"]'), {
        target: { value: "safe-password" },
      });
    });
    await act(async () => {
      Simulate.submit(container.querySelector("form"));
    });

    expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
  });

  test("completes the Google callback only once", async () => {
    signInAndUp.mockResolvedValue({ status: "OK", createdNewRecipeUser: false });
    useAuth.mockReturnValue({ refreshUser: jest.fn().mockResolvedValue({ id: "user-1" }) });
    await render(<ThirdPartyCallback />);
    await flushEffects();

    await act(async () => root.render(<ThirdPartyCallback />));
    await flushEffects();

    expect(signInAndUp).toHaveBeenCalledTimes(1);
  });

  test("bootstraps the profile for a newly created Google recipe user", async () => {
    signInAndUp.mockResolvedValue({ status: "OK", createdNewRecipeUser: true });
    api.post.mockResolvedValue({ data: {} });
    useAuth.mockReturnValue({ refreshUser: jest.fn().mockResolvedValue({ id: "user-1" }) });
    await render(<ThirdPartyCallback />);
    await flushEffects();

    expect(api.post).toHaveBeenCalledWith("/profile/bootstrap", { name: "Meenamma Member" });
  });

  test("does not bootstrap an existing Google recipe user", async () => {
    signInAndUp.mockResolvedValue({ status: "OK", createdNewRecipeUser: false });
    useAuth.mockReturnValue({ refreshUser: jest.fn().mockResolvedValue({ id: "user-1" }) });
    await render(<ThirdPartyCallback />);
    await flushEffects();

    expect(api.post).not.toHaveBeenCalled();
  });

  test("sends a verification email when the page has no token", async () => {
    useAuth.mockReturnValue({ logout: jest.fn(), refreshUser: jest.fn() });
    await render(<VerifyEmail />);
    await flushEffects();

    expect(sendVerificationEmail).toHaveBeenCalledTimes(1);
    expect(verifyEmail).not.toHaveBeenCalled();
  });

  test("validates a token and routes a verified user to the dashboard", async () => {
    const refreshUser = jest.fn().mockResolvedValue({ id: "user-1" });
    getEmailVerificationTokenFromURL.mockReturnValue("verification-token");
    useAuth.mockReturnValue({ logout: jest.fn(), refreshUser });
    await render(<VerifyEmail />);
    await flushEffects();

    expect(verifyEmail).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard", { replace: true });
  });

  test("shows an error instead of navigating for an invalid verification token", async () => {
    getEmailVerificationTokenFromURL.mockReturnValue("invalid-token");
    verifyEmail.mockResolvedValue({ status: "EMAIL_VERIFICATION_INVALID_TOKEN_ERROR" });
    useAuth.mockReturnValue({ logout: jest.fn(), refreshUser: jest.fn() });
    await render(<VerifyEmail />);
    await flushEffects();

    expect(container.querySelector('[data-testid="verify-email-message"]').textContent).toMatch(/invalid or has expired/i);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test("resends verification after an invalid token", async () => {
    getEmailVerificationTokenFromURL.mockReturnValue("invalid-token");
    verifyEmail.mockResolvedValue({ status: "EMAIL_VERIFICATION_INVALID_TOKEN_ERROR" });
    useAuth.mockReturnValue({ logout: jest.fn(), refreshUser: jest.fn() });
    await render(<VerifyEmail />);
    await flushEffects();

    await act(async () => {
      Simulate.click(container.querySelector('[data-testid="resend-verification-btn"]'));
    });

    expect(sendVerificationEmail).toHaveBeenCalledTimes(1);
  });
});
