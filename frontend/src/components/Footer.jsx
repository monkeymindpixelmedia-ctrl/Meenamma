import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full py-16 border-t-[0.5px] border-obsidian/10 bg-alabaster mt-auto">
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 lg:px-16 flex flex-col md:flex-row justify-between items-end gap-12 text-[10px] uppercase tracking-luxury text-obsidian/40">
        <div className="flex flex-col gap-6">
          <Link to="/home" className="font-serif text-obsidian text-3xl font-light tracking-[0.25em] mb-4 hover:opacity-60 transition-opacity duration-500">
            MEENAMMA
          </Link>
          <div className="flex flex-wrap gap-x-8 gap-y-4">
            <Link to="/legal/privacy" className="hover:text-obsidian transition-colors duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">Privacy Policy</Link>
            <Link to="/legal/terms" className="hover:text-obsidian transition-colors duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">Terms & Conditions</Link>
            <Link to="/legal/refund" className="hover:text-obsidian transition-colors duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">Refund Policy</Link>
            <Link to="/legal/shipping" className="hover:text-obsidian transition-colors duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">Shipping Policy</Link>
          </div>
        </div>
        <div className="text-left md:text-right">
          &copy; {currentYear} MEENAMMA. <br className="hidden md:block" /> All rights reserved.
        </div>
      </div>
    </footer>
  );
}
