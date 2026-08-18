import React, { memo } from "react";
import { motion } from "framer-motion";

export const SavingsMandala = memo(({ progress, size = 288, dark = false }) => {
  const pct = Math.min(Math.max(progress, 0), 1);
  const goldColor = dark ? "#FFD700" : "#D4AF37";
  const textColor = dark ? "#F5F2EB" : "#1A1412";

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
      data-testid="savings-mandala"
    >
      <motion.svg
        viewBox="0 0 300 300"
        animate={{ rotate: 360 }}
        transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 w-full h-full"
        style={{ willChange: "transform" }}
      >
        {[...Array(12)].map((_, i) => (
          <path
            key={i}
            transform={`rotate(${i * 30}, 150, 150)`}
            d="M 150 10 Q 165 25 150 40 Q 135 25 150 10"
            fill="none"
            stroke={goldColor}
            strokeWidth="0.8"
            opacity={dark ? "0.85" : "0.5"}
          />
        ))}
        {[...Array(24)].map((_, i) => (
          <circle
            key={`d${i}`}
            cx={150 + 138 * Math.cos((i * 15 * Math.PI) / 180)}
            cy={150 + 138 * Math.sin((i * 15 * Math.PI) / 180)}
            r="1.2"
            fill={goldColor}
            opacity={dark ? "0.7" : "0.4"}
          />
        ))}
      </motion.svg>

      <div
        className={`rounded-full border border-gold/40 overflow-hidden relative backdrop-blur-md ${
          dark ? "bg-black/60 shadow-[0_0_30px_rgba(255,215,0,0.15)]" : "bg-white/40"
        }`}
        style={{ width: size * 0.78, height: size * 0.78 }}
      >
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: `${pct * 100}%` }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          className="absolute bottom-0 w-full"
          style={{
            background: dark
              ? "linear-gradient(to top, rgba(255,215,0,0.85), rgba(245,158,11,0.25))"
              : "linear-gradient(to top, rgba(212,175,55,0.8), rgba(212,175,55,0.1))",
          }}
        >
          <motion.div
            className="absolute -top-2 left-0 w-[200%] h-4"
            animate={{ x: ["-50%", "0%"] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            style={{
              willChange: "transform",
              background:
                "radial-gradient(ellipse 30px 4px at 25% 50%, rgba(255,215,0,0.8) 40%, transparent 70%), radial-gradient(ellipse 30px 4px at 75% 50%, rgba(255,215,0,0.8) 40%, transparent 70%)",
              backgroundSize: "50% 100%",
            }}
          />
        </motion.div>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="num-lg font-bold"
            style={{
              fontSize: size * 0.155,
              color: textColor,
              textShadow: dark ? "0 0 12px rgba(255,215,0,0.6)" : "0 1px 6px rgba(255,255,255,0.7)",
            }}
            data-testid="mandala-progress-pct"
          >
            {Math.round(pct * 100)}%
          </span>
          <span
            className="uppercase font-semibold tracking-[0.35em]"
            style={{
              color: dark ? "#FFD700" : "#997A20",
              fontSize: Math.max(size * 0.032, 8),
            }}
          >
            Kudam Fill
          </span>
        </div>
      </div>
    </div>
  );
});
