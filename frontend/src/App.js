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
import Dashboard from "./pages/Dashboard";
import Market from "./pages/Market";
import Admin from "./pages/Admin";
import Profile from "./pages/Profile";
import Legal from "./pages/Legal";
import Footer from "./components/Footer";
import { motion, AnimatePresence } from "framer-motion";
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
          </motion.div>
        </AnimatePresence>
      </div>
      {showChrome && <BottomNav />}
      <Footer />
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
