import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import BottomNav from "./components/BottomNav";
import Header from "./components/Header";
import Splash from "./pages/Splash";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ThirdPartyCallback from "./pages/ThirdPartyCallback";
import VerifyEmail from "./pages/VerifyEmail";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Market from "./pages/Market";
import Admin from "./pages/Admin";
import Profile from "./pages/Profile";
import Referral from "./pages/Referral";
import Legal from "./pages/Legal";
import StudentRegistration from "./pages/StudentRegistration";
import Footer from "./components/Footer";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "./lib/supabase";
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

const AUTH_PAGES = [
  "/",
  "/login",
  "/register",
  "/auth/callback/google",
  "/auth/verify-email",
  "/auth/reset-password",
  "/students",
  "/student-register",
  "/join-team",
];

function Shell() {
  const location = useLocation();
  const { user } = useAuth();

  React.useEffect(() => {
    // Check if this was a Google OAuth redirect meant for earn.meenamma.org
    const getCookie = (name) => {
      const match = document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'));
      return match ? decodeURIComponent(match[1]) : null;
    };
    const authTarget = getCookie('meenamma_auth_target');
    const authOrigin = getCookie('meenamma_auth_origin') || 'https://earn.meenamma.org';

    if (authTarget === 'earn') {
      const isProd = window.location.hostname.includes('meenamma.org');
      const domainAttr = isProd ? '; Domain=.meenamma.org' : '';
      document.cookie = `meenamma_auth_target=; Path=/${domainAttr}; max-age=0; SameSite=Lax${isProd ? '; Secure' : ''}`;
      document.cookie = `meenamma_auth_origin=; Path=/${domainAttr}; max-age=0; SameSite=Lax${isProd ? '; Secure' : ''}`;

      // If tokens or auth code are in current URL, forward immediately
      if (window.location.hash.includes('access_token') || window.location.search.includes('code=')) {
        window.location.replace(`${authOrigin}/${window.location.search}${window.location.hash}`);
        return;
      }

      // If Supabase already extracted the session into client storage
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          const hash = `#access_token=${encodeURIComponent(session.access_token)}&refresh_token=${encodeURIComponent(session.refresh_token)}&expires_in=${session.expires_in || 3600}&token_type=bearer&type=recovery`;
          window.location.replace(`${authOrigin}/${hash}`);
        } else {
          window.location.replace(authOrigin);
        }
      }).catch(() => {
        window.location.replace(authOrigin);
      });
      return;
    }

    const params = new URLSearchParams(location.search);
    const ref = params.get("ref") || params.get("code");
    if (ref && !location.search.includes("code=")) localStorage.setItem("meenamma_ref", ref);
  }, [location]);

  const isAuthPage = AUTH_PAGES.includes(location.pathname);
  const showHeader = !isAuthPage;

  return (
    <div className="w-full min-h-screen bg-alabaster-paper flex flex-col">
      {showHeader && <Header />}
      <div className="flex-grow overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="w-full h-full"
          >
            <Routes location={location}>
              <Route path="/" element={<Splash />} />
              <Route path="/home" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/auth/callback/google" element={<ThirdPartyCallback />} />
              <Route path="/auth/verify-email" element={<VerifyEmail />} />
              <Route path="/auth/reset-password" element={<ResetPassword />} />
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
                path="/referral"
                element={
                  <Protected>
                    <Referral />
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
              <Route path="/students" element={<StudentRegistration />} />
              <Route path="/student-register" element={<StudentRegistration />} />
              <Route path="/join-team" element={<StudentRegistration />} />
              <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </div>
      {Boolean(user) && showHeader && <BottomNav />}
      {!isAuthPage && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Shell />
      </BrowserRouter>
    </AuthProvider>
  );
}
