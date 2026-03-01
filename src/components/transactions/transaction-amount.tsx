import * as React from "react";
import { formatCurrency } from "@/lib/format";
import { COLORS, TYPOGRAPHY } from "@/lib/theme/tokens";
import { cn } from "@/lib/utils";

interface TransactionAmountProps extends React.HTMLAttributes<HTMLSpanElement> {
  amount: number;
  type: string; // INCOME, EXPENSE, TRANSFER
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
}

const TransactionAmount = React.forwardRef<HTMLSpanElement, TransactionAmountProps>(
  ({ className, amount, type, size = 'md', animated = true, ...props }, ref) => {
    const [displayAmount, setDisplayAmount] = React.useState(amount);
    const [isAnimating, setIsAnimating] = React.useState(false);

    React.useEffect(() => {
      if (animated && amount !== displayAmount) {
        setIsAnimating(true);
        setDisplayAmount(amount);
        
        // Reset animation after transition
        const timer = setTimeout(() => {
          setIsAnimating(false);
        }, 300);
        
        return () => clearTimeout(timer);
      }
    }, [amount, displayAmount, animated]);

    const sizeClasses = {
      sm: TYPOGRAPHY.AMOUNT_SMALL,
      md: TYPOGRAPHY.AMOUNT,
      lg: TYPOGRAPHY.AMOUNT_LARGE,
      xl: TYPOGRAPHY.AMOUNT_XL,
    };

    // Determine sign and color based on TransactionType
    const getDisplayInfo = () => {
      switch (type.toUpperCase()) {
        case 'INCOME':
          return {
            sign: '+',
            color: COLORS.CURRENCY.INCOME,
            displayValue: Math.abs(amount)
          };
        case 'EXPENSE':
          return {
            sign: '-',
            color: COLORS.CURRENCY.EXPENSE,
            displayValue: Math.abs(amount)
          };
        case 'TRANSFER':
          return {
            sign: '→', // or '' for no sign
            color: COLORS.CURRENCY.TRANSFER,
            displayValue: Math.abs(amount)
          };
        default:
          return {
            sign: '',
            color: COLORS.CURRENCY.NEUTRAL,
            displayValue: amount
          };
      }
    };

    const { sign, color, displayValue } = getDisplayInfo();
    const formattedAmount = formatCurrency(displayValue);

    return (
      <span
        ref={ref}
        className={cn(
          "font-variant-numeric tabular-nums font-semibold",
          sizeClasses[size],
          color,
          animated && "transition-all duration-300 ease-in-out",
          isAnimating && "opacity-75 scale-95",
          className
        )}
        {...props}
      >
        {sign}{formattedAmount}
      </span>
    );
  }
);

TransactionAmount.displayName = "TransactionAmount";

export { TransactionAmount };
