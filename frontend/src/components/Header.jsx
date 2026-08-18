import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Crown, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

const links = [
  { to: "/home", label: "Home" },
  { to: "/dashboard", label: "Daily Kudam" },
  { to: "/market", label: "Fresh Catch" },
  { to: "/referral", label: "Refer" },
];

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const doLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate("/home");
  };

  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="glass-paper sticky top-0 z-40 transition-all duration-500 border-b border-obsidian/10" data-testid="top-header"
    >
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 lg:px-16 h-20 flex items-center justify-between">
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => { setMenuOpen(false); navigate("/home"); }} 
          className="flex items-baseline gap-2 group" data-testid="header-logo"
        >
          <span className="font-serif text-obsidian text-2xl font-light tracking-[0.25em] group-hover:opacity-70 transition-opacity duration-300">
            MEENAMMA
          </span>
        </motion.button>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-12">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              data-testid={`headernav-${l.label.toLowerCase().replace(" ", "-")}`}
              className={({ isActive }) =>
                `text-[10px] uppercase tracking-luxury transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  isActive ? "text-obsidian font-medium underline underline-offset-8 decoration-gold" : "text-obsidian/50 hover:text-obsidian"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        {/* Right Actions & Hamburger Toggle */}
        <div className="flex items-center gap-4 md:gap-6">
          {user && user.role === "admin" && (
            <button onClick={() => navigate("/admin")} className="text-obsidian/60 hover:text-obsidian transition-colors duration-300 p-2 active:scale-95" title="Store Manager" data-testid="admin-link-btn">
              <Crown size={18} strokeWidth={1.5} />
            </button>
          )}
          {user ? (
            <>
              <button
                onClick={() => navigate("/profile")}
                className="hidden md:block text-[10px] uppercase text-obsidian/60 hover:text-obsidian transition-colors duration-300 tracking-luxury active:scale-95"
                data-testid="header-profile-link"
              >
                {user.name?.split(" ")[0]}
              </button>
              <button onClick={doLogout} className="text-obsidian/60 hover:text-obsidian transition-colors duration-300 p-2 active:scale-95" data-testid="logout-btn">
                <LogOut size={18} strokeWidth={1.5} />
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="text-[10px] uppercase text-obsidian hover:text-obsidian/60 transition-opacity duration-300 tracking-luxury active:scale-95"
              data-testid="header-login-link"
            >
              Sign In
            </button>
          )}

          {/* Hamburger Menu Toggle (Mobile) */}
          <button
            onClick={() => setMenuOpen((open) => !open)}
            className="md:hidden p-2 text-obsidian/80 hover:text-obsidian transition-transform active:scale-95 rounded-md focus:outline-none"
            aria-label="Toggle Navigation Menu"
            data-testid="hamburger-menu-btn"
          >
            {menuOpen ? <X size={22} strokeWidth={1.5} /> : <Menu size={22} strokeWidth={1.5} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            className="md:hidden border-t border-obsidian/10 bg-alabaster/95 backdrop-blur-xl overflow-hidden"
            data-testid="mobile-nav-drawer"
          >
            <div className="px-6 py-6 space-y-4 flex flex-col">
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  onClick={() => setMenuOpen(false)}
                  data-testid={`mobile-headernav-${l.label.toLowerCase().replace(" ", "-")}`}
                  className={({ isActive }) =>
                    `text-xs uppercase tracking-luxury py-2 transition-colors ${
                      isActive ? "text-obsidian font-semibold" : "text-obsidian/60 hover:text-obsidian"
                    }`
                  }
                >
                  {l.label}
                </NavLink>
              ))}

              {user && (
                <button
                  onClick={() => { setMenuOpen(false); navigate("/profile"); }}
                  className="text-left text-xs uppercase tracking-luxury text-obsidian/60 hover:text-obsidian py-2 border-t border-obsidian/10 pt-4"
                >
                  Profile ({user.name})
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
