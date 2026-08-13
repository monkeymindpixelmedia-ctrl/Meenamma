import React from "react";
import { NavLink } from "react-router-dom";
import { Landmark, Fish, ScrollText } from "lucide-react";

const items = [
  { to: "/home", label: "Temple", icon: ScrollText },
  { to: "/dashboard", label: "Kudam", icon: Landmark },
  { to: "/market", label: "Catch", icon: Fish },
];

export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-40 glass-henna border-t border-gold/30"
      style={{ borderBottom: "none" }}
      data-testid="bottom-nav"
    >
      <div className="flex justify-around py-3">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            data-testid={`nav-${label.toLowerCase()}`}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-4 transition-colors duration-300 ${
                isActive ? "text-gold-shimmer" : "text-sandalwood/40"
              }`
            }
          >
            <Icon size={20} strokeWidth={1.5} />
            <span className="text-[9px] uppercase" style={{ letterSpacing: "0.25em" }}>
              {label}
            </span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
