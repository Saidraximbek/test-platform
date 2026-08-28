import React from "react";
import { Coins } from "lucide-react";
import { formatCoins } from "../../utils";

interface CoinBadgeProps {
  amount: number;
  size?: "sm" | "md" | "lg";
  className?: string;
  showPlus?: boolean;
}

export const CoinBadge: React.FC<CoinBadgeProps> = ({
  amount,
  size = "md",
  className = "",
  showPlus = false,
}) => {
  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs gap-1",
    md: "px-2.5 py-1 text-sm gap-1.5",
    lg: "px-4 py-2 text-base gap-2 font-bold",
  };

  const iconSizes = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full bg-gradient-to-r from-amber-500/10 via-amber-500/20 to-yellow-500/10 border border-amber-400/40 text-amber-600 dark:text-amber-400 shadow-sm ${sizeClasses[size]} ${className}`}
    >
      <Coins className={`${iconSizes[size]} text-amber-500 fill-amber-500 animate-pulse`} />
      <span>
        {showPlus && amount > 0 ? `+${formatCoins(amount)}` : formatCoins(amount)} Tillo
      </span>
    </span>
  );
};
