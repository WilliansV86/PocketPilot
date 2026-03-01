import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { getStatusBadgeVariant, FINANCIAL_ANIMATIONS } from "@/lib/financial-colors";
import { cn } from "@/lib/utils";

interface StatusBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  status: string;
  type?: 'debt' | 'goal' | 'category';
  animated?: boolean;
  pulse?: boolean;
}

const StatusBadge = React.forwardRef<HTMLDivElement, StatusBadgeProps>(
  ({ className, status, type = 'debt', animated = false, pulse = false, ...props }, ref) => {
    const { variant, className: badgeClassName } = getStatusBadgeVariant(status, type);
    
    const animationClass = animated 
      ? (pulse ? FINANCIAL_ANIMATIONS.BADGE_PULSE : FINANCIAL_ANIMATIONS.BADGE_BOUNCE)
      : '';

    return (
      <Badge
        ref={ref}
        variant={variant}
        className={cn(
          badgeClassName,
          animationClass,
          "font-medium",
          className
        )}
        {...props}
      >
        {status}
      </Badge>
    );
  }
);

StatusBadge.displayName = "StatusBadge";

export { StatusBadge };
