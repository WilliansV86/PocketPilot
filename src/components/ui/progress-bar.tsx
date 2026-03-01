import * as React from "react";
import { cn } from "@/lib/utils";
import { getProgressConfig, ProgressConfig, FINANCIAL_ANIMATIONS } from "@/lib/financial-colors";

interface ProgressBarProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  value: number;
  max?: number;
  showPercentage?: boolean;
  animated?: boolean;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  ({ className, value, max = 100, showPercentage = false, animated = true, color, size = 'md', variant, ...props }, ref) => {
    const config = getProgressConfig({ value, max, showPercentage, animated, color, size });
    
    const variantColors = {
      default: 'bg-muted',
      success: 'bg-green-500',
      warning: 'bg-amber-500',
      danger: 'bg-red-500',
    };

    const progressColor = variant ? variantColors[variant] : config.color;

    return (
      <div
        ref={ref}
        className={cn(
          "relative w-full bg-muted rounded-full overflow-hidden",
          config.className,
          className
        )}
        {...props}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            progressColor,
            animated && FINANCIAL_ANIMATIONS.PROGRESS_SMOOTH
          )}
          style={{ width: `${config.percentage}%` }}
        />
        {showPercentage && (
          <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-muted-foreground">
            {Math.round(config.percentage)}%
          </span>
        )}
      </div>
    );
  }
);

ProgressBar.displayName = "ProgressBar";

export { ProgressBar };
