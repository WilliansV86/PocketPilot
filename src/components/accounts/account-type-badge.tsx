"use client";

import { 
  CreditCard, 
  PiggyBank, 
  TrendingUp, 
  Banknote, 
  ArrowLeftRight, 
  Home, 
  MoreHorizontal 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getAccountTypeConfig } from "@/lib/account-colors";

interface AccountTypeBadgeProps {
  type: string;
  showIcon?: boolean;
  showDescription?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "outline" | "filled";
}

const iconMap = {
  "credit-card": CreditCard,
  "piggy-bank": PiggyBank,
  "trending-up": TrendingUp,
  "banknote": Banknote,
  "arrow-left-right": ArrowLeftRight,
  "home": Home,
  "more-horizontal": MoreHorizontal,
};

export function AccountTypeBadge({ 
  type, 
  showIcon = true, 
  showDescription = false,
  size = "md",
  variant = "default"
}: AccountTypeBadgeProps) {
  const config = getAccountTypeConfig(type);
  const IconComponent = iconMap[config.icon as keyof typeof iconMap] || MoreHorizontal;

  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base"
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4", 
    lg: "h-5 w-5"
  };

  const variantClasses = {
    default: cn(
      config.bgColor,
      config.color,
      config.borderColor,
      "border"
    ),
    outline: cn(
      "bg-transparent",
      config.color,
      config.borderColor,
      "border"
    ),
    filled: cn(
      config.color,
      "bg-opacity-10",
      "border-transparent"
    )
  };

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border font-medium",
          sizeClasses[size],
          variantClasses[variant]
        )}
      >
        {showIcon && (
          <IconComponent className={iconSizes[size]} />
        )}
        <span className="capitalize">
          {type.replace('_', ' ').toLowerCase()}
        </span>
      </div>
      {showDescription && (
        <span className="text-xs text-muted-foreground">
          {config.description}
        </span>
      )}
    </div>
  );
}
