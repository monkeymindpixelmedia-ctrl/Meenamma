import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const petals = [...Array(12)];

export default function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => navigate("/home"), 4200);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div
      className="min-h-screen bg-henna-deep silk-texture flex flex-col items-center justify-center cursor-pointer overflow-hidden"
      onClick={() => navigate("/home")}
      data-testid="splash-screen"
    >
      <motion.svg
        viewBox="0 0 300 300"
        className="w-56 h-56"
        initial="hidden"
        animate="visible"
      >
        <motion.circle
          cx="150"
          cy="150"
          r="120"
          fill="none"
          stroke="#C5A059"
          strokeWidth="1"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.8 }}
          transition={{ duration: 2, ease: "easeInOut" }}
        />
        <motion.circle
          cx="150"
          cy="150"
          r="96"
          fill="none"
          stroke="#C5A059"
          strokeWidth="0.5"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.4 }}
          transition={{ duration: 2.4, delay: 0.3, ease: "easeInOut" }}
        />
        <motion.g
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          style={{ originX: "150px", originY: "150px" }}
        >
          {petals.map((_, i) => (
            <motion.path
              key={i}
              transform={`rotate(${i * 30}, 150, 150)`}
              d="M 150 30 Q 168 50 150 70 Q 132 50 150 30"
              fill="none"
              stroke="#C5A059"
              strokeWidth="1.2"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.7 }}
              transition={{ duration: 1.2, delay: 0.8 + i * 0.08, ease: "easeOut" }}
            />
          ))}
        </motion.g>
        <motion.text
          x="150"
          y="162"
          textAnchor="middle"
          fill="#E5C17A"
          fontSize="34"
          className="tamil"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 1.6 }}
        >
          மீ
        </motion.text>
      </motion.svg>

      <motion.h1
        className="font-serif text-gold text-4xl mt-8 font-medium"
        style={{ letterSpacing: "0.35em", textIndent: "0.35em" }}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, delay: 2.1, ease: [0.22, 1, 0.36, 1] }}
        data-testid="splash-title"
      >
        MEENAMMA
      </motion.h1>

      <motion.div
        className="h-px bg-gold/60 mt-6"
        initial={{ width: 0 }}
        animate={{ width: 140 }}
        transition={{ duration: 1, delay: 2.7, ease: "easeOut" }}
      />

      <motion.p
        className="text-sandalwood/60 text-[10px] uppercase mt-6"
        style={{ letterSpacing: "0.5em", textIndent: "0.5em" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.4, delay: 3 }}
      >
        Sea · Savings · Ceremony
      </motion.p>
    </div>
  );
}
