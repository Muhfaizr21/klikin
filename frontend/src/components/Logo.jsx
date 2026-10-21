import React from 'react';

/**
 * Klikin Professional Brand Logo
 * Geometric monogram "K" seamlessly fused with an infinite link/click node.
 * Precision instrument style: crisp geometry, hairline contrast, subtle acid-lime punctuation.
 */
export function LogoMark({ className = "w-7 h-7", size = 28, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        {/* Subtle high-tech gradient on the geometric link stroke */}
        <linearGradient id="klikin-stem" x1="6" y1="4" x2="12" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" />
          <stop offset="1" stopColor="#94a3b8" />
        </linearGradient>
        <linearGradient id="klikin-link" x1="12" y1="6" x2="28" y2="26" gradientUnits="userSpaceOnUse">
          <stop stopColor="#e4f222" />
          <stop offset="0.7" stopColor="#ffffff" />
          <stop offset="1" stopColor="#cbd5e1" />
        </linearGradient>
      </defs>

      {/* Rounded Squircle Substrate Background */}
      <rect
        x="1"
        y="1"
        width="30"
        height="30"
        rx="8"
        fill="#0f1011"
        stroke="#23252a"
        strokeWidth="1.5"
      />

      {/* Vertical Anchor Stem of 'K' (Pill shape) */}
      <rect
        x="8"
        y="7.5"
        width="3.5"
        height="17"
        rx="1.75"
        fill="url(#klikin-stem)"
      />

      {/* Interlocking Link Node (Upper Arm of K) */}
      <path
        d="M12.5 16L19.2 8.8C19.8 8.1 20.9 8.1 21.6 8.7C22.2 9.4 22.2 10.4 21.5 11.1L16.2 16.5"
        stroke="url(#klikin-link)"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Lower Arm of K with Electric Click Node */}
      <path
        d="M14.5 15.5L20.8 22.8C21.4 23.5 22.5 23.6 23.2 23C23.9 22.3 23.9 21.2 23.2 20.5L18 14.5"
        stroke="#ffffff"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Electric Focus Spark Dot at the convergence center */}
      <circle cx="14" cy="16" r="1.5" fill="#e4f222" />
    </svg>
  );
}

export default function Logo({
  showText = true,
  size = 28,
  className = "",
  textClassName = "text-[18px]",
  ...props
}) {
  return (
    <div className={`inline-flex items-center gap-2.5 group select-none ${className}`} {...props}>
      <LogoMark
        size={size}
        className="transition-transform duration-200 group-hover:scale-105 shadow-sm shrink-0"
      />
      {showText && (
        <div className="flex items-baseline font-sans font-[510] tracking-[-0.03em] leading-none">
          <span className={`text-[var(--color-paper)] ${textClassName}`}>
            klikin
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-acid-lime)] ml-0.5" />
        </div>
      )}
    </div>
  );
}
