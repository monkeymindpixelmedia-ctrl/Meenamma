import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Crown, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";

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
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="glass-paper sticky top-0 z-40 transition-all duration-500" data-testid="top-header"
    >
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 lg:px-16 h-20 flex items-center justify-between">
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate("/home")} 
          className="flex items-baseline gap-2 group" data-testid="header-logo"
        >
          <span className="font-serif text-obsidian text-2xl font-light tracking-[0.25em] group-hover:opacity-70 transition-opacity duration-300">
            MEENAMMA
          </span>
        </motion.button>

        <nav className="hidden md:flex items-center gap-12">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              data-testid={`headernav-${l.label.toLowerCase().replace(" ", "-")}`}
              className={({ isActive }) =>
                `text-[10px] uppercase tracking-luxury transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  isActive ? "text-obsidian font-medium" : "text-obsidian/40 hover:text-obsidian"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-6">
          {user && user.role === "admin" && (
            <button onClick={() => navigate("/admin")} className="text-obsidian/40 hover:text-obsidian transition-colors duration-500" title="Store Manager" data-testid="admin-link-btn">
              <Crown size={16} strokeWidth={1} />
            </button>
          )}
          {user ? (
            <>
              <button
                onClick={() => navigate("/profile")}
                className="hidden md:block text-[10px] uppercase text-obsidian/40 hover:text-obsidian transition-colors duration-500 tracking-luxury"
                data-testid="header-profile-link"
              >
                {user.name?.split(" ")[0]}
              </button>
              <button onClick={doLogout} className="text-obsidian/40 hover:text-obsidian transition-colors duration-500" data-testid="logout-btn">
                <LogOut size={16} strokeWidth={1} />
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="text-[10px] uppercase text-obsidian hover:text-obsidian/50 transition-opacity duration-500 tracking-luxury"
              data-testid="header-login-link"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </motion.header>
  );
}
