import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t-[0.5px] border-obsidian/10 bg-alabaster mt-auto">
      {/* About section — plaintext app purpose for policy reviewers */}
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 lg:px-16 pt-16 pb-10">
        <p className="font-serif text-obsidian text-2xl font-light tracking-[0.2em] mb-4">
          meenamma.org
        </p>
        <p className="text-obsidian/60 text-sm leading-relaxed max-w-2xl">
          meenamma.org is an online platform that lets Tamil Nadu households pre-book fresh
          seafood directly from Kasimedu harbour dawn catches, and save small daily amounts
          (₹1–₹10) in a Digital Kudam micro-savings pot. When a Kudam is full, users earn
          a 20% discount on their next seafood order. The app uses Google Sign-In solely
          to authenticate registered users of the meenamma.org service.
        </p>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 md:px-8 lg:px-16 pb-16 flex flex-col md:flex-row justify-between items-end gap-12 text-[10px] uppercase tracking-luxury text-obsidian/40 border-t-[0.5px] border-obsidian/10 pt-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap gap-x-8 gap-y-4">
            <Link to="/legal/privacy" className="hover:text-obsidian transition-colors duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">Privacy Policy</Link>
            <Link to="/legal/terms" className="hover:text-obsidian transition-colors duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">Terms &amp; Conditions</Link>
            <Link to="/legal/refund" className="hover:text-obsidian transition-colors duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">Refund Policy</Link>
            <Link to="/legal/shipping" className="hover:text-obsidian transition-colors duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">Shipping Policy</Link>
          </div>
        </div>
        <div className="text-left md:text-right">
          &copy; {currentYear} meenamma.org. <br className="hidden md:block" /> All rights reserved.
        </div>
      </div>
    </footer>
  );
}
