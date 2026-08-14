import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import SuperTokens, { SuperTokensWrapper } from "supertokens-auth-react";
import EmailPassword from "supertokens-auth-react/recipe/emailpassword";
import Session from "supertokens-auth-react/recipe/session";
import { AuthProvider, useAuth } from "./context/AuthContext";

SuperTokens.init({
    appInfo: {
        appName: process.env.REACT_APP_SUPERTOKENS_APP_NAME || "Meenamma",
        apiDomain: process.env.REACT_APP_SUPERTOKENS_API_DOMAIN || "http://localhost:8000",
        websiteDomain: process.env.REACT_APP_SUPERTOKENS_WEBSITE_DOMAIN || "http://localhost:3000",
        apiBasePath: "/api/auth",
        websiteBasePath: "/auth"
    },
    recipeList: [
        EmailPassword.init(),
        Session.init()
    ]
});
import BottomNav from "./components/BottomNav";
import Header from "./components/Header";
import Splash from "./pages/Splash";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Market from "./pages/Market";
import Admin from "./pages/Admin";
import Profile from "./pages/Profile";
import Legal from "./pages/Legal";
import Footer from "./components/Footer";
import "./App.css";

function Protected({ children }) {
  const { user } = useAuth();
  if (user === null)
    return (
      <div className="min-h-screen bg-alabaster-paper flex items-center justify-center">
        <p className="font-serif italic text-gold-dim">Unlocking the door…</p>
      </div>
    );
  if (user === false) return <Navigate to="/login" replace />;
  return children;
}

function AdminOnly({ children }) {
  const { user } = useAuth();
  if (user && user.role !== "admin") return <Navigate to="/dashboard" replace />;
  return children;
}

const NAV_PAGES = ["/home", "/dashboard", "/market", "/admin", "/profile"];

function Shell() {
  const location = useLocation();
  const showChrome = NAV_PAGES.includes(location.pathname);
  return (
    <div className="w-full min-h-screen bg-alabaster-paper flex flex-col">
      {showChrome && <Header />}
      <div className="flex-grow">
        <Routes>
          <Route path="/" element={<Splash />} />
        <Route path="/home" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <Protected>
              <Dashboard />
            </Protected>
          }
        />
        <Route path="/market" element={<Market />} />
        <Route
          path="/profile"
          element={
            <Protected>
              <Profile />
            </Protected>
          }
        />
        <Route
          path="/admin"
          element={
            <Protected>
              <AdminOnly>
                <Admin />
              </AdminOnly>
            </Protected>
          }
        />
        <Route path="/legal/:policy" element={<Legal />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </div>
      {showChrome && <BottomNav />}
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <SuperTokensWrapper>
      <AuthProvider>
        <BrowserRouter>
          <Shell />
        </BrowserRouter>
      </AuthProvider>
    </SuperTokensWrapper>
  );
}
