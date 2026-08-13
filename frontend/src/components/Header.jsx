import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Crown, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const links = [
  { to: "/home", label: "Home" },
  { to: "/dashboard", label: "Daily Kudam" },
  { to: "/market", label: "Fresh Catch" },
];

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const doLogout = async () => {
    await logout();
    navigate("/home");
  };

  return (
    <header className="glass-paper sticky top-0 z-40" data-testid="top-header">
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 lg:px-16 h-16 flex items-center justify-between">
        <button onClick={() => navigate("/home")} className="flex items-baseline gap-2" data-testid="header-logo">
          <span className="font-serif text-henna text-xl font-semibold" style={{ letterSpacing: "0.18em" }}>
            MEENAMMA
          </span>
          <span className="tamil text-gold text-sm hidden sm:inline">மீனம்மா</span>
        </button>

        <nav className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              data-testid={`headernav-${l.label.toLowerCase().replace(" ", "-")}`}
              className={({ isActive }) =>
                `text-[11px] uppercase transition-colors duration-300 ${
                  isActive ? "text-henna font-semibold" : "text-henna/50 hover:text-henna"
                }`
              }
              style={{ letterSpacing: "0.25em" }}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          {user && user.role === "admin" && (
            <button onClick={() => navigate("/admin")} className="text-gold hover:text-henna transition-colors" title="Store Manager" data-testid="admin-link-btn">
              <Crown size={18} strokeWidth={1.5} />
            </button>
          )}
          {user ? (
            <>
              <button
                onClick={() => navigate("/profile")}
                className="hidden md:block text-[11px] uppercase text-henna/70 hover:text-henna transition-colors"
                style={{ letterSpacing: "0.2em" }}
                data-testid="header-profile-link"
              >
                {user.name?.split(" ")[0]}
              </button>
              <button onClick={doLogout} className="text-henna/60 hover:text-henna transition-colors" data-testid="logout-btn">
                <LogOut size={18} strokeWidth={1.5} />
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="text-[11px] uppercase text-henna border border-gold px-5 py-2 hover:bg-gold hover:text-white transition-colors duration-300"
              style={{ letterSpacing: "0.22em" }}
              data-testid="header-login-link"
            >
              Enter
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
