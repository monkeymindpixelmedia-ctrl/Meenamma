import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full py-8 border-t border-henna/10 bg-sandalwood-paper mt-auto">
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 lg:px-16 flex flex-col md:flex-row justify-between items-center gap-6 text-[11px] uppercase tracking-widest text-henna/60">
        <div className="flex flex-wrap justify-center gap-4 md:gap-8">
          <Link to="/legal/privacy" className="hover:text-henna transition-colors">Privacy Policy</Link>
          <Link to="/legal/terms" className="hover:text-henna transition-colors">Terms & Conditions</Link>
          <Link to="/legal/refund" className="hover:text-henna transition-colors">Refund Policy</Link>
          <Link to="/legal/shipping" className="hover:text-henna transition-colors">Shipping Policy</Link>
        </div>
        <div className="text-center md:text-right">
          &copy; {currentYear} MEENAMMA. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
