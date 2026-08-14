import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "../lib/api";
import { useSessionContext } from 'supertokens-auth-react/recipe/session';
import { signOut } from "supertokens-auth-react/recipe/session";
import { signIn, signUp } from "supertokens-auth-react/recipe/emailpassword";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const sessionContext = useSessionContext();
  const [user, setUser] = useState(null); // null=checking, false=guest, object=user

  const fetchMe = async () => {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data);
      return data;
    } catch (e) {
      setUser(false);
      return false;
    }
  };

  useEffect(() => {
    if (sessionContext.loading) {
      setUser(null);
    } else if (sessionContext.doesSessionExist) {
      fetchMe();
    } else {
      setUser(false);
    }
  }, [sessionContext]);

  const login = async (email, password) => {
    try {
      let response = await signIn({
        formFields: [
          { id: "email", value: email },
          { id: "password", value: password }
        ]
      });
      if (response.status === "FIELD_ERROR") {
        response.formFields.forEach(formField => {
            if (formField.id === "email") {
                throw new Error(formField.error);
            }
        });
      } else if (response.status === "WRONG_CREDENTIALS_ERROR") {
          throw new Error("Invalid email or password");
      } else if (response.status === "OK") {
          return fetchMe();
      }
    } catch (err) {
      throw err;
    }
  };

  const register = async (name, email, password, daily_plan = 5, extra = {}) => {
    let response = await signUp({
        formFields: [
            { id: "email", value: email },
            { id: "password", value: password },
            { id: "name", value: name }
        ]
    });
    if (response.status === "FIELD_ERROR") {
      throw new Error("Invalid fields");
    }
    if (response.status === "OK") {
        const { data: profile } = await api.patch("/me", {
          name,
          daily_plan,
          pincode: extra.pincode || "",
          upi_id: extra.upi_id || "",
        });
        setUser(profile);
        return profile;
    }
    if (response.status === "SIGN_UP_NOT_ALLOWED") {
        throw new Error("Sign up not allowed");
    }
    throw new Error("Signup failed");
  };

  const updateUser = (data) => setUser(data);

  const logout = async () => {
    await signOut();
    setUser(false);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
