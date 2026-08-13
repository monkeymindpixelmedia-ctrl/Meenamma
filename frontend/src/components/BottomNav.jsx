import React from "react";
import { NavLink } from "react-router-dom";
import { Home, Landmark, Fish, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function BottomNav() {
  const { user } = useAuth();
  const items = [
    { to: "/home", icon: Home },
    { to: "/dashboard", icon: Landmark },
    { to: "/market", icon: Fish },
    { to: user ? "/profile" : "/login", icon: User, key: "profile" },
  ];
  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/90 backdrop-blur-md border-t border-gold/40"
      data-testid="bottom-nav"
    >
      <div className="flex justify-around py-2" style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}>
        {items.map(({ to, icon: Icon, key }) => (
          <NavLink
            key={key || to}
            to={to}
            data-testid={`nav-${(key || to).replace("/", "")}`}
            className={({ isActive }) =>
              `p-3 transition-colors duration-300 ${isActive ? "text-henna" : "text-gold"}`
            }
          >
            <Icon size={22} strokeWidth={1.5} />
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
