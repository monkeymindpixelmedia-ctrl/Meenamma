import React, { act } from "react";
import { createRoot } from "react-dom/client";
import EmailPassword from "supertokens-auth-react/recipe/emailpassword";
import EmailVerification from "supertokens-auth-react/recipe/emailverification";
import Session from "supertokens-auth-react/recipe/session";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { api } from "./lib/api";

jest.mock("supertokens-auth-react/recipe/emailpassword", () => ({
  __esModule: true,
  default: { signIn: jest.fn(), signUp: jest.fn() },
}));
jest.mock("supertokens-auth-react/recipe/emailverification", () => ({
  __esModule: true,
  default: { isEmailVerified: jest.fn() },
}));
jest.mock("supertokens-auth-react/recipe/session", () => ({
  __esModule: true,
  default: { doesSessionExist: jest.fn(), signOut: jest.fn() },
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
    root.render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    );
  });
}

describe("AuthContext SuperTokens behavior", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    Session.doesSessionExist.mockResolvedValue(false);
    EmailVerification.isEmailVerified.mockResolvedValue({ isVerified: false });
    await renderAuthProvider();
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    document.body.innerHTML = "";
  });

  test("registers through EmailPassword before bootstrapping the profile", async () => {
    EmailPassword.signUp.mockResolvedValue({ status: "OK" });
    api.post.mockResolvedValue({ data: {} });

    let result;
    await act(async () => {
      result = await currentAuth.register("Meena", "meena@example.com", "safe-password", 10, {
        pincode: "600001",
        upi_id: "meena@upi",
      });
    });

    expect(EmailPassword.signUp).toHaveBeenCalledWith({
      formFields: [
        { id: "email", value: "meena@example.com" },
        { id: "password", value: "safe-password" },
      ],
    });
    expect(api.post).toHaveBeenCalledWith("/profile/bootstrap", {
      name: "Meena",
      daily_plan: 10,
      pincode: "600001",
      upi_id: "meena@upi",
      cadence: "weekly",
      referred_by_code: undefined,
    });
    expect(EmailPassword.signUp.mock.invocationCallOrder[0]).toBeLessThan(
      api.post.mock.invocationCallOrder[0]
    );
    expect(result).toEqual({ verificationRequired: true });
  });

  test("returns verificationRequired when email login is not verified", async () => {
    EmailPassword.signIn.mockResolvedValue({ status: "OK" });
    EmailVerification.isEmailVerified.mockResolvedValue({ isVerified: false });

    let result;
    await act(async () => {
      result = await currentAuth.login("meena@example.com", "safe-password");
    });

    expect(result).toEqual({ verificationRequired: true });
    expect(api.get).not.toHaveBeenCalled();
  });

  test("loads the application user after verified email login", async () => {
    const appUser = { id: "user-1", name: "Meena" };
    EmailPassword.signIn.mockResolvedValue({ status: "OK" });
    EmailVerification.isEmailVerified.mockResolvedValue({ isVerified: true });
    Session.doesSessionExist.mockResolvedValue(true);
    api.get.mockResolvedValue({ data: appUser });

    let result;
    await act(async () => {
      result = await currentAuth.login("meena@example.com", "safe-password");
    });

    expect(result).toEqual(appUser);
    expect(api.get).toHaveBeenCalledWith("/auth/me");
  });

  test("does not depend on the Supabase auth client", () => {
    const fs = require("fs");
    const path = require("path");
    const source = fs.readFileSync(path.join(__dirname, "context/AuthContext.js"), "utf8");

    expect(source).not.toMatch(/supabase/i);
  });
});
