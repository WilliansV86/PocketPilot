import * as React from "react";
import { formatCurrency } from "@/lib/format";
import { getAmountColorClass, FINANCIAL_ANIMATIONS } from "@/lib/financial-colors";
import { cn } from "@/lib/utils";

interface AnimatedBalanceProps extends React.HTMLAttributes<HTMLSpanElement> {
  amount: number;
  previousAmount?: number;
  showSign?: boolean;
  animated?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const AnimatedBalance = React.forwardRef<HTMLSpanElement, AnimatedBalanceProps>(
  ({ className, amount, previousAmount, showSign = false, animated = true, size = 'md', ...props }, ref) => {
  const [displayAmount, setDisplayAmount] = React.useState(amount);
  const [isAnimating, setIsAnimating] = React.useState(false);

  React.useEffect(() => {
    if (animated && previousAmount !== undefined && previousAmount !== amount) {
      setIsAnimating(true);
      
      // Animate the number change
      const duration = 300;
      const startTime = Date.now();
      const startValue = previousAmount;
      const endValue = amount;
      
      const animate = () => {
        const now = Date.now();
        const progress = Math.min((now - startTime) / duration, 1);
        
        // Easing function for smooth animation
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const currentValue = startValue + (endValue - startValue) * easeProgress;
        
        setDisplayAmount(currentValue);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setDisplayAmount(endValue);
          setIsAnimating(false);
        }
      };
      
      requestAnimationFrame(animate);
    } else {
      setDisplayAmount(amount);
    }
  }, [amount, previousAmount, animated]);

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  };

  const colorClass = getAmountColorClass(displayAmount);
  const sign = showSign && amount > 0 ? '+' : '';
  const formattedAmount = formatCurrency(Math.abs(displayAmount));

  return (
    <span
      ref={ref}
      className={cn(
        "font-mono font-semibold",
        colorClass,
        sizeClasses[size],
        animated && FINANCIAL_ANIMATIONS.BALANCE_TRANSITION,
        isAnimating && FINANCIAL_ANIMATIONS.NUMBER_FADE,
        className
      )}
      {...props}
    >
      {sign}{formattedAmount}
    </span>
  );
});

AnimatedBalance.displayName = "AnimatedBalance";

export { AnimatedBalance };
