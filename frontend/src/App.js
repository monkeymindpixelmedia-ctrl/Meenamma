import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import BottomNav from "./components/BottomNav";
import Splash from "./pages/Splash";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Market from "./pages/Market";
import Admin from "./pages/Admin";
import "./App.css";

function Protected({ children }) {
  const { user } = useAuth();
  if (user === null)
    return (
      <div className="min-h-screen bg-henna-deep flex items-center justify-center">
        <p className="font-serif italic text-gold/70">Unlocking the door…</p>
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

function Shell() {
  const location = useLocation();
  const { user } = useAuth();
  const showNav = ["/home", "/dashboard", "/market"].includes(location.pathname) && !!user;
  return (
    <div className="mx-auto max-w-md min-h-screen relative shadow-2xl shadow-black/60">
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
          path="/admin"
          element={
            <Protected>
              <AdminOnly>
                <Admin />
              </AdminOnly>
            </Protected>
          }
        />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
      {showNav && <BottomNav />}
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
