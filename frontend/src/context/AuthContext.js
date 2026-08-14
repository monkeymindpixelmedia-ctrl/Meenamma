import React, { createContext, useContext, useEffect, useState } from "react";
import EmailPassword from "supertokens-auth-react/recipe/emailpassword";
import EmailVerification from "supertokens-auth-react/recipe/emailverification";
import Session from "supertokens-auth-react/recipe/session";
import { api } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // null=checking, false=guest, object=user

  const refreshUser = async () => {
    if (!(await Session.doesSessionExist())) {
      setUser(false);
      return false;
    }
    const { data } = await api.get("/auth/me");
    setUser(data);
    return data;
  };

  useEffect(() => {
    refreshUser().catch(() => setUser(false));
  }, []);

  const login = async (email, password) => {
    const response = await EmailPassword.signIn({
      formFields: [
        { id: "email", value: email },
        { id: "password", value: password },
      ],
    });
    if (response.status === "FIELD_ERROR") throw new Error(response.formFields.map((field) => field.error).join(" "));
    if (response.status === "WRONG_CREDENTIALS_ERROR") throw new Error("Invalid email or password");
    if (response.status === "SIGN_IN_NOT_ALLOWED") throw new Error(response.reason);
    return refreshUser();
  };

  const register = async (name, email, password, daily_plan = 5, extra = {}) => {
    const response = await EmailPassword.signUp({
      formFields: [
        { id: "email", value: email },
        { id: "password", value: password },
      ],
    });
    if (response.status === "FIELD_ERROR") throw new Error(response.formFields.map((field) => field.error).join(" "));
    if (response.status === "SIGN_UP_NOT_ALLOWED") throw new Error(response.reason);
    await api.post("/profile/bootstrap", {
      name,
      daily_plan,
      pincode: extra.pincode || "",
      upi_id: extra.upi_id || "",
    });
    return refreshUser();
  };

  const updateUser = (data) => setUser(data);

  const logout = async () => {
    await Session.signOut();
    setUser(false);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
