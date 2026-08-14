import React from "react";
import { NavLink } from "react-router-dom";
import { Home, Landmark, Fish, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";

export default function BottomNav() {
  const { user } = useAuth();
  const items = [
    { to: "/home", icon: Home },
    { to: "/dashboard", icon: Landmark },
    { to: "/market", icon: Fish },
    { to: user ? "/profile" : "/login", icon: User, key: "profile" },
  ];
  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="md:hidden fixed bottom-0 inset-x-0 z-40 glass-paper border-t border-obsidian/5"
      data-testid="bottom-nav"
    >
      <div className="flex justify-around py-2" style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}>
        {items.map(({ to, icon: Icon, key }) => (
          <NavLink
            key={key || to}
            to={to}
            data-testid={`nav-${(key || to).replace("/", "")}`}
            className={({ isActive }) =>
              `p-3 transition-colors duration-300 relative ${isActive ? "text-obsidian" : "text-obsidian/40"}`
            }
          >
            {({ isActive }) => (
              <motion.div
                whileTap={{ scale: 0.85 }}
                animate={{ scale: isActive ? 1.1 : 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Icon size={24} strokeWidth={isActive ? 1.5 : 1} />
                {isActive && (
                  <motion.div 
                    layoutId="bottom-nav-indicator"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-obsidian"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.div>
            )}
          </NavLink>
        ))}
      </div>
    </motion.nav>
  );
}
