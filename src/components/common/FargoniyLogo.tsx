import React from "react";

interface FargoniyLogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl" | number;
  showText?: boolean;
  subtitle?: string;
  theme?: "light" | "dark" | "auto";
  className?: string;
}

export const FargoniyLogo: React.FC<FargoniyLogoProps> = ({
  size = "md",
  showText = true,
  subtitle = "maktabi",
  theme = "auto",
  className = "",
}) => {
  const pixelSizes = {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 48,
    xl: 60,
  };

  const px = typeof size === "number" ? size : pixelSizes[size] || 40;

  // Colors matching the official Farg'oniy Maktabi branding
  const blueColor = "#0B3E91"; // Rich Brand Royal Blue
  const orangeColor = "#F26522"; // Vibrant Brand Orange

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Tiniq Vektor Emblema (Crisp SVG Diamond Monogram) */}
      <svg
        width={px}
        height={px}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-sm transition-transform hover:scale-105 duration-200"
      >
        {/* Subtle background container shape for high definition */}
        <g transform="translate(60, 60) rotate(-45) translate(-60, -60)">
          {/* Blue 'F' Geometric Shape (Left & Top quadrants of rotated square) */}
          <path
            d="M16 16H68V34H36V50H62V66H36V104H16V16Z"
            fill={blueColor}
          />

          {/* Orange Accent Segment (Bottom & Right geometric block) */}
          <path
            d="M74 16H104V104H44V88H86V72H74V16Z"
            fill={orangeColor}
          />

          {/* Orange Center Diagonal Accent */}
          <path
            d="M44 50H70V66H44V50Z"
            fill={orangeColor}
          />
        </g>
      </svg>

      {/* Typography: FARG'ONIY maktabi */}
      {showText && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center">
            <span
              className={`font-black tracking-tight ${
                theme === "dark"
                  ? "text-white"
                  : theme === "light"
                  ? "text-[#0B3E91]"
                  : "text-[#0B3E91] dark:text-white"
              }`}
              style={{
                fontSize: px >= 48 ? "1.45rem" : px >= 36 ? "1.15rem" : "0.95rem",
                letterSpacing: "-0.02em",
                fontFamily: "system-ui, -apple-system, sans-serif",
              }}
            >
              FARG'ONIY
            </span>
          </div>

          <span
            className={`font-semibold tracking-wide lowercase ${
              theme === "dark"
                ? "text-sky-300"
                : theme === "light"
                ? "text-[#0B3E91]"
                : "text-[#0B3E91] dark:text-sky-300"
            }`}
            style={{
              fontSize: px >= 48 ? "0.85rem" : px >= 36 ? "0.72rem" : "0.62rem",
              marginTop: "1px",
              fontFamily: "system-ui, -apple-system, sans-serif",
            }}
          >
            {subtitle}
          </span>
        </div>
      )}
    </div>
  );
};

export default FargoniyLogo;
