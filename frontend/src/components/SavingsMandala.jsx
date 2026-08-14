import React from "react";
import { motion } from "framer-motion";

export const SavingsMandala = ({ progress, size = 288 }) => {
  const pct = Math.min(Math.max(progress, 0), 1);
  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
      data-testid="savings-mandala"
    >
      <motion.svg
        viewBox="0 0 300 300"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 w-full h-full"
        style={{ willChange: "transform" }}
      >
        {[...Array(12)].map((_, i) => (
          <path
            key={i}
            transform={`rotate(${i * 30}, 150, 150)`}
            d="M 150 10 Q 165 25 150 40 Q 135 25 150 10"
            fill="none"
            stroke="#D4AF37"
            strokeWidth="0.5"
            opacity="0.5"
          />
        ))}
        {[...Array(24)].map((_, i) => (
          <circle
            key={`d${i}`}
            cx={150 + 138 * Math.cos((i * 15 * Math.PI) / 180)}
            cy={150 + 138 * Math.sin((i * 15 * Math.PI) / 180)}
            r="0.8"
            fill="#D4AF37"
            opacity="0.4"
          />
        ))}
      </motion.svg>

      <div
        className="rounded-full border border-gold/20 overflow-hidden relative bg-transparent backdrop-blur-sm"
        style={{ width: size * 0.78, height: size * 0.78 }}
      >
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: `${pct * 100}%` }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          className="absolute bottom-0 w-full"
          style={{
            background: "linear-gradient(to top, rgba(212,175,55,0.8), rgba(212,175,55,0.1))",
          }}
        >
          <motion.div
            className="absolute -top-2 left-0 w-[200%] h-4"
            animate={{ x: ["-50%", "0%"] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            style={{
              willChange: "transform",
              background:
                "radial-gradient(ellipse 30px 4px at 25% 50%, rgba(212,175,55,0.6) 40%, transparent 70%), radial-gradient(ellipse 30px 4px at 75% 50%, rgba(212,175,55,0.6) 40%, transparent 70%)",
              backgroundSize: "50% 100%",
            }}
          />
        </motion.div>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="num-lg text-obsidian"
            style={{ fontSize: size * 0.155, textShadow: "0 1px 6px rgba(255,255,255,0.7)" }}
            data-testid="mandala-progress-pct"
          >
            {Math.round(pct * 100)}%
          </span>
          <span
            className="uppercase text-gold-dim"
            style={{ fontSize: Math.max(size * 0.032, 8), letterSpacing: "0.35em" }}
          >
            Kudam Fill
          </span>
        </div>
      </div>
    </div>
  );
};
